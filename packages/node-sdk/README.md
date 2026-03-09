# Web3Auth's Node.js SDK

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
![npm](https://img.shields.io/npm/dw/@web3auth/node-sdk)

Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

## 📖 Documentation

Checkout the official [Web3Auth Documentation](https://web3auth.io/docs) and [SDK Reference](https://web3auth.io/docs/sdk/web-backend/) to get started!

## 💡 Features

- Plug and Play, OAuth based Web3 Authentication Service
- Fully decentralized, non-custodial key infrastructure
- End to end Whitelabelable solution
- Threshold Cryptography based Key Reconstruction
- Multi Factor Authentication Setup & Recovery (Includes password, backup phrase, device factor editing/deletion etc)
- Support for WebAuthn & Passwordless Login
- Support for connecting to multiple wallets
- DApp Active Session Management

...and a lot more

## ⚡ Quick Start

### Installation

```shell
npm install --save @web3auth/node-sdk
```

### Get your Client ID from Web3Auth Dashboard

Hop on to the [Web3Auth Dashboard](https://dashboard.web3auth.io/) and create a new project. Use the Client ID of the project to start your integration.

![Web3Auth Dashboard](https://web3auth.io/docs/assets/images/project_plug_n_play-89c39ec42ad993107bb2485b1ce64b89.png)

### Initialize Web3Auth

```js
import { Web3Auth } from "@web3auth/node-sdk";
import { CHAIN_NAMESPACES } from "@web3auth/no-modal";

const web3auth = new Web3Auth({
  clientId: "", // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: "mainnet",
  chains: [
    {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      displayName: "ETH Mainnet",
      blockExplorerUrl: "https://etherscan.io",
      ticker: "ETH",
      tickerName: "Ethereum",
      chainId: "0x1",
      rpcTarget: "https://rpc.ankr.com/eth",
    },
  ],
});

await web3auth.init();
```

### Login your User

`connect()` returns a `WalletResult` containing a `provider`, a typed `signer`, and the `chainNamespace`:

```js
const result = await web3auth.connect({
  authConnectionId: "your-auth-connection-id",
  idToken: "JWT Token",
  userId: "user@example.com",
});

// result.provider  — the underlying key provider
// result.signer    — a chain-specific signer (WalletClient for EIP155, TransactionSigner for Solana, null for OTHER)
// result.chainNamespace — "eip155" | "solana" | "other"
```

### WalletResult

`connect()` returns a discriminated union based on `chainNamespace`:

| `chainNamespace` | `signer` type | Description |
|---|---|---|
| `eip155` | `WalletClient` (viem) | EVM-compatible chains |
| `solana` | `TransactionSigner` (@solana/signers) | Solana chains |
| `other` | `null` | Other chain namespaces |

```ts
if (result.chainNamespace === CHAIN_NAMESPACES.EIP155) {
  // result.signer is a viem WalletClient
  const address = result.signer.account?.address;
} else if (result.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
  // result.signer is a @solana/signers TransactionSigner
  const address = result.signer.address;
}
```

## Migration from v4.x

### Breaking changes in v5.0.0

- **`init()` no longer takes parameters.** Chain configuration is now passed via the `chains` option in the constructor. Remove the `provider` parameter from `init()`.
- **`chains` is required.** Pass at least one `CustomChainConfig` in the constructor.
- **`connect()` returns `WalletResult` instead of a raw provider.** Access the provider via `result.provider` and a chain-typed signer via `result.signer`.
- **`verifier` / `verifierId` renamed.** Use `authConnectionId` and `userId` instead.
- **Node.js 22+ required.**

### Before (v4.x)

```js
const provider = new EthereumPrivateKeyProvider({ config: { chainConfig } });
web3auth.init({ provider });

const provider = await web3auth.connect({
  verifier: "verifier-name",
  verifierId: "user@example.com",
  idToken: "JWT Token",
});
```

### After (v5.0.0)

```js
const web3auth = new Web3Auth({
  clientId: "...",
  web3AuthNetwork: "mainnet",
  chains: [{ chainNamespace: CHAIN_NAMESPACES.EIP155, chainId: "0x1", rpcTarget: "...", /* ... */ }],
});
await web3auth.init();

const result = await web3auth.connect({
  authConnectionId: "your-auth-connection-id",
  userId: "user@example.com",
  idToken: "JWT Token",
});
// result.provider — same provider as before
// result.signer  — typed signer for the chain
```

## ⏪ Requirements

- Node 22+

## 🩹 Examples

Checkout the examples for your preferred blockchain and platform in our [examples repository](https://github.com/Web3Auth/examples/)

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo-app.web3auth.io/) to see how Web3Auth can be used in your application.

## 💬 Troubleshooting and Discussions

- Have a look at our [GitHub Discussions](https://github.com/Web3Auth/Web3Auth/discussions?discussions_q=sort%3Atop) to see if anyone has any questions or issues you might be having.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions
- Join our [Discord](https://discord.gg/web3auth) to join our community and get private integration support or help with your integration.
