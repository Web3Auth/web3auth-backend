import type { TransactionSigner } from "@solana/signers";
import { CHAIN_NAMESPACES, type CustomChainConfig } from "@web3auth/no-modal";
import type { WalletClient } from "viem";
import { beforeEach, describe, expect, it } from "vitest";

import { Web3Auth } from "../src";
import { generateIdToken } from "./helpers";

const TORUS_TEST_EMAIL = "hello@tor.us";
const TORUS_TEST_VERIFIER = "torus-test-health";
const TORUS_TEST_AGGREGATE_VERIFIER = "torus-test-health-aggregate";

describe("web3auth backend", function () {
  let web3auth: Web3Auth;

  beforeEach(async function () {
    web3auth = new Web3Auth({
      clientId: "BJRZ6qdDTbj6Vd5YXvV994TYCqY42-PxldCetmvGTUdoq6pkCqdpuC1DIehz76zuYdaq1RJkXGHuDraHRhCQHvA",
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

  it("should return a wallet with EIP155 signer", async function () {
    const result = await web3auth.connect({
      authConnectionId: TORUS_TEST_VERIFIER,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      userId: TORUS_TEST_EMAIL,
    });
    expect(result).not.toBeNull();
    expect(result.provider).not.toBeNull();
    expect(result.chainNamespace).toBe(CHAIN_NAMESPACES.EIP155);

    const signer = result.signer as WalletClient;
    expect(signer).not.toBeNull();
    expect(signer.account?.address).toBe("0x90A926b698047b4A87265ba1E9D8b512E8489067");
  });

  it("should return a wallet with signer for aggregate login", async function () {
    const result = await web3auth.connect({
      authConnectionId: TORUS_TEST_VERIFIER,
      groupedAuthConnectionId: TORUS_TEST_AGGREGATE_VERIFIER,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      userId: TORUS_TEST_EMAIL,
    });
    expect(result).not.toBeNull();
    expect(result.provider).not.toBeNull();
    expect(result.chainNamespace).toBe(CHAIN_NAMESPACES.EIP155);

    const signer = result.signer as WalletClient;
    expect(signer).not.toBeNull();
    expect(signer.account?.address).toBe("0x86129bC541b03B6B42A76E9e002eE88F81E0aadD");
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
      clientId: "BJRZ6qdDTbj6Vd5YXvV994TYCqY42-PxldCetmvGTUdoq6pkCqdpuC1DIehz76zuYdaq1RJkXGHuDraHRhCQHvA",
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
    expect(result.chainNamespace).toBe(CHAIN_NAMESPACES.SOLANA);
    const solanaSigner = result.signer as TransactionSigner;
    expect(solanaSigner).not.toBeNull();
    expect(solanaSigner.address).toBe("9vUdvTHkzc7hAQh7m9m4TgSsVtBBMZJ3skSiUL9fZHsU");
  });
});
