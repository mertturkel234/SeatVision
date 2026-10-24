import { findContiguousBlocks, longestContiguousRun } from "./adjacency";
import { depthRange, depthRatio, distanceInScreenWidths, horizontalAngleDeg, zoneForRatio } from "./geometry";
import { seatPrice, sumKnownMoney } from "./pricing";
import type {
  Auditorium,
  Confidence,
  DataSource,
  Money,
  RecommendationResult,
  ScoreComponent,
  ScoringWeights,
  ScreeningAvailability,
  ScreeningPricing,
  Seat,
  SeatRecommendation,
  UserPreferences,
  ViewingStyle,
  ZonePreference,
} from "./types";

/**
 * SeatMatch — deterministic, explainable seat recommendation.
 *
 * Hard constraints (never score bonuses):
 *   1. Every seat must be explicitly `available` in the screening snapshot.
 *   2. The group must be a physically connected run (explicit adjacency).
 *   3. Seats need known position + screen geometry to be scored.
 *
 * The score is a preference-fit measure among eligible candidates, not an
 * objective statement of seat quality. See docs/SEATMATCH.md.
 */

export const DEFAULT_WEIGHTS: ScoringWeights = {
  angle: 0.4,
  zone: 0.25,
  category: 0.2,
  distance: 0.15,
  value: 0.2,
};

/** The initial preference model from the product brief. */
export const DEFAULT_PREFERENCES: UserPreferences = {
  viewingStyle: "balanced",
  preferredZone: "rear",
  groupSize: 2,
  pricePreference: "premium",
};

export const MIN_GROUP_SIZE = 1;
export const MAX_GROUP_SIZE = 8;

/** Preferred viewing distance band in screen widths, per viewing style. */
export const DISTANCE_BANDS: Record<ViewingStyle, [number, number]> = {
  balanced: [1.0, 1.6],
  closer: [0.6, 1.0],
  rear: [1.5, 2.3],
  value: [1.0, 1.6],
};

/** Angle (degrees) at which the angle component reaches zero. */
export const MAX_SCORED_ANGLE_DEG = 30;

export interface SeatMatchPreset {
  id: string;
  label: string;
  description: string;
  preferences: Omit<UserPreferences, "groupSize">;
}

export const SEATMATCH_PRESETS: SeatMatchPreset[] = [
  {
    id: "balanced",
    label: "Best balanced view",
    description: "Centred, comfortable distance, rear half, verified premium seats.",
    preferences: { viewingStyle: "balanced", preferredZone: "rear", pricePreference: "premium" },
  },
  {
    id: "closer",
    label: "Closer to the screen",
    description: "A larger, more immersive picture from the front third.",
    preferences: { viewingStyle: "closer", preferredZone: "front", pricePreference: "any" },
  },
  {
    id: "rear",
    label: "Prefer the rear rows",
    description: "The whole screen in view from the back of the room.",
    preferences: { viewingStyle: "rear", preferredZone: "rear", pricePreference: "any" },
  },
  {
    id: "value",
    label: "Best value",
    description: "Good sightlines weighted toward lower known prices.",
    preferences: { viewingStyle: "value", preferredZone: "any", pricePreference: "value" },
  },
];

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const VIEWING: ViewingStyle[] = ["balanced", "closer", "rear", "value"];
const ZONES: ZonePreference[] = ["front", "middle", "rear", "any"];
const PRICES: UserPreferences["pricePreference"][] = ["premium", "value", "any"];

/** Validates untrusted input (URL params, storage) into preferences, falling back per field. */
export function parsePreferences(input: unknown): UserPreferences {
  const obj = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const pick = <T extends string>(v: unknown, allowed: T[], fallback: T): T =>
    typeof v === "string" && (allowed as string[]).includes(v) ? (v as T) : fallback;
  const n = typeof obj.groupSize === "string" ? Number(obj.groupSize) : obj.groupSize;
  const groupSize =
    typeof n === "number" && Number.isInteger(n) && n >= MIN_GROUP_SIZE && n <= MAX_GROUP_SIZE
      ? n
      : DEFAULT_PREFERENCES.groupSize;
  return {
    viewingStyle: pick(obj.viewingStyle, VIEWING, DEFAULT_PREFERENCES.viewingStyle),
    preferredZone: pick(obj.preferredZone, ZONES, DEFAULT_PREFERENCES.preferredZone),
    pricePreference: pick(obj.pricePreference, PRICES, DEFAULT_PREFERENCES.pricePreference),
    groupSize,
  };
}

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

/** Active weights for the given preferences, normalised to sum to 1. */
export function effectiveWeights(prefs: UserPreferences, base: ScoringWeights = DEFAULT_WEIGHTS): ScoringWeights {
  const raw: ScoringWeights = {
    angle: base.angle,
    distance: base.distance,
    zone: prefs.preferredZone === "any" ? 0 : base.zone,
    category: prefs.pricePreference === "premium" ? base.category : 0,
    value: prefs.pricePreference === "value" ? base.value : 0,
  };
  const total = raw.angle + raw.distance + raw.zone + raw.category + raw.value;
  if (total <= 0) throw new Error("At least one scoring weight must be positive.");
  return {
    angle: raw.angle / total,
    distance: raw.distance / total,
    zone: raw.zone / total,
    category: raw.category / total,
    value: raw.value / total,
  };
}

// ---------------------------------------------------------------------------
// Component scores (pure, exported for tests)
// ---------------------------------------------------------------------------

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function angleScore(angleDeg: number): number {
  return clamp01(1 - angleDeg / MAX_SCORED_ANGLE_DEG);
}

export function zoneScore(ratio: number, pref: ZonePreference): number {
  switch (pref) {
    case "rear":
      // Full marks from 75% depth, ramps from the middle.
      return clamp01((ratio - 0.35) / 0.4);
    case "front":
      return clamp01((0.65 - ratio) / 0.4);
    case "middle":
      return clamp01(1 - Math.abs(ratio - 0.5) / 0.35);
    case "any":
      return 1;
  }
}

export function distanceScore(screenWidths: number, band: [number, number]): number {
  const [lo, hi] = band;
  if (screenWidths >= lo && screenWidths <= hi) return 1;
  const off = screenWidths < lo ? lo - screenWidths : screenWidths - hi;
  return clamp01(1 - off / 0.6);
}

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

export type IneligibleReason =
  | "unavailable"
  | "unknown-availability"
  | "accessibility-space"
  | "missing-geometry";

export function seatIneligibility(
  seat: Seat,
  auditorium: Auditorium,
  availability: ScreeningAvailability,
): IneligibleReason | null {
  const status = availability.statuses[seat.id];
  if (status === undefined) return "unknown-availability";
  if (status !== "available") return "unavailable";
  if (seat.kind !== "standard") return "accessibility-space";
  if (!seat.position || !auditorium.geometry.screen) return "missing-geometry";
  return null;
}

// ---------------------------------------------------------------------------
// Recommendation
// ---------------------------------------------------------------------------

export interface RecommendInput {
  auditorium: Auditorium;
  availability: ScreeningAvailability;
  pricing: ScreeningPricing | null;
  preferences: UserPreferences;
  weights?: ScoringWeights;
  limit?: number;
}

interface ScoredSeat {
  seat: Seat;
  components: Record<keyof ScoringWeights, number>;
  angleDeg: number;
  screenWidths: number;
  ratio: number;
  price: Money | null;
}

const fmt = (n: number, d = 1) => n.toFixed(d);

function combineSources(sources: DataSource[]): DataSource {
  if (sources.includes("demo")) return "demo";
  if (sources.includes("verified-static")) return "verified-static";
  return "live";
}

export function recommendSeats(input: RecommendInput): RecommendationResult {
  const { auditorium, availability, pricing } = input;
  const prefs = parsePreferences(input.preferences);
  const limit = input.limit ?? 3;
  const weights = effectiveWeights(prefs, input.weights);
  const screen = auditorium.geometry.screen;
  const range = depthRange(auditorium);
  const band = DISTANCE_BANDS[prefs.viewingStyle];
  const notes: string[] = [];

  // --- Hard eligibility ----------------------------------------------------
  const counts: Record<IneligibleReason, number> = {
    unavailable: 0,
    "unknown-availability": 0,
    "accessibility-space": 0,
    "missing-geometry": 0,
  };
  const eligible = new Set<string>();
  for (const seat of auditorium.seats) {
    const reason = seatIneligibility(seat, auditorium, availability);
    if (reason) counts[reason]++;
    else eligible.add(seat.id);
  }
  if (counts["unknown-availability"] > 0)
    notes.push(`${counts["unknown-availability"]} seat(s) excluded because their availability is unknown.`);
  if (counts["accessibility-space"] > 0)
    notes.push(
      `${counts["accessibility-space"]} wheelchair or companion space(s) are not auto-recommended; select them directly on the map if needed.`,
    );
  if (!screen) notes.push("Screen dimensions are unknown, so viewing angle and distance cannot be computed. Recommendations are withheld.");
  else if (counts["missing-geometry"] > 0)
    notes.push(`${counts["missing-geometry"]} seat(s) withheld because their physical position is unknown.`);

  if (!screen || !range) {
    return { recommendations: [], candidatesConsidered: 0, notes, noContiguousReason: null };
  }

  // --- Per-seat scoring ----------------------------------------------------
  const pricedEligible = auditorium.seats
    .filter((s) => eligible.has(s.id))
    .map((s) => seatPrice(s, pricing))
    .filter((p): p is Money => p !== null);
  const minPrice = pricedEligible.length ? Math.min(...pricedEligible.map((p) => p.amountMinor)) : null;
  const maxPrice = pricedEligible.length ? Math.max(...pricedEligible.map((p) => p.amountMinor)) : null;

  const scored = new Map<string, ScoredSeat>();
  for (const seat of auditorium.seats) {
    if (!eligible.has(seat.id) || !seat.position) continue;
    const angleDeg = horizontalAngleDeg(seat.position, screen);
    const screenWidths = distanceInScreenWidths(seat.position, screen);
    const ratio = depthRatio(seat.position, range);
    const price = seatPrice(seat, pricing);
    const cat = seat.category;
    const categoryScore =
      cat && (cat.value === "premium" || cat.value === "recliner") ? (cat.verified ? 1 : 0.5) : 0;
    const valueScore =
      price && minPrice !== null && maxPrice !== null
        ? maxPrice === minPrice
          ? 1
          : 1 - (price.amountMinor - minPrice) / (maxPrice - minPrice)
        : 0;
    scored.set(seat.id, {
      seat,
      angleDeg,
      screenWidths,
      ratio,
      price,
      components: {
        angle: angleScore(angleDeg),
        zone: zoneScore(ratio, prefs.preferredZone),
        category: categoryScore,
        distance: distanceScore(screenWidths, band),
        value: valueScore,
      },
    });
  }

  const isEligible = (s: Seat) => scored.has(s.id);
  const blocks = findContiguousBlocks(auditorium, prefs.groupSize, isEligible);
  const geometryBasis = auditorium.geometry.positionMethod === "surveyed" ? "measured" : "estimated";
  const rowCount = auditorium.geometry.rowOrder.length;

  const build = (groups: Seat[][], arrangement: SeatRecommendation["arrangement"]): SeatRecommendation => {
    const members = groups.flat().map((s) => scored.get(s.id)!);
    const mean = (k: keyof ScoringWeights) => members.reduce((a, m) => a + m.components[k], 0) / members.length;
    const avgAngle = members.reduce((a, m) => a + m.angleDeg, 0) / members.length;
    const avgSW = members.reduce((a, m) => a + m.screenWidths, 0) / members.length;
    const avgRatio = members.reduce((a, m) => a + m.ratio, 0) / members.length;
    const reasons: string[] = [];
    const limitations: string[] = [];

    const cats = members.map((m) => m.seat.category);
    const unknownCat = cats.some((c) => c === null);
    const unverifiedCat = cats.some((c) => c !== null && !c.verified);
    const totalPrice = sumKnownMoney(members.map((m) => m.price));

    const components: ScoreComponent[] = [
      { key: "angle", label: "Viewing angle & centre alignment", weight: weights.angle, score: mean("angle"), basis: geometryBasis },
      { key: "distance", label: "Preferred viewing distance", weight: weights.distance, score: mean("distance"), basis: geometryBasis },
    ];
    if (weights.zone > 0)
      components.push({ key: "zone", label: `Preferred ${prefs.preferredZone} zone`, weight: weights.zone, score: mean("zone"), basis: geometryBasis });
    if (weights.category > 0)
      components.push({
        key: "category",
        label: "Verified premium category",
        weight: weights.category,
        score: mean("category"),
        basis: unknownCat ? "unknown" : unverifiedCat ? "unverified" : "verified",
      });
    if (weights.value > 0)
      components.push({
        key: "value",
        label: "Lower known price",
        weight: weights.value,
        score: mean("value"),
        basis: totalPrice ? "verified" : "unknown",
      });

    // Reasons ---------------------------------------------------------------
    const rows = [...new Set(members.map((m) => m.seat.row))];
    if (arrangement === "contiguous")
      reasons.push(`${members.length} physically adjacent seats in row ${rows[0]} with no aisle or gap between them.`);
    if (arrangement === "split")
      reasons.push(`Alternative only: your group is split into blocks of ${groups.map((g) => g.length).join(" + ")} in row ${rows.join(" and ")}.`);
    reasons.push(
      avgAngle < 5
        ? `Close to the centreline — about ${fmt(avgAngle)}° off-axis on average.`
        : `About ${fmt(avgAngle)}° off the screen centreline on average.`,
    );
    const inBand = avgSW >= band[0] && avgSW <= band[1];
    reasons.push(
      `Roughly ${fmt(avgSW)} screen widths from the screen${inBand ? `, inside your preferred ${band[0]}–${band[1]} range` : `, outside your preferred ${band[0]}–${band[1]} range`}.`,
    );
    if (weights.zone > 0) {
      const zone = zoneForRatio(avgRatio);
      reasons.push(
        zone === prefs.preferredZone
          ? `In the ${zone} zone of the auditorium, matching your preference (row ${rows.join("/")} of ${rowCount}).`
          : `In the ${zone} zone; you asked for ${prefs.preferredZone} (row ${rows.join("/")} of ${rowCount}).`,
      );
    }
    if (weights.category > 0) {
      const premium = members.filter((m) => m.seat.category?.value === "premium" || m.seat.category?.value === "recliner");
      if (premium.length === members.length && !unverifiedCat) reasons.push("All seats are in an operator-verified premium category.");
      else if (premium.length > 0) reasons.push(`${premium.length} of ${members.length} seat(s) are listed as premium.`);
      else reasons.push("Standard category — no premium seats fit the other constraints as well.");
    }
    if (weights.value > 0 && totalPrice && minPrice !== null) {
      const perSeat = totalPrice.amountMinor / members.length;
      reasons.push(perSeat === minPrice ? "Priced at the lowest known category for this screening." : "Price is above the lowest known category for this screening.");
    }

    // Limitations & confidence ---------------------------------------------
    let unknowns = 0;
    if (geometryBasis === "estimated") limitations.push("Seat positions are estimated from a seating plan, not surveyed.");
    if (!totalPrice) {
      unknowns++;
      limitations.push("At least one seat price is unavailable, so a total cannot be shown.");
    }
    if (weights.category > 0 && unknownCat) {
      unknowns++;
      limitations.push("Seat category not supplied for at least one seat; it scored zero for premium match.");
    }
    if (weights.category > 0 && unverifiedCat) {
      unknowns++;
      limitations.push("At least one premium category is not operator-verified and received half credit.");
    }
    const obstructed = members.filter((m) => m.seat.obstruction);
    for (const m of obstructed) {
      limitations.push(
        `${m.seat.label}: ${m.seat.obstruction!.verified ? "verified" : "reported, unverified"} obstruction — ${m.seat.obstruction!.description}`,
      );
    }
    if (availability.source !== "live") limitations.push("Availability is a sample snapshot, not live inventory. Nothing is reserved.");

    let confidence: Confidence = geometryBasis === "measured" ? "high" : "medium";
    if (unknowns >= 2) confidence = "low";
    else if (unknowns === 1) confidence = confidence === "high" ? "medium" : "low";

    const score = Math.round(components.reduce((a, c) => a + c.weight * c.score, 0) * 100);

    return {
      id: `${arrangement}:${members.map((m) => m.seat.id).join("+")}`,
      seatIds: members.map((m) => m.seat.id),
      seatLabels: members.map((m) => m.seat.label),
      score,
      components,
      reasons,
      limitations,
      confidence,
      totalPrice,
      dataSource: combineSources([auditorium.provenance.source, availability.source, pricing?.source ?? "demo"]),
      arrangement,
    };
  };

  const rank = (recs: SeatRecommendation[], angleOf: (r: SeatRecommendation) => number) =>
    recs.sort((a, b) => b.score - a.score || angleOf(a) - angleOf(b) || a.id.localeCompare(b.id));

  const avgAngleOf = (r: SeatRecommendation) =>
    r.seatIds.reduce((a, id) => a + (scored.get(id)?.angleDeg ?? 0), 0) / r.seatIds.length;

  /** Greedy pick of non-overlapping recommendations so results are distinct choices. */
  const pickDistinct = (recs: SeatRecommendation[]) => {
    const used = new Set<string>();
    const out: SeatRecommendation[] = [];
    for (const r of recs) {
      if (r.seatIds.some((id) => used.has(id))) continue;
      r.seatIds.forEach((id) => used.add(id));
      out.push(r);
      if (out.length >= limit) break;
    }
    return out;
  };

  const arrangement: SeatRecommendation["arrangement"] = prefs.groupSize === 1 ? "single" : "contiguous";
  if (blocks.length > 0) {
    const recs = rank(blocks.map((b) => build([b], arrangement)), avgAngleOf);
    return { recommendations: pickDistinct(recs), candidatesConsidered: blocks.length, notes, noContiguousReason: null };
  }

  // --- No contiguous block: explain and offer clearly labelled split blocks ---
  const longest = longestContiguousRun(auditorium, isEligible);
  const noContiguousReason =
    scored.size < prefs.groupSize
      ? `Only ${scored.size} eligible seat(s) remain for this screening; your group needs ${prefs.groupSize}.`
      : `No row has ${prefs.groupSize} physically connected available seats. The longest connected run is ${longest}.`;

  const splitRecs: SeatRecommendation[] = [];
  if (prefs.groupSize >= 2 && scored.size >= prefs.groupSize) {
    const a = Math.ceil(prefs.groupSize / 2);
    const b = prefs.groupSize - a;
    const blocksA = findContiguousBlocks(auditorium, a, isEligible);
    const blocksB = findContiguousBlocks(auditorium, b, isEligible);
    const rowIdx = (s: Seat) => auditorium.geometry.rowOrder.indexOf(s.row);
    for (const ba of blocksA) {
      for (const bb of blocksB) {
        if (bb.some((s) => ba.includes(s))) continue;
        const diff = Math.abs(rowIdx(ba[0]) - rowIdx(bb[0]));
        if (diff > 1) continue; // same row or directly in front/behind
        splitRecs.push(build([ba, bb], "split"));
      }
    }
  }
  const recs = pickDistinct(rank(splitRecs, avgAngleOf));
  if (recs.length === 0 && prefs.groupSize >= 2)
    notes.push("No split alternative in the same or neighbouring rows is available either. Try another screening.");
  return { recommendations: recs, candidatesConsidered: splitRecs.length, notes, noContiguousReason };
}
