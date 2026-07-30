// Weight model for the eager/lazy figure on the ContextRegions foundation.
// Each row is a weighted tile in one contiguous accumulation over the shared
// fractional attention zones (contextZones.ts); zone membership derives from
// position via zoneOfRow — no pixel bands anywhere.
//
// The figure holds one two-capability task constant. Its shared work is the
// prompt, two ordinary tool calls, and the final response. Eager-specific cost
// is every installed schema in the initial prefix. Lazy-specific cost is the
// Tool Search definition plus one or more discovery and recovery turns before
// the schemas expanded by the successful result. This makes discovery visible
// instead of assuming equal traces.

import {
  fractionOfRow,
  zoneOfRow,
  type ContextRegionRow,
} from './contextRegions.ts';
import type { AttentionZone } from './contextZones.ts';
import { attentionAt } from './attentionModel.ts';

export type { AttentionZone };

export const SCHEMA_CAPABILITIES = [
  'repository search',
  'file editing',
  'test runner',
  'browser inspection',
  'commit history',
  'issue tracking',
  'code review',
] as const;

export type MCPToolSchemaStage = (typeof SCHEMA_CAPABILITIES)[number];

// Broader catalogs make the representative task use a larger subset of the
// available capabilities. The count grows in ten-tool steps and stays bounded
// by the four task stages this figure can render.
export const TASK_SCHEMA_CAPABILITIES = SCHEMA_CAPABILITIES.slice(0, 4);
const TASK_WORK_CAPABILITIES = TASK_SCHEMA_CAPABILITIES.slice(0, 2);

export type MCPToolSchemaLayout = {
  catalogTools: number;
  eagerSchemas: number;
  lazySchemas: readonly MCPToolSchemaStage[];
  deferredSchemas: number;
};

export const CATALOG_LIMITS = { min: 4, max: 40 } as const;

// Fixed window capacity in weight units. The maximal eager context is 258,
// leaving only two units of headroom. Lazy preserves room even after the
// broadest catalog adds two complete recovery loops.
export const WINDOW_CAPACITY = 260;

// Full-size blocks make shared task work legible. Compact rows represent
// individual runtime messages or expanded schemas.
export const BLOCK_WEIGHT = 18;
export const MIX_ROW_WEIGHT = 12;
export const SCHEMA_WEIGHT = { min: 28, max: 180 } as const;
export const TOOL_SEARCH_DEFINITION_WEIGHT = 10;
export const TOOL_SEARCH_TURN_WEIGHT = MIX_ROW_WEIGHT;
export const SCHEMA_EXPANSION_WEIGHT = MIX_ROW_WEIGHT;

// Wider catalogs increase ambiguity by adding whole search/recovery turns,
// not by stretching a fictional context item. A recovery loop is a Tool Search
// call/result, an expanded near-match schema, and a false-start tool result.
export const TOOL_SEARCH_ROUNDS = { max: 3, catalogStep: 16 } as const;

// Lazy startup contains the shared core tools plus the always-loaded Tool
// Search definition. That additional definition is a strategy-specific cost.
export const LAZY_STARTUP_WEIGHT = BLOCK_WEIGHT + TOOL_SEARCH_DEFINITION_WEIGHT;

const BLOCK_MIN_HEIGHT = 18;
const MIX_MIN_HEIGHT = 16;

export const PROMPT_LABEL = 'USER PROMPT';
export const FINAL_RESPONSE_LABEL = 'final agent response';

export type MCPContextRow = ContextRegionRow & { label: string };

function relevantSchemaCount(catalogTools: number) {
  return Math.min(
    TASK_SCHEMA_CAPABILITIES.length,
    Math.max(1, Math.ceil(catalogTools / 10))
  );
}

export function modelMCPToolSchema(catalogTools: number): MCPToolSchemaLayout {
  const catalog = Math.max(0, catalogTools);
  const lazySchemas = TASK_SCHEMA_CAPABILITIES.slice(
    0,
    Math.min(relevantSchemaCount(catalog), catalog)
  );
  return {
    catalogTools: catalog,
    eagerSchemas: catalog,
    lazySchemas,
    deferredSchemas: Math.max(0, catalog - lazySchemas.length),
  };
}

function catalogScale(catalogTools: number) {
  const t =
    (catalogTools - CATALOG_LIMITS.min) /
    (CATALOG_LIMITS.max - CATALOG_LIMITS.min);
  return Math.min(1, Math.max(0, t));
}

export function eagerSchemaWeight(catalogTools: number) {
  return (
    SCHEMA_WEIGHT.min +
    catalogScale(catalogTools) * (SCHEMA_WEIGHT.max - SCHEMA_WEIGHT.min)
  );
}

export function toolSearchRoundCount(catalogTools: number) {
  return Math.min(
    TOOL_SEARCH_ROUNDS.max,
    Math.max(1, Math.ceil(catalogTools / TOOL_SEARCH_ROUNDS.catalogStep))
  );
}

function block(
  id: string,
  label: string,
  weight = BLOCK_WEIGHT
): MCPContextRow {
  return { id, label, weight, minHeight: BLOCK_MIN_HEIGHT };
}

function taskTurns() {
  return TASK_WORK_CAPABILITIES.map((_, index) => ({
    id: `work-${index}`,
    label: 'tool call + result',
  }));
}

function mixRow(
  id: string,
  label: string,
  weight = MIX_ROW_WEIGHT
): MCPContextRow {
  return { id, label, weight, minHeight: MIX_MIN_HEIGHT };
}

export function contextContentWeight(rows: readonly MCPContextRow[]) {
  return rows
    .filter((row) => !row.collapsed && row.weight > 0 && !row.spacer)
    .reduce((sum, row) => sum + row.weight, 0);
}

function headroom(content: number): MCPContextRow {
  return {
    id: 'headroom',
    label: '',
    weight: Math.max(0, WINDOW_CAPACITY - content),
    minHeight: 0,
    spacer: true,
  };
}

export function eagerRows(catalogTools: number): MCPContextRow[] {
  const schemas = eagerSchemaWeight(catalogTools);
  const turns = taskTurns();
  const rows = [
    block('core', 'core tools'),
    block('schemas', `installed schemas × ${catalogTools}`, schemas),
    block('prompt', PROMPT_LABEL),
    ...turns.map((turn) => mixRow(turn.id, turn.label)),
    block('final', FINAL_RESPONSE_LABEL),
  ];
  return [...rows, headroom(contextContentWeight(rows))];
}

function recoveryRows(index: number): MCPContextRow[] {
  const retry = index + 1;
  return [
    mixRow(
      `search-retry-${index}`,
      `Tool Search call + result · retry ${retry}`
    ),
    mixRow(`candidate-${index}`, 'near-match schema · discarded'),
    mixRow(`false-start-${index}`, 'false-start tool call + result'),
  ];
}

export function lazyRows(catalogTools: number): MCPContextRow[] {
  const recoveryCount = toolSearchRoundCount(catalogTools) - 1;
  const recoveries = Array.from({ length: recoveryCount }, (_, index) =>
    recoveryRows(index)
  ).flat();
  const loadedSchemas = modelMCPToolSchema(catalogTools).lazySchemas;
  const rows: MCPContextRow[] = [
    block('startup', 'core tools + Tool Search', LAZY_STARTUP_WEIGHT),
    block('prompt', PROMPT_LABEL),
    ...recoveries,
    mixRow(
      'discovery',
      'Tool Search call + result · match',
      TOOL_SEARCH_TURN_WEIGHT
    ),
    ...loadedSchemas.map((capability, index) =>
      mixRow(
        `schema-${index}`,
        `expanded schema · ${capability}`,
        SCHEMA_EXPANSION_WEIGHT
      )
    ),
    ...taskTurns().map((turn) => mixRow(turn.id, turn.label)),
    block('final', FINAL_RESPONSE_LABEL),
  ];
  return [...rows, headroom(contextContentWeight(rows))];
}

export function windowFill(rows: readonly MCPContextRow[]): number {
  return contextContentWeight(rows) / WINDOW_CAPACITY;
}

export function tileAttention(
  rowId: string,
  rows: readonly MCPContextRow[]
): number {
  return attentionAt(fractionOfRow(rowId, rows), windowFill(rows));
}

export function eagerSchemasZone(catalogTools: number): AttentionZone {
  return zoneOfRow('schemas', eagerRows(catalogTools));
}
