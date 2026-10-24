import type { CurrencyCode, Money, ScreeningPricing, Seat } from "./types";

export class CurrencyMismatchError extends Error {
  constructor(a: CurrencyCode, b: CurrencyCode) {
    super(`Cannot combine ${a} and ${b} amounts.`);
    this.name = "CurrencyMismatchError";
  }
}

export function money(amountMinor: number, currency: CurrencyCode): Money {
  if (!Number.isInteger(amountMinor)) throw new Error("Money amounts must be integer minor units.");
  return { amountMinor, currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

export function multiplyMoney(m: Money, qty: number): Money {
  if (!Number.isInteger(qty) || qty < 0) throw new Error("Quantity must be a non-negative integer.");
  return { amountMinor: m.amountMinor * qty, currency: m.currency };
}

/** Sum of amounts. Returns `null` if ANY amount is unknown — unknown prices are never treated as zero. */
export function sumKnownMoney(amounts: (Money | null)[]): Money | null {
  if (amounts.length === 0) return null;
  let total: Money | null = null;
  for (const m of amounts) {
    if (m === null) return null;
    total = total ? addMoney(total, m) : m;
  }
  return total;
}

/** Price of a seat for a screening, or `null` if the category or its price is unknown. */
export function seatPrice(seat: Seat, pricing: ScreeningPricing | null): Money | null {
  if (!pricing || !seat.category) return null;
  return pricing.byCategory[seat.category.value] ?? null;
}

const FRACTION_DIGITS: Record<CurrencyCode, number> = { TRY: 2, EUR: 2, USD: 2 };

export function formatMoney(m: Money, locale = "en-GB"): string {
  const digits = FRACTION_DIGITS[m.currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: m.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(m.amountMinor / 10 ** digits);
}

export function formatMoneyOrUnknown(m: Money | null, locale = "en-GB"): string {
  return m ? formatMoney(m, locale) : "Price unavailable";
}
