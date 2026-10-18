"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { isAddress } from "viem";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Layers,
  Banknote,
  FileCheck2,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface WorkerRecord {
  agreements_accepted: number | null;
  agreements_completed: number | null;
  milestones_approved: number | null;
  payments_confirmed: number | null;
}

const EMPTY_RECORD: WorkerRecord = {
  agreements_accepted: 0,
  agreements_completed: 0,
  milestones_approved: 0,
  payments_confirmed: 0,
};

export default function RecordsPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const targetWallet = address.toLowerCase();
  const validAddress = isAddress(targetWallet);

  const [workerStats, setWorkerStats] = useState<WorkerRecord>(EMPTY_RECORD);
  const [loading, setLoading] = useState(validAddress);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!validAddress) return;
    let cancelled = false;

    const loadStats = async () => {
      setLoading(true);
      setFailed(false);
      try {
        const { data, error } = await supabase
          .from("worker_record")
          .select("*")
          .eq("wallet", targetWallet)
          .maybeSingle();

        if (error) throw error;
        if (!cancelled) setWorkerStats((data as WorkerRecord | null) ?? EMPTY_RECORD);
      } catch (err) {
        console.error("Gagal memuat rekam jejak:", err);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [targetWallet, validAddress]);

  if (!validAddress) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#08090c] p-10 text-white">
        <AlertCircle className="h-8 w-8 text-zinc-600" />
        <p className="font-mono text-xs text-zinc-400">Alamat dompet tidak valid.</p>
        <Link
          href="/"
          className="flex items-center gap-1.5 font-mono text-xs text-zinc-300 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Portal WorkChain
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Diterima", value: workerStats.agreements_accepted, icon: FileCheck2, accent: false },
    { label: "Tuntas", value: workerStats.agreements_completed, icon: CheckCircle2, accent: true },
    { label: "Milestone Approved", value: workerStats.milestones_approved, icon: Layers, accent: false },
    { label: "Pembayaran Confirmed", value: workerStats.payments_confirmed, icon: Banknote, accent: false },
  ];

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
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-zinc-400 transition hover:border-white/[0.16] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> PORTAL WORKCHAIN
          </Link>
          <ConnectButton accountStatus="avatar" chainStatus="icon" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl space-y-8 px-6 pt-10">
        <section className="space-y-6 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-sm">
          <div className="flex items-center gap-4 border-b border-white/[0.08] pb-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#ff4625]/30 bg-[#ff4625]/10 text-[#ff5733]">
              <Award className="h-6 w-6" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#ff5733]">
                Worker Record
              </div>
              <h1 className="text-xl font-bold tracking-tight">Rekam Jejak Terverifikasi</h1>
              <p className="break-all font-mono text-xs text-zinc-400">{targetWallet}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-10 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin text-[#ff5733]" />
              <span className="font-mono text-xs uppercase tracking-wider">Memuat rekam jejak...</span>
            </div>
          ) : failed ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>Gagal memuat rekam jejak. Coba muat ulang halaman.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map(({ label, value, icon: Icon, accent }) => (
                <div
                  key={label}
                  className="space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
                >
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    <Icon className="h-3 w-3" /> {label}
                  </span>
                  <p
                    className={`font-mono text-2xl font-bold ${
                      accent ? "text-[#ff5733]" : "text-white"
                    }`}
                  >
                    {value ?? 0}
                  </p>
                </div>
              ))}
            </div>
          )}

          <Link
            href={`/profile/${targetWallet}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 font-mono text-xs text-zinc-300 transition hover:border-white/[0.16] hover:text-white"
          >
            <span>LIHAT PROFIL PUBLIK</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </section>
      </main>
    </div>
  );
}