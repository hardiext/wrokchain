"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  UserCheck,
  Send,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;
  const router = useRouter();
  const { address } = useAccount();

  const [job, setJob] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State Formulir Proposal (Worker)
  const [pitchNote, setPitchNote] = useState("");
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [proposedDays, setProposedDays] = useState<number>(7);

  const currentWallet = address?.toLowerCase() || "";
  const isOwner = job && currentWallet === job.client_address.toLowerCase();

  const loadJobData = async () => {
    try {
      setLoading(true);
      const { data: jobData, error: jobErr } = await supabase
        .from("job_postings")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobErr) throw jobErr;
      setJob(jobData);
      setBidAmount(Number(jobData.budget_idr));
      setProposedDays(jobData.estimated_days);

      const { data: propData, error: propErr } = await supabase
        .from("job_proposals")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (propErr) throw propErr;
      setProposals(propData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  const handleApplyProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWallet) {
      alert("Hubungkan wallet terlebih dahulu.");
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
    } catch (err: any) {
      alert(err.message || "Gagal mengirimkan lamaran.");
    } finally {
      setSubmitting(false);
    }
  };

  // Fungsi Klien Memilih Worker dan Melanjutkan ke Kontrak On-Chain
  const handleHireWorker = async (proposal: any) => {
    // Arahkan ke /create dengan parameter worker dan job_id
    router.push(
      `/create?job_id=${job.id}&worker=${proposal.worker_address}&amount=${proposal.bid_amount_idr}&title=${encodeURIComponent(job.title)}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090c] flex items-center justify-center text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-[#ff4625]" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#08090c] text-white p-10 flex flex-col items-center justify-center">
        <p className="text-zinc-400 text-xs font-mono">Lowongan tidak ditemukan.</p>
        <Link href="/jobs" className="text-[#ff4625] text-xs font-mono mt-2">
          &larr; Kembali
        </Link>
      </div>
    );
  }

  const hasApplied = proposals.some(
    (p) => p.worker_address.toLowerCase() === currentWallet
  );

  return (
    <div className="min-h-screen bg-[#08090c] text-white selection:bg-[#ff4625]/30 font-sans pb-24">
      <header className="border-b border-white/[0.06] bg-[#08090c]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/jobs"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> JELAJAHI LOWONGAN
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-10 space-y-8">
        {/* Job Header Detail */}
        <div className="p-8 rounded-3xl bg-[#0e1017] border border-white/[0.08] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-[#ff5733] tracking-widest uppercase block">
                {job.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {job.title}
              </h1>
              <span className="text-xs font-mono text-zinc-500 block">
                Klien: {job.client_address}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] sm:text-right">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-0.5">
                Anggaran Proyek
              </span>
              <span className="text-xl font-bold font-mono text-white">
                Rp {Number(job.budget_idr).toLocaleString("id-ID")}
              </span>
              <span className="text-[11px] font-mono text-zinc-400 block mt-1">
                Estimasi {job.estimated_days} Hari
              </span>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-4">
            <h3 className="text-xs font-mono uppercase text-zinc-400 mb-2">
              Ruang Lingkup & Deskripsi
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>
        </div>

        {/* WORKER SECTION: FORMULIR LAMARAN */}
        {!isOwner && (
          <div className="p-8 rounded-3xl bg-[#0e1017] border border-white/[0.08] space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="h-4 w-4 text-[#ff5733]" /> Ajukan Proposal Kerja
            </h3>

            {hasApplied ? (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                ✓ Anda telah mengirimkan proposal penawaran untuk lowongan ini.
              </div>
            ) : (
              <form onSubmit={handleApplyProposal} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                      Tawaran Biaya (IDR)
                    </label>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(Number(e.target.value))}
                      required
                      className="w-full px-4 py-2.5 bg-[#08090c] border border-white/[0.08] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#ff5733]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                      Target Pengerjaan (Hari)
                    </label>
                    <input
                      type="number"
                      value={proposedDays}
                      onChange={(e) => setProposedDays(Number(e.target.value))}
                      required
                      className="w-full px-4 py-2.5 bg-[#08090c] border border-white/[0.08] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#ff5733]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                    Pitch & Rekam Jejak Singkat
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Sampaikan keahlian relevan, portofolio, dan strategi pengerjaan tugas ini..."
                    value={pitchNote}
                    onChange={(e) => setPitchNote(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#08090c] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5733]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !currentWallet}
                  className="px-6 py-3 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white font-mono text-xs font-bold transition shadow-lg shadow-[#ff4625]/25 disabled:opacity-50"
                >
                  {submitting ? "MENGIRIMKAN..." : "KIRIM PROPOSAL SEKARANG"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* KLIEN SECTION: DAFTAR PROPOSAL PELAMAR */}
        {isOwner && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#ff5733]" /> Proposal Pelamar Masuk ({proposals.length})
            </h3>

            {proposals.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0e1017] border border-white/[0.06] text-center text-xs text-zinc-500 font-mono">
                Belum ada worker yang melamar lowongan ini.
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((p) => (
                  <div
                    key={p.id}
                    className="p-6 rounded-2xl bg-[#0e1017] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-white font-bold">
                          {p.worker_address}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400">
                          {p.proposed_days} HARI
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{p.pitch_note}</p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-3 shrink-0">
                      <span className="font-mono text-sm font-bold text-white">
                        Rp {Number(p.bid_amount_idr).toLocaleString("id-ID")}
                      </span>
                      <button
                        onClick={() => handleHireWorker(p)}
                        className="px-5 py-2 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-[#ff4625]/20"
                      >
                        <span>PILIH & BUAT KONTRAK</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <Link href={`/profile/${p.worker_address}`}
                        onClick={() => handleHireWorker(p)}
                        className="px-5 py-2 rounded-xl bg-[#ff02a2] hover:bg-[#ff02a2]] text-white font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-[#ff4625]/20"
                      >
                        <span>Portofolio</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}