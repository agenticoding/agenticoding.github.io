// Weight model for the skill-invocation figure on the ContextRegions
// foundation. Each row is a weighted tile in one contiguous accumulation over
// the shared fractional attention zones (contextZones.ts); zone membership
// derives from position via zoneOfRow — no pixel bands anywhere.
//
// The figure holds one skill-shaped task constant: prompt, the activated
// procedure, two ordinary tool turns, the final response. Both paths pay the
// same discovery metadata in the prefix — the catalog advertises every
// installed skill whether a human or the model picks. What differs is who
// decides. Manual invocation cannot mis-select, so its trace never grows.
// Model matching is probabilistic, and the auto trace prices that risk: a
// whole discarded procedure body plus the false-start turn it produced land
// BEFORE the right skill loads and stay in the valley for the rest of the run.
// This is the only shape the auto path has — a lucky direct match is just the
// manual trace, so it would show nothing worth drawing.

import { zoneOfRow } from './contextRegions.ts';
import type { AttentionZone } from './contextZones.ts';
import {
  BLOCK_WEIGHT,
  MIX_ROW_WEIGHT,
  block,
  contextContentWeight,
  mixRow,
  tileAttention as sharedTileAttention,
  windowFill as sharedWindowFill,
  withHeadroom as sharedWithHeadroom,
  type WeightContextRow,
} from './contextWeightRows.ts';

export type { AttentionZone };

// Shared row primitives (contextWeightRows.ts); re-exported to keep this
// model's public API unchanged.
export { BLOCK_WEIGHT, MIX_ROW_WEIGHT, contextContentWeight };

export const CATALOG_LIMITS = { min: 2, max: 12 } as const;

// Fixed window capacity in weight units, shared with the MCP figure so both
// context-mass figures read on the same token scale.
export const WINDOW_CAPACITY = 260;

// Shared block/mix weights come from contextWeightRows.ts.

// Discovery metadata is the always-on cost of an installed catalog: small at
// two skills, still modest at twelve. It never approaches schema mass — the
// point is that it is cheap, not free.
export const METADATA_WEIGHT = { min: 6, max: 42 } as const;

// An expanded procedure outweighs a runtime message: SKILL.md carries whole
// workflows, not a single call/result pair.
export const SKILL_EXPANSION_WEIGHT = 24;

export const PROMPT_LABEL = 'USER PROMPT';
export const FINAL_RESPONSE_LABEL = 'final agent response';
// Labels stay under ~30 characters: wider strings ellipsize inside a tile.
export const MANUAL_SKILL_LABEL = 'procedure · operator invoked';
export const AUTO_SKILL_LABEL = 'procedure · model matched';
export const DISCARDED_SKILL_LABEL = 'near-match skill · discarded';
export const FALSE_START_LABEL = 'false-start turn';

export type SkillsContextRow = WeightContextRow;

export type SkillsInvocationLayout = {
  catalogSkills: number;
  metadataWeight: number;
  loadedProcedures: number;
  deferredProcedures: number;
};

function catalogScale(catalogSkills: number) {
  const t =
    (catalogSkills - CATALOG_LIMITS.min) /
    (CATALOG_LIMITS.max - CATALOG_LIMITS.min);
  return Math.min(1, Math.max(0, t));
}

// Integer weights keep every stack's content + headroom exactly at capacity.
export function metadataWeight(catalogSkills: number) {
  return Math.round(
    METADATA_WEIGHT.min +
      catalogScale(catalogSkills) * (METADATA_WEIGHT.max - METADATA_WEIGHT.min)
  );
}

// The near match loads a second procedure body before the right one, so two
// procedures enter the window while the rest of the catalog stays outside.
export const LOADED_PROCEDURES = 2;

export function modelSkillsInvocation(
  catalogSkills: number
): SkillsInvocationLayout {
  const catalog = Math.max(0, catalogSkills);
  const loaded = Math.min(catalog, LOADED_PROCEDURES);
  return {
    catalogSkills: catalog,
    metadataWeight: metadataWeight(catalog),
    loadedProcedures: loaded,
    deferredProcedures: Math.max(0, catalog - loaded),
  };
}

// Shared prefix: harness tools plus the discovery metadata for every
// installed skill. Identical on both paths — the catalog is advertised
// regardless of who invokes.
function prefixRows(catalogSkills: number): SkillsContextRow[] {
  return [
    block('core', 'core tools'),
    block(
      'metadata',
      `skill metadata × ${catalogSkills}`,
      metadataWeight(catalogSkills)
    ),
    block('prompt', PROMPT_LABEL),
  ];
}

// Shared task work: the procedure runs, then the agent answers.
function taskRows(): SkillsContextRow[] {
  return [
    mixRow('work-0', 'tool call + result'),
    mixRow('work-1', 'tool call + result'),
    block('final', FINAL_RESPONSE_LABEL),
  ];
}

export function manualRows(catalogSkills: number): SkillsContextRow[] {
  return sharedWithHeadroom(
    [
      ...prefixRows(catalogSkills),
      mixRow('skill', MANUAL_SKILL_LABEL, SKILL_EXPANSION_WEIGHT),
      ...taskRows(),
    ],
    WINDOW_CAPACITY
  );
}

// Wrong-pick artifacts: a full procedure body loaded and abandoned, plus the
// turn it produced. Both precede the correct skill and are never reclaimed.
function nearMatchRows(): SkillsContextRow[] {
  return [
    mixRow('near-match', DISCARDED_SKILL_LABEL, SKILL_EXPANSION_WEIGHT),
    mixRow('false-start', FALSE_START_LABEL),
  ];
}

export function autoRows(catalogSkills: number): SkillsContextRow[] {
  return sharedWithHeadroom(
    [
      ...prefixRows(catalogSkills),
      ...nearMatchRows(),
      mixRow('skill', AUTO_SKILL_LABEL, SKILL_EXPANSION_WEIGHT),
      ...taskRows(),
    ],
    WINDOW_CAPACITY
  );
}

export function windowFill(rows: readonly SkillsContextRow[]): number {
  return sharedWindowFill(rows, WINDOW_CAPACITY);
}

export function tileAttention(
  rowId: string,
  rows: readonly SkillsContextRow[]
): number {
  return sharedTileAttention(rowId, rows, WINDOW_CAPACITY);
}

export function matchedSkillZone(catalogSkills: number): AttentionZone {
  return zoneOfRow('skill', autoRows(catalogSkills));
}

export function discardedSkillZone(catalogSkills: number): AttentionZone {
  return zoneOfRow('near-match', autoRows(catalogSkills));
}
