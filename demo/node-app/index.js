/* eslint-disable n/no-process-exit */
/* eslint-disable no-console */
import fs from "node:fs";

import { Web3Auth } from "@web3auth/node-sdk";
import jwt from "jsonwebtoken";

const web3auth = new Web3Auth({
  clientId: "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ", // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: "sapphire_mainnet", // Get your Network from Web3Auth Dashboard
  defaultChainId: "0x1",
});

const privateKey = fs.readFileSync("privateKey.pem");

const sub = Math.random().toString(36).substring(7);

const token = jwt.sign(
  {
    sub,
    name: "Mohammad Yashovardhan Mishra Jang",
    email: "devrel@web3auth.io",
    aud: "urn:api-web3auth-io",
    iss: "https://web3auth.io",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  },
  privateKey,
  { algorithm: "RS256", keyid: "2ma4enu1kdvw5bo9xsfpi3gcjzrt6q78yl0h" }
);

const connect = async () => {
  await web3auth.init();

  const result = await web3auth.connect({
    authConnectionId: "w3a-node-demo", // replace with your auth connection id from the Web3Auth Dashboard
    // userId: sub, // optional: explicit user id, otherwise resolved from the idToken
    // userIdField: "sub",
    idToken: token, // replace with your newly created unused JWT Token.
  });

  if (result.chainNamespace === "eip155") {
    // result.signer is a viem WalletClient
    const address = result.signer.account?.address;
    console.log("Address: ", address);
  } else if (result.chainNamespace === "solana") {
    // result.signer is a @solana/signers TransactionSigner
    const publicKey = result.signer.address;
    console.log("Public Key: ", publicKey);
  } else {
    const privKey = await result.provider.request({ method: "private_key" });
    console.log("Private Key: ", privKey);
  }

  process.exit(0);
};

connect();
