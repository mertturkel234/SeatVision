import React from "react";
import { Badge } from "./badge";
import type { DataSource, Confidence } from "@/lib/domain/types";

export interface DataBadgeProps {
  source: DataSource;
  label?: string;
  className?: string;
}

export function DataBadge({ source, label, className }: DataBadgeProps) {
  if (source === "demo") {
    return (
      <Badge variant="warning" className={className} title="Simulated sample data for demonstration only">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse" />
        {label ?? "Demo Data"}
      </Badge>
    );
  }

  if (source === "verified-static") {
    return (
      <Badge variant="gold" className={className} title="Operator-verified static blueprint data">
        <span className="w-1.5 h-1.5 rounded-full bg-gold-400 mr-1.5" />
        {label ?? "Verified Static"}
      </Badge>
    );
  }

  return (
    <Badge variant="success" className={className} title="Live data feed">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
      {label ?? "Live Feed"}
    </Badge>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  if (confidence === "high") {
    return <Badge variant="success">High Confidence</Badge>;
  }
  if (confidence === "medium") {
    return <Badge variant="gold">Moderate Confidence</Badge>;
  }
  return <Badge variant="warning">Low Confidence (Gaps Exist)</Badge>;
}
