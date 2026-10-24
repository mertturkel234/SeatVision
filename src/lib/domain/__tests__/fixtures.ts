import type { Auditorium, ScreeningAvailability, ScreeningPricing, Seat, SeatStatus } from "../types";

/**
 * Small hand-built auditorium for tests.
 *
 * Row A (front): A1–A2 | aisle | A3–A4      (A2 and A3 are NOT adjacent)
 * Row B:         B1–B2 | aisle | B3–B4
 * Row C (rear):  C1–C2–C3–C4 (one continuous block), premium verified
 *
 * Screen width 8 m, rows at y = 4, 6, 8.
 */
export function makeSeat(partial: Partial<Seat> & Pick<Seat, "id" | "row" | "number">): Seat {
  return {
    label: `${partial.row}${partial.number}`,
    kind: "standard",
    position: { x: 0, y: 5 },
    category: { value: "standard", verified: true },
    rightNeighborId: null,
    obstruction: null,
    ...partial,
  };
}

export function testAuditorium(overrides: Partial<Auditorium> = {}): Auditorium {
  const xs = [-2.5, -1.9, 1.9, 2.5];
  const seats: Seat[] = [];
  for (const [rowIdx, row] of ["A", "B", "C"].entries()) {
    for (let n = 1; n <= 4; n++) {
      const continuous = row === "C";
      const x = continuous ? (n - 2.5) * 0.6 : xs[n - 1];
      const rightNeighborId = n === 4 ? null : !continuous && n === 2 ? null : `${row}${n + 1}`;
      seats.push(
        makeSeat({
          id: `${row}${n}`,
          row,
          number: n,
          position: { x, y: 4 + rowIdx * 2 },
          rightNeighborId,
          category: row === "C" ? { value: "premium", verified: true } : { value: "standard", verified: true },
        }),
      );
    }
  }
  return {
    id: "t-aud",
    cinemaId: "t-cin",
    name: "Test Hall",
    format: "standard",
    geometry: { screen: { widthM: 8, centerX: 0 }, positionMethod: "surveyed", rowOrder: ["A", "B", "C"], source: "demo" },
    seats,
    provenance: { source: "demo" },
    ...overrides,
  };
}

export function allAvailable(aud: Auditorium, overrides: Record<string, SeatStatus | undefined> = {}): ScreeningAvailability {
  const statuses: Record<string, SeatStatus> = {};
  for (const s of aud.seats) {
    const o = s.id in overrides ? overrides[s.id] : "available";
    if (o !== undefined) statuses[s.id] = o;
  }
  return { screeningId: "t-scr", source: "demo", asOf: "2026-01-01T00:00:00Z", statuses };
}

export const testPricing: ScreeningPricing = {
  screeningId: "t-scr",
  source: "demo",
  byCategory: {
    standard: { amountMinor: 10000, currency: "TRY" },
    premium: { amountMinor: 15000, currency: "TRY" },
  },
};
