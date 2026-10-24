"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Ticket,
  Calendar,
  Clock,
  Film,
  Building2,
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Share2,
} from "lucide-react";
import type { DemoOrder } from "@/lib/domain/cart";
import { parseStoredOrder, demoCodePattern } from "@/lib/domain/cart";
import { formatDay, formatTime, formatDateLong } from "@/lib/format";
import { formatMoneyOrUnknown } from "@/lib/domain/pricing";
import { movies, cinemas, auditoriums, screenings } from "@/lib/data/demo/dataset";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TicketClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("seatvision_last_order");
      if (stored) {
        const parsed = parseStoredOrder(JSON.parse(stored));
        if (parsed && (parsed.id === orderId || orderId === "demo")) {
          setOrder(parsed);
        }
      }
    } catch {}
    setIsLoaded(false);
    setIsLoaded(true);
  }, [orderId]);

  // If no order is stored in session (e.g. direct link), create a dummy fallback for preview
  const screening = screenings.find((s) => s.id === order?.screeningId) ?? screenings[0];
  const movie = movies.find((m) => m.id === screening?.movieId) ?? movies[0];
  const cinema = cinemas.find((c) => c.id === screening?.cinemaId) ?? cinemas[0];
  const auditorium = auditoriums.find((a) => a.id === screening?.auditoriumId) ?? auditoriums[0];

  const grid = demoCodePattern(orderId || "SEATVISION");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container-page py-10 max-w-2xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/"
          className="text-xs text-ivory-400 hover:text-gold-300 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to SeatVision
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5 mr-1" />
            Print Ticket
          </Button>
        </div>
      </div>

      {/* Confirmation Message */}
      <div className="text-center space-y-2 no-print">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-ivory-50">Demo Booking Confirmed</h1>
        <p className="text-xs text-ivory-400">
          Here is your digital ticket preview for order <span className="font-mono text-gold-400">{order?.id || orderId}</span>.
        </p>
      </div>

      {/* Cinematic Digital Ticket Card */}
      <div className="card bg-ink-900 border-ink-750 overflow-hidden shadow-2xl relative">
        {/* Ticket Top: Movie Key Art Header */}
        <div className="relative w-full h-48 sm:h-56 bg-black">
          {movie.posterUrl && (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              className="object-cover opacity-60 brightness-90"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />

          {/* Film badge and Title Overlay */}
          <div className="absolute bottom-4 inset-x-6">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="gold">Digital Cinema Pass</Badge>
              <Badge variant="warning">DEMO CODE — NOT VALID FOR ENTRY</Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ivory-50 drop-shadow-md">
              {movie.title}
            </h2>
          </div>
        </div>

        {/* Ticket Details Body */}
        <div className="p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-y border-ink-800 text-xs">
            <div>
              <span className="text-[11px] text-ivory-500 font-mono uppercase block">Cinema</span>
              <span className="font-bold text-ivory-100">{cinema.name}</span>
            </div>
            <div>
              <span className="text-[11px] text-ivory-500 font-mono uppercase block">Hall</span>
              <span className="font-bold text-ivory-100">{auditorium.name}</span>
            </div>
            <div>
              <span className="text-[11px] text-ivory-500 font-mono uppercase block">Date</span>
              <span className="font-bold text-ivory-100 font-mono">
                {formatDay(screening.startsAt)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-ivory-500 font-mono uppercase block">Showtime</span>
              <span className="font-bold text-gold-300 font-mono text-sm">
                {formatTime(screening.startsAt)}
              </span>
            </div>
          </div>

          {/* Reserved Seats Highlight */}
          <div className="bg-ink-850 p-4 rounded-xl border border-ink-750 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-ivory-400 font-mono uppercase block">
                Selected Seats
              </span>
              <div className="text-xl font-extrabold text-gold-300 font-mono mt-0.5 tracking-wider">
                {order
                  ? order.tickets.map((t) => t.seatLabel).join(", ")
                  : "Row F · Seats 7, 8"}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-ivory-400 font-mono uppercase block">
                Total Paid (Demo)
              </span>
              <div className="text-lg font-bold text-ivory-100 font-mono">
                {order ? formatMoneyOrUnknown(order.total) : "TRY 320.00"}
              </div>
            </div>
          </div>

          {/* Concessions (if any) */}
          {order && order.concessions.length > 0 && (
            <div className="space-y-2 text-xs">
              <span className="text-[11px] text-ivory-400 font-mono uppercase block">
                Pre-ordered Concessions
              </span>
              <div className="divide-y divide-ink-800 bg-ink-850 rounded-xl p-3 border border-ink-800">
                {order.concessions.map((c) => (
                  <div key={c.productId} className="py-1.5 flex justify-between text-ivory-200">
                    <span>
                      {c.quantity}× {c.name}
                    </span>
                    <span className="font-mono text-ivory-400">
                      {formatMoneyOrUnknown(c.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simulated QR Code & Tear-off separator */}
          <div className="relative pt-6 border-t border-dashed border-ink-700 flex flex-col items-center text-center space-y-3">
            {/* Notch cutouts on edges for ticket effect */}
            <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-ink-950" />
            <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-ink-950" />

            {/* Generated Decorative QR Code Matrix */}
            <div className="p-3 bg-white rounded-xl shadow-inner inline-block">
              <div
                className="grid gap-0.5"
                style={{
                  gridTemplateColumns: `repeat(${grid.length}, 4px)`,
                  gridTemplateRows: `repeat(${grid.length}, 4px)`,
                }}
              >
                {grid.map((row, y) =>
                  row.map((active, x) => (
                    <div
                      key={`${x}-${y}`}
                      className={active ? "bg-black" : "bg-transparent"}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-xs font-bold tracking-widest text-ivory-200 uppercase">
                {order?.id || orderId}
              </span>
              <div className="text-[10px] text-rose-300 font-mono max-w-sm flex items-center justify-center gap-1.5 mx-auto bg-rose-950/40 py-1 px-3 rounded-full border border-rose-500/30">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>DEMO PASS · NOT A REAL CINEMA TICKET · NO ADMISSION</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
