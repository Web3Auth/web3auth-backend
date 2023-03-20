import { TORUS_NETWORK_TYPE } from "@toruslabs/fetch-node-details";
import { CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";

export interface TorusSubVerifierInfo {
  verifier: string;
  idToken: string;
}
export type InitParams = { network: TORUS_NETWORK_TYPE };

export type LoginParams = {
  verifier: string;
  verifierId: string;
  idToken: string;
  subVerifierInfoArray?: TorusSubVerifierInfo[];
};

export interface IWeb3Auth {
  provider: SafeEventEmitterProvider | null;
  init(params: InitParams): void;
  connect(loginParams: LoginParams): Promise<SafeEventEmitterProvider | null>;
}

export type AggregateVerifierParams = {
  verify_params: { verifier_id: string; idtoken: string }[];
  sub_verifier_ids: string[];
  verifier_id: string;
};

export interface Web3AuthOptions {
  /**
   * Client id for web3auth.
   * You can obtain your client id from the web3auth developer dashboard.
   * You can set any random string for this on localhost.
   */
  clientId: string;
  /**
   * custom chain configuration for chainNamespace
   *
   * @defaultValue mainnet config of provided chainNamespace
   */
  chainConfig: Partial<CustomChainConfig> & Pick<CustomChainConfig, "chainNamespace">;

  /**
   * Web3Auth Network to use for login
   * @defaultValue mainnet
   */
  web3AuthNetwork?: TORUS_NETWORK_TYPE;

  /**
   * setting to true will enable logs
   *
   * @defaultValue false
   */
  enableLogging?: boolean;

  /**
   * app scoped priv keys.
   */
  usePnPKey?: boolean;
}
