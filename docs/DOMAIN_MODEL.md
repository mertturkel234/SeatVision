# SeatVision — Domain Data Models

This document details the TypeScript domain entities defined in `src/lib/domain/types.ts`.

## 1. Provenance & Transparency

```typescript
export type DataSource = "demo" | "verified-static" | "live";

export interface Provenance {
  source: DataSource;
  note?: string;
}

export interface Verifiable<T> {
  value: T;
  verified: boolean;
}
```

## 2. Geometry & Seating

```typescript
export interface SeatPosition {
  x: number; // Lateral offset in metres (0 = screen centre, negative = left)
  y: number; // Perpendicular distance in metres from the screen plane
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  label: string; // e.g. "F7"
  kind: "standard" | "wheelchair-space" | "companion";
  position: SeatPosition | null;
  category: Verifiable<SeatCategory> | null;
  rightNeighborId: string | null; // Explicit physical adjacency
  obstruction: Obstruction | null;
}

export interface ScreenGeometry {
  widthM: number;
  centerX: number;
}
```

## 3. Screenings, Availability, and Pricing

```typescript
export interface Screening {
  id: string;
  movieId: string;
  cinemaId: string;
  auditoriumId: string;
  startsAt: string; // ISO 8601
  format: "standard" | "premium" | "large-format" | "3d";
  language: string;
  subtitles: string | null;
  provenance: Provenance;
}

export interface ScreeningAvailability {
  screeningId: string;
  source: DataSource;
  asOf: string;
  statuses: Record<string, "available" | "sold" | "blocked">;
}

export interface ScreeningPricing {
  screeningId: string;
  source: DataSource;
  byCategory: Partial<Record<SeatCategory, Money>>;
}
```

## 4. Concessions & Cart

```typescript
export interface ConcessionProduct {
  id: string;
  name: string;
  description: string;
  kind: "snack" | "drink" | "bundle";
  price: Money;
  includes: string[];
  provenance: Provenance;
}

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
```
