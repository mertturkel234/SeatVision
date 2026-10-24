/**
 * SeatVision domain model.
 *
 * Design rules:
 * - Auditorium layout, screening-specific availability and screening-specific
 *   pricing are separate records.
 * - Every data record carries a provenance (`DataSource`) so the UI can be
 *   honest about where information comes from.
 * - Missing information is represented explicitly (`null` / absent key), never
 *   with an invented default.
 */

/** Where a piece of information comes from. */
export type DataSource = "demo" | "verified-static" | "live";

export interface Provenance {
  source: DataSource;
  /** Optional human-readable note about the origin of the data. */
  note?: string;
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

export type CurrencyCode = "TRY" | "EUR" | "USD";

/** Money is stored in integer minor units (e.g. kuruş, cents) to avoid float errors. */
export interface Money {
  amountMinor: number;
  currency: CurrencyCode;
}

// ---------------------------------------------------------------------------
// Movies & cinemas
// ---------------------------------------------------------------------------

export const GENRES = [
  "action",
  "adventure",
  "animation",
  "comedy",
  "crime",
  "documentary",
  "drama",
  "family",
  "mystery",
  "romance",
  "sci-fi",
  "thriller",
] as const;
export type Genre = (typeof GENRES)[number];

export const MOODS = [
  "thrilling",
  "uplifting",
  "thoughtful",
  "lighthearted",
  "spectacle",
  "dark",
] as const;
export type Mood = (typeof MOODS)[number];

export interface Movie {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  genres: Genre[];
  /** Runtime in minutes, `null` when unknown. */
  durationMinutes: number | null;
  ageRating: string | null;
  releaseYear: number | null;
  /** Poster image path, `null` when no artwork is available. */
  posterUrl: string | null;
  /** Editorial mood tags used by rule-based discovery. */
  moods: Mood[];
  provenance: Provenance;
}

/** A value that may or may not have been verified with the operator. */
export interface Verifiable<T> {
  value: T;
  verified: boolean;
}

export interface Cinema {
  id: string;
  name: string;
  city: string;
  district: string;
  /** Amenities; `null` when no amenity information exists. */
  amenities: Verifiable<string[]> | null;
  provenance: Provenance;
}

// ---------------------------------------------------------------------------
// Auditorium geometry & seats
// ---------------------------------------------------------------------------

export const EXPERIENCE_FORMATS = ["standard", "premium", "large-format", "3d"] as const;
export type ExperienceFormat = (typeof EXPERIENCE_FORMATS)[number];

/** Seat categories as defined by the operator's seating plan. */
export type SeatCategory = "standard" | "premium" | "recliner";

/** How a seat position was obtained. */
export type PositionMethod = "surveyed" | "estimated-from-plan";

/**
 * Physical seat position in metres.
 * Origin: centre of the screen at floor level.
 * `x`: lateral offset (negative = left when facing the screen).
 * `y`: perpendicular distance from the screen plane (always > 0).
 */
export interface SeatPosition {
  x: number;
  y: number;
}

export type SeatKind = "standard" | "wheelchair-space" | "companion";

export interface Obstruction {
  description: string;
  verified: boolean;
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  /** Display label such as "F7". */
  label: string;
  kind: SeatKind;
  /** `null` when the physical position is unknown. */
  position: SeatPosition | null;
  /** Operator-defined category; `null` when not supplied. */
  category: Verifiable<SeatCategory> | null;
  /**
   * The seat physically adjacent on the right (facing the screen), or `null`
   * when there is an aisle, gap, wall or unknown neighbour. Adjacency is
   * explicit — it must NOT be derived from seat labels.
   */
  rightNeighborId: string | null;
  obstruction: Obstruction | null;
}

export interface ScreenGeometry {
  /** Physical screen width in metres. */
  widthM: number;
  /** Lateral centre of the screen (normally 0). */
  centerX: number;
}

export interface AuditoriumGeometry {
  /** `null` when screen dimensions are unknown. */
  screen: ScreenGeometry | null;
  positionMethod: PositionMethod;
  /** Rows in order from screen to back, with their display labels. */
  rowOrder: string[];
  /** Provenance of the geometry itself. */
  source: DataSource;
}

export interface Auditorium {
  id: string;
  cinemaId: string;
  name: string;
  format: ExperienceFormat;
  geometry: AuditoriumGeometry;
  seats: Seat[];
  provenance: Provenance;
}

// ---------------------------------------------------------------------------
// Screenings, availability and pricing (screening-specific)
// ---------------------------------------------------------------------------

export interface Screening {
  id: string;
  movieId: string;
  cinemaId: string;
  auditoriumId: string;
  /** ISO 8601 start time with offset. */
  startsAt: string;
  format: ExperienceFormat;
  language: string;
  subtitles: string | null;
  provenance: Provenance;
}

export type SeatStatus = "available" | "sold" | "blocked";

export interface ScreeningAvailability {
  screeningId: string;
  source: DataSource;
  /** ISO timestamp of the availability snapshot. */
  asOf: string;
  /** Seats missing from this map have UNKNOWN availability. */
  statuses: Record<string, SeatStatus>;
}

export interface ScreeningPricing {
  screeningId: string;
  source: DataSource;
  /** Price per seat category. Missing category = price unknown. */
  byCategory: Partial<Record<SeatCategory, Money>>;
}

// ---------------------------------------------------------------------------
// Panorama assets
// ---------------------------------------------------------------------------

export type PanoramaVerification = "verified" | "unverified" | "illustrative";

export interface PanoramaAsset {
  id: string;
  auditoriumId: string;
  seatId: string;
  /** Equirectangular image URL; `null` for procedurally generated previews. */
  url: string | null;
  verification: PanoramaVerification;
  capturedAt: string | null;
  provenance: Provenance;
}

// ---------------------------------------------------------------------------
// Preferences & recommendations
// ---------------------------------------------------------------------------

export type ViewingStyle = "balanced" | "closer" | "rear" | "value";
export type ZonePreference = "front" | "middle" | "rear" | "any";
export type PricePreference = "premium" | "value" | "any";
export type SeatZone = "front" | "middle" | "rear";

export interface UserPreferences {
  viewingStyle: ViewingStyle;
  preferredZone: ZonePreference;
  groupSize: number;
  pricePreference: PricePreference;
}

export type ScoreComponentKey = "angle" | "zone" | "category" | "distance" | "value";

export interface ScoringWeights {
  angle: number;
  zone: number;
  category: number;
  distance: number;
  value: number;
}

export interface ScoreComponent {
  key: ScoreComponentKey;
  label: string;
  /** Weight in the final score (0–1 after normalisation). */
  weight: number;
  /** Component score 0–1. */
  score: number;
  /** Whether the input came from surveyed geometry or verified data. */
  basis: "measured" | "estimated" | "verified" | "unverified" | "unknown";
}

export type Confidence = "high" | "medium" | "low";

export interface SeatRecommendation {
  id: string;
  seatIds: string[];
  seatLabels: string[];
  /** Preference-fit score 0–100 among eligible candidates. */
  score: number;
  components: ScoreComponent[];
  reasons: string[];
  limitations: string[];
  confidence: Confidence;
  /** `null` when any seat's price is unknown. */
  totalPrice: Money | null;
  dataSource: DataSource;
  /** "contiguous" blocks sit together; "split" is a clearly labelled fallback. */
  arrangement: "single" | "contiguous" | "split";
}

export interface RecommendationResult {
  recommendations: SeatRecommendation[];
  /** Number of eligible candidates that were scored. */
  candidatesConsidered: number;
  /** Human-readable notes about exclusions and data gaps. */
  notes: string[];
  /** Present when no contiguous block exists for the requested group. */
  noContiguousReason: string | null;
}
