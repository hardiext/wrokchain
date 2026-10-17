import { ethers, ContractFactory } from "ethers";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
    "https://eth-sepolia.g.alchemy.com/v2/alch_TImoDBhlK_g0t-HlIoq2N";
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) throw new Error("PRIVATE_KEY belum diset.");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const artifactPath = path.resolve(
    "./artifacts/contracts/WorkChainReputation.sol/WorkChainReputation.json"
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error("Artifact belum ada. Jalankan 'npx hardhat compile' terlebih dahulu.");
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));


  console.log("Deploying WorkChainReputation (SBT) to Sepolia...");
  console.log("Deployer:", wallet.address);

  const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("WorkChainReputation Deployed to:", contractAddress);

  console.log("Tambahkan ke .env.local:");
  console.log(`NEXT_PUBLIC_SBT_CONTRACT_ADDRESS="${contractAddress}"`);
}

main().catch((error) => {
  console.error("Deploy failed:", error);
  process.exitCode = 1;
});