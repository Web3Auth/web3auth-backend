import { TORUS_NETWORK_TYPE } from "@toruslabs/fetch-node-details";
import { SafeEventEmitterProvider } from "@web3auth/base";

export type InitParams = { network: TORUS_NETWORK_TYPE };
export type LoginParams = {
  verifier: string;
  verifierId: string;
  idToken: string;
};
export interface IWeb3Auth {
  provider: SafeEventEmitterProvider | null;
  init(params: InitParams): void;
  connect(loginParams: LoginParams): Promise<SafeEventEmitterProvider | null>;
}
