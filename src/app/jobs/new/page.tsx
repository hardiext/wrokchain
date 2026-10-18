"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Megaphone,
  Banknote,
  CalendarClock,
  Layers,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  { value: "DEVELOPMENT", label: "Development" },
  { value: "DESIGN", label: "UI/UX Design" },
  { value: "SMART_CONTRACT", label: "Smart Contract" },
  { value: "SECURITY", label: "Security Audit" },
] as const;

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition focus:border-[#34d399]/60 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-[#34d399]/30 [color-scheme:dark]";

const getErrorMessage = (err: unknown): string => {
  if (typeof err === "object" && err !== null) {
    const { message } = err as { message?: string };
    if (message) return message;
  }
  return "Gagal memposting lowongan.";
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

export default function PostJobPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("DEVELOPMENT");
  const [description, setDescription] = useState("");
  const [budgetIdr, setBudgetIdr] = useState(5000000);
  const [estimatedDays, setEstimatedDays] = useState(14);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      setErrorMsg("Harap hubungkan dompet Web3 terlebih dahulu.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("job_postings")
        .insert({
          client_address: address.toLowerCase(),
          title: title.trim(),
          category,
          description: description.trim(),
          budget_idr: budgetIdr,
          estimated_days: estimatedDays,
          status: "OPEN",
        })
        .select()
        .single();

      if (error) throw error;
      router.push(`/jobs/${data.id}`);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(getErrorMessage(err));
    } finally {
      setLoading(false);
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
            href="/jobs"
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-zinc-400 transition hover:border-white/[0.16] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> KEMBALI KE LOWONGAN
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl space-y-6 px-6 pt-10">
        <section className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#34d399]">
            <Megaphone className="h-3 w-3" /> Client · Rekrut Talenta Web3
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Pasang Lowongan Pekerjaan</h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
            Publikasikan kebutuhan proyek Anda. Worker akan mengirimkan proposal sebelum Anda
            mengunci kesepakatan on-chain.
          </p>
        </section>

        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-7 backdrop-blur-sm"
        >
          <Field label="Judul Lowongan">
            <input
              type="text"
              placeholder="Contoh: Pembuatan Full-stack DApp Next.js + Smart Contract"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Kategori Proyek" icon={<Layers className="h-3 w-3" />}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-[#0e1017]">
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estimasi Durasi (Hari)" icon={<CalendarClock className="h-3 w-3" />}>
              <input
                type="number"
                min="1"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(Number(e.target.value))}
                required
                className={`${inputClass} font-mono text-xs`}
              />
            </Field>
          </div>

          <Field label="Anggaran Biaya (IDR)" icon={<Banknote className="h-3 w-3" />}>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-500">Rp</span>
              <input
                type="number"
                step="50000"
                min="0"
                value={budgetIdr}
                onChange={(e) => setBudgetIdr(Number(e.target.value))}
                required
                className={`${inputClass} font-mono text-xs`}
              />
            </div>
          </Field>

          <Field label="Deskripsi Ruang Lingkup & Kualifikasi">
            <textarea
              rows={5}
              placeholder="Jelaskan kebutuhan teknis, deliverable yang diharapkan, dan batasan pengerjaan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className={`${inputClass} resize-none`}
            />
          </Field>

          <div className="space-y-3 pt-1">
            <button
              type="submit"
              disabled={loading || !isConnected}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#34d399] py-3.5 font-mono text-xs font-bold tracking-wide text-[#08090c] shadow-lg shadow-[#34d399]/20 transition hover:bg-[#2cc08a] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>MEMPROSES...</span>
                </>
              ) : (
                <>
                  <Megaphone className="h-4 w-4" />
                  <span>PUBLIKASIKAN LOWONGAN</span>
                </>
              )}
            </button>
            {!isConnected && (
              <p className="flex items-center justify-center gap-1.5 font-mono text-[10px] text-zinc-500">
                <Wallet className="h-3 w-3" /> Hubungkan dompet untuk melanjutkan.
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}