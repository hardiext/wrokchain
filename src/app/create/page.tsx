"use client";

import { useState, Suspense, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { isAddress, toHex, parseEventLogs } from "viem";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Briefcase,
  Layers,
  FileSignature,
  Wallet,
  CalendarClock,
  Coins,
  ShieldCheck,
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WORKCHAIN_ABI } from "@/constants/ABI";
import { supabase } from "@/lib/supabase";
import { canonicalizeJson, hashCanonical } from "@/lib/canonical";

interface Milestone {
  title: string;
  description: string;
  amount: number;
  days: number;
}

interface AgreementCreatedArgs {
  agreementId?: bigint;
  id?: bigint;
  _id?: bigint;
}

const MAX_MILESTONES = 10;

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition focus:border-[#34d399]/60 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-[#34d399]/30";

const getErrorMessage = (err: unknown): string => {
  if (typeof err === "object" && err !== null) {
    const { details, message } = err as { details?: string; message?: string };
    return details || message || "Gagal membuat kesepakatan kerja.";
  }
  return "Gagal membuat kesepakatan kerja.";
};

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function CreateAgreementForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialWorker = searchParams.get("worker") || "";
  const initialTitle = searchParams.get("title") || "";
  const initialAmount = Number(searchParams.get("amount")) || 2500000;
  const jobIdParam = searchParams.get("job_id");

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;

  const [workerAddress, setWorkerAddress] = useState(initialWorker);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [offerDays, setOfferDays] = useState(7);
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      title: "Tahap 1: Analisis & Desain Solusi",
      description: "Rancangan arsitektur, wireframe, atau spesifikasi teknis",
      amount: initialAmount > 0 ? Math.floor(initialAmount / 2) : 1000000,
      days: 5,
    },
    {
      title: "Tahap 2: Implementasi & Deliverables",
      description: "Pengerjaan kode sumber, pengujian, dan penyerahan link produksi",
      amount: initialAmount > 0 ? Math.ceil(initialAmount / 2) : 1500000,
      days: 10,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { writeContractAsync } = useWriteContract();

  const totalAmount = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const updateMilestone = (idx: number, patch: Partial<Milestone>) => {
    setMilestones((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  const addMilestone = () => {
    if (milestones.length >= MAX_MILESTONES) return;
    setMilestones([
      ...milestones,
      {
        title: `Tahap ${milestones.length + 1}`,
        description: "Deskripsi tugas dan target deliverable",
        amount: 1000000,
        days: 7,
      },
    ]);
  };

  const removeMilestone = (idx: number) => {
    if (milestones.length === 1) return;
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isConnected || !address) {
      setErrorMsg("Harap hubungkan dompet Web3 Anda terlebih dahulu.");
      return;
    }
    if (!isAddress(workerAddress) || workerAddress.toLowerCase() === address.toLowerCase()) {
      setErrorMsg("Alamat dompet worker tidak valid atau sama persis dengan dompet klien.");
      return;
    }
    if (!contractAddress || !contractAddress.startsWith("0x")) {
      setErrorMsg("NEXT_PUBLIC_CONTRACT_ADDRESS belum dikonfigurasi dengan benar di .env.local.");
      return;
    }

    setIsLoading(true);

    try {
      setLoadingStep("Memvalidasi identitas pengguna...");
      let { data: clientUser, error: errSelectUser } = await supabase
        .from("users")
        .select("id")
        .eq("wallet", address.toLowerCase())
        .maybeSingle();

      if (errSelectUser) throw errSelectUser;

      if (!clientUser) {
        const { data: newUser, error: errUser } = await supabase
          .from("users")
          .insert({
            wallet: address.toLowerCase(),
            display_name: `Client ${address.slice(0, 6)}`,
          })
          .select("id")
          .single();

        if (errUser) throw errUser;
        clientUser = newUser;
      }

      setLoadingStep("Memeriksa deployment protokol...");
      const { data: deployment, error: errDeploy } = await supabase
        .from("contract_deployments")
        .select("id")
        .eq("is_active", true)
        .maybeSingle();

      if (errDeploy) throw errDeploy;
      if (!deployment) {
        throw new Error("Kontrak aktif tidak ditemukan di tabel contract_deployments.");
      }

      setLoadingStep("Menghitung cryptographic terms hash...");
      const salt = toHex(crypto.getRandomValues(new Uint8Array(32)));
      const offerExpiryDate = new Date(Date.now() + offerDays * 86400 * 1000).toISOString();

      const termsObject = {
        title: title.trim(),
        description: description.trim(),
        currency: "IDR",
        client: address.toLowerCase(),
        worker: workerAddress.toLowerCase(),
        offer_expiry: offerExpiryDate,
        salt,
        milestones: milestones.map((m, idx) => ({
          idx,
          title: m.title.trim(),
          description: m.description.trim(),
          amount: Number(m.amount),
        })),
      };

      const canonicalString = canonicalizeJson(termsObject);
      const termsHash = hashCanonical(canonicalString);

      const validJobId = jobIdParam && jobIdParam.trim().length > 10 ? jobIdParam.trim() : null;

      setLoadingStep("Menyimpan draft kesepakatan...");
      const { data: agreementRow, error: errAgree } = await supabase
        .from("agreements")
        .insert({
          deployment_id: deployment.id,
          job_id: validJobId,
          status: "DRAFT",
          client_user_id: clientUser.id,
          client_address: address.toLowerCase(),
          worker_address: workerAddress.toLowerCase(),
          title: title.trim(),
          description: description.trim(),
          currency: "IDR",
          offer_expiry: offerExpiryDate,
          salt,
          terms_canonical: canonicalString,
          terms_hash: termsHash,
        })
        .select("id")
        .single();

      if (errAgree) throw errAgree;

      setLoadingStep("Menyimpan rincian termin...");
      const msRows = milestones.map((m, idx) => ({
        agreement_id: agreementRow.id,
        idx,
        title: m.title.trim(),
        description: m.description.trim(),
        amount: Number(m.amount),
        deadline: new Date(Date.now() + (idx + 1) * m.days * 86400 * 1000).toISOString(),
        status: "PENDING",
      }));

      const { error: errMs } = await supabase.from("milestones").insert(msRows);
      if (errMs) throw errMs;

      await supabase
        .from("agreements")
        .update({ status: "ANCHORING" })
        .eq("id", agreementRow.id);

      setLoadingStep("Menunggu konfirmasi transaksi di wallet...");
      const expiryTimestamp = BigInt(Math.floor(new Date(offerExpiryDate).getTime() / 1000));
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "createAgreement",
        args: [workerAddress as `0x${string}`, termsHash, expiryTimestamp, milestones.length],
      });

      setLoadingStep("Mengonfirmasi blok transaksi di Sepolia...");
      let realChainId: number | null = null;

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

        try {
          const logs = parseEventLogs({
            abi: WORKCHAIN_ABI,
            eventName: "AgreementCreated",
            logs: receipt.logs,
          });

          if (logs.length > 0) {
            const eventArgs = logs[0].args as unknown as AgreementCreatedArgs;
            const parsedVal = eventArgs.agreementId ?? eventArgs.id ?? eventArgs._id;
            if (parsedVal !== undefined) {
              realChainId = Number(parsedVal);
            }
          }
        } catch (logErr) {
          console.warn("parseEventLogs dilewati:", logErr);
        }

        if (!realChainId) {
          for (const log of receipt.logs) {
            const idTopic = log.topics[1];
            if (!idTopic) continue;
            const numericId = Number(BigInt(idTopic));
            if (numericId > 0 && numericId < 1000000) {
              realChainId = numericId;
              break;
            }
          }
        }
      }

      if (!realChainId) {
        console.warn("Event logs tidak tertangkap, beralih ke fallback database increment...");
        const { data: latestRow } = await supabase
          .from("agreements")
          .select("chain_agreement_id")
          .eq("deployment_id", deployment.id)
          .not("chain_agreement_id", "is", null)
          .order("chain_agreement_id", { ascending: false })
          .limit(1)
          .maybeSingle();

        realChainId = (Number(latestRow?.chain_agreement_id) || 0) + 1;
      }

      setLoadingStep("Menyimpan kesepakatan...");
      const { error: updateError } = await supabase
        .from("agreements")
        .update({
          create_tx_hash: tx,
          chain_agreement_id: realChainId,
          commitment: termsHash,
          status: "PENDING",
          anchored_at: new Date().toISOString(),
        })
        .eq("id", agreementRow.id);

      if (updateError) throw updateError;

      if (validJobId) {
        await supabase.from("job_postings").update({ status: "ASSIGNED" }).eq("id", validJobId);

        await supabase
          .from("job_proposals")
          .update({ status: "ACCEPTED" })
          .eq("job_id", validJobId)
          .eq("worker_address", workerAddress.toLowerCase());
      }

      router.push(`/project/${agreementRow.id}`);
    } catch (err: unknown) {
      console.error("Detail Error Pembuatan Kontrak:", err);
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090c] pb-24 font-sans text-white selection:bg-[#34d399]/30">
      <div className="pointer-events-none fixed right-[8%] top-[-12%] h-[480px] w-[480px] rounded-full bg-[#34d399]/[0.06] blur-[140px]" />
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
            href="/dashboard"
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-zinc-400 transition hover:border-white/[0.16] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> DASHBOARD
          </Link>
          <ConnectButton accountStatus="avatar" chainStatus="icon" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl space-y-8 px-6 pt-10">
        <section className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#34d399]">
            <FileSignature className="h-3 w-3" /> Client · Protokol V3.1
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Inisiasi Kesepakatan Kerja</h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
            Mengunci parameter termin IDR dan hash ruang lingkup secara independen di jaringan
            Sepolia.
          </p>
        </section>

        {jobIdParam && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm">
            <Briefcase className="h-4 w-4 shrink-0 text-[#34d399]" />
            <div className="text-xs">
              <span className="text-zinc-400">Terhubung ke Lowongan:</span>{" "}
              <strong className="font-mono text-white">{jobIdParam.slice(0, 8)}...</strong>
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span className="break-all">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-5 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-7 backdrop-blur-sm">
            <Field label="Alamat Dompet Worker" icon={<Wallet className="h-3 w-3" />}>
              <input
                type="text"
                placeholder="0x..."
                value={workerAddress}
                onChange={(e) => setWorkerAddress(e.target.value)}
                required
                className={`${inputClass} font-mono text-xs`}
              />
            </Field>

            <Field label="Judul Kesepakatan">
              <input
                type="text"
                placeholder="Contoh: Pengembangan Fitur Web3 & Integrasi Smart Contract"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={inputClass}
              />
            </Field>

            <Field label="Deskripsi Ruang Lingkup (Scope)">
              <textarea
                rows={3}
                placeholder="Tuliskan deliverable yang diharapkan, batasan tugas, dan spesifikasi teknis..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className={`${inputClass} resize-none`}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Masa Berlaku Penawaran (Hari)" icon={<CalendarClock className="h-3 w-3" />}>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={offerDays}
                  onChange={(e) => setOfferDays(Number(e.target.value))}
                  className={`${inputClass} font-mono text-xs`}
                />
              </Field>
              <Field label="Denominasi Mata Uang" icon={<Coins className="h-3 w-3" />}>
                <input
                  type="text"
                  disabled
                  value="IDR (Rupiah - Off-chain Settlement)"
                  className="w-full cursor-not-allowed rounded-xl border border-white/[0.06] bg-black/40 px-4 py-2.5 font-mono text-xs text-zinc-500"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Layers className="h-4 w-4 text-[#34d399]" />
                  Termin Pekerjaan
                  <span className="font-mono text-xs font-normal text-zinc-500">
                    {milestones.length}/{MAX_MILESTONES}
                  </span>
                </h2>
                <p className="font-mono text-xs font-semibold text-[#34d399]">
                  Total Nilai: Rp {totalAmount.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                type="button"
                onClick={addMilestone}
                disabled={milestones.length >= MAX_MILESTONES}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 font-mono text-xs text-zinc-300 transition hover:border-[#34d399]/40 hover:text-[#34d399] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Tahap
              </button>
            </div>

            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#34d399]">
                      Tahap #{idx + 1}
                    </span>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(idx)}
                        aria-label={`Hapus tahap ${idx + 1}`}
                        className="text-zinc-600 transition hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
                    <input
                      type="text"
                      placeholder="Judul termin"
                      value={m.title}
                      onChange={(e) => updateMilestone(idx, { title: e.target.value })}
                      required
                      className={inputClass}
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-500">Rp</span>
                      <input
                        type="number"
                        placeholder="Nominal"
                        value={m.amount}
                        onChange={(e) => updateMilestone(idx, { amount: Number(e.target.value) })}
                        required
                        className={`${inputClass} font-mono text-xs sm:w-40`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="number"
                        min="1"
                        placeholder="Hari"
                        value={m.days}
                        onChange={(e) => updateMilestone(idx, { days: Number(e.target.value) })}
                        required
                        className={`${inputClass} font-mono text-xs sm:w-20`}
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Deskripsi target deliverable tahapan ini..."
                    value={m.description}
                    onChange={(e) => updateMilestone(idx, { description: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || !isConnected}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#34d399] py-3.5 font-mono text-xs font-bold tracking-wide text-[#08090c] shadow-lg shadow-[#34d399]/20 transition hover:bg-[#2cc08a] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{loadingStep || "MEMPROSES..."}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>KUNCI & DAFTARKAN KESEPAKATAN ON-CHAIN</span>
                </>
              )}
            </button>
            {!isConnected && (
              <p className="text-center font-mono text-[10px] text-zinc-500">
                Hubungkan dompet untuk melanjutkan.
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

export default function CreateAgreementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#08090c] text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin text-[#34d399]" />
        </div>
      }
    >
      <CreateAgreementForm />
    </Suspense>
  );
}