import { describe, expect, it } from "vitest";
import {
  calculateRowElevation,
  get3DSeatCoordinates,
  getViewFromSeatCamera,
  getAuditorium3DBounds,
  ROW_ELEVATION_STEP_M,
  SEATED_EYE_HEIGHT_M,
} from "../geometry-3d";
import { testAuditorium } from "./fixtures";

describe("geometry-3d", () => {
  it("calculates stepped row elevations", () => {
    const el0 = calculateRowElevation(0); // Row A
    const el1 = calculateRowElevation(1); // Row B
    const el2 = calculateRowElevation(2); // Row C
    expect(el0).toBeGreaterThan(0);
    expect(el1).toBeGreaterThan(el0);
    expect(el2 - el1).toBeCloseTo(ROW_ELEVATION_STEP_M);
  });

  it("maps 2D seat coordinates to 3D space with correct orientation", () => {
    const aud = testAuditorium();
    const seatA1 = aud.seats.find((s) => s.id === "A1")!;
    const seat3D = get3DSeatCoordinates(aud, seatA1);

    expect(seat3D.seatId).toBe("A1");
    expect(seat3D.position.x).toBe(seatA1.position!.x);
    expect(seat3D.position.z).toBe(seatA1.position!.y);
    expect(seat3D.position.y).toBe(calculateRowElevation(0));
    // Off-axis seats rotate slightly to face the screen center
    expect(typeof seat3D.rotationY).toBe("number");
  });

  it("calculates View From Seat camera pointing toward screen center", () => {
    const aud = testAuditorium();
    const seatC2 = aud.seats.find((s) => s.id === "C2")!;
    const cam = getViewFromSeatCamera(aud, seatC2);

    expect(cam.position.x).toBe(seatC2.position!.x);
    expect(cam.position.z).toBe(seatC2.position!.y);
    expect(cam.position.y).toBe(calculateRowElevation(2) + SEATED_EYE_HEIGHT_M);
    // Target is screen center at z = 0
    expect(cam.target.z).toBe(0);
    expect(cam.target.x).toBe(0);
    expect(cam.distanceToScreenM).toBeGreaterThan(5);
    expect(cam.fovDeg).toBeGreaterThan(20);
    expect(cam.fovDeg).toBeLessThan(90);
  });

  it("computes auditorium 3D bounds enclosing all seats and screen", () => {
    const aud = testAuditorium();
    const bounds = getAuditorium3DBounds(aud);

    expect(bounds.width).toBeGreaterThan(aud.geometry.screen!.widthM);
    expect(bounds.length).toBeGreaterThan(8);
    expect(bounds.height).toBeGreaterThan(3);
    expect(bounds.screenCenter.z).toBe(0);
  });
});
