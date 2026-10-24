import { describe, expect, it } from "vitest";
import { computeCartSummary, createDemoOrder, parseStoredOrder, setQuantity, type ConcessionProduct, type CartSelection } from "../cart";
import { addMoney, CurrencyMismatchError, formatMoney, sumKnownMoney } from "../pricing";
import { allAvailable, testAuditorium, testPricing } from "./fixtures";

const products: ConcessionProduct[] = [
  { id: "pop", name: "Popcorn", description: "", kind: "snack", price: { amountMinor: 12500, currency: "TRY" }, includes: [], provenance: { source: "demo" } },
  { id: "soda", name: "Soda", description: "", kind: "drink", price: { amountMinor: 7000, currency: "TRY" }, includes: [], provenance: { source: "demo" } },
  { id: "usd", name: "Imported", description: "", kind: "snack", price: { amountMinor: 500, currency: "USD" }, includes: [], provenance: { source: "demo" } },
];

describe("money", () => {
  it("sums integer minor units exactly", () => {
    expect(sumKnownMoney([{ amountMinor: 10, currency: "TRY" }, { amountMinor: 20, currency: "TRY" }])).toEqual({ amountMinor: 30, currency: "TRY" });
  });
  it("returns null if any amount is unknown instead of treating it as zero", () => {
    expect(sumKnownMoney([{ amountMinor: 10, currency: "TRY" }, null])).toBeNull();
  });
  it("refuses to add different currencies", () => {
    expect(() => addMoney({ amountMinor: 1, currency: "TRY" }, { amountMinor: 1, currency: "EUR" })).toThrow(CurrencyMismatchError);
  });
  it("formats amounts", () => {
    expect(formatMoney({ amountMinor: 28000, currency: "TRY" })).toMatch(/280[.,]00/);
  });
});

describe("cart summary", () => {
  const aud = testAuditorium();
  it("keeps ticket and concession subtotals separate", () => {
    const summary = computeCartSummary({
      selection: { screeningId: "t-scr", seatIds: ["C2", "C3"], concessions: { pop: 2, soda: 1 } },
      auditorium: aud,
      pricing: testPricing,
      products,
    });
    expect(summary.ticketSubtotal).toEqual({ amountMinor: 30000, currency: "TRY" });
    expect(summary.concessionSubtotal).toEqual({ amountMinor: 32000, currency: "TRY" });
    expect(summary.total).toEqual({ amountMinor: 62000, currency: "TRY" });
    expect(summary.issues).toEqual([]);
  });

  it("clamps quantities and removes zero lines", () => {
    let sel: CartSelection = { screeningId: "t", seatIds: [], concessions: {} };
    sel = setQuantity(sel, "pop", 50);
    expect(sel.concessions.pop).toBe(10);
    sel = setQuantity(sel, "pop", 0);
    expect(sel.concessions).toEqual({});
  });

  it("flags unknown seat prices and withholds the total", () => {
    const summary = computeCartSummary({
      selection: { screeningId: "t-scr", seatIds: ["C2"], concessions: {} },
      auditorium: aud,
      pricing: { ...testPricing, byCategory: {} },
      products,
    });
    expect(summary.total).toBeNull();
    expect(summary.issues[0]).toMatch(/unavailable/);
  });

  it("flags currency mismatches", () => {
    const summary = computeCartSummary({
      selection: { screeningId: "t-scr", seatIds: ["C2"], concessions: { usd: 1 } },
      auditorium: aud,
      pricing: testPricing,
      products,
    });
    expect(summary.issues.join(" ")).toMatch(/different currency/);
  });
});

describe("demo checkout", () => {
  const aud = testAuditorium();
  const base = {
    auditorium: aud,
    pricing: testPricing,
    availability: allAvailable(aud),
    products,
    now: new Date("2026-10-30T10:00:00Z"),
    orderId: "DEMO-AB12CD",
  };

  it("creates a demo order with correct totals", () => {
    const res = createDemoOrder({ ...base, selection: { screeningId: "t-scr", seatIds: ["C2", "C3"], concessions: { pop: 1 } } });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.order.isDemo).toBe(true);
    expect(res.order.total).toEqual({ amountMinor: 42500, currency: "TRY" });
    expect(parseStoredOrder(JSON.parse(JSON.stringify(res.order)))).not.toBeNull();
  });

  it("rejects empty seat selections", () => {
    const res = createDemoOrder({ ...base, selection: { screeningId: "t-scr", seatIds: [], concessions: {} } });
    expect(res.ok).toBe(false);
  });

  it("rejects seats that are no longer available", () => {
    const res = createDemoOrder({
      ...base,
      availability: allAvailable(aud, { C2: "sold" }),
      selection: { screeningId: "t-scr", seatIds: ["C2"], concessions: {} },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toMatch(/no longer available/);
  });

  it("rejects duplicate seats and invalid quantities", () => {
    const res = createDemoOrder({ ...base, selection: { screeningId: "t-scr", seatIds: ["C2", "C2"], concessions: { pop: -1 } } });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.join(" ")).toMatch(/twice/);
      expect(res.errors.join(" ")).toMatch(/Invalid quantity/);
    }
  });

  it("rejects tampered stored orders", () => {
    expect(parseStoredOrder({ id: "REAL-1", isDemo: true })).toBeNull();
    expect(parseStoredOrder({ isDemo: false })).toBeNull();
  });
});
