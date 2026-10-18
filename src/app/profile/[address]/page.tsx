"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { isAddress } from "viem";
import {
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  Award,
  Briefcase,
  Coins,
  FileCheck2,
  Loader2,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Role = "worker" | "client";

interface ReputationBadge {
  id: string;
  token_id: number | string;
  token_uri: string | null;
  title: string;
  role: string;
  total_idr: number | string;
  mint_tx_hash: string;
}

interface MilestoneRow {
  amount: number | string | null;
}

interface CompletedAgreement {
  id: string;
  title: string;
  description: string;
  worker_address: string;
  client_address: string;
  milestones: MilestoneRow[] | null;
}

const ROLE_STYLE: Record<Role, { text: string; chip: string }> = {
  worker: {
    text: "text-[#ff5733]",
    chip: "border-[#ff4625]/30 bg-[#ff4625]/10 text-[#ff5733]",
  },
  client: {
    text: "text-[#34d399]",
    chip: "border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]",
  },
};

const toRole = (value: string): Role => (value.toLowerCase() === "client" ? "client" : "worker");

const extractSvgFromUri = (uri: string | null): string | null => {
  if (!uri) return null;
  try {
    const base64Json = uri.replace("data:application/json;base64,", "");
    const parsed = JSON.parse(atob(base64Json)) as { image?: string };
    return parsed.image?.startsWith("data:image/") ? parsed.image : null;
  } catch {
    return null;
  }
};

const ghostButton =
  "rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 font-mono text-xs text-zinc-300 transition hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white";

export default function PublicProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const targetWallet = address.toLowerCase();
  const validAddress = isAddress(targetWallet);

  const [badges, setBadges] = useState<ReputationBadge[]>([]);
  const [completedAgreements, setCompletedAgreements] = useState<CompletedAgreement[]>([]);
  const [loading, setLoading] = useState(validAddress);

  useEffect(() => {
    if (!validAddress) return;
    let cancelled = false;

    const fetchProfileData = async () => {
      try {
        setLoading(true);

        const { data: badgeData, error: badgeErr } = await supabase
          .from("reputation_badges")
          .select("*")
          .eq("recipient_address", targetWallet)
          .order("minted_at", { ascending: false });
        if (badgeErr) throw badgeErr;

        const { data: agreeData, error: agreeErr } = await supabase
          .from("agreements")
          .select("*, milestones(*)")
          .or(`worker_address.eq.${targetWallet},client_address.eq.${targetWallet}`)
          .eq("status", "COMPLETED")
          .order("created_at", { ascending: false });
        if (agreeErr) throw agreeErr;

        if (cancelled) return;
        setBadges((badgeData as ReputationBadge[]) || []);
        setCompletedAgreements((agreeData as CompletedAgreement[]) || []);
      } catch (err) {
        console.error("Gagal memuat profil:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfileData();

    return () => {
      cancelled = true;
    };
  }, [targetWallet, validAddress]);

  const totalValueSettled = completedAgreements.reduce(
    (sum, a) =>
      sum + (a.milestones || []).reduce((mSum, m) => mSum + Number(m.amount || 0), 0),
    0
  );

  const hasOnChainRecord = badges.length > 0 || completedAgreements.length > 0;

  if (!validAddress) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#08090c] p-10 text-white">
        <AlertCircle className="h-8 w-8 text-zinc-600" />
        <p className="font-mono text-xs text-zinc-400">Alamat dompet tidak valid.</p>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 font-mono text-xs text-zinc-300 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090c] pb-32 font-sans text-white selection:bg-[#ff4625]/30">
      <div className="pointer-events-none fixed right-[8%] top-[-12%] h-[480px] w-[480px] rounded-full bg-[#ff4625]/[0.05] blur-[140px]" />
      <div className="pointer-events-none fixed bottom-[-12%] left-[-8%] h-[480px] w-[480px] rounded-full bg-[#34d399]/[0.04] blur-[140px]" />
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
              href="/dashboard"
              className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-zinc-400 transition hover:border-white/[0.16] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> DASHBOARD
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
              PROFIL PUBLIK
            </span>
          </div>
          <ConnectButton accountStatus="avatar" chainStatus="icon" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-10 px-6 pt-10">
        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-sm sm:p-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.03] font-mono text-xl font-bold text-white">
                {targetWallet.slice(2, 4).toUpperCase()}
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-mono text-xl font-bold sm:text-2xl">
                    {targetWallet.slice(0, 8)}...{targetWallet.slice(-6)}
                  </h1>
                  {hasOnChainRecord && (
                    <span className="flex items-center gap-1 rounded border border-white/[0.12] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] tracking-wider text-zinc-200">
                      <ShieldCheck className="h-3 w-3" /> TERVERIFIKASI
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-zinc-400">
                  Sepolia L1 Verifiable Reputation Ledger
                </p>
              </div>
            </div>

            <a
              href={`https://sepolia.etherscan.io/address/${targetWallet}`}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-2 self-start sm:self-auto ${ghostButton}`}
            >
              <span>ETHERSCAN</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 border-t border-white/[0.08] pt-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <span className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                <FileCheck2 className="h-3 w-3" /> Kontrak Selesai
              </span>
              <span className="font-mono text-xl font-bold text-white">
                {completedAgreements.length} Proyek
              </span>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <span className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                <Coins className="h-3 w-3" /> Nilai Terselesaikan
              </span>
              <span className="font-mono text-xl font-bold text-white">
                Rp {totalValueSettled.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <span className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                <Award className="h-3 w-3" /> Soulbound Badges
              </span>
              <span className="font-mono text-xl font-bold text-white">{badges.length} SBT</span>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-16 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-mono text-xs uppercase tracking-wider">Memuat profil...</span>
          </div>
        ) : (
          <>
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-zinc-300" />
                <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-zinc-200">
                  Koleksi Soulbound Reputation ({badges.length})
                </h2>
              </div>

              {badges.length === 0 ? (
                <div className="space-y-2 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-12 text-center backdrop-blur-sm">
                  <FolderOpen className="mx-auto h-8 w-8 text-zinc-600" />
                  <p className="font-mono text-xs text-zinc-400">
                    Belum ada sertifikat SBT yang dicetak untuk dompet ini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {badges.map((b) => {
                    const svgImage = extractSvgFromUri(b.token_uri);
                    const style = ROLE_STYLE[toRole(b.role)];

                    return (
                      <div
                        key={b.id}
                        className="flex flex-col justify-between space-y-4 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-sm transition hover:border-white/[0.2]"
                      >
                        <div className="space-y-3">
                          {svgImage ? (
                            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-black/60 p-2">
                              <img
                                src={svgImage}
                                alt={b.title}
                                className="h-full w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex aspect-[4/5] flex-col items-center justify-center space-y-2 rounded-2xl border border-white/[0.08] bg-black/40 p-6 text-center">
                              <Award className={`h-10 w-10 ${style.text}`} />
                              <h4 className="text-sm font-semibold text-white">{b.title}</h4>
                              <span className="font-mono text-[11px] text-zinc-400">
                                Rp {Number(b.total_idr).toLocaleString("id-ID")}
                              </span>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <span
                              className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${style.chip}`}
                            >
                              {b.role}
                            </span>
                            <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                              Token ID #{b.token_id}
                            </span>
                            <h3 className="line-clamp-1 text-sm font-semibold text-white">
                              {b.title}
                            </h3>
                          </div>
                        </div>

                        <a
                          href={`https://sepolia.etherscan.io/tx/${b.mint_tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between border-t border-white/[0.06] pt-3 font-mono text-xs text-zinc-400 transition hover:text-white"
                        >
                          <span>BUKTI TRANSAKSI</span>
                          <ExternalLink className={`h-3 w-3 ${style.text}`} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-zinc-300" />
                <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-zinc-200">
                  Riwayat Pekerjaan Terverifikasi ({completedAgreements.length})
                </h2>
              </div>

              {completedAgreements.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center font-mono text-xs text-zinc-500 backdrop-blur-sm">
                  Belum ada kontrak yang diselesaikan.
                </div>
              ) : (
                <div className="space-y-3">
                  {completedAgreements.map((a) => {
                    const role: Role =
                      a.worker_address.toLowerCase() === targetWallet ? "worker" : "client";
                    const style = ROLE_STYLE[role];

                    return (
                      <div
                        key={a.id}
                        className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">{a.title}</h3>
                            <span
                              className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${style.chip}`}
                            >
                              {role}
                            </span>
                            <span className="rounded border border-white/[0.12] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                              100% SETTLED
                            </span>
                          </div>
                          <p className="line-clamp-1 text-xs text-zinc-400">{a.description}</p>
                        </div>

                        <div className="flex shrink-0 items-center gap-3 self-start sm:self-auto">
                          <Link href={`/project/${a.id}`} className={ghostButton}>
                            RINCIAN KONTRAK
                          </Link>
                          <Link
                            href={`/verify/${a.id}`}
                            className={`rounded-xl border px-4 py-2 font-mono text-xs transition ${style.chip} hover:brightness-125`}
                          >
                            SERTIFIKAT AUDIT
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}