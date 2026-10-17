"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Award, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RecordsPage({ params }: { params: Promise<{ address: string }> }) {
  const resolvedParams = use(params);
  const targetWallet = resolvedParams.address.toLowerCase();
  const [workerStats, setWorkerStats] = useState<any>(null);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      // Membaca langsung dari PostgreSQL VIEW worker_record
      const { data: wRecord } = await supabase.from("worker_record").select("*").eq("wallet", targetWallet).single();
      const { data: aList } = await supabase.from("agreements").select("*").eq("worker_address", targetWallet);
      setWorkerStats(wRecord || {});
      setAgreements(aList || []);
      setLoading(false);
    }
    loadStats();
  }, [targetWallet]);

  if (loading) {
    return <div className="min-h-screen bg-[#090a0f] text-zinc-400 flex items-center justify-center font-mono text-xs">Memuat rekam jejak...</div>;
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-white selection:bg-indigo-600 font-sans py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Portal WorkChain
        </Link>

        <div className="bg-[#12131a] border border-zinc-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Rekam Jejak Terverifikasi (Worker Record)</h1>
              <p className="text-xs font-mono text-zinc-400 break-all">{targetWallet}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900">
              <span className="text-zinc-500 text-[10px] block">DITERIMA</span>
              <p className="text-2xl font-bold text-white">{workerStats.agreements_accepted || 0}</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900">
              <span className="text-zinc-500 text-[10px] block">TUNTAS</span>
              <p className="text-2xl font-bold text-emerald-400">{workerStats.agreements_completed || 0}</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900">
              <span className="text-zinc-500 text-[10px] block">MILESTONE APPROVED</span>
              <p className="text-2xl font-bold text-white">{workerStats.milestones_approved || 0}</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900">
              <span className="text-zinc-500 text-[10px] block">PEMBAYARAN CONFIRMED</span>
              <p className="text-2xl font-bold text-indigo-400">{workerStats.payments_confirmed || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}