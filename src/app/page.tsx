"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  CheckCircle2,
  FileCode,
  Terminal,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Cpu,
  Scale,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08090c] text-white selection:bg-[#ff4625]/30 selection:text-white font-sans antialiased relative overflow-hidden">
      {/* Ambient Lighting Gradients */}
      <div className="pointer-events-none fixed top-[-15%] right-[5%] w-[600px] h-[600px] bg-gradient-to-br from-[#ff4625]/15 via-[#8b5cf6]/10 to-transparent blur-[140px] rounded-full" />
      <div className="pointer-events-none fixed top-[40%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-[#6366f1]/10 to-transparent blur-[160px] rounded-full" />

      {/* Grid Blueprint Texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08090c]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff4625] to-[#8b5cf6] p-[1px] shadow-lg shadow-[#ff4625]/20">
              <div className="w-full h-full bg-[#08090c] rounded-[11px] flex items-center justify-center">
                <Layers className="h-4 w-4 text-[#ff5733]" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base">WORKCHAIN</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-400">
                V3.1
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-mono text-zinc-400">
            <a href="#how-it-works" className="hover:text-white transition">ARSITEKTUR</a>
            <a href="#features" className="hover:text-white transition">FITUR</a>
            <a href="#compliance" className="hover:text-white transition">LEGALITAS</a>
            <a href="#security" className="hover:text-white transition">KEAMANAN</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-mono text-zinc-300 hover:text-white px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2] transition"
            >
              DASHBOARD
            </Link>
            <ConnectButton accountStatus="avatar" chainStatus="icon" />
          </div>
        </div>
      </header>

      {/* SESSION 1: HERO */}
      <section className="relative z-10 pt-20 pb-24 px-6 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ff4625]/30 bg-[#ff4625]/10 text-[#ff7755] text-xs font-mono tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Decentralized Proof-of-Deliverable Protocol</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Kesepakatan Kerja Freelance <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
              Terkunci Kriptografis On-Chain.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Tanpa repot izin escrow finansial: Transaksi tetap menggunakan Rupiah (IDR) off-chain murni, dengan notarisasi hash deliverable dan bukti mutasi yang mustahil dimanipulasi.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/create"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white font-mono text-xs font-bold tracking-wide shadow-xl shadow-[#ff4625]/25 transition hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <span>BUAT KESEPAKATAN BARU</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 font-mono text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <span>PELAJARI MEKANISME</span>
            </a>
          </div>
        </div>

        {/* Hero Interactive Visual Node */}
        <div className="mt-16 max-w-5xl mx-auto rounded-3xl border border-white/[0.08] bg-[#0e1017]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span>LIVE WORKCHAIN NETWORK: SEPOLIA L1</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">SPEC V3.1 LEAN INTEGRITY</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <span className="text-[10px] font-mono text-[#ff5733] uppercase tracking-wider block">01 / DRAFT & ANCHOR</span>
              <h3 className="text-sm font-bold text-white">Canonical Terms Hash</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Detail scope, termin IDR, dan tenggat waktu diformat RFC 8785 lalu di-hash keccak-256.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <span className="text-[10px] font-mono text-[#8b5cf6] uppercase tracking-wider block">02 / DELIVERABLE PROOF</span>
              <h3 className="text-sm font-bold text-white">Immutable Manifest</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Worker mengunci bukti pengerjaan (GitHub/IPFS) on-chain sebelum Klien menyetujui.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">03 / ATTESTATION</span>
              <h3 className="text-sm font-bold text-white">Two-Sided Settlement</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Klien klaim bukti transfer bank, Worker konfirmasi masuk. Keduanya terpasak on-chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SESSION 2: ECOSYSTEM / TECH STACK STRIP */}
      <section className="py-12 border-y border-white/[0.06] bg-black/30">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-6">
            DIBANGUN DENGAN TEKNOLOGI WEB3 & DATABASE TERPERCAYA
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 font-mono text-sm tracking-wider text-zinc-400">
            <span>ETHEREUM SEPOLIA</span>
            <span>SOLIDITY v0.8.20</span>
            <span>VIEM / WAGMI</span>
            <span>NEXT.JS APP ROUTER</span>
            <span>SUPABASE POSTGRESQL</span>
            <span>RFC 8785 CANONICAL</span>
          </div>
        </div>
      </section>

      {/* SESSION 3: CORE PROBLEM VS WORKCHAIN */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-mono text-[#ff5733] tracking-widest uppercase">PARADIGMA BARU</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Solusi Mengapa Escrow Kripto Biasa Gagal di Pasar Nyata
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Sisi Tradisional / Escrow Kripto Biasa */}
          <div className="p-8 rounded-3xl border border-red-500/20 bg-red-950/[0.08] space-y-5">
            <span className="px-3 py-1 rounded text-[10px] font-mono tracking-wider uppercase bg-red-500/10 text-red-400 border border-red-500/20">
              MASALAH ESCROW BIASA
            </span>
            <ul className="space-y-4 text-xs text-zinc-300">
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong>Ilegal di Indonesia:</strong> Menggunakan token kripto sebagai alat bayar jasa dilarang UU Mata Uang.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong>Volatilitas Liar:</strong> Nilai token bisa anjlok 15% sebelum pekerjaan freelancer selesai.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong>Izin Rekber Kompleks:</strong> Menampung dana pihak ketiga wajib izin PJP Bank Indonesia.</span>
              </li>
            </ul>
          </div>

          {/* Sisi WorkChain Solution */}
          <div className="p-8 rounded-3xl border border-emerald-500/20 bg-emerald-950/[0.08] space-y-5">
            <span className="px-3 py-1 rounded text-[10px] font-mono tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              PENDEKATAN WORKCHAIN V3.1
            </span>
            <ul className="space-y-4 text-xs text-zinc-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>100% Legal & Denominasi IDR:</strong> Pembayaran langsung rekening P2P (BCA, Mandiri, Flip, QRIS).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Integritas Bukti Blockchain:</strong> Smart contract bertindak sebagai notaris digital tanpa beban kustodi uang.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Bukti Audit Publik:</strong> Sertifikat audit on-chain dapat diverifikasi siapa pun tanpa login.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SESSION 4: HOW IT WORKS (ARCHITECTURE ROADMAP) */}
      <section id="how-it-works" className="py-24 px-6 border-t border-white/[0.06] bg-[#0b0d13]/50">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono text-[#ff5733] tracking-widest uppercase">MEKANISME KERJA</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Empat Tahap Siklus Kesepakatan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#11131a] border border-white/[0.06] space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-[#ff4625]/20 text-[#ff6644] border border-[#ff4625]/40 flex items-center justify-center font-mono font-bold text-xs">
                1
              </div>
              <h3 className="text-sm font-bold text-white">Inisiasi & Lock</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Klien menetapkan termin & deskripsi. Hash di-anchor on-chain dengan fungsi <code className="text-[#ff5733]">createAgreement</code>.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#11131a] border border-white/[0.06] space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] text-zinc-300 border border-white/[0.1] flex items-center justify-center font-mono font-bold text-xs">
                2
              </div>
              <h3 className="text-sm font-bold text-white">Persetujuan Worker</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Worker memeriksa rincian, lalu menandatangani kontrak on-chain via <code className="text-[#ff5733]">acceptAgreement</code>.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#11131a] border border-white/[0.06] space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] text-zinc-300 border border-white/[0.1] flex items-center justify-center font-mono font-bold text-xs">
                3
              </div>
              <h3 className="text-sm font-bold text-white">Submit Deliverable</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Worker mengunggah manifest hasil kerja (URL & deskripsi) ke blockchain dengan <code className="text-[#ff5733]">submitMilestone</code>.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#11131a] border border-white/[0.06] space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-xs">
                4
              </div>
              <h3 className="text-sm font-bold text-white">Settlement & Attest</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Klien transfer Rupiah riil, kedua pihak mencatat attestation di blockchain hingga status lunas resmi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SESSION 5: TECHNICAL PILLARS */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-mono text-[#ff5733] tracking-widest uppercase">STANDARISASI PROTOKOL</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Fitur Kunci Berstandar Enterprise
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-[#0e1017] border border-white/[0.07] space-y-4">
            <FileCode className="h-6 w-6 text-[#ff5733]" />
            <h3 className="text-base font-bold text-white">RFC 8785 Canonical JSON</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Format data dinormalisasi secara deterministik untuk menjamin keccak-256 hash konsisten di semua lingkungan komputasi.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#0e1017] border border-white/[0.07] space-y-4">
            <Lock className="h-6 w-6 text-[#8b5cf6]" />
            <h3 className="text-base font-bold text-white">Database Row-Level Guard</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dilindungi oleh PostgreSQL triggers di Supabase: milestone tidak bisa diubah begitu status berpindah dari DRAFT ke on-chain[cite: 1].
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#0e1017] border border-white/[0.07] space-y-4">
            <Scale className="h-6 w-6 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Non-Custodial Architecture</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Protokol tidak pernah memegang uang Anda, mengeliminasi risiko peretasan dompet rekber atau masalah regulasi kustodian.
            </p>
          </div>
        </div>
      </section>

      {/* SESSION 6: COMPLIANCE & LEGAL NOTICE */}
      <section id="compliance" className="py-20 px-6 border-t border-white/[0.06] bg-black/40">
        <div className="max-w-5xl mx-auto rounded-3xl border border-white/[0.08] bg-[#0e1017]/80 p-8 sm:p-12 space-y-6">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span className="font-mono text-xs uppercase tracking-wider text-emerald-300 font-bold">
              REGULATORY COMPLIANCE ARCHITECTURE
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Dirancang Sesuai Lanskap Regulasi Finansial Indonesia
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Berdasarkan UU No. 7 Tahun 2011 tentang Mata Uang dan Peraturan Bank Indonesia, setiap transaksi pembayaran barang dan jasa di wilayah NKRI wajib menggunakan Rupiah. WorkChain Protocol mematuhi regulasi ini sepenuhnya: mata uang fiat IDR berpindah langsung antar rekening perbankan nasional, sementara smart contract bertindak sebagai notaris digital independen pembukti prestasi kerja.
          </p>
        </div>
      </section>

      {/* SESSION 7: FINAL CALL TO ACTION */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="relative rounded-3xl border border-[#ff4625]/30 bg-gradient-to-b from-[#ff4625]/15 via-[#121017] to-[#08090c] p-10 sm:p-16 text-center space-y-6 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-radial from-[#ff4625]/10 via-transparent to-transparent blur-2xl" />
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Mulai Kunci Kesepakatan Pertama Anda
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Hanya butuh dompet Web3 untuk memulai. Bebas potongan perantara pihak ketiga.
          </p>
          <div className="pt-2">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#ff4625] hover:bg-[#e03a1a] text-white font-mono text-xs font-bold shadow-2xl shadow-[#ff4625]/30 transition hover:scale-105"
            >
              <span>BUAT KESEPAKATAN SEKARANG</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] bg-[#050608] py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/[0.06]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#ff5733]" />
              <span className="font-bold text-white text-base">WORKCHAIN</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Protokol notarisasi perjanjian kerja terdesentralisasi dengan pembayaran off-chain IDR dan audit trail kriptografis.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-xs text-zinc-300 uppercase tracking-wider mb-4">Navigasi</h4>
            <ul className="space-y-2 text-xs text-zinc-500 font-mono">
              <li><Link href="/dashboard" className="hover:text-white transition">Dashboard Proyek</Link></li>
              <li><Link href="/create" className="hover:text-white transition">Inisiasi Kontrak</Link></li>
              <li><a href="#how-it-works" className="hover:text-white transition">Peta Arsitektur</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs text-zinc-300 uppercase tracking-wider mb-4">Protokol</h4>
            <ul className="space-y-2 text-xs text-zinc-500 font-mono">
              <li>Smart Contract: <span className="text-zinc-400">Sepolia Testnet</span></li>
              <li>Hash Engine: <span className="text-zinc-400">Keccak-256</span></li>
              <li>Standards: <span className="text-zinc-400">RFC 8785 Canonical</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs text-zinc-300 uppercase tracking-wider mb-4">Status Jaringan</h4>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sepolia Operational</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 font-mono gap-4">
          <span>&copy; {new Date().getFullYear()} WorkChain Protocol. All rights reserved.</span>
          <span>BUILT FOR WEB3 FREELANCING ECOSYSTEM</span>
        </div>
      </footer>
    </div>
  );
}