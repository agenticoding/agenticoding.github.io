// Pure layout model for context-region figures: a stack of weighted tiles
// (context elements) over the shared attention zones (contextZones.ts).
// Extracted and generalized from ContextPressureDiagram — every context
// figure lays its tiles out through these helpers so min-heights, collapse
// semantics, and zone membership behave identically everywhere.

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

// Weight shares with a readable px floor (generalized redistributeWithMinHeight).
// Rows below the floor are pinned to it; the rest split the remaining height
// by weight. The scene resolves the shares into exact animated rectangles.
export function layoutRows(
  rows: readonly ContextRegionRow[],
  containerHeight: number,
  minHeight = REGION_MIN_HEIGHT
): Record<string, number> {
  const visible = visibleRows(rows);
  const totalWeight = visible.reduce((sum, row) => sum + row.weight, 0);
  if (totalWeight <= 0 || containerHeight <= 0) return {};

  const minimums = visible.map((row) => row.minHeight ?? minHeight);
  const rawHeights = visible.map(
    (row) => (row.weight / totalWeight) * containerHeight
  );
  const belowMin = rawHeights.map((height, i) => height < minimums[i]);

  if (!belowMin.some(Boolean)) {
    return Object.fromEntries(visible.map((row) => [row.id, row.weight]));
  }

  const reserved = minimums.reduce(
    (total, minimum, i) => total + (belowMin[i] ? minimum : 0),
    0
  );
  const largeWeight = visible
    .filter((_, i) => !belowMin[i])
    .reduce((sum, row) => sum + row.weight, 0);
  const remaining = Math.max(0, containerHeight - reserved);

  const shares: Record<string, number> = {};
  visible.forEach((row, i) => {
    const height = belowMin[i]
      ? minimums[i]
      : largeWeight > 0
        ? (row.weight / largeWeight) * remaining
        : 0;
    shares[row.id] = (height / containerHeight) * totalWeight;
  });
  return shares;
}

export function resolveRegionGeometry(
  rows: readonly ContextRegionRow[],
  height: number
): ResolvedRegionGeometry {
  const shares = layoutRows(rows, height);
  const total = Object.values(shares).reduce((sum, share) => sum + share, 0);
  const rowHeights: Record<string, number> = {};
  let top = 0;
  let first: number | null = null;
  let last = 0;
  for (const row of rows) {
    const rowHeight = total > 0 ? (height * (shares[row.id] ?? 0)) / total : 0;
    rowHeights[row.id] = rowHeight;
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
