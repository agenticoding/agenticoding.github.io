// Shared weight-row primitives for context-mass figures on the ContextRegions
// foundation (MCP tool schema, skills invocation, sub-agent fan-out). Each
// figure appends a headroom spacer so content + headroom === capacity in
// every state; capacity stays per-figure and arrives as a parameter.

import {
  contentFloorHeight,
  fractionOfRow,
  type ContextRegionRow,
} from './contextRegions.ts';
import { gridUp } from './diagramScale.ts';
import { attentionAt } from './attentionModel.ts';

// Minimal row shape every weight model builds on: renderable plus a label.
export type WeightContextRow = ContextRegionRow & { label: string };

// Full-size blocks make prefix payload and shared task work legible. Compact
// rows represent individual runtime messages or expanded payloads.
export const BLOCK_WEIGHT = 18;
export const MIX_ROW_WEIGHT = 12;

// Readable floors, both on the sanctioned DIAGRAM_HALF (4px) step: a block one
// grid cell, a compact row two half-steps. 18px was on no sanctioned step.
// A figure whose rows carry their own vertical requirement (the sub-agent
// fan-out's flow lanes) passes an explicit floor instead.
const BLOCK_MIN_HEIGHT = 24;
const MIX_MIN_HEIGHT = 16;

export function block(
  id: string,
  label: string,
  weight = BLOCK_WEIGHT,
  minHeight = BLOCK_MIN_HEIGHT
): WeightContextRow {
  return { id, label, weight, minHeight };
}

export function mixRow(
  id: string,
  label: string,
  weight = MIX_ROW_WEIGHT,
  minHeight = MIX_MIN_HEIGHT
): WeightContextRow {
  return { id, label, weight, minHeight };
}

export function contextContentWeight(rows: readonly ContextRegionRow[]) {
  return rows
    .filter((row) => !row.collapsed && row.weight > 0 && !row.spacer)
    .reduce((sum, row) => sum + row.weight, 0);
}

/** Canvas the content needs so every row can sit on its floor, then scaled by
    the figure's capacity share of headroom. Derived, never guessed: the `throw`
    in `layoutRows` fires if a hand-picked canvas cannot hold these floors. */
export function pxPerUnit(rows: readonly ContextRegionRow[]): number {
  const weight = contextContentWeight(rows);
  return weight > 0 ? contentFloorHeight(rows) / weight : 0;
}

/** Grid-legal canvas for a figure whose content floors are `rows` and whose
    window capacity is `capacity` weight units. Headroom scales with the same
    ledger unit as content, so the canvas stays proportional to the window.
    `floorCanvas` is the alternative for a figure that spends its height on the
    rows instead of on the window's spare capacity. */
export function stackHeight(
  rows: readonly ContextRegionRow[],
  capacity: number
): number {
  const needed = Math.max(contentFloorHeight(rows), capacity * pxPerUnit(rows));
  return gridUp(needed);
}

/** Canvas that holds a ledger's floors exactly — the row-sized counterpart of
    `stackHeight`. Use it when the rows are sized for legibility (a row must
    carry its own flow lane) rather than for their share of the window: the
    ledger then ends where its content ends, with no spare-capacity void. */
export function floorCanvas(rows: readonly ContextRegionRow[]): number {
  return gridUp(contentFloorHeight(rows));
}

export { contentFloorHeight };

/** Largest ledger canvas a figure needs across its interactive states, so one
    stable panel height can host every state's floors. */
export function ledgerCanvas(
  states: Iterable<readonly ContextRegionRow[]>,
  capacity: number
): number {
  let canvas = 0;
  for (const rows of states) {
    canvas = Math.max(canvas, stackHeight(rows, capacity));
  }
  return canvas;
}

// Leftover capacity as a spacer row: fills stack height without entering the
// zone scale (contextRegions.ts excludes spacers from content geometry).
export function headroom(content: number, capacity: number): WeightContextRow {
  return {
    id: 'headroom',
    label: '',
    weight: Math.max(0, capacity - content),
    minHeight: 0,
    spacer: true,
  };
}

export function withHeadroom(
  rows: WeightContextRow[],
  capacity: number
): WeightContextRow[] {
  return [...rows, headroom(contextContentWeight(rows), capacity)];
}

export function windowFill(
  rows: readonly ContextRegionRow[],
  capacity: number
): number {
  return contextContentWeight(rows) / capacity;
}

export function tileAttention(
  rowId: string,
  rows: readonly ContextRegionRow[],
  capacity: number
): number {
  return attentionAt(fractionOfRow(rowId, rows), windowFill(rows, capacity));
}
