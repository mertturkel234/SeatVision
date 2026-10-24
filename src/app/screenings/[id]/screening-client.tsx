"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Film,
  Calendar,
  Clock,
  Eye,
  Columns,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Info,
  Box,
  Grid3X3,
} from "lucide-react";
import type { Seat } from "@/lib/domain/types";
import type { ScreeningBundle } from "@/lib/data/repository";
import { formatDay, formatTime, formatDuration, FORMAT_SHORT } from "@/lib/format";
import { seatPrice, formatMoneyOrUnknown, sumKnownMoney } from "@/lib/domain/pricing";
import { cn } from "@/lib/cn";
import { SeatMap } from "@/components/seat-map/seat-map";
import { SeatMap3DContainer } from "@/components/seat-map-3d";
import { SeatLegend } from "@/components/seat-map/seat-legend";
import { ViewFromSeat } from "@/components/preview/view-from-seat";
import { SeatCompareModal } from "@/components/seat-map/seat-compare-drawer";
import { SeatMatchPanel } from "@/components/seatmatch/seatmatch-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataBadge } from "@/components/ui/data-badge";

export function ScreeningClient({ bundle }: { bundle: ScreeningBundle }) {
  const router = useRouter();
  const { screening, movie, cinema, auditorium, availability, pricing } = bundle;

  // Selected seats for checkout
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  // Seat currently opened in the View-From-Seat preview drawer/panel
  const [previewSeat, setPreviewSeat] = useState<Seat | null>(null);
  // Compare seats modal state
  const [compareSeats, setCompareSeats] = useState<{ seatA: Seat; seatB: Seat } | null>(null);
  // Seats highlighted temporarily (e.g. hovering over a SeatMatch card)
  const [highlightedSeatIds, setHighlightedSeatIds] = useState<string[]>([]);
  // View mode: 3D interactive auditorium or 2D seating chart fallback
  const [viewMode, setViewMode] = useState<"3D" | "2D">("3D");

  // Restore existing selections from session storage if any
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("seatvision_cart");
      if (stored) {
        const cart = JSON.parse(stored);
        if (cart.screeningId === screening.id && Array.isArray(cart.seatIds)) {
          setSelectedSeatIds(cart.seatIds);
        }
      }
    } catch {}
  }, [screening.id]);

  // Sync to session storage and fire event for CartBadge
  const saveCart = (newSeatIds: string[]) => {
    setSelectedSeatIds(newSeatIds);
    try {
      const currentCartStr = sessionStorage.getItem("seatvision_cart");
      const currentCart = currentCartStr ? JSON.parse(currentCartStr) : {};
      const concessions = currentCart.screeningId === screening.id ? currentCart.concessions || {} : {};

      const updated = {
        screeningId: screening.id,
        seatIds: newSeatIds,
        concessions,
      };
      sessionStorage.setItem("seatvision_cart", JSON.stringify(updated));
      const totalCount =
        newSeatIds.length +
        Object.values(concessions).reduce(
          (acc: number, q: unknown) => acc + (typeof q === "number" ? q : 0),
          0
        );
      sessionStorage.setItem("seatvision_cart_count", totalCount.toString());
      window.dispatchEvent(new Event("seatvision_cart_updated"));
    } catch {}
  };

  const handleSelectSeat = (seatId: string) => {
    const seat = auditorium.seats.find((s: Seat) => s.id === seatId);
    if (!seat) return;

    // Toggle seat selection
    let next: string[];
    if (selectedSeatIds.includes(seatId)) {
      next = selectedSeatIds.filter((id) => id !== seatId);
    } else {
      next = [...selectedSeatIds, seatId];
    }
    saveCart(next);
    // Also open preview for the clicked seat
    setPreviewSeat(seat);
  };

  const handleApplyRecommendation = (seatIds: string[]) => {
    saveCart(seatIds);
    const first = auditorium.seats.find((s: Seat) => s.id === seatIds[0]);
    if (first) setPreviewSeat(first);
  };

  const handleStartCompare = (seatA: Seat) => {
    // If there's another selected seat, pick it. Otherwise pick a neighbor.
    const otherId = selectedSeatIds.find((id) => id !== seatA.id);
    let otherSeat: Seat | undefined;
    if (otherId) {
      otherSeat = auditorium.seats.find((s: Seat) => s.id === otherId);
    }
    if (!otherSeat) {
      // Pick adjacent or nearest available
      otherSeat = auditorium.seats.find(
        (s: Seat) =>
          s.id !== seatA.id &&
          s.row === seatA.row &&
          availability?.statuses[s.id] === "available"
      );
    }
    if (!otherSeat) {
      otherSeat = auditorium.seats.find(
        (s: Seat) => s.id !== seatA.id && availability?.statuses[s.id] === "available"
      );
    }
    if (otherSeat) {
      setCompareSeats({ seatA, seatB: otherSeat });
    }
  };

  // Calculate pricing total for selected seats
  const selectedSeats = auditorium.seats.filter((s: Seat) => selectedSeatIds.includes(s.id));
  const prices = selectedSeats.map((s: Seat) => seatPrice(s, pricing));
  const total = sumKnownMoney(prices);

  return (
    <div className="container-page py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-ivory-400">
        <Link href="/" className="hover:text-gold-300">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/movies" className="hover:text-gold-300">
          Movies
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/movies/${movie.slug}`} className="hover:text-gold-300">
          {movie.title}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-ivory-200 font-medium">Select Seats</span>
      </nav>

      {/* Screening Header Info Banner */}
      <div className="card bg-ink-900 border-ink-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="gold">{FORMAT_SHORT[screening.format]}</Badge>
            <span className="text-xs text-ivory-400 font-mono">{screening.language}</span>
            {screening.subtitles && (
              <span className="text-xs text-ivory-500 font-mono">({screening.subtitles} Sub)</span>
            )}
            <DataBadge source={screening.provenance.source} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-ivory-50 flex items-center gap-2">
            {movie.title}
          </h1>

          <div className="flex items-center gap-4 mt-2 text-xs text-ivory-300 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-gold-400" />
              {cinema.name} · {auditorium.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gold-400" />
              {formatDay(screening.startsAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold-400" />
              {formatTime(screening.startsAt)} ({formatDuration(movie.durationMinutes)})
            </span>
          </div>
        </div>

        {/* Selected Seats summary action */}
        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-ink-800 pt-4 md:pt-0 md:pl-6">
          <div className="text-right">
            <span className="text-xs text-ivory-400 block">
              {selectedSeatIds.length} {selectedSeatIds.length === 1 ? "seat" : "seats"} selected
            </span>
            <span className="text-lg font-bold text-ivory-50 font-mono">
              {total ? formatMoneyOrUnknown(total) : "Free / Select seats"}
            </span>
          </div>

          <Button
            variant="gold"
            size="md"
            disabled={selectedSeatIds.length === 0}
            onClick={() => router.push(`/cart`)}
            className="whitespace-nowrap"
          >
            <ShoppingBag className="w-4 h-4 mr-1.5" />
            Continue to Cart
          </Button>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left/Center) + Smart Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Map and Preview Drawer */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Seating Map Card */}
          <div className="card bg-ink-900 border-ink-800 p-6 flex flex-col items-center shadow-xl space-y-4">
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-ivory-100 flex items-center gap-2">
                  <span>Interactive Auditorium</span>
                  <Badge variant="gold" className="text-[10px]">
                    {viewMode === "3D" ? "3D Spatial Engine" : "2D Chart"}
                  </Badge>
                </h3>
                <p className="text-[11px] text-ivory-400">
                  {viewMode === "3D"
                    ? "Orbit, zoom, and click individual 3D cinema seats to inspect sightlines."
                    : "Select a seat to inspect geometry and view angle preview."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* 2D / 3D Mode Switch Pill */}
                <div className="flex items-center gap-1 bg-ink-850 p-1 rounded-xl border border-ink-750 text-xs">
                  <button
                    onClick={() => setViewMode("3D")}
                    className={cn(
                      "px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5",
                      viewMode === "3D"
                        ? "bg-gold-500 text-ink-950 font-bold shadow-sm"
                        : "text-ivory-300 hover:text-ivory-100 hover:bg-ink-800"
                    )}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>3D View</span>
                  </button>

                  <button
                    onClick={() => setViewMode("2D")}
                    className={cn(
                      "px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5",
                      viewMode === "2D"
                        ? "bg-gold-500 text-ink-950 font-bold shadow-sm"
                        : "text-ivory-300 hover:text-ivory-100 hover:bg-ink-800"
                    )}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                    <span>2D Map</span>
                  </button>
                </div>

                {selectedSeatIds.length > 0 && (
                  <button
                    onClick={() => saveCart([])}
                    className="text-xs text-ivory-400 hover:text-gold-300 flex items-center gap-1 transition-colors pl-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Map Display: 3D Scene or 2D Chart */}
            <div className="w-full">
              {viewMode === "3D" ? (
                <SeatMap3DContainer
                  auditorium={auditorium}
                  availability={availability}
                  pricing={pricing}
                  selectedSeatIds={selectedSeatIds}
                  focusedSeatId={previewSeat?.id}
                  highlightedSeatIds={highlightedSeatIds}
                  onSelectSeat={handleSelectSeat}
                  onRequestViewFromSeat={(seat) => setPreviewSeat(seat)}
                  onFallbackTo2D={() => setViewMode("2D")}
                />
              ) : (
                <SeatMap
                  auditorium={auditorium}
                  availability={availability}
                  pricing={pricing}
                  selectedSeatIds={selectedSeatIds}
                  focusedSeatId={previewSeat?.id}
                  highlightedSeatIds={highlightedSeatIds}
                  onSelectSeat={handleSelectSeat}
                />
              )}
            </div>

            <SeatLegend />
          </div>

          {/* Seat View Preview Panel (Shown when a seat is chosen) */}
          {previewSeat && (
            <ViewFromSeat
              auditorium={auditorium}
              pricing={pricing}
              seat={previewSeat}
              isSelected={selectedSeatIds.includes(previewSeat.id)}
              onClose={() => setPreviewSeat(null)}
              onToggleSelect={handleSelectSeat}
              onStartCompare={handleStartCompare}
              onNavigateSeat={(seatId) => {
                const target = auditorium.seats.find((s: Seat) => s.id === seatId);
                if (target) setPreviewSeat(target);
              }}
            />
          )}
        </div>

        {/* Right Column: SeatMatch AI Panel */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <SeatMatchPanel
            auditorium={auditorium}
            availability={availability}
            pricing={pricing}
            onApplyRecommendation={handleApplyRecommendation}
            onHighlightSeats={setHighlightedSeatIds}
          />
        </div>
      </div>

      {/* Compare Seats Modal */}
      {compareSeats && (
        <SeatCompareModal
          auditorium={auditorium}
          pricing={pricing}
          seatA={compareSeats.seatA}
          seatB={compareSeats.seatB}
          selectedSeatIds={selectedSeatIds}
          onSelectSeat={handleSelectSeat}
          onClose={() => setCompareSeats(null)}
        />
      )}
    </div>
  );
}
