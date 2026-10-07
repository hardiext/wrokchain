"use client";

import { use } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  FileText, 
  Share2, 
  AlertTriangle 
} from "lucide-react";
import { WORKCHAIN_ABI } from "@/constants/ABI";

export default function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = BigInt(resolvedParams.id || "0");
  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xDD33AAFbD7bA98FCdA5b04677Ffd0A534c1880e7") as `0x${string}`;

  // Baca data proyek secara publik langsung dari smart contract
  const { data: projectData, isLoading } = useReadContract({
    address: contractAddress,
    abi: WORKCHAIN_ABI,
    functionName: "projects",
    args: [projectId],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0e12] text-zinc-400 flex flex-col items-center justify-center font-mono text-xs">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-3" />
        <span>Memverifikasi bukti kriptografis on-chain...</span>
      </div>
    );
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

  if (!project || project.client === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
        <h1 className="text-xl font-bold mb-1">Bukti Kerja Tidak Valid</h1>
        <p className="text-zinc-400 text-xs max-w-sm mb-6">
          Nomor proyek #{resolvedParams.id} tidak terdaftar atau belum pernah tercatat di smart contract WorkChain.
        </p>
        <Link href="/" className="px-5 py-2.5 rounded-full bg-white text-zinc-950 font-semibold text-xs">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const isCompleted = project.status === 2;
  const createdDate = project.createdAt ? new Date(project.createdAt * 1000).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";
  const completedDate = project.completedAt ? new Date(project.completedAt * 1000).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Dalam Pengerjaan";

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white selection:bg-indigo-600 font-sans py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
          <Link href="/" className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5 font-medium">
            <ArrowLeft className="h-3.5 w-3.5" /> Portal WorkChain
          </Link>
          <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Sertifikat Verifikasi Publik
          </span>
        </div>

        {/* Certificate Card Container */}
        <div className="bg-[#14151b] border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          {/* Badge Watermark Background */}
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 pointer-events-none opacity-5">
            <ShieldCheck className="w-96 h-96 text-white" />
          </div>

          {/* Header Verifikasi */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-800/80 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight uppercase">WORKCHAIN<span className="text-indigo-500">.</span></span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs font-mono text-zinc-400">Record ID #{project.id.toString()}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white pt-1">
                Bukti Penyelesaian Kontrak Kerja
              </h1>
            </div>

            <div className="shrink-0">
              {isCompleted ? (
                <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Terverifikasi Sah (100% Lunas)
                </div>
              ) : (
                <div className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" /> Status Berjalan (Belum Selesai)
                </div>
              )}
            </div>
          </div>

          {/* Ringkasan Nilai & Pihak Terikat */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl space-y-1">
              <span className="text-[10px] text-zinc-500 block">TOTAL NILAI PEKERJAAN</span>
              <p className="text-lg font-bold text-white">{formatEther(project.totalBudget)} ETH</p>
              <span className="text-[10px] text-emerald-400 block">Pencairan On-Chain Sukses</span>
            </div>

            <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl space-y-1 sm:col-span-2">
              <span className="text-[10px] text-zinc-500 block">PENERIMA KERJA (FREELANCER)</span>
              <p className="text-xs text-zinc-200 break-all select-all font-semibold">{project.worker}</p>
              <Link 
                href={`/records/${project.worker}`}
                className="text-[10px] text-indigo-400 hover:underline inline-flex items-center gap-1 pt-0.5"
              >
                Lihat Rekam Jejak Portofolio Worker <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            </div>
          </div>

          {/* Audit Timestamp & Hash */}
          <div className="space-y-3 font-mono text-[11px] text-zinc-400 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/60">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-zinc-500">Pemberi Kerja (Klien):</span>
              <span className="text-zinc-300 break-all select-all">{project.client}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-zinc-500">Tanggal Inisiasi Kontrak:</span>
              <span className="text-zinc-300">{createdDate}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-zinc-500">Tanggal Penyelesaian Akhir:</span>
              <span className="text-zinc-300">{completedDate}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pt-1 border-t border-zinc-800">
              <span className="text-zinc-500">Agreement Digest (SHA-256):</span>
              <span className="text-indigo-400 break-all">{project.agreementHash}</span>
            </div>
          </div>

          {/* Milestone Deliverables Breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" /> Bukti Hasil Kerja per Milestone ({project.milestoneCount})
            </h3>

            <div className="space-y-3">
              {Array.from({ length: project.milestoneCount }).map((_, idx) => (
                <PublicMilestoneRow
                  key={idx}
                  projectId={projectId}
                  index={idx}
                  contractAddress={contractAddress}
                />
              ))}
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800 text-xs font-mono">
            <a
              href={`https://sepolia.etherscan.io/address/${contractAddress}`}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-white transition inline-flex items-center gap-1.5"
            >
              Audit di Sepolia Etherscan <ExternalLink className="h-3 w-3" />
            </a>

            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Tautan verifikasi berhasil disalin ke clipboard!");
                }
              }}
              className="px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition inline-flex items-center gap-1.5"
            >
              <Share2 className="h-3.5 w-3.5" /> Salin Tautan Sertifikat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function PublicMilestoneRow({
  projectId,
  index,
  contractAddress,
}: {
  projectId: bigint;
  index: number;
  contractAddress: `0x${string}`;
}) {
  const { data: milestoneData } = useReadContract({
    address: contractAddress,
    abi: WORKCHAIN_ABI,
    functionName: "getMilestone",
    args: [projectId, BigInt(index)],
  });

  if (!milestoneData) return null;
  const [title, amount, status, submissionProofHash] = milestoneData;

  const isApproved = status === 2;

  return (
    <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="space-y-1 max-w-md">
        <div className="flex items-center gap-2">
          <span className="font-mono text-zinc-500 font-semibold">#{index + 1}</span>
          <span className="font-semibold text-white">{title}</span>
          <span className="font-mono text-zinc-400 text-[11px]">({formatEther(amount)} ETH)</span>
        </div>

        {submissionProofHash ? (
          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 pt-0.5">
            <span className="text-zinc-500">Bukti Diserahkan:</span>
            <a
              href={submissionProofHash.startsWith("http") ? submissionProofHash : `https://ipfs.io/ipfs/${submissionProofHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:underline truncate max-w-[260px] inline-flex items-center gap-1"
            >
              {submissionProofHash} <ExternalLink className="h-2.5 w-2.5 inline" />
            </a>
          </div>
        ) : (
          <span className="text-[11px] text-zinc-500 block">Belum ada lampiran bukti</span>
        )}
      </div>

      <div className="shrink-0 self-end sm:self-auto">
        {isApproved ? (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            ✓ Disetujui & Telah Dibayar
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            Dalam Proses
          </span>
        )}
      </div>
    </div>
  );
}