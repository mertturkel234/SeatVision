import { describe, expect, it } from "vitest";
import { rankMovies } from "../discovery";
import { buildExperienceRows } from "../experiences";
import { seatMetrics } from "../geometry";
import { auditoriums, availability, cinemas, movies, pricing, screenings } from "@/lib/data/demo/dataset";
import { testAuditorium } from "./fixtures";

describe("rule-based discovery", () => {
  it("returns every movie when no preferences are set", () => {
    expect(rankMovies(movies, screenings, { genres: [], mood: null, experience: null })).toHaveLength(movies.length);
  });

  it("ranks by transparent points and explains matches", () => {
    const ranked = rankMovies(movies, screenings, { genres: ["thriller"], mood: "spectacle", experience: "large-format" });
    expect(ranked[0].movie.id).toBe("m-orbit"); // thriller(3) + spectacle(2) + large-format(1)
    expect(ranked[0].score).toBe(6);
    expect(ranked[0].reasons).toHaveLength(3);
    expect(ranked.every((r) => r.score > 0)).toBe(true);
  });

  it("returns an empty list when nothing matches", () => {
    expect(rankMovies(movies.filter((m) => m.genres.includes("documentary")), screenings, { genres: ["action"], mood: null, experience: null })).toEqual([]);
  });
});

describe("experience comparison", () => {
  it("never invents prices or availability", () => {
    const rows = buildExperienceRows({ screenings, cinemas, auditoriums, availability: [], pricing: [] });
    expect(rows.every((r) => r.priceRange === null && r.availableSeats === null)).toBe(true);
  });
  it("computes price ranges from known categories only", () => {
    const rows = buildExperienceRows({ screenings, cinemas, auditoriums, availability, pricing });
    const threeD = rows.find((r) => r.format === "3d")!;
    expect(threeD.priceRange!.min).toEqual(threeD.priceRange!.max);
  });
});

describe("geometry", () => {
  it("computes angle and distance for a centred seat", () => {
    const aud = testAuditorium();
    const seat = aud.seats.find((s) => s.id === "B1")!;
    const m = seatMetrics(aud, { ...seat, position: { x: 0, y: 8 } });
    expect(m.angleDeg).toBe(0);
    expect(m.distanceM).toBe(8);
    expect(m.distanceScreenWidths).toBe(1);
    expect(m.basis).toBe("measured");
  });
  it("reports unknown metrics without a screen", () => {
    const aud = testAuditorium();
    const m = seatMetrics({ ...aud, geometry: { ...aud.geometry, screen: null } }, aud.seats[0]);
    expect(m.angleDeg).toBeNull();
    expect(m.basis).toBe("unknown");
  });
});
