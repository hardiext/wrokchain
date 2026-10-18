"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  ArrowLeft,
  Clock,
  UserCheck,
  Send,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  Wallet,
  Banknote,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  client_address: string;
  budget_idr: number | string;
  estimated_days: number;
}

interface Proposal {
  id: string;
  job_id: string;
  worker_address: string;
  pitch_note: string;
  bid_amount_idr: number | string;
  proposed_days: number;
  status: string;
  created_at: string;
}

const THEME = {
  client: {
    text: "text-[#34d399]",
    solid: "bg-[#34d399] hover:bg-[#2cc08a] text-[#08090c]",
    shadow: "shadow-[#34d399]/20",
    focus:
      "focus:border-[#34d399]/60 focus:ring-1 focus:ring-[#34d399]/30 focus:bg-white/[0.04]",
    selection: "selection:bg-[#34d399]/30",
    glow: "bg-[#34d399]/[0.06]",
    outline: "border-[#34d399]/30 text-[#34d399] hover:bg-[#34d399]/10",
  },
  worker: {
    text: "text-[#ff5733]",
    solid: "bg-[#ff4625] hover:bg-[#e03a1a] text-white",
    shadow: "shadow-[#ff4625]/20",
    focus:
      "focus:border-[#ff4625]/60 focus:ring-1 focus:ring-[#ff4625]/30 focus:bg-white/[0.04]",
    selection: "selection:bg-[#ff4625]/30",
    glow: "bg-[#ff4625]/[0.06]",
    outline: "border-[#ff4625]/30 text-[#ff5733] hover:bg-[#ff4625]/10",
  },
} as const;

const baseInput =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition focus:outline-none";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === "object" && err !== null) {
    const { message } = err as { message?: string };
    if (message) return message;
  }
  return fallback;
};

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const router = useRouter();
  const { address } = useAccount();

  const [job, setJob] = useState<Job | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [pitchNote, setPitchNote] = useState("");
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [proposedDays, setProposedDays] = useState<number>(7);

  const currentWallet = address?.toLowerCase() || "";
  const isOwner = job !== null && currentWallet === job.client_address.toLowerCase();
  const theme = THEME[isOwner ? "client" : "worker"];

  const loadJobData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: jobData, error: jobErr } = await supabase
        .from("job_postings")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobErr) throw jobErr;
      setJob(jobData as Job);
      setBidAmount(Number(jobData.budget_idr));
      setProposedDays(jobData.estimated_days);

      const { data: propData, error: propErr } = await supabase
        .from("job_proposals")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (propErr) throw propErr;
      setProposals((propData as Proposal[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJobData();
  }, [loadJobData]);

  const handleApplyProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!currentWallet) {
      setFormError("Hubungkan wallet terlebih dahulu.");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from("job_proposals").insert({
        job_id: jobId,
        worker_address: currentWallet,
        pitch_note: pitchNote.trim(),
        bid_amount_idr: bidAmount,
        proposed_days: proposedDays,
        status: "PENDING",
      });

      if (error) throw error;
      setPitchNote("");
      await loadJobData();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Gagal mengirimkan lamaran."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleHireWorker = (proposal: Proposal) => {
    if (!job) return;
    router.push(
      `/create?job_id=${job.id}&worker=${proposal.worker_address}&amount=${proposal.bid_amount_idr}&title=${encodeURIComponent(job.title)}`
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090c] text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#08090c] p-10 text-white">
        <AlertCircle className="h-8 w-8 text-zinc-600" />
        <p className="font-mono text-xs text-zinc-400">Lowongan tidak ditemukan.</p>
        <Link
          href="/jobs"
          className="flex items-center gap-1.5 font-mono text-xs text-zinc-300 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali
        </Link>
      </div>
    );
  }

  const hasApplied = proposals.some((p) => p.worker_address.toLowerCase() === currentWallet);

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-[#08090c] pb-24 font-sans text-white ${theme.selection}`}
    >
      <div
        className={`pointer-events-none fixed right-[8%] top-[-12%] h-[480px] w-[480px] rounded-full blur-[140px] ${theme.glow}`}
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#08090c]/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/jobs"
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-zinc-400 transition hover:border-white/[0.16] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> JELAJAHI LOWONGAN
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl space-y-8 px-6 pt-10">
        <section className="space-y-6 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0 space-y-2">
              <span
                className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest ${theme.text}`}
              >
                <FolderOpen className="h-3 w-3" /> {job.category}
              </span>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{job.title}</h1>
              <span className="block break-all font-mono text-xs text-zinc-500">
                Klien: {job.client_address}
              </span>
            </div>

            <div className="shrink-0 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:text-right">
              <span className="mb-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase text-zinc-500 sm:justify-end">
                <Banknote className="h-3 w-3" /> Anggaran Proyek
              </span>
              <span className="font-mono text-xl font-bold text-white">
                Rp {Number(job.budget_idr).toLocaleString("id-ID")}
              </span>
              <span className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-zinc-400 sm:justify-end">
                <Clock className="h-3 w-3" /> Estimasi {job.estimated_days} Hari
              </span>
            </div>
          </div>

          <div className="border-t border-white/[0.08] pt-5">
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-zinc-400">
              Ruang Lingkup & Deskripsi
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
              {job.description}
            </p>
          </div>
        </section>

        {!isOwner && (
          <section className="space-y-6 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <Send className={`h-4 w-4 ${theme.text}`} /> Ajukan Proposal Kerja
            </h2>

            {hasApplied ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 font-mono text-xs text-zinc-200">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${theme.text}`} />
                Anda telah mengirimkan proposal penawaran untuk lowongan ini.
              </div>
            ) : (
              <form onSubmit={handleApplyProposal} className="space-y-4">
                {formError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                      Tawaran Biaya (IDR)
                    </span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(Number(e.target.value))}
                      required
                      className={`${baseInput} font-mono text-xs ${theme.focus}`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                      Target Pengerjaan (Hari)
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={proposedDays}
                      onChange={(e) => setProposedDays(Number(e.target.value))}
                      required
                      className={`${baseInput} font-mono text-xs ${theme.focus}`}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Pitch & Rekam Jejak Singkat
                  </span>
                  <textarea
                    rows={3}
                    placeholder="Sampaikan keahlian relevan, portofolio, dan strategi pengerjaan tugas ini..."
                    value={pitchNote}
                    onChange={(e) => setPitchNote(e.target.value)}
                    required
                    className={`${baseInput} resize-none ${theme.focus}`}
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting || !currentWallet}
                  className={`flex items-center gap-2 rounded-xl px-6 py-3 font-mono text-xs font-bold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${theme.solid} ${theme.shadow}`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>MENGIRIMKAN...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>KIRIM PROPOSAL SEKARANG</span>
                    </>
                  )}
                </button>
                {!currentWallet && (
                  <p className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                    <Wallet className="h-3 w-3" /> Hubungkan wallet untuk mengirim proposal.
                  </p>
                )}
              </form>
            )}
          </section>
        )}

        {isOwner && (
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <UserCheck className={`h-4 w-4 ${theme.text}`} />
              Proposal Pelamar Masuk
              <span className="font-mono text-xs font-normal text-zinc-500">
                {proposals.length}
              </span>
            </h2>

            {proposals.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center font-mono text-xs text-zinc-500 backdrop-blur-sm">
                Belum ada worker yang melamar lowongan ini.
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 max-w-lg space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="break-all font-mono text-xs font-bold text-white">
                          {p.worker_address}
                        </span>
                        <span className="flex items-center gap-1 rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                          <Clock className="h-3 w-3" /> {p.proposed_days} HARI
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-zinc-400">{p.pitch_note}</p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                      <span className="font-mono text-sm font-bold text-white">
                        Rp {Number(p.bid_amount_idr).toLocaleString("id-ID")}
                      </span>
                      <button
                        onClick={() => handleHireWorker(p)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl px-5 py-2 font-mono text-xs font-bold shadow-lg transition ${theme.solid} ${theme.shadow}`}
                      >
                        <span>PILIH & BUAT KONTRAK</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        href={`/profile/${p.worker_address}`}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-5 py-2 font-mono text-xs font-bold transition ${theme.outline}`}
                      >
                        <span>PORTOFOLIO</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}