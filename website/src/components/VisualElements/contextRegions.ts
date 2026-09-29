// Pure layout model for context-region figures: a stack of weighted tiles
// (context elements) over the shared attention zones (contextZones.ts).
// Extracted and generalized from ContextPressureDiagram — every context
// figure lays its tiles out through these helpers so min-heights, collapse
// semantics, and zone membership behave identically everywhere.

import { DIAGRAM_HALF } from './diagramScale.ts';
import { zoneAtOffset, type AttentionZone } from './contextZones.ts';

export type ContextRegionRow = {
  id: string;
  // Proportional share of the stack — tokens, px, any consistent unit.
  weight: number;
  // Readable floor in px (default REGION_MIN_HEIGHT).
  minHeight?: number;
  // Out-transition: the row collapses to zero height and fades.
  collapsed?: boolean;
  // Fills leftover stack height (fixed diagram heights, no page re-layout)
  // but is NOT content: spacers are excluded from the zone scale, which
  // spans the first content tile's top to the last content tile's bottom.
  spacer?: boolean;
};

export const REGION_MIN_HEIGHT = 24;

export type ResolvedRegionGeometry = {
  height: number;
  contentTop: number;
  contentHeight: number;
  contentBottom: number;
  rowHeights: Record<string, number>;
};

export type ContextRegionLayout = {
  top: number;
  height: number;
  bottom: number;
  collapsed: boolean;
};

export type ExitingContextRegion<T extends ContextRegionRow> = {
  row: T;
  layout: ContextRegionLayout;
};

// Removed rows leave the flow but keep their last geometry until their fade
// completes; flex redistribution must never reposition an exit.
export function exitingContextRegions<T extends ContextRegionRow>(
  previous: readonly T[],
  next: readonly ContextRegionRow[],
  layouts: Readonly<Record<string, ContextRegionLayout>>
): ExitingContextRegion<T>[] {
  const nextIds = new Set(next.map((row) => row.id));
  return previous.flatMap((row) => {
    const layout = layouts[row.id];
    return !nextIds.has(row.id) && layout ? [{ row, layout }] : [];
  });
}

function visibleRows(rows: readonly ContextRegionRow[]) {
  return rows.filter((row) => !row.collapsed && row.weight > 0);
}

function contentRows(rows: readonly ContextRegionRow[]) {
  return visibleRows(rows).filter((row) => !row.spacer);
}

// Readable floors for every visible row, keyed by id.
function rowFloors(
  rows: readonly ContextRegionRow[],
  minHeight: number
): Record<string, number> {
  return Object.fromEntries(
    visibleRows(rows).map((row) => [row.id, row.minHeight ?? minHeight])
  );
}

/** The floors a stack declares, before any height is available. A figure derives
    its canvas from this (`stackHeight`), so it is also the loud failure point:
    a canvas that cannot hold every floor means the canvas was guessed, not derived. */
export function contentFloorHeight(
  rows: readonly ContextRegionRow[],
  minHeight = REGION_MIN_HEIGHT
): number {
  return Object.values(rowFloors(rows, minHeight)).reduce(
    (sum, floor) => sum + floor,
    0
  );
}

// Snap DOWN to the sanctioned 4px half-step. Content only: floors are multiples
// of DIAGRAM_HALF, so a snapped row can never fall back below its own floor.
function snapDown(value: number) {
  return Math.floor(value / DIAGRAM_HALF) * DIAGRAM_HALF;
}

// Exact pixel heights (single source of truth; no re-normalisation downstream).
// Water-filling fixed point: pin every visible row whose proportional share of
// the remaining pool falls below its floor, then re-split the residual pool
// among the still-active rows by weight. Each pass pins at least one row, so it
// terminates, and no pinned row can be re-scaled below its floor afterwards.
// Heights snap to DIAGRAM_HALF; the rounding residue lands on the spacer so the
// stack still sums to exactly `containerHeight`.
export function layoutRows(
  rows: readonly ContextRegionRow[],
  containerHeight: number,
  minHeight = REGION_MIN_HEIGHT
): Record<string, number> {
  const visible = visibleRows(rows);
  const totalWeight = visible.reduce((sum, row) => sum + row.weight, 0);
  if (totalWeight <= 0 || containerHeight <= 0) return {};

  const floors = rowFloors(visible, minHeight);
  const pinnedFloor = contentFloorHeight(visible, minHeight);
  if (pinnedFloor > containerHeight) {
    throw new Error(
      `layoutRows: ${pinnedFloor}px of readable floors cannot fit a ${containerHeight}px canvas`
    );
  }

  let active = [...visible];
  let pool = containerHeight;
  const heights: Record<string, number> = {};
  for (;;) {
    const weight = active.reduce((sum, row) => sum + row.weight, 0);
    const below = active.filter(
      (row) => (row.weight / weight) * pool < floors[row.id]
    );
    if (below.length === 0) break;
    for (const row of below) {
      heights[row.id] = floors[row.id];
      pool -= floors[row.id];
    }
    const pinned = new Set(below.map((row) => row.id));
    active = active.filter((row) => !pinned.has(row.id));
  }

  const weight = active.reduce((sum, row) => sum + row.weight, 0);
  if (active.length === 0) return heights;
  const spacer = active.find((row) => row.spacer);
  for (const row of active) {
    heights[row.id] = snapDown((row.weight / weight) * pool);
  }
  // Residue = whatever snapping withheld from the content rows. The spacer owns
  // it (it is not content, so its height is the stack's free variable); without
  // a spacer the heaviest row absorbs it so the stack still fills the canvas.
  const snapped = active.reduce(
    (sum, row) => sum + (row.spacer ? 0 : heights[row.id]),
    0
  );
  const residue = pool - snapped - (spacer ? heights[spacer.id] : 0);
  const owner =
    spacer ??
    active.reduce((heavy, row) => (row.weight > heavy.weight ? row : heavy));
  heights[owner.id] += residue;
  return heights;
}

export function resolveRegionGeometry(
  rows: readonly ContextRegionRow[],
  height: number
): ResolvedRegionGeometry {
  const rowHeights: Record<string, number> = layoutRows(rows, height);
  let top = 0;
  let first: number | null = null;
  let last = 0;
  for (const row of rows) {
    const rowHeight = rowHeights[row.id] ?? 0;
    if (rowHeight > 0 && !row.spacer) {
      first ??= top;
      last = top + rowHeight;
    }
    top += rowHeight;
  }
  const contentTop = first ?? 0;
  return {
    height,
    contentTop,
    contentHeight: last - contentTop,
    contentBottom: last,
    rowHeights,
  };
}

// Center of a row as a fraction of the CONTENT span [0..1] (spacers
// excluded) — where the row sits on the attention curve. Throws on unknown
// id: a missing row is a caller bug, not a renderable state.
export function fractionOfRow(
  rowId: string,
  rows: readonly ContextRegionRow[]
): number {
  const content = contentRows(rows);
  const totalWeight = content.reduce((sum, row) => sum + row.weight, 0);
  let before = 0;
  for (const row of content) {
    if (row.id === rowId) {
      return totalWeight > 0 ? (before + row.weight / 2) / totalWeight : 0.5;
    }
    before += row.weight;
  }
  throw new Error(`fractionOfRow: no content row with id "${rowId}"`);
}

// Zone of a row by its content fraction — attention zones cover the filled
// context, never empty window.
export function zoneOfRow(
  rowId: string,
  rows: readonly ContextRegionRow[]
): AttentionZone {
  const content = contentRows(rows);
  const totalWeight = content.reduce((sum, row) => sum + row.weight, 0);
  return zoneAtOffset(fractionOfRow(rowId, rows) * totalWeight, totalWeight);
}

// Content span as fractions of the visible stack [0..1]: the zone backdrop
// stretches between these anchors. [0, 1] when every row is content.
export function contentExtent(rows: readonly ContextRegionRow[]): {
  top: number;
  bottom: number;
} {
  const visible = visibleRows(rows);
  const total = visible.reduce((sum, row) => sum + row.weight, 0);
  if (total <= 0) return { top: 0, bottom: 1 };
  let acc = 0;
  let top = -1;
  let bottom = 0;
  for (const row of visible) {
    if (!row.spacer) {
      if (top < 0) top = acc / total;
      bottom = (acc + row.weight) / total;
    }
    acc += row.weight;
  }
  return { top: Math.max(0, top), bottom };
}
