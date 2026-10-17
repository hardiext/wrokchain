import { ethers, ContractFactory } from "ethers";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Muat variabel lingkungan dari .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
    "https://eth-sepolia.g.alchemy.com/v2/alch_TImoDBhlK_g0t-HlIoq2N";
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("PRIVATE_KEY belum diset di .env.local");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Arahkan ke artifact kontrak terbaru WorkChainProtocol
  const artifactPath = path.resolve(
    "./artifacts/contracts/WorkChainProtocol.sol/WorkChainProtocol.json"
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `Artifact tidak ditemukan di: ${artifactPath}. Jalankan 'npx hardhat compile' terlebih dahulu.`
    );
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  console.log("==================================================");
  console.log("Deploying WorkChainProtocol to Sepolia...");
  console.log("Deployer Address:", wallet.address);

  // Parameter constructor WorkChainProtocol:
  // _reviewWindow: 7 hari = 604800 detik
  // _overdueGrace: 14 hari = 1209600 detik
  const reviewWindowSeconds = 604800;
  const overdueGraceSeconds = 1209600;

  const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(reviewWindowSeconds, overdueGraceSeconds);

  console.log("Menunggu konfirmasi blok transaksi...");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("==================================================");
  console.log(`Contract WorkChainProtocol deployed to: ${contractAddress}`);
  console.log("==================================================");
  console.log("Langkah selanjutnya:");
  console.log(`1. Perbarui NEXT_PUBLIC_CONTRACT_ADDRESS di .env.local dengan: ${contractAddress}`);
  console.log("2. Daftarkan baris ini ke tabel contract_deployments di Supabase SQL Editor.");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});