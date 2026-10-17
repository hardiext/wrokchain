"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";

import { toHex,parseEventLogs } from "viem";
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
  Sparkles,
  Layers,
  Check,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WORKCHAIN_ABI } from "@/constants/ABI";
import { supabase } from "@/lib/supabase";
import { canonicalizeJson, hashCanonical } from "@/lib/canonical";
import { SBT_ABI } from "@/constants/SBT_ABI";

// Mapping enum status on-chain WorkChainProtocol ke string status Supabase
// enum AgreementStatus { Pending, Active, Completed, Disputed, Cancelled }
const ONCHAIN_STATUS_MAP: Record<number, string> = {
  0: "PENDING",
  1: "ACTIVE",
  2: "COMPLETED",
  3: "DISPUTED",
  4: "CANCELLED",
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;

  const [agreement, setAgreement] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<Record<string, any>>({});
  const [paymentRecords, setPaymentRecords] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // State Form Deliverable (Worker)
  const [activeSubmitIdx, setActiveSubmitIdx] = useState<number | null>(null);
  const [manifestLink, setManifestLink] = useState("");
  const [manifestNote, setManifestNote] = useState("");

  // State Form Attest Payment (Klien)
  const [activeAttestIdx, setActiveAttestIdx] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payReference, setPayReference] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const sbtContractAddress = (process.env.NEXT_PUBLIC_SBT_CONTRACT_ADDRESS || "") as `0x${string}`;
  const [claimedBadge, setClaimedBadge] = useState<any>(null);
  const [mintLoading, setMintLoading] = useState(false);

  const { writeContractAsync } = useWriteContract();

  const getOrCreateUser = async (walletAddr: string) => {
    let { data: user, error } = await supabase
      .from("users")
      .select("id")
      .eq("wallet", walletAddr)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          wallet: walletAddr,
          display_name: `User ${walletAddr.slice(0, 6)}`,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      return newUser;
    }
    return user;
  };

  // Self-Healing On-Chain Sync: Menyelaraskan status Supabase dengan data riil smart contract
  const syncOnChainStatus = async (agreeData: any, msList: any[]) => {
    if (!publicClient || !contractAddress || !agreeData?.chain_agreement_id) return;

    try {
      setIsSyncing(true);
      const onChainData: any = await publicClient.readContract({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "agreements",
        args: [BigInt(agreeData.chain_agreement_id)],
      });

      const onChainStatusCode = Number(onChainData[4] ?? onChainData.status);
      const onChainStatusStr = ONCHAIN_STATUS_MAP[onChainStatusCode];

      if (onChainStatusStr && onChainStatusStr !== agreeData.status) {
        console.log(`[Auto-Sync] Memperbarui status database: ${agreeData.status} -> ${onChainStatusStr}`);

        await supabase
          .from("agreements")
          .update({ status: onChainStatusStr })
          .eq("id", agreeData.id);

        agreeData.status = onChainStatusStr;

        // Jika on-chain sudah ACTIVE dan milestone pertama masih PENDING, aktifkan otomatis
        if (onChainStatusStr === "ACTIVE" && msList.length > 0 && msList[0].status === "PENDING") {
          await supabase
            .from("milestones")
            .update({ status: "IN_PROGRESS" })
            .eq("id", msList[0].id);

          msList[0].status = "IN_PROGRESS";
        }
      }
    } catch (err) {
      console.warn("[Auto-Sync] Tidak dapat membaca state on-chain:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      // 1. Ambil Data Perjanjian
      const { data: agreeData, error: agreeErr } = await supabase
        .from("agreements")
        .select("*")
        .eq("id", projectId)
        .single();

      if (agreeErr) throw agreeErr;

      // 2. Ambil Rincian Milestones
      const { data: msData, error: msErr } = await supabase
        .from("milestones")
        .select("*")
        .eq("agreement_id", projectId)
        .order("idx", { ascending: true });

      if (msErr) throw msErr;
      const msList = msData || [];

      // 3. Jalankan Auto-Sync On-Chain
      await syncOnChainStatus(agreeData, msList);

      setAgreement({ ...agreeData });
      setMilestones([...msList]);

      const msIds = msList.map((m) => m.id);

      if (msIds.length > 0) {
        // 4. Ambil Deliverables
        const { data: delivData } = await supabase
          .from("deliverables")
          .select("*")
          .in("milestone_id", msIds)
          .order("version", { ascending: false });

        const dMap: Record<string, any> = {};
        (delivData || []).forEach((d) => {
          if (!dMap[d.milestone_id]) dMap[d.milestone_id] = d;
        });
        setDeliverables(dMap);

        // 5. Ambil Catatan Pembayaran
        const { data: payData } = await supabase
          .from("payment_records")
          .select("*")
          .in("milestone_id", msIds);

        const pMap: Record<string, any> = {};
        (payData || []).forEach((p) => {
          pMap[p.milestone_id] = p;
        });
        setPaymentRecords(pMap);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal memuat rincian kesepakatan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const currentAddr = address?.toLowerCase() || "";
  const isClient = agreement && currentAddr === agreement.client_address?.toLowerCase();
  const isWorker = agreement && currentAddr === agreement.worker_address?.toLowerCase();

  // 1. Worker Menyetujui Kontrak On-Chain
  const handleAcceptAgreement = async () => {
    if (!agreement?.chain_agreement_id) {
      alert("Agreement belum memiliki chain_agreement_id yang valid.");
      return;
    }

    try {
      setActionLoading(true);
      const chainId = BigInt(agreement.chain_agreement_id);

      const tx = await writeContractAsync({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "acceptAgreement",
        args: [chainId],
        gas: BigInt(200000), // Mencegah lonjakan gas fee otomatis saat revert
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }

      await supabase.from("agreements").update({ status: "ACTIVE" }).eq("id", agreement.id);

      if (milestones.length > 0) {
        await supabase
          .from("milestones")
          .update({ status: "IN_PROGRESS" })
          .eq("id", milestones[0].id);
      }

      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err?.details || err?.message || "Gagal menyetujui perjanjian on-chain.");
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Worker Mengirimkan Bukti Deliverable
  const handleSubmitDeliverable = async (e: React.FormEvent, mId: string, idx: number) => {
    e.preventDefault();
    if (!address) return;

    try {
      setActionLoading(true);
      const user = await getOrCreateUser(currentAddr);

      const manifestObj = {
        note: manifestNote.trim(),
        link: manifestLink.trim(),
        timestamp: Date.now(),
      };
      const manifestCanonical = canonicalizeJson(manifestObj);
      const manifestHash = hashCanonical(manifestCanonical);

      const chainId = BigInt(agreement.chain_agreement_id || 1);
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "submitMilestone",
        args: [chainId, idx, manifestHash],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }

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
    } catch (err: any) {
      console.error(err);
      alert(err?.details || err?.message || "Gagal submit deliverable.");
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Klien Menyetujui Deliverable
  const handleApproveMilestone = async (mId: string, idx: number) => {
    try {
      setActionLoading(true);
      const chainId = BigInt(agreement.chain_agreement_id || 1);
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "approveMilestone",
        args: [chainId, idx],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }

      await supabase
        .from("milestones")
        .update({
          status: "APPROVED",
          status_changed_at: new Date().toISOString(),
        })
        .eq("id", mId);

      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err?.details || err?.message || "Gagal menyetujui deliverable.");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Klien Mencatat Bukti Pembayaran IDR (Attest Payment)
  const handleAttestPayment = async (e: React.FormEvent, milestone: any) => {
    e.preventDefault();
    if (!address) return;

    try {
      setActionLoading(true);
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

      const chainId = BigInt(agreement.chain_agreement_id || 1);
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "attestPayment",
        args: [chainId, milestone.idx, paymentRef],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }

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
    } catch (err: any) {
      console.error(err);
      alert(err?.details || err?.message || "Gagal mencatat klaim pembayaran.");
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Worker Mengonfirmasi Penerimaan Pembayaran IDR
  const handleConfirmPayment = async (mId: string, idx: number) => {
    try {
      setActionLoading(true);
      const chainId = BigInt(agreement.chain_agreement_id || 1);
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "confirmPayment",
        args: [chainId, idx],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }

      await supabase.from("milestones").update({ payment_confirmed: true }).eq("id", mId);
      await supabase
        .from("payment_records")
        .update({ confirmed_at: new Date().toISOString() })
        .eq("milestone_id", mId);

      const nextIdx = idx + 1;
      const nextMilestone = milestones.find((m) => m.idx === nextIdx);
      if (nextMilestone) {
        await supabase.from("milestones").update({ status: "IN_PROGRESS" }).eq("id", nextMilestone.id);
      } else {
        await supabase.from("agreements").update({ status: "COMPLETED" }).eq("id", agreement.id);
      }

      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err?.details || err?.message || "Gagal mengonfirmasi pembayaran.");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
  if (!projectId || !address) return;
  const checkClaimed = async () => {
    const { data } = await supabase
      .from("reputation_badges")
      .select("*")
      .eq("agreement_id", projectId)
      .eq("recipient_address", address.toLowerCase())
      .maybeSingle();
    setClaimedBadge(data);
  };
  checkClaimed();
}, [projectId, address]);

const handleClaimBadge = async () => {
  if (!address || !sbtContractAddress) {
    alert("Dompet belum terhubung atau alamat kontrak SBT belum diset di .env.local.");
    return;
  }

  try {
    setMintLoading(true);
    const roleNum = isWorker ? 0 : 1; // 0 = WORKER, 1 = CLIENT
    const roleStr = isWorker ? "WORKER" : "CLIENT";
    const chainAgreementId = BigInt(agreement.chain_agreement_id || 1);
    const totalIdr = BigInt(milestones.reduce((acc, m) => acc + Number(m.amount), 0));

    // Eksekusi fungsi mintBadge di blockchain
    const tx = await writeContractAsync({
      address: sbtContractAddress,
      abi: SBT_ABI,
      functionName: "mintBadge",
      args: [
        address as `0x${string}`,
        chainAgreementId,
        agreement.title,
        totalIdr,
        milestones.length,
        roleNum
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
          logs: receipt.logs
        });
        if (logs.length > 0) {
          mintedTokenId = Number((logs[0].args as any).tokenId);
        }
      } catch (err) {
        console.warn("Log parse fallback:", err);
      }
    }

    // Ambil Token URI on-chain jika ada
    let tokenUriStr = "";
    try {
      if (publicClient) {
        tokenUriStr = await publicClient.readContract({
          address: sbtContractAddress,
          abi: SBT_ABI,
          functionName: "tokenURI",
          args: [BigInt(mintedTokenId)]
        }) as string;
      }
    } catch {}

    // Catat ke Supabase
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
        token_uri: tokenUriStr
      })
      .select()
      .single();

    if (badgeErr) throw badgeErr;
    setClaimedBadge(badgeData);
  } catch (err: any) {
    console.error(err);
    alert(err?.details || err?.message || "Gagal mencetak badge reputasi.");
  } finally {
    setMintLoading(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090c] flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#ff5733]" />
          <span className="font-mono text-xs tracking-wider uppercase">Loading Protocol Context...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !agreement) {
    return (
      <div className="min-h-screen bg-[#08090c] text-white p-8 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <p className="text-zinc-400 text-xs font-mono">{errorMsg || "Perjanjian tidak ditemukan."}</p>
        <Link
          href="/dashboard"
          className="text-xs font-mono text-[#ff5733] hover:underline flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3 w-3" /> Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const totalValue = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const completedMilestones = milestones.filter((m) => m.payment_confirmed).length;

  return (
    <div className="min-h-screen bg-[#08090c] text-white selection:bg-[#ff4625]/30 font-sans antialiased relative overflow-hidden pb-32">
      {/* Ambient Lighting Gradients */}
      <div className="pointer-events-none fixed top-[-10%] right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-[#ff4625]/15 to-[#8b5cf6]/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#6366f1]/10 to-transparent blur-[150px] rounded-full" />

      {/* Grid Pattern Background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08090c]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition py-1 px-3 rounded-full bg-white/[0.03] border border-white/[0.06]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>DASHBOARD</span>
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="font-mono text-xs text-zinc-400 truncate max-w-[150px] sm:max-w-none">
              {agreement.id.slice(0, 8)}...
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isSyncing}
              className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2] text-zinc-400 hover:text-white transition"
              title="Sinkronkan status dengan blockchain"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-[#ff5733]" : ""}`} />
            </button>
            <Link
              href={`/verify/${agreement.id}`}
              className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-zinc-300 hover:text-[#ff5733] px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] hover:border-[#ff5733]/40 transition"
            >
              <span>AUDIT RECORD</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <ConnectButton accountStatus="avatar" chainStatus="icon" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-8 relative z-10">
        {agreement.status === "COMPLETED" && (isWorker || isClient) && (
  <div className="relative overflow-hidden p-6 rounded-3xl border border-[#ff4625]/40 bg-gradient-to-r from-[#ff4625]/15 via-[#16121b] to-[#0c0d12] shadow-2xl space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-[#ff4625]/20 border border-[#ff4625]/40 text-[#ff7755]">
          <Sparkles className="h-3 w-3" /> ON-CHAIN REPUTATION READY
        </div>
        <h3 className="text-lg font-bold text-white">
          {claimedBadge ? "Sertifikat SBT Terverifikasi" : "Klaim Sertifikat Reputasi Soulbound"}
        </h3>
        <p className="text-xs text-zinc-400 max-w-xl">
          {claimedBadge
            ? `SBT Token #${claimedBadge.token_id} telah dicetak permanen ke dompet Anda sebagai bukti rekam jejak profesional.`
            : "Proyek telah 100% selesai dan lunas. Cetak lencana non-transferable ERC-721 ke dompet Anda untuk dipamerkan di profil publik."}
        </p>
      </div>

      <div>
        {claimedBadge ? (
          <Link
            href={`/profile/${address}`}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold transition flex items-center gap-2"
          >
            <span>LIHAT DI PROFIL</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : (
          <button
            onClick={handleClaimBadge}
            disabled={mintLoading}
            className="px-6 py-3 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white font-mono text-xs font-bold shadow-xl shadow-[#ff4625]/25 transition disabled:opacity-50 flex items-center gap-2"
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
    </div>
  </div>
)}
        {agreement.status === "PENDING" && isWorker && (
          <div className="relative overflow-hidden p-6 rounded-2xl border border-[#ff4625]/40 bg-gradient-to-r from-[#ff4625]/15 via-[#16121b] to-[#0c0d12] shadow-2xl shadow-[#ff4625]/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-[#ff4625]/20 border border-[#ff4625]/40 text-[#ff7755]">
                  <Sparkles className="h-3 w-3" /> ACTION REQUIRED
                </div>
                <h3 className="text-base font-semibold text-white">
                  Perjanjian Menunggu Tanda Tangan Anda
                </h3>
                <p className="text-xs text-zinc-400">
                  Klien telah mengunci hash terms ke smart contract. Tandatangani untuk mengaktifkan status perjanjian.
                </p>
              </div>
              <button
                onClick={handleAcceptAgreement}
                disabled={actionLoading}
                className="self-start sm:self-auto px-6 py-2.5 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white text-xs font-bold font-mono tracking-wide shadow-lg shadow-[#ff4625]/25 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {actionLoading ? "MEMPROSES..." : "TANDATANGANI & TERIMA"}
              </button>
            </div>
          </div>
        )}

        {/* Client Waiting Banner */}
        {agreement.status === "PENDING" && isClient && (
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-[#ff5733]" />
              <span>
                Menunggu respon tanda tangan dari Worker (<code className="font-mono text-zinc-200">{agreement.worker_address.slice(0, 10)}...</code>)
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">ON-CHAIN OFFER OPEN</span>
          </div>
        )}

        {/* Card Ringkasan Spesifikasi Kontrak */}
        <div className="relative rounded-3xl border border-white/[0.08] bg-[#0e1017]/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl overflow-hidden">
          <div className="pointer-events-none absolute top-0 right-0 w-80 h-80 bg-gradient-to-b from-[#ff5733]/10 to-transparent blur-3xl" />

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-8 border-b border-white/[0.06]">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase bg-[#ff5733]/10 border border-[#ff5733]/30 text-[#ff6644]">
                  CONTRACT SPEC V3.1
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs font-mono text-zinc-400 uppercase">
                  ID: {agreement.id.slice(0, 12)}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {agreement.title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {agreement.description}
              </p>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.04]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    agreement.status === "ACTIVE"
                      ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                      : agreement.status === "COMPLETED"
                      ? "bg-indigo-400 shadow-[0_0_8px_#818cf8]"
                      : "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                  }`}
                />
                <span className="text-xs font-mono tracking-widest uppercase text-white font-semibold">
                  {agreement.status}
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                CHAIN ID: {agreement.chain_agreement_id || "NOT ANCHORED"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block mb-1">
                TOTAL VALUASI
              </span>
              <span className="text-base sm:text-lg font-bold text-white font-mono">
                Rp {totalValue.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block mb-1">
                PROGRESS MILESTONE
              </span>
              <span className="text-base sm:text-lg font-bold text-white font-mono">
                {completedMilestones} / {milestones.length}{" "}
                <span className="text-xs text-zinc-500 font-normal">Selesai</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block mb-1">
                DOMPET KLIEN
              </span>
              <span className="text-xs font-mono text-zinc-300 truncate block">
                {agreement.client_address}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block mb-1">
                DOMPET WORKER
              </span>
              <span className="text-xs font-mono text-zinc-300 truncate block">
                {agreement.worker_address}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#ff5733]" />
              <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-zinc-200">
                Peta Termin & Eksekusi ({milestones.length})
              </h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              SETTLEMENT: IDR (P2P) + ON-CHAIN ATTESTATION
            </span>
          </div>

          <div className="space-y-4">
            {milestones.map((m) => {
              const deliv = deliverables[m.id];
              const pay = paymentRecords[m.id];
              const isCurrent =
                m.status === "IN_PROGRESS" ||
                m.status === "SUBMITTED" ||
                (m.status === "APPROVED" && !m.payment_confirmed);

              return (
                <div
                  key={m.id}
                  className={`relative rounded-2xl border transition-all duration-200 ${
                    isCurrent
                      ? "border-white/[0.12] bg-[#11131a] shadow-xl"
                      : "border-white/[0.05] bg-[#0c0e14]/70"
                  } p-6 sm:p-7 space-y-6`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          m.payment_confirmed
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : isCurrent
                            ? "bg-[#ff5733]/20 text-[#ff6644] border border-[#ff5733]/40"
                            : "bg-white/[0.04] text-zinc-500 border border-white/[0.08]"
                        }`}
                      >
                        {m.payment_confirmed ? <Check className="h-3.5 w-3.5" /> : m.idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-bold text-white tracking-tight">{m.title}</h3>
                          <span className="text-xs font-mono font-semibold text-[#ff5733]">
                            Rp {Number(m.amount).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{m.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-mono tracking-wider uppercase font-semibold ${
                          m.status === "APPROVED"
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                            : m.status === "SUBMITTED"
                            ? "bg-blue-500/10 border border-blue-500/30 text-blue-300"
                            : m.status === "IN_PROGRESS"
                            ? "bg-[#ff5733]/10 border border-[#ff5733]/30 text-[#ff7755]"
                            : "bg-white/[0.03] border border-white/[0.06] text-zinc-500"
                        }`}
                      >
                        {m.status}
                      </span>

                      {m.payment_confirmed && (
                        <span className="px-2.5 py-1 rounded text-[10px] font-mono tracking-wider uppercase bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> SETTLED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tampilan Manifest Deliverable */}
                  {deliv && (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-zinc-400 text-[11px] flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-[#ff5733]" />
                          MANIFEST VERSI #{deliv.version}
                        </span>
                        {deliv.manifest_canonical &&
                          (() => {
                            try {
                              const parsed = JSON.parse(deliv.manifest_canonical);
                              return parsed.link ? (
                                <a
                                  href={parsed.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-mono text-[#ff5733] hover:underline flex items-center gap-1"
                                >
                                  Buka Tautan Bukti <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : null;
                            } catch {
                              return null;
                            }
                          })()}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                        {deliv.note || "Tidak ada rincian catatan."}
                      </p>
                    </div>
                  )}

                  {/* AKSI 1: WORKER KIRIM DELIVERABLE */}
                  {isWorker && (m.status === "IN_PROGRESS" || m.status === "REVISION_REQUESTED") && (
                    <div className="pt-2">
                      {activeSubmitIdx === m.idx ? (
                        <form
                          onSubmit={(e) => handleSubmitDeliverable(e, m.id, m.idx)}
                          className="p-5 rounded-2xl bg-black/50 border border-white/[0.1] space-y-4"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold font-mono uppercase text-white tracking-wider">
                              Unggah Manifest Deliverable
                            </h4>
                            <p className="text-[11px] text-zinc-400">
                              Data tautan dan catatan akan di-hash secara kanonikal lalu disimpan ke smart contract.
                            </p>
                          </div>
                          <input
                            type="url"
                            placeholder="Tautan Deliverable (GitHub Repo, Figma, Google Drive, IPFS CID)"
                            value={manifestLink}
                            onChange={(e) => setManifestLink(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-[#0e1017] border border-white/[0.1] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#ff5733] transition"
                          />
                          <textarea
                            rows={2}
                            placeholder="Ringkasan poin pekerjaan yang telah diselesaikan..."
                            value={manifestNote}
                            onChange={(e) => setManifestNote(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#0e1017] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5733] transition"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="px-5 py-2 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white font-mono text-xs font-bold shadow-lg shadow-[#ff4625]/20 transition disabled:opacity-50"
                            >
                              {actionLoading ? "SUBMITTING ON-CHAIN..." : "KIRIM KE BLOCKCHAIN"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveSubmitIdx(null)}
                              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 text-xs font-mono"
                            >
                              BATAL
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setActiveSubmitIdx(m.idx)}
                          className="px-5 py-2.5 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white font-mono text-xs font-bold shadow-lg shadow-[#ff4625]/20 transition hover:scale-[1.01]"
                        >
                          KIRIM DELIVERABLE
                        </button>
                      )}
                    </div>
                  )}

                  {/* AKSI 2: KLIEN APPROVE DELIVERABLE */}
                  {isClient && m.status === "SUBMITTED" && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleApproveMilestone(m.id, m.idx)}
                        disabled={actionLoading}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {actionLoading ? "MEMPROSES..." : "APPROVE DELIVERABLE"}
                      </button>
                    </div>
                  )}

                  {/* AKSI 3: KLIEN ATTEST PAYMENT */}
                  {isClient && m.status === "APPROVED" && !m.payment_ref && (
                    <div className="pt-2 border-t border-white/[0.06]">
                      {activeAttestIdx === m.idx ? (
                        <form
                          onSubmit={(e) => handleAttestPayment(e, m)}
                          className="p-6 rounded-2xl bg-black/60 border border-[#ff5733]/30 space-y-4"
                        >
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-[#ff5733]" />
                            <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-white">
                              Attest Bukti Pembayaran IDR
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-400">
                            Transfer <strong>Rp {Number(m.amount).toLocaleString("id-ID")}</strong> langsung ke rekening/e-wallet Worker, lalu masukkan nomor referensinya di bawah:
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                                Saluran Pembayaran
                              </label>
                              <select
                                value={payMethod}
                                onChange={(e) => setPayMethod(e.target.value)}
                                className="w-full px-3 py-2 bg-[#0e1017] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5733]"
                              >
                                <option value="BANK_TRANSFER">Bank Transfer (BCA / Mandiri / BRI / BNI)</option>
                                <option value="E_WALLET">E-Wallet (GoPay / OVO / Dana / ShopeePay)</option>
                                <option value="QRIS">QRIS Standar</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                                No. Referensi / No. Transaksi
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: 2026101498273612"
                                value={payReference}
                                onChange={(e) => setPayReference(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-[#0e1017] border border-white/[0.1] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#ff5733]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                              Catatan Tambahan (Opsional)
                            </label>
                            <input
                              type="text"
                              placeholder="Transfer via m-BCA dari Rekening PT / Pribadi"
                              value={payNotes}
                              onChange={(e) => setPayNotes(e.target.value)}
                              className="w-full px-3 py-2 bg-[#0e1017] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5733]"
                            />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="px-5 py-2.5 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white font-mono text-xs font-bold shadow-lg shadow-[#ff4625]/20 transition disabled:opacity-50"
                            >
                              {actionLoading ? "MENYIMPAN KE ON-CHAIN..." : "KUNCI BUKTI TRANSFER"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveAttestIdx(null)}
                              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 text-xs font-mono"
                            >
                              BATAL
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/20">
                          <div>
                            <span className="text-xs font-bold text-amber-300 block">Deliverable Disetujui!</span>
                            <span className="text-[11px] text-zinc-400">
                              Silakan bayar Rp {Number(m.amount).toLocaleString("id-ID")} ke Worker, lalu catat referensi transfernya.
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveAttestIdx(m.idx)}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold transition"
                          >
                            ATTEST PEMBAYARAN
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AKSI 4: DISPLAY ATTESTATION & WORKER KONFIRMASI */}
                  {m.payment_ref && (
                    <div className="pt-4 border-t border-white/[0.06] space-y-3">
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-zinc-300 flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            KLAIM PEMBAYARAN KLIEN
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[200px]">
                            PAY_REF: {m.payment_ref.slice(0, 16)}...
                          </span>
                        </div>

                        {pay && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono p-3 rounded-lg bg-black/40 border border-white/[0.04]">
                            <div>
                              <span className="text-[10px] text-zinc-500 block">METODE</span>
                              <strong className="text-white">{pay.method}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-500 block">REFERENSI</span>
                              <strong className="text-white">{pay.reference}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-500 block">TANGGAL</span>
                              <strong className="text-white">{pay.paid_on}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-500 block">STATUS</span>
                              <strong className={m.payment_confirmed ? "text-emerald-400" : "text-amber-400"}>
                                {m.payment_confirmed ? "TERKONFIRMASI" : "MENUNGGU WORKER"}
                              </strong>
                            </div>
                          </div>
                        )}

                        {isWorker && !m.payment_confirmed && (
                          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <p className="text-[11px] text-zinc-400">
                              Cek rekening Anda. Jika dana telah masuk, klik konfirmasi untuk mencatat penerimaan resmi on-chain:
                            </p>
                            <button
                              onClick={() => handleConfirmPayment(m.id, m.idx)}
                              disabled={actionLoading}
                              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                            >
                              {actionLoading ? "MEMPROSES..." : "KONFIRMASI DANA DITERIMA"}
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
        </div>
      </main>
    </div>
  );
}