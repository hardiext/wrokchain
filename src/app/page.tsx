"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Layers,
  FileCode,
  Scale,
  Fingerprint,
  Briefcase,
  Check,
  X,
} from "lucide-react";

type Tone = "client" | "worker" | "neutral";

const TONE: Record<Tone, { text: string; badge: string }> = {
  client: {
    text: "text-[#34d399]",
    badge: "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]",
  },
  worker: {
    text: "text-[#ff4625]",
    badge: "border-[#ff4625]/40 bg-[#ff4625]/10 text-[#ff4625]",
  },
  neutral: {
    text: "text-zinc-300",
    badge: "border-white/[0.16] bg-white/[0.04] text-zinc-200",
  },
};

const NAV_LINKS = [
  { href: "#how-it-works", label: "ARSITEKTUR" },
  { href: "#features", label: "FITUR" },
  { href: "#compliance", label: "LEGALITAS" },
  { href: "#security", label: "KEAMANAN" },
];

const HERO_STEPS: { tag: string; title: string; body: string; tone: Tone }[] = [
  {
    tag: "01 / Draft & Anchor",
    title: "Canonical Terms Hash",
    body: "Detail scope, termin IDR, dan tenggat waktu diformat RFC 8785 lalu di-hash keccak-256.",
    tone: "client",
  },
  {
    tag: "02 / Deliverable Proof",
    title: "Immutable Manifest",
    body: "Worker mengunci bukti pengerjaan on-chain sebelum Klien menyetujui.",
    tone: "worker",
  },
  {
    tag: "03 / Attestation",
    title: "Two-Sided Settlement",
    body: "Klien transfer bank, Worker konfirmasi. Keduanya tercatat on-chain.",
    tone: "neutral",
  },
];

const TECH_STACK = [
  "ETHEREUM SEPOLIA",
  "SOLIDITY ^0.8.20",
  "VIEM / WAGMI",
  "NEXT.JS APP ROUTER",
  "SUPABASE POSTGRESQL",
  "RFC 8785 CANONICAL",
];

const PROBLEMS = [
  {
    title: "Berisiko secara hukum:",
    body: "Menggunakan token kripto sebagai alat bayar jasa bertentangan dengan UU Mata Uang.",
  },
  {
    title: "Volatilitas:",
    body: "Nilai token bisa turun tajam sebelum pekerjaan freelancer selesai.",
  },
  {
    title: "Izin rekber kompleks:",
    body: "Menampung dana pihak ketiga memerlukan izin PJP Bank Indonesia.",
  },
];

const SOLUTIONS = [
  {
    title: "Denominasi IDR:",
    body: "Pembayaran langsung antar rekening P2P (BCA, Mandiri, Flip, QRIS).",
  },
  {
    title: "Bukti terkunci on-chain:",
    body: "Smart contract mencatat terms, deliverable, dan attestation tanpa memegang dana.",
  },
  {
    title: "Audit publik:",
    body: "Sertifikat audit dapat dibuka siapa pun tanpa login.",
  },
];

const CYCLE: { title: string; body: string; fn?: string; tone: Tone }[] = [
  {
    title: "Inisiasi & Lock",
    body: "Klien menetapkan termin & deskripsi. Hash di-anchor on-chain dengan fungsi",
    fn: "createAgreement",
    tone: "client",
  },
  {
    title: "Persetujuan Worker",
    body: "Worker memeriksa rincian, lalu menandatangani kontrak on-chain via",
    fn: "acceptAgreement",
    tone: "worker",
  },
  {
    title: "Submit Deliverable",
    body: "Worker mengirim hash manifest hasil kerja ke blockchain dengan",
    fn: "submitMilestone",
    tone: "worker",
  },
  {
    title: "Settlement & Attest",
    body: "Klien mentransfer Rupiah, lalu kedua pihak mencatat attestation di blockchain.",
    tone: "neutral",
  },
];

const PILLARS = [
  {
    icon: FileCode,
    title: "RFC 8785 Canonical JSON",
    body: "Data dinormalisasi deterministik agar hash keccak-256 konsisten di semua environment.",
  },
  {
    icon: Lock,
    title: "Database Row-Level Guard",
    body: "Trigger PostgreSQL di Supabase mencegah milestone diubah setelah kontrak on-chain.",
  },
  {
    icon: Scale,
    title: "Non-Custodial",
    body: "Protokol tidak memegang uang Anda, menghilangkan risiko peretasan dompet rekber.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090c] font-sans text-white antialiased selection:bg-[#34d399]/20">
      <div className="pointer-events-none fixed right-[-5%] top-[-10%] h-[600px] w-[600px] rounded-full bg-[#ff4625]/[0.04] blur-[150px]" />
      <div className="pointer-events-none fixed left-[-10%] top-[40%] h-[600px] w-[600px] rounded-full bg-[#34d399]/[0.04] blur-[150px]" />
      
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#08090c]/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] shadow-inner">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">WORKCHAIN</span>
              <span className="rounded border border-[#34d399]/30 bg-[#34d399]/10 px-2 py-0.5 font-mono text-[10px] text-[#34d399]">
                V3.1
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-8 font-mono text-xs text-zinc-400 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="transition hover:text-white">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 font-mono text-xs font-semibold text-zinc-300 transition hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white"
            >
              DASHBOARD
            </Link>
            <ConnectButton accountStatus="avatar" chainStatus="icon" />
          </div>
        </div>
      </header>

      <main>
        <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-24 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1 font-mono text-xs uppercase tracking-wider text-zinc-300">
              <Fingerprint className="h-3.5 w-3.5" />
              <span>Proof-of-Deliverable Protocol</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl xl:text-6xl">
              Kesepakatan Kerja Freelance <br />
              <span className="text-zinc-500">Terkunci Kriptografis On-Chain.</span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Tanpa escrow dana: pembayaran tetap dalam Rupiah (IDR) secara off-chain, sementara hash deliverable dan bukti transfer dicatat on-chain sebagai jejak audit immutable.
            </p>

            <div className="flex flex-col items-stretch gap-4 pt-4 sm:flex-row sm:items-center">
              <Link
                href="/create"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#34d399] px-8 py-3.5 font-mono text-xs font-bold tracking-wide text-[#08090c] shadow-lg shadow-[#34d399]/20 transition hover:scale-[1.01] hover:bg-[#2cc08a] active:scale-[0.99]"
              >
                <span>BUAT KESEPAKATAN</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/jobs"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#ff4625]/30 bg-[#ff4625]/[0.06] px-8 py-3.5 font-mono text-xs font-bold text-[#ff4625] transition hover:scale-[1.01] hover:bg-[#ff4625]/10 active:scale-[0.99]"
              >
                <Briefcase className="h-4 w-4" />
                <span>LIHAT LOWONGAN</span>
              </Link>
            </div>
          </div>

          <div className="w-full rounded-3xl border border-white/[0.08] bg-[#0e1017] p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399]" />
                <span>SEPOLIA TESTNET</span>
              </div>
              <span className="font-mono text-[10px] uppercase text-zinc-500">Spec V3.1</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {HERO_STEPS.map((s) => (
                <div
                  key={s.tag}
                  className="group space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-white/[0.12]"
                >
                  <span className={`block font-mono text-[10px] uppercase tracking-wider ${TONE[s.tone].text}`}>
                    {s.tag}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                  <p className="text-xs leading-relaxed text-zinc-400">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.08] bg-black/40 py-10">
          <div className="mx-auto max-w-7xl px-6">
            <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              ARSITEKTUR & INFRASTRUKTUR
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 font-mono text-xs tracking-wider text-zinc-400 md:gap-16">
              {TECH_STACK.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto mb-16 max-w-2xl space-y-3 text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Paradigma Baru
            </span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Mengapa Escrow Kripto Sulit Dipakai di Pasar Lokal
            </h2>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-6 rounded-3xl border border-red-500/20 bg-red-950/10 p-8 shadow-xl">
              <span className="inline-block rounded border border-red-500/20 bg-red-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-red-400">
                Masalah escrow biasa
              </span>
              <ul className="space-y-5 text-xs text-zinc-300">
                {PROBLEMS.map((p) => (
                  <li key={p.title} className="flex items-start gap-3">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <span>
                      <strong className="text-white">{p.title}</strong> {p.body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6 rounded-3xl border border-[#34d399]/20 bg-[#34d399]/5 p-8 shadow-xl">
              <span className="inline-block rounded border border-[#34d399]/20 bg-[#34d399]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#34d399]">
                Pendekatan WorkChain V3.1
              </span>
              <ul className="space-y-5 text-xs text-zinc-300">
                {SOLUTIONS.map((s) => (
                  <li key={s.title} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#34d399]" />
                    <span>
                      <strong className="text-white">{s.title}</strong> {s.body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-white/[0.08] bg-[#0e1017]/50 px-6 py-24">
          <div className="mx-auto max-w-7xl space-y-16">
            <div className="mx-auto max-w-2xl space-y-3 text-center">
              <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                Mekanisme Kerja
              </span>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Empat Tahap Siklus Kesepakatan
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              {CYCLE.map((step, i) => (
                <div
                  key={step.title}
                  className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#08090c] p-6 shadow-lg transition hover:border-white/[0.15]"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border font-mono text-xs font-bold ${TONE[step.tone].badge}`}
                  >
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-zinc-400">
                    {step.body}
                    {step.fn && (
                      <>
                        {" "}
                        <code className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5 font-mono text-[#34d399]">
                          {step.fn}
                        </code>
                        .
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 font-mono text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#34d399]" /> Klien
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#ff4625]" /> Worker
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-400" /> Keduanya
              </span>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto mb-16 max-w-2xl space-y-3 text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Standar Protokol
            </span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Fitur Kunci</h2>
          </div>

          <div id="security" className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="group space-y-4 rounded-3xl border border-white/[0.08] bg-[#0e1017] p-8 shadow-xl transition hover:border-white/[0.15]"
              >
                <Icon className="h-6 w-6 text-zinc-300 group-hover:text-white" />
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="text-xs leading-relaxed text-zinc-400">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="compliance" className="border-t border-white/[0.08] bg-black/40 px-6 py-20">
          <div className="mx-auto max-w-5xl space-y-6 rounded-3xl border border-[#34d399]/20 bg-[#34d399]/5 p-8 shadow-2xl sm:p-12">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-[#34d399]" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#34d399]">
                Regulatory Compliance Architecture
              </span>
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Tunduk Pada Regulasi Finansial Indonesia
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              UU No. 7 Tahun 2011 tentang Mata Uang mewajibkan Rupiah untuk transaksi pembayaran di wilayah NKRI. Pada WorkChain, uang berpindah langsung antar rekening perbankan nasional dalam IDR, sedangkan smart contract hanya mencatat bukti prestasi kerja dan attestation pembayaran.
            </p>
            <p className="font-mono text-[10px] text-zinc-500">
              Bukan nasihat hukum. Konsultasikan kepatuhan regulasi dengan penasihat hukum Anda.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="space-y-6 rounded-3xl border border-white/[0.08] bg-[#0e1017] p-10 text-center shadow-2xl sm:p-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Mulai Kunci Kesepakatan Pertama
            </h2>
            <p className="mx-auto max-w-xl text-sm text-zinc-400">
              Gunakan dompet Web3 Anda. Tidak ada biaya perantara pihak ketiga.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
              <Link
                href="/create"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#34d399] px-8 py-3.5 font-mono text-xs font-bold tracking-wide text-[#08090c] shadow-lg shadow-[#34d399]/20 transition hover:scale-[1.01] hover:bg-[#2cc08a] active:scale-[0.99]"
              >
                <span>BUAT KESEPAKATAN SEKARANG</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/jobs"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#ff4625]/30 bg-[#ff4625]/[0.06] px-8 py-3.5 font-mono text-xs font-bold text-[#ff4625] transition hover:scale-[1.01] hover:bg-[#ff4625]/10 active:scale-[0.99]"
              >
                <Briefcase className="h-4 w-4" />
                <span>CARI PEKERJAAN</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.08] bg-[#050608] px-6 py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 border-b border-white/[0.08] pb-12 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-white" />
              <span className="text-base font-bold text-white">WORKCHAIN</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              Protokol notarisasi perjanjian kerja dengan pembayaran off-chain IDR dan audit trail kriptografis.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-wider text-zinc-300">Navigasi</h4>
            <ul className="space-y-3 font-mono text-xs text-zinc-500">
              <li>
                <Link href="/dashboard" className="transition hover:text-white">
                  Dashboard Proyek
                </Link>
              </li>
              <li>
                <Link href="/create" className="transition hover:text-white">
                  Inisiasi Kontrak
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="transition hover:text-white">
                  Marketplace Lowongan
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="transition hover:text-white">
                  Peta Arsitektur
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-wider text-zinc-300">Protokol</h4>
            <ul className="space-y-3 font-mono text-xs text-zinc-500">
              <li>
                Smart Contract: <span className="text-zinc-400">Sepolia Testnet</span>
              </li>
              <li>
                Hash Engine: <span className="text-zinc-400">Keccak-256</span>
              </li>
              <li>
                Standards: <span className="text-zinc-400">RFC 8785 Canonical</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-wider text-zinc-300">Jaringan</h4>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-[#34d399]" />
              <span>Sepolia Testnet</span>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 pt-8 font-mono text-[10px] text-zinc-600 sm:flex-row">
          <span>&copy; {new Date().getFullYear()} WorkChain Protocol. All rights reserved.</span>
          <span className="tracking-widest">BUILT FOR WEB3 FREELANCING</span>
        </div>
      </footer>
    </div>
  );
}