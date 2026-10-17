"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  ArrowLeft,
  Plus,
  Layers,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  Briefcase,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [role, setRole] = useState<"client" | "worker">("client");
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentWallet = address?.toLowerCase() || "";

  useEffect(() => {
    if (!currentWallet) {
      setAgreements([]);
      setLoading(false);
      return;
    }

    const fetchAgreements = async () => {
      setLoading(true);
      try {
        const query = supabase.from("agreements").select("*");
        if (role === "client") {
          query.eq("client_address", currentWallet);
        } else {
          query.eq("worker_address", currentWallet);
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        setAgreements(data || []);
      } catch (err) {
        console.error("Gagal mengambil data dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgreements();
  }, [currentWallet, role]);

  const activeCount = agreements.filter((a) => a.status === "ACTIVE").length;
  const pendingCount = agreements.filter((a) => a.status === "PENDING" || a.status === "ANCHORING").length;

  return (
    <div className="min-h-screen bg-[#08090c] text-white selection:bg-[#ff4625]/30 selection:text-white font-sans antialiased relative overflow-hidden pb-24">
      {/* Ambient Lighting Gradients */}
      <div className="pointer-events-none fixed top-[-10%] right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-[#ff4625]/10 to-[#8b5cf6]/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#6366f1]/10 to-transparent blur-[150px] rounded-full" />

      {/* Grid Pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08090c]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition py-1 px-3 rounded-full bg-white/[0.03] border border-white/[0.06]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>BERANDA</span>
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="font-mono text-xs text-zinc-300 font-semibold tracking-wider uppercase">
              WORKSPACE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white font-mono text-xs font-bold shadow-lg shadow-[#ff4625]/20 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>BUAT KESEPAKATAN</span>
            </Link>
            <ConnectButton accountStatus="avatar" chainStatus="icon" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-8 relative z-10">
        {/* Workspace Title & Role Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#ff5733] uppercase">
              PROTOCOL DASHBOARD
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
              Manajemen Kesepakatan
            </h1>
          </div>

          {/* Role Pill Switch */}
          <div className="flex p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] self-start sm:self-auto">
            <button
              onClick={() => setRole("client")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold transition ${
                role === "client"
                  ? "bg-[#ff4625] text-white shadow-lg shadow-[#ff4625]/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>SEBAGAI KLIEN</span>
            </button>
            <button
              onClick={() => setRole("worker")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold transition ${
                role === "worker"
                  ? "bg-[#ff4625] text-white shadow-lg shadow-[#ff4625]/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>SEBAGAI WORKER</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-[#0e1017] border border-white/[0.06] space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
              TOTAL KESEPAKATAN
            </span>
            <div className="text-2xl font-extrabold text-white font-mono">{agreements.length}</div>
          </div>
          <div className="p-6 rounded-2xl bg-[#0e1017] border border-white/[0.06] space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider">
              AKTIF & BERJALAN
            </span>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">{activeCount}</div>
          </div>
          <div className="p-6 rounded-2xl bg-[#0e1017] border border-white/[0.06] space-y-1">
            <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider">
              MENUNGGU PROSES
            </span>
            <div className="text-2xl font-extrabold text-amber-400 font-mono">{pendingCount}</div>
          </div>
        </div>

        {/* Content Section */}
        {!isConnected ? (
          <div className="p-12 rounded-3xl border border-white/[0.08] bg-[#0e1017] text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Dompet Belum Terhubung</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Hubungkan dompet Web3 MetaMask Anda untuk melihat daftar kontrak dan perjanjian kerja Anda.
            </p>
          </div>
        ) : loading ? (
          <div className="p-16 flex items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin text-[#ff5733]" />
            <span className="font-mono text-xs uppercase tracking-wider">Mengambil data kesepakatan...</span>
          </div>
        ) : agreements.length === 0 ? (
          <div className="p-12 rounded-3xl border border-white/[0.08] bg-[#0e1017] text-center space-y-4">
            <Layers className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Belum Ada Kesepakatan</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {role === "client"
                ? "Anda belum membuat kesepakatan kerja. Klik tombol di bawah untuk membuat kontrak pertama."
                : "Belum ada kontrak yang menugaskan alamat dompet Anda sebagai worker."}
            </p>
            {role === "client" && (
              <div className="pt-2">
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white font-mono text-xs font-bold shadow-lg shadow-[#ff4625]/20 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>BUAT KESEPAKATAN</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agreements.map((a) => (
              <Link
                key={a.id}
                href={`/project/${a.id}`}
                className="group block p-6 rounded-2xl bg-[#0e1017] border border-white/[0.06] hover:border-[#ff5733]/40 transition space-y-4 shadow-xl hover:shadow-2xl hover:shadow-[#ff5733]/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                      ID: {a.id.slice(0, 8)}...
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-[#ff5733] transition line-clamp-1">
                      {a.title}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase font-semibold ${
                      a.status === "ACTIVE"
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                        : a.status === "COMPLETED"
                        ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-300"
                        : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {a.description}
                </p>

                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500 truncate max-w-[200px]">
                    {role === "client" ? `Worker: ${a.worker_address.slice(0, 10)}...` : `Klien: ${a.client_address.slice(0, 10)}...`}
                  </span>
                  <span className="flex items-center gap-1 text-[#ff5733] group-hover:translate-x-1 transition">
                    RINCIAN <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}