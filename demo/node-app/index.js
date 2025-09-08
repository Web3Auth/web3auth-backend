const { Web3Auth } = require("@web3auth/node-sdk");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const web3auth = new Web3Auth({
  // defaultChainId: "aptos-devnet",
  // defaultChainId: "0x66"
  defaultChainId: "0x1",
  clientId: "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ", // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: "sapphire_mainnet", // Get your Network from Web3Auth Dashboard
});

const privateKey = fs.readFileSync("privateKey.pem");

const sub = Math.random().toString(36).substring(7);

const token = jwt.sign(
  {
    sub: sub,
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

const initWeb3Auth = async () => {
  await web3auth.init();
  console.log("Web3Auth initialized", web3auth.projectConfig);
};

const connect = async () => {
  await initWeb3Auth();
  const result = await web3auth.connect({
    authConnectionId: "w3a-node-demo", // replace with your verifier name
    userId: sub, // replace with your verifier id's value, for example, sub value of JWT Token, or email address.
    idToken: token, // replace with your newly created unused JWT Token.
  });
  if (result.chainNamespace === "eip155") {
    const address = await result.provider.getAddress();
    console.log("Address: ", address);
  } else if (result.chainNamespace === "solana") {
    const publicKey = result.provider.address;
    console.log("Public Key: ", publicKey);
  } else {
    const privateKey = await result.provider.request({ method: "private_key" });
    console.log("Private Key: ", privateKey);
  }
  process.exit(0);
};

connect();
