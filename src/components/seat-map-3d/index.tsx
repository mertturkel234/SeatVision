"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { SeatMap3DProps } from "./seat-map-3d";
import { isWebGLAvailable } from "@/lib/domain/geometry-3d";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import the 3D scene on client to ensure zero SSR hydration issues
const DynamicSeatMap3D = dynamic(
  () => import("./seat-map-3d").then((mod) => mod.SeatMap3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] sm:h-[620px] rounded-2xl bg-ink-950 border border-ink-800 flex flex-col items-center justify-center text-center p-6 space-y-3">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-ivory-300">
          Initializing 3D Cinema Spatial Engine...
        </span>
      </div>
    ),
  }
);

export interface SeatMap3DContainerProps extends SeatMap3DProps {
  onFallbackTo2D?: () => void;
}

export function SeatMap3DContainer(props: SeatMap3DContainerProps) {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setSupported(isWebGLAvailable());
  }, []);

  if (supported === false) {
    return (
      <div className="w-full h-[400px] rounded-2xl bg-ink-950 border border-ink-800 flex flex-col items-center justify-center text-center p-8 space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-400" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-ivory-100">
            WebGL Acceleration Unavailable
          </h3>
          <p className="text-xs text-ivory-400 max-w-md leading-relaxed">
            Your browser or device does not support hardware-accelerated WebGL. Please use the accessible 2D seating chart.
          </p>
        </div>
        {props.onFallbackTo2D && (
          <Button variant="gold" size="sm" onClick={props.onFallbackTo2D}>
            Switch to 2D Seating Chart
          </Button>
        )}
      </div>
    );
  }

  if (supported === null) {
    return (
      <div className="w-full h-[520px] sm:h-[620px] rounded-2xl bg-ink-950 border border-ink-800 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <DynamicSeatMap3D {...props} />;
}
