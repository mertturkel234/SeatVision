import type { Auditorium, Seat, SeatPosition, ScreenGeometry } from "./types";
import { horizontalAngleDeg, screenFieldOfViewDeg } from "./geometry";

/**
 * 3D Auditorium Spatial Coordinates Specification:
 * - Origin (0, 0, 0) is at the floor directly beneath the screen center.
 * - +X points to the right (facing the screen: negative X is left, positive X is right).
 * - +Y points up (elevation / stadium riser height).
 * - +Z points into the auditorium (away from the screen towards the rear rows).
 */

/** Elevation rise per row in metres (standard stadium cinema rake). */
export const ROW_ELEVATION_STEP_M = 0.32;

/** Seated eye height above the seat base in metres. */
export const SEATED_EYE_HEIGHT_M = 0.85;

/** Base screen elevation above stage floor in metres. */
export const SCREEN_ELEVATION_Y_M = 1.6;

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Seat3DPosition {
  seatId: string;
  position: Vector3D;
  /** Y-rotation in radians so the seat faces towards the screen center. */
  rotationY: number;
  rowIndex: number;
  elevation: number;
}

export interface ViewFromSeatCamera {
  position: Vector3D;
  target: Vector3D;
  fovDeg: number;
  distanceToScreenM: number;
  horizontalAngleDeg: number;
}

export interface Auditorium3DBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  width: number;
  length: number;
  height: number;
  center: Vector3D;
  screenWidthM: number;
  screenHeightM: number;
  screenCenter: Vector3D;
}

/**
 * Calculates row platform elevation. First 2 rows (A, B) have gentle slope,
 * subsequent rows step up by ROW_ELEVATION_STEP_M for clear sightlines.
 */
export function calculateRowElevation(rowIndex: number): number {
  if (rowIndex <= 0) return 0.15;
  if (rowIndex === 1) return 0.35;
  return 0.35 + (rowIndex - 1) * ROW_ELEVATION_STEP_M;
}

/**
 * Computes exact 3D coordinates and orientation for a seat in auditorium space.
 */
export function get3DSeatCoordinates(auditorium: Auditorium, seat: Seat): Seat3DPosition {
  const rowOrder = auditorium.geometry.rowOrder;
  const rowIndex = Math.max(0, rowOrder.indexOf(seat.row));
  const elevation = calculateRowElevation(rowIndex);

  const x = seat.position ? seat.position.x : 0;
  const z = seat.position ? seat.position.y : 6 + rowIndex * 1.0;
  const y = elevation;

  // Seat faces the screen center at (0, SCREEN_ELEVATION_Y_M, 0)
  // Angle between seat and screen center in X-Z plane
  const angleRad = Math.atan2(x, z);

  return {
    seatId: seat.id,
    position: { x, y, z },
    rotationY: -angleRad * 0.45, // gentle natural angling towards screen
    rowIndex,
    elevation,
  };
}

/**
 * Computes camera position, target, and FOV for the "View From Seat" 3D camera mode.
 */
export function getViewFromSeatCamera(
  auditorium: Auditorium,
  seat: Seat
): ViewFromSeatCamera {
  const seat3D = get3DSeatCoordinates(auditorium, seat);
  const screen = auditorium.geometry.screen ?? { widthM: 12, centerX: 0 };
  const screenHeightM = screen.widthM / (16 / 9); // standard 16:9 cinema aspect

  const cameraPosition: Vector3D = {
    x: seat3D.position.x,
    y: seat3D.position.y + SEATED_EYE_HEIGHT_M,
    z: seat3D.position.z,
  };

  const cameraTarget: Vector3D = {
    x: screen.centerX,
    y: SCREEN_ELEVATION_Y_M + screenHeightM * 0.45,
    z: 0,
  };

  const pos2D: SeatPosition = seat.position ?? { x: 0, y: seat3D.position.z };
  const fovDeg = screenFieldOfViewDeg(pos2D, screen);
  const angleDeg = horizontalAngleDeg(pos2D, screen);

  const dx = cameraPosition.x - cameraTarget.x;
  const dy = cameraPosition.y - cameraTarget.y;
  const dz = cameraPosition.z - cameraTarget.z;
  const distanceToScreenM = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return {
    position: cameraPosition,
    target: cameraTarget,
    fovDeg: Math.max(25, Math.min(85, fovDeg)),
    distanceToScreenM,
    horizontalAngleDeg: angleDeg,
  };
}

/**
 * Computes bounding volume of the entire 3D auditorium for optimal camera framing.
 */
export function getAuditorium3DBounds(auditorium: Auditorium): Auditorium3DBounds {
  const screen = auditorium.geometry.screen ?? { widthM: 12, centerX: 0 };
  const screenHeightM = screen.widthM / (16 / 9);

  let minX = -screen.widthM / 2 - 2;
  let maxX = screen.widthM / 2 + 2;
  let minZ = -1;
  let maxZ = 10;
  let minY = 0;
  let maxY = SCREEN_ELEVATION_Y_M + screenHeightM + 2;

  auditorium.seats.forEach((seat) => {
    const coords = get3DSeatCoordinates(auditorium, seat);
    if (coords.position.x - 1 < minX) minX = coords.position.x - 1;
    if (coords.position.x + 1 > maxX) maxX = coords.position.x + 1;
    if (coords.position.z + 2 > maxZ) maxZ = coords.position.z + 2;
    if (coords.position.y + 2 > maxY) maxY = coords.position.y + 2;
  });

  const width = maxX - minX;
  const length = maxZ - minZ;
  const height = maxY - minY;

  const center: Vector3D = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    z: (minZ + maxZ) / 2,
  };

  const screenCenter: Vector3D = {
    x: screen.centerX,
    y: SCREEN_ELEVATION_Y_M + screenHeightM / 2,
    z: 0,
  };

  return {
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
    width,
    length,
    height,
    center,
    screenWidthM: screen.widthM,
    screenHeightM,
    screenCenter,
  };
}

/**
 * Safe client-side WebGL capability detection.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}
