import "server-only";
import { DemoRepository } from "./demo/demo-repository";
import type { SeatVisionRepository } from "./repository";

let instance: SeatVisionRepository | null = null;

/**
 * Returns the configured repository. Only the demo implementation exists
 * today; `SEATVISION_DATA_MODE=live` is reserved for a future authorised
 * integration and intentionally fails loudly instead of faking live data.
 */
export function getRepository(): SeatVisionRepository {
  if (instance) return instance;
  const mode = process.env.SEATVISION_DATA_MODE ?? "demo";
  if (mode !== "demo") {
    throw new Error(`SEATVISION_DATA_MODE="${mode}" is not supported yet. Only "demo" is implemented.`);
  }
  instance = new DemoRepository();
  return instance;
}

export type { SeatVisionRepository, ScreeningBundle } from "./repository";
export { loadScreeningBundle } from "./repository";
