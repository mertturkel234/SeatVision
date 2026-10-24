"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function CartBadge() {
  const [count, setCount] = useState<number>(0);

  const updateCount = () => {
    try {
      const stored = sessionStorage.getItem("seatvision_cart_count");
      if (stored) {
        setCount(parseInt(stored, 10) || 0);
      } else {
        const cartStr = sessionStorage.getItem("seatvision_cart");
        if (cartStr) {
          const cart = JSON.parse(cartStr);
          const seats = cart.seatIds?.length || 0;
          const concessions = Object.values(cart.concessions || {}).reduce(
            (acc: number, q: unknown) => acc + (typeof q === "number" ? q : 0),
            0
          );
          setCount(seats + concessions);
        } else {
          setCount(0);
        }
      }
    } catch {
      setCount(0);
    }
  };

  useEffect(() => {
    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("seatvision_cart_updated", updateCount);
    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("seatvision_cart_updated", updateCount);
    };
  }, []);

  return (
    <Link
      href="/cart"
      className="relative p-2 text-ivory-300 hover:text-gold-300 transition-colors flex items-center gap-1.5 text-sm font-medium"
      title="View Demo Cart"
    >
      <ShoppingBag className="w-5 h-5" />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 && (
        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-ink-950 bg-gold-400 rounded-full min-w-[18px]">
          {count}
        </span>
      )}
    </Link>
  );
}
