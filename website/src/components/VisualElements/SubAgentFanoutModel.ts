// Fixed root-only sub-agent schedule for the ContextRegions foundation. The
// orchestrator owns every call: 1 returns, 2 returns, then 3 and 4 run
// together. Satellites deliberately show only isolated context mass and the
// compact synthesis that crosses back.

import {
  BLOCK_WEIGHT,
  MIX_ROW_WEIGHT,
  block,
  contextContentWeight,
  mixRow,
  tileAttention as sharedTileAttention,
  windowFill as sharedWindowFill,
  withHeadroom,
  type WeightContextRow,
} from './contextWeightRows.ts';

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
  { task: 'trace auth flow', privateUnits: 78, synthesisWeight: 14 },
  { task: 'map API routes', privateUnits: 54, synthesisWeight: 10 },
  { task: 'audit dependencies', privateUnits: 90, synthesisWeight: 16 },
  { task: 'profile hot paths', privateUnits: 66, synthesisWeight: 12 },
];

export type SubAgentContextRow = WeightContextRow;

function profileAt(index: number): SubAgentProfile {
  const profile = SUB_AGENT_PROFILES[index];
  if (!profile) throw new RangeError(`no sub-agent profile at index ${index}`);
  return profile;
}

function stageRows(stage: readonly number[]): SubAgentContextRow[] {
  return [
    ...stage.map((index) =>
      mixRow(`dispatch-${index}`, `${index + 1} · dispatch`, DISPATCH_WEIGHT)
    ),
    ...stage.map((index) => {
      const profile = profileAt(index);
      return mixRow(
        `synthesis-${index}`,
        `${index + 1} · ${profile.task}`,
        profile.synthesisWeight
      );
    }),
  ];
}

// Stack order is the causal root-call timeline. The final pair shares both
// dispatch and return stages; no satellite ever becomes a dispatch source.
export function parentRows(): SubAgentContextRow[] {
  return withHeadroom(
    [
      block('harness', HARNESS_LABEL),
      block('prompt', PROMPT_LABEL),
      ...ROOT_SCHEDULE.flatMap(stageRows),
      block('final', FINAL_RESPONSE_LABEL),
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
