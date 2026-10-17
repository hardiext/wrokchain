"use client";

import { useState, Suspense } from "react";
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
  Sparkles,
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WORKCHAIN_ABI } from "@/constants/ABI";
import { supabase } from "@/lib/supabase";
import { canonicalizeJson, hashCanonical } from "@/lib/canonical";

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
  const [milestones, setMilestones] = useState([
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

  const addMilestone = () => {
    if (milestones.length >= 10) return;
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
      // 1. Validasi identitas user klien di Supabase
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

      // 2. Ambil deployment protokol aktif
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

      // 3. Bentuk RFC 8785 Canonical JSON & Keccak Hash
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
        salt: salt,
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

      // 4. Simpan kesepakatan awal dengan status DRAFT[cite: 1]
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
          salt: salt,
          terms_canonical: canonicalString,
          terms_hash: termsHash,
        })
        .select("id")
        .single();

      if (errAgree) throw errAgree;

      // 5. Simpan seluruh baris milestones selagi berstatus DRAFT[cite: 1]
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

      // 6. Alihkan status ke ANCHORING sebelum trigger transaksi Web3[cite: 1]
      await supabase
        .from("agreements")
        .update({ status: "ANCHORING" })
        .eq("id", agreementRow.id);

      // 7. Eksekusi transaksi on-chain createAgreement
      setLoadingStep("Menunggu konfirmasi transaksi di wallet...");
      const expiryTimestamp = BigInt(Math.floor(new Date(offerExpiryDate).getTime() / 1000));
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: WORKCHAIN_ABI,
        functionName: "createAgreement",
        args: [
          workerAddress as `0x${string}`,
          termsHash,
          expiryTimestamp,
          milestones.length,
        ],
      });

      // 8. Tunggu konfirmasi blok transaksi Sepolia & ekstrak ID
      setLoadingStep("Mengonfirmasi blok transaksi di Sepolia...");
      let realChainId: number | null = null;

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

        // Metode A: Coba parse menggunakan parseEventLogs bawaan viem
        try {
          const logs = parseEventLogs({
            abi: WORKCHAIN_ABI,
            eventName: "AgreementCreated",
            logs: receipt.logs,
          });

          if (logs.length > 0) {
            const eventArgs: any = logs[0].args;
            const parsedVal = eventArgs.agreementId ?? eventArgs.id ?? eventArgs._id ?? eventArgs[0];
            if (parsedVal !== undefined && parsedVal !== null) {
              realChainId = Number(parsedVal);
              console.log("Berhasil parse ID via parseEventLogs:", realChainId);
            }
          }
        } catch (logErr) {
          console.warn("parseEventLogs dilewati:", logErr);
        }

        // Metode B: Ekstraksi manual dari raw logs topics (EVM indexed parameter ke-1)
        if (!realChainId && receipt.logs && receipt.logs.length > 0) {
          try {
            for (const log of receipt.logs) {
              if (log.topics && log.topics.length > 1 && log.topics[1]) {
                const hexId = log.topics[1];
                const numericId = Number(BigInt(hexId));
                if (numericId > 0 && numericId < 1000000) {
                  realChainId = numericId;
                  console.log("Berhasil ekstrak ID dari raw log topics[1]:", realChainId);
                  break;
                }
              }
            }
          } catch (topicErr) {
            console.warn("Gagal parse raw topics:", topicErr);
          }
        }
      }

      // Metode C: Fallback aman jika RPC tidak memancarkan log lengkap
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
        console.log("Menggunakan chain_agreement_id fallback:", realChainId);
      }

      // 9. Update data ke Supabase dengan status PENDING[cite: 1]
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

      // 10. Sinkronisasi status lowongan jika berasal dari job board
      if (validJobId) {
        await supabase
          .from("job_postings")
          .update({ status: "ASSIGNED" })
          .eq("id", validJobId);

        await supabase
          .from("job_proposals")
          .update({ status: "ACCEPTED" })
          .eq("job_id", validJobId)
          .eq("worker_address", workerAddress.toLowerCase());
      }

      router.push(`/project/${agreementRow.id}`);
    } catch (err: any) {
      console.error("Detail Error Pembuatan Kontrak:", err?.message || err?.details || err);
      setErrorMsg(err?.details || err?.message || "Gagal membuat kesepakatan kerja.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-white selection:bg-[#ff4625]/30 font-sans pb-24 relative overflow-hidden">
      <div className="pointer-events-none fixed top-[-10%] right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-[#ff4625]/10 to-[#8b5cf6]/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#6366f1]/10 to-transparent blur-[150px] rounded-full" />

      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08090c]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition py-1 px-3 rounded-full bg-white/[0.03] border border-white/[0.06]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> DASHBOARD
          </Link>
          <ConnectButton accountStatus="avatar" chainStatus="icon" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-10 space-y-8 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#ff4625]/30 bg-[#ff4625]/10 text-[#ff7755] text-[10px] font-mono uppercase tracking-wider mb-2">
            <Sparkles className="h-3 w-3" /> FORM KONTRAK PROTOKOL V3.1
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Inisiasi Kesepakatan Kerja
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Mengunci parameter termin IDR dan hash ruang lingkup secara independen di jaringan Sepolia.
          </p>
        </div>

        {jobIdParam && (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center gap-3">
            <Briefcase className="h-4 w-4 text-[#ff5733] shrink-0" />
            <div className="text-xs">
              <span className="text-zinc-400">Terhubung ke Lowongan:</span>{" "}
              <strong className="text-white font-mono">{jobIdParam.slice(0, 8)}...</strong>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/60 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span className="break-all">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-7 rounded-3xl bg-[#0e1017] border border-white/[0.08] space-y-5">
            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                Alamat Dompet Worker (0x...)
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={workerAddress}
                onChange={(e) => setWorkerAddress(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#08090c] border border-white/[0.08] rounded-xl font-mono text-xs text-white focus:outline-none focus:border-[#ff4625] transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                Judul Kesepakatan
              </label>
              <input
                type="text"
                placeholder="Contoh: Pengembangan Fitur Web3 & Integrasi Smart Contract"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#08090c] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#ff4625] transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                Deskripsi Ruang Lingkup (Scope)
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan deliverable yang diharapkan, batasan tugas, dan spesifikasi teknis..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#08090c] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#ff4625] transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                  Masa Berlaku Penawaran (Hari)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={offerDays}
                  onChange={(e) => setOfferDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-[#08090c] border border-white/[0.08] rounded-xl font-mono text-xs text-white focus:outline-none focus:border-[#ff4625]"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                  Denominasi Mata Uang
                </label>
                <input
                  type="text"
                  disabled
                  value="IDR (Rupiah - Off-chain Settlement)"
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.06] rounded-xl font-mono text-xs text-zinc-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#ff5733]" />
                  Termin Pekerjaan ({milestones.length}/10)
                </h3>
                <span className="text-xs font-mono text-[#ff5733] font-semibold">
                  Total Nilai: Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <button
                type="button"
                onClick={addMilestone}
                className="px-3.5 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition"
              >
                <Plus className="h-3 w-3" /> Tambah Tahap
              </button>
            </div>

            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#0e1017] border border-white/[0.06] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#ff5733] font-bold">
                      Tahap #{idx + 1}
                    </span>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(idx)}
                        className="text-zinc-600 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Judul termin"
                      value={m.title}
                      onChange={(e) => {
                        const copy = [...milestones];
                        copy[idx].title = e.target.value;
                        setMilestones(copy);
                      }}
                      required
                      className="px-3.5 py-2 bg-[#08090c] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#ff4625]"
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-500">Rp</span>
                      <input
                        type="number"
                        placeholder="Nominal"
                        value={m.amount}
                        onChange={(e) => {
                          const copy = [...milestones];
                          copy[idx].amount = Number(e.target.value);
                          setMilestones(copy);
                        }}
                        required
                        className="w-full px-3.5 py-2 bg-[#08090c] border border-white/[0.08] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#ff4625]"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Deskripsi target deliverable tahapan ini..."
                    value={m.description}
                    onChange={(e) => {
                      const copy = [...milestones];
                      copy[idx].description = e.target.value;
                      setMilestones(copy);
                    }}
                    required
                    className="w-full px-3.5 py-2 bg-[#08090c] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#ff4625]"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isConnected}
            className="w-full py-3.5 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white font-mono text-xs font-bold tracking-wide shadow-xl shadow-[#ff4625]/25 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{loadingStep || "MEMPROSES..."}</span>
              </>
            ) : (
              "KUNCI & DAFTARKAN KESEPAKATAN ON-CHAIN"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function CreateAgreementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090c] flex items-center justify-center text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin text-[#ff5733]" />
        </div>
      }
    >
      <CreateAgreementForm />
    </Suspense>
  );
}