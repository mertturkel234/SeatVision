import React from "react";

export function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-3 px-4 rounded-xl bg-ink-900/90 border border-ink-800 text-xs text-ivory-300">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-ink-700 border border-ink-500" />
        <span>Standard Available</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-amber-900/60 border border-gold-500/60 ring-1 ring-gold-500/30" />
        <span>Premium / Recliner</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-gold-400 border border-gold-200 text-ink-950 flex items-center justify-center font-bold text-[9px]">
          ✓
        </div>
        <span>Selected</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-ink-800 border border-ink-700/50 opacity-40 cursor-not-allowed" />
        <span>Sold / Blocked</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-sky-950 border border-sky-400/50 flex items-center justify-center text-[9px] text-sky-300">
          ♿
        </div>
        <span>Accessible Space</span>
      </div>
    </div>
  );
}
