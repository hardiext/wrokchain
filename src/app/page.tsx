"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  FileCheck2, 
  Lock, 
  FolderGit2, 
  Cpu, 
  Scale, 
  ExternalLink,
  ChevronRight,
  Database,
  Layers
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [searchId, setSearchId] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);

  // State Simulator Interaktif
  const [simulatorStep, setSimulatorStep] = useState<number>(2);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    router.push(`/project/${searchId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white selection:bg-indigo-600 selection:text-white font-sans overflow-x-hidden">
      
      {/* 1. NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between sticky top-0 bg-[#0d0e12]/90 backdrop-blur-md z-50 border-b border-zinc-900/60">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-extrabold text-xl tracking-tight uppercase">
            WORKCHAIN<span className="text-indigo-500">.</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
          <a href="#features" className="hover:text-white transition">Fitur Inti</a>
          <a href="#simulator" className="hover:text-white transition">Simulasi State</a>
          <a href="#workflow" className="hover:text-white transition">Alur Kerja</a>
          <a href="#architecture" className="hover:text-white transition">Arsitektur</a>
          <a href="#legal" className="hover:text-white transition">Regulasi & Legal</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSearchModal(!showSearchModal)}
            className="h-10 w-10 rounded-full border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition"
            title="Cari ID Kontrak"
          >
            <Search className="h-4 w-4" />
          </button>

          <div className="scale-95 origin-right">
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, mounted }) => {
                const connected = mounted && account && chain;
                return (
                  <div>
                    {!connected ? (
                      <button
                        onClick={openConnectModal}
                        className="px-6 py-2.5 rounded-full bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition shadow-md"
                      >
                        Connect Wallet
                      </button>
                    ) : (
                      <ConnectButton />
                    )}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </header>

      {/* Pop-up Pencarian Kontrak Cepat */}
      {showSearchModal && (
        <div className="max-w-md mx-auto px-6 my-4">
          <form onSubmit={handleSearch} className="flex gap-2 p-1.5 bg-[#14151b] border border-zinc-700 rounded-full shadow-2xl">
            <input
              type="number"
              placeholder="Masukkan ID Kontrak On-Chain (e.g. 1)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 px-4 py-2 bg-transparent text-xs text-white focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-6 py-2 bg-[#5b50f6] rounded-full text-xs font-semibold hover:bg-indigo-500 transition"
            >
              Cari
            </button>
          </form>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-20 border-b border-zinc-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <h2 className="text-4xl sm:text-6xl font-light text-zinc-400 tracking-tight">
                Create,
              </h2>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">
                  Agree, And Work
                </h1>
                <svg
                  className="w-10 h-6 text-zinc-400 hidden sm:block"
                  viewBox="0 0 50 25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 18 C 15 5, 25 22, 35 8 C 40 4, 45 15, 48 12" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">
                Decentralized Records
              </h1>
            </div>

            <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
              Infrastruktur kesepakatan digital dan rekam portofolio transparan berbasis smart contract. Mengunci jaminan pembayaran per milestone tanpa potongan perantara sentral.
            </p>

            <div className="flex items-center gap-5 pt-2">
              <Link
                href="/create"
                className="px-8 py-3.5 rounded-full bg-[#5b50f6] hover:bg-[#4d42ec] text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/25 flex items-center gap-2"
              >
                Inisiasi Kontrak <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="text-sm font-semibold text-zinc-300 hover:text-white transition"
              >
                Pelajari Fitur
              </a>
            </div>

            {/* Statistik Bottom */}
            <div className="pt-10 flex items-center gap-8 sm:gap-12 border-t border-zinc-900">
              <div>
                <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight block">0%</span>
                <span className="text-xs text-zinc-400 mt-1 block font-medium">Fee Platform</span>
              </div>
              <div className="h-10 w-[1px] bg-zinc-800" />
              <div>
                <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight block">100%</span>
                <span className="text-xs text-zinc-400 mt-1 block font-medium">Escrow Terkunci</span>
              </div>
              <div className="h-10 w-[1px] bg-zinc-800" />
              <div>
                <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight block">On-Chain</span>
                <span className="text-xs text-zinc-400 mt-1 block font-medium">Audit Bukti Kerja</span>
              </div>
            </div>
          </div>

          {/* Showcase Kartu Bertumpuk */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            <div className="absolute w-[320px] sm:w-[360px] h-[480px] bg-zinc-900 border border-zinc-800 rounded-2xl rotate-6 transform translate-x-4 translate-y-3 opacity-60 pointer-events-none" />

            <div className="relative w-[320px] sm:w-[360px] bg-[#14151b] border border-zinc-800 rounded-2xl p-4 shadow-2xl z-10">
              <div className="absolute top-7 right-7 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] font-medium text-zinc-300 border border-white/10">
                Milestone 1 Active
              </div>

              <div className="relative w-full h-[270px] rounded-xl overflow-hidden bg-zinc-950 mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop"
                  alt="Web3 Project Banner"
                  fill
                  priority
                  className="object-cover object-center"
                />
              </div>

              <div className="absolute -left-7 top-[215px] z-30 hidden sm:flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 p-1 flex items-center justify-center shadow-xl animate-spin-slow">
                  <div className="w-full h-full rounded-full border border-dashed border-zinc-500 flex items-center justify-center">
                    <span className="text-[7px] font-mono tracking-widest text-zinc-300 uppercase text-center block leading-tight">
                      ● WORKCHAIN ● ESCROW
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-1">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Smart Agreement #101</h3>
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-xs text-zinc-400">Total Escrow Vault</span>
                    <span className="text-sm font-bold text-white font-mono">1.70 ETH</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-[#14151b] flex items-center justify-center text-[10px] font-bold">KL</div>
                    <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-[#14151b] flex items-center justify-center text-[10px] font-bold">WK</div>
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#14151b] flex items-center justify-center text-[10px] font-bold text-zinc-400">✓</div>
                  </div>

                  <Link
                    href="/create"
                    className="px-6 py-2.5 rounded-full bg-[#5b50f6] hover:bg-[#4d42ec] text-white font-semibold text-xs transition shadow-md"
                  >
                    Buka Kontrak
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: 5 FITUR UTAMA WORKCHAIN */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-b border-zinc-900">
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-2">
            Spesifikasi Inti
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Lima Pilar Lapisan Kepercayaan
          </h2>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            Fokus esensial WorkChain dirancang tanpa tokenomics spekulatif atau kerumitan DAO, murni sebagai lapisan perjanjian dan bukti kerja permanen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-7 bg-[#14151b] border border-zinc-800/80 rounded-2xl space-y-4 hover:border-zinc-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderGit2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">1. Job & Project Management</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Struktur pembentukan proyek dengan penugasan spesifik wallet freelancer, total anggaran transparan, dan ID unik yang tercatat di jaringan terdistribusi.
            </p>
          </div>

          <div className="p-7 bg-[#14151b] border border-zinc-800/80 rounded-2xl space-y-4 hover:border-zinc-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">2. Digital Agreement</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dokumen kesepakatan yang mengikat ruang lingkup dan tenggat waktu ke dalam kriptografi hash (tamper-proof) yang disetujui bersama oleh kedua pihak.
            </p>
          </div>

          <div className="p-7 bg-[#14151b] border border-zinc-800/80 rounded-2xl space-y-4 hover:border-zinc-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">3. Milestone Tracking</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pembagian pengerjaan ke dalam tahapan terukur. Setiap termin mewajibkan unggahan link hasil kerja atau IPFS CID sebelum dapat ditinjau.
            </p>
          </div>

          <div className="p-7 bg-[#14151b] border border-zinc-800/80 rounded-2xl space-y-4 hover:border-zinc-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">4. Payment Escrow Tracking</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dana testnet dikunci di smart contract sejak inisiasi. Begitu klien menyetujui milestone, kontrak otomatis mentransfer dana secara instan ke pekerja.
            </p>
          </div>

          <div className="p-7 bg-[#14151b] border border-zinc-800/80 rounded-2xl space-y-4 hover:border-zinc-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">5. Verifiable Work Record</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Riwayat portofolio permanen yang dapat diverifikasi oleh siapa saja melalui penjelajah blok, membuktikan bahwa pekerjaan telah tuntas dibayar dan disetujui.
            </p>
          </div>

          <div className="p-7 bg-[#14151b] border border-zinc-800/80 rounded-2xl space-y-4 hover:border-zinc-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Scale className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Dispute Flagging Ringkas</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mekanisme penanda sengketa berbasis bukti konkret yang tercatat di smart contract untuk melindungi pihak yang beritikad baik jika kesepakatan dilanggar.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SECTION: SIMULATOR PROTOKOL INTERAKTIF */}
      <section id="simulator" className="max-w-7xl mx-auto px-6 py-24 border-b border-zinc-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block">
              Protokol Sandbox
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Uji Coba Transisi State Kontrak
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Gunakan simulasi interaktif ini untuk melihat bagaimana smart contract mengeksekusi perubahan status dari tanda tangan hingga pelepasan aset.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setSimulatorStep(1)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition flex items-center justify-between ${
                  simulatorStep === 1 ? "bg-indigo-600/10 border-indigo-500 text-white" : "bg-[#14151b] border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <span>Fase 1: Klien Deposit & Worker Menandatangani</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSimulatorStep(2)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition flex items-center justify-between ${
                  simulatorStep === 2 ? "bg-indigo-600/10 border-indigo-500 text-white" : "bg-[#14151b] border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <span>Fase 2: Worker Mengirim Bukti Pengerjaan (CID/URL)</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSimulatorStep(3)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition flex items-center justify-between ${
                  simulatorStep === 3 ? "bg-indigo-600/10 border-indigo-500 text-white" : "bg-[#14151b] border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <span>Fase 3: Klien Menyetujui & Dana Otomatis Cair</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 bg-[#14151b] border border-zinc-800 rounded-3xl space-y-6 shadow-2xl font-mono text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <span className="text-zinc-400 text-[11px]">LEDGER STATE EMULATOR</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                  TESTNET SYNCED
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Kontrak Aktif:</span>
                  <span className="text-white">Project #108</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Saldo Escrow Vault:</span>
                  <span className="text-emerald-400 font-bold">
                    {simulatorStep === 3 ? "0.0000 ETH (Lunas)" : "0.0500 ETH (Terkunci)"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Status Milestone 1:</span>
                  <span className="text-indigo-400">
                    {simulatorStep === 1 && "PENDING SUBMISSION"}
                    {simulatorStep === 2 && "SUBMITTED • MENUNGGU VERIFIKASI"}
                    {simulatorStep === 3 && "APPROVED & DANA DITRANSFER"}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-[11px]">
                <p className="text-zinc-500">// Event Log Emisi Blockchain:</p>
                {simulatorStep === 1 && (
                  <p className="text-zinc-300">emit AgreementAccepted(projectId: 108, worker: 0x71C...b29);</p>
                )}
                {simulatorStep === 2 && (
                  <p className="text-amber-400">emit MilestoneSubmitted(index: 0, proofHash: "ipfs://bafybeih...73");</p>
                )}
                {simulatorStep === 3 && (
                  <p className="text-emerald-400">emit MilestoneApproved(index: 0, amountPaid: 50000000000000000 wei);</p>
                )}
              </div>

              <div className="pt-2 text-[11px] text-zinc-500 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Eksekusi smart contract deterministik, tanpa campur tangan admin sistem.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: ALUR OPERASIONAL (WORKFLOW 01-04) */}
      <section id="workflow" className="max-w-7xl mx-auto px-6 py-24 border-b border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-2">
            Cara Kerja
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Empat Langkah Siklus Pekerjaan
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Mekanisme sederhana yang memastikan freelancer dibayar tepat waktu dan klien menerima deliverable sesuai standar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-[#14151b] border border-zinc-800 rounded-2xl space-y-3">
            <span className="text-2xl font-bold font-mono text-indigo-500">01</span>
            <h3 className="text-base font-bold text-white">Inisiasi & Deposit</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Klien menentukan ruang lingkup pekerjaan, jadwal termin, dan menyetor ETH ke vault smart contract sebagai jaminan komitmen.
            </p>
          </div>

          <div className="p-6 bg-[#14151b] border border-zinc-800 rounded-2xl space-y-3">
            <span className="text-2xl font-bold font-mono text-indigo-500">02</span>
            <h3 className="text-base font-bold text-white">Worker Sign</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pekerja meninjau perjanjian on-chain dan menandatangani kesepakatan secara digital menggunakan wallet MetaMask/Web3.
            </p>
          </div>

          <div className="p-6 bg-[#14151b] border border-zinc-800 rounded-2xl space-y-3">
            <span className="text-2xl font-bold font-mono text-indigo-500">03</span>
            <h3 className="text-base font-bold text-white">Submit Hasil Deliverable</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pekerja menyelesaikan tugas dan mengunggah URI berkas atau CID IPFS sebagai bukti permanen yang tercatat di jaringan.
            </p>
          </div>

          <div className="p-6 bg-[#14151b] border border-zinc-800 rounded-2xl space-y-3">
            <span className="text-2xl font-bold font-mono text-indigo-500">04</span>
            <h3 className="text-base font-bold text-white">Pencairan & Portofolio</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Klien mengonfirmasi hasil, dana escrow langsung ditransfer ke dompet pekerja, dan rekam kerja tercatat tanpa bisa dihapus.
            </p>
          </div>
        </div>
      </section>

      {/* 6. SECTION: ARSITEKTUR ON-CHAIN VS OFF-CHAIN */}
      <section id="architecture" className="max-w-7xl mx-auto px-6 py-24 border-b border-zinc-900">
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-2">
            Infrastruktur Teknis
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Pemisahan Data On-Chain & Off-Chain
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Sesuai batasan sistem di proposal, blockchain hanya dimanfaatkan sebagai mesin verifikasi status dan pengunci dana, bukan basis data besar yang boros gas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-[#14151b] border border-indigo-500/30 rounded-2xl space-y-5">
            <div className="flex items-center gap-3 text-indigo-400">
              <Cpu className="h-6 w-6" />
              <h3 className="text-lg font-bold text-white">On-Chain (Smart Contract EVM)</h3>
            </div>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Escrow Vault:</strong> Penahanan saldo dan transfer otomatis ETH saat milestone disetujui.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Proof Hash:</strong> Ringkasan kriptografis kesepakatan (SHA-256) untuk menjamin isi kontrak tidak dimanipulasi.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>State Machine:</strong> Perubahan status milestone (Pending, Submitted, Approved) dan event log audit.</span>
              </li>
            </ul>
          </div>

          <div className="p-8 bg-[#14151b] border border-zinc-800 rounded-2xl space-y-5">
            <div className="flex items-center gap-3 text-zinc-300">
              <Database className="h-6 w-6" />
              <h3 className="text-lg font-bold text-white">Off-Chain / Decentralized Storage</h3>
            </div>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Penyimpanan Berkas Hasil Kerja:</strong> File deliverables berukuran besar disimpan via IPFS / Storage terdistribusi.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Privasi Data Pribadi:</strong> Informasi identitas personal pengguna tidak disebarkan ke publik ledger.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Deskripsi Dokumen Panjang:</strong> Teks deskripsi detail scope pekerjaan dipertahankan di luar rantai blok.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 7. SECTION: REGULASI HUKUM & SDG 8 */}
      <section id="legal" className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block">
              Landasan Legalitas & Dampak Sosial
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Keselarasan Regulasi Elektronik Indonesia & SDG 8
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              WorkChain dibangun di atas prinsip kontrak elektronik sah menurut KUHPerdata dan UU ITE, sekaligus mendukung pencapaian pekerjaan layak bagi pekerja gig mandiri.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-4 bg-[#14151b] border border-zinc-800 rounded-xl space-y-1">
                <span className="font-bold text-white block">KUHPerdata & UU ITE</span>
                <p className="text-zinc-400 text-[11px]">
                  Memenuhi syarat sah perjanjian (Pasal 1320 KUHPerdata) dan keabsahan alat bukti elektronik (Pasal 5 UU ITE).
                </p>
              </div>
              <div className="p-4 bg-[#14151b] border border-zinc-800 rounded-xl space-y-1">
                <span className="font-bold text-white block">SDG 8: Decent Work</span>
                <p className="text-zinc-400 text-[11px]">
                  Mendukung pertumbuhan ekonomi inklusif dan meminimalisir risiko eksploitasi kerja lepas tanpa bayaran.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="p-8 bg-[#14151b] border border-zinc-800 rounded-3xl space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                <Scale className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Infrastruktur Kepercayaan Digital</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Tidak menggantikan badan hukum formal, melainkan memberikan instrumen pencatatan bukti yang tidak dapat disangkal.
                </p>
              </div>
              <Link
                href="/create"
                className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition inline-block shadow-md"
              >
                Mulai Gunakan Protokol
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-zinc-900 py-12 px-6 text-zinc-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-[11px]">
          <div>
            <span className="font-bold text-white uppercase tracking-wider block">WORKCHAIN PROTOCOL</span>
            <span className="text-zinc-500">Infrastruktur Kesepakatan Digital • Telkom University Purwokerto 2026</span>
          </div>
          <div className="flex gap-6 text-zinc-400">
            <Link href="/create" className="hover:text-white transition">
              Buat Agreement
            </Link>
            <a href="https://sepolia.etherscan.io" target="_blank" rel="noreferrer" className="hover:text-white transition flex items-center gap-1">
              Sepolia Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}