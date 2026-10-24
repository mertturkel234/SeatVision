import type {
  Auditorium,
  DataSource,
  ExperienceFormat,
  Obstruction,
  PositionMethod,
  Seat,
  SeatCategory,
  SeatKind,
} from "@/lib/domain/types";

/**
 * Builds deterministic demo auditoriums with explicit metric geometry and
 * explicit adjacency. Rows may be curved, staggered, split into blocks by
 * aisles, or split into pairs — so seat labels are deliberately NOT a reliable
 * guide to physical adjacency.
 */

export interface RowSpec {
  label: string;
  /** Seats per block, left to right. Must not exceed the block template. */
  blocks: number[];
  category: { value: SeatCategory; verified: boolean } | null;
  /** Lateral stagger in metres. */
  offsetX?: number;
  /** seat number → kind */
  kinds?: Record<number, SeatKind>;
}

export interface AuditoriumSpec {
  id: string;
  cinemaId: string;
  name: string;
  format: ExperienceFormat;
  screenWidthM: number | null;
  positionMethod: PositionMethod;
  source: DataSource;
  firstRowY: number;
  rowSpacing: number;
  /** Extra depth (m) inserted AFTER the given row label, e.g. a cross-aisle. */
  gapsAfterRow?: Record<string, number>;
  seatWidth: number;
  aisleWidth: number;
  /** Max seats per block — keeps aisles aligned across rows. */
  blockTemplate: number[];
  /** Row curvature: extra depth = curvature * x². */
  curvature?: number;
  /** If set, seats inside a block are grouped in chunks with a gap (e.g. recliner pairs). */
  chunk?: { size: number; gapM: number };
  rows: RowSpec[];
  obstructions?: Record<string, Obstruction>;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

export function buildAuditorium(spec: AuditoriumSpec): Auditorium {
  const chunkGaps = (count: number) => (spec.chunk ? Math.max(0, Math.ceil(count / spec.chunk.size) - 1) * spec.chunk.gapM : 0);
  const slotWidths = spec.blockTemplate.map((n) => n * spec.seatWidth + chunkGaps(n));
  const totalWidth = slotWidths.reduce((a, b) => a + b, 0) + (slotWidths.length - 1) * spec.aisleWidth;

  const seats: Seat[] = [];
  let extraDepth = 0;
  spec.rows.forEach((row, rowIdx) => {
    const baseY = spec.firstRowY + rowIdx * spec.rowSpacing + extraDepth;
    let slotStart = -totalWidth / 2;
    let number = 1;
    row.blocks.forEach((count, blockIdx) => {
      const template = spec.blockTemplate[blockIdx];
      if (count > template) throw new Error(`Row ${row.label} block ${blockIdx} exceeds template.`);
      const blockWidth = count * spec.seatWidth + chunkGaps(count);
      const offset = (slotWidths[blockIdx] - blockWidth) / 2;
      let cursor = slotStart + offset;
      const blockSeats: Seat[] = [];
      for (let i = 0; i < count; i++) {
        if (spec.chunk && i > 0 && i % spec.chunk.size === 0) cursor += spec.chunk.gapM;
        const x = cursor + spec.seatWidth / 2 + (row.offsetX ?? 0);
        cursor += spec.seatWidth;
        const id = `${spec.id}-${row.label}${number}`;
        blockSeats.push({
          id,
          row: row.label,
          number,
          label: `${row.label}${number}`,
          kind: row.kinds?.[number] ?? "standard",
          position: { x: round(x), y: round(baseY + (spec.curvature ?? 0) * x * x) },
          category: row.category,
          rightNeighborId: null,
          obstruction: spec.obstructions?.[`${row.label}${number}`] ?? null,
        });
        number++;
      }
      // Explicit adjacency: only within a block, and only within a chunk.
      for (let i = 0; i < blockSeats.length - 1; i++) {
        const breaksChunk = spec.chunk && (i + 1) % spec.chunk.size === 0;
        if (!breaksChunk) blockSeats[i].rightNeighborId = blockSeats[i + 1].id;
      }
      seats.push(...blockSeats);
      slotStart += slotWidths[blockIdx] + spec.aisleWidth;
    });
    extraDepth += spec.gapsAfterRow?.[row.label] ?? 0;
  });

  return {
    id: spec.id,
    cinemaId: spec.cinemaId,
    name: spec.name,
    format: spec.format,
    geometry: {
      screen: spec.screenWidthM ? { widthM: spec.screenWidthM, centerX: 0 } : null,
      positionMethod: spec.positionMethod,
      rowOrder: spec.rows.map((r) => r.label),
      source: spec.source,
    },
    seats,
    provenance: { source: spec.source, note: "Fictional demo auditorium generated for SeatVision." },
  };
}
