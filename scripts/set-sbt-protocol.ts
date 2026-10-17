import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!;
  const privateKey = process.env.PRIVATE_KEY!;
  const sbtAddress = process.env.NEXT_PUBLIC_SBT_CONTRACT_ADDRESS!;
  const protocolAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const artifactPath = path.resolve(
    "./artifacts/contracts/WorkChainReputation.sol/WorkChainReputation.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const sbtContract = new ethers.Contract(sbtAddress, artifact.abi, wallet);

  console.log("Menghubungkan Protokol ke SBT...");
  console.log("SBT Address:", sbtAddress);
  console.log("Protocol Address:", protocolAddress);

  const tx = await sbtContract.setProtocolContract(protocolAddress);
  await tx.wait();

  console.log("Berhasil! Protokol resmi diizinkan melakukan minting SBT.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});