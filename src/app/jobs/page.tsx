"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  UserCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface JobListing {
  id: string;
  title: string;
  description: string;
  category: string;
  client_address: string;
  budget_idr: number | string;
  estimated_days: number;
  job_proposals?: { count: number }[];
}

const CATEGORIES = ["ALL", "DEVELOPMENT", "DESIGN", "SMART_CONTRACT", "SECURITY"] as const;
type Category = (typeof CATEGORIES)[number];

const formatCategory = (cat: string) => cat.replace(/_/g, " ");

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("ALL");

  useEffect(() => {
    let cancelled = false;

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
        if (!cancelled) setJobs((data as JobListing[]) || []);
      } catch (err) {
        console.error("Gagal mengambil daftar pekerjaan:", err);
        if (!cancelled) setJobs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  const filteredJobs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return jobs;
    return jobs.filter(
      (j) => j.title.toLowerCase().includes(term) || j.description.toLowerCase().includes(term)
    );
  }, [jobs, searchTerm]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090c] pb-24 font-sans text-white selection:bg-[#ff4625]/30">
      <div className="pointer-events-none fixed right-[8%] top-[-12%] h-[480px] w-[480px] rounded-full bg-[#ff4625]/[0.06] blur-[140px]" />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#08090c]/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-zinc-400 transition hover:border-white/[0.16] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> BERANDA
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
              MARKETPLACE LOWONGAN
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/jobs/new"
              className="flex items-center gap-1.5 rounded-xl bg-[#34d399] px-4 py-2 font-mono text-xs font-bold text-[#08090c] shadow-lg shadow-[#34d399]/20 transition hover:bg-[#2cc08a]"
            >
              <Plus className="h-3.5 w-3.5" /> PASANG LOWONGAN
            </Link>
            <ConnectButton accountStatus="avatar" chainStatus="icon" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-8 px-6 pt-10">
        <section className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#ff4625]/30 bg-[#ff4625]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#ff5733]">
            <Briefcase className="h-3 w-3" /> Worker · Job Board
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Eksplorasi Proyek Freelance
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
            Pilih tawaran proyek berdenominasi IDR dengan komitmen perlindungan notarisasi
            kriptografis di Sepolia.
          </p>
        </section>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari lowongan berdasarkan keahlian atau kata kunci..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 transition focus:border-[#ff4625]/60 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-[#ff4625]/30"
            />
          </div>

          <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
            <Filter className="h-4 w-4 shrink-0 text-zinc-500" />
            {CATEGORIES.map((cat) => {
              const selected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={selected}
                  className={`whitespace-nowrap rounded-xl border px-3.5 py-2 font-mono text-[11px] uppercase tracking-wider transition ${
                    selected
                      ? "border-[#ff4625]/40 bg-[#ff4625]/10 text-[#ff5733]"
                      : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.16] hover:text-white"
                  }`}
                >
                  {formatCategory(cat)}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-16 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin text-[#ff5733]" />
            <span className="font-mono text-xs uppercase tracking-wider">
              Memuat lowongan terbuka...
            </span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="space-y-3 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-12 text-center backdrop-blur-sm">
            <Search className="mx-auto h-8 w-8 text-zinc-600" />
            <h3 className="text-sm font-semibold text-white">Tidak Ada Lowongan Ditemukan</h3>
            <p className="text-xs text-zinc-400">
              Ubah kata kunci atau kategori, atau pasang lowongan baru.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="group block space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm transition hover:border-[#ff5733]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#ff5733]">
                      {formatCategory(job.category)}
                    </span>
                    <h3 className="line-clamp-1 text-base font-semibold text-white transition group-hover:text-[#ff5733]">
                      {job.title}
                    </h3>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block font-mono text-sm font-bold text-white">
                      Rp {Number(job.budget_idr).toLocaleString("id-ID")}
                    </span>
                    <span className="flex items-center justify-end gap-1 font-mono text-[10px] text-zinc-500">
                      <Clock className="h-3 w-3" /> EST. {job.estimated_days} HARI
                    </span>
                  </div>
                </div>

                <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
                  {job.description}
                </p>

                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 font-mono text-xs">
                  <span className="max-w-[200px] truncate text-zinc-500">
                    Klien: {job.client_address.slice(0, 10)}...
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <UserCheck className="h-3 w-3" /> {job.job_proposals?.[0]?.count ?? 0}{" "}
                      Lamaran
                    </span>
                    <span className="flex items-center gap-1 text-[#ff5733] transition group-hover:translate-x-0.5">
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