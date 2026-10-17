"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ArrowLeft, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function PostJobPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("DEVELOPMENT");
  const [description, setDescription] = useState("");
  const [budgetIdr, setBudgetIdr] = useState(5000000);
  const [estimatedDays, setEstimatedDays] = useState(14);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      setErrorMsg("Harap hubungkan dompet Web3 terlebih dahulu.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("job_postings")
        .insert({
          client_address: address.toLowerCase(),
          title: title.trim(),
          category,
          description: description.trim(),
          budget_idr: budgetIdr,
          estimated_days: estimatedDays,
          status: "OPEN",
        })
        .select()
        .single();

      if (error) throw error;
      router.push(`/jobs/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal memposting lowongan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-white selection:bg-[#ff4625]/30 font-sans pb-24">
      <header className="border-b border-white/[0.06] bg-[#08090c]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/jobs"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> KEMBALI KE LOWONGAN
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-10 space-y-6">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#ff5733] uppercase">
            REKRUT TALENTA WEB3
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
            Pasang Lowongan Pekerjaan
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Publikasikan kebutuhan proyek Anda. Worker akan mengirimkan proposal sebelum Anda mengunci kesepakatan on-chain.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-7 rounded-3xl bg-[#0e1017] border border-white/[0.08] space-y-4">
          <div>
            <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
              Judul Lowongan
            </label>
            <input
              type="text"
              placeholder="Contoh: Pembuatan Full-stack DApp Next.js + Smart Contract"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-[#08090c] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#ff4625]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                Kategori Proyek
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#08090c] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#ff4625]"
              >
                <option value="DEVELOPMENT">Development</option>
                <option value="DESIGN">UI/UX Design</option>
                <option value="SMART_CONTRACT">Smart Contract</option>
                <option value="SECURITY">Security Audit</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                Estimasi Durasi (Hari)
              </label>
              <input
                type="number"
                min="1"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 bg-[#08090c] border border-white/[0.08] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#ff4625]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
              Anggaran Biaya (IDR)
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-500">Rp</span>
              <input
                type="number"
                step="50000"
                value={budgetIdr}
                onChange={(e) => setBudgetIdr(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 bg-[#08090c] border border-white/[0.08] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#ff4625]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
              Deskripsi Ruang Lingkup & Kualifikasi
            </label>
            <textarea
              rows={5}
              placeholder="Jelaskan kebutuhan teknis, deliverable yang diharapkan, dan batasan pengerjaan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-[#08090c] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#ff4625]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isConnected}
            className="w-full py-3.5 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white font-mono text-xs font-bold tracking-wide transition shadow-lg shadow-[#ff4625]/25 disabled:opacity-50"
          >
            {loading ? "MEMPROSES..." : "PUBLIKASIKAN LOWONGAN"}
          </button>
        </form>
      </main>
    </div>
  );
}