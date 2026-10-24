"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Film,
  Calendar,
  Clock,
  ArrowRight,
  Ticket,
  Sparkles,
} from "lucide-react";
import type {
  Auditorium,
  Screening,
  Movie,
  Cinema,
  ScreeningPricing,
  ScreeningAvailability,
} from "@/lib/domain/types";
import { concessions } from "@/lib/data/demo/dataset";
import {
  computeCartSummary,
  createDemoOrder,
  type CartSelection,
  setQuantity,
} from "@/lib/domain/cart";
import { formatDay, formatTime, FORMAT_SHORT } from "@/lib/format";
import { formatMoneyOrUnknown } from "@/lib/domain/pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataBadge } from "@/components/ui/data-badge";

export interface CartClientProps {
  screenings: Screening[];
  movies: Movie[];
  cinemas: Cinema[];
  auditoriums: Auditorium[];
  pricings: ScreeningPricing[];
  availabilities: ScreeningAvailability[];
}

export function CartClient({
  screenings,
  movies,
  cinemas,
  auditoriums,
  pricings,
  availabilities,
}: CartClientProps) {
  const router = useRouter();

  const [selection, setSelection] = useState<CartSelection>({
    screeningId: screenings[0]?.id || "",
    seatIds: [],
    concessions: {},
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [checkoutErrors, setCheckoutErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load from session storage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("seatvision_cart");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.screeningId && Array.isArray(parsed.seatIds)) {
          setSelection({
            screeningId: parsed.screeningId,
            seatIds: parsed.seatIds,
            concessions: parsed.concessions || {},
          });
        }
      }
    } catch {}
    setIsLoaded(true);
  }, []);

  // Sync to storage
  const updateSelection = (newSelection: CartSelection) => {
    setSelection(newSelection);
    try {
      sessionStorage.setItem("seatvision_cart", JSON.stringify(newSelection));
      const totalCount =
        newSelection.seatIds.length +
        Object.values(newSelection.concessions).reduce(
          (acc: number, q: unknown) => acc + (typeof q === "number" ? q : 0),
          0
        );
      sessionStorage.setItem("seatvision_cart_count", totalCount.toString());
      window.dispatchEvent(new Event("seatvision_cart_updated"));
    } catch {}
  };

  const screening = screenings.find((s) => s.id === selection.screeningId);
  const movie = movies.find((m) => m.id === screening?.movieId);
  const cinema = cinemas.find((c) => c.id === screening?.cinemaId);
  const auditorium = auditoriums.find((a) => a.id === screening?.auditoriumId);
  const pricing = pricings.find((p) => p.screeningId === selection.screeningId) ?? null;
  const availability =
    availabilities.find((a) => a.screeningId === selection.screeningId) ?? null;

  // Compute breakdown
  const summary = auditorium
    ? computeCartSummary({
        selection,
        auditorium,
        pricing,
        products: concessions,
      })
    : null;

  const handleUpdateQuantity = (productId: string, qty: number) => {
    const updated = setQuantity(selection, productId, qty);
    updateSelection(updated);
  };

  const handleRemoveSeat = (seatId: string) => {
    const updated = {
      ...selection,
      seatIds: selection.seatIds.filter((id) => id !== seatId),
    };
    updateSelection(updated);
  };

  const handleCheckout = () => {
    if (!auditorium) return;
    setIsSubmitting(true);
    setCheckoutErrors([]);

    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderId = `DEMO-${randomSuffix}`;

    const res = createDemoOrder({
      selection,
      auditorium,
      pricing,
      availability,
      products: concessions,
      now: new Date(),
      orderId,
    });

    if (res.ok) {
      // Store completed demo order
      sessionStorage.setItem("seatvision_last_order", JSON.stringify(res.order));
      // Clear current cart
      sessionStorage.removeItem("seatvision_cart");
      sessionStorage.setItem("seatvision_cart_count", "0");
      window.dispatchEvent(new Event("seatvision_cart_updated"));
      // Navigate to digital ticket
      router.push(`/ticket/${res.order.id}`);
    } else {
      setCheckoutErrors(res.errors);
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="container-page py-16 text-center text-ivory-400">
        Loading cart...
      </div>
    );
  }

  if (selection.seatIds.length === 0 || !screening || !movie || !cinema || !auditorium) {
    return (
      <div className="container-page py-16 max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-ink-800 text-gold-400 flex items-center justify-center mx-auto border border-ink-700">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ivory-50 mb-2">Your Cart is Empty</h1>
          <p className="text-sm text-ivory-400">
            You haven’t selected any cinema seats yet. Browse available screenings and use SeatMatch to find your seats.
          </p>
        </div>
        <Link href="/movies">
          <Button variant="gold" size="lg">
            Browse Movies & Showtimes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-ink-800 pb-4">
        <span className="eyebrow">Demo Checkout</span>
        <h1 className="text-3xl font-bold text-ivory-50 flex items-center gap-3">
          Review & Order Summary
          <DataBadge source="demo" label="Demo Checkout (No Payment Required)" />
        </h1>
        <p className="text-xs text-ivory-400 mt-1">
          Review your selected seats, add cinema snacks and drinks, and generate your demo digital pass.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Tickets + Concessions List */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Screening & Tickets Card */}
          <div className="card bg-ink-900 border-ink-800 p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-ink-800 pb-4">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-16 relative rounded overflow-hidden bg-ink-800 shrink-0">
                  {movie.posterUrl && (
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ivory-50">{movie.title}</h2>
                  <div className="text-xs text-ivory-400 flex items-center gap-2 mt-0.5">
                    <span>{cinema.name}</span>
                    <span>·</span>
                    <span>{auditorium.name}</span>
                    <span>·</span>
                    <Badge variant="gold" className="text-[10px]">
                      {FORMAT_SHORT[screening.format]}
                    </Badge>
                  </div>
                  <div className="text-xs text-gold-400/90 flex items-center gap-3 mt-1 font-mono">
                    <span>{formatDay(screening.startsAt)}</span>
                    <span>{formatTime(screening.startsAt)}</span>
                  </div>
                </div>
              </div>

              <Link href={`/screenings/${screening.id}`}>
                <Button variant="outline" size="sm">
                  Change Seats
                </Button>
              </Link>
            </div>

            {/* Selected Seats Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-ivory-300 font-mono uppercase tracking-wider">
                Selected Seats ({summary?.tickets.length})
              </h3>
              <div className="divide-y divide-ink-800">
                {summary?.tickets.map((t) => (
                  <div
                    key={t.seatId}
                    className="py-2.5 flex items-center justify-between text-xs text-ivory-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <Ticket className="w-4 h-4 text-gold-400" />
                      <span className="font-bold text-ivory-100 font-mono">Seat {t.seatLabel}</span>
                      <Badge variant={t.category === "premium" ? "gold" : "secondary"}>
                        {t.category ? t.category : "Standard"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono font-medium text-ivory-100">
                        {formatMoneyOrUnknown(t.price)}
                      </span>
                      <button
                        onClick={() => handleRemoveSeat(t.seatId)}
                        className="text-ivory-500 hover:text-rose-400 transition-colors p-1"
                        title="Remove seat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Snacks & Drinks Demo Add-ons */}
          <div className="card bg-ink-900 border-ink-800 p-6 space-y-4">
            <div>
              <span className="eyebrow">Concessions</span>
              <h2 className="text-lg font-bold text-ivory-50 flex items-center gap-2">
                Popcorn, Drinks & Bundles
                <Badge variant="secondary">Optional Add-on</Badge>
              </h2>
              <p className="text-xs text-ivory-400">
                Pre-order cinema treats for counter pickup. Sample prices and items.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {concessions.map((product) => {
                const currentQty = selection.concessions[product.id] || 0;
                return (
                  <div
                    key={product.id}
                    className="p-3.5 rounded-xl bg-ink-850 border border-ink-750 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-ivory-100">
                          {product.name}
                        </span>
                        <span className="font-mono text-xs font-bold text-gold-300 whitespace-nowrap">
                          {formatMoneyOrUnknown(product.price)}
                        </span>
                      </div>
                      <p className="text-[11px] text-ivory-400 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                      {product.includes.length > 0 && (
                        <div className="mt-1.5 text-[10px] text-ivory-500">
                          Includes: {product.includes.join(" · ")}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-ink-800/80">
                      <span className="text-[11px] text-ivory-400">Quantity</span>
                      <div className="flex items-center gap-2">
                        {currentQty > 0 ? (
                          <>
                            <button
                              onClick={() => handleUpdateQuantity(product.id, currentQty - 1)}
                              className="w-6 h-6 rounded bg-ink-750 hover:bg-ink-700 text-ivory-200 flex items-center justify-center text-xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono text-xs font-bold text-ivory-100 w-5 text-center">
                              {currentQty}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(product.id, currentQty + 1)}
                              className="w-6 h-6 rounded bg-ink-750 hover:bg-ink-700 text-ivory-200 flex items-center justify-center text-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-[11px] h-7 px-2.5"
                            onClick={() => handleUpdateQuantity(product.id, 1)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Price Breakdown & Demo Checkout Button */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <div className="card bg-ink-900 border-ink-800 p-6 space-y-5 shadow-2xl sticky top-20">
            <h3 className="text-base font-bold text-ivory-50 border-b border-ink-800 pb-3">
              Order Summary
            </h3>

            {/* Calculations */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-ivory-300">
                <span>Tickets Subtotal ({summary?.tickets.length} seats)</span>
                <span className="font-mono text-ivory-100 font-semibold">
                  {formatMoneyOrUnknown(summary?.ticketSubtotal || null)}
                </span>
              </div>

              <div className="flex justify-between text-ivory-300">
                <span>Concessions Subtotal</span>
                <span className="font-mono text-ivory-100 font-semibold">
                  {formatMoneyOrUnknown(summary?.concessionSubtotal || null)}
                </span>
              </div>

              <div className="pt-3 border-t border-ink-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-ivory-50">Total Amount</span>
                <span className="text-xl font-bold text-gold-300 font-mono">
                  {formatMoneyOrUnknown(summary?.total || null)}
                </span>
              </div>
            </div>

            {/* Error notifications */}
            {checkoutErrors.length > 0 && (
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-200 space-y-1">
                <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  Checkout Incomplete
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {checkoutErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Demo Checkout Action Button */}
            <Button
              variant="gold"
              size="lg"
              className="w-full text-base font-bold py-3.5"
              disabled={isSubmitting}
              onClick={handleCheckout}
            >
              <ShieldCheck className="w-5 h-5 mr-2" />
              {isSubmitting ? "Generating Demo Pass..." : "Complete Demo Order"}
            </Button>

            {/* Transparency Disclaimer */}
            <div className="bg-ink-850 p-3 rounded-lg border border-ink-800 text-[11px] text-ivory-400 space-y-1">
              <div className="text-gold-400 font-semibold flex items-center gap-1 font-mono uppercase text-[10px]">
                <Sparkles className="w-3 h-3" /> Demo Mode Notice
              </div>
              <p className="leading-relaxed">
                SeatVision does not charge your credit card or reserve physical theatre seats. This mock checkout demonstrates the end-to-end B2B ticketing and concession integration flow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
