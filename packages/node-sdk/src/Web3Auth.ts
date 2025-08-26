import { LEGACY_NETWORKS_ROUTE_MAP, TORUS_LEGACY_NETWORK_TYPE, TORUS_SAPPHIRE_NETWORK_TYPE } from "@toruslabs/constants";
import { NodeDetailManager } from "@toruslabs/fetch-node-details";
import { keccak256, Torus, VerifierParams } from "@toruslabs/torus.js";
import { AUTH_CONNECTION, getED25519Key, serializeError, subkey, WEB3AUTH_NETWORK } from "@web3auth/auth";
import {
  ANALYTICS_EVENTS,
  CHAIN_NAMESPACES,
  type ChainNamespaceType,
  type CustomChainConfig,
  fetchProjectConfig,
  getCaipChainId,
  getErrorAnalyticsProperties,
  getHostname,
  isHexStrict,
  log,
  type ProjectConfig,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/no-modal";
import { JsonRpcProvider, Wallet } from "ethers";
import type { TransactionSigner } from "@solana/signers";
import { createSignerFromKeyPair } from "@solana/signers";
import { createKeyPairFromBytes } from "@solana/keys";

import { SDK_TYPE, SDK_VERSION, SegmentAnalytics } from "./analytics";
import { IWeb3Auth, LoginParams, Web3AuthOptions } from "./interface";

export class Web3Auth implements IWeb3Auth {
  public connected: boolean = false;

  readonly options: Web3AuthOptions;

  private torusUtils: Torus | null = null;

  private nodeDetailManager: NodeDetailManager | null = null;

  private analytics: SegmentAnalytics | null = null;

  constructor(options: Web3AuthOptions) {
    this.validateConstructorOptions(options);
    const network = options.web3AuthNetwork || WEB3AUTH_NETWORK.SAPPHIRE_MAINNET;
    this.options = {
      ...options,
      web3AuthNetwork: network,
      useDKG: options.useDKG !== undefined ? options.useDKG : this.getUseDKGDefaultValue(network),
      checkCommitment: typeof options.checkCommitment === "boolean" ? options.checkCommitment : true,
    };
    this.analytics = new SegmentAnalytics();
  }

  get currentChainId(): string {
    return this.options.defaultChainId || this.options.chains[0].chainId;
  }

  get currentChainNamespace(): ChainNamespaceType {
    return this.options.chains?.find((chain) => chain.chainId === this.currentChainId)?.chainNamespace || CHAIN_NAMESPACES.EIP155;
  }

  get currentChain(): CustomChainConfig {
    return this.options.chains?.find((chain) => chain.chainId === this.currentChainId) || this.options.chains[0];
  }

  async init(): Promise<void> {
    const { web3AuthNetwork: network, clientId } = this.options;

    const startTime = Date.now();
    this.analytics.init();
    this.analytics.identify(this.options.clientId, {
      web3auth_client_id: this.options.clientId,
      web3auth_network: this.options.web3AuthNetwork,
    });
    this.analytics.setGlobalProperties({
      dapp_url: window.location.origin,
      sdk_name: SDK_TYPE,
      sdk_version: SDK_VERSION,
      // Required for organization analytics
      web3auth_client_id: this.options.clientId,
      web3auth_network: this.options.web3AuthNetwork,
    });

    // get project config
    let projectConfig: ProjectConfig;
    try {
      projectConfig = await fetchProjectConfig({
        clientId,
        web3AuthNetwork: network,
      });
    } catch (e) {
      const error = await serializeError(e);
      log.error("Failed to fetch project configurations", error);
      throw WalletInitializationError.notReady("failed to fetch project configurations", error);
    }

    this.initChainsConfig(projectConfig);
    this.analytics.setGlobalProperties({ team_id: projectConfig.teamId });

    this.torusUtils = new Torus({
      enableOneKey: true,
      network,
      clientId,
    });

    Torus.enableLogging(this.options.enableLogging || false);

    this.nodeDetailManager = new NodeDetailManager({ network, enableLogging: this.options.enableLogging || false });

    this.analytics.track(ANALYTICS_EVENTS.SDK_INITIALIZATION_COMPLETED, {
      ...this.getInitializationTrackData(),
      duration: Date.now() - startTime,
    });
  }

  async connect(loginParams: LoginParams): Promise<Wallet | TransactionSigner|  null> {
    if (!this.torusUtils || !this.nodeDetailManager) throw WalletInitializationError.notReady("Please call init first.");

    if (!loginParams.idToken || !loginParams.userId || !loginParams.authConnectionId)
      throw WalletLoginError.fromCode(5000, "idToken, userId, and authConnectionId are required");

    const startTime = Date.now();
    const eventData = {
      auth_connection: AUTH_CONNECTION.CUSTOM,
      auth_connection_id: loginParams.authConnectionId,
      group_auth_connection_id: loginParams.groupedAuthConnectionId,
      is_default_auth_connection: false,
    };

    try {
      // track connection started event
      this.analytics.track(ANALYTICS_EVENTS.CONNECTION_STARTED, eventData);

      // get torus key
      const retrieveSharesResponse = await this.getTorusKey(loginParams);

      if (retrieveSharesResponse.metadata.upgraded) {
        throw WalletLoginError.mfaEnabled();
      }

      const { finalKeyData, oAuthKeyData } = retrieveSharesResponse;
      const privKey = finalKeyData.privKey || oAuthKeyData.privKey;
      if (!privKey) throw WalletLoginError.fromCode(5000, "Unable to get private key from torus nodes");

      let finalPrivKey = privKey.padStart(64, "0");
      if (this.options.usePnPKey) {
        const pnpPrivKey = subkey(finalPrivKey, Buffer.from(this.options.clientId, "base64"));
        finalPrivKey = pnpPrivKey.padStart(64, "0");
      }

      const wallet = await this.getWallet(finalPrivKey);
      this.analytics.track(ANALYTICS_EVENTS.CONNECTION_COMPLETED, {
        ...eventData,
        ...this.getInitializationTrackData(),
        duration: Date.now() - startTime,
      });
      return wallet;
    } catch (err) {
      const error = await serializeError(err);
      this.analytics.track(ANALYTICS_EVENTS.CONNECTION_FAILED, {
        ...eventData,
        ...getErrorAnalyticsProperties(err),
        duration: Date.now() - startTime,
      });
      log.error("Failed to connect", error);
      throw error;
    }
  }

  private getUseDKGDefaultValue(network: TORUS_LEGACY_NETWORK_TYPE | TORUS_SAPPHIRE_NETWORK_TYPE): boolean {
    // only dkg flow is supported for legacy networks
    if (LEGACY_NETWORKS_ROUTE_MAP[network as TORUS_LEGACY_NETWORK_TYPE]) {
      return true;
    }
    // for rest networks both flows are supported, but default is non dkg.
    return false;
  }

  private validateConstructorOptions(options: Web3AuthOptions): void {
    // non dkg flow is not supported in legacy networks
    if (options.useDKG === false && LEGACY_NETWORKS_ROUTE_MAP[options.web3AuthNetwork as TORUS_LEGACY_NETWORK_TYPE]) {
      throw WalletInitializationError.invalidParams("useDKG cannot be false for legacy networks");
    }
  }

  private initChainsConfig(projectConfig: ProjectConfig) {
    // merge chains from project config with core options, core options chains will take precedence over project config chains
    const chainMap = new Map<string, CustomChainConfig>();
    const allChains = [...(projectConfig.chains || []), ...(this.options.chains || [])];
    for (const chain of allChains) {
      const existingChain = chainMap.get(chain.chainId);
      if (!existingChain) chainMap.set(chain.chainId, chain);
      else chainMap.set(chain.chainId, { ...existingChain, ...chain });
    }
    this.options.chains = Array.from(chainMap.values());

    // validate chains and namespaces
    if (this.options.chains.length === 0) {
      log.error("chain info not found. Please configure chains on dashboard at https://dashboard.web3auth.io");
      throw WalletInitializationError.invalidParams("Please configure chains on dashboard at https://dashboard.web3auth.io");
    }
    const validChainNamespaces = new Set(Object.values(CHAIN_NAMESPACES));
    for (const chain of this.options.chains) {
      if (!chain.chainNamespace || !validChainNamespaces.has(chain.chainNamespace)) {
        log.error(`Please provide a valid chainNamespace in chains for chain ${chain.chainId}`);
        throw WalletInitializationError.invalidParams(`Please provide a valid chainNamespace in chains for chain ${chain.chainId}`);
      }
      if (chain.chainNamespace !== CHAIN_NAMESPACES.OTHER && !isHexStrict(chain.chainId)) {
        log.error(`Please provide a valid chainId in chains for chain ${chain.chainId}`);
        throw WalletInitializationError.invalidParams(`Please provide a valid chainId as hex string in chains for chain ${chain.chainId}`);
      }
      if (chain.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
        try {
          new URL(chain.rpcTarget);
        } catch (error) {
          // TODO: add support for chain.wsTarget
          log.error(`Please provide a valid rpcTarget in chains for chain ${chain.chainId}`, error);
          throw WalletInitializationError.invalidParams(`Please provide a valid rpcTarget in chains for chain ${chain.chainId}`);
        }
      }
    }
  }

  private async getTorusKey(params: LoginParams) {
    const { authConnectionId, userId, idToken, groupedAuthConnectionId } = params;
    const verifier = groupedAuthConnectionId || authConnectionId;
    const verifierId = userId;
    const verifierParams: VerifierParams = { verifier_id: userId };
    let aggregateIdToken = "";
    const finalIdToken = idToken;

    if (groupedAuthConnectionId) {
      verifierParams["verify_params"] = [{ verifier_id: userId, idtoken: finalIdToken }];
      verifierParams["sub_verifier_ids"] = [authConnectionId];
      aggregateIdToken = keccak256(Buffer.from(finalIdToken, "utf8")).slice(2);
    }

    const { torusNodeEndpoints, torusIndexes, torusNodePub } = await this.nodeDetailManager.getNodeDetails({ verifier, verifierId });

    return this.torusUtils.retrieveShares({
      endpoints: torusNodeEndpoints,
      indexes: torusIndexes,
      verifier,
      verifierParams,
      idToken: aggregateIdToken || finalIdToken,
      nodePubkeys: torusNodePub,
      useDkg: this.options.useDKG,
      checkCommitment: this.options.checkCommitment,
    });
  }

  private async getWallet(privateKey: string): Promise<Wallet | TransactionSigner> {
    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const ed25519Key = getED25519Key(privateKey).sk;
      const keyPair = await createKeyPairFromBytes(new Uint8Array(ed25519Key));
      const signer = await createSignerFromKeyPair(keyPair);
      this.connected = true;
      return signer;
    }

    // create ethers wallet for Evm chains.
    const ethersWallet = new Wallet(privateKey);
    const provider = new JsonRpcProvider(this.currentChain.rpcTarget);
    const signer = ethersWallet.connect(provider);
    this.connected = true;
    return signer;
  }

  private getInitializationTrackData() {
    try {
      const defaultChain = this.options.chains?.find((chain) => chain.chainId === this.options.defaultChainId);
      const rpcHostnames = Array.from(new Set(this.options.chains?.map((chain) => getHostname(chain.rpcTarget)))).filter(Boolean);
      return {
        chain_ids: this.options.chains?.map((chain) => getCaipChainId(chain)),
        chain_names: this.options.chains?.map((chain) => chain.displayName),
        chain_rpc_targets: rpcHostnames,
        default_chain_id: defaultChain ? getCaipChainId(defaultChain) : undefined,
        default_chain_name: defaultChain?.displayName,
        logging_enabled: this.options.enableLogging,
        sfa_key_enabled: !this.options.usePnPKey,
        use_dkg: this.options.useDKG,
        check_commitment: this.options.checkCommitment,
      };
    } catch (error) {
      log.error("Failed to get initialization track data", error);
      return {};
    }
  }
}
