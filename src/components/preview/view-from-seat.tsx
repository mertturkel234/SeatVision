"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Compass,
  Maximize2,
  Columns,
  Sparkles,
} from "lucide-react";
import type { Auditorium, Seat } from "@/lib/domain/types";
import { seatMetrics } from "@/lib/domain/geometry";
import { formatMoneyOrUnknown, seatPrice } from "@/lib/domain/pricing";
import type { ScreeningPricing } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataBadge } from "@/components/ui/data-badge";

export interface ViewFromSeatProps {
  auditorium: Auditorium;
  pricing: ScreeningPricing | null;
  seat: Seat;
  onClose?: () => void;
  onNavigateSeat?: (seatId: string) => void;
  onStartCompare?: (seat: Seat) => void;
  onToggleSelect?: (seatId: string) => void;
  isSelected?: boolean;
}

export function ViewFromSeat({
  auditorium,
  pricing,
  seat,
  onClose,
  onNavigateSeat,
  onStartCompare,
  onToggleSelect,
  isSelected,
}: ViewFromSeatProps) {
  const metrics = seatMetrics(auditorium, seat);
  const price = seatPrice(seat, pricing);

  // Panorama drag interaction state
  const [panX, setPanX] = useState<number>(0);
  const isDragging = useRef<boolean>(false);
  const dragStartX = useRef<number>(0);
  const currentPanRef = useRef<number>(0);

  // Set initial pan based on the seat's viewing angle!
  // If the seat is on the left (negative x), user naturally faces slightly right towards center.
  useEffect(() => {
    const baseOffset = (metrics.angleDeg || 0) * (seat.position && seat.position.x < 0 ? 3 : -3);
    setPanX(baseOffset);
    currentPanRef.current = baseOffset;
  }, [seat.id, metrics.angleDeg, seat.position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX - currentPanRef.current;
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const newPan = Math.max(-120, Math.min(120, e.clientX - dragStartX.current));
    currentPanRef.current = newPan;
    setPanX(newPan);
  }, []);

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Find left and right neighbors for quick navigation
  const sortedRowSeats = auditorium.seats
    .filter((s) => s.row === seat.row)
    .sort((a, b) => a.number - b.number);
  const currentIndex = sortedRowSeats.findIndex((s) => s.id === seat.id);
  const prevSeat = currentIndex > 0 ? sortedRowSeats[currentIndex - 1] : null;
  const nextSeat =
    currentIndex < sortedRowSeats.length - 1 ? sortedRowSeats[currentIndex + 1] : null;

  // Perspective simulation calculations
  // Distance scaling factor (closer = larger screen, farther = smaller screen)
  const distWidths = metrics.distanceScreenWidths || 1.4;
  const scale = Math.max(0.75, Math.min(1.4, 1.8 / distWidths));
  const lateralShift = ((metrics.lateralOffsetM || 0) / (auditorium.geometry.screen?.widthM || 12)) * 60;

  return (
    <div className="card bg-ink-900 border-ink-800 p-5 flex flex-col gap-5 shadow-2xl">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 border-b border-ink-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow">Seat Preview</span>
            <Badge variant={seat.category?.value === "premium" ? "gold" : "secondary"}>
              {seat.category?.value === "premium"
                ? "Verified Premium"
                : seat.category?.value === "recliner"
                ? "Recliner"
                : "Standard"}
            </Badge>
            <DataBadge source="demo" label="Simulated Sightline" />
          </div>
          <h2 className="text-2xl font-bold text-ivory-50 flex items-center gap-2">
            Seat {seat.label}
            <span className="text-sm font-normal text-ivory-400 font-mono">
              ({formatMoneyOrUnknown(price)})
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onStartCompare && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStartCompare(seat)}
              title="Compare with another seat"
            >
              <Columns className="w-3.5 h-3.5 mr-1" />
              Compare
            </Button>
          )}
          {onToggleSelect && (
            <Button
              variant={isSelected ? "secondary" : "gold"}
              size="sm"
              onClick={() => onToggleSelect(seat.id)}
            >
              {isSelected ? "Remove Seat" : "Select Seat"}
            </Button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-ivory-400 hover:text-ivory-100 p-1.5 rounded-lg hover:bg-ink-800 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Panorama Simulation Window */}
      <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden bg-black border border-ink-700/80 group select-none">
        {/* Verified vs Simulated Disclaimer Watermark */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-ink-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono border border-ink-700 text-ivory-300">
          <Eye className="w-3.5 h-3.5 text-gold-400" />
          <span>Simulated 3D Perspective (Demo)</span>
        </div>

        <div className="absolute top-3 right-3 z-20 bg-ink-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono border border-ink-700 text-ivory-300 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-gold-400" />
          <span>Drag to pan view</span>
        </div>

        {/* Interactive Viewport */}
        <div
          className="relative w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Background Auditorium Environment Image with Dynamic Perspective Transform */}
          <div
            className="absolute inset-0 transition-transform duration-75 ease-out flex items-center justify-center pointer-events-none"
            style={{
              transform: `scale(${scale * 1.15}) translate(${panX - lateralShift}px, ${
                metrics.zone === "front" ? 40 : metrics.zone === "rear" ? -30 : 0
              }px)`,
            }}
          >
            <Image
              src="/images/hero-auditorium.jpg"
              alt={`View from seat ${seat.label}`}
              fill
              sizes="(max-width: 1024px) 100vw, 800px"
              className="object-cover brightness-95 contrast-105"
              priority
            />
          </div>

          {/* Screen Sightline Overlay Grid */}
          <div className="absolute inset-0 pointer-events-none border border-gold-500/10" />

          {/* Simulated Screen Outline Reticle */}
          <div
            className="relative pointer-events-none transition-transform duration-75 border-2 border-dashed border-gold-400/40 rounded-lg p-2 flex items-center justify-center shadow-[0_0_50px_rgba(209,176,118,0.15)]"
            style={{
              width: `${Math.min(90, 60 * scale)}%`,
              height: `${Math.min(80, 50 * scale)}%`,
              transform: `translate(${panX * 0.4}px, 0)`,
            }}
          >
            <div className="absolute inset-0 bg-gold-400/5 backdrop-blur-[0.5px] rounded" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold-300 font-semibold bg-ink-950/80 px-2 py-0.5 rounded border border-gold-500/30">
              Screen Target ({metrics.fieldOfViewDeg?.toFixed(0) || 45}° FOV)
            </span>
          </div>
        </div>

        {/* Quick Row Seat Navigation Controls */}
        <div className="absolute bottom-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
          {prevSeat ? (
            <button
              onClick={() => onNavigateSeat?.(prevSeat.id)}
              className="pointer-events-auto bg-ink-900/90 hover:bg-ink-800 text-ivory-200 px-3 py-1.5 rounded-lg border border-ink-700 text-xs flex items-center gap-1.5 backdrop-blur-md transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Seat {prevSeat.label}</span>
            </button>
          ) : (
            <div />
          )}

          <span className="bg-ink-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-ivory-300 border border-ink-800">
            Row {seat.row} · {seat.number} of {sortedRowSeats.length}
          </span>

          {nextSeat ? (
            <button
              onClick={() => onNavigateSeat?.(nextSeat.id)}
              className="pointer-events-auto bg-ink-900/90 hover:bg-ink-800 text-ivory-200 px-3 py-1.5 rounded-lg border border-ink-700 text-xs flex items-center gap-1.5 backdrop-blur-md transition-colors"
            >
              <span>Seat {nextSeat.label}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Obstruction Warning Notice (if any) */}
      {seat.obstruction && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3.5 flex items-start gap-3 text-rose-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-300 mb-0.5 flex items-center gap-1.5">
              <span>Known Sightline Obstruction</span>
              <Badge variant="danger" className="text-[10px]">
                {seat.obstruction.verified ? "Operator Verified" : "Reported"}
              </Badge>
            </div>
            <p className="leading-relaxed">{seat.obstruction.description}</p>
          </div>
        </div>
      )}

      {/* Verified Spatial Geometry Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="card bg-ink-850 p-3 flex flex-col gap-1 border-ink-800">
          <span className="text-ivory-400 text-[11px]">Viewing Angle</span>
          <span className="text-base font-bold text-ivory-100 font-mono">
            {metrics.angleDeg !== null ? `${metrics.angleDeg.toFixed(1)}°` : "Unavailable"}
          </span>
          <span className="text-[10px] text-ivory-500">
            {metrics.angleDeg !== null && metrics.angleDeg < 8
              ? "Optimal centreline"
              : "Off-axis sightline"}
          </span>
        </div>

        <div className="card bg-ink-850 p-3 flex flex-col gap-1 border-ink-800">
          <span className="text-ivory-400 text-[11px]">Distance to Screen</span>
          <span className="text-base font-bold text-ivory-100 font-mono">
            {metrics.distanceM !== null ? `${metrics.distanceM.toFixed(1)}m` : "Unavailable"}
          </span>
          <span className="text-[10px] text-ivory-500 font-mono">
            {metrics.distanceScreenWidths !== null
              ? `~${metrics.distanceScreenWidths.toFixed(1)}× screen width`
              : "Geometry unmeasured"}
          </span>
        </div>

        <div className="card bg-ink-850 p-3 flex flex-col gap-1 border-ink-800">
          <span className="text-ivory-400 text-[11px]">Auditorium Zone</span>
          <span className="text-base font-bold text-ivory-100 font-mono capitalize">
            {metrics.zone || "Middle"}
          </span>
          <span className="text-[10px] text-ivory-500">
            Row {seat.row} of {auditorium.geometry.rowOrder.length}
          </span>
        </div>

        <div className="card bg-ink-850 p-3 flex flex-col gap-1 border-ink-800">
          <span className="text-ivory-400 text-[11px]">Data Provenance</span>
          <span className="text-base font-bold text-gold-300 font-mono capitalize">
            {metrics.basis}
          </span>
          <span className="text-[10px] text-ivory-500">
            {auditorium.geometry.positionMethod === "surveyed"
              ? "Laser/architect plan"
              : "Estimated blueprint"}
          </span>
        </div>
      </div>
    </div>
  );
}
