/* eslint-disable security/detect-object-injection */
import NodeDetailManager, { TORUS_NETWORK, TORUS_NETWORK_TYPE } from "@toruslabs/fetch-node-details";
import { subkey } from "@toruslabs/openlogin-subkey";
import type Torus from "@toruslabs/torus.js";
import { CHAIN_NAMESPACES, ChainNamespaceType, CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";
import { CommonPrivateKeyProvider, IBaseProvider } from "@web3auth/base-provider";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import fetch from "node-fetch";
import { keccak256 } from "web3-utils";

import { CONTRACT_MAP, SIGNER_MAP } from "./constants";
import { AggregateVerifierParams, InitParams, IWeb3Auth, LoginParams, Web3AuthOptions } from "./interface";

// eslint-disable-next-line n/no-unsupported-features/es-builtins
(globalThis as any).fetch = fetch;

type PrivateKeyProvider = IBaseProvider<string>;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TorusUtils = require("@toruslabs/torus.js/dist/torusUtils-node").default;
class Web3Auth implements IWeb3Auth {
  public provider: SafeEventEmitterProvider | null = null;

  readonly options: Web3AuthOptions;

  private torusUtils: Torus | null = null;

  private nodeDetailManager: NodeDetailManager | null = null;

  private privKeyProvider: PrivateKeyProvider | null = null;

  private chainConfig: CustomChainConfig | null = null;

  private currentChainNamespace: ChainNamespaceType;

  constructor(options: Web3AuthOptions) {
    if (!options?.chainConfig?.chainNamespace) {
      throw new Error("chainNamespace is required");
    }
    if (!options.clientId) throw new Error("Please provide a valid clientId in constructor");

    if (options.chainConfig?.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
      const { chainId, rpcTarget } = options?.chainConfig || {};
      if (!chainId) {
        throw new Error("chainId is required for non-OTHER chainNamespace");
      }
      if (!rpcTarget) {
        throw new Error("rpcTarget is required for non-OTHER chainNamespace");
      }

      this.chainConfig = {
        displayName: "",
        blockExplorer: "",
        ticker: "",
        tickerName: "",
        chainId: options.chainConfig.chainId as string,
        rpcTarget: options.chainConfig.rpcTarget as string,
        ...(options?.chainConfig || {}),
      };
    }

    this.currentChainNamespace = options.chainConfig.chainNamespace;
    this.options = options;
  }

  init(options: InitParams): void {
    const { network = "mainnet" } = options;

    let finalNetwork: TORUS_NETWORK_TYPE | string = network;
    if (network === TORUS_NETWORK.TESTNET) {
      finalNetwork = "https://small-long-brook.ropsten.quiknode.pro/e2fd2eb01412e80623787d1c40094465aa67624a";
    }
    this.torusUtils = new TorusUtils({
      enableOneKey: true,
      network,
      allowHost: `${SIGNER_MAP[network]}/api/allow`,
      signerHost: `${SIGNER_MAP[network]}/api/sign`,
      enableLogging: this.options.enableLogging,
    }) as Torus;
    this.nodeDetailManager = new NodeDetailManager({ network: finalNetwork, proxyAddress: CONTRACT_MAP[network] });
    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      if (this.chainConfig === null) {
        throw new Error("chainConfig is required for Solana in constructor");
      }
      this.privKeyProvider = new SolanaPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155) {
      if (this.chainConfig === null) {
        throw new Error("chainConfig is required for EVM chain in constructor");
      }
      this.privKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.OTHER) {
      this.privKeyProvider = new CommonPrivateKeyProvider();
    } else {
      throw new Error(`Invalid chainNamespace: ${this.currentChainNamespace} found while connecting to wallet`);
    }
  }

  async connect(loginParams: LoginParams): Promise<SafeEventEmitterProvider | null> {
    if (!this.torusUtils || !this.nodeDetailManager || !this.privKeyProvider) throw new Error("Please call init first");
    const { verifier, verifierId, idToken, subVerifierInfoArray } = loginParams;
    const verifierDetails = { verifier, verifierId };

    const { torusNodeEndpoints, torusIndexes, torusNodePub } = await this.nodeDetailManager.getNodeDetails(verifierDetails);

    // does the key assign
    const pubDetails = await this.torusUtils.getUserTypeAndAddress(torusNodeEndpoints, torusNodePub, verifierDetails, true);

    if (pubDetails.typeOfUser === "v1" || pubDetails.upgraded) {
      throw new Error("User has already enabled mfa, please use the @web3auth/web3auth-web sdk for login with mfa");
    }

    let finalIdToken = idToken;
    let finalVerifierParams = { verifier_id: verifierId };
    if (subVerifierInfoArray && subVerifierInfoArray?.length > 0) {
      const aggregateVerifierParams: AggregateVerifierParams = { verify_params: [], sub_verifier_ids: [], verifier_id: "" };
      const aggregateIdTokenSeeds = [];
      for (let index = 0; index < subVerifierInfoArray.length; index += 1) {
        const userInfo = subVerifierInfoArray[index];
        aggregateVerifierParams.verify_params.push({ verifier_id: verifierId, idtoken: userInfo.idToken });
        aggregateVerifierParams.sub_verifier_ids.push(userInfo.verifier);
        aggregateIdTokenSeeds.push(userInfo.idToken);
      }
      aggregateIdTokenSeeds.sort();
      finalIdToken = keccak256(aggregateIdTokenSeeds.join(String.fromCharCode(29))).slice(2);
      aggregateVerifierParams.verifier_id = verifierId;
      finalVerifierParams = aggregateVerifierParams;
    }

    const retrieveSharesResponse = await this.torusUtils.retrieveShares(
      torusNodeEndpoints,
      torusIndexes,
      verifier,
      finalVerifierParams,
      finalIdToken
    );
    const finalKey = subkey(retrieveSharesResponse.privKey.padStart(64, "0"), Buffer.from(this.options.clientId, "base64"));
    await this.privKeyProvider.setupProvider(finalKey.padStart(64, "0"));
    return this.privKeyProvider.provider;
  }
}

export default Web3Auth;
