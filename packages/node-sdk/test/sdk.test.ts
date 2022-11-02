import { expect } from "chai";

import { Web3Auth } from "../src";
import { generateIdToken } from "./helpers";

const TORUS_TEST_EMAIL = "test123@tor.us";
const TORUS_TEST_VERIFIER = "torus-test-health";
const TORUS_TEST_AGGREGATE_VERIFIER = "torus-test-health-aggregate";

describe("web3auth backend", function () {
  let web3auth: Web3Auth;

  beforeEach("one time execution before all tests", async function () {
    web3auth = new Web3Auth({
      chainConfig: {
        chainNamespace: "eip155",
        chainId: "0x3", // ropsten
        rpcTarget: "https://small-long-brook.ropsten.quiknode.pro/e2fd2eb01412e80623787d1c40094465aa67624a",
      },
      clientId: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
    });
    web3auth.init({ network: "testnet" });
  });
  it("should return a provider with private key", async function () {
    const provider = await web3auth.connect({
      verifier: TORUS_TEST_VERIFIER,
      verifierId: TORUS_TEST_EMAIL,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
    });
    expect(provider).to.not.equal(null);

    const privKey = await provider?.request({ method: "eth_private_key", params: [] });
    expect(privKey).to.equal("29b3cb89c805401ebb0661794a463495b3bed6cc96d939a0a52e9fe5aa1dad94");
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
    expect(privKey).to.equal("208763be04830f2fd695e80a8ddd0cef5da242510c965819747d8edfdfaf576e");
  });
});
