import type {
  Auditorium,
  Cinema,
  ExperienceFormat,
  Money,
  Screening,
  ScreeningAvailability,
  ScreeningPricing,
  Verifiable,
} from "./types";

export interface ExperienceRow {
  screening: Screening;
  cinema: Cinema;
  auditorium: Auditorium;
  format: ExperienceFormat;
  /** `null` when no price is known for any category. */
  priceRange: { min: Money; max: Money } | null;
  /** `null` when availability was not supplied. */
  availableSeats: number | null;
  totalSeats: number;
  amenities: Verifiable<string[]> | null;
}

export function buildExperienceRows(args: {
  screenings: Screening[];
  cinemas: Cinema[];
  auditoriums: Auditorium[];
  availability: ScreeningAvailability[];
  pricing: ScreeningPricing[];
}): ExperienceRow[] {
  const rows: ExperienceRow[] = [];
  for (const screening of args.screenings) {
    const cinema = args.cinemas.find((c) => c.id === screening.cinemaId);
    const auditorium = args.auditoriums.find((a) => a.id === screening.auditoriumId);
    if (!cinema || !auditorium) continue;
    const pricing = args.pricing.find((p) => p.screeningId === screening.id);
    const prices = pricing ? Object.values(pricing.byCategory).filter((m): m is Money => !!m) : [];
    const sorted = [...prices].sort((a, b) => a.amountMinor - b.amountMinor);
    const availability = args.availability.find((a) => a.screeningId === screening.id);
    const bookable = auditorium.seats.filter((s) => s.kind === "standard");
    rows.push({
      screening,
      cinema,
      auditorium,
      format: screening.format,
      priceRange: sorted.length ? { min: sorted[0], max: sorted[sorted.length - 1] } : null,
      availableSeats: availability
        ? bookable.filter((s) => availability.statuses[s.id] === "available").length
        : null,
      totalSeats: bookable.length,
      amenities: cinema.amenities,
    });
  }
  return rows.sort((a, b) => a.screening.startsAt.localeCompare(b.screening.startsAt));
}

export const FORMAT_LABELS: Record<ExperienceFormat, string> = {
  standard: "Standard",
  premium: "Premium recliner",
  "large-format": "Large format",
  "3d": "3D",
};
