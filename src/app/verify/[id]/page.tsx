"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [agreement, setAgreement] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase
      .from("agreements")
      .select("*, milestones(*)")
      .eq("id", resolvedParams.id)
      .single()
      .then(({ data }) => setAgreement(data));
  }, [resolvedParams.id]);

  if (!agreement) {
    return <div className="min-h-screen bg-[#090a0f] text-zinc-400 flex items-center justify-center font-mono text-xs">Memvalidasi sertifikat...</div>;
  }

  const totalAmount = agreement.milestones.reduce((acc: number, m: any) => acc + Number(m.amount), 0);

  return (
    <div className="min-h-screen bg-[#090a0f] text-white selection:bg-indigo-600 font-sans py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Portal WorkChain
        </Link>

        <div className="bg-[#12131a] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block">LEAN SPEC V3.1 CERTIFICATE</span>
              <h1 className="text-2xl font-bold tracking-tight text-white">{agreement.title}</h1>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Terverifikasi Sah
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 space-y-1">
              <span className="text-zinc-500 text-[10px]">CANONICAL TERMS HASH (KECCAK-256)</span>
              <p className="text-indigo-400 break-all select-all">{agreement.terms_hash}</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 space-y-1">
              <span className="text-zinc-500 text-[10px]">TOTAL NILAI KESEPAKATAN</span>
              <p className="text-lg font-bold text-white">Rp {totalAmount.toLocaleString("id-ID")}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Milestone Manifests Audit</h3>
            {agreement.milestones.map((m: any, idx: number) => (
              <div key={m.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 flex justify-between items-center text-xs">
                <span>#{idx + 1} {m.title}</span>
                <span className="font-mono text-emerald-400">{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}