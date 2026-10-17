"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Briefcase,
  Search,
  Filter,
  Clock,
  ArrowUpRight,
  Plus,
  Loader2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function BrowseJobsPage() {
  const { isConnected } = useAccount();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("job_postings")
          .select("*, job_proposals(count)")
          .eq("status", "OPEN")
          .order("created_at", { ascending: false });

        if (selectedCategory !== "ALL") {
          query = query.eq("category", selectedCategory);
        }

        const { data, error } = await query;
        if (error) throw error;
        setJobs(data || []);
      } catch (err) {
        console.error("Gagal mengambil daftar pekerjaan:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [selectedCategory]);

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#08090c] text-white selection:bg-[#ff4625]/30 font-sans pb-24 relative overflow-hidden">
      <div className="pointer-events-none fixed top-[-10%] right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-[#ff4625]/10 to-[#8b5cf6]/10 blur-[130px] rounded-full" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08090c]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition py-1 px-3 rounded-full bg-white/[0.03] border border-white/[0.06]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> BERANDA
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="font-mono text-xs text-zinc-300 font-semibold uppercase">
              MARKETPLACE LOWONGAN
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/jobs/new"
              className="px-4 py-2 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-[#ff4625]/20"
            >
              <Plus className="h-3.5 w-3.5" /> PASANG LOWONGAN
            </Link>
            <ConnectButton accountStatus="avatar" chainStatus="icon" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-8 relative z-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ff4625]/30 bg-[#ff4625]/10 text-[#ff7755] text-xs font-mono uppercase">
            <Sparkles className="h-3.5 w-3.5" /> WORKCHAIN JOB BOARD
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Eksplorasi Proyek Freelance
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            Pilih tawaran proyek berdenominasi IDR dengan komitmen perlindungan notarisasi kriptografis di Sepolia.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari lowongan berdasarkan keahlian atau kata kunci..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#0e1017] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4625] transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
            {["ALL", "DEVELOPMENT", "DESIGN", "SMART_CONTRACT", "SECURITY"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-mono tracking-wider transition uppercase whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-white/[0.1] text-white border border-white/[0.2]"
                    : "bg-[#0e1017] text-zinc-400 border border-white/[0.06] hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Job List Cards */}
        {loading ? (
          <div className="p-16 flex items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin text-[#ff5733]" />
            <span className="font-mono text-xs uppercase tracking-wider">Memuat lowongan terbuka...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 rounded-3xl border border-white/[0.08] bg-[#0e1017] text-center space-y-3">
            <Briefcase className="h-8 w-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">Tidak Ada Lowongan Ditemukan</h3>
            <p className="text-xs text-zinc-400">Jadilah yang pertama memasang lowongan pekerjaan baru!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="group p-6 rounded-2xl bg-[#0e1017] border border-white/[0.06] hover:border-[#ff4625]/40 transition space-y-4 shadow-xl hover:shadow-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[#ff5733] uppercase tracking-wider">
                      {job.category}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-[#ff5733] transition line-clamp-1">
                      {job.title}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-white block">
                      Rp {Number(job.budget_idr).toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      EST. {job.estimated_days} HARI
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500 truncate max-w-[200px]">
                    Klien: {job.client_address.slice(0, 10)}...
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 text-[11px]">
                      {job.job_proposals?.[0]?.count || 0} Lamaran
                    </span>
                    <span className="flex items-center gap-1 text-[#ff5733] group-hover:translate-x-0.5 transition">
                      DETAIL <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}   