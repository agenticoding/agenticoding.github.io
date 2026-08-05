// Shared weight-row primitives for context-mass figures on the ContextRegions
// foundation (MCP tool schema, skills invocation, sub-agent fan-out). Each
// figure appends a headroom spacer so content + headroom === capacity in
// every state; capacity stays per-figure and arrives as a parameter.

import { fractionOfRow, type ContextRegionRow } from './contextRegions.ts';
import { attentionAt } from './attentionModel.ts';

// Minimal row shape every weight model builds on: renderable plus a label.
export type WeightContextRow = ContextRegionRow & { label: string };

// Full-size blocks make prefix payload and shared task work legible. Compact
// rows represent individual runtime messages or expanded payloads.
export const BLOCK_WEIGHT = 18;
export const MIX_ROW_WEIGHT = 12;

const BLOCK_MIN_HEIGHT = 18;
const MIX_MIN_HEIGHT = 16;

export function block(
  id: string,
  label: string,
  weight = BLOCK_WEIGHT
): WeightContextRow {
  return { id, label, weight, minHeight: BLOCK_MIN_HEIGHT };
}

export function mixRow(
  id: string,
  label: string,
  weight = MIX_ROW_WEIGHT
): WeightContextRow {
  return { id, label, weight, minHeight: MIX_MIN_HEIGHT };
}

export function contextContentWeight(rows: readonly ContextRegionRow[]) {
  return rows
    .filter((row) => !row.collapsed && row.weight > 0 && !row.spacer)
    .reduce((sum, row) => sum + row.weight, 0);
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
