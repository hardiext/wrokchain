import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#08090c]/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-sans font-bold text-xl tracking-tight text-white">
          WROKCHAIN
        </Link>
        <div className="font-mono text-sm px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-emerald-400">
          0x71C...a1B2
        </div>
      </div>
    </header>
  );
}
