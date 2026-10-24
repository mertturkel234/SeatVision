import type { ExperienceFormat } from "@/lib/domain/types";

/** All demo screenings are in Istanbul/Ankara; format in a fixed zone so server and client agree. */
const TZ = "Europe/Istanbul";
const LOCALE = "en-GB";

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso));
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short", timeZone: TZ }).format(new Date(iso));
}

export function formatDateLong(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(
    new Date(iso),
  );
}

export function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return "Runtime not supplied";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}

export const FORMAT_SHORT: Record<ExperienceFormat, string> = {
  standard: "Standard",
  premium: "Premium",
  "large-format": "Large Format",
  "3d": "3D",
};

export function titleCase(s: string): string {
  return s.replace(/(^|[\s-])(\w)/g, (_m, p, c: string) => p + c.toUpperCase());
}
