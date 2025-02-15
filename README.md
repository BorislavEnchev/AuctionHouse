## Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [Hardhat](https://hardhat.org/)
- Metamask (for interacting with deployed contracts)

## Installation

1. Install dependencies:

```sh
$ npm install
$ npm install hardhat
$ npm install dotenv
```

2. Create .env file

## Compilation

Compile the smart contracts using Hardhat:

```sh
$ npx hardhat compile
```

## Running Tests

Execute unit tests to validate the contract functionality:

```sh
$ npx hardhat test
```

## Deployment Steps

To deploy the contracts on Sepolia:

1. Set up an `.env` file with your Alchemy API key and Metamask private key:

```sh
SEPOLIA_URL=your-sepolia-url
PRIVATE_KEY=your-private-key
ETHERSCAN_API_KEY=your-etherscan-api-key
```

2. Run the deployment script:

```sh
$ npx hardhat deploy --owner <nft-owner-address> --network sepolia
```

3. The deployed contract addresses will be displayed in the console.

## Deployment parameters
- `owner`: address of NFT contract owner

## Verified Contracts

### Etherscan
- **NFT** [Etherscan Link](https://sepolia.etherscan.io/address/0x35415246b5079685C286AC237151a6A2dDc8C3BD#code)
- **AuctionHouse** [Etherscan Link](https://sepolia.etherscan.io/address/0x0bfBFa837047869e7BDf6d824A4abB3Ec4b4831E#code)

### Sourcify
- **NFT** [Sourcify Link](https://repo.sourcify.dev/contracts/full_match/11155111/0x35415246b5079685C286AC237151a6A2dDc8C3BD/)
- **AuctionHouse** [Sourcify Link](https://repo.sourcify.dev/contracts/full_match/11155111/0x0bfBFa837047869e7BDf6d824A4abB3Ec4b4831E/)

## License

This project is licensed under the MIT License.
