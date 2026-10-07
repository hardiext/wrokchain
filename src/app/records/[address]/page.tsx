"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { usePublicClient, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { 
  Briefcase, 
  CheckCircle2, 
  ExternalLink, 
  ArrowLeft, 
  Loader2, 
  Award, 
  ShieldCheck, 
  FolderCheck 
} from "lucide-react";
import { WORKCHAIN_ABI } from "@/constants/ABI";

interface CompletedRecord {
  id: bigint;
  client: string;
  totalBudget: bigint;
  milestoneCount: number;
  completedAt: number;
}

export default function WorkRecordPortfolioPage({ params }: { params: Promise<{ address: string }> }) {
  const resolvedParams = use(params);
  const workerAddress = resolvedParams.address.toLowerCase();
  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xDD33AAFbD7bA98FCdA5b04677Ffd0A534c1880e7") as `0x${string}`;
  const publicClient = usePublicClient();

  const [completedList, setCompletedList] = useState<CompletedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Baca counter proyek
  const { data: counterData } = useReadContract({
    address: contractAddress,
    abi: WORKCHAIN_ABI,
    functionName: "projectCounter",
  });

  useEffect(() => {
    async function scanCompletedProjects() {
      if (!publicClient) return;

      setIsLoading(true);
      try {
        const total = counterData ? Number(counterData) : 25;
        const scanLimit = Math.max(total, 5);

        const calls = [];
        for (let i = 1; i <= scanLimit; i++) {
          calls.push(
            publicClient.readContract({
              address: contractAddress,
              abi: WORKCHAIN_ABI,
              functionName: "projects",
              args: [BigInt(i)],
            }).catch(() => null)
          );
        }

        const results = await Promise.all(calls);
        const verified: CompletedRecord[] = [];

        results.forEach((res: any, idx: number) => {
          if (!res) return;
          const id = res.id ?? res[0] ?? BigInt(idx + 1);
          const client = (res.client ?? res[1] ?? "").toString();
          const worker = (res.worker ?? res[2] ?? "").toString();
          const totalBudget = res.totalBudget ?? res[4] ?? BigInt(0);
          const milestoneCount = Number(res.milestoneCount ?? res[5] ?? 0);
          const status = Number(res.status ?? res[6] ?? 0);
          const completedAt = Number(res.completedAt ?? res[9] ?? 0);

          // Filter: Proyek berstatus COMPLETED (status 2) yang dikerjakan oleh workerAddress ini
          if (status === 2 && worker.toLowerCase() === workerAddress) {
            verified.push({
              id,
              client,
              totalBudget,
              milestoneCount,
              completedAt,
            });
          }
        });

        setCompletedList(verified.reverse());
      } catch (err) {
        console.error("Gagal menarik rekam portofolio:", err);
      } finally {
        setIsLoading(false);
      }
    }

    scanCompletedProjects();
  }, [counterData, publicClient, workerAddress, contractAddress]);

  // Kalkulasi total akumulasi pendapatan verified
  const totalEarned = completedList.reduce((acc, curr) => acc + curr.totalBudget, BigInt(0));

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white selection:bg-indigo-600 font-sans py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Navigasi */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
          <Link href="/" className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5 font-medium">
            <ArrowLeft className="h-3.5 w-3.5" /> Beranda WorkChain
          </Link>
          <span className="text-[11px] font-mono text-zinc-400">
            Verifiable Portfolio Profile
          </span>
        </div>

        {/* Profil Header Card */}
        <div className="bg-[#14151b] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xl">
                <Award className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">Rekam Portofolio Terverifikasi</h1>
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <p className="text-xs font-mono text-zinc-400 break-all pt-0.5">{workerAddress}</p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
              <span className="text-[10px] text-zinc-500 block">KONTRAK TUNTAS</span>
              <p className="text-2xl font-bold text-white">{completedList.length}</p>
              <span className="text-[10px] text-emerald-400 block">100% Selesai Disetujui</span>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
              <span className="text-[10px] text-zinc-500 block">TOTAL VOLUME PEMBAYARAN</span>
              <p className="text-2xl font-bold text-emerald-400">{formatEther(totalEarned)} ETH</p>
              <span className="text-[10px] text-zinc-500 block">Diterima Tanpa Sengketa</span>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
              <span className="text-[10px] text-zinc-500 block">VALIDASI LEDGER</span>
              <p className="text-sm font-bold text-zinc-200">Ethereum Sepolia</p>
              <span className="text-[10px] text-indigo-400 block">Tamper-Proof Proofs</span>
            </div>
          </div>
        </div>

        {/* Daftar Kontrak Sukses */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FolderCheck className="h-5 w-5 text-emerald-400" /> Riwayat Pekerjaan Sukses ({completedList.length})
          </h2>

          {isLoading && (
            <div className="py-16 text-center text-xs font-mono text-zinc-400 flex flex-col items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-2" />
              <span>Memindai portofolio on-chain...</span>
            </div>
          )}

          {!isLoading && completedList.length === 0 && (
            <div className="p-10 bg-[#14151b] border border-zinc-800 rounded-2xl text-center text-xs text-zinc-400 space-y-2">
              <Briefcase className="h-8 w-8 text-zinc-600 mx-auto" />
              <p className="font-semibold text-zinc-300">Belum Ada Rekam Kontrak Selesai</p>
              <p className="text-[11px] text-zinc-500">
                Alamat dompet ini belum menyelesaikan proyek berstatus Completed di smart contract WorkChain.
              </p>
            </div>
          )}

          {!isLoading && completedList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedList.map((item) => {
                const dateStr = item.completedAt ? new Date(item.completedAt * 1000).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "-";
                return (
                  <div
                    key={item.id.toString()}
                    className="p-5 bg-[#14151b] border border-zinc-800 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-zinc-500 font-bold">Proyek #{item.id.toString()}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          ✓ Lunas & Selesai
                        </span>
                      </div>

                      <div className="border-b border-zinc-800/80 pb-2">
                        <span className="text-[11px] text-zinc-400 block">Nilai Kontrak:</span>
                        <p className="text-lg font-bold font-mono text-white">{formatEther(item.totalBudget)} ETH</p>
                      </div>

                      <div className="font-mono text-[11px] text-zinc-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Klien:</span>
                          <span className="text-zinc-300 truncate max-w-[150px]">{item.client}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tahapan Deliverable:</span>
                          <span className="text-zinc-200">{item.milestoneCount} Milestone</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Selesai Pada:</span>
                          <span className="text-zinc-200">{dateStr}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/verify/${item.id.toString()}`}
                      className="w-full py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      Buka Sertifikat Verifikasi <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}