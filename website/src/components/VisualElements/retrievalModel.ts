/**
 * The retrieval figures' model layer: which embedder or reranker fits on the
 * reader's machine at the workload they set, and what that workload costs it.
 *
 * Pure: rows and counts out, no reader-facing words. It reads the machine from
 * the shared catalogue, so a box chosen in one figure prices the others too.
 *
 * WHY one resolver for two families: an embedder and a reranker are priced the
 * same way -- weights once, plus the tokens in flight -- so a second copy would
 * be the first place the two figures disagreed.
 */
import { retrievalOfKind } from './retrievalData.ts';
import {
  ASSUME_WORKING_SET_KIB_PER_TOKEN,
  needGib,
  verdictFor,
  workingSetGib,
} from './retrievalRequirement.ts';
import type { RetrievalVerdict } from './retrievalRequirement.ts';
import type { RetrievalKind, RetrievalModel } from './retrievalTypes.ts';
import {
  FAMILIES,
  budgetOf,
  budgetStep,
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

/** The shortest stop lets models with a 256-token default read the full input. */
export const TOKEN_STOPS = [256, 512, 2048, 8192, 32768] as const;

export type KindShape = {
  /** The noun both the captions and the live sentence use. */
  noun: string;
  nounPlural: string;
  /** Items one pass reads: a text for an embedder, a candidate pair for a
   * reranker. The lever names the family's own unit. */
  unit: string;
  /** The batch the family usually runs at: an index build, or a pool. */
  tokensDefault: number;
  flightDefault: number;
  flightStops: readonly number[];
};

/**
 * The two shapes, as one table. WHY here and not in the copy module: the stops
 * are the numbers a contract asserts, and a default that drifts from its stops
 * would open the figure on a value the rail does not offer.
 */
export const KIND_SHAPES: Record<RetrievalKind, KindShape> = {
  embedding: {
    noun: 'embedder',
    nounPlural: 'embedders',
    unit: 'text',
    tokensDefault: 2048,
    flightDefault: 8,
    flightStops: [1, 8, 32],
  },
  reranking: {
    noun: 'reranker',
    nounPlural: 'rerankers',
    unit: 'pair',
    tokensDefault: 512,
    flightDefault: 16,
    flightStops: [4, 16, 64],
  },
};

/** The card's own channels, in the book's order; retrieval returns no text. */
export const retrievalProfile = (model: RetrievalModel): FlowProfile => ({
  input: MODEL_MODALITIES.filter((channel) =>
    model.modalities.inputs.includes(channel)
  ),
  output: [model.modalities.output],
});

export type RetrievalRow = {
  model: RetrievalModel;
  /** What the workload holds in flight; null when the weights are unpublished. */
  workingSetGib: number | null;
  /** Weights plus that working set; null when the weights are unpublished. */
  needGib: number | null;
  /** Whether the row serves the machine at this workload. */
  verdict: RetrievalVerdict;
};

/**
 * The budget the rows are priced against: the machine's own, minus what the
 * runtime keeps. Zero when the choice names no target, which prices every row as
 * untested rather than assumed small.
 */
export const retrievalBudget = (choice: MachineChoice): number => {
  const target = hardwareById(choice.hardwareId);
  return target ? budgetOf(target, choice) : 0;
};

/**
 * The workload's floor on this machine, for the strip beside the levers: the
 * lightest listed model's need -- its weights once, plus what the workload holds
 * -- and the ends of the machine.
 *
 * WHY the lightest listed model: the floor is the cheapest legal deployment of
 * *this* workload, and the table lists only the rows that fit, so the panel and
 * the table cannot disagree about what this machine must hold. A row the
 * workload excludes is not a cheaper deployment of it -- a 512-token card does
 * not serve an 8192-token text at any budget -- so it never lowers the floor.
 * When nothing is listed, the cheapest attempt stands in, so the strip still has
 * a need to draw against the machine.
 */
export type RetrievalBounds = MemoryBounds & {
  /** The lightest listed model's weights. */
  weightsGib: number;
  /** What the workload holds in flight; each row adds its weights to it. */
  workingSetGib: number;
};

export const retrievalBounds = (
  choice: MachineChoice,
  rows: readonly RetrievalRow[],
  tokensPerItem: number,
  itemsInFlight: number
): RetrievalBounds => {
  const target = hardwareById(choice.hardwareId);
  const trackGib = target?.nominalGib ?? 0;
  const maxGib = retrievalBudget(choice);
  const held = workingSetGib(tokensPerItem, itemsInFlight);
  const listed = listedRows(rows);
  const floorGib =
    (listed.length ? listed : rows).reduce<number | null>(
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
    // A retrieval model never streams its weights: the floor is the device's
    // own, so no layout can outgrow the track.
    outgrown: false,
    overfull: floorGib > maxGib,
    weightsGib: floorGib - held,
    workingSetGib: held,
  };
};

/**
 * A row the figure lists: it has a published size and it serves this workload.
 * WHY a narrowed type: the table, the panel and the counts read the same list, so
 * the guarantee travels with the value instead of being re-checked in each.
 */
export type ListedRow = RetrievalRow & { needGib: number };

const isListed = (row: RetrievalRow): row is ListedRow =>
  row.verdict === 'fits' && row.needGib !== null;

/** The rows the figure claims: the ones that fit at this workload. */
export const listedRows = (rows: readonly RetrievalRow[]): ListedRow[] =>
  rows.filter(isListed);

/**
 * Every listed model of this family at this workload, on the runtime the machine
 * names. WHY the workload reaches the verdict: the weights load once and the
 * working set does not, so a fit is a claim about this length and this batch.
 * WHY the runtime reaches the row set: a chip promises the rows its own click
 * leaves, so the list must read the same runtime the chip does.
 */
export const retrievalRows = (
  kind: RetrievalKind,
  choice: MachineChoice,
  tokensPerItem: number,
  itemsInFlight: number
): RetrievalRow[] => {
  const budget = retrievalBudget(choice);
  return retrievalOfKind(kind)
    .filter((model) => servesEngine(model, choice.engineId))
    .map((model) => ({
      model,
      workingSetGib:
        model.weights === null
          ? null
          : workingSetGib(tokensPerItem, itemsInFlight),
      needGib: needGib(model, tokensPerItem, itemsInFlight),
      verdict: verdictFor(model, budget, tokensPerItem, itemsInFlight),
    }));
};

/** Checkpoints one box can hold at this choice's budget, runtime and workload. */
const countFitting = (
  kind: RetrievalKind,
  target: HardwareTarget,
  choice: MachineChoice,
  tokensPerItem: number,
  itemsInFlight: number
): number => {
  const budget = budgetOf(target, choice);
  return retrievalOfKind(kind).filter(
    (model) =>
      servesEngine(model, choice.engineId) &&
      verdictFor(model, budget, tokensPerItem, itemsInFlight) === 'fits'
  ).length;
};

/**
 * The rail's numbers: what a click on a family or a box leaves. Neither family
 * has multi-device numbers, so the count group stays empty. WHY the workload
 * rides along: the rail's counts and the table's verdicts are one claim at one
 * workload, so neither may price a different one.
 */
export const retrievalRail = (
  kind: RetrievalKind,
  choice: MachineChoice,
  tokensPerItem: number,
  itemsInFlight: number
): RailCounts => {
  const target = hardwareById(choice.hardwareId);
  return {
    families: FAMILIES.map((family) => {
      const sku = defaultSkuOfFamily(family.id);
      return {
        family: { id: family.id, label: family.label },
        fits: sku
          ? countFitting(kind, sku, choice, tokensPerItem, itemsInFlight)
          : 0,
      };
    }),
    devices: target
      ? skusOfFamily(target.family).map((sku) => ({
          target: sku,
          fits: countFitting(kind, sku, choice, tokensPerItem, itemsInFlight),
        }))
      : [],
    deviceCounts: [],
  };
};

/** Runtimes that serve at least one listed model, with their own counts. */
export const retrievalEngines = (
  rows: readonly RetrievalRow[]
): { engineId: string; count: number; coverage: number }[] => {
  const list: { engineId: string; count: number; coverage: number }[] = [];
  for (const row of rows)
    for (const engineId of row.model.engineIds) {
      const found = list.find((entry) => entry.engineId === engineId);
      if (!found) list.push({ engineId, count: 0, coverage: 0 });
      const entry = list.find((candidate) => candidate.engineId === engineId);
      if (!entry) continue;
      entry.coverage += 1;
      if (row.verdict === 'fits') entry.count += 1;
    }
  return list;
};

/**
 * WHY the out-of-range count rides along: a row that disappears because the
 * workload is longer than its cap must not read as a row that never existed.
 * The figure states that count, so the shorter list has a reason on screen.
 */
export const retrievalCounts = (rows: readonly RetrievalRow[]) => ({
  fitting: rows.filter((row) => row.verdict === 'fits').length,
  total: rows.length,
  outOfRange: rows.filter((row) => row.verdict === 'outOfRange').length,
});

/**
 * The working set's arithmetic, as the panel's first claim: the length, the
 * items in flight, and the assumed per-token cost. WHY it repeats the levers: a
 * reader must be able to check the figure against the knobs, and this product is
 * the only term the workload moves.
 */
export const workingSetDerivation = (
  tokensPerItem: number,
  itemsInFlight: number
): string =>
  `${formatNumber(tokensPerItem)} tokens × ${itemsInFlight} ${
    itemsInFlight === 1 ? 'item' : 'items'
  } in flight × ${ASSUME_WORKING_SET_KIB_PER_TOKEN} KiB = ${formatNumber(
    workingSetGib(tokensPerItem, itemsInFlight)
  )} GiB of working set`;
