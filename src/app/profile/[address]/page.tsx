"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  Layers,
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const resolvedParams = use(params);
  const targetWallet = resolvedParams.address.toLowerCase();

  const [badges, setBadges] = useState<any[]>([]);
  const [completedAgreements, setCompletedAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);

        // 1. Ambil seluruh SBT yang dimiliki wallet ini
        const { data: badgeData } = await supabase
          .from("reputation_badges")
          .select("*")
          .eq("recipient_address", targetWallet)
          .order("minted_at", { ascending: false });

        setBadges(badgeData || []);

        // 2. Ambil riwayat perjanjian yang telah selesai
        const { data: agreeData } = await supabase
          .from("agreements")
          .select("*, milestones(*)")
          .or(`worker_address.eq.${targetWallet},client_address.eq.${targetWallet}`)
          .eq("status", "COMPLETED")
          .order("created_at", { ascending: false });

        setCompletedAgreements(agreeData || []);
      } catch (err) {
        console.error("Gagal memuat profil:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [targetWallet]);

  const totalValueSettled = completedAgreements.reduce((sum, a) => {
    const agreeTotal = (a.milestones || []).reduce(
      (mSum: number, m: any) => mSum + Number(m.amount || 0),
      0
    );
    return sum + agreeTotal;
  }, 0);

  // Helper decode on-chain SVG dari data:application/json;base64
  const extractSvgFromUri = (uri: string) => {
    try {
      if (!uri) return null;
      const base64Json = uri.replace("data:application/json;base64,", "");
      const parsedJson = JSON.parse(atob(base64Json));
      return parsedJson.image; // data:image/svg+xml;base64,...
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-white selection:bg-[#ff4625]/30 font-sans pb-32 relative overflow-hidden">
      {/* Ambient Lighting */}
      <div className="pointer-events-none fixed top-[-10%] right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-[#ff4625]/10 to-[#8b5cf6]/10 blur-[140px] rounded-full" />
      <div className="pointer-events-none fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#6366f1]/10 to-transparent blur-[160px] rounded-full" />

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
              href="/dashboard"
              className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition py-1 px-3 rounded-full bg-white/[0.03] border border-white/[0.06]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> DASHBOARD
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="font-mono text-xs text-zinc-400 uppercase">PROFIL PUBLIK</span>
          </div>
          <ConnectButton accountStatus="avatar" chainStatus="icon" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-10 relative z-10">
        {/* Identitas Profil Card */}
        <div className="p-8 sm:p-10 rounded-3xl border border-white/[0.08] bg-[#0e1017]/90 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff4625] to-[#8b5cf6] p-[2px] shadow-xl shadow-[#ff4625]/20">
                <div className="w-full h-full bg-[#08090c] rounded-[14px] flex items-center justify-center font-mono font-bold text-xl text-[#ff5733]">
                  {targetWallet.slice(2, 4).toUpperCase()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold font-mono text-white">
                    {targetWallet.slice(0, 8)}...{targetWallet.slice(-6)}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> VERIFIED
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">
                  Sepolia L1 Verifiable Reputation Ledger
                </p>
              </div>
            </div>

            <a
              href={`https://sepolia.etherscan.io/address/${targetWallet}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-zinc-300 flex items-center gap-2 self-start sm:self-auto transition"
            >
              <span>ETHERSCAN</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Metric Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 mt-8 border-t border-white/[0.06]">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                TOTAL KONTRAK SELESAI
              </span>
              <span className="text-xl font-bold font-mono text-white">
                {completedAgreements.length} Proyek
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                TOTAL NILAI TERSELESAIKAN
              </span>
              <span className="text-xl font-bold font-mono text-[#ff5733]">
                Rp {totalValueSettled.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                SOULBOUND BADGES TERKUMPUL
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {badges.length} NFT SBT
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Koleksi SBT Reputasi On-Chain */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-[#ff5733]" />
            <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-zinc-200">
              Koleksi Soulbound Reputation ({badges.length})
            </h2>
          </div>

          {badges.length === 0 ? (
            <div className="p-12 rounded-3xl border border-white/[0.06] bg-[#0e1017] text-center space-y-2">
              <Sparkles className="h-8 w-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-mono text-zinc-400">
                Belum ada sertifikat SBT yang dicetak untuk dompet ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {badges.map((b) => {
                const svgImage = extractSvgFromUri(b.token_uri);

                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-3xl bg-[#0e1017] border border-white/[0.08] hover:border-[#ff5733]/40 transition space-y-4 shadow-xl flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {svgImage ? (
                        <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-black/60 aspect-[4/5] flex items-center justify-center p-2">
                          <img
                            src={svgImage}
                            alt={b.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-white/[0.06] bg-black/40 aspect-[4/5] flex flex-col items-center justify-center p-6 text-center space-y-2">
                          <Award className="h-10 w-10 text-[#ff5733]" />
                          <h4 className="font-bold text-sm text-white">{b.title}</h4>
                          <span className="text-[11px] font-mono text-zinc-400">
                            Rp {Number(b.total_idr).toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] font-mono text-[#ff5733] uppercase tracking-wider block">
                          TOKEN ID #{b.token_id} • ROLE: {b.role}
                        </span>
                        <h3 className="font-bold text-white text-sm line-clamp-1 mt-0.5">
                          {b.title}
                        </h3>
                      </div>
                    </div>

                    <a
                      href={`https://sepolia.etherscan.io/tx/${b.mint_tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono text-zinc-400 hover:text-white transition"
                    >
                      <span>BUKTI TRANSAKSI</span>
                      <ExternalLink className="h-3 w-3 text-[#ff5733]" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Riwayat Pekerjaan Terverifikasi */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[#ff5733]" />
            <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-zinc-200">
              Riwayat Pekerjaan Terverifikasi ({completedAgreements.length})
            </h2>
          </div>

          <div className="space-y-3">
            {completedAgreements.map((a) => (
              <div
                key={a.id}
                className="p-6 rounded-2xl bg-[#0e1017] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">{a.title}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      100% SETTLED
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1">{a.description}</p>
                </div>

                <div className="flex items-center gap-4 self-start sm:self-auto shrink-0">
                  <Link
                    href={`/project/${a.id}`}
                    className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-zinc-300 transition"
                  >
                    RINCIAN KONTRAK
                  </Link>
                  <Link
                    href={`/verify/${a.id}`}
                    className="px-4 py-2 rounded-xl bg-[#ff4625]/10 hover:bg-[#ff4625]/20 border border-[#ff4625]/30 text-xs font-mono text-[#ff6644] transition"
                  >
                    SERTIFIKAT AUDIT
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}