"use client";

import React from "react";
import Image from "next/image";
import { Columns, X, Check, AlertTriangle, ArrowRight } from "lucide-react";
import type { Auditorium, Seat, ScreeningPricing } from "@/lib/domain/types";
import { seatMetrics } from "@/lib/domain/geometry";
import { formatMoneyOrUnknown, seatPrice } from "@/lib/domain/pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface SeatCompareModalProps {
  auditorium: Auditorium;
  pricing: ScreeningPricing | null;
  seatA: Seat;
  seatB: Seat;
  onClose: () => void;
  onSelectSeat?: (seatId: string) => void;
  selectedSeatIds?: string[];
}

export function SeatCompareModal({
  auditorium,
  pricing,
  seatA,
  seatB,
  onClose,
  onSelectSeat,
  selectedSeatIds = [],
}: SeatCompareModalProps) {
  const metricsA = seatMetrics(auditorium, seatA);
  const metricsB = seatMetrics(auditorium, seatB);
  const priceA = seatPrice(seatA, pricing);
  const priceB = seatPrice(seatB, pricing);

  const isSelectedA = selectedSeatIds.includes(seatA.id);
  const isSelectedB = selectedSeatIds.includes(seatB.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="card bg-ink-900 border-ink-700 w-full max-w-4xl p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-ink-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center border border-gold-500/30">
              <Columns className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ivory-50">Side-by-Side Seat Comparison</h2>
              <p className="text-xs text-ivory-400">
                Comparing Seat {seatA.label} vs Seat {seatB.label} in {auditorium.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ivory-400 hover:text-ivory-100 hover:bg-ink-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Side by side columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Seat A Card */}
          <div className="card bg-ink-850 border-ink-750 p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="eyebrow text-gold-400">Option 1</span>
                <h3 className="text-2xl font-bold text-ivory-50">Seat {seatA.label}</h3>
              </div>
              <Badge variant={seatA.category?.value === "premium" ? "gold" : "secondary"}>
                {seatA.category?.value === "premium" ? "Premium" : "Standard"}
              </Badge>
            </div>

            {/* Simulated mini view thumbnail */}
            <div className="relative w-full h-36 rounded-lg overflow-hidden border border-ink-700 bg-black">
              <Image
                src="/images/hero-auditorium.jpg"
                alt={`Seat ${seatA.label}`}
                fill
                sizes="(max-width: 768px) 50vw, 300px"
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-gold-300 bg-ink-950/80 px-2 py-0.5 rounded border border-ink-700">
                Angle: {metricsA.angleDeg?.toFixed(1) || "?"}°
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-2.5 text-xs text-ivory-300">
              <div className="flex justify-between py-1.5 border-b border-ink-800">
                <span className="text-ivory-400">Ticket Price</span>
                <span className="font-mono font-bold text-ivory-100">
                  {formatMoneyOrUnknown(priceA)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-ink-800">
                <span className="text-ivory-400">Viewing Angle</span>
                <span className="font-mono text-ivory-100 font-semibold">
                  {metricsA.angleDeg !== null ? `${metricsA.angleDeg.toFixed(1)}° off-axis` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-ink-800">
                <span className="text-ivory-400">Distance to Screen</span>
                <span className="font-mono text-ivory-100">
                  {metricsA.distanceM !== null ? `${metricsA.distanceM.toFixed(1)}m` : "N/A"}{" "}
                  <span className="text-ivory-500">
                    ({metricsA.distanceScreenWidths?.toFixed(1)}× screen)
                  </span>
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-ink-800">
                <span className="text-ivory-400">Auditorium Zone</span>
                <span className="capitalize font-mono text-ivory-100">
                  {metricsA.zone || "Middle"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-ivory-400">Known Obstructions</span>
                {seatA.obstruction ? (
                  <span className="text-rose-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {seatA.obstruction.description}
                  </span>
                ) : (
                  <span className="text-sage-400">Clear line of sight</span>
                )}
              </div>
            </div>

            <Button
              variant={isSelectedA ? "secondary" : "gold"}
              className="mt-2 w-full"
              onClick={() => onSelectSeat?.(seatA.id)}
            >
              {isSelectedA ? "Deselect Seat A" : "Choose Seat A"}
            </Button>
          </div>

          {/* Seat B Card */}
          <div className="card bg-ink-850 border-ink-750 p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="eyebrow text-gold-400">Option 2</span>
                <h3 className="text-2xl font-bold text-ivory-50">Seat {seatB.label}</h3>
              </div>
              <Badge variant={seatB.category?.value === "premium" ? "gold" : "secondary"}>
                {seatB.category?.value === "premium" ? "Premium" : "Standard"}
              </Badge>
            </div>

            {/* Simulated mini view thumbnail */}
            <div className="relative w-full h-36 rounded-lg overflow-hidden border border-ink-700 bg-black">
              <Image
                src="/images/hero-auditorium.jpg"
                alt={`Seat ${seatB.label}`}
                fill
                sizes="(max-width: 768px) 50vw, 300px"
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-gold-300 bg-ink-950/80 px-2 py-0.5 rounded border border-ink-700">
                Angle: {metricsB.angleDeg?.toFixed(1) || "?"}°
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-2.5 text-xs text-ivory-300">
              <div className="flex justify-between py-1.5 border-b border-ink-800">
                <span className="text-ivory-400">Ticket Price</span>
                <span className="font-mono font-bold text-ivory-100">
                  {formatMoneyOrUnknown(priceB)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-ink-800">
                <span className="text-ivory-400">Viewing Angle</span>
                <span className="font-mono text-ivory-100 font-semibold">
                  {metricsB.angleDeg !== null ? `${metricsB.angleDeg.toFixed(1)}° off-axis` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-ink-800">
                <span className="text-ivory-400">Distance to Screen</span>
                <span className="font-mono text-ivory-100">
                  {metricsB.distanceM !== null ? `${metricsB.distanceM.toFixed(1)}m` : "N/A"}{" "}
                  <span className="text-ivory-500">
                    ({metricsB.distanceScreenWidths?.toFixed(1)}× screen)
                  </span>
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-ink-800">
                <span className="text-ivory-400">Auditorium Zone</span>
                <span className="capitalize font-mono text-ivory-100">
                  {metricsB.zone || "Middle"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-ivory-400">Known Obstructions</span>
                {seatB.obstruction ? (
                  <span className="text-rose-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {seatB.obstruction.description}
                  </span>
                ) : (
                  <span className="text-sage-400">Clear line of sight</span>
                )}
              </div>
            </div>

            <Button
              variant={isSelectedB ? "secondary" : "gold"}
              className="mt-2 w-full"
              onClick={() => onSelectSeat?.(seatB.id)}
            >
              {isSelectedB ? "Deselect Seat B" : "Choose Seat B"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
