import React from "react";
import Link from "next/link";
import { Eye, Film, Sparkles, Building2, SlidersHorizontal } from "lucide-react";
import { CartBadge } from "@/components/cart/cart-badge";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-ink-800 bg-ink-950/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-ink-950 shadow-md group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-wider text-ivory-50 flex items-center gap-1.5">
                SEAT<span className="text-gold-400">VISION</span>
              </span>
              <span className="text-[10px] text-ivory-400 uppercase tracking-widest -mt-1 font-mono">
                Cinema Intelligence
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-ivory-300">
            <Link
              href="/movies"
              className="px-3 py-1.5 rounded-md hover:text-ivory-50 hover:bg-ink-800/60 transition-colors flex items-center gap-1.5"
            >
              <Film className="w-4 h-4 text-gold-400/80" />
              Movies
            </Link>
            <Link
              href="/discover"
              className="px-3 py-1.5 rounded-md hover:text-ivory-50 hover:bg-ink-800/60 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-gold-400/80" />
              Discover
            </Link>
            <Link
              href="/experiences"
              className="px-3 py-1.5 rounded-md hover:text-ivory-50 hover:bg-ink-800/60 transition-colors flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4 text-gold-400/80" />
              Experiences
            </Link>
            <Link
              href="/operators"
              className="px-3 py-1.5 rounded-md hover:text-ivory-50 hover:bg-ink-800/60 transition-colors flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4 text-gold-400/80" />
              Operators <span className="text-[10px] uppercase text-gold-400/90 font-mono">(B2B)</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="warning" className="hidden sm:inline-flex text-[11px]">
            Demo Platform
          </Badge>
          <CartBadge />
        </div>
      </div>
    </header>
  );
}
