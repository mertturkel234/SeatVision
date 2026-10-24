"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Users,
  Sliders,
  Check,
  Info,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  Auditorium,
  ScreeningAvailability,
  ScreeningPricing,
  UserPreferences,
  ViewingStyle,
  ZonePreference,
  PricePreference,
} from "@/lib/domain/types";
import {
  recommendSeats,
  DEFAULT_PREFERENCES,
  SEATMATCH_PRESETS,
  type SeatMatchPreset,
} from "@/lib/domain/seatmatch";
import { formatMoneyOrUnknown } from "@/lib/domain/pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataBadge, ConfidenceBadge } from "@/components/ui/data-badge";
import { cn } from "@/lib/cn";

export interface SeatMatchPanelProps {
  auditorium: Auditorium;
  availability: ScreeningAvailability | null;
  pricing: ScreeningPricing | null;
  onApplyRecommendation: (seatIds: string[]) => void;
  onHighlightSeats?: (seatIds: string[]) => void;
}

export function SeatMatchPanel({
  auditorium,
  availability,
  pricing,
  onApplyRecommendation,
  onHighlightSeats,
}: SeatMatchPanelProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [activePresetId, setActivePresetId] = useState<string>("balanced");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);

  // Group size shortcut options
  const groupSizes = [1, 2, 3, 4, 5, 6];

  // Handle Preset selection
  const handleSelectPreset = (preset: SeatMatchPreset) => {
    setActivePresetId(preset.id);
    setPreferences((prev) => ({
      ...prev,
      ...preset.preferences,
    }));
  };

  // Run pure recommendation algorithm whenever input changes
  const result = useMemo(() => {
    if (!availability) {
      return {
        recommendations: [],
        candidatesConsidered: 0,
        notes: ["Screening availability is not supplied."],
        noContiguousReason: null,
      };
    }
    return recommendSeats({
      auditorium,
      availability,
      pricing,
      preferences,
      limit: 3,
    });
  }, [auditorium, availability, pricing, preferences]);

  return (
    <div className="card bg-ink-900 border-ink-800 p-5 flex flex-col gap-5 shadow-xl">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-ink-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center border border-gold-500/30">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ivory-50 flex items-center gap-2">
              SeatMatch™
              <span className="text-[11px] font-mono text-gold-400 bg-gold-400/10 px-2 py-0.5 rounded border border-gold-500/20 font-normal">
                Smart Assistant
              </span>
            </h2>
            <p className="text-xs text-ivory-400">
              Explainable recommendations based on spatial viewing geometry & availability.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-ivory-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showAdvanced ? "Presets" : "Fine-tune"}</span>
        </button>
      </div>

      {/* Group Size Selector (Constraint #1) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ivory-200 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-gold-400" />
          <span>Party / Group Size</span>
        </label>
        <div className="grid grid-cols-6 gap-2">
          {groupSizes.map((size) => (
            <button
              key={size}
              onClick={() => setPreferences((prev) => ({ ...prev, groupSize: size }))}
              className={cn(
                "py-2 rounded-lg text-xs font-mono font-medium border transition-all text-center",
                preferences.groupSize === size
                  ? "bg-gold-500 text-ink-950 border-gold-400 font-bold shadow-sm"
                  : "bg-ink-850 text-ivory-300 border-ink-750 hover:bg-ink-800 hover:text-ivory-100"
              )}
            >
              {size} {size === 1 ? "seat" : "seats"}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Buttons or Fine-tune Controls */}
      {!showAdvanced ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SEATMATCH_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={cn(
                "p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all",
                activePresetId === p.id
                  ? "bg-gold-500/10 border-gold-500/50 text-ivory-50 ring-1 ring-gold-500/30"
                  : "bg-ink-850 border-ink-750 text-ivory-400 hover:bg-ink-800 hover:text-ivory-200"
              )}
            >
              <div className="font-semibold text-xs text-ivory-100 mb-1">{p.label}</div>
              <div className="text-[10px] text-ivory-400 leading-tight">{p.description}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-ink-850 p-3.5 rounded-xl border border-ink-800 text-xs">
          <div>
            <label className="block text-ivory-300 mb-1.5 font-medium">Viewing Style</label>
            <select
              value={preferences.viewingStyle}
              onChange={(e) => {
                setActivePresetId("custom");
                setPreferences((prev) => ({
                  ...prev,
                  viewingStyle: e.target.value as ViewingStyle,
                }));
              }}
              className="w-full bg-ink-900 border border-ink-700 rounded-lg p-2 text-ivory-100 font-sans"
            >
              <option value="balanced">Balanced Sightline</option>
              <option value="closer">Closer (Immersive)</option>
              <option value="rear">Rear Rows (Overview)</option>
              <option value="value">Best Value</option>
            </select>
          </div>

          <div>
            <label className="block text-ivory-300 mb-1.5 font-medium">Auditorium Zone</label>
            <select
              value={preferences.preferredZone}
              onChange={(e) => {
                setActivePresetId("custom");
                setPreferences((prev) => ({
                  ...prev,
                  preferredZone: e.target.value as ZonePreference,
                }));
              }}
              className="w-full bg-ink-900 border border-ink-700 rounded-lg p-2 text-ivory-100 font-sans"
            >
              <option value="rear">Rear Zone</option>
              <option value="middle">Middle Zone</option>
              <option value="front">Front Zone</option>
              <option value="any">Any Zone</option>
            </select>
          </div>

          <div>
            <label className="block text-ivory-300 mb-1.5 font-medium">Price Preference</label>
            <select
              value={preferences.pricePreference}
              onChange={(e) => {
                setActivePresetId("custom");
                setPreferences((prev) => ({
                  ...prev,
                  pricePreference: e.target.value as PricePreference,
                }));
              }}
              className="w-full bg-ink-900 border border-ink-700 rounded-lg p-2 text-ivory-100 font-sans"
            >
              <option value="premium">Prefer Premium / Recliners</option>
              <option value="value">Budget / Best Value</option>
              <option value="any">No Preference</option>
            </select>
          </div>
        </div>
      )}

      {/* No Contiguous Reason Notice (if group size could not be seated contiguously) */}
      {result.noContiguousReason && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-amber-300">No Contiguous Block Available</span>
            <p className="leading-relaxed">{result.noContiguousReason}</p>
            {result.recommendations.length > 0 && (
              <span className="text-[11px] text-amber-400 font-medium">
                We found split alternatives seated in adjacent blocks below:
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recommendation Results Cards */}
      <div className="flex flex-col gap-3">
        {result.recommendations.length === 0 ? (
          <div className="p-6 text-center text-ivory-400 text-xs border border-dashed border-ink-800 rounded-xl bg-ink-850/50">
            No matching seats satisfy all eligibility constraints. Try lowering your group size or selecting another screening time.
          </div>
        ) : (
          result.recommendations.map((rec, index) => {
            const isExpanded = expandedRecId === rec.id;
            return (
              <div
                key={rec.id}
                onMouseEnter={() => onHighlightSeats?.(rec.seatIds)}
                onMouseLeave={() => onHighlightSeats?.([])}
                className={cn(
                  "card bg-ink-850 border-ink-750 p-4 transition-all hover:border-gold-500/40",
                  rec.arrangement === "split" && "border-amber-500/30"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-bold text-gold-400 font-mono">
                        #{index + 1} Best Match
                      </span>
                      <Badge variant={rec.arrangement === "split" ? "warning" : "gold"}>
                        {rec.score}% Preference Fit
                      </Badge>
                      <ConfidenceBadge confidence={rec.confidence} />
                      {rec.arrangement === "split" && (
                        <Badge variant="warning">Split Blocks</Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-ivory-50 flex items-center gap-2">
                      Seats {rec.seatLabels.join(", ")}
                      <span className="text-xs font-normal text-ivory-400 font-mono">
                        Total: {formatMoneyOrUnknown(rec.totalPrice)}
                      </span>
                    </h3>
                  </div>

                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => onApplyRecommendation(rec.seatIds)}
                  >
                    Select {rec.seatIds.length > 1 ? "Seats" : "Seat"}
                  </Button>
                </div>

                {/* Primary Reasons bullet points */}
                <ul className="mt-3 space-y-1 text-xs text-ivory-300 list-disc list-inside">
                  {rec.reasons.slice(0, 2).map((reason, i) => (
                    <li key={i} className="leading-relaxed">
                      {reason}
                    </li>
                  ))}
                </ul>

                {/* Explainable Score Breakdown Accordion Toggle */}
                <div className="mt-3 pt-2.5 border-t border-ink-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setExpandedRecId(isExpanded ? null : rec.id)}
                    className="text-ivory-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5 text-gold-400" />
                    <span>{isExpanded ? "Hide score breakdown" : "Why was this scored?"}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 ml-0.5" />
                    ) : (
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    )}
                  </button>

                  <DataBadge source={rec.dataSource} />
                </div>

                {/* Expanded Score Details */}
                {isExpanded && (
                  <div className="mt-3 p-3.5 rounded-lg bg-ink-900 border border-ink-800 space-y-3 text-xs">
                    <div>
                      <h4 className="font-semibold text-ivory-200 mb-2 font-mono text-[11px] uppercase tracking-wider">
                        Factor Weighting & Fit
                      </h4>
                      <div className="space-y-2">
                        {rec.components.map((comp) => (
                          <div key={comp.key} className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-ivory-300">
                                {comp.label} ({(comp.weight * 100).toFixed(0)}% weight)
                              </span>
                              <span className="font-mono text-gold-300">
                                {(comp.score * 100).toFixed(0)}% match ({comp.basis})
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-ink-800 overflow-hidden">
                              <div
                                className="h-full bg-gold-400 rounded-full"
                                style={{ width: `${comp.score * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {rec.limitations.length > 0 && (
                      <div className="pt-2 border-t border-ink-800">
                        <h4 className="font-semibold text-amber-300 mb-1 flex items-center gap-1 text-[11px]">
                          <HelpCircle className="w-3 h-3" /> Data Limits & Transparency:
                        </h4>
                        <ul className="list-disc list-inside text-ivory-400 space-y-0.5 text-[11px]">
                          {rec.limitations.map((lim, idx) => (
                            <li key={idx}>{lim}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
