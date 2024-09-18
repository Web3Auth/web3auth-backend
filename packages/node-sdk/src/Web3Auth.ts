/* eslint-disable security/detect-object-injection */
import { NodeDetailManager } from "@toruslabs/fetch-node-details";
import { keccak256, Torus } from "@toruslabs/torus.js";
import { subkey } from "@web3auth/auth";
import { CHAIN_NAMESPACES, ChainNamespaceType, IProvider, WalletInitializationError, WalletLoginError } from "@web3auth/base";

import { AggregateVerifierParams, IWeb3Auth, LoginParams, PrivateKeyProvider, Web3AuthOptions } from "./interface";

export class Web3Auth implements IWeb3Auth {
  public connected: boolean = false;

  readonly options: Web3AuthOptions;

  private torusUtils: Torus | null = null;

  private nodeDetailManager: NodeDetailManager | null = null;

  private privKeyProvider: PrivateKeyProvider | null = null;

  private currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  constructor(options: Web3AuthOptions) {
    this.options = {
      ...options,
      web3AuthNetwork: options.web3AuthNetwork || "mainnet",
    };
  }

  get provider(): IProvider | null {
    return this.privKeyProvider || null;
  }

  init({ provider }: { provider: PrivateKeyProvider }): void {
    if (!provider || !provider.currentChainConfig || !provider.currentChainConfig.chainNamespace) {
      throw WalletInitializationError.invalidParams('provider must be of type "PrivateKeyProvider" and have a valid chainNamespace');
    }
    const { web3AuthNetwork: network } = this.options;
    this.torusUtils = new Torus({
      enableOneKey: true,
      network,
      clientId: this.options.clientId,
    });
    Torus.enableLogging(this.options.enableLogging || false);

    this.nodeDetailManager = new NodeDetailManager({ network, enableLogging: this.options.enableLogging || false });
    this.privKeyProvider = provider;
    this.currentChainNamespace = provider.currentChainConfig.chainNamespace;
  }

  async connect(loginParams: LoginParams): Promise<IProvider | null> {
    if (!this.torusUtils || !this.nodeDetailManager || !this.privKeyProvider) throw WalletInitializationError.notReady("Please call init first.");
    const { verifier, verifierId, idToken, subVerifierInfoArray } = loginParams;
    if (!verifier || !verifierId || !idToken) throw WalletInitializationError.invalidParams("verifier or verifierId or idToken  required");
    const verifierDetails = { verifier, verifierId };

    const { torusNodeEndpoints, torusIndexes } = await this.nodeDetailManager.getNodeDetails(verifierDetails);

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

      const inputString = aggregateIdTokenSeeds.join(String.fromCharCode(29));
      const inputBuffer = Buffer.from(inputString, "utf8");
      finalIdToken = keccak256(inputBuffer).slice(2);

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

    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      if (!this.privKeyProvider.getEd25519Key) {
        throw WalletLoginError.fromCode(5000, "Private key provider is not valid, Missing getEd25519Key function");
      }
      finalPrivKey = this.privKeyProvider.getEd25519Key(finalPrivKey);
    }
    await this.privKeyProvider.setupProvider(finalPrivKey);
    this.connected = true;
    return this.privKeyProvider;
  }
}
