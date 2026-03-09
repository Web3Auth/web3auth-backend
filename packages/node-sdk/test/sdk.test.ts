import type { TransactionSigner } from "@solana/signers";
import { CHAIN_NAMESPACES, type CustomChainConfig } from "@web3auth/no-modal";
import type { WalletClient } from "viem";
import { beforeEach, describe, expect, it } from "vitest";

import { Web3Auth } from "../src";
import { generateIdToken } from "./helpers";

const TORUS_TEST_EMAIL = "hello@tor.us";
const TORUS_TEST_VERIFIER = "torus-test-health";
const TORUS_TEST_AGGREGATE_VERIFIER = "torus-test-health-aggregate";

const EIP155_CHAIN: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  displayName: "ETH Sepolia",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "",
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
};

const CLIENT_ID = "BJRZ6qdDTbj6Vd5YXvV994TYCqY42-PxldCetmvGTUdoq6pkCqdpuC1DIehz76zuYdaq1RJkXGHuDraHRhCQHvA";

describe("web3auth backend", function () {
  let web3auth: Web3Auth;

  beforeEach(async function () {
    web3auth = new Web3Auth({
      clientId: CLIENT_ID,
      web3AuthNetwork: "mainnet",
      chains: [EIP155_CHAIN],
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
      clientId: CLIENT_ID,
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

describe("web3auth backend - error cases", function () {
  it("should throw if connect is called before init", async function () {
    const web3auth = new Web3Auth({
      clientId: CLIENT_ID,
      web3AuthNetwork: "mainnet",
      chains: [EIP155_CHAIN],
    });

    await expect(
      web3auth.connect({
        authConnectionId: TORUS_TEST_VERIFIER,
        idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
        userId: TORUS_TEST_EMAIL,
      })
    ).rejects.toThrow("Please call init first");
  });

  it("should throw if idToken is missing", async function () {
    const web3auth = new Web3Auth({
      clientId: CLIENT_ID,
      web3AuthNetwork: "mainnet",
      chains: [EIP155_CHAIN],
    });
    await web3auth.init();

    await expect(
      web3auth.connect({
        authConnectionId: TORUS_TEST_VERIFIER,
        idToken: "",
        userId: TORUS_TEST_EMAIL,
      })
    ).rejects.toThrow("idToken and authConnectionId are required");
  });

  it("should throw if authConnectionId is missing", async function () {
    const web3auth = new Web3Auth({
      clientId: CLIENT_ID,
      web3AuthNetwork: "mainnet",
      chains: [EIP155_CHAIN],
    });
    await web3auth.init();

    await expect(
      web3auth.connect({
        authConnectionId: "",
        idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
        userId: TORUS_TEST_EMAIL,
      })
    ).rejects.toThrow("idToken and authConnectionId are required");
  });

  it("should return OTHER namespace with null signer", async function () {
    const otherChainConfig: CustomChainConfig = {
      chainNamespace: CHAIN_NAMESPACES.OTHER,
      displayName: "Other Chain",
      blockExplorerUrl: "",
      ticker: "OTHER",
      tickerName: "Other",
      logo: "",
      chainId: "other-chain",
      rpcTarget: "",
    };
    const web3auth = new Web3Auth({
      clientId: CLIENT_ID,
      web3AuthNetwork: "mainnet",
      chains: [otherChainConfig],
    });
    await web3auth.init();

    const result = await web3auth.connect({
      authConnectionId: TORUS_TEST_VERIFIER,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      userId: TORUS_TEST_EMAIL,
    });
    expect(result.chainNamespace).toBe(CHAIN_NAMESPACES.OTHER);
    expect(result.signer).toBeNull();
    expect(result.provider).not.toBeNull();
  });
});

describe("web3auth backend - usePnPKey with URL-safe clientId", function () {
  it("should return a different address with usePnPKey enabled", async function () {
    const web3auth = new Web3Auth({
      clientId: CLIENT_ID,
      web3AuthNetwork: "mainnet",
      usePnPKey: true,
      chains: [EIP155_CHAIN],
    });
    await web3auth.init();

    const result = await web3auth.connect({
      authConnectionId: TORUS_TEST_VERIFIER,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      userId: TORUS_TEST_EMAIL,
    });
    expect(result).not.toBeNull();
    expect(result.chainNamespace).toBe(CHAIN_NAMESPACES.EIP155);

    const signer = result.signer as WalletClient;
    expect(signer.account?.address).toBeDefined();
    // PnP key derives a different address than the default SFA key
    expect(signer.account?.address).not.toBe("0x90A926b698047b4A87265ba1E9D8b512E8489067");
  });
});

describe("web3auth backend - EIP155 signer chain metadata", function () {
  it("should have chain config on the EIP155 signer", async function () {
    const web3auth = new Web3Auth({
      clientId: CLIENT_ID,
      web3AuthNetwork: "mainnet",
      chains: [EIP155_CHAIN],
    });
    await web3auth.init();

    const result = await web3auth.connect({
      authConnectionId: TORUS_TEST_VERIFIER,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      userId: TORUS_TEST_EMAIL,
    });
    expect(result.chainNamespace).toBe(CHAIN_NAMESPACES.EIP155);

    const signer = result.signer as WalletClient;
    expect(signer.chain).toBeDefined();
    expect(signer.chain!.id).toBe(Number(EIP155_CHAIN.chainId));
    expect(signer.chain!.name).toBe(EIP155_CHAIN.displayName);
    expect(signer.chain!.nativeCurrency.symbol).toBe(EIP155_CHAIN.ticker);
  });
});
