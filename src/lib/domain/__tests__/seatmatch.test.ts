import { describe, expect, it } from "vitest";
import {
  angleScore,
  DEFAULT_PREFERENCES,
  distanceScore,
  effectiveWeights,
  parsePreferences,
  recommendSeats,
  zoneScore,
} from "../seatmatch";
import type { UserPreferences } from "../types";
import { allAvailable, testAuditorium, testPricing } from "./fixtures";

const prefs = (p: Partial<UserPreferences> = {}): UserPreferences => ({ ...DEFAULT_PREFERENCES, ...p });

describe("SeatMatch weights", () => {
  it("uses the brief's initial weights for the default preferences", () => {
    const w = effectiveWeights(DEFAULT_PREFERENCES);
    expect(w.angle).toBeCloseTo(0.4);
    expect(w.zone).toBeCloseTo(0.25);
    expect(w.category).toBeCloseTo(0.2);
    expect(w.distance).toBeCloseTo(0.15);
    expect(w.value).toBe(0);
  });

  it("renormalises when a preference is 'any'", () => {
    const w = effectiveWeights(prefs({ preferredZone: "any", pricePreference: "any" }));
    expect(w.zone).toBe(0);
    expect(w.category).toBe(0);
    expect(w.angle + w.distance).toBeCloseTo(1);
  });
});

describe("SeatMatch component scores", () => {
  it("scores centre seats higher than off-axis seats", () => {
    expect(angleScore(0)).toBe(1);
    expect(angleScore(15)).toBeCloseTo(0.5);
    expect(angleScore(45)).toBe(0);
  });
  it("scores zones by depth", () => {
    expect(zoneScore(1, "rear")).toBe(1);
    expect(zoneScore(0, "rear")).toBe(0);
    expect(zoneScore(0, "front")).toBe(1);
    expect(zoneScore(0.5, "middle")).toBe(1);
  });
  it("gives full distance credit inside the band", () => {
    expect(distanceScore(1.2, [1, 1.6])).toBe(1);
    expect(distanceScore(0.7, [1, 1.6])).toBeCloseTo(0.5);
  });
});

describe("SeatMatch eligibility (hard constraints)", () => {
  it("never recommends unavailable seats", () => {
    const aud = testAuditorium();
    const availability = allAvailable(aud, { C2: "sold", C3: "blocked" });
    const res = recommendSeats({ auditorium: aud, availability, pricing: testPricing, preferences: prefs(), limit: 10 });
    const ids = res.recommendations.flatMap((r) => r.seatIds);
    expect(ids).not.toContain("C2");
    expect(ids).not.toContain("C3");
  });

  it("treats unknown availability as ineligible and says so", () => {
    const aud = testAuditorium();
    const availability = allAvailable(aud, { C1: undefined });
    const res = recommendSeats({ auditorium: aud, availability, pricing: testPricing, preferences: prefs(), limit: 10 });
    expect(res.recommendations.flatMap((r) => r.seatIds)).not.toContain("C1");
    expect(res.notes.join(" ")).toMatch(/availability is unknown/);
  });

  it("recommends only physically adjacent pairs for a group of two", () => {
    const aud = testAuditorium();
    const res = recommendSeats({ auditorium: aud, availability: allAvailable(aud), pricing: testPricing, preferences: prefs(), limit: 10 });
    for (const r of res.recommendations) {
      expect(r.arrangement).toBe("contiguous");
      const [a, b] = r.seatIds;
      expect(aud.seats.find((s) => s.id === a)!.rightNeighborId).toBe(b);
    }
    expect(res.recommendations.map((r) => r.seatIds.join("+"))).not.toContain("A2+A3");
  });

  it("prefers the rear premium centre pair for the default preferences", () => {
    const aud = testAuditorium();
    const res = recommendSeats({ auditorium: aud, availability: allAvailable(aud), pricing: testPricing, preferences: prefs() });
    expect(res.recommendations[0].seatIds).toEqual(["C2", "C3"]);
    expect(res.recommendations[0].totalPrice).toEqual({ amountMinor: 30000, currency: "TRY" });
    expect(res.recommendations[0].reasons.length).toBeGreaterThan(2);
  });

  it("returns non-overlapping recommendations", () => {
    const aud = testAuditorium();
    const res = recommendSeats({ auditorium: aud, availability: allAvailable(aud), pricing: testPricing, preferences: prefs(), limit: 5 });
    const ids = res.recommendations.flatMap((r) => r.seatIds);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("SeatMatch data integrity", () => {
  it("does not infer premium from price", () => {
    const aud = testAuditorium();
    // Make row A expensive but keep its category standard.
    const pricing = { ...testPricing, byCategory: { standard: { amountMinor: 99000, currency: "TRY" as const }, premium: { amountMinor: 1000, currency: "TRY" as const } } };
    const res = recommendSeats({ auditorium: aud, availability: allAvailable(aud, { C1: "sold", C2: "sold", C3: "sold", C4: "sold" }), pricing, preferences: prefs(), limit: 10 });
    for (const r of res.recommendations) {
      expect(r.components.find((c) => c.key === "category")!.score).toBe(0);
    }
  });

  it("withholds recommendations when screen geometry is unknown", () => {
    const base = testAuditorium();
    const aud = { ...base, geometry: { ...base.geometry, screen: null } };
    const res = recommendSeats({ auditorium: aud, availability: allAvailable(aud), pricing: testPricing, preferences: prefs() });
    expect(res.recommendations).toHaveLength(0);
    expect(res.notes.join(" ")).toMatch(/Screen dimensions are unknown/);
  });

  it("withholds seats with unknown positions", () => {
    const aud = testAuditorium();
    aud.seats = aud.seats.map((s) => (s.id === "C2" ? { ...s, position: null } : s));
    const res = recommendSeats({ auditorium: aud, availability: allAvailable(aud), pricing: testPricing, preferences: prefs(), limit: 10 });
    expect(res.recommendations.flatMap((r) => r.seatIds)).not.toContain("C2");
    expect(res.notes.join(" ")).toMatch(/position is unknown/);
  });

  it("shows no total and lowers confidence when a price is missing", () => {
    const aud = testAuditorium();
    const pricing = { ...testPricing, byCategory: { standard: testPricing.byCategory.standard } };
    const res = recommendSeats({ auditorium: aud, availability: allAvailable(aud), pricing, preferences: prefs() });
    const top = res.recommendations[0];
    expect(top.seatIds).toEqual(["C2", "C3"]);
    expect(top.totalPrice).toBeNull();
    expect(top.confidence).toBe("medium");
    expect(top.limitations.join(" ")).toMatch(/price is unavailable/);
  });

  it("gives half credit to unverified premium categories", () => {
    const aud = testAuditorium();
    aud.seats = aud.seats.map((s) => (s.row === "C" ? { ...s, category: { value: "premium", verified: false } } : s));
    const res = recommendSeats({ auditorium: aud, availability: allAvailable(aud), pricing: testPricing, preferences: prefs() });
    const cat = res.recommendations[0].components.find((c) => c.key === "category")!;
    expect(cat.score).toBe(0.5);
    expect(cat.basis).toBe("unverified");
  });

  it("labels demo data as demo", () => {
    const aud = testAuditorium();
    const res = recommendSeats({ auditorium: aud, availability: allAvailable(aud), pricing: testPricing, preferences: prefs() });
    expect(res.recommendations[0].dataSource).toBe("demo");
  });
});

describe("Group seat finder", () => {
  it("finds a contiguous block of four only where seats are connected", () => {
    const aud = testAuditorium();
    const res = recommendSeats({ auditorium: aud, availability: allAvailable(aud), pricing: testPricing, preferences: prefs({ groupSize: 4 }) });
    expect(res.recommendations[0].seatIds).toEqual(["C1", "C2", "C3", "C4"]);
    expect(res.noContiguousReason).toBeNull();
  });

  it("explains and offers labelled split alternatives when no contiguous block exists", () => {
    const aud = testAuditorium();
    const res = recommendSeats({
      auditorium: aud,
      availability: allAvailable(aud, { C2: "sold" }),
      pricing: testPricing,
      preferences: prefs({ groupSize: 3 }),
    });
    expect(res.noContiguousReason).toMatch(/No row has 3 physically connected/);
    expect(res.recommendations.length).toBeGreaterThan(0);
    for (const r of res.recommendations) {
      expect(r.arrangement).toBe("split");
      expect(r.seatIds).toHaveLength(3);
      expect(r.reasons[0]).toMatch(/Alternative only/);
    }
  });

  it("explains when too few seats remain", () => {
    const aud = testAuditorium();
    const statuses = Object.fromEntries(aud.seats.map((s) => [s.id, s.id === "A1" ? "available" : "sold"])) as Record<string, "available" | "sold">;
    const res = recommendSeats({ auditorium: aud, availability: allAvailable(aud, statuses), pricing: testPricing, preferences: prefs({ groupSize: 2 }) });
    expect(res.recommendations).toHaveLength(0);
    expect(res.noContiguousReason).toMatch(/Only 1 eligible seat/);
  });
});

describe("parsePreferences", () => {
  it("falls back per field for invalid input", () => {
    expect(parsePreferences({ viewingStyle: "nope", groupSize: 99, preferredZone: "front" })).toEqual({
      ...DEFAULT_PREFERENCES,
      preferredZone: "front",
    });
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences({ groupSize: "3" }).groupSize).toBe(3);
  });
});
