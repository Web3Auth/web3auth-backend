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

## 💭 Choosing Between SDKs

For using Web3Auth in the web, you have two choices of SDKs to get started with.

[Web3Auth Plug and Play UI SDK `@web3auth/modal`](https://web3auth.io/docs/sdk/web/web3auth/): A simple and easy to use SDK that will give you a simple modular way of implementing Web3Auth directly within your application. You can use the pre-configured Web3Auth Modal UI and whitelabel it according to your needs.

[Web3Auth Plug and Play Core SDK `@web3auth/core`](https://web3auth.io/docs/sdk/web/core/): The core module implemeting all the Web3Auth features you need and giving you the flexibilty of using your own UI with the Web3Auth SDK working in the backend.

[Web3Auth Backend SDK `@web3auth/node-sdk`](https://web3auth.io/docs/sdk/web-backend/): A simple and easy to use SDK to be used in your Node.js backend to get the same experience of Web3Auth frontend SDKs

## ⚡ Quick Start

### Installation (Web3Auth Backend)

```shell
npm install --save @web3auth/node-sdk
```

### Get your Client ID from Web3Auth Dashboard

Hop on to the [Web3Auth Dashboard](https://dashboard.web3auth.io/) and create a new project. Use the Client ID of the project to start your integration.

![Web3Auth Dashboard](https://web3auth.io/docs/assets/images/project_plug_n_play-89c39ec42ad993107bb2485b1ce64b89.png)

### Initialize Web3Auth for your preferred blockchain

Web3Auth needs to initialise as soon as your app loads up to enable the user to log in. Preferably done within a constructor, initialisation is the step where you can pass on all the configurations for Web3Auth you want. A simple integration for Ethereum blockchain will look like this:

```js
import { Web3Auth } from "@web3auth/node-sdk";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

//Initialize within your constructor
const web3auth = new Web3Auth({
  clientId: "", // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: "mainnet",
  usePnPKey: false, // Setting this to true returns the same key as PnP Web SDK. 
  // By default, this SDK returns CoreKitKey.
});

const chainConfig: {
  displayName: "ETH Mainnet",
  blockExplorer: "https://etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  chainId: "0x1",
  rpcTarget: "https://rpc.ankr.com/eth", // needed for non-other chains
};

const provider = new EthereumPrivateKeyProvider({ config: { chainConfig } })

web3auth.init({ provider });
```

### Login your User

Once you're done initialising, logging in is as easy as:

```js
await web3auth.connect({
  verifier: "verifier-name",
  verifierId: "verifier-Id",
  idToken: "JWT Token",
});
```

## ⏪ Requirements

- Node 14+

## 🩹 Examples

Checkout the examples for your preferred blockchain and platform in our [examples repository](https://github.com/Web3Auth/examples/)

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo-app.web3auth.io/) to see how Web3Auth can be used in your application.

Further checkout the [demo folder](https://github.com/Web3Auth/Web3Auth-backend/tree/master/demo) within `web3auth-backend` repository, which contains a Node.js example.

Also, checkout the [demo folder](https://github.com/Web3Auth/Web3Auth/tree/master/demo) within `web3auth-web` repository, which contains other hosted demos for different usecases.

## 💬 Troubleshooting and Discussions

- Have a look at our [GitHub Discussions](https://github.com/Web3Auth/Web3Auth/discussions?discussions_q=sort%3Atop) to see if anyone has any questions or issues you might be having.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions
- Join our [Discord](https://discord.gg/web3auth) to join our community and get private integration support or help with your integration.
