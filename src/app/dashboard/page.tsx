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
  FileText,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Role = "client" | "worker";

interface Agreement {
  id: string;
  title: string;
  description: string;
  status: string;
  client_address: string;
  worker_address: string;
  created_at: string;
}

const ROLE_THEME: Record<
  Role,
  {
    text: string;
    solid: string;
    solidText: string;
    shadow: string;
    cardHover: string;
    titleHover: string;
    selection: string;
    glow: string;
  }
> = {
  client: {
    text: "text-[#34d399]",
    solid: "bg-[#34d399]",
    solidText: "text-[#08090c]",
    shadow: "shadow-[#34d399]/20",
    cardHover: "hover:border-[#34d399]/40",
    titleHover: "group-hover:text-[#34d399]",
    selection: "selection:bg-[#34d399]/30",
    glow: "bg-[#34d399]/[0.06]",
  },
  worker: {
    text: "text-[#ff5733]",
    solid: "bg-[#ff4625]",
    solidText: "text-white",
    shadow: "shadow-[#ff4625]/20",
    cardHover: "hover:border-[#ff5733]/40",
    titleHover: "group-hover:text-[#ff5733]",
    selection: "selection:bg-[#ff4625]/30",
    glow: "bg-[#ff4625]/[0.06]",
  },
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]",
  COMPLETED: "border-white/[0.16] bg-white/[0.06] text-zinc-200",
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  ANCHORING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

const DEFAULT_BADGE = "border-white/[0.08] bg-white/[0.04] text-zinc-400";

const roleOptions: { value: Role; label: string; icon: typeof Briefcase }[] = [
  { value: "client", label: "SEBAGAI KLIEN", icon: Briefcase },
  { value: "worker", label: "SEBAGAI WORKER", icon: UserCheck },
];

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [role, setRole] = useState<Role>("client");
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  const currentWallet = address?.toLowerCase() || "";
  const theme = ROLE_THEME[role];

  useEffect(() => {
    if (!currentWallet) {
      setAgreements([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchAgreements = async () => {
      setLoading(true);
      try {
        const column = role === "client" ? "client_address" : "worker_address";
        const { data, error } = await supabase
          .from("agreements")
          .select("*")
          .eq(column, currentWallet)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!cancelled) setAgreements((data as Agreement[]) || []);
      } catch (err) {
        console.error("Gagal mengambil data dashboard:", err);
        if (!cancelled) setAgreements([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAgreements();

    return () => {
      cancelled = true;
    };
  }, [currentWallet, role]);

  const activeCount = agreements.filter((a) => a.status === "ACTIVE").length;
  const pendingCount = agreements.filter(
    (a) => a.status === "PENDING" || a.status === "ANCHORING"
  ).length;
  const completedCount = agreements.filter((a) => a.status === "COMPLETED").length;

  const createButtonClass =
    "items-center gap-1.5 rounded-xl bg-[#34d399] px-4 py-2 font-mono text-xs font-bold text-[#08090c] shadow-lg shadow-[#34d399]/20 transition hover:bg-[#2cc08a]";

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-[#08090c] pb-24 font-sans text-white antialiased ${theme.selection}`}
    >
      <div
        className={`pointer-events-none fixed right-[8%] top-[-12%] h-[480px] w-[480px] rounded-full blur-[140px] transition-colors duration-500 ${theme.glow}`}
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
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-zinc-400 transition hover:border-white/[0.16] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>BERANDA</span>
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
              WORKSPACE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/create" className={`hidden sm:flex ${createButtonClass}`}>
              <Plus className="h-3.5 w-3.5" />
              <span>BUAT KESEPAKATAN</span>
            </Link>
            <ConnectButton accountStatus="avatar" chainStatus="icon" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-8 px-6 pt-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <span
              className={`font-mono text-[10px] uppercase tracking-widest transition-colors ${theme.text}`}
            >
              Protocol Dashboard
            </span>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Kesepakatan</h1>
          </div>

          <div
            role="tablist"
            aria-label="Peran"
            className="flex self-start rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1 sm:self-auto"
          >
            {roleOptions.map(({ value, label, icon: Icon }) => {
              const selected = role === value;
              const optionTheme = ROLE_THEME[value];
              return (
                <button
                  key={value}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setRole(value)}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2 font-mono text-xs font-bold transition ${
                    selected
                      ? `${optionTheme.solid} ${optionTheme.solidText} shadow-lg ${optionTheme.shadow}`
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <FileText className="h-3 w-3" /> Total
            </span>
            <div className="font-mono text-2xl font-bold text-white">{agreements.length}</div>
          </div>
          <div className="space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#34d399]">
              <CheckCircle2 className="h-3 w-3" /> Aktif
            </span>
            <div className="font-mono text-2xl font-bold text-[#34d399]">{activeCount}</div>
          </div>
          <div className="space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber-400">
              <Clock className="h-3 w-3" /> Menunggu
            </span>
            <div className="font-mono text-2xl font-bold text-amber-400">{pendingCount}</div>
          </div>
          <div className="space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              <Layers className="h-3 w-3" /> Selesai
            </span>
            <div className="font-mono text-2xl font-bold text-zinc-200">{completedCount}</div>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-4 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-12 text-center backdrop-blur-sm">
            <Wallet className="mx-auto h-10 w-10 text-zinc-600" />
            <h3 className="text-base font-semibold text-white">Dompet Belum Terhubung</h3>
            <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-400">
              Hubungkan dompet Web3 Anda untuk melihat daftar kontrak dan perjanjian kerja.
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-3 p-16 text-zinc-400">
            <Loader2 className={`h-5 w-5 animate-spin ${theme.text}`} />
            <span className="font-mono text-xs uppercase tracking-wider">
              Mengambil data kesepakatan...
            </span>
          </div>
        ) : agreements.length === 0 ? (
          <div className="space-y-4 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-12 text-center backdrop-blur-sm">
            <AlertCircle className="mx-auto h-10 w-10 text-zinc-600" />
            <h3 className="text-base font-semibold text-white">Belum Ada Kesepakatan</h3>
            <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-400">
              {role === "client"
                ? "Anda belum membuat kesepakatan kerja. Buat kontrak pertama untuk memulai."
                : "Belum ada kontrak yang menugaskan alamat dompet Anda sebagai worker."}
            </p>
            {role === "client" && (
              <div className="pt-2">
                <Link href="/create" className={`inline-flex px-6 py-2.5 ${createButtonClass}`}>
                  <Plus className="h-3.5 w-3.5" />
                  <span>BUAT KESEPAKATAN</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {agreements.map((a) => (
              <Link
                key={a.id}
                href={`/project/${a.id}`}
                className={`group block space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm transition ${theme.cardHover}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      ID: {a.id.slice(0, 8)}...
                    </span>
                    <h3
                      className={`line-clamp-1 text-base font-semibold text-white transition ${theme.titleHover}`}
                    >
                      {a.title}
                    </h3>
                  </div>

                  <span
                    className={`shrink-0 rounded border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase ${
                      STATUS_BADGE[a.status] ?? DEFAULT_BADGE
                    }`}
                  >
                    {a.status}
                  </span>
                </div>

                <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
                  {a.description}
                </p>

                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 font-mono text-xs">
                  <span className="max-w-[200px] truncate text-zinc-500">
                    {role === "client"
                      ? `Worker: ${a.worker_address.slice(0, 10)}...`
                      : `Klien: ${a.client_address.slice(0, 10)}...`}
                  </span>
                  <span
                    className={`flex items-center gap-1 transition group-hover:translate-x-1 ${theme.text}`}
                  >
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