import { describe, expect, it } from "vitest";
import { findContiguousBlocks, isPhysicallyContiguous, longestContiguousRun, validateLayout } from "../adjacency";
import { auditoriums } from "@/lib/data/demo/dataset";
import { testAuditorium } from "./fixtures";

describe("adjacency", () => {
  it("does not treat consecutive labels across an aisle as adjacent", () => {
    const aud = testAuditorium();
    expect(isPhysicallyContiguous(aud, ["A2", "A3"])).toBe(false);
    expect(isPhysicallyContiguous(aud, ["A1", "A2"])).toBe(true);
    expect(isPhysicallyContiguous(aud, ["C2", "C3"])).toBe(true);
  });

  it("finds only physically connected blocks", () => {
    const aud = testAuditorium();
    const pairs = findContiguousBlocks(aud, 2, () => true).map((b) => b.map((s) => s.id).join("+"));
    expect(pairs).toContain("A1+A2");
    expect(pairs).not.toContain("A2+A3");
    const triples = findContiguousBlocks(aud, 3, () => true).map((b) => b.map((s) => s.id).join("+"));
    expect(triples).toEqual(["C1+C2+C3", "C2+C3+C4"]);
  });

  it("respects eligibility inside a block", () => {
    const aud = testAuditorium();
    const triples = findContiguousBlocks(aud, 3, (s) => s.id !== "C2");
    expect(triples).toHaveLength(0);
    expect(longestContiguousRun(aud, (s) => s.id !== "C2")).toBe(2);
  });

  it("rejects invalid group sizes", () => {
    expect(findContiguousBlocks(testAuditorium(), 0, () => true)).toEqual([]);
    expect(findContiguousBlocks(testAuditorium(), 1.5, () => true)).toEqual([]);
  });

  it("detects broken adjacency links", () => {
    const aud = testAuditorium();
    aud.seats[0] = { ...aud.seats[0], rightNeighborId: "Z9" };
    aud.seats[4] = { ...aud.seats[4], rightNeighborId: "C1" };
    const messages = validateLayout(aud).map((i) => i.message);
    expect(messages.some((m) => m.includes("does not exist"))).toBe(true);
    expect(messages.some((m) => m.includes("different row"))).toBe(true);
  });

  it("demo auditoriums have valid layouts and aisles break adjacency", () => {
    for (const aud of auditoriums) expect(validateLayout(aud)).toEqual([]);
    const hall1 = auditoriums.find((a) => a.id === "a-lumen-1")!;
    // F4 is the last seat of the left block, F5 the first of the centre block.
    expect(isPhysicallyContiguous(hall1, ["a-lumen-1-F4", "a-lumen-1-F5"])).toBe(false);
    const salon = auditoriums.find((a) => a.id === "a-aurora-vip")!;
    // Recliners come in pairs: A2 and A3 are separated by a gap.
    expect(isPhysicallyContiguous(salon, ["a-aurora-vip-A1", "a-aurora-vip-A2"])).toBe(true);
    expect(isPhysicallyContiguous(salon, ["a-aurora-vip-A2", "a-aurora-vip-A3"])).toBe(false);
  });
});
