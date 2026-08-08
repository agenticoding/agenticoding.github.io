// Compaction Line model — single-stack geometry, story roles, eject scatter,
// and the idle-loop schedule for CompactionLineDiagram. Pure constants +
// derived helpers (no React) so the story's invariants stay unit-testable.
//
// The animation tells compaction in place, inside one context window: stale
// tool pairs collapse and the stack closes ranks (act 1); each thread tile
// ejects the majority of its tokens and shrinks into a short summary tile
// carrying a compressed minority, one by one (act 2); the freed space
// collects at the bottom of the same window, free for the next request
// (act 3). Every window below is ms-of-cycle; the TSX maps them to keyframe
// percents.

// Runtime import needs the explicit extension: tests run under node --test
// (native TS stripping), which does not resolve extensionless paths.
import { seededTokenDrift, seededTokenTrain } from './TokenTrainSequence.ts';
import type { TokenSequence } from './AnimatedTokenFlow';
import type { ContextBandSpec } from './ContextBand.tsx';

// Bands follow the shared ContextBand anatomy (ContextBand.tsx): tone-derived
// tint + accent strip; dashed is reserved for freed/external space.
export type CompactionBand = ContextBandSpec;

export const STACK_X = 60;
export const STACK_W = 300;
export const BAND_Y0 = 40;
export const STACK_H = 212;
export const BAND_Y1 = BAND_Y0 + STACK_H;

// The one and only stack. Tool pairs are stale call/result traces; the three
// threads are the conversation sections that get summarized; prefix and tail
// stay. Tones follow the chapter grammar: cyan = harness payload, indigo =
// conversation/tool-work data, emphasis border = the human prompt.
export const STACK_BANDS: CompactionBand[] = [
  { label: 'stable prefix', h: 24, tone: 'cyan' },
  { label: 'decision thread', h: 42, tone: 'indigo' },
  { label: 'read() ↔ 8K result', h: 24, tone: 'indigo' },
  { label: 'debug thread', h: 42, tone: 'indigo' },
  { label: 'grep() ↔ 12K result', h: 24, tone: 'indigo' },
  { label: 'next-step state', h: 32, tone: 'indigo' },
  { label: 'recent tail + task', h: 24, stroke: 'var(--border-emphasis)', fill: 'transparent' },
];

// Summary tiles are short and violet — the chapter hue for AI
// transformation/synthesis — visibly lossy next to their source threads.
export const SUMMARY_H = 14;

// Reduction events in stack order. Each event frees vertical space; bands
// below slide up by the cumulative freed height above them (nested translate
// groups in the TSX make the composition literal).
export interface StackEvent {
  band: number;
  kind: 'delete' | 'shrink';
  freed: number;
}
export const STACK_EVENTS: readonly StackEvent[] = [
  { band: 1, kind: 'shrink', freed: STACK_BANDS[1].h - SUMMARY_H },
  { band: 2, kind: 'delete', freed: STACK_BANDS[2].h },
  { band: 3, kind: 'shrink', freed: STACK_BANDS[3].h - SUMMARY_H },
  { band: 4, kind: 'delete', freed: STACK_BANDS[4].h },
  { band: 5, kind: 'shrink', freed: STACK_BANDS[5].h - SUMMARY_H },
];

export const DELETED_BAND_INDICES: readonly number[] = STACK_EVENTS.filter((e) => e.kind === 'delete').map((e) => e.band);

// 1:1 thread → summary pairs, summarized one by one in stack order. Seeds
// drive the deterministic token scatter (never Math.random — house convention).
// Summarization removes most tokens, not all: each pair keeps a compressed
// minority (survivors — the rightmost tokens of the row); the majority ejects.
export const SUMMARY_PAIRS = [
  { thread: 1, label: 'decisions summary', seed: 'compaction-line-decision', tokenCount: 5, survivors: 2 },
  { thread: 3, label: 'discoveries summary', seed: 'compaction-line-debug', tokenCount: 5, survivors: 2 },
  { thread: 5, label: 'next steps summary', seed: 'compaction-line-next-steps', tokenCount: 4, survivors: 1 },
] as const;

export function summaryBand(pairIndex: number): CompactionBand {
  return { label: SUMMARY_PAIRS[pairIndex].label, h: SUMMARY_H, tone: 'violet' };
}

export const HEADROOM_H = STACK_EVENTS.reduce((px, e) => px + e.freed, 0);

// Vertical offset of a band's top within the pre-compaction stack.
export function bandTop(index: number): number {
  return STACK_BANDS.slice(0, index).reduce((top, band) => top + band.h, 0);
}

// Cumulative space freed by events above a band — how far it slides up.
export function slideDistanceBefore(bandIndex: number): number {
  return STACK_EVENTS.filter((e) => e.band < bandIndex).reduce((px, e) => px + e.freed, 0);
}

// Final (post-compaction) geometry: deleted bands are gone, shrunk bands are
// SUMMARY_H, everything else keeps its height.
export function finalHeight(bandIndex: number): number {
  const event = STACK_EVENTS.find((e) => e.band === bandIndex);
  if (!event) return STACK_BANDS[bandIndex].h;
  return event.kind === 'delete' ? 0 : SUMMARY_H;
}

export function finalTop(bandIndex: number): number {
  return BAND_Y0 + bandTop(bandIndex) - slideDistanceBefore(bandIndex);
}

// Static-fallback ledger: the freed space restacked as faint outlines of what
// used to occupy it, in original order. Heights sum to HEADROOM_H exactly.
export interface LedgerEntry {
  label: string;
  h: number;
  onDisk: boolean;
}
export const STATIC_LEDGER: readonly LedgerEntry[] = STACK_EVENTS.map((e) =>
  e.kind === 'delete'
    ? { label: `${STACK_BANDS[e.band].label} — on disk`, h: STACK_BANDS[e.band].h, onDisk: true }
    : { label: `${STACK_BANDS[e.band].label} → summary`, h: STACK_BANDS[e.band].h - SUMMARY_H, onDisk: false }
);

// --- Token fates (act 2) ---
// Each thread tile carries a seeded row of tokens that splits on compaction:
// the majority (left of the survivor cut) ejects in ONE unified rise out of
// the window — discarded from the next request; the surviving minority rises
// into the summary tile. Direction carries the meaning: out = dropped, up
// into the tile = kept in compressed form.
export function pairTokens(pairIndex: number): TokenSequence {
  const pair = SUMMARY_PAIRS[pairIndex];
  return seededTokenTrain(pair.seed, pair.tokenCount);
}

export interface EjectSpec {
  dx: number; // small lateral spread (seeded sign) — secondary to the rise
  dy: number; // strong rise, always upward and out of the window
}
export function pairEjectSpecs(pairIndex: number): EjectSpec[] {
  const pair = SUMMARY_PAIRS[pairIndex];
  const discarded = pair.tokenCount - pair.survivors;
  const dxs = seededTokenDrift(`${pair.seed}:x`, discarded, { minOffsetPx: 10, maxOffsetPx: 30 });
  const dys = seededTokenDrift(`${pair.seed}:y`, discarded, { minOffsetPx: 60, maxOffsetPx: 110 });
  return dxs.map((dx, j) => ({ dx, dy: -Math.abs(dys[j]) }));
}

// Survivors are the rightmost tokens; both the full row and the compact
// summary row are right-aligned, so their horizontal travel is zero and the
// survivor motion is a pure rise from the thread row into the tile row.
export function survivorRisePx(pairIndex: number): number {
  return STACK_BANDS[SUMMARY_PAIRS[pairIndex].thread].h / 2 - SUMMARY_H / 2;
}

// --- Idle-loop schedule ---
// One cycle = orient beat (complete stack) + three acts; the reset plateau at
// the tail of act 3 restores every band before the loop wraps.
export const ORIENT_MS = 1000;
export const COMPACTION_CYCLE_MS = 10800;

// Act 1 — both stale pairs collapse together; ranks close once.
export const DELETE_START_MS = 1100;
export const COLLAPSE_MS = 700;
export const DELETE_SLIDE_START_MS = 1300;
export const DELETE_SLIDE_MS = 800;

// Act 2 — pairs compact one by one. Within a pair: the discarded majority
// ejects first (staggered, one unified rise), the survivors rise with the
// shrink, the tile shrinks right behind them, and the summary tile — carrying
// synthetic compressed tokens — cross-fades in as the shrink lands while the
// stack below slides with the shrink.
export const PAIR_START_MS: readonly number[] = [3500, 4900, 6300];
export const PAIR_WINDOW_MS = 1400;
export const EJECT_STAGGER_MS = 80;
export const EJECT_TRAVEL_MS = 520;
export const EJECT_FADE_MS = 140;
export const SHRINK_LEAD_MS = 160;
export const SURVIVOR_TRAVEL_MS = 300;
export const SHRINK_MS = 620;
export const SUMMARY_LEAD_MS = 250; // summary tile starts emerging just before the shrink lands
export const SUMMARY_FADE_MS = 240;

// Act 3 — the compacted stack holds; the freed space fades in at the bottom,
// labeled by its purpose, and breathes. New context enters this empty region
// on the next request.
export const RESULT_ON_MS = 7900;
export const HEADROOM_FADE_MS = 400;
export const HEADROOM_PULSE_END_MS = 9900;
export const HEADROOM_LABEL = 'free for the next request';
export const HEADROOM_NOTE = 'new context enters here';

export const RESTORE_START_MS = 10200;
export const RESTORE_MS = 600;

// Restore sequencing: the summary tile fades out FIRST, then the thread shape,
// its label, and its ejected tokens return — staged so the loop wrap never
// cross-fades two labels into each other.
export const RESTORE_SUMMARY_OUT_MS = 250;
export const RESTORE_SHAPE_IN_MS = 150;
export const RESTORE_LABEL_IN_MS = 250;
export const RESTORE_TOKENS_IN_MS = 450;

// Latest animated moment inside a pair window — used to prove pairs don't
// overlap and act 2 finishes before the result hold. Survivors fade with the
// summary crossfade, so their end coincides with summaryEnd.
export function pairContentEndMs(pairIndex: number): number {
  const start = PAIR_START_MS[pairIndex];
  const pair = SUMMARY_PAIRS[pairIndex];
  const lastTokenEnd = (pair.tokenCount - pair.survivors - 1) * EJECT_STAGGER_MS + EJECT_TRAVEL_MS + EJECT_FADE_MS;
  const shrinkEnd = SHRINK_LEAD_MS + SHRINK_MS;
  const summaryEnd = SHRINK_LEAD_MS + SHRINK_MS - SUMMARY_LEAD_MS + SUMMARY_FADE_MS;
  return start + Math.max(lastTokenEnd, shrinkEnd, summaryEnd);
}
