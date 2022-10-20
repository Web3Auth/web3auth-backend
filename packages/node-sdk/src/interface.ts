import { TORUS_NETWORK_TYPE } from "@toruslabs/fetch-node-details";
import { SafeEventEmitterProvider } from "@web3auth/base";

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
