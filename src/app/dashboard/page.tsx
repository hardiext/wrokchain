"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { formatEther } from "viem";
import { 
  ArrowLeft, 
  ArrowRight, 
  FolderKanban, 
  Briefcase, 
  User, 
  Loader2, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  RotateCw
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WORKCHAIN_ABI } from "@/constants/ABI";

interface ProjectItem {
  id: bigint;
  client: string;
  worker: string;
  agreementHash: string;
  totalBudget: bigint;
  milestoneCount: number;
  status: number;
  workerAccepted: boolean;
  createdAt: number;
  completedAt: number;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xDD33AAFbD7bA98FCdA5b04677Ffd0A534c1880e7") as `0x${string}`;

  const [activeTab, setActiveTab] = useState<"all" | "client" | "worker">("all");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // 1. Baca total proyek dari smart contract
  const { data: counterData, refetch: refetchCounter } = useReadContract({
    address: contractAddress,
    abi: WORKCHAIN_ABI,
    functionName: "projectCounter",
  });

  // 2. Tarik daftar proyek milik akun yang terhubung
  const fetchUserProjects = useCallback(async () => {
    if (!publicClient || !address) {
      setProjects([]);
      return;
    }

    setIsLoadingList(true);

    try {
      // Jika counter terbaca gunakan nilai counter, jika tidak gunakan batas aman 20 ID
      const totalCount = counterData ? Number(counterData) : 20;
      const scanLimit = Math.max(totalCount, 5);

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
      const userProjects: ProjectItem[] = [];

      results.forEach((res: any, idx: number) => {
        if (!res) return;

        // Parsing data (baik bentuk named object maupun array tuple)
        const id = res.id ?? res[0] ?? BigInt(idx + 1);
        const client = (res.client ?? res[1] ?? "").toString();
        const worker = (res.worker ?? res[2] ?? "").toString();
        const agreementHash = (res.agreementHash ?? res[3] ?? "").toString();
        const totalBudget = res.totalBudget ?? res[4] ?? BigInt(0);
        const milestoneCount = Number(res.milestoneCount ?? res[5] ?? 0);
        const status = Number(res.status ?? res[6] ?? 0);
        const workerAccepted = Boolean(res.workerAccepted ?? res[7] ?? false);
        const createdAt = Number(res.createdAt ?? res[8] ?? 0);
        const completedAt = Number(res.completedAt ?? res[9] ?? 0);

        // Abaikan data kosong
        if (!client || client.toLowerCase() === "0x0000000000000000000000000000000000000000") return;

        const clientAddr = client.toLowerCase();
        const workerAddr = worker.toLowerCase();
        const currentAddr = address.toLowerCase();

        // Cek keterlibatan dompet
        if (clientAddr === currentAddr || workerAddr === currentAddr) {
          userProjects.push({
            id,
            client,
            worker,
            agreementHash,
            totalBudget,
            milestoneCount,
            status,
            workerAccepted,
            createdAt,
            completedAt,
          });
        }
      });

      // Urutkan dari ID terbesar (terbaru)
      setProjects(userProjects.sort((a, b) => Number(b.id - a.id)));
    } catch (err) {
      console.error("Gagal menarik data proyek di dashboard:", err);
    } finally {
      setIsLoadingList(false);
    }
  }, [counterData, publicClient, address, contractAddress]);

  useEffect(() => {
    fetchUserProjects();
  }, [fetchUserProjects]);

  const handleManualRefresh = () => {
    refetchCounter();
    fetchUserProjects();
  };

  const filteredProjects = projects.filter((p) => {
    if (!address) return false;
    const current = address.toLowerCase();
    if (activeTab === "client") return p.client.toLowerCase() === current;
    if (activeTab === "worker") return p.worker.toLowerCase() === current;
    return true;
  });

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Menunggu Tanda Tangan
          </span>
        );
      case 1:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Berjalan
          </span>
        );
      case 2:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Selesai
          </span>
        );
      case 3:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Sengketa (Dispute)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white selection:bg-indigo-600 font-sans">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-zinc-900">
        <Link href="/" className="font-extrabold text-xl tracking-tight uppercase">
          WORKCHAIN<span className="text-indigo-500">.</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Beranda
          </Link>
          <div className="scale-90 origin-right">
            <ConnectButton accountStatus="avatar" chainStatus="icon" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block mb-1">
              Dasbor Portofolio
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white">Daftar Kontrak Saya</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Kelola seluruh proyek yang terikat dengan dompet on-chain Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={isLoadingList}
              className="p-2.5 rounded-full border border-zinc-800 bg-[#14151b] hover:bg-zinc-800 text-zinc-300 transition"
              title="Refresh Data On-Chain"
            >
              <RotateCw className={`h-4 w-4 ${isLoadingList ? "animate-spin text-indigo-400" : ""}`} />
            </button>
            <Link
              href="/create"
              className="px-6 py-3 rounded-full bg-[#5b50f6] hover:bg-[#4d42ec] text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/25 inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Inisiasi Kontrak Baru
            </Link>
          </div>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-4 mb-8 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-full transition ${
              activeTab === "all" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            Semua ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab("client")}
            className={`px-4 py-2 rounded-full transition ${
              activeTab === "client" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            Sebagai Klien ({projects.filter((p) => p.client.toLowerCase() === address?.toLowerCase()).length})
          </button>
          <button
            onClick={() => setActiveTab("worker")}
            className={`px-4 py-2 rounded-full transition ${
              activeTab === "worker" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            Sebagai Worker ({projects.filter((p) => p.worker.toLowerCase() === address?.toLowerCase()).length})
          </button>
        </div>

        {/* State: Dompet Belum Konek */}
        {!isConnected && (
          <div className="p-12 bg-[#14151b] border border-zinc-800 rounded-3xl text-center max-w-md mx-auto space-y-4">
            <FolderKanban className="h-10 w-10 text-zinc-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Dompet Belum Terhubung</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Hubungkan wallet Web3 Anda untuk memuat daftar kontrak kerja.
            </p>
          </div>
        )}

        {/* State: Loading */}
        {isConnected && isLoadingList && projects.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-xs font-mono text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-3" />
            <span>Memindai riwayat smart contract on-chain...</span>
          </div>
        )}

        {/* State: Kosong */}
        {isConnected && !isLoadingList && filteredProjects.length === 0 && (
          <div className="p-12 bg-[#14151b] border border-zinc-800 rounded-3xl text-center max-w-md mx-auto space-y-4">
            <FolderKanban className="h-10 w-10 text-zinc-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Belum Ada Kontrak</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tidak ditemukan kontrak aktif yang melibatkan dompet ini pada kategori terpilih.
            </p>
            <Link
              href="/create"
              className="inline-block px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition"
            >
              Mulai Buat Kesepakatan
            </Link>
          </div>
        )}

        {/* State: Daftar Kontrak Ditemukan */}
        {isConnected && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => {
              const isUserClient = proj.client.toLowerCase() === address?.toLowerCase();
              return (
                <div
                  key={proj.id.toString()}
                  className="bg-[#14151b] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-500 font-bold">
                        #{proj.id.toString()}
                      </span>
                      {getStatusBadge(proj.status)}
                    </div>

                    <div className="border-b border-zinc-800/80 pb-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-zinc-400">Total Escrow</span>
                        <span className="text-lg font-bold font-mono text-white">
                          {formatEther(proj.totalBudget)} ETH
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-indigo-400 block mt-1">
                        {proj.milestoneCount} Tahapan Deliverables
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] font-mono text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span className="text-zinc-500">Klien:</span>
                        <span className="text-zinc-300 truncate">
                          {isUserClient ? "Anda" : proj.client}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span className="text-zinc-500">Worker:</span>
                        <span className="text-zinc-300 truncate">
                          {!isUserClient ? "Anda" : proj.worker}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/project/${proj.id.toString()}`}
                    className="w-full py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                  >
                    Buka Rincian Kontrak <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}