require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const ALCHEMY_SEPOLIA_URL = process.env.ALCHEMY_SEPOLIA_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: "cancun"
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    ...(PRIVATE_KEY && ALCHEMY_SEPOLIA_URL ? {
      sepolia: {
        url: ALCHEMY_SEPOLIA_URL,
        accounts: [PRIVATE_KEY]
      }
    } : {})
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};