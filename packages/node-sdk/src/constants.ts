import NodeDetailManager, { TORUS_NETWORK } from "@toruslabs/fetch-node-details";

export const CONTRACT_MAP = {
  [TORUS_NETWORK.MAINNET]: NodeDetailManager.PROXY_ADDRESS_MAINNET,
  [TORUS_NETWORK.TESTNET]: NodeDetailManager.PROXY_ADDRESS_TESTNET,
  [TORUS_NETWORK.CYAN]: NodeDetailManager.PROXY_ADDRESS_CYAN,
  [TORUS_NETWORK.AQUA]: NodeDetailManager.PROXY_ADDRESS_AQUA,
  [TORUS_NETWORK.CELESTE]: NodeDetailManager.PROXY_ADDRESS_CELESTE,
};

export const SIGNER_MAP = {
  [TORUS_NETWORK.MAINNET]: "https://signer.tor.us",
  [TORUS_NETWORK.TESTNET]: "https://signer.tor.us",
  [TORUS_NETWORK.CYAN]: "https://signer-polygon.tor.us",
  [TORUS_NETWORK.AQUA]: "https://signer-polygon.tor.us",
  [TORUS_NETWORK.CELESTE]: "https://signer-polygon.tor.us",
};
