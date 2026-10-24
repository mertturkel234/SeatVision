import type { Auditorium, Seat } from "./types";

/**
 * Physical adjacency helpers.
 *
 * Adjacency is defined ONLY by each seat's explicit `rightNeighborId`. Seat
 * labels (e.g. "F7", "F8") are never used to infer that two seats touch —
 * aisles, gaps, staggered rows and renumbered blocks all break that assumption.
 */

export interface LayoutIssue {
  seatId: string;
  message: string;
}

export function indexSeats(auditorium: Auditorium): Map<string, Seat> {
  return new Map(auditorium.seats.map((s) => [s.id, s]));
}

export function leftNeighborMap(auditorium: Auditorium): Map<string, string> {
  const left = new Map<string, string>();
  for (const seat of auditorium.seats) {
    if (seat.rightNeighborId) left.set(seat.rightNeighborId, seat.id);
  }
  return left;
}

/** Validates adjacency links so that block search can trust them. */
export function validateLayout(auditorium: Auditorium): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  const seats = indexSeats(auditorium);
  const incoming = new Map<string, number>();
  const ids = new Set<string>();

  for (const seat of auditorium.seats) {
    if (ids.has(seat.id)) issues.push({ seatId: seat.id, message: "Duplicate seat id." });
    ids.add(seat.id);
    if (!seat.rightNeighborId) continue;
    const right = seats.get(seat.rightNeighborId);
    if (!right) {
      issues.push({ seatId: seat.id, message: `Right neighbour ${seat.rightNeighborId} does not exist.` });
      continue;
    }
    if (right.id === seat.id) issues.push({ seatId: seat.id, message: "Seat lists itself as neighbour." });
    if (right.row !== seat.row) {
      issues.push({ seatId: seat.id, message: `Right neighbour ${right.id} is in a different row.` });
    }
    incoming.set(right.id, (incoming.get(right.id) ?? 0) + 1);
  }
  for (const [id, count] of incoming) {
    if (count > 1) issues.push({ seatId: id, message: "Seat has more than one left neighbour." });
  }
  // Cycle detection: walking right from any seat must terminate.
  for (const seat of auditorium.seats) {
    const visited = new Set<string>();
    let cur: Seat | undefined = seat;
    while (cur?.rightNeighborId) {
      if (visited.has(cur.id)) {
        issues.push({ seatId: seat.id, message: "Adjacency cycle detected." });
        break;
      }
      visited.add(cur.id);
      cur = seats.get(cur.rightNeighborId);
    }
  }
  return issues;
}

/** True when `ids` (in order, left to right) form a physically connected run. */
export function isPhysicallyContiguous(auditorium: Auditorium, ids: string[]): boolean {
  if (ids.length === 0) return false;
  const seats = indexSeats(auditorium);
  for (let i = 0; i < ids.length - 1; i++) {
    const seat = seats.get(ids[i]);
    if (!seat || seat.rightNeighborId !== ids[i + 1]) return false;
  }
  return seats.has(ids[ids.length - 1]);
}

/**
 * Every run of `size` physically connected seats where each seat passes
 * `isEligible`. Runs are returned left to right.
 */
export function findContiguousBlocks(
  auditorium: Auditorium,
  size: number,
  isEligible: (seat: Seat) => boolean,
): Seat[][] {
  if (!Number.isInteger(size) || size < 1) return [];
  const seats = indexSeats(auditorium);
  const blocks: Seat[][] = [];
  for (const start of auditorium.seats) {
    const block: Seat[] = [];
    let cur: Seat | undefined = start;
    while (cur && block.length < size && isEligible(cur)) {
      block.push(cur);
      if (block.length === size) break;
      cur = cur.rightNeighborId ? seats.get(cur.rightNeighborId) : undefined;
    }
    if (block.length === size) blocks.push(block);
  }
  return blocks;
}

/** Length of the longest run of connected seats passing `isEligible`. */
export function longestContiguousRun(auditorium: Auditorium, isEligible: (seat: Seat) => boolean): number {
  const seats = indexSeats(auditorium);
  const left = leftNeighborMap(auditorium);
  let best = 0;
  for (const seat of auditorium.seats) {
    // Only start counting at the left end of an eligible run.
    const leftId = left.get(seat.id);
    const leftSeat = leftId ? seats.get(leftId) : undefined;
    if (!isEligible(seat) || (leftSeat && isEligible(leftSeat))) continue;
    let len = 0;
    let cur: Seat | undefined = seat;
    while (cur && isEligible(cur) && len <= auditorium.seats.length) {
      len++;
      cur = cur.rightNeighborId ? seats.get(cur.rightNeighborId) : undefined;
    }
    best = Math.max(best, len);
  }
  return best;
}
