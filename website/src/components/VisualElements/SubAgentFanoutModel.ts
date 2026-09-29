// Fixed root-only sub-agent schedule for the ContextRegions foundation. The
// orchestrator owns every call: 1 returns, 2 returns, then 3 and 4 run
// together. Satellites deliberately show only isolated context mass and the
// compact synthesis that crosses back.

import {
  BLOCK_WEIGHT,
  MIX_ROW_WEIGHT,
  block,
  contextContentWeight,
  floorCanvas,
  mixRow,
  tileAttention as sharedTileAttention,
  windowFill as sharedWindowFill,
  withHeadroom,
  type WeightContextRow,
} from './contextWeightRows.ts';
import {
  FLOW_ROW_MIN_HEIGHT,
  dispatchRowId,
  synthesisRowId,
} from './subAgentFanoutFlow.ts';

export { BLOCK_WEIGHT, MIX_ROW_WEIGHT, contextContentWeight };

export const WINDOW_CAPACITY = 260;
export const ROOT_AGENT_COUNT = 4;
export const ROOT_SCHEDULE = [[0], [1], [2, 3]] as const;

export const PROMPT_LABEL = 'USER PROMPT';
export const FINAL_RESPONSE_LABEL = 'final agent response';
export const HARNESS_LABEL = 'core tools + context files';
export const SATELLITE_PRIVATE_LABEL = 'isolated context';
export const SATELLITE_SYNTHESIS_LABEL = 'synthesis → root';
export const DISPATCH_WEIGHT = 4;

export type SubAgentProfile = {
  readonly task: string;
  readonly privateUnits: number;
  readonly synthesisWeight: number;
};

export const SUB_AGENT_PROFILES: readonly SubAgentProfile[] = [
  { task: 'trace auth', privateUnits: 78, synthesisWeight: 14 },
  { task: 'map API routes', privateUnits: 54, synthesisWeight: 10 },
  // Task strings double as the rail identity and the ledger row label, so they
  // must stay within one line of the rail identity measure (`IDENTITY_MEASURE`
  // in subAgentFanoutFlow: 14 chars at --text-xs Argon), otherwise the identity
  // wraps past its rail height or the rail drops it.
  { task: 'audit deps', privateUnits: 90, synthesisWeight: 16 },
  { task: 'scan hot paths', privateUnits: 66, synthesisWeight: 12 },
];

export type SubAgentContextRow = WeightContextRow;

function profileAt(index: number): SubAgentProfile {
  const profile = SUB_AGENT_PROFILES[index];
  if (!profile) throw new RangeError(`no sub-agent profile at index ${index}`);
  return profile;
}

function dispatchRow(index: number): SubAgentContextRow {
  return mixRow(
    dispatchRowId(index),
    `${index + 1} · dispatch`,
    DISPATCH_WEIGHT,
    FLOW_ROW_MIN_HEIGHT
  );
}

function synthesisRow(index: number): SubAgentContextRow {
  const profile = profileAt(index);
  return mixRow(
    synthesisRowId(index),
    `${index + 1} · ${profile.task}`,
    profile.synthesisWeight,
    FLOW_ROW_MIN_HEIGHT
  );
}

/** One stage's rows: every caller fires together, then every caller answers.
    This is the one causal order — every width reads the same ledger, so the
    rail assignment must never invent a second order. */
function stageRows(stage: readonly number[]): SubAgentContextRow[] {
  return [...stage.map(dispatchRow), ...stage.map(synthesisRow)];
}

// Stack order is the causal root-call timeline. The final pair shares both
// dispatch and return stages; no satellite ever becomes a dispatch source.
// The parallel pair fires together then answers together, so its two dispatch
// rows and its two synthesis rows are adjacent — one row order at every width.
// Every parent row is one flow-lane tall (`FLOW_ROW_MIN_HEIGHT`), so a request
// and its synthesis each own the band their glyph train rides.
export function parentRows(): SubAgentContextRow[] {
  return withHeadroom(
    [
      block('harness', HARNESS_LABEL, BLOCK_WEIGHT, FLOW_ROW_MIN_HEIGHT),
      block('prompt', PROMPT_LABEL, BLOCK_WEIGHT, FLOW_ROW_MIN_HEIGHT),
      ...ROOT_SCHEDULE.flatMap(stageRows),
      block('final', FINAL_RESPONSE_LABEL, BLOCK_WEIGHT, FLOW_ROW_MIN_HEIGHT),
    ],
    WINDOW_CAPACITY
  );
}

export function satelliteRows(index: number): SubAgentContextRow[] {
  const profile = profileAt(index);
  return withHeadroom(
    [
      mixRow('private', SATELLITE_PRIVATE_LABEL, profile.privateUnits),
      mixRow('synthesize', SATELLITE_SYNTHESIS_LABEL, profile.synthesisWeight),
    ],
    WINDOW_CAPACITY
  );
}

export function windowFill(rows: readonly SubAgentContextRow[]): number {
  return sharedWindowFill(rows, WINDOW_CAPACITY);
}

export function tileAttention(
  rowId: string,
  rows: readonly SubAgentContextRow[]
): number {
  return sharedTileAttention(rowId, rows, WINDOW_CAPACITY);
}

export function parentContentUnits(): number {
  return contextContentWeight(parentRows());
}

export function satelliteContentUnits(index: number): number {
  return contextContentWeight(satelliteRows(index));
}

export function internalUnits(): number {
  return SUB_AGENT_PROFILES.reduce(
    (total, _, index) => total + satelliteContentUnits(index),
    0
  );
}

export function synthesisUnits(): number {
  return SUB_AGENT_PROFILES.reduce(
    (total, profile) => total + profile.synthesisWeight,
    0
  );
}

export function compressionRatio(): number {
  return internalUnits() / synthesisUnits();
}

/** The ledger canvas = the rows' own floor budget (`floorCanvas`), never a
    hand-picked pixel height and deliberately NOT `stackHeight`: this ledger
    spends its height on readable rows (each row carries its flow lane), so the
    window's spare capacity is not drawn as a void. One canvas at every width
    (they render the same rows), mirrored by `.stackClip` in the module
    stylesheet (guarded by the flow test). */
export const PARENT_STACK_HEIGHT = floorCanvas(parentRows());

// ── Causal loop ───────────────────────────────────────────────────────────
// Motion replays the schedule above and nothing else: the root issues a stage's
// calls, each call travels to its sub-agent, that sub-agent works, then its
// synthesis travels back. Every beat is a PHASE into one loop (a positive CSS
// `animation-delay` means "this beat happens N ms into the cycle"), so the
// stylesheet mirrors the numbers below — subAgentFanoutFlow.test.ts fails if a
// mirror drifts, and the amplitudes come from the documented idle-motion
// parameters rather than being invented per figure.

/** One full causal loop. */
export const FLOW_LOOP_MS = 11000;
/** Token journey along one leg — also the moment a dispatch lands on its actor. */
export const FLOW_TRAVEL_MS = 560;
export const FLOW_FADE_MS = 120;
/** Stages fire one after another; every caller answers this long after its call. */
const STAGE_STRIDE_MS = 3000;
const RETURN_AFTER_MS = 1900;

function callStage(index: number): number {
  const stage = ROOT_SCHEDULE.findIndex((callers) =>
    callers.some((caller) => caller === index)
  );
  if (stage < 0)
    throw new RangeError(`no schedule stage fires caller ${index}`);
  return stage;
}

/** When the root issues a caller's dispatch. */
export function dispatchDelayMs(index: number): number {
  return callStage(index) * STAGE_STRIDE_MS;
}

/** When that caller's synthesis leaves — the end of its work. */
export function synthesisDelayMs(index: number): number {
  return dispatchDelayMs(index) + RETURN_AFTER_MS;
}

/** When the caller becomes active: its dispatch has landed on it. */
export function workDelayMs(index: number): number {
  return dispatchDelayMs(index) + FLOW_TRAVEL_MS;
}

/** How long a sub-agent works — dispatch arrival to synthesis departure. The same
    for every caller, which is what lets one keyframe window serve all four. */
export const WORK_WINDOW_MS = RETURN_AFTER_MS - FLOW_TRAVEL_MS;
