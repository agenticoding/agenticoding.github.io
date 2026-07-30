import { attentionAt, toneAt } from './attentionModel.ts';
import { zoneAtOffset } from './contextZones.ts';

export const CONTEXT_PRESSURE = {
  totalWindow: 1_000_000,
  compactionBuffer: 165_000,
  builtinToolCount: 45,
  tokensPerBuiltin: 365,
  tokensPerMcpTool: 700,
  toolSearchBase: 200,
  tokensPerDeferredGroup: 500,
  tokensPerSkillTurn: 4_000,
  tokensPerTurn: 5_000,
  systemPromptTokens: 3_100,
  skillsMetaTokens: 500,
  userTaskTokens: 1_500,
} as const;

export const DRAIN_ORDER = [
  'conversation',
  'contextFiles',
  'skillsMeta',
  'toolDefs',
] as const;

export type DrainKey = (typeof DRAIN_ORDER)[number];
export type VariableTokens = Record<DrainKey, number>;
export type TurnAllocation = {
  tokens: number;
  isSkill: boolean;
  compacted: boolean;
};

export type TaskSeverity =
  | 'primacy'
  | 'recency'
  | 'middle_safe'
  | 'middle'
  | 'critical';

export type CapacityResult = {
  actual: VariableTokens;
  drained: VariableTokens;
  headroom: number;
  compactionTriggered: boolean;
};

const fixedTokens =
  CONTEXT_PRESSURE.systemPromptTokens + CONTEXT_PRESSURE.userTaskTokens;

export function effectiveWindow(showCompaction: boolean): number {
  return (
    CONTEXT_PRESSURE.totalWindow -
    (showCompaction ? CONTEXT_PRESSURE.compactionBuffer : 0)
  );
}

export function toolDefinitionTokens(
  tools: number,
  toolSearchEnabled: boolean
): number {
  const mcp = Math.max(0, tools - CONTEXT_PRESSURE.builtinToolCount);
  const builtins =
    CONTEXT_PRESSURE.builtinToolCount * CONTEXT_PRESSURE.tokensPerBuiltin;
  return toolSearchEnabled
    ? builtins +
        CONTEXT_PRESSURE.toolSearchBase +
        Math.ceil(mcp / 10) * CONTEXT_PRESSURE.tokensPerDeferredGroup
    : builtins + mcp * CONTEXT_PRESSURE.tokensPerMcpTool;
}

function emptyTokens(): VariableTokens {
  return { conversation: 0, contextFiles: 0, skillsMeta: 0, toolDefs: 0 };
}

function total(tokens: VariableTokens): number {
  return Object.values(tokens).reduce((sum, value) => sum + value, 0);
}

export function drainToFit(
  requested: VariableTokens,
  window: number
): CapacityResult {
  const actual = { ...requested };
  const drained = emptyTokens();
  let excess = total(actual) - Math.max(0, window - fixedTokens);
  for (const key of DRAIN_ORDER) {
    const removed = Math.min(actual[key], Math.max(0, excess));
    actual[key] -= removed;
    drained[key] = removed;
    excess -= removed;
  }
  return {
    actual,
    drained,
    headroom: Math.max(0, window - fixedTokens - total(actual)),
    compactionTriggered: drained.conversation > 0,
  };
}

function turnBaseTokens(
  index: number,
  turnCount: number,
  skillTurns: number
): number {
  const isSkill = index >= turnCount - skillTurns;
  return (
    CONTEXT_PRESSURE.tokensPerTurn +
    (isSkill ? CONTEXT_PRESSURE.tokensPerSkillTurn : 0)
  );
}

function distribute(tokens: number[], capacity: number): number[] {
  const allocated = tokens.map(() => 0);
  for (let index = tokens.length - 1; index >= 0 && capacity > 0; index--) {
    const amount = Math.min(tokens[index], capacity);
    allocated[index] = amount;
    capacity -= amount;
  }
  return allocated;
}

export function allocateTurns(
  turnCount: number,
  skillTurns: number,
  retained: number
): TurnAllocation[] {
  const clampedSkills = Math.min(turnCount, skillTurns);
  const bases = Array.from({ length: turnCount }, (_, index) =>
    turnBaseTokens(index, turnCount, clampedSkills)
  );
  if (retained >= bases.reduce((sum, tokens) => sum + tokens, 0)) {
    return bases.map((tokens, index) => ({
      tokens,
      isSkill: index >= turnCount - clampedSkills,
      compacted: false,
    }));
  }
  const compacted = bases.map((tokens) => Math.round(tokens * 0.4));
  const minimum = compacted.reduce((sum, tokens) => sum + tokens, 0);
  const upgrades = distribute(
    bases.map((base, index) => base - compacted[index]),
    Math.max(0, retained - minimum)
  );
  const allocations =
    retained >= minimum
      ? compacted.map((tokens, index) => tokens + upgrades[index])
      : distribute(compacted, retained);
  return allocations.map((tokens, index) => ({
    tokens,
    isSkill: index >= turnCount - clampedSkills,
    compacted: tokens < bases[index],
  }));
}

export function contextTotal(actual: VariableTokens): number {
  return fixedTokens + total(actual);
}

export function effectiveFill(actual: VariableTokens, window: number): number {
  return Math.min(contextTotal(actual) / window, 1);
}

export function taskSeverity(
  taskFraction: number,
  fillRatio: number
): TaskSeverity {
  const location = zoneAtOffset(taskFraction, 1);
  if (location !== 'middle') return location;
  const tone = toneAt(attentionAt(0.5, fillRatio));
  return tone === 'success'
    ? 'middle_safe'
    : tone === 'warning'
      ? 'middle'
      : 'critical';
}
