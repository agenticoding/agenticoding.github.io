// Weight model for the Context Squeeze figure: WHERE THE USER PROMPT LANDS
// as conversation context builds after it, as a function of context-file
// size. Two panels share one conversation timeline (the same turns append in
// sync); only the startup context file differs. Small file: the appended
// turns outweigh the prefix, so the prompt travels up the stack and settles
// at the primacy edge. Big file: the fat prefix keeps the prompt pinned near
// the dead middle — the attention valley — no matter how many turns follow.
//
// Same conventions as MCPToolSchemaModel: weights are window-capacity
// shares, rows sum to content + headroom = WINDOW_CAPACITY, zones derive
// from position via zoneOfRow (content-relative; the headroom spacer is
// excluded), and attention comes from attentionAt — never re-derived.

import {
  fractionOfRow,
  zoneOfRow,
  type ContextRegionRow,
} from './contextRegions.ts';
import type { AttentionZone } from './contextZones.ts';
import { attentionAt } from './attentionModel.ts';

// Toy token units. The file weights keep the labels' 10× ratio (2K vs 20K);
// everything else is sized so both end-state outcomes hold under the shared
// attention model (asserted in contextSqueezeModel.test.ts):
//   small-file end: prompt fraction 26/126 = 0.206 (primacy), fill 0.656,
//     attention 0.831 — strong.
//   big-file end: prompt fraction 80/180 = 0.444 (dead middle), fill 0.938,
//     attention 0.225 — collapsed.
export const WINDOW_CAPACITY = 192;
export const SYSTEM_WEIGHT = 8;
export const TOOLS_WEIGHT = 8;
export const PROMPT_WEIGHT = 8;
export const SMALL_FILE_WEIGHT = 6;
export const BIG_FILE_WEIGHT = 60;
export const TURN_WEIGHT = 12;
export const TURN_COUNT = 8;

// Loop timing: discrete steps on an interval (NOT per-frame JS) — each tick
// is a row-state change and the foundation's flex transitions animate the
// pushing/resizing.
export const TURN_INTERVAL_MS = 900;
export const STARTUP_TICKS = 2; // hold on the recency-edge startup state
export const END_TICKS = 3; // hold the outcome before the loop resets
export const LOOP_TICKS = STARTUP_TICKS + TURN_COUNT + END_TICKS;

export type SqueezeContextRow = ContextRegionRow & { label: string };

// Turns appended at a loop tick: startup hold → one more turn per tick →
// end-state hold. The component wraps tick % LOOP_TICKS to loop.
export function turnsAtTick(tick: number): number {
  if (tick < STARTUP_TICKS) return 0;
  if (tick < STARTUP_TICKS + TURN_COUNT) return tick - STARTUP_TICKS + 1;
  return TURN_COUNT;
}

const BLOCK_MIN_HEIGHT = 20;
const TURN_MIN_HEIGHT = 18;

function block(id: string, label: string, weight: number): SqueezeContextRow {
  return { id, label, weight, minHeight: BLOCK_MIN_HEIGHT };
}

// All TURN_COUNT slots are always emitted; slots beyond the appended count
// are zero-weight + collapsed so each tick expands the next row in place and
// the foundation animates the push (the lazyRows idiom). zoneOfRow/
// fractionOfRow skip collapsed rows, so the visible accumulation stays
// contiguous: prefix, prompt, turns, headroom.
export function squeezeRows(
  fileWeight: number,
  turnsAppended: number
): SqueezeContextRow[] {
  const rows: SqueezeContextRow[] = [
    block('system', 'system prompt', SYSTEM_WEIGHT),
    block('tools', 'tool definitions', TOOLS_WEIGHT),
    block('file', 'AGENTS.md', fileWeight),
    block('prompt', 'USER PROMPT', PROMPT_WEIGHT),
  ];

  let content = SYSTEM_WEIGHT + TOOLS_WEIGHT + fileWeight + PROMPT_WEIGHT;
  for (let index = 0; index < TURN_COUNT; index += 1) {
    const appended = index < turnsAppended;
    if (appended) content += TURN_WEIGHT;
    rows.push({
      id: `turn-${index}`,
      label: `turn ${index + 1} — calls + replies`,
      weight: appended ? TURN_WEIGHT : 0,
      minHeight: TURN_MIN_HEIGHT,
      collapsed: !appended,
    });
  }

  // Unused window capacity: keeps tile heights window-proportional; a
  // spacer, so the zone scale spans only the filled context.
  rows.push({
    id: 'headroom',
    label: '',
    weight: Math.max(0, WINDOW_CAPACITY - content),
    minHeight: 0,
    spacer: true,
  });
  return rows;
}

// Window fill [0..1]: content over fixed capacity — drives the foundation's
// dynamic band shading (the valley deepens as turns append).
export function windowFill(rows: readonly SqueezeContextRow[]): number {
  const content = rows
    .filter((row) => !row.collapsed && row.weight > 0 && !row.spacer)
    .reduce((sum, row) => sum + row.weight, 0);
  return content / WINDOW_CAPACITY;
}

export function promptZone(rows: readonly SqueezeContextRow[]): AttentionZone {
  return zoneOfRow('prompt', rows);
}

// The figure's scored quantity: model attention on the prompt at its content
// position under this panel's fill.
export function promptAttention(rows: readonly SqueezeContextRow[]): number {
  return attentionAt(fractionOfRow('prompt', rows), windowFill(rows));
}
