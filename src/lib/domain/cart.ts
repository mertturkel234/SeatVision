import { addMoney, money, multiplyMoney, seatPrice, sumKnownMoney } from "./pricing";
import type {
  Auditorium,
  CurrencyCode,
  Money,
  Provenance,
  ScreeningAvailability,
  ScreeningPricing,
  SeatCategory,
} from "./types";

/**
 * Demo cart & checkout.
 *
 * Tickets (seat selections) and concessions are distinct line types. Nothing
 * here charges money, reserves seats or creates a real order. A future ticket
 * provider integration would replace `createDemoOrder` with an authorised API.
 */

export const MAX_ITEM_QUANTITY = 10;

export type ConcessionKind = "snack" | "drink" | "bundle";

export interface ConcessionProduct {
  id: string;
  name: string;
  description: string;
  kind: ConcessionKind;
  price: Money;
  /** For bundles: human-readable contents. */
  includes: string[];
  provenance: Provenance;
}

export interface CartSelection {
  screeningId: string;
  seatIds: string[];
  /** productId → quantity */
  concessions: Record<string, number>;
}

export interface TicketLine {
  seatId: string;
  seatLabel: string;
  category: SeatCategory | null;
  price: Money | null;
}

export interface ConcessionLine {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

export interface CartSummary {
  tickets: TicketLine[];
  concessions: ConcessionLine[];
  ticketSubtotal: Money | null;
  concessionSubtotal: Money | null;
  /** `null` whenever any ticket price is unknown. */
  total: Money | null;
  issues: string[];
}

export function isValidQuantity(q: unknown): q is number {
  return typeof q === "number" && Number.isInteger(q) && q >= 0 && q <= MAX_ITEM_QUANTITY;
}

export function setQuantity(selection: CartSelection, productId: string, quantity: number): CartSelection {
  const q = Math.max(0, Math.min(MAX_ITEM_QUANTITY, Math.trunc(quantity)));
  const concessions = { ...selection.concessions };
  if (q === 0) delete concessions[productId];
  else concessions[productId] = q;
  return { ...selection, concessions };
}

export function computeCartSummary(args: {
  selection: CartSelection;
  auditorium: Auditorium;
  pricing: ScreeningPricing | null;
  products: ConcessionProduct[];
}): CartSummary {
  const { selection, auditorium, pricing, products } = args;
  const issues: string[] = [];
  const seats = new Map(auditorium.seats.map((s) => [s.id, s]));
  const tickets: TicketLine[] = [];
  for (const id of selection.seatIds) {
    const seat = seats.get(id);
    if (!seat) {
      issues.push(`Seat ${id} does not exist in ${auditorium.name}.`);
      continue;
    }
    const price = seatPrice(seat, pricing);
    if (!price) issues.push(`Price for seat ${seat.label} is unavailable.`);
    tickets.push({ seatId: id, seatLabel: seat.label, category: seat.category?.value ?? null, price });
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const concessions: ConcessionLine[] = [];
  for (const [productId, quantity] of Object.entries(selection.concessions)) {
    const product = productMap.get(productId);
    if (!product) {
      issues.push(`Unknown product ${productId}.`);
      continue;
    }
    if (!isValidQuantity(quantity)) {
      issues.push(`Invalid quantity for ${product.name}.`);
      continue;
    }
    if (quantity === 0) continue;
    concessions.push({
      productId,
      name: product.name,
      quantity,
      unitPrice: product.price,
      lineTotal: multiplyMoney(product.price, quantity),
    });
  }

  const ticketSubtotal = sumKnownMoney(tickets.map((t) => t.price));
  const currency: CurrencyCode | null =
    ticketSubtotal?.currency ?? concessions[0]?.unitPrice.currency ?? null;
  let concessionSubtotal: Money | null = currency ? money(0, currency) : null;
  for (const line of concessions) {
    try {
      concessionSubtotal = concessionSubtotal ? addMoney(concessionSubtotal, line.lineTotal) : line.lineTotal;
    } catch {
      issues.push(`${line.name} is priced in a different currency and cannot be combined.`);
    }
  }

  let total: Money | null = null;
  if (ticketSubtotal && concessionSubtotal) {
    try {
      total = addMoney(ticketSubtotal, concessionSubtotal);
    } catch {
      issues.push("Ticket and concession currencies differ.");
    }
  }
  return { tickets, concessions, ticketSubtotal, concessionSubtotal, total, issues };
}

// ---------------------------------------------------------------------------
// Demo checkout
// ---------------------------------------------------------------------------

export interface DemoOrder {
  id: string;
  isDemo: true;
  createdAt: string;
  screeningId: string;
  tickets: TicketLine[];
  concessions: ConcessionLine[];
  ticketSubtotal: Money;
  concessionSubtotal: Money;
  total: Money;
}

export type CheckoutResult = { ok: true; order: DemoOrder } | { ok: false; errors: string[] };

export function createDemoOrder(args: {
  selection: CartSelection;
  auditorium: Auditorium;
  pricing: ScreeningPricing | null;
  availability: ScreeningAvailability | null;
  products: ConcessionProduct[];
  now: Date;
  orderId: string;
}): CheckoutResult {
  const errors: string[] = [];
  const { selection, availability } = args;
  if (selection.seatIds.length === 0) errors.push("Select at least one seat before checkout.");
  if (new Set(selection.seatIds).size !== selection.seatIds.length) errors.push("The same seat is selected twice.");
  if (!availability) errors.push("Seat availability for this screening is unknown.");
  else {
    for (const id of selection.seatIds) {
      const status = availability.statuses[id];
      if (status !== "available") {
        const label = args.auditorium.seats.find((s) => s.id === id)?.label ?? id;
        errors.push(
          status === undefined ? `Availability for seat ${label} is unknown.` : `Seat ${label} is no longer available.`,
        );
      }
    }
  }
  const summary = computeCartSummary(args);
  errors.push(...summary.issues);
  if (!/^DEMO-[A-Z0-9]{4,12}$/.test(args.orderId)) errors.push("Invalid demo order id.");
  if (errors.length > 0 || !summary.ticketSubtotal || !summary.concessionSubtotal || !summary.total) {
    return { ok: false, errors: errors.length ? [...new Set(errors)] : ["Order total could not be calculated."] };
  }
  return {
    ok: true,
    order: {
      id: args.orderId,
      isDemo: true,
      createdAt: args.now.toISOString(),
      screeningId: selection.screeningId,
      tickets: summary.tickets,
      concessions: summary.concessions,
      ticketSubtotal: summary.ticketSubtotal,
      concessionSubtotal: summary.concessionSubtotal,
      total: summary.total,
    },
  };
}

/** Deterministic decorative grid for the demo code. It encodes nothing and is NOT a scannable QR code. */
export function demoCodePattern(seed: string, size = 21): boolean[][] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const grid: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      h = Math.imul(h ^ (x * 31 + y * 17), 2654435761) >>> 0;
      row.push((h & 7) < 3);
    }
    grid.push(row);
  }
  return grid;
}

/** Re-validates an order loaded from untrusted storage. */
export function parseStoredOrder(raw: unknown): DemoOrder | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Partial<DemoOrder>;
  const isMoney = (m: unknown): m is Money =>
    typeof m === "object" && m !== null && Number.isInteger((m as Money).amountMinor) && typeof (m as Money).currency === "string";
  if (
    o.isDemo !== true ||
    typeof o.id !== "string" ||
    !/^DEMO-[A-Z0-9]{4,12}$/.test(o.id) ||
    typeof o.screeningId !== "string" ||
    typeof o.createdAt !== "string" ||
    !Array.isArray(o.tickets) ||
    !Array.isArray(o.concessions) ||
    !isMoney(o.total) ||
    !isMoney(o.ticketSubtotal) ||
    !isMoney(o.concessionSubtotal)
  )
    return null;
  return o as DemoOrder;
}
