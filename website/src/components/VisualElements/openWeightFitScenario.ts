/**
 * The fit figure's own scenario: its machine store, plus the workload this
 * figure sets and the model the reader pinned.
 *
 * Both directions of the map resolve against it, so the table and the tier table
 * can never describe different questions.
 */
import { useMemo } from 'react';

import {
  CONVERSATION_STOPS,
  CONTEXT_STOPS,
  clampedSelection,
} from './openWeightFitModel.ts';
import type { Selection } from './openWeightFitModel.ts';
import {
  DEFAULT_MACHINE,
  createStore,
  machineScenario,
  machineSelection,
  selectMachine,
} from './figureScenario.ts';
import type { MachineScenarioState } from './figureScenario.ts';

/** The workload levers and the reader's pin. The machine is not theirs. */
export type WorkloadState = {
  contextTokens: number;
  conversations: number;
  /** Null until the reader pins a row; the map's first row is not a pin. */
  focusedModelId: string | null;
  /** Load the checkpoint's speculative component; off frees its memory. */
  mtpEnabled: boolean;
};

export const DEFAULT_WORKLOAD: WorkloadState = {
  contextTokens: CONTEXT_STOPS[0],
  conversations: CONVERSATION_STOPS[0],
  focusedModelId: null,
  mtpEnabled: true,
};

export const workloadScenario = createStore<WorkloadState>(DEFAULT_WORKLOAD);

/** Both halves as one object, which is what the page's handlers and prose read. */
export type ScenarioState = MachineScenarioState & WorkloadState;

export const DEFAULT_SCENARIO: ScenarioState = {
  ...DEFAULT_MACHINE,
  ...DEFAULT_WORKLOAD,
};

/**
 * One writer for both halves: the page's handlers name the lever they moved, and
 * the split between machine and workload stays inside this module.
 *
 * The pin travels in the same patch: whether it survives is the explorer's call
 * (a re-scoping press clears it, a repricing one asks `pinAfter`), so this
 * module never holds a second rule for it.
 */
export function updateScenario({
  baseId,
  devices,
  engineId,
  budgetGib,
  ...workload
}: Partial<ScenarioState>) {
  if (
    baseId !== undefined ||
    devices !== undefined ||
    engineId !== undefined ||
    budgetGib !== undefined
  ) {
    selectMachine(machineScenario, { baseId, devices, engineId, budgetGib });
  }
  if (Object.keys(workload).length) workloadScenario.update(workload);
}

/** The clamped selection both directions resolve against. */
export const scenarioSelection = (scenario: ScenarioState): Selection =>
  clampedSelection({
    ...machineSelection(scenario),
    contextTokens: scenario.contextTokens,
    conversations: scenario.conversations,
    mtpEnabled: scenario.mtpEnabled,
  });

/** A pinned row wins; before that, the model the page opens with. */
export const DEFAULT_MODEL_ID = 'qwen3-8-27b';

export function useScenario(): {
  scenario: ScenarioState;
  selection: Selection;
  modelId: string;
} {
  const machine = machineScenario.use();
  const workload = workloadScenario.use();
  const scenario = useMemo(
    () => ({ ...machine, ...workload }),
    [machine, workload]
  );
  const selection = useMemo(() => scenarioSelection(scenario), [scenario]);
  const modelId = scenario.focusedModelId ?? DEFAULT_MODEL_ID;
  return { scenario, selection, modelId };
}
