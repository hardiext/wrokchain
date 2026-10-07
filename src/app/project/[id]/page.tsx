"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt 
} from "wagmi";
import { formatEther } from "viem";
import { 
  ArrowLeft, 
  ExternalLink, 
  Loader2, 
  Clock, 
  Check, 
  AlertTriangle, 
  LayoutDashboard 
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WORKCHAIN_ABI } from "@/constants/ABI";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = BigInt(resolvedParams.id || "0");
  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;
  
  const { address } = useAccount();

  const [activeMilestoneIndex, setActiveMilestoneIndex] = useState<number | null>(null);
  const [proofInput, setProofInput] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  // 1. Baca Data Proyek dari Smart Contract
  const { 
    data: projectData, 
    isLoading: isProjectLoading, 
    refetch: refetchProject 
  } = useReadContract({
    address: contractAddress,
    abi: WORKCHAIN_ABI,
    functionName: "projects",
    args: [projectId],
  });

  const { data: txHash, writeContract, isPending: isTxPending } = useWriteContract();
  const { isLoading: isWaitingTx, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ 
    hash: txHash,
  });

  if (isTxSuccess) {
    refetchProject();
  }

  const project = projectData ? {
    id: projectData[0],
    client: projectData[1],
    worker: projectData[2],
    agreementHash: projectData[3],
    totalBudget: projectData[4],
    milestoneCount: Number(projectData[5]),
    status: Number(projectData[6]), // 0: Created, 1: Active, 2: Completed, 3: Disputed
    workerAccepted: projectData[7],
    createdAt: Number(projectData[8]),
    completedAt: Number(projectData[9]),
  } : null;

  const isClient = address?.toLowerCase() === project?.client?.toLowerCase();
  const isWorker = address?.toLowerCase() === project?.worker?.toLowerCase();
  const isParticipant = isClient || isWorker;

  // Aksi Smart Contract
  const handleAcceptAgreement = () => {
    writeContract({
      address: contractAddress,
      abi: WORKCHAIN_ABI,
      functionName: "acceptAgreement",
      args: [projectId],
    });
  };

  const handleSubmitProof = (e: React.FormEvent, index: number) => {
    e.preventDefault();
    if (!proofInput.trim()) return;

    writeContract({
      address: contractAddress,
      abi: WORKCHAIN_ABI,
      functionName: "submitMilestone",
      args: [projectId, BigInt(index), proofInput.trim()],
    });
    setActiveMilestoneIndex(null);
    setProofInput("");
  };

  const handleApproveMilestone = (index: number) => {
    writeContract({
      address: contractAddress,
      abi: WORKCHAIN_ABI,
      functionName: "approveMilestone",
      args: [projectId, BigInt(index)],
    });
  };

  const handleRaiseDispute = () => {
    writeContract({
      address: contractAddress,
      abi: WORKCHAIN_ABI,
      functionName: "raiseDispute",
      args: [projectId],
    });
    setShowDisputeModal(false);
  };

  if (isProjectLoading) {
    return (
      <div className="min-h-screen bg-[#0d0e12] text-zinc-400 flex items-center justify-center text-xs font-mono">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-indigo-500" />
        Memuat data kontrak dari blockchain...
      </div>
    );
  }

  if (!project || project.client === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="min-h-screen bg-[#0d0e12] text-white p-8 flex flex-col items-center justify-center">
        <p className="font-mono text-xs text-zinc-500 mb-1">404 NOT FOUND</p>
        <h1 className="text-xl font-bold mb-2">Kontrak #{resolvedParams.id} Tidak Ditemukan</h1>
        <p className="text-zinc-400 text-xs mb-6">Nomor ID proyek ini belum pernah tercatat di smart contract.</p>
        <Link href="/dashboard" className="px-6 py-2.5 rounded-full bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const statusLabel = [
    "Menunggu Tanda Tangan Worker", 
    "Aktif & Berjalan", 
    "Selesai Penuh", 
    "Dalam Sengketa (Dispute)"
  ][project.status];

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white selection:bg-indigo-600 font-sans">
      {/* Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-zinc-900">
        <Link href="/" className="font-extrabold text-xl tracking-tight uppercase">
          WORKCHAIN<span className="text-indigo-500">.</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <div className="scale-90 origin-right">
            <ConnectButton accountStatus="avatar" chainStatus="icon" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Kolom Kiri: Showcase Card Kontrak */}
          <div className="lg:col-span-5 relative flex justify-center lg:sticky lg:top-24">
            <div className="w-full max-w-[380px] bg-[#14151b] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider">
                  Work Record Ledger
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-semibold border ${
                  project.status === 3 
                    ? "bg-red-500/10 text-red-400 border-red-500/30" 
                    : "bg-black/60 text-zinc-300 border-white/10"
                }`}>
                  {statusLabel}
                </span>
              </div>

              <div className="relative w-full h-[220px] rounded-xl overflow-hidden bg-zinc-950">
                <Image
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop"
                  alt="Contract Header"
                  fill
                  priority
                  className="object-cover object-center"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Kontrak #{project.id.toString()}
                </h3>

                <div className="flex justify-between items-baseline border-b border-zinc-800/80 pb-3">
                  <span className="text-xs text-zinc-400">Total Escrow</span>
                  <span className="text-lg font-bold text-white font-mono">
                    {formatEther(project.totalBudget)} ETH
                  </span>
                </div>

                <div className="space-y-2 font-mono text-[11px] text-zinc-400 pt-1">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">KLIEN</span>
                    <p className="text-zinc-200 break-all select-all">{project.client}</p>
                    {isClient && <span className="text-indigo-400 text-[10px]">● Dompet Anda</span>}
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">WORKER</span>
                    <p className="text-zinc-200 break-all select-all">{project.worker}</p>
                    {isWorker && <span className="text-emerald-400 text-[10px]">● Dompet Anda</span>}
                  </div>
                  <div className="pt-1">
                    <span className="text-zinc-500 block text-[10px]">PROOF DIGEST</span>
                    <p className="text-zinc-400 text-[10px] break-all">{project.agreementHash}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Milestone Tracker & Dispute Action */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block mb-1">
                  Operational Tracking
                </span>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  Verifikasi Tahapan Kerja
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                  Pantau penyerahan bukti deliverable dan pencairan dana on-chain.
                </p>
              </div>

              {/* Tombol Ajukan Sengketa (Hanya jika Proyek Aktif & User adalah Peserta) */}
              {project.status === 1 && isParticipant && (
                <button
                  onClick={() => setShowDisputeModal(true)}
                  disabled={isTxPending || isWaitingTx}
                  className="px-4 py-2 rounded-full border border-red-500/40 bg-red-950/30 hover:bg-red-900/40 text-red-400 font-semibold text-xs transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Ajukan Sengketa
                </button>
              )}
            </div>
            <Link href={`/verify/${project.id}`}>Sertifikat</Link>
            </div>

            {/* Banner Khusus Dispute Status */}
            {project.status === 3 && (
              <div className="p-5 bg-red-950/20 border border-red-800/60 rounded-2xl flex items-start gap-3 text-xs text-red-300">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-red-200">Kontrak Dalam Status Sengketa (Dispute Flagged)</p>
                  <p className="text-zinc-400 mt-1">
                    Operasi pelepasan dana ditahan sementara karena adanya klaim keberatan dari salah satu pihak. Seluruh riwayat bukti milestone dan agreement hash terkunci untuk proses audit.
                  </p>
                </div>
              </div>
            )}

            {/* Notifikasi Transaksi Berjalan */}
            {(isTxPending || isWaitingTx) && (
              <div className="p-4 bg-[#14151b] border border-indigo-500/40 rounded-xl flex items-center gap-3 text-xs text-indigo-300">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Memproses transaksi pada blok jaringan... Harap tunggu beberapa saat.</span>
              </div>
            )}

            {/* Action Banner: Worker Sign Agreement */}
            {project.status === 0 && isWorker && (
              <div className="p-5 bg-[#14151b] border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-white">Perjanjian Menunggu Persetujuan Anda</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Tandatangani kontrak secara digital untuk mengaktifkan status proyek.</p>
                </div>
                <button
                  onClick={handleAcceptAgreement}
                  disabled={isTxPending || isWaitingTx}
                  className="px-6 py-2.5 rounded-full bg-[#5b50f6] hover:bg-[#4d42ec] text-white font-semibold text-xs transition shrink-0"
                >
                  Setujui & Terima
                </button>
              </div>
            )}

            {/* List Milestones */}
            <div className="space-y-4">
              {Array.from({ length: project.milestoneCount }).map((_, index) => (
                <MilestoneItemRow
                  key={index}
                  projectId={projectId}
                  index={index}
                  contractAddress={contractAddress}
                  projectStatus={project.status}
                  isClient={isClient}
                  isWorker={isWorker}
                  isTxPending={isTxPending || isWaitingTx}
                  onOpenSubmit={(idx) => setActiveMilestoneIndex(idx)}
                  onApprove={(idx) => handleApproveMilestone(idx)}
                />
              ))}
            </div>

            {/* Modal Input Bukti Milestone */}
            {activeMilestoneIndex !== null && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#14151b] border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Kirim Bukti — Milestone #{activeMilestoneIndex + 1}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Masukkan URL repositori GitHub, berkas IPFS, atau dokumen hasil deliverable.
                    </p>
                  </div>

                  <form onSubmit={(e) => handleSubmitProof(e, activeMilestoneIndex)} className="space-y-4 text-xs">
                    <input
                      type="text"
                      placeholder="https://... atau ipfs://..."
                      value={proofInput}
                      onChange={(e) => setProofInput(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-white focus:outline-none focus:border-indigo-500"
                      autoFocus
                      required
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveMilestoneIndex(null)}
                        className="px-5 py-2.5 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-900 transition text-xs font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isTxPending || isWaitingTx}
                        className="px-6 py-2.5 rounded-full bg-[#5b50f6] text-white hover:bg-[#4d42ec] transition text-xs font-semibold shadow-md"
                      >
                        Submit On-Chain
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal Konfirmasi Pengajuan Dispute */}
            {showDisputeModal && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#14151b] border border-red-900/60 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <h3 className="text-base font-bold text-white">Konfirmasi Pengajuan Sengketa</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Pengajuan dispute akan mengunci status kontrak ini menjadi <strong>Disputed</strong> di smart contract. Pelepasan dana per milestone akan ditangguhkan hingga bukti ditinjau bersama.
                  </p>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDisputeModal(false)}
                      className="px-5 py-2.5 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-900 transition text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleRaiseDispute}
                      disabled={isTxPending || isWaitingTx}
                      className="px-6 py-2.5 rounded-full bg-red-600 text-white hover:bg-red-500 transition text-xs font-semibold shadow-md"
                    >
                      Tandai Dispute
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

function MilestoneItemRow({
  projectId,
  index,
  contractAddress,
  projectStatus,
  isClient,
  isWorker,
  isTxPending,
  onOpenSubmit,
  onApprove,
}: {
  projectId: bigint;
  index: number;
  contractAddress: `0x${string}`;
  projectStatus: number;
  isClient: boolean;
  isWorker: boolean;
  isTxPending: boolean;
  onOpenSubmit: (index: number) => void;
  onApprove: (index: number) => void;
}) {
  const { data: milestoneData } = useReadContract({
    address: contractAddress,
    abi: WORKCHAIN_ABI,
    functionName: "getMilestone",
    args: [projectId, BigInt(index)],
  });

  if (!milestoneData) return null;

  const [title, amount, status, submissionProofHash] = milestoneData;

  const statusMap = [
    { text: "Pending", style: "text-zinc-400 bg-zinc-900 border-zinc-800" },
    { text: "Submitted (Review)", style: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    { text: "Approved & Terbayar", style: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  ];

  return (
    <div className="p-5 bg-[#14151b] border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1.5 max-w-sm">
        <div className="flex items-center gap-2">
          <span className="font-mono text-zinc-500 text-xs font-semibold">#{index + 1}</span>
          <h4 className="font-bold text-white text-sm">{title}</h4>
          <span className="font-mono text-zinc-300 text-xs font-semibold">({formatEther(amount)} ETH)</span>
        </div>

        {submissionProofHash && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 pt-0.5">
            <span className="text-zinc-500 font-mono">Bukti:</span>
            <a 
              href={submissionProofHash.startsWith("http") ? submissionProofHash : `https://ipfs.io/ipfs/${submissionProofHash}`}
              target="_blank" 
              rel="noreferrer"
              className="text-indigo-400 hover:underline font-mono truncate max-w-[200px] inline-flex items-center gap-1"
            >
              {submissionProofHash} <ExternalLink className="h-3 w-3 inline shrink-0" />
            </a>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${statusMap[status].style}`}>
          ● {statusMap[status].text}
        </span>

        {/* Worker: Tombol Kirim Bukti */}
        {projectStatus === 1 && isWorker && status === 0 && (
          <button
            onClick={() => onOpenSubmit(index)}
            disabled={isTxPending}
            className="px-5 py-2 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition"
          >
            Serahkan Bukti
          </button>
        )}

        {/* Klien: Tombol Approve & Rilis Dana */}
        {projectStatus === 1 && isClient && status === 1 && (
          <button
            onClick={() => onApprove(index)}
            disabled={isTxPending}
            className="px-5 py-2 rounded-full bg-[#5b50f6] hover:bg-[#4d42ec] text-white font-semibold text-xs transition shadow-md"
          >
            Approve & Release
          </button>
        )}
      </div>
    </div>
  );
}