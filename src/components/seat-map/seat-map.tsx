"use client";

import React, { useMemo } from "react";
import type { Auditorium, ScreeningAvailability, ScreeningPricing, Seat } from "@/lib/domain/types";
import { seatPrice, formatMoneyOrUnknown } from "@/lib/domain/pricing";
import { cn } from "@/lib/cn";

export interface SeatMapProps {
  auditorium: Auditorium;
  availability: ScreeningAvailability | null;
  pricing: ScreeningPricing | null;
  selectedSeatIds: string[];
  focusedSeatId?: string | null;
  highlightedSeatIds?: string[];
  onSelectSeat: (seatId: string) => void;
  onHoverSeat?: (seat: Seat | null) => void;
  compareMode?: boolean;
}

export function SeatMap({
  auditorium,
  availability,
  pricing,
  selectedSeatIds,
  focusedSeatId,
  highlightedSeatIds = [],
  onSelectSeat,
  onHoverSeat,
}: SeatMapProps) {
  const seats = auditorium.seats;

  // Compute bounding box for responsive SVG layout
  const bounds = useMemo(() => {
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;

    seats.forEach((seat) => {
      if (seat.position) {
        if (seat.position.x < minX) minX = seat.position.x;
        if (seat.position.x > maxX) maxX = seat.position.x;
        if (seat.position.y < minY) minY = seat.position.y;
        if (seat.position.y > maxY) maxY = seat.position.y;
      }
    });

    const screenWidth = auditorium.geometry.screen?.widthM ?? 12;
    minX = Math.min(minX, -screenWidth / 2) - 1.2;
    maxX = Math.max(maxX, screenWidth / 2) + 1.2;
    minY = Math.min(minY, 0) - 1.5;
    maxY = maxY + 1.5;

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [seats, auditorium.geometry.screen]);

  // Group seats by row to render row labels
  const rows = useMemo(() => {
    const map = new Map<string, Seat[]>();
    auditorium.geometry.rowOrder.forEach((r) => map.set(r, []));
    seats.forEach((s) => {
      const list = map.get(s.row);
      if (list) list.push(s);
      else map.set(s.row, [s]);
    });
    return Array.from(map.entries()).map(([rowLabel, rowSeats]) => {
      const sorted = [...rowSeats].sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const avgY =
        sorted.reduce((acc, s) => acc + (s.position?.y ?? 0), 0) / (sorted.length || 1);
      return {
        label: rowLabel,
        seats: sorted,
        leftX: (first?.position?.x ?? 0) - 0.7,
        rightX: (last?.position?.x ?? 0) + 0.7,
        avgY,
      };
    });
  }, [seats, auditorium.geometry.rowOrder]);

  const screenWidth = auditorium.geometry.screen?.widthM ?? 12;

  return (
    <div className="w-full flex flex-col items-center select-none overflow-x-auto pb-4">
      {/* Screen banner */}
      <div className="w-full max-w-2xl flex flex-col items-center mb-6">
        <div className="relative w-full h-10 flex items-center justify-center">
          <svg className="w-full h-full overflow-visible" viewBox="-150 0 300 30">
            <path
              d="M -140 25 Q 0 5 140 25"
              fill="none"
              stroke="url(#screen-glow)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="screen-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8f7142" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#d1b076" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#8f7142" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute top-2 text-[10px] tracking-[0.3em] font-mono uppercase text-gold-300 font-semibold">
            Cinema Screen · {screenWidth}m
          </span>
        </div>
        <div className="text-[11px] text-ivory-500 font-mono -mt-1">
          Soundstage & Front Projection
        </div>
      </div>

      {/* SVG Seating Chart */}
      <div className="w-full max-w-4xl relative min-w-[340px]">
        <svg
          viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
          className="w-full h-auto overflow-visible"
        >
          {/* Row Labels (Left and Right) */}
          {rows.map((r) => (
            <g key={`labels-${r.label}`}>
              <text
                x={r.leftX}
                y={r.avgY + 0.12}
                textAnchor="end"
                className="fill-ivory-400 text-[0.45px] font-mono font-medium"
              >
                {r.label}
              </text>
              <text
                x={r.rightX}
                y={r.avgY + 0.12}
                textAnchor="start"
                className="fill-ivory-400 text-[0.45px] font-mono font-medium"
              >
                {r.label}
              </text>
            </g>
          ))}

          {/* Seats */}
          {seats.map((seat) => {
            if (!seat.position) return null;

            const isSelected = selectedSeatIds.includes(seat.id);
            const isFocused = focusedSeatId === seat.id;
            const isHighlighted = highlightedSeatIds.includes(seat.id);
            const status = availability?.statuses[seat.id] ?? "available";
            const isUnavailable = status !== "available";
            const isWheelchair = seat.kind === "wheelchair-space";
            const isPremium =
              seat.category?.value === "premium" || seat.category?.value === "recliner";
            const price = seatPrice(seat, pricing);

            // Styling determination
            let fillColor = "#27272b"; // standard available
            let strokeColor = "#4a4a52";
            let strokeWidth = 0.04;

            if (isPremium) {
              fillColor = "#3d2d14"; // warm dark amber
              strokeColor = "#b8955a";
            }
            if (isWheelchair) {
              fillColor = "#0d2b38";
              strokeColor = "#38bdf8";
            }
            if (isUnavailable) {
              fillColor = "#161618";
              strokeColor = "#27272b";
            }
            if (isHighlighted) {
              fillColor = "#78581e";
              strokeColor = "#ecdcb6";
              strokeWidth = 0.08;
            }
            if (isSelected) {
              fillColor = "#d1b076"; // champagne gold
              strokeColor = "#f7f2e8";
              strokeWidth = 0.09;
            }

            const seatWidth = isPremium ? 0.6 : 0.44;
            const seatHeight = isPremium ? 0.5 : 0.4;
            const x = seat.position.x - seatWidth / 2;
            const y = seat.position.y - seatHeight / 2;

            return (
              <g
                key={seat.id}
                tabIndex={isUnavailable ? -1 : 0}
                role="button"
                aria-label={`Seat ${seat.label}, ${isPremium ? "Premium, " : ""}${
                  formatMoneyOrUnknown(price)
                }, ${status}`}
                className={cn(
                  "cursor-pointer outline-none transition-all duration-150 group",
                  isUnavailable && "cursor-not-allowed opacity-30 pointer-events-none"
                )}
                onClick={() => {
                  if (!isUnavailable) onSelectSeat(seat.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!isUnavailable) onSelectSeat(seat.id);
                  }
                }}
                onMouseEnter={() => onHoverSeat?.(seat)}
                onMouseLeave={() => onHoverSeat?.(null)}
              >
                {/* Visual focus / highlight halo */}
                {(isFocused || isSelected) && (
                  <rect
                    x={x - 0.06}
                    y={y - 0.06}
                    width={seatWidth + 0.12}
                    height={seatHeight + 0.12}
                    rx={0.14}
                    fill="none"
                    stroke="#d1b076"
                    strokeWidth={0.04}
                    strokeDasharray={isFocused && !isSelected ? "0.1, 0.05" : undefined}
                  />
                )}

                {/* Seat Cushion Body */}
                <rect
                  x={x}
                  y={y}
                  width={seatWidth}
                  height={seatHeight}
                  rx={0.08}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="transition-colors group-hover:brightness-125"
                />

                {/* Seat Headrest / Top Accent */}
                <rect
                  x={x + 0.05}
                  y={y}
                  width={seatWidth - 0.1}
                  height={0.1}
                  rx={0.04}
                  fill={isSelected ? "#0a0a0b" : strokeColor}
                  opacity={0.6}
                />

                {/* Seat Label */}
                <text
                  x={seat.position.x}
                  y={seat.position.y + 0.07}
                  textAnchor="middle"
                  className={cn(
                    "text-[0.22px] font-mono font-medium pointer-events-none select-none",
                    isSelected ? "fill-ink-950 font-bold" : "fill-ivory-300"
                  )}
                >
                  {isWheelchair ? "♿" : seat.number}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
