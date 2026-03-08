import { CHAIN_NAMESPACES, type CustomChainConfig } from "@web3auth/no-modal";
import { beforeEach, describe, expect, it } from "vitest";

import { Web3Auth } from "../src";
import { generateIdToken } from "./helpers";

const TORUS_TEST_EMAIL = "hello@tor.us";
const TORUS_TEST_VERIFIER = "torus-test-health";
const TORUS_TEST_AGGREGATE_VERIFIER = "torus-aggregate-sapphire-mainnet";

describe("web3auth backend", function () {
  let web3auth: Web3Auth;

  beforeEach(async function () {
    web3auth = new Web3Auth({
      clientId: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
      web3AuthNetwork: "mainnet",
      chains: [
        {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          displayName: "ETH Sepolia",
          blockExplorerUrl: "https://sepolia.etherscan.io",
          ticker: "ETH",
          tickerName: "Ethereum",
          logo: "",
          chainId: "0xaa36a7",
          rpcTarget: "https://rpc.ankr.com/eth_sepolia",
        },
      ],
    });
    await web3auth.init();
  });

  it("should return a provider with private key", async function () {
    const result = await web3auth.connect({
      authConnectionId: TORUS_TEST_VERIFIER,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      userId: TORUS_TEST_EMAIL,
    });
    expect(result).not.toBeNull();
    expect(result.provider).not.toBeNull();

    const privKey = await result.provider.request({ method: "eth_private_key", params: [] });
    expect(privKey).toBe("dfb39b84e0c64b8c44605151bf8670ae6eda232056265434729b6a8a50fa3419");
  });

  it("should return a provider with private key for aggregate login", async function () {
    const result = await web3auth.connect({
      authConnectionId: TORUS_TEST_VERIFIER,
      groupedAuthConnectionId: TORUS_TEST_AGGREGATE_VERIFIER,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      userId: TORUS_TEST_EMAIL,
    });
    expect(result).not.toBeNull();
    expect(result.provider).not.toBeNull();

    const privKey = await result.provider.request({ method: "eth_private_key", params: [] });
    expect(privKey).toBe("9a8c7d58d4246507cdd6b2c34850eac52a35c4d6ebea8cefbec26010ad8011d6");
  });

  it("should be able to login with solana", async function () {
    const solanaChainConfig: CustomChainConfig = {
      chainNamespace: CHAIN_NAMESPACES.SOLANA,
      displayName: "Solana Devnet",
      blockExplorerUrl: "https://explorer.solana.com/",
      ticker: "sol",
      tickerName: "Solana",
      logo: "",
      chainId: "0x3",
      rpcTarget: "https://api.devnet.solana.com",
    };
    const web3authSolana = new Web3Auth({
      clientId: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
      web3AuthNetwork: "mainnet",
      chains: [solanaChainConfig],
    });
    await web3authSolana.init();

    const result = await web3authSolana.connect({
      authConnectionId: TORUS_TEST_VERIFIER,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      userId: TORUS_TEST_EMAIL,
    });
    expect(result).not.toBeNull();
    expect(result.provider).not.toBeNull();

    const privKey = await result.provider.request({ method: "solanaPrivateKey", params: [] });
    expect(privKey).toBe(
      "296045a5599afefda7afbdd1bf236358baff580a0fe2db62ae5c1bbe817fbae49fe0788629bf18798cefdb361b63f2b69f384bdf93fb85f89a24ef427d6f8d10"
    );
  });
});
