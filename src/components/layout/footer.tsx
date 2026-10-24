import React from "react";
import Link from "next/link";
import { Eye, ShieldAlert } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-ink-800 bg-ink-900 mt-auto text-sm text-ivory-400">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gold-500 flex items-center justify-center text-ink-950 font-bold">
                <Eye className="w-4 h-4" />
              </div>
              <span className="font-bold text-ivory-50 tracking-wider">SEATVISION</span>
            </div>
            <p className="text-xs text-ivory-400 leading-relaxed">
              Spatial cinema intelligence and seat discovery. Empowering moviegoers with verified geometry, explainable seat recommendations, and view previews.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-ivory-200 tracking-wider uppercase mb-3 font-mono">
              Discovery
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/movies" className="hover:text-gold-300 transition-colors">
                  Featured Movies
                </Link>
              </li>
              <li>
                <Link href="/discover" className="hover:text-gold-300 transition-colors">
                  Personalized Movie Match
                </Link>
              </li>
              <li>
                <Link href="/experiences" className="hover:text-gold-300 transition-colors">
                  Cinema Format Comparison
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-ivory-200 tracking-wider uppercase mb-3 font-mono">
              Cinema SaaS
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/operators" className="hover:text-gold-300 transition-colors">
                  Operator Portal (Demo)
                </Link>
              </li>
              <li>
                <span className="text-ivory-500">Embeddable Widget (Roadmap)</span>
              </li>
              <li>
                <span className="text-ivory-500">Auditorium Geometry Surveying</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-ivory-200 tracking-wider uppercase mb-3 font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Transparency Note
            </h4>
            <p className="text-xs text-ivory-400 leading-relaxed">
              SeatVision is currently running on a deterministic demo dataset. No live ticketing connection exists, orders do not process payments, and seats are not reserved at actual theatres.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-ink-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ivory-500">
          <p>© 2026 SeatVision Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-ivory-400">
              Stack: Next.js App Router · TypeScript · Strict Domain Model
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
