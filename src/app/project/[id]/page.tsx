"use client";

import { useCallback, useEffect, useState, use, type ReactNode } from "react";
import Link from "next/link";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { toHex, parseEventLogs } from "viem";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  FileText,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  RotateCw,
  Award,
  Layers,
  Check,
  Clock,
  ArrowUpRight,
  Send,
  Banknote,
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WORKCHAIN_ABI } from "@/constants/ABI";
import { SBT_ABI } from "@/constants/SBT_ABI";
import { supabase } from "@/lib/supabase";
import { canonicalizeJson, hashCanonical } from "@/lib/canonical";

interface Agreement {
  id: string;
  title: string;
  description: string;
  status: string;
  client_address: string;
  worker_address: string;
  chain_agreement_id: number | string | null;
}

interface Milestone {
  id: string;
  agreement_id: string;
  idx: number;
  title: string;
  description: string;
  amount: number | string;
  status: string;
  payment_confirmed: boolean | null;
  payment_ref: string | null;
}

interface Deliverable {
  milestone_id: string;
  version: number;
  note: string | null;
  manifest_canonical: string | null;
}

interface PaymentRecord {
  milestone_id: string;
  method: string;
  reference: string;
  paid_on: string;
}

interface ReputationBadge {
  token_id: number | string;
}

const ONCHAIN_STATUS_MAP: Record<number, string> = {
  0: "PENDING",
  1: "ACTIVE",
  2: "COMPLETED",
  3: "DISPUTED",
  4: "CANCELLED",
};

const MILESTONE_BADGE: Record<string, string> = {
  IN_PROGRESS: "border-[#ff4625]/30 bg-[#ff4625]/10 text-[#ff5733]",
  SUBMITTED: "border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]",
  APPROVED: "border-white/[0.16] bg-white/[0.06] text-zinc-200",
  REVISION_REQUESTED: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};
const DEFAULT_MILESTONE_BADGE = "border-white/[0.08] bg-white/[0.03] text-zinc-500";

const STATUS_DOT: Record<string, string> = {
  ACTIVE: "bg-[#34d399] shadow-[0_0_8px_#34d399]",
  COMPLETED: "bg-white shadow-[0_0_8px_#ffffff80]",
};
const DEFAULT_STATUS_DOT = "bg-amber-400 shadow-[0_0_8px_#fbbf24]";

const workerButton =
  "flex items-center justify-center gap-2 rounded-xl bg-[#ff4625] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-lg shadow-[#ff4625]/20 transition hover:bg-[#e03a1a] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";
const clientButton =
  "flex items-center justify-center gap-2 rounded-xl bg-[#34d399] px-5 py-2.5 font-mono text-xs font-bold text-[#08090c] shadow-lg shadow-[#34d399]/20 transition hover:bg-[#2cc08a] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";
const ghostButton =
  "rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 font-mono text-xs text-zinc-400 transition hover:border-white/[0.16] hover:text-white";
const baseInput =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.02] text-white placeholder:text-zinc-600 transition focus:bg-white/[0.04] focus:outline-none [color-scheme:dark]";
const workerInput = `${baseInput} px-4 py-2.5 text-xs focus:border-[#ff4625]/60 focus:ring-1 focus:ring-[#ff4625]/30`;
const clientInput = `${baseInput} px-3 py-2 text-xs focus:border-[#34d399]/60 focus:ring-1 focus:ring-[#34d399]/30`;

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === "object" && err !== null) {
    const { details, message } = err as { details?: string; message?: string };
    return details || message || fallback;
  }
  return fallback;
};

const getChainId = (agreement: Agreement): bigint => {
  if (!agreement.chain_agreement_id) {
    throw new Error("Agreement belum memiliki chain_agreement_id yang valid.");
  }
  return BigInt(agreement.chain_agreement_id);
};

const getManifestLink = (canonical: string | null): string | null => {
  if (!canonical) return null;
  try {
    const { link } = JSON.parse(canonical) as { link?: string };
    if (!link) return null;
    const url = new URL(link);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
};

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
      {children}
    </span>
  );
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);

  const { address } = useAccount();
  const publicClient = usePublicClient();
  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;
  const sbtContractAddress = (process.env.NEXT_PUBLIC_SBT_CONTRACT_ADDRESS || "") as `0x${string}`;
  const { writeContractAsync } = useWriteContract();

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [deliverables, setDeliverables] = useState<Record<string, Deliverable>>({});
  const [paymentRecords, setPaymentRecords] = useState<Record<string, PaymentRecord>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionError, setActionError] = useState("");

  const [activeSubmitIdx, setActiveSubmitIdx] = useState<number | null>(null);
  const [manifestLink, setManifestLink] = useState("");
  const [manifestNote, setManifestNote] = useState("");

  const [activeAttestIdx, setActiveAttestIdx] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payReference, setPayReference] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const [claimedBadge, setClaimedBadge] = useState<ReputationBadge | null>(null);
  const [mintLoading, setMintLoading] = useState(false);

  const currentAddr = address?.toLowerCase() || "";
  const isClient = agreement !== null && currentAddr === agreement.client_address.toLowerCase();
  const isWorker = agreement !== null && currentAddr === agreement.worker_address.toLowerCase();
  const glow = isClient ? "bg-[#34d399]/[0.06]" : "bg-[#ff4625]/[0.06]";

  const confirmTx = async (hash: `0x${string}`) => {
    if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
  };

  const getOrCreateUser = async (walletAddr: string) => {
    const { data: user, error } = await supabase
      .from("users")
      .select("id")
      .eq("wallet", walletAddr)
      .maybeSingle();

    if (error) throw error;
    if (user) return user;

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({ wallet: walletAddr, display_name: `User ${walletAddr.slice(0, 6)}` })
      .select("id")
      .single();
    if (insertError) throw insertError;
    return newUser;
  };

  const syncOnChainStatus = useCallback(
    async (agree: Agreement, msList: Milestone[]) => {
      if (!publicClient || !contractAddress || !agree.chain_agreement_id) {
        return { agree, msList };
      }

      try {
        setIsSyncing(true);
        const result = (await publicClient.readContract({
          address: contractAddress,
          abi: WORKCHAIN_ABI,
          functionName: "agreements",
          args: [BigInt(agree.chain_agreement_id)],
        })) as unknown;

        const statusCode = Array.isArray(result)
          ? Number(result[4])
          : Number((result as { status?: number | bigint }).status);
        const onChainStatus = ONCHAIN_STATUS_MAP[statusCode];

        if (onChainStatus && onChainStatus !== agree.status) {
          await supabase.from("agreements").update({ status: onChainStatus }).eq("id", agree.id);

          let nextMs = msList;
          if (onChainStatus === "ACTIVE" && msList[0]?.status === "PENDING") {
            await supabase.from("milestones").update({ status: "IN_PROGRESS" }).eq("id", msList[0].id);
            nextMs = msList.map((m, i) => (i === 0 ? { ...m, status: "IN_PROGRESS" } : m));
          }
          return { agree: { ...agree, status: onChainStatus }, msList: nextMs };
        }
      } catch (err) {
        console.warn("[Auto-Sync] Tidak dapat membaca state on-chain:", err);
      } finally {
        setIsSyncing(false);
      }

      return { agree, msList };
    },
    [publicClient, contractAddress]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const { data: agreeData, error: agreeErr } = await supabase
        .from("agreements")
        .select("*")
        .eq("id", projectId)
        .single();
      if (agreeErr) throw agreeErr;

      const { data: msData, error: msErr } = await supabase
        .from("milestones")
        .select("*")
        .eq("agreement_id", projectId)
        .order("idx", { ascending: true });
      if (msErr) throw msErr;

      const synced = await syncOnChainStatus(agreeData as Agreement, (msData as Milestone[]) || []);
      setAgreement(synced.agree);
      setMilestones(synced.msList);

      const msIds = synced.msList.map((m) => m.id);
      if (msIds.length === 0) return;

      const { data: delivData } = await supabase
        .from("deliverables")
        .select("*")
        .in("milestone_id", msIds)
        .order("version", { ascending: false });

      const dMap: Record<string, Deliverable> = {};
      ((delivData as Deliverable[]) || []).forEach((d) => {
        if (!dMap[d.milestone_id]) dMap[d.milestone_id] = d;
      });
      setDeliverables(dMap);

      const { data: payData } = await supabase
        .from("payment_records")
        .select("*")
        .in("milestone_id", msIds);

      const pMap: Record<string, PaymentRecord> = {};
      ((payData as PaymentRecord[]) || []).forEach((p) => {
        pMap[p.milestone_id] = p;
      });
      setPaymentRecords(pMap);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(getErrorMessage(err, "Gagal memuat rincian kesepakatan."));
    } finally {
      setLoading(false);
    }
  }, [projectId, syncOnChainStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!projectId || !address) return;
    let cancelled = false;

    const checkClaimed = async () => {
      const { data } = await supabase
        .from("reputation_badges")
        .select("*")
        .eq("agreement_id", projectId)
        .eq("recipient_address", address.toLowerCase())
        .maybeSingle();
      if (!cancelled) setClaimedBadge(data as ReputationBadge | null);
    };
    checkClaimed();

    return () => {
      cancelled = true;
    };
  }, [projectId, address]);

  const runAction = async (task: () => Promise<void>, fallback: string) => {
    setActionLoading(true);
    setActionError("");
    try {
      await task();
    } catch (err: unknown) {
      console.error(err);
      setActionError(getErrorMessage(err, fallback));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptAgreement = () =>
    runAction(async () => {
      if (!agreement) return;
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "acceptAgreement",
        args: [getChainId(agreement)],
        gas: BigInt(200000),
      });
      await confirmTx(tx);

      await supabase.from("agreements").update({ status: "ACTIVE" }).eq("id", agreement.id);
      if (milestones.length > 0) {
        await supabase.from("milestones").update({ status: "IN_PROGRESS" }).eq("id", milestones[0].id);
      }
      await loadData();
    }, "Gagal menyetujui perjanjian on-chain.");

  const handleSubmitDeliverable = (e: React.FormEvent, mId: string, idx: number) => {
    e.preventDefault();
    return runAction(async () => {
      if (!agreement || !address) return;
      const user = await getOrCreateUser(currentAddr);

      const manifestCanonical = canonicalizeJson({
        note: manifestNote.trim(),
        link: manifestLink.trim(),
        timestamp: Date.now(),
      });
      const manifestHash = hashCanonical(manifestCanonical);

      const tx = await writeContractAsync({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "submitMilestone",
        args: [getChainId(agreement), idx, manifestHash],
      });
      await confirmTx(tx);

      const { count } = await supabase
        .from("deliverables")
        .select("*", { count: "exact", head: true })
        .eq("milestone_id", mId);

      await supabase.from("deliverables").insert({
        milestone_id: mId,
        version: (count || 0) + 1,
        submitted_by: user.id,
        note: manifestNote.trim(),
        manifest_canonical: manifestCanonical,
        manifest_hash: manifestHash,
      });

      await supabase
        .from("milestones")
        .update({
          status: "SUBMITTED",
          deliverable_hash: manifestHash,
          status_changed_at: new Date().toISOString(),
        })
        .eq("id", mId);

      setActiveSubmitIdx(null);
      setManifestLink("");
      setManifestNote("");
      await loadData();
    }, "Gagal submit deliverable.");
  };

  const handleApproveMilestone = (mId: string, idx: number) =>
    runAction(async () => {
      if (!agreement) return;
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "approveMilestone",
        args: [getChainId(agreement), idx],
      });
      await confirmTx(tx);

      await supabase
        .from("milestones")
        .update({ status: "APPROVED", status_changed_at: new Date().toISOString() })
        .eq("id", mId);
      await loadData();
    }, "Gagal menyetujui deliverable.");

  const handleAttestPayment = (e: React.FormEvent, milestone: Milestone) => {
    e.preventDefault();
    return runAction(async () => {
      if (!agreement || !address) return;
      const user = await getOrCreateUser(currentAddr);

      const receiptObj = {
        agreement_id: agreement.id,
        milestone_idx: milestone.idx,
        amount_paid: Number(milestone.amount),
        currency: "IDR",
        method: payMethod,
        reference: payReference.trim(),
        notes: payNotes.trim(),
        paid_on: new Date().toISOString().slice(0, 10),
        salt: toHex(crypto.getRandomValues(new Uint8Array(16))),
      };
      const receiptCanonical = canonicalizeJson(receiptObj);
      const paymentRef = hashCanonical(receiptCanonical);

      const tx = await writeContractAsync({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "attestPayment",
        args: [getChainId(agreement), milestone.idx, paymentRef],
      });
      await confirmTx(tx);

      await supabase.from("payment_records").insert({
        milestone_id: milestone.id,
        amount_paid: Number(milestone.amount),
        currency: "IDR",
        method: payMethod,
        reference: payReference.trim(),
        paid_on: receiptObj.paid_on,
        receipt_canonical: receiptCanonical,
        payment_ref: paymentRef,
        attested_by: user.id,
      });
      await supabase.from("milestones").update({ payment_ref: paymentRef }).eq("id", milestone.id);

      setActiveAttestIdx(null);
      setPayReference("");
      setPayNotes("");
      await loadData();
    }, "Gagal mencatat klaim pembayaran.");
  };

  const handleConfirmPayment = (mId: string, idx: number) =>
    runAction(async () => {
      if (!agreement) return;
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "confirmPayment",
        args: [getChainId(agreement), idx],
      });
      await confirmTx(tx);

      await supabase.from("milestones").update({ payment_confirmed: true }).eq("id", mId);
      await supabase
        .from("payment_records")
        .update({ confirmed_at: new Date().toISOString() })
        .eq("milestone_id", mId);

      const nextMilestone = milestones.find((m) => m.idx === idx + 1);
      if (nextMilestone) {
        await supabase.from("milestones").update({ status: "IN_PROGRESS" }).eq("id", nextMilestone.id);
      } else {
        await supabase.from("agreements").update({ status: "COMPLETED" }).eq("id", agreement.id);
      }
      await loadData();
    }, "Gagal mengonfirmasi pembayaran.");

  const handleClaimBadge = async () => {
    if (!agreement || !address || !sbtContractAddress) {
      setActionError("Dompet belum terhubung atau alamat kontrak SBT belum diset di .env.local.");
      return;
    }

    try {
      setMintLoading(true);
      setActionError("");
      const roleStr = isWorker ? "WORKER" : "CLIENT";
      const totalIdr = BigInt(milestones.reduce((acc, m) => acc + Number(m.amount), 0));

      const tx = await writeContractAsync({
        address: sbtContractAddress,
        abi: SBT_ABI,
        functionName: "mintBadge",
        args: [
          address,
          getChainId(agreement),
          agreement.title,
          totalIdr,
          milestones.length,
          isWorker ? 0 : 1,
        ],
        gas: BigInt(200000),
      });

      let mintedTokenId = 1;
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
        try {
          const logs = parseEventLogs({
            abi: SBT_ABI,
            eventName: "BadgeMinted",
            logs: receipt.logs,
          });
          if (logs.length > 0) {
            const { tokenId } = logs[0].args as unknown as { tokenId: bigint };
            mintedTokenId = Number(tokenId);
          }
        } catch (err) {
          console.warn("Log parse fallback:", err);
        }
      }

      let tokenUriStr = "";
      try {
        if (publicClient) {
          tokenUriStr = (await publicClient.readContract({
            address: sbtContractAddress,
            abi: SBT_ABI,
            functionName: "tokenURI",
            args: [BigInt(mintedTokenId)],
          })) as string;
        }
      } catch (err) {
        console.warn("tokenURI tidak terbaca:", err);
      }

      const { data: badgeData, error: badgeErr } = await supabase
        .from("reputation_badges")
        .insert({
          agreement_id: projectId,
          recipient_address: address.toLowerCase(),
          role: roleStr,
          token_id: mintedTokenId,
          mint_tx_hash: tx,
          title: agreement.title,
          total_idr: Number(totalIdr),
          token_uri: tokenUriStr,
        })
        .select()
        .single();

      if (badgeErr) throw badgeErr;
      setClaimedBadge(badgeData as ReputationBadge);
    } catch (err: unknown) {
      console.error(err);
      setActionError(getErrorMessage(err, "Gagal mencetak badge reputasi."));
    } finally {
      setMintLoading(false);
    }
  };

  if (loading && !agreement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090c] text-zinc-400">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-mono text-xs uppercase tracking-wider">Loading Protocol Context...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !agreement) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-[#08090c] p-8 text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <p className="font-mono text-xs text-zinc-400">{errorMsg || "Perjanjian tidak ditemukan."}</p>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 font-mono text-xs text-zinc-300 transition hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" /> Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const totalValue = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const completedMilestones = milestones.filter((m) => m.payment_confirmed).length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090c] pb-32 font-sans text-white antialiased selection:bg-[#ff4625]/30">
      <div
        className={`pointer-events-none fixed right-[8%] top-[-12%] h-[480px] w-[480px] rounded-full blur-[140px] ${glow}`}
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
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-zinc-400 transition hover:border-white/[0.16] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>DASHBOARD</span>
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="max-w-[150px] truncate font-mono text-xs text-zinc-400 sm:max-w-none">
              {agreement.id.slice(0, 8)}...
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isSyncing || loading}
              aria-label="Sinkronkan status dengan blockchain"
              title="Sinkronkan status dengan blockchain"
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-zinc-400 transition hover:border-white/[0.2] hover:text-white disabled:opacity-60"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isSyncing || loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href={`/verify/${agreement.id}`}
              className="hidden items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 font-mono text-xs text-zinc-300 transition hover:border-white/[0.2] hover:text-white sm:flex"
            >
              <span>AUDIT RECORD</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <ConnectButton accountStatus="avatar" chainStatus="icon" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-8 px-6 pt-10">
        {actionError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span className="break-all">{actionError}</span>
          </div>
        )}

        {agreement.status === "COMPLETED" && (isWorker || isClient) && (
          <section
            className={`rounded-3xl border p-6 backdrop-blur-sm ${
              isClient
                ? "border-[#34d399]/30 bg-[#34d399]/[0.04]"
                : "border-[#ff4625]/30 bg-[#ff4625]/[0.04]"
            }`}
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-1.5">
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                    isClient
                      ? "border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]"
                      : "border-[#ff4625]/30 bg-[#ff4625]/10 text-[#ff5733]"
                  }`}
                >
                  <Award className="h-3 w-3" /> On-chain reputation ready
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {claimedBadge ? "Sertifikat SBT Terverifikasi" : "Klaim Sertifikat Reputasi Soulbound"}
                </h3>
                <p className="max-w-xl text-xs leading-relaxed text-zinc-400">
                  {claimedBadge
                    ? `SBT Token #${claimedBadge.token_id} telah dicetak permanen ke dompet Anda sebagai bukti rekam jejak profesional.`
                    : "Proyek telah 100% selesai dan lunas. Cetak lencana non-transferable ERC-721 ke dompet Anda untuk dipamerkan di profil publik."}
                </p>
              </div>

              {claimedBadge ? (
                <Link href={`/profile/${address}`} className={isClient ? clientButton : workerButton}>
                  <span>LIHAT DI PROFIL</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  onClick={handleClaimBadge}
                  disabled={mintLoading}
                  className={isClient ? clientButton : workerButton}
                >
                  {mintLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>MINTING ON-CHAIN...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>KLAIM SBT REPUTASI</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </section>
        )}

        {agreement.status === "PENDING" && isWorker && (
          <section className="rounded-2xl border border-[#ff4625]/30 bg-[#ff4625]/[0.04] p-6 backdrop-blur-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#ff4625]/30 bg-[#ff4625]/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#ff5733]">
                  <AlertCircle className="h-3 w-3" /> Action required
                </div>
                <h3 className="text-base font-semibold text-white">
                  Perjanjian Menunggu Tanda Tangan Anda
                </h3>
                <p className="text-xs leading-relaxed text-zinc-400">
                  Klien telah mengunci hash terms ke smart contract. Tandatangani untuk mengaktifkan
                  status perjanjian.
                </p>
              </div>
              <button
                onClick={handleAcceptAgreement}
                disabled={actionLoading}
                className={`self-start sm:self-auto ${workerButton}`}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>MEMPROSES...</span>
                  </>
                ) : (
                  "TANDATANGANI & TERIMA"
                )}
              </button>
            </div>
          </section>
        )}

        {agreement.status === "PENDING" && isClient && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs text-zinc-400 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 shrink-0 text-[#34d399]" />
              <span>
                Menunggu respon tanda tangan dari Worker (
                <code className="font-mono text-zinc-200">{agreement.worker_address.slice(0, 10)}...</code>)
              </span>
            </div>
            <span className="hidden font-mono text-[10px] uppercase tracking-wider text-zinc-500 sm:block">
              On-chain offer open
            </span>
          </div>
        )}

        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-sm sm:p-10">
          <div className="flex flex-col justify-between gap-6 border-b border-white/[0.08] pb-8 lg:flex-row lg:items-start">
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded border border-white/[0.12] bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-300">
                  Contract Spec V3.1
                </span>
                <span className="text-zinc-600">•</span>
                <span className="font-mono text-xs uppercase text-zinc-400">
                  ID: {agreement.id.slice(0, 12)}
                </span>
              </div>
              <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {agreement.title}
              </h1>
              <p className="text-sm leading-relaxed text-zinc-400">{agreement.description}</p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-1.5">
                <span className={`h-2 w-2 rounded-full ${STATUS_DOT[agreement.status] ?? DEFAULT_STATUS_DOT}`} />
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-white">
                  {agreement.status}
                </span>
              </div>
              <span className="font-mono text-[11px] text-zinc-500">
                CHAIN ID: {agreement.chain_agreement_id || "NOT ANCHORED"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 md:grid-cols-4">
            <Stat label="Total Valuasi">
              <span className="font-mono text-base font-bold text-white sm:text-lg">
                Rp {totalValue.toLocaleString("id-ID")}
              </span>
            </Stat>
            <Stat label="Progress Milestone">
              <span className="font-mono text-base font-bold text-white sm:text-lg">
                {completedMilestones} / {milestones.length}{" "}
                <span className="text-xs font-normal text-zinc-500">Selesai</span>
              </span>
            </Stat>
            <Stat label="Dompet Klien">
              <span className="block truncate font-mono text-xs text-[#34d399]">
                {agreement.client_address}
              </span>
            </Stat>
            <Stat label="Dompet Worker">
              <span className="block truncate font-mono text-xs text-[#ff5733]">
                {agreement.worker_address}
              </span>
            </Stat>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-zinc-300" />
              <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-zinc-200">
                Peta Termin & Eksekusi ({milestones.length})
              </h2>
            </div>
            <span className="font-mono text-[11px] text-zinc-500">
              SETTLEMENT: IDR (P2P) + ON-CHAIN ATTESTATION
            </span>
          </div>

          <div className="space-y-4">
            {milestones.map((m) => {
              const deliv = deliverables[m.id];
              const pay = paymentRecords[m.id];
              const delivLink = getManifestLink(deliv?.manifest_canonical ?? null);
              const isCurrent =
                m.status === "IN_PROGRESS" ||
                m.status === "SUBMITTED" ||
                (m.status === "APPROVED" && !m.payment_confirmed);

              return (
                <div
                  key={m.id}
                  className={`space-y-6 rounded-2xl border p-6 backdrop-blur-sm transition sm:p-7 ${
                    isCurrent
                      ? "border-white/[0.16] bg-white/[0.04]"
                      : "border-white/[0.08] bg-white/[0.02]"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3 sm:items-center">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border font-mono text-xs font-bold ${
                          m.payment_confirmed
                            ? "border-[#34d399]/40 bg-[#34d399]/15 text-[#34d399]"
                            : isCurrent
                            ? "border-white/[0.2] bg-white/[0.08] text-white"
                            : "border-white/[0.08] bg-white/[0.04] text-zinc-500"
                        }`}
                      >
                        {m.payment_confirmed ? <Check className="h-3.5 w-3.5" /> : m.idx + 1}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-base font-semibold tracking-tight text-white">{m.title}</h3>
                          <span className="font-mono text-xs font-semibold text-zinc-300">
                            Rp {Number(m.amount).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-400">{m.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`rounded border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                          MILESTONE_BADGE[m.status] ?? DEFAULT_MILESTONE_BADGE
                        }`}
                      >
                        {m.status}
                      </span>
                      {m.payment_confirmed && (
                        <span className="flex items-center gap-1 rounded border border-[#34d399]/40 bg-[#34d399]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#34d399]">
                          <CheckCircle2 className="h-3 w-3" /> Settled
                        </span>
                      )}
                    </div>
                  </div>

                  {deliv && (
                    <div className="space-y-2 rounded-xl border border-white/[0.08] bg-black/40 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
                          <FileText className="h-3.5 w-3.5 text-[#ff5733]" />
                          MANIFEST VERSI #{deliv.version}
                        </span>
                        {delivLink && (
                          <a
                            href={delivLink}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="flex items-center gap-1 font-mono text-xs text-[#ff5733] hover:underline"
                          >
                            Buka Tautan Bukti <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-zinc-300">
                        {deliv.note || "Tidak ada rincian catatan."}
                      </p>
                    </div>
                  )}

                  {isWorker && (m.status === "IN_PROGRESS" || m.status === "REVISION_REQUESTED") && (
                    <div className="pt-2">
                      {activeSubmitIdx === m.idx ? (
                        <form
                          onSubmit={(e) => handleSubmitDeliverable(e, m.id, m.idx)}
                          className="space-y-4 rounded-2xl border border-[#ff4625]/30 bg-black/40 p-5"
                        >
                          <div className="space-y-1">
                            <h4 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-white">
                              <Send className="h-3.5 w-3.5 text-[#ff5733]" /> Unggah Manifest Deliverable
                            </h4>
                            <p className="text-[11px] text-zinc-400">
                              Data tautan dan catatan akan di-hash secara kanonikal lalu disimpan ke
                              smart contract.
                            </p>
                          </div>
                          <input
                            type="url"
                            placeholder="Tautan Deliverable (GitHub Repo, Figma, Google Drive, IPFS CID)"
                            value={manifestLink}
                            onChange={(e) => setManifestLink(e.target.value)}
                            required
                            className={`${workerInput} font-mono`}
                          />
                          <textarea
                            rows={2}
                            placeholder="Ringkasan poin pekerjaan yang telah diselesaikan..."
                            value={manifestNote}
                            onChange={(e) => setManifestNote(e.target.value)}
                            className={`${workerInput} resize-none`}
                          />
                          <div className="flex gap-2">
                            <button type="submit" disabled={actionLoading} className={workerButton}>
                              {actionLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>SUBMITTING ON-CHAIN...</span>
                                </>
                              ) : (
                                "KIRIM KE BLOCKCHAIN"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveSubmitIdx(null)}
                              className={ghostButton}
                            >
                              BATAL
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => setActiveSubmitIdx(m.idx)} className={workerButton}>
                          <Send className="h-4 w-4" />
                          <span>KIRIM DELIVERABLE</span>
                        </button>
                      )}
                    </div>
                  )}

                  {isClient && m.status === "SUBMITTED" && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleApproveMilestone(m.id, m.idx)}
                        disabled={actionLoading}
                        className={clientButton}
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        <span>{actionLoading ? "MEMPROSES..." : "APPROVE DELIVERABLE"}</span>
                      </button>
                    </div>
                  )}

                  {isClient && m.status === "APPROVED" && !m.payment_ref && (
                    <div className="border-t border-white/[0.08] pt-4">
                      {activeAttestIdx === m.idx ? (
                        <form
                          onSubmit={(e) => handleAttestPayment(e, m)}
                          className="space-y-4 rounded-2xl border border-[#34d399]/30 bg-black/40 p-6"
                        >
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-[#34d399]" />
                            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                              Attest Bukti Pembayaran IDR
                            </h4>
                          </div>
                          <p className="text-xs leading-relaxed text-zinc-400">
                            Transfer <strong className="text-zinc-200">Rp {Number(m.amount).toLocaleString("id-ID")}</strong>{" "}
                            langsung ke rekening/e-wallet Worker, lalu masukkan nomor referensinya di
                            bawah:
                          </p>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="block">
                              <FieldLabel>Saluran Pembayaran</FieldLabel>
                              <select
                                value={payMethod}
                                onChange={(e) => setPayMethod(e.target.value)}
                                className={clientInput}
                              >
                                <option value="BANK_TRANSFER" className="bg-[#0e1017]">
                                  Bank Transfer (BCA / Mandiri / BRI / BNI)
                                </option>
                                <option value="E_WALLET" className="bg-[#0e1017]">
                                  E-Wallet (GoPay / OVO / Dana / ShopeePay)
                                </option>
                                <option value="QRIS" className="bg-[#0e1017]">
                                  QRIS Standar
                                </option>
                              </select>
                            </label>
                            <label className="block">
                              <FieldLabel>No. Referensi / No. Transaksi</FieldLabel>
                              <input
                                type="text"
                                placeholder="Contoh: 2026101498273612"
                                value={payReference}
                                onChange={(e) => setPayReference(e.target.value)}
                                required
                                className={`${clientInput} font-mono`}
                              />
                            </label>
                          </div>

                          <label className="block">
                            <FieldLabel>Catatan Tambahan (Opsional)</FieldLabel>
                            <input
                              type="text"
                              placeholder="Transfer via m-BCA dari Rekening PT / Pribadi"
                              value={payNotes}
                              onChange={(e) => setPayNotes(e.target.value)}
                              className={clientInput}
                            />
                          </label>

                          <div className="flex gap-2 pt-1">
                            <button type="submit" disabled={actionLoading} className={clientButton}>
                              {actionLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>MENYIMPAN KE ON-CHAIN...</span>
                                </>
                              ) : (
                                "KUNCI BUKTI TRANSFER"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveAttestIdx(null)}
                              className={ghostButton}
                            >
                              BATAL
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#34d399]/20 bg-[#34d399]/[0.04] p-4 sm:flex-row sm:items-center">
                          <div className="space-y-0.5">
                            <span className="block text-xs font-semibold text-[#34d399]">
                              Deliverable Disetujui!
                            </span>
                            <span className="text-[11px] leading-relaxed text-zinc-400">
                              Silakan bayar Rp {Number(m.amount).toLocaleString("id-ID")} ke Worker,
                              lalu catat referensi transfernya.
                            </span>
                          </div>
                          <button onClick={() => setActiveAttestIdx(m.idx)} className={clientButton}>
                            <Banknote className="h-4 w-4" />
                            <span>ATTEST PEMBAYARAN</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {m.payment_ref && (
                    <div className="border-t border-white/[0.08] pt-4">
                      <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-300">
                            <ShieldCheck className="h-4 w-4 text-[#34d399]" />
                            KLAIM PEMBAYARAN KLIEN
                          </span>
                          <span className="max-w-[200px] truncate font-mono text-[10px] text-zinc-500">
                            PAY_REF: {m.payment_ref.slice(0, 16)}...
                          </span>
                        </div>

                        {pay && (
                          <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/[0.06] bg-black/40 p-3 font-mono text-xs sm:grid-cols-4">
                            <div>
                              <span className="block text-[10px] text-zinc-500">METODE</span>
                              <strong className="text-white">{pay.method}</strong>
                            </div>
                            <div>
                              <span className="block text-[10px] text-zinc-500">REFERENSI</span>
                              <strong className="break-all text-white">{pay.reference}</strong>
                            </div>
                            <div>
                              <span className="block text-[10px] text-zinc-500">TANGGAL</span>
                              <strong className="text-white">{pay.paid_on}</strong>
                            </div>
                            <div>
                              <span className="block text-[10px] text-zinc-500">STATUS</span>
                              <strong className={m.payment_confirmed ? "text-[#34d399]" : "text-amber-400"}>
                                {m.payment_confirmed ? "TERKONFIRMASI" : "MENUNGGU WORKER"}
                              </strong>
                            </div>
                          </div>
                        )}

                        {isWorker && !m.payment_confirmed && (
                          <div className="flex flex-col justify-between gap-3 pt-2 sm:flex-row sm:items-center">
                            <p className="text-[11px] leading-relaxed text-zinc-400">
                              Cek rekening Anda. Jika dana telah masuk, klik konfirmasi untuk mencatat
                              penerimaan resmi on-chain:
                            </p>
                            <button
                              onClick={() => handleConfirmPayment(m.id, m.idx)}
                              disabled={actionLoading}
                              className={`shrink-0 ${workerButton}`}
                            >
                              {actionLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>MEMPROSES...</span>
                                </>
                              ) : (
                                "KONFIRMASI DANA DITERIMA"
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}