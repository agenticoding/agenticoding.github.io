/**
 * The decision figure's model layer: which classifier fits on the reader's
 * machine at the workload they set, and what that workload costs it.
 *
 * Pure: rows and counts out, no reader-facing words. It reads the machine from
 * the shared catalogue, so a box chosen in the fit figure prices this one too.
 */
import { classifiers } from './classifierData.ts';
import type { ClassifierModel } from './classifierTypes.ts';
import {
  ASSUME_CACHE_KIB_PER_TOKEN,
  cacheGib,
  needGib,
  overInputCap,
  verdictFor,
} from './classifierRequirement.ts';
import type { ClassifierVerdict } from './classifierRequirement.ts';
import {
  FAMILIES,
  budgetOf,
  budgetStep,
  contextLabel,
  defaultBudget,
  defaultSkuOfFamily,
  formatNumber,
  hardwareById,
  servesEngine,
  skusOfFamily,
} from './figureCatalog.ts';
import type {
  HardwareTarget,
  MachineChoice,
  MemoryBounds,
  RailCounts,
} from './figureTypes.ts';
import { MODEL_MODALITIES } from './modalityProfile.ts';
import type { FlowProfile } from './modalityProfile.ts';

/** The shared state the figure offers: a record, a session, a document. */
export const STATE_STOPS = [2048, 8192, 32768, 131072] as const;

/** Decisions the deployment runs at once: the one workload axis the cache
 * multiplies by. */
export const DECISION_STOPS = [1, 4, 16, 64] as const;

/** The card's own channels, in the book's order; a classifier returns a label. */
export const classifierProfile = (model: ClassifierModel): FlowProfile => ({
  input: MODEL_MODALITIES.filter((channel) =>
    model.modalities.inputs.includes(channel)
  ),
  output: [model.modalities.output],
});

export type DecisionRow = {
  model: ClassifierModel;
  /** Cache every decision in flight holds; null when the weights are unpublished. */
  cacheGib: number | null;
  /** Weights plus that cache; null when the weights are unpublished. */
  needGib: number | null;
  /** Whether the row sits inside the machine's budget at this workload. */
  verdict: ClassifierVerdict;
  /** Whether the state exceeds the published input limit; null = no limit. */
  overInput: boolean | null;
};

/**
 * The budget the rows are priced against: the machine's own, minus what the
 * runtime keeps. Zero when the choice names no target, which prices every row as
 * untested rather than assumed small.
 */
export const decisionBudget = (choice: MachineChoice): number => {
  const target = hardwareById(choice.hardwareId);
  return target ? budgetOf(target, choice) : 0;
};

/**
 * The workload's floor on this machine, for the strip beside the levers: the
 * lightest listed classifier's need — its weights once, plus the cache every
 * decision in flight holds — and the ends of the machine.
 *
 * WHY the lightest listed model: the floor is the cheapest legal deployment of
 * *this* workload, and the table lists only the rows that fit, so the panel and
 * the table cannot disagree about what this machine must hold.
 */
export type DecisionBounds = MemoryBounds & {
  /** The lightest listed classifier's weights. */
  weightsGib: number;
  /** Cache every decision in flight holds; each row adds its weights to it. */
  cacheGib: number;
};

export const decisionBounds = (
  choice: MachineChoice,
  rows: readonly DecisionRow[],
  stateTokens: number,
  decisions: number
): DecisionBounds => {
  const target = hardwareById(choice.hardwareId);
  const trackGib = target?.nominalGib ?? 0;
  const maxGib = decisionBudget(choice);
  const cache = cacheGib(stateTokens, decisions);
  const floorGib =
    rows.reduce<number | null>(
      (best, row) =>
        row.needGib === null
          ? best
          : best === null || row.needGib < best
            ? row.needGib
            : best,
      null
    ) ?? 0;
  const stepGib = budgetStep(trackGib);
  return {
    trackGib,
    reserveGib: target?.reserveGib ?? 0,
    maxGib,
    minGib: Math.min(maxGib, Math.ceil(floorGib / stepGib) * stepGib),
    floorGib,
    stepGib,
    // A classifier never streams its weights: the floor is the device's own, so
    // no layout can outgrow the track.
    outgrown: false,
    overfull: floorGib > maxGib,
    weightsGib: floorGib - cache,
    cacheGib: cache,
  };
};

/**
 * A row the figure lists: it has a published size and it fits at this workload.
 * WHY a narrowed type: the table, the panel and the counts read the same list, so
 * the guarantee travels with the value instead of being re-checked in each.
 */
export type ListedRow = DecisionRow & { needGib: number };

const isListed = (row: DecisionRow): row is ListedRow =>
  row.verdict === 'fits' && row.needGib !== null;

/** The rows the figure claims: the ones that fit at this workload. */
export const listedRows = (rows: readonly DecisionRow[]): ListedRow[] =>
  rows.filter(isListed);

/**
 * Every listed classifier at this workload, on the runtime the machine names.
 * WHY the workload reaches the verdict: weights load once, the cache does not,
 * so a fit is a claim about this state and this many decisions in flight.
 * WHY the runtime reaches the row set: a chip promises the rows its own click
 * leaves, so the list must read the same runtime the chip does.
 */
export const decisionRows = (
  choice: MachineChoice,
  stateTokens: number,
  decisions: number
): DecisionRow[] => {
  const budget = decisionBudget(choice);
  return classifiers.models
    .filter((model) => servesEngine(model, choice.engineId))
    .map((model) => ({
      model,
      cacheGib:
        model.weights === null ? null : cacheGib(stateTokens, decisions),
      needGib: needGib(model, stateTokens, decisions),
      verdict: verdictFor(model, budget, stateTokens, decisions),
      overInput: overInputCap(model, stateTokens),
    }));
};

/** Checkpoints one box can hold at this choice's budget, runtime and workload. */
const countFitting = (
  target: HardwareTarget,
  choice: MachineChoice,
  stateTokens: number,
  decisions: number
): number => {
  const budget = choice.budgetGib ?? defaultBudget(target);
  return classifiers.models.filter(
    (model) =>
      servesEngine(model, choice.engineId) &&
      verdictFor(model, budget, stateTokens, decisions) === 'fits'
  ).length;
};

/**
 * The rail's numbers: what a click on a family or a box leaves. A classifier
 * figure has no multi-device numbers, so the count group stays empty.
 * WHY the workload rides along: the rail's counts and the table's verdicts are
 * one claim at one workload, so neither may price a different one. The runtime
 * rides along for the same reason: a box chip and the list under it must agree.
 */
export const decisionRail = (
  choice: MachineChoice,
  stateTokens: number,
  decisions: number
): RailCounts => {
  const target = hardwareById(choice.hardwareId);
  return {
    families: FAMILIES.map((family) => {
      const sku = defaultSkuOfFamily(family.id);
      return {
        family: { id: family.id, label: family.label },
        fits: sku ? countFitting(sku, choice, stateTokens, decisions) : 0,
      };
    }),
    devices: target
      ? skusOfFamily(target.family).map((sku) => ({
          target: sku,
          fits: countFitting(sku, choice, stateTokens, decisions),
        }))
      : [],
    deviceCounts: [],
  };
};

/** Runtimes that serve at least one listed classifier, with their own counts. */
export const decisionEngines = (
  rows: readonly DecisionRow[]
): { engineId: string; count: number; coverage: number }[] => {
  const list: { engineId: string; count: number; coverage: number }[] = [];
  for (const row of rows)
    for (const engineId of row.model.engineIds) {
      const found = list.find((entry) => entry.engineId === engineId);
      if (!found) {
        list.push({ engineId, count: 0, coverage: 0 });
      }
      const entry = list.find((candidate) => candidate.engineId === engineId);
      if (!entry) continue;
      entry.coverage += 1;
      if (row.verdict === 'fits') entry.count += 1;
    }
  return list;
};

export const decisionCounts = (rows: readonly DecisionRow[]) => ({
  fitting: rows.filter((row) => row.verdict === 'fits').length,
  total: rows.length,
});

/**
 * The cache's arithmetic, as the panel's first claim: the state, the decisions
 * in flight, and the assumed per-token cost. WHY it repeats the levers: a
 * reader must be able to check the figure against the knobs, and this product
 * is the only term the workload moves.
 */
export const cacheDerivation = (
  stateTokens: number,
  decisions: number
): string =>
  `${contextLabel(stateTokens)} tokens × ${decisions} ${
    decisions === 1 ? 'decision' : 'decisions'
  } × ${ASSUME_CACHE_KIB_PER_TOKEN} KiB = ${formatNumber(
    cacheGib(stateTokens, decisions)
  )} GiB of cache`;
