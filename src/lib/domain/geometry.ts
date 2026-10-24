import type { Auditorium, Seat, SeatPosition, SeatZone, ScreenGeometry } from "./types";

/** Horizontal angle (degrees) between the seat's line of sight to the screen centre and the screen normal. */
export function horizontalAngleDeg(position: SeatPosition, screen: ScreenGeometry): number {
  const dx = Math.abs(position.x - screen.centerX);
  return (Math.atan2(dx, position.y) * 180) / Math.PI;
}

/** Straight-line floor distance (metres) from seat to screen centre. */
export function distanceToScreenM(position: SeatPosition, screen: ScreenGeometry): number {
  const dx = position.x - screen.centerX;
  return Math.sqrt(dx * dx + position.y * position.y);
}

/** Distance expressed in screen widths — the usual way to compare across auditorium sizes. */
export function distanceInScreenWidths(position: SeatPosition, screen: ScreenGeometry): number {
  return position.y / screen.widthM;
}

/** Horizontal field of view (degrees) the screen occupies from the seat. */
export function screenFieldOfViewDeg(position: SeatPosition, screen: ScreenGeometry): number {
  const left = screen.centerX - screen.widthM / 2 - position.x;
  const right = screen.centerX + screen.widthM / 2 - position.x;
  return ((Math.atan2(right, position.y) - Math.atan2(left, position.y)) * 180) / Math.PI;
}

export interface DepthRange {
  minY: number;
  maxY: number;
}

export function depthRange(auditorium: Auditorium): DepthRange | null {
  const ys = auditorium.seats.flatMap((s) => (s.position ? [s.position.y] : []));
  if (ys.length === 0) return null;
  return { minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/** 0 = front-most seated row, 1 = rear-most seated row. */
export function depthRatio(position: SeatPosition, range: DepthRange): number {
  if (range.maxY === range.minY) return 0.5;
  return (position.y - range.minY) / (range.maxY - range.minY);
}

/** Zone thresholds are documented in docs/SEATMATCH.md. */
export const ZONE_THRESHOLDS = { frontBelow: 1 / 3, rearFrom: 2 / 3 } as const;

export function zoneForRatio(ratio: number): SeatZone {
  if (ratio < ZONE_THRESHOLDS.frontBelow) return "front";
  if (ratio >= ZONE_THRESHOLDS.rearFrom) return "rear";
  return "middle";
}

export function seatZone(seat: Seat, range: DepthRange | null): SeatZone | null {
  if (!seat.position || !range) return null;
  return zoneForRatio(depthRatio(seat.position, range));
}

export interface SeatMetrics {
  angleDeg: number | null;
  distanceM: number | null;
  distanceScreenWidths: number | null;
  fieldOfViewDeg: number | null;
  zone: SeatZone | null;
  /** Lateral offset from the screen centre in metres (negative = left). */
  lateralOffsetM: number | null;
  /** "measured" if surveyed, "estimated" if derived from a plan, "unknown" if missing. */
  basis: "measured" | "estimated" | "unknown";
}

export function seatMetrics(auditorium: Auditorium, seat: Seat): SeatMetrics {
  const screen = auditorium.geometry.screen;
  const range = depthRange(auditorium);
  if (!seat.position || !screen) {
    return {
      angleDeg: null,
      distanceM: null,
      distanceScreenWidths: null,
      fieldOfViewDeg: null,
      zone: seatZone(seat, range),
      lateralOffsetM: seat.position ? seat.position.x : null,
      basis: "unknown",
    };
  }
  return {
    angleDeg: horizontalAngleDeg(seat.position, screen),
    distanceM: distanceToScreenM(seat.position, screen),
    distanceScreenWidths: distanceInScreenWidths(seat.position, screen),
    fieldOfViewDeg: screenFieldOfViewDeg(seat.position, screen),
    zone: seatZone(seat, range),
    lateralOffsetM: seat.position.x - screen.centerX,
    basis: auditorium.geometry.positionMethod === "surveyed" ? "measured" : "estimated",
  };
}
