import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [],
  solidity: {
    profiles: {
      default: {
        compilers: [
          {
            version: "0.8.24",
            settings: {
              evmVersion: "cancun", 
              viaIR: true,
              optimizer: {
                enabled: true,
                runs: 200,
              },
            },
          },
        ],
      },
      production: {
        compilers: [
          {
            version: "0.8.24",
            settings: {
              evmVersion: "cancun",
              viaIR: true,
              optimizer: {
                enabled: true,
                runs: 200,
              },
            },
          },
        ],
      },
    },
  },
  networks: {
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
});