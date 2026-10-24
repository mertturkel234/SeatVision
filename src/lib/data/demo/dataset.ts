import type { ConcessionProduct } from "@/lib/domain/cart";
import type {
  Auditorium,
  Cinema,
  Movie,
  Provenance,
  Screening,
  ScreeningAvailability,
  ScreeningPricing,
  SeatStatus,
} from "@/lib/domain/types";
import { buildAuditorium, type RowSpec } from "./auditorium-builder";

/**
 * SeatVision demo dataset.
 *
 * Every movie, cinema, auditorium, screening, price and availability snapshot
 * below is FICTIONAL sample content. Nothing here reflects real listings,
 * real showtimes or real inventory.
 */

const DEMO: Provenance = { source: "demo", note: "Fictional sample content" };

// ---------------------------------------------------------------------------
// Movies
// ---------------------------------------------------------------------------

export const movies: Movie[] = [
  {
    id: "m-lighthouse",
    slug: "the-last-lighthouse",
    title: "The Last Lighthouse",
    synopsis:
      "A keeper on a remote northern cliff receives signals from a ship that sank forty years ago — and begins to answer them.",
    genres: ["drama", "mystery"],
    durationMinutes: 128,
    ageRating: "13+",
    releaseYear: 2026,
    posterUrl: "/images/posters/last-lighthouse.jpg",
    moods: ["thoughtful", "dark"],
    provenance: DEMO,
  },
  {
    id: "m-orbit",
    slug: "orbit-of-ash",
    title: "Orbit of Ash",
    synopsis:
      "Stranded above a dying world, the last crew of a survey station must choose between rescue and the truth about their mission.",
    genres: ["sci-fi", "thriller"],
    durationMinutes: 142,
    ageRating: "13+",
    releaseYear: 2026,
    posterUrl: "/images/posters/orbit-of-ash.jpg",
    moods: ["thrilling", "spectacle"],
    provenance: DEMO,
  },
  {
    id: "m-kites",
    slug: "paper-kites",
    title: "Paper Kites",
    synopsis:
      "Two siblings build a fleet of paper kites to carry a message across their city — and accidentally start a festival.",
    genres: ["animation", "family", "comedy"],
    durationMinutes: 96,
    ageRating: "All ages",
    releaseYear: 2026,
    posterUrl: "/images/posters/paper-kites.jpg",
    moods: ["uplifting", "lighthearted"],
    provenance: DEMO,
  },
  {
    id: "m-market",
    slug: "night-market",
    title: "Night Market",
    synopsis:
      "A retired detective returns to the lantern-lit alleys she once policed to find the informant who saved her life.",
    genres: ["crime", "thriller"],
    durationMinutes: 117,
    ageRating: "16+",
    releaseYear: 2026,
    posterUrl: "/images/posters/night-market.jpg",
    moods: ["thrilling", "dark"],
    provenance: DEMO,
  },
  {
    id: "m-saltwater",
    slug: "saltwater-hymn",
    title: "Saltwater Hymn",
    synopsis:
      "Over one grey summer on a fishing pier, two strangers rehearse a song neither of them is brave enough to perform.",
    genres: ["drama", "romance"],
    durationMinutes: 109,
    ageRating: "13+",
    releaseYear: 2026,
    posterUrl: "/images/posters/saltwater-hymn.jpg",
    moods: ["thoughtful", "uplifting"],
    provenance: DEMO,
  },
  {
    id: "m-meridian",
    slug: "iron-meridian",
    title: "Iron Meridian",
    synopsis:
      "A legendary locomotive, a stolen map and a race across three mountain borders before the bridge comes down.",
    genres: ["action", "adventure"],
    durationMinutes: 151,
    ageRating: "13+",
    releaseYear: 2026,
    posterUrl: "/images/posters/iron-meridian.jpg",
    moods: ["spectacle", "thrilling"],
    provenance: DEMO,
  },
  {
    id: "m-cathedral",
    slug: "glass-cathedral",
    title: "Glass Cathedral",
    synopsis:
      "A year inside the world's largest Victorian glasshouse, following the gardeners who keep a thousand species alive.",
    genres: ["documentary"],
    durationMinutes: 88,
    ageRating: "All ages",
    releaseYear: 2025,
    posterUrl: "/images/posters/glass-cathedral.jpg",
    moods: ["thoughtful", "uplifting"],
    provenance: DEMO,
  },
  {
    id: "m-hours",
    slug: "small-hours",
    title: "Small Hours",
    synopsis:
      "Three night-shift workers keep missing each other at the same all-night café. A late addition to the sample schedule — artwork and runtime not yet supplied.",
    genres: ["comedy", "romance"],
    durationMinutes: null,
    ageRating: null,
    releaseYear: null,
    posterUrl: null,
    moods: ["lighthearted"],
    provenance: { source: "demo", note: "Intentionally incomplete record to demonstrate missing-data handling" },
  },
];

// ---------------------------------------------------------------------------
// Cinemas
// ---------------------------------------------------------------------------

export const cinemas: Cinema[] = [
  {
    id: "c-lumen",
    name: "Lumen Kadıköy",
    city: "Istanbul",
    district: "Kadıköy",
    amenities: { value: ["Step-free access", "Licensed bar", "Paid parking"], verified: true },
    provenance: DEMO,
  },
  {
    id: "c-aurora",
    name: "Aurora Nişantaşı",
    city: "Istanbul",
    district: "Nişantaşı",
    amenities: { value: ["Recliner lounge", "Valet parking"], verified: false },
    provenance: DEMO,
  },
  {
    id: "c-meridyen",
    name: "Meridyen Çankaya",
    city: "Ankara",
    district: "Çankaya",
    amenities: null,
    provenance: DEMO,
  },
];

// ---------------------------------------------------------------------------
// Auditoriums
// ---------------------------------------------------------------------------

const rows = (
  labels: string[],
  make: (label: string, idx: number) => Omit<RowSpec, "label">,
): RowSpec[] => labels.map((label, idx) => ({ label, ...make(label, idx) }));

const STD = { value: "standard" as const, verified: true };
const PREM = { value: "premium" as const, verified: true };

export const auditoriums: Auditorium[] = [
  // Classic hall: three blocks split by two aisles, continuous numbering
  // across aisles (so "F4" and "F5" are NOT physically adjacent).
  buildAuditorium({
    id: "a-lumen-1",
    cinemaId: "c-lumen",
    name: "Hall 1",
    format: "standard",
    screenWidthM: 12,
    positionMethod: "estimated-from-plan",
    source: "demo",
    firstRowY: 4.5,
    rowSpacing: 1.0,
    seatWidth: 0.55,
    aisleWidth: 1.2,
    blockTemplate: [4, 10, 4],
    rows: rows(["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"], (label, i) => ({
      blocks: i === 0 ? [0, 8, 0] : i === 1 ? [3, 10, 3] : [4, 10, 4],
      category: i >= 7 ? PREM : STD,
      kinds: label === "D" ? { 1: "wheelchair-space", 2: "companion" } : undefined,
    })),
  }),
  // Large-format hall: surveyed, curved and staggered rows, cross-aisle after F.
  buildAuditorium({
    id: "a-lumen-3",
    cinemaId: "c-lumen",
    name: "Hall 3 · Large Format",
    format: "large-format",
    screenWidthM: 20,
    positionMethod: "surveyed",
    source: "demo",
    firstRowY: 6,
    rowSpacing: 1.05,
    gapsAfterRow: { F: 1.6 },
    seatWidth: 0.56,
    aisleWidth: 1.3,
    blockTemplate: [5, 16, 5],
    curvature: 0.012,
    rows: rows(["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N"], (_label, i) => ({
      blocks: i < 2 ? [4, 14, 4] : [5, 16, 5],
      offsetX: i % 2 === 1 ? 0.28 : 0,
      category: i >= 9 ? PREM : STD,
    })),
    obstructions: {
      G1: { description: "Cross-aisle safety rail sits in the lower sightline.", verified: true },
      G2: { description: "Cross-aisle safety rail sits in the lower sightline.", verified: true },
      G25: { description: "Cross-aisle safety rail sits in the lower sightline.", verified: true },
      G26: { description: "Cross-aisle safety rail sits in the lower sightline.", verified: true },
    },
  }),
  // 3D hall with intentionally incomplete data: screen size unknown and an
  // unverified premium category — SeatMatch must withhold or lower confidence.
  buildAuditorium({
    id: "a-lumen-2",
    cinemaId: "c-lumen",
    name: "Hall 2 · 3D",
    format: "3d",
    screenWidthM: null,
    positionMethod: "estimated-from-plan",
    source: "demo",
    firstRowY: 4,
    rowSpacing: 0.95,
    seatWidth: 0.55,
    aisleWidth: 1.1,
    blockTemplate: [12],
    rows: rows(["A", "B", "C", "D", "E", "F", "G", "H"], (_l, i) => ({
      blocks: [i < 1 ? 10 : 12],
      category: i >= 6 ? { value: "premium", verified: false } : i === 5 ? null : STD,
    })),
  }),
  // Premium recliner salon: recliners in pairs with gaps between them.
  buildAuditorium({
    id: "a-aurora-vip",
    cinemaId: "c-aurora",
    name: "Salon Lux",
    format: "premium",
    screenWidthM: 10,
    positionMethod: "estimated-from-plan",
    source: "demo",
    firstRowY: 4.5,
    rowSpacing: 1.7,
    seatWidth: 0.85,
    aisleWidth: 1.2,
    blockTemplate: [8],
    chunk: { size: 2, gapM: 0.35 },
    rows: rows(["A", "B", "C", "D", "E", "F"], () => ({
      blocks: [8],
      category: { value: "recliner", verified: true },
    })),
  }),
  buildAuditorium({
    id: "a-aurora-2",
    cinemaId: "c-aurora",
    name: "Salon 2",
    format: "standard",
    screenWidthM: 11,
    positionMethod: "estimated-from-plan",
    source: "demo",
    firstRowY: 4.2,
    rowSpacing: 0.95,
    seatWidth: 0.54,
    aisleWidth: 1.1,
    blockTemplate: [7, 7],
    rows: rows(["A", "B", "C", "D", "E", "F", "G", "H", "J"], (_l, i) => ({
      blocks: i < 2 ? [6, 6] : [7, 7],
      category: i >= 7 ? PREM : STD,
    })),
  }),
  buildAuditorium({
    id: "a-meridyen-1",
    cinemaId: "c-meridyen",
    name: "Salon 1",
    format: "standard",
    screenWidthM: 13,
    positionMethod: "estimated-from-plan",
    source: "demo",
    firstRowY: 5,
    rowSpacing: 1.0,
    seatWidth: 0.55,
    aisleWidth: 1.2,
    blockTemplate: [5, 12, 5],
    curvature: 0.008,
    rows: rows(["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L"], (_l, i) => ({
      blocks: i < 2 ? [4, 10, 4] : [5, 12, 5],
      category: i >= 8 ? PREM : STD,
    })),
  }),
];

// ---------------------------------------------------------------------------
// Screenings (sample schedule)
// ---------------------------------------------------------------------------

interface ScreeningSeed {
  movieId: string;
  auditoriumId: string;
  startsAt: string;
  language?: string;
  subtitles?: string | null;
  /** Fraction of seats sold in the generated snapshot. */
  occupancy: number;
}

const seeds: ScreeningSeed[] = [
  { movieId: "m-orbit", auditoriumId: "a-lumen-3", startsAt: "2026-10-30T20:30:00+03:00", occupancy: 0.45 },
  { movieId: "m-orbit", auditoriumId: "a-lumen-2", startsAt: "2026-10-30T18:00:00+03:00", occupancy: 0.3 },
  { movieId: "m-orbit", auditoriumId: "a-aurora-vip", startsAt: "2026-10-30T21:00:00+03:00", occupancy: 0.4 },
  { movieId: "m-orbit", auditoriumId: "a-meridyen-1", startsAt: "2026-10-31T19:15:00+03:00", occupancy: 0.35 },
  { movieId: "m-lighthouse", auditoriumId: "a-lumen-1", startsAt: "2026-10-30T19:00:00+03:00", occupancy: 0.4 },
  { movieId: "m-lighthouse", auditoriumId: "a-aurora-2", startsAt: "2026-10-31T20:45:00+03:00", occupancy: 0.5 },
  { movieId: "m-kites", auditoriumId: "a-lumen-1", startsAt: "2026-10-31T14:00:00+03:00", occupancy: 0.55, language: "Turkish dub", subtitles: null },
  { movieId: "m-kites", auditoriumId: "a-meridyen-1", startsAt: "2026-10-31T13:30:00+03:00", occupancy: 0.3, language: "Turkish dub", subtitles: null },
  { movieId: "m-market", auditoriumId: "a-aurora-2", startsAt: "2026-10-30T22:00:00+03:00", occupancy: 0.35 },
  // Nearly sold out — exercises the "no contiguous group" explanation.
  { movieId: "m-market", auditoriumId: "a-aurora-vip", startsAt: "2026-10-31T22:15:00+03:00", occupancy: 0.82 },
  { movieId: "m-saltwater", auditoriumId: "a-aurora-vip", startsAt: "2026-10-30T18:30:00+03:00", occupancy: 0.25 },
  { movieId: "m-saltwater", auditoriumId: "a-lumen-1", startsAt: "2026-11-01T17:00:00+03:00", occupancy: 0.2 },
  { movieId: "m-meridian", auditoriumId: "a-lumen-3", startsAt: "2026-10-31T16:00:00+03:00", occupancy: 0.6 },
  { movieId: "m-meridian", auditoriumId: "a-meridyen-1", startsAt: "2026-11-01T20:00:00+03:00", occupancy: 0.4 },
  { movieId: "m-cathedral", auditoriumId: "a-aurora-2", startsAt: "2026-11-01T15:30:00+03:00", occupancy: 0.15 },
  { movieId: "m-hours", auditoriumId: "a-meridyen-1", startsAt: "2026-11-01T22:30:00+03:00", occupancy: 0.2 },
];

const audById = new Map(auditoriums.map((a) => [a.id, a]));

export const screenings: Screening[] = seeds.map((s, i) => {
  const aud = audById.get(s.auditoriumId)!;
  return {
    id: `s-${String(i + 1).padStart(3, "0")}`,
    movieId: s.movieId,
    cinemaId: aud.cinemaId,
    auditoriumId: aud.id,
    startsAt: s.startsAt,
    format: aud.format,
    language: s.language ?? "Original (English)",
    subtitles: s.subtitles === undefined ? "Turkish" : s.subtitles,
    provenance: DEMO,
  };
});

// ---------------------------------------------------------------------------
// Availability snapshots (deterministic pseudo-random)
// ---------------------------------------------------------------------------

function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export const availability: ScreeningAvailability[] = screenings.map((screening, i) => {
  const aud = audById.get(screening.auditoriumId)!;
  const occupancy = seeds[i].occupancy;
  const statuses: Record<string, SeatStatus> = {};
  for (const seat of aud.seats) {
    // One screening ships with a partial snapshot to demonstrate unknown availability.
    if (screening.id === "s-016" && seat.row === "L") continue;
    const r = hash01(`${screening.id}:${seat.id}`);
    statuses[seat.id] = r < occupancy ? "sold" : r < occupancy + 0.02 ? "blocked" : "available";
  }
  return { screeningId: screening.id, source: "demo", asOf: "2026-10-24T12:00:00+03:00", statuses };
});

// ---------------------------------------------------------------------------
// Pricing (per screening, per category) — TRY, minor units
// ---------------------------------------------------------------------------

const PRICE_TABLE: Record<string, ScreeningPricing["byCategory"]> = {
  standard: { standard: { amountMinor: 28000, currency: "TRY" }, premium: { amountMinor: 36000, currency: "TRY" } },
  "large-format": { standard: { amountMinor: 34000, currency: "TRY" }, premium: { amountMinor: 42000, currency: "TRY" } },
  // 3D: premium price intentionally missing.
  "3d": { standard: { amountMinor: 32000, currency: "TRY" } },
  premium: { recliner: { amountMinor: 52000, currency: "TRY" } },
};

export const pricing: ScreeningPricing[] = screenings.map((s) => {
  const base = PRICE_TABLE[s.format];
  const matinee = Number(s.startsAt.slice(11, 13)) < 16;
  const byCategory: ScreeningPricing["byCategory"] = {};
  for (const [cat, m] of Object.entries(base) as [keyof typeof base, NonNullable<(typeof base)[keyof typeof base]>][]) {
    byCategory[cat] = { amountMinor: matinee ? m.amountMinor - 4000 : m.amountMinor, currency: m.currency };
  }
  return { screeningId: s.id, source: "demo", byCategory };
});

// ---------------------------------------------------------------------------
// Concessions
// ---------------------------------------------------------------------------

export const concessions: ConcessionProduct[] = [
  {
    id: "p-duo",
    name: "Duo Bundle",
    description: "Large salted popcorn and two medium drinks.",
    kind: "bundle",
    price: { amountMinor: 32000, currency: "TRY" },
    includes: ["Large popcorn (salted)", "2 × medium soft drink"],
    provenance: DEMO,
  },
  {
    id: "p-family",
    name: "Family Bundle",
    description: "Two large popcorns, four medium drinks and a nachos tray.",
    kind: "bundle",
    price: { amountMinor: 64000, currency: "TRY" },
    includes: ["2 × large popcorn", "4 × medium soft drink", "Nachos with cheese dip"],
    provenance: DEMO,
  },
  {
    id: "p-popcorn-m",
    name: "Popcorn · Medium",
    description: "Freshly popped, lightly salted.",
    kind: "snack",
    price: { amountMinor: 13000, currency: "TRY" },
    includes: [],
    provenance: DEMO,
  },
  {
    id: "p-popcorn-l-caramel",
    name: "Caramel Popcorn · Large",
    description: "Slow-cooked caramel coating.",
    kind: "snack",
    price: { amountMinor: 18500, currency: "TRY" },
    includes: [],
    provenance: DEMO,
  },
  {
    id: "p-nachos",
    name: "Nachos & Cheese Dip",
    description: "Tortilla chips with warm cheese sauce.",
    kind: "snack",
    price: { amountMinor: 15000, currency: "TRY" },
    includes: [],
    provenance: DEMO,
  },
  {
    id: "p-soda",
    name: "Soft Drink · Medium",
    description: "Cola, zero-sugar cola or lemonade.",
    kind: "drink",
    price: { amountMinor: 8000, currency: "TRY" },
    includes: [],
    provenance: DEMO,
  },
  {
    id: "p-water",
    name: "Still Water",
    description: "50 cl bottle.",
    kind: "drink",
    price: { amountMinor: 3500, currency: "TRY" },
    includes: [],
    provenance: DEMO,
  },
  {
    id: "p-icetea",
    name: "Iced Tea · Peach",
    description: "Medium cup, lightly sweetened.",
    kind: "drink",
    price: { amountMinor: 8500, currency: "TRY" },
    includes: [],
    provenance: DEMO,
  },
];
