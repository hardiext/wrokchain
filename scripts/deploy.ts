import hre from "hardhat";
import { ethers, ContractFactory } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/alch_TImoDBhlK_g0t-HlIoq2N";
  const privateKey = process.env.PRIVATE_KEY || "1b73f4b8177cfbb7207703d64af1edbbc3d8ddf8f60deb1058c141f6dac98e1f";

  if (!privateKey) {
    throw new Error("PRIVATE_KEY belum diset di .env.local");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

const artifactPath = path.resolve(
  "./artifacts/contracts/WorkChainAgreement.sol/WorkChainAgreement.json"
);

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  console.log("Deploying WorkChainAgreement from:", wallet.address);

  const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`Contract WorkChainAgreement deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});