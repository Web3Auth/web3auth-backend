import NodeDetailManager, { TORUS_NETWORK } from "@toruslabs/fetch-node-details";
import type Torus from "@toruslabs/torus.js";
import { CHAIN_NAMESPACES, ChainNamespaceType, CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";
import { CommonPrivateKeyProvider, IBaseProvider } from "@web3auth/base-provider";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { keccak256 } from "web3-utils";

import { AggregateVerifierParams, InitParams, IWeb3Auth, LoginParams } from "./interface";

type PrivateKeyProvider = IBaseProvider<string>;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TorusUtils = require("@toruslabs/torus.js/dist/torusUtils-node").default;
export class Web3Auth implements IWeb3Auth {
  public provider: SafeEventEmitterProvider | null = null;

  private torusUtils: Torus | null = null;

  private nodeDetailManager: NodeDetailManager | null = null;

  private privKeyProvider: PrivateKeyProvider | null = null;

  private chainConfig: CustomChainConfig | null = null;

  private currentChainNamespace: ChainNamespaceType;

  constructor(params: { chainConfig: { chainId?: string; rpcTarget?: string } & Pick<CustomChainConfig, "chainNamespace"> }) {
    if (!params?.chainConfig?.chainNamespace) {
      throw new Error("chainNamespace is required");
    }

    if (params.chainConfig?.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
      const { chainId, rpcTarget } = params?.chainConfig || {};
      if (!chainId) {
        throw new Error("chainId is required for non-OTHER chainNamespace");
      }
      if (!rpcTarget) {
        throw new Error("rpcTarget is required for non-OTHER chainNamespace");
      }

      this.chainConfig = {
        ...(params?.chainConfig || {}),
        chainId: params.chainConfig.chainId as string,
        rpcTarget: params.chainConfig.rpcTarget as string,
        displayName: "",
        blockExplorer: "",
        ticker: "",
        tickerName: "",
      };
    }

    this.currentChainNamespace = params.chainConfig.chainNamespace;
  }

  init(params: InitParams): void {
    const { network = "mainnet" } = params;
    this.torusUtils = new TorusUtils({
      enableOneKey: true,
      network,
    }) as Torus;

    let finalNetwork: string = TORUS_NETWORK.MAINNET;
    let finalProxyAddress = NodeDetailManager.PROXY_ADDRESS_MAINNET;
    if (network === TORUS_NETWORK.TESTNET) {
      finalNetwork = "https://small-long-brook.ropsten.quiknode.pro/e2fd2eb01412e80623787d1c40094465aa67624a";
      finalProxyAddress = NodeDetailManager.PROXY_ADDRESS_TESTNET;
    } else if (network === TORUS_NETWORK.CYAN) {
      finalNetwork = TORUS_NETWORK.CYAN;
      finalProxyAddress = NodeDetailManager.PROXY_ADDRESS_CYAN;
    } else if (network === TORUS_NETWORK.AQUA) {
      finalNetwork = TORUS_NETWORK.AQUA;
      finalProxyAddress = NodeDetailManager.PROXY_ADDRESS_AQUA;
    }
    this.nodeDetailManager = new NodeDetailManager({ network: finalNetwork, proxyAddress: finalProxyAddress });
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
    await this.privKeyProvider.setupProvider(retrieveSharesResponse.privKey.padStart(64, "0"));
    return this.privKeyProvider.provider;
  }
}
