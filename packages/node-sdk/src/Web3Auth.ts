/* eslint-disable security/detect-object-injection */
import { NodeDetailManager } from "@toruslabs/fetch-node-details";
import { keccak256 } from "@toruslabs/metadata-helpers";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import { subkey } from "@toruslabs/openlogin-subkey";
import type Torus from "@toruslabs/torus.js";
import {
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CustomChainConfig,
  SafeEventEmitterProvider,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import { BaseProvider } from "@web3auth/base-provider";
import fetch from "node-fetch";

import { AggregateVerifierParams, IWeb3Auth, LoginParams, Web3AuthOptions } from "./interface";

(globalThis as any).fetch = fetch;

type PrivateKeyProvider = BaseProvider<string>;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TorusUtils = require("@toruslabs/torus.js/dist/torusUtils-node").default;
class Web3Auth implements IWeb3Auth {
  public provider: SafeEventEmitterProvider | null = null;

  readonly options: Web3AuthOptions;

  private torusUtils: Torus | null = null;

  private nodeDetailManager: NodeDetailManager | null = null;

  private privKeyProvider: PrivateKeyProvider | null = null;

  constructor(options: Web3AuthOptions) {
    this.options = {
      ...options,
      web3AuthNetwork: options.web3AuthNetwork || "mainnet",
    };
  }

  init({ provider }: { provider: PrivateKeyProvider }): void {
    const { web3AuthNetwork: network } = this.options;
    this.torusUtils = new TorusUtils({
      enableOneKey: true,
      network,
      enableLogging: this.options.enableLogging,
      clientId: this.options.clientId,
    }) as Torus;

    this.nodeDetailManager = new NodeDetailManager({ network });
    this.privKeyProvider = provider;
  }

  async connect(loginParams: LoginParams): Promise<SafeEventEmitterProvider | null> {
    if (!this.torusUtils || !this.nodeDetailManager || !this.privKeyProvider) throw new Error("Please call init first");
    const { verifier, verifierId, idToken, subVerifierInfoArray } = loginParams;
    const verifierDetails = { verifier, verifierId };

    const { torusNodeEndpoints, torusIndexes, torusNodePub } = await this.nodeDetailManager.getNodeDetails(verifierDetails);

    // does the key assign
    const pubDetails = await this.torusUtils.getUserTypeAndAddress(torusNodeEndpoints, torusNodePub, verifierDetails, true);

    if (pubDetails.typeOfUser === "v1" || pubDetails.upgraded) {
      throw WalletLoginError.fromCode(5000, "User has already enabled mfa, please use the @web3auth/web3auth-web sdk for login with mfa");
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

      const inputString = aggregateIdTokenSeeds.join(String.fromCharCode(29));
      const inputBuffer = Buffer.from(inputString, "utf8");
      finalIdToken = Buffer.from(keccak256(inputBuffer)).toString("hex");

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

    const { privKey } = retrieveSharesResponse;
    if (!privKey) throw WalletLoginError.fromCode(5000, "Unable to get private key from torus nodes");
    let finalPrivKey = privKey.padStart(64, "0");
    if (this.privKeyProvider === CHAIN_NAMESPACES.SOLANA) {
      finalPrivKey = getED25519Key(finalPrivKey).sk.toString("hex");
    }
    if (this.options.usePnPKey) {
      const pnpPrivKey = subkey(finalPrivKey, Buffer.from(this.options.clientId, "base64"));
      finalPrivKey = pnpPrivKey.padStart(64, "0");
    }
    await this.privKeyProvider.setupProvider(finalPrivKey);
    return this.privKeyProvider.provider;
  }
}

export default Web3Auth;
