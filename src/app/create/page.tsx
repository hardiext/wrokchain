"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, isAddress, parseEventLogs } from "viem";
import { ArrowLeft, ArrowRight, Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WORKCHAIN_ABI } from "@/constants/ABI";

interface MilestoneInput {
  title: string;
  amount: string;
}

export default function CreateAgreementPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();

  const [workerAddress, setWorkerAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectScope, setProjectScope] = useState("");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "Milestone 1: Analisis & Desain Solusi", amount: "0.01" },
    { title: "Milestone 2: Implementasi & Testing", amount: "0.02" },
  ]);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && receipt) {
      try {
        const logs = parseEventLogs({
          abi: WORKCHAIN_ABI,
          eventName: "ProjectCreated",
          logs: receipt.logs,
        });

        if (logs.length > 0) {
          const newId = logs[0].args.projectId.toString();
          setCreatedProjectId(newId);
        }
      } catch (err) {
        console.error("Gagal membaca log transaksi:", err);
      }
    }
  }, [isSuccess, receipt]);

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { title: `Milestone ${milestones.length + 1}: `, amount: "0.01" },
    ]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length === 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof MilestoneInput, value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const totalEth = milestones.reduce((sum, m) => {
    const val = parseFloat(m.amount) || 0;
    return sum + val;
  }, 0);

  const isFormValid =
    isConnected &&
    isAddress(workerAddress) &&
    projectTitle.trim().length > 0 &&
    projectScope.trim().length > 0 &&
    totalEth > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setCreatedProjectId(null);

    if (!isConnected) {
      setErrorMessage("Silakan hubungkan dompet (wallet) Anda terlebih dahulu.");
      return;
    }

    if (!isAddress(workerAddress)) {
      setErrorMessage("Alamat dompet worker tidak valid (format 0x...).");
      return;
    }

    if (workerAddress.toLowerCase() === address?.toLowerCase()) {
      setErrorMessage("Alamat worker tidak boleh sama dengan dompet inisiator.");
      return;
    }

    try {
      const summaryPayload = JSON.stringify({
        title: projectTitle.trim(),
        scope: projectScope.trim(),
        timestamp: Date.now(),
      });
      const agreementHash = `hash_${btoa(unescape(encodeURIComponent(summaryPayload))).slice(0, 32)}`;

      const titles = milestones.map((m) => m.title.trim());
      const amounts = milestones.map((m) => parseEther(m.amount || "0"));
      const totalDeposit = parseEther(totalEth.toFixed(6));

      writeContract({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "createProject",
        args: [workerAddress as `0x${string}`, agreementHash, titles, amounts],
        value: totalDeposit,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memproses transaksi kontrak.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white selection:bg-indigo-600 font-sans">
      {/* Navbar */}
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

      {/* Main Container Split */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Kolom Kiri: Formulir Input */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block mb-2">
                Draft Agreement
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Buat Kontrak Pekerjaan
              </h1>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Tentukan pihak pekerja, deskripsi tugas, dan nominal termin milestone. Dana dialokasikan ke kontrak escrow independen.
              </p>
            </div>

            {/* Banner Transaksi Sukses */}
            {isSuccess && (
              <div className="p-6 bg-[#14151b] border border-emerald-500/40 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Kontrak Berhasil Diterbitkan On-Chain!</span>
                </div>
                <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl font-mono text-xs space-y-1">
                  <p className="text-zinc-500">Nomor Kontrak Anda:</p>
                  <p className="text-2xl font-black text-white">{createdProjectId ? `#${createdProjectId}` : "Mengekstrak ID..."}</p>
                  <p className="text-[11px] text-zinc-400 pt-1 break-all">Tx Hash: {hash}</p>
                </div>
                {createdProjectId && (
                  <button
                    type="button"
                    onClick={() => router.push(`/project/${createdProjectId}`)}
                    className="w-full py-3 rounded-full bg-[#5b50f6] hover:bg-[#4d42ec] text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
                  >
                    Buka Halaman Proyek <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Banner Error */}
            {errorMessage && (
              <div className="p-4 bg-red-950/30 border border-red-800/60 text-red-300 text-xs rounded-xl flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Alamat Dompet Worker (Freelancer)
                </label>
                <input
                  type="text"
                  placeholder="0x1234...abcd"
                  value={workerAddress}
                  onChange={(e) => setWorkerAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-[#14151b] border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Nama Proyek
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pembuatan Modul Smart Contract & DApp"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-[#14151b] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Ruang Lingkup Pekerjaan (Scope of Work)
                </label>
                <textarea
                  rows={4}
                  placeholder="Deskripsikan ruang lingkup deliverable, format berkas, serta kriteria penerimaan..."
                  value={projectScope}
                  onChange={(e) => setProjectScope(e.target.value)}
                  className="w-full px-4 py-3 bg-[#14151b] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed transition"
                  required
                />
              </div>

              {/* Rincian Milestone Dinamis */}
              <div className="space-y-4 pt-4 border-t border-zinc-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Termin Milestone</h3>
                    <p className="text-xs text-zinc-400">Pembayaran dilepas secara bertahap saat deliverable disetujui.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah Tahap
                  </button>
                </div>

                <div className="space-y-3">
                  {milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#14151b] border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs"
                    >
                      <span className="font-mono text-zinc-500 w-6 shrink-0">#{idx + 1}</span>
                      <input
                        type="text"
                        placeholder="Deskripsi tugas termin..."
                        value={m.title}
                        onChange={(e) => updateMilestone(idx, "title", e.target.value)}
                        className="flex-1 w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                      <div className="flex items-center gap-2 w-full sm:w-36 shrink-0">
                        <input
                          type="number"
                          step="0.001"
                          min="0.0001"
                          placeholder="0.00"
                          value={m.amount}
                          onChange={(e) => updateMilestone(idx, "amount", e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-right text-white focus:outline-none focus:border-indigo-500"
                          required
                        />
                        <span className="font-mono text-zinc-400 font-semibold">ETH</span>
                      </div>
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMilestone(idx)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!isFormValid || isPending || isConfirming}
                  className="w-full py-4 rounded-full bg-[#5b50f6] hover:bg-[#4d42ec] disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isPending ? "Menunggu Konfirmasi Dompet..." : "Memvalidasi di Blok..."}</span>
                    </>
                  ) : !isConnected ? (
                    "Hubungkan Dompet Terlebih Dahulu"
                  ) : (
                    `Inisiasi & Deposit ${totalEth.toFixed(4)} ETH`
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Kolom Kanan: Live Showcase Preview Card (Sama seperti Landing Page) */}
          <div className="lg:col-span-5 relative flex justify-center lg:sticky lg:top-24">
            <div className="w-full max-w-[380px] bg-[#14151b] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider">
                  Live Contract Preview
                </span>
                <span className="px-3 py-1 bg-black/60 rounded-full text-[10px] font-medium text-zinc-300 border border-white/10">
                  {milestones.length} Tahapan
                </span>
              </div>

              <div className="relative w-full h-[220px] rounded-xl overflow-hidden bg-zinc-950">
                <Image
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop"
                  alt="Contract Preview"
                  fill
                  priority
                  className="object-cover object-center"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white tracking-tight truncate">
                  {projectTitle.trim() || "Nama Kontrak Baru"}
                </h3>

                <div className="flex justify-between items-baseline border-b border-zinc-800/80 pb-3">
                  <span className="text-xs text-zinc-400">Total Komitmen Escrow</span>
                  <span className="text-base font-bold text-white font-mono">
                    {totalEth.toFixed(4)} ETH
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px] text-zinc-400">
                  <div className="flex justify-between">
                    <span>Inisiator:</span>
                    <span className="text-zinc-200">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Penerima:</span>
                    <span className="text-zinc-200">{workerAddress ? `${workerAddress.slice(0, 6)}...${workerAddress.slice(-4)}` : "Belum ditentukan"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}