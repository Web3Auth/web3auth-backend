const { Web3Auth } = require("@web3auth/node-sdk");
const { EthereumPrivateKeyProvider } = require("@web3auth/ethereum-provider");

const web3auth = new Web3Auth({
  clientId: "BBP_6GOu3EJGGws9yd8wY_xFT0jZIWmiLMpqrEMx36jlM61K9XRnNLnnvEtGpF-RhXJDGMJjL-I-wTi13RcBBOo", // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: "testnet",
});

const ethereumProvider = new EthereumPrivateKeyProvider({ config: { chainConfig: { chainId: "0x1", rpcTarget: "https://rpc.ankr.com/eth" } } });

web3auth.init({ provider: ethereumProvider });

const connect = async () => {
  const provider = await web3auth.connect({
    verifier: "web3auth-firebase-examples", // replace with your verifier name
    verifierId: "CF4yYZjIBxXAEd66bsza5OSkCWn1", // replace with your verifier id, setup while creating the verifier on Web3Auth's Dashboard
    idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjY3YmFiYWFiYTEwNWFkZDZiM2ZiYjlmZjNmZjVmZTNkY2E0Y2VkYTEiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQXJjaGl0IEd1cHRhIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FHTm15eFk3WW16VXZtQXlENGZLQWJhMWZkb0NGaGpPZ3pmTG1yclAtZHFZPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3dlYjNhdXRoLW9hdXRoLWxvZ2lucyIsImF1ZCI6IndlYjNhdXRoLW9hdXRoLWxvZ2lucyIsImF1dGhfdGltZSI6MTY4Njg5MjEyMCwidXNlcl9pZCI6IkNGNHlZWmpJQnhYQUVkNjZic3phNU9Ta0NXbjEiLCJzdWIiOiJDRjR5WVpqSUJ4WEFFZDY2YnN6YTVPU2tDV24xIiwiaWF0IjoxNjg2ODkyMTIxLCJleHAiOjE2ODY4OTU3MjEsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMTA1ODEwOTQ3NDM2OTE2MTk5MzIiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.bZxzIgzz2Q6707YJNHXdyeI7FN5mNz2Im9sRKlNWpYsdRhDkDUpEF2NSLM0VaC-HPlaMZRti7bDcsQu2Ak6x8ngea_rOMEix_QZMa1ANrq55cDdOA04_jgruLLJJ04Qq4VtmPUHcLZ1XSfbg70Hny_w3q0gSiemoeY-_D45NZh1t7JKlc2RcTpN_PfPGaUG0i7I7U8YJSa3bPnpyV-V1FztritHwqZSijnJitD-2noVAqVJvAGUk4rb8zMG5TNrS-gdvWldz7beHjkkr0jpLnb69wZDL0EDuuQkQHkxTje2c6OqE-E9RyBF3Jr8LMTuOjfe6AunOWk4CmTcQnx0jrQ", // replace with your newly created unused JWT Token.
  });
  const ethPrivKey = await provider.request({ method: "eth_private_key" });
  console.log("ETH Private Key", ethPrivKey);
};
connect();
