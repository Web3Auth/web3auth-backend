import { expect } from "chai";

import { Web3Auth } from "../src";
import { generateIdToken } from "./helpers";

const TORUS_TEST_EMAIL = "hello@tor.us";
const TORUS_TEST_VERIFIER = "torus-test-health";
const TORUS_TEST_AGGREGATE_VERIFIER = "torus-test-health-aggregate";

describe("web3auth backend", function () {
  let web3auth: Web3Auth;

  beforeEach("one time execution before all tests", async function () {
    web3auth = new Web3Auth({
      chainConfig: {
        chainNamespace: "eip155",
        chainId: "0x5", // goerli
        rpcTarget: "https://rpc.ankr.com/eth_goerli",
      },
      clientId: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
      web3AuthNetwork: "testnet",
    });
    web3auth.init();
  });
  it("should return a provider with private key", async function () {
    const provider = await web3auth.connect({
      verifier: TORUS_TEST_VERIFIER,
      verifierId: TORUS_TEST_EMAIL,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
    });
    expect(provider).to.not.equal(null);

    const privKey = await provider?.request({ method: "eth_private_key", params: [] });
    expect(privKey).to.equal("296045a5599afefda7afbdd1bf236358baff580a0fe2db62ae5c1bbe817fbae4");
  });

  it("should be return a provider with private key for aggregate login", async function () {
    const idToken = generateIdToken(TORUS_TEST_EMAIL, "ES256");

    const provider = await web3auth.connect({
      verifier: TORUS_TEST_AGGREGATE_VERIFIER,
      verifierId: TORUS_TEST_EMAIL,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      subVerifierInfoArray: [{ verifier: TORUS_TEST_VERIFIER, idToken }],
    });
    expect(provider).to.not.equal(null);

    const privKey = await provider?.request({ method: "eth_private_key", params: [] });
    expect(privKey).to.equal("ad47959db4cb2e63e641bac285df1b944f54d1a1cecdaeea40042b60d53c35d2");
  });

  it("should be able to login with solana", async function () {
    const web3authSolana = new Web3Auth({
      chainConfig: {
        chainNamespace: "solana",
        chainId: "0x3",
        rpcTarget: "https://api.devnet.solana.com",
      },
      clientId: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
      web3AuthNetwork: "testnet",
    });
    web3authSolana.init();
    const provider = await web3authSolana.connect({
      verifier: TORUS_TEST_VERIFIER,
      verifierId: TORUS_TEST_EMAIL,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
    });
    expect(provider).to.not.equal(null);

    const privKey = await provider?.request({ method: "solanaPrivateKey", params: [] });
    expect(privKey).to.equal(
      "296045a5599afefda7afbdd1bf236358baff580a0fe2db62ae5c1bbe817fbae49fe0788629bf18798cefdb361b63f2b69f384bdf93fb85f89a24ef427d6f8d10"
    );
  });
});
