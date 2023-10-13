# Web3Auth for Backend

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
![npm](https://img.shields.io/npm/dw/@web3auth/node-sdk)

Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

## 📖 Documentation

Checkout the official [Web3Auth Documentation](https://web3auth.io/docs) and [SDK Reference](https://web3auth.io/docs/sdk/core-kit/sfa-node) to get started!

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

## 💭 Choosing Between SDKs

For using Web3Auth in the web, you have two choices of SDKs to get started with.

[Web3Auth Plug and Play Modal SDK `@web3auth/modal`](https://web3auth.io/docs/sdk/pnp/web/modal): This package provides main class for using default Web3Auth Modal. The package includes all of our packages and gives you a simple way of implementing Web3Auth within your interface. Additionally, it is a child class of @web3auth/no-modal package.

[Web3Auth Plug and Play NoModal SDK `@web3auth/no-modal`](https://web3auth.io/docs/sdk/pnp/web/no-modal/): Web3Auth Plug and Play No Modal is the main SDK that consists of the core module of Web3Auth Plug and Play. This SDK gives you all the needed modules for implementing the Web3Auth features, giving you the flexibility of implementing your own UI to use all the functionalities.b3Auth SDK working in the backend.

[Web3Auth Backend SDK `@web3auth/node-sdk`](https://web3auth.io/docs/sdk/web-backend/): A simple and easy to use SDK to be used in your Node.js backend to get the same experience of Web3Auth frontend SDKs

## ⚡ Quick Start

### Installation (Web3Auth Backend)

```shell
npm install --save @web3auth/node-sdk
```

### Get your Client ID from Web3Auth Dashboard

Hop on to the [Web3Auth Dashboard](https://dashboard.web3auth.io/) and create a new project. Use the Client ID of the project to start your integration.

![Web3Auth Dashboard](https://github-production-user-asset-6210df.s3.amazonaws.com/6962565/272779464-043f6383-e671-4aa5-80fb-ec87c569e5ab.png)

### Initialize Web3Auth for your preferred blockchain

Web3Auth needs to initialise as soon as your app loads up to enable the user to log in. Preferably done within a constructor, initialisation is the step where you can pass on all the configurations for Web3Auth you want. A simple integration for Ethereum blockchain will look like this:

```js
import { Web3Auth } from "@web3auth/node-sdk";
const { EthereumPrivateKeyProvider } = require("@web3auth/ethereum-provider");

const web3auth = new Web3Auth({
  clientId: "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ", // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: "sapphire_mainnet", // Get your Network from Web3Auth Dashboard
});

const ethereumProvider = new EthereumPrivateKeyProvider({
  config: {
    chainConfig: {
      chainId: "0x1",
      rpcTarget: "https://rpc.ankr.com/eth",
    },
  },
});

web3auth.init({ provider: ethereumProvider });
```

### Login your User

Once you're done initialising, logging in is as easy as:

```js
const provider = await web3auth.connect({
  verifier: "YOUR_VERIFIER_NAME", // replace this with your own verifier name
  verifierId: "VERIFIER_ID_VALUE", // replace with your verifier id's value, for example, sub value of JWT Token, or email address.
  idToken: "JWT_TOKEN", // replace with your newly created unused JWT Token.
});

const eth_private_key = await provider.request({ method: "eth_private_key" });
```

## ⏪ Requirements

- Node 18+

## 🩹 Examples

Checkout the examples for your preferred blockchain and platform in our [pnp examples repository](https://github.com/Web3Auth/web3auth-pnp-examples/) or [core kit examples repository](https://github.com/Web3Auth/web3auth-core-kit-examples/).

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo-app.web3auth.io/) to see how Web3Auth can be used in your application.

Also, checkout the [demo folder](./demo/node-app/) within this repository.

## 💬 Troubleshooting and Discussions

- Have a look at our [Community Portal](https://web3auth.io/community/c/help-core-kit/core-kit-sfa-node/23) if you have any questions/issues related to this SDK.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions
- Join our [Forum](https://web3auth.io/community) to join our community.
