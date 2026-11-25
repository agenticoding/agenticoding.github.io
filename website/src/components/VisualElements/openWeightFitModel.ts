/**
 * Resolution and capability layer for the open-weight fit explorer.
 *
 * Pure: data in, rows and options out. No reader-facing words live here — the
 * outcomes stay booleans, and openWeightFitCopy.ts owns every label. Rules mirror
 * the guide's audit stance: a layout the guide never sized is reported as having
 * no budget rather than estimated here.
 */
import { dataset } from './openWeightFitData.ts';
import {
  FAMILIES,
  baseHardwareId,
  budgetOf,
  budgetStep,
  defaultBudget,
  defaultSkuOfFamily,
  engineById,
  engineSupports,
  hardwareById,
  servesEngine,
  skusOfFamily,
} from './figureCatalog.ts';
import type { MemoryBounds } from './figureTypes.ts';
import type {
  EngineGroup,
  EngineTarget,
  HardwareFamily,
  HardwareTarget,
  MachineChoice,
} from './figureTypes.ts';
import type { FitConfig, FitLayout, FitModel } from './openWeightFitTypes.ts';

const {
  batching: batchRuns,
  engines,
  hardware,
  meta,
  models,
  platformNotes,
  throughput,
} = dataset;

/** Context lengths the table can be queried at, ascending, from the dataset. */
export const CONTEXT_STOPS = meta.contextStops;

/**
 * Requests in flight the rail offers. Measured runs in the guide use c1 and c4;
 * a served fleet runs to c256. Five stops keep the choice a comparison, not a
 * free number the guide never measured.
 */
export const CONVERSATION_STOPS = [1, 4, 16, 64, 256] as const;

/** Anchor of the published low-context column; every row states it. */
const ANCHOR_TOKENS = CONTEXT_STOPS[0];

export type ResolvedRow = {
  model: FitModel;
  /**
   * Which path priced this row: the checkpoint's resident figure, or a layout
   * that holds part of it on host memory or storage. A streamed row is never a
   * resident fit, so the kind travels with the number.
   */
  kind: 'resident' | 'streamed';
  /** The path this row was priced on: resident, or the streamed layout's own. */
  pathLabel: string;
  /** Resident GiB for the selected context and budget; null when unsized. */
  requiredGib: number | null;
  /** True when the number sits between the two published anchors. */
  interpolated: boolean;
  subtotal: boolean;
  surplusGib: number | null;
  /** One conversation's share of requiredGib; null when the guide sizes a pool. */
  cacheGib: number | null;
  /** Weights plus runtime allowance: requiredGib less every conversation's cache. */
  baseGib: number | null;
  beyondNativeCap: boolean;
  /** The guide's own path for this model on this platform, when it names one. */
  setup: string | null;
  setupSource: string | null;
  /** Storage the layout streams; null on a resident row or an unstated figure. */
  diskGib: number | null;
  /** Decode rate the layout's own source publishes; null when none. */
  speed: string | null;
  /** The context that rate and the layout's floor were stated at. */
  testedTokens: number | null;
  measured: readonly { text: string }[];
  /** Every runtime that publishes evidence for this checkpoint. */
  runtimes: readonly RuntimeRow[];
  /** The runtime this row was priced on; null when none carries a number. */
  chosenRuntime: RuntimeRow | null;
  /**
   * Resident GiB the drafter toggle adds to (positive) or removes from
   * (negative) the published figure. Zero on streamed rows and on models whose
   * component is unsized or not accelerator-resident.
   */
  mtpDelta: number;
};

export type RuntimeState = 'fits' | 'over' | 'devices' | 'unsized';

/**
 * One published way to run this checkpoint. `requiredGib` is the total across
 * `devices` at the selected context; a null figure means the source states no
 * footprint, so the option is cited but never claimed as a fit. A runtime with
 * neither a figure nor a cited configuration never becomes an option.
 */
export type RuntimeRow = {
  engineId: string;
  engineLabel: string;
  group: EngineGroup;
  source: 'priced' | 'layout' | 'config';
  label: string;
  devices: number;
  requiredGib: number | null;
  testedTokens: number | null;
  capTokens: number | null;
  diskGib: number | null;
  speed: string | null;
  note: string | null;
  sourceUrl: string | null;
  state: RuntimeState;
  /** The figure sits between the two published anchors. */
  interpolated: boolean;
};

export type Selection = MachineChoice & {
  contextTokens: number;
  /** Requests held in memory together; the page's anchors describe one. */
  conversations: number;
  /**
   * Memory the reader gives inference, in GiB. Absent means the machine's own
   * budget: the printed capacity less the reserve the machine keeps.
   */
  budgetGib?: number;
  /**
   * Load the checkpoint's speculative component (MTP/drafter). On adds its
   * resident memory; off frees it. Absent means on.
   */
  mtpEnabled?: boolean;
};

// ---------------------------------------------------------------- lookups
export const modelById = (id: string): FitModel | undefined =>
  models.find((entry) => entry.id === id);

// ---------------------------------------------------------------- engine support
const modelsForEngine = (engineId: string) =>
  models.filter((model) => servesEngine(model, engineId));

/** Every checkpoint the guide sizes: the denominator "Any runtime" carries. */
export const modelCount = models.length;

/** Stops at least one checkpoint on this engine can reach. */
export const reachableStops = (engineId: string) =>
  CONTEXT_STOPS.filter((tokens) =>
    modelsForEngine(engineId).some((model) => model.nativeTokens >= tokens)
  );

// ---------------------------------------------------------------- resolution
const interpolate = (
  model: FitModel,
  contextTokens: number
): { gib: number; interpolated: boolean; beyondNativeCap: boolean } => {
  const native = model.nativeTokens;
  const start = model.need64k.gib;
  const end = model.needNative.gib;
  if (contextTokens > native) {
    return { gib: end, interpolated: false, beyondNativeCap: true };
  }
  if (native <= ANCHOR_TOKENS)
    return { gib: start, interpolated: false, beyondNativeCap: false };
  // A flat row (Mistral's KV pool is sized up front) has nothing to interpolate.
  if (start === end)
    return { gib: start, interpolated: false, beyondNativeCap: false };
  const ratio = (contextTokens - ANCHOR_TOKENS) / (native - ANCHOR_TOKENS);
  const interpolated = ratio > 0 && ratio < 1;
  return {
    gib: start + (end - start) * ratio,
    interpolated,
    beyondNativeCap: false,
  };
};

/**
 * Request cache a model implies per token, in KiB, taken from the slope of its
 * two published anchors. Null when the anchors bound no slope: a guide row that
 * sizes a KV pool up front (Mistral) publishes the same total at both lengths.
 */
export function requestCachePerToken(model: FitModel): number | null {
  const span = model.nativeTokens - ANCHOR_TOKENS;
  const delta = model.needNative.gib - model.need64k.gib;
  if (span <= 0 || delta <= 0) return null;
  return (delta * 1024 * 1024) / span;
}

/** One conversation's cache at a context length; null when the slope is unknown. */
export function conversationCacheGib(
  model: FitModel,
  tokens: number
): number | null {
  const perToken = requestCachePerToken(model);
  return perToken === null ? null : (perToken * tokens) / (1024 * 1024);
}

/**
 * One conversation's cache at a workload length. The clamp stops a workload past
 * the model's own cap from pricing cache the model would never read. Every
 * reader of a per-workload cache goes through here, so none can disagree.
 */
export function cacheAtWorkload(
  model: FitModel,
  tokens: number
): number | null {
  return conversationCacheGib(model, Math.min(tokens, model.nativeTokens));
}

/**
 * The resident memory the model's speculative component adds under the toggle.
 * The guide either counts the component in its published figures or sizes it
 * apart from them, so the toggle flips that term. A component the guide never
 * sizes, or one that does not sit in accelerator memory (Engram), never moves
 * a number — it is a note, not arithmetic.
 */
export function mtpDelta(model: FitModel, enabled: boolean): number {
  const mtp = model.mtp;
  if (!mtp || !mtp.resident || mtp.gib === null) return 0;
  return mtp.includedInFit ? (enabled ? 0 : -mtp.gib) : enabled ? mtp.gib : 0;
}

export type WorkloadNeed = {
  gib: number;
  /** One conversation's cache; null when the guide publishes no per-token cost. */
  cacheGib: number | null;
  interpolated: boolean;
  beyondNativeCap: boolean;
};

/**
 * Resident memory for `conversations` requests at one context length: the
 * published anchor plus one cache for every additional request. The weights load
 * once, so only the cache multiplies.
 */
export function needAt(
  model: FitModel,
  tokens: number,
  conversations: number
): WorkloadNeed {
  const anchor = interpolate(model, tokens);
  const cache = cacheAtWorkload(model, tokens);
  const extra = cache === null ? 0 : cache * Math.max(0, conversations - 1);
  return {
    gib: anchor.gib + extra,
    cacheGib: cache,
    interpolated: anchor.interpolated,
    beyondNativeCap: anchor.beyondNativeCap,
  };
}

/**
 * Conversations of this length a budget holds, after weights and allowance.
 * Null when the cache is unknown: a pool-sized figure does not divide.
 */
export function concurrentConversations(
  model: FitModel,
  screenGib: number,
  tokens: number
): number | null {
  const cache = cacheAtWorkload(model, tokens);
  if (cache === null || cache <= 0) return null;
  const base = interpolate(model, tokens).gib - cache;
  return Math.max(0, Math.floor((screenGib - base) / cache + 1e-9));
}

const measuredFor = (modelId: string, hardwareId: string) =>
  throughput.filter(
    (run) => run.modelId === modelId && run.hardwareId === hardwareId
  );

const platformFor = (modelId: string, family: HardwareFamily) =>
  platformNotes.find(
    (item) => item.modelId === modelId && item.family === family
  );

/**
 * The pool a streamed layout's figure is measured in: the shared pool on a
 * unified machine, else the system memory the vendor publishes. Null means the
 * machine cannot be sized for the layout, so the row is absent rather than
 * claimed — a streamed fit is never inferred from an accelerator budget.
 */
export const streamTier = (
  target: HardwareTarget,
  selection: Selection
): number | null =>
  target.unified ? budgetOf(target, selection) : target.hostGib;

/**
 * The track's ends, plus the two terms the fit figure prints as keys: what the
 * lightest deployment weighs, and the cache it holds at this workload.
 */
export type FitBounds = MemoryBounds & {
  /** Lightest model's weights plus runtime allowance. */
  weightsGib: number;
  /** That model's request cache at the chosen workload; it grows with both. */
  cacheGib: number;
};

/**
 * The machine's memory split into the parts a budget cannot spend: the smallest
 * model that can serve this context must fit, cache included, and the OS keeps
 * its share. Everything between the two is the reader's to set.
 *
 * WHY the lightest reachable model: the floor is the cheapest legal deployment
 * of *this* workload, so it must be a model that reads this many tokens. A model
 * that stops earlier would price a cache for tokens it never sees, and two
 * contexts would draw the same track.
 *
 * WHY the ends snap: a range input only lands on its step grid, so the bounds
 * snap inward. The ceiling snaps down, the floor up, and neither ever crosses the
 * area the machine reserved.
 */
export function budgetBounds(
  hardwareTarget: HardwareTarget,
  selection: Selection
): FitBounds {
  // The floor is the cheapest legal deployment of *this* workload, read from the
  // rows themselves so a streamed layout can lower it and never hide behind a
  // resident figure the reader was not offered.
  const rows = resolveRows(selection);
  const reachable = rows.filter(
    (row) => row.model.nativeTokens >= selection.contextTokens
  );
  // A runtime with no checkpoint of this length still needs bounds: fall back to
  // its whole set, then to every model, so the control keeps a legal range
  // while the table explains that nothing reaches the context.
  const candidates = reachable.length ? reachable : rows;
  // Unsized runtimes cannot set a floor; the rail keeps a legal range without
  // inventing a number for them.
  const lightest = candidates.reduce<ResolvedRow | null>(
    (best, row) =>
      row.requiredGib === null
        ? best
        : best === null || row.requiredGib < (best.requiredGib as number)
          ? row
          : best,
    null
  );
  const floorGib = lightest?.requiredGib ?? 0;
  const cacheGib =
    lightest?.cacheGib == null
      ? 0
      : lightest.cacheGib * selection.conversations;
  const stepGib = budgetStep(hardwareTarget.nominalGib);
  const ceiling = defaultBudget(hardwareTarget);
  const maxGib = Math.floor(ceiling / stepGib) * stepGib;
  // A host-streamed layout can fit while the accelerator floor exceeds the
  // track. The note speaks only when no runtime fits at all.
  const outgrown = !candidates.some(fitsWorkload);
  // An empty range is not a budget: every value between min and max is the
  // ceiling, so the reader would drag a handle that cannot move.
  const overfull = floorGib > maxGib;
  return {
    trackGib: hardwareTarget.nominalGib,
    reserveGib: hardwareTarget.reserveGib,
    maxGib,
    minGib: Math.min(maxGib, Math.ceil(floorGib / stepGib) * stepGib),
    weightsGib: floorGib - cacheGib,
    cacheGib,
    floorGib,
    stepGib,
    outgrown,
    overfull,
  };
}

/**
 * A footprint's growth past its stated anchor: the checkpoint's own cache for
 * every token beyond the floor, plus one cache per extra conversation. A
 * shorter context earns no credit, because the source's figure is a floor.
 */
const grownNeed = (
  model: FitModel,
  floor: number,
  testedTokens: number | null,
  tokens: number,
  conversations: number
) => {
  const slope = requestCachePerToken(model);
  const past = Math.max(0, tokens - (testedTokens ?? 0));
  const grown = slope === null ? 0 : (slope * past) / (1024 * 1024);
  const cache = cacheAtWorkload(model, tokens);
  const extra = cache === null ? 0 : cache * Math.max(0, conversations - 1);
  return { gib: floor + grown + extra, cacheGib: cache };
};

const engineLabelOf = (engineId: string) =>
  engineById(engineId)?.label ?? engineId;
const engineGroupOf = (engineId: string): EngineGroup =>
  engineById(engineId)?.group ?? 'general';
const ENGINE_ORDER = new Map(
  engines.map((engine, index) => [engine.id, index])
);

/** The pool a runtime is judged against: system memory when it streams, else the accelerator budget. */
const tierOfOption = (
  option: RuntimeRow,
  hardwareTarget: HardwareTarget,
  selection: Selection
) =>
  option.source === 'layout' ||
  (option.source === 'config' && option.diskGib !== null)
    ? streamTier(hardwareTarget, selection)
    : budgetOf(hardwareTarget, selection);

const stateOfOption = (
  option: RuntimeRow,
  hardwareTarget: HardwareTarget,
  selection: Selection,
  nativeTokens: number
): RuntimeState => {
  // A stated cap ends the option even without a memory figure: the workflow is
  // not servable, and no budget can change that.
  if (option.capTokens !== null && selection.contextTokens > option.capTokens)
    return 'over';
  if (selection.contextTokens > nativeTokens) return 'over';
  if (option.requiredGib === null) return 'unsized';
  // Fewer devices than the selection can run on a subset; more cannot.
  if (option.devices > hardwareTarget.devices) return 'devices';
  const tier = tierOfOption(option, hardwareTarget, selection);
  if (tier === null) return 'unsized';
  // Total and per-device screens: an even split that cannot fit the card fails
  // before placement is discussed. Neither is a placement proof.
  if (option.requiredGib > tier) return 'over';
  if (option.requiredGib / option.devices > tier / hardwareTarget.devices)
    return 'over';
  return 'fits';
};

const pricedOption = (
  model: FitModel,
  hardwareTarget: HardwareTarget,
  selection: Selection
): RuntimeRow => {
  const need = needAt(model, selection.contextTokens, selection.conversations);
  const option: RuntimeRow = {
    engineId: model.pathEngineId,
    engineLabel: engineLabelOf(model.pathEngineId),
    group: engineGroupOf(model.pathEngineId),
    source: 'priced',
    label: model.pathLabel,
    devices: hardwareTarget.devices,
    // The published anchor, plus the drafter's own resident term when the
    // toggle loads it and the guide sizes it apart from the figure.
    requiredGib: need.gib + mtpDelta(model, selection.mtpEnabled ?? true),
    testedTokens: null,
    capTokens: null,
    diskGib: null,
    speed: null,
    note: null,
    sourceUrl: model.sourceUrl,
    state: 'unsized',
    interpolated: need.interpolated && !need.beyondNativeCap,
  };
  return {
    ...option,
    state: stateOfOption(option, hardwareTarget, selection, model.nativeTokens),
  };
};

const layoutOption = (
  model: FitModel,
  layout: FitLayout,
  hardwareTarget: HardwareTarget,
  selection: Selection
): RuntimeRow => {
  const need = grownNeed(
    model,
    layout.gib,
    layout.testedTokens,
    selection.contextTokens,
    selection.conversations
  );
  const option: RuntimeRow = {
    engineId: layout.engineId,
    engineLabel: engineLabelOf(layout.engineId),
    group: engineGroupOf(layout.engineId),
    source: 'layout',
    label: layout.label,
    devices: layout.devices,
    requiredGib: need.gib,
    testedTokens: layout.testedTokens,
    capTokens: layout.capTokens,
    diskGib: layout.diskGib,
    speed: layout.speed,
    note: null,
    sourceUrl: layout.sourceUrl,
    state: 'unsized',
    interpolated: false,
  };
  return {
    ...option,
    state: stateOfOption(option, hardwareTarget, selection, model.nativeTokens),
  };
};

const configOption = (
  model: FitModel,
  config: FitConfig,
  hardwareTarget: HardwareTarget,
  selection: Selection
): RuntimeRow => {
  const need =
    config.gib === null
      ? null
      : grownNeed(
          model,
          config.gib,
          config.testedTokens,
          selection.contextTokens,
          selection.conversations
        );
  const option: RuntimeRow = {
    engineId: config.engineId,
    engineLabel: engineLabelOf(config.engineId),
    group: engineGroupOf(config.engineId),
    source: 'config',
    label: config.label,
    devices: config.devices,
    requiredGib: need?.gib ?? null,
    testedTokens: config.testedTokens,
    capTokens: config.capTokens,
    diskGib: config.diskGib,
    speed: config.speed,
    note: config.note,
    sourceUrl: config.sourceUrl,
    state: 'unsized',
    interpolated: false,
  };
  return {
    ...option,
    state: stateOfOption(option, hardwareTarget, selection, model.nativeTokens),
  };
};

/**
 * Every runtime the guide names for this checkpoint, in catalog order. A runtime
 * that publishes neither a configuration nor a footprint is absent: it is not a
 * choice, so it would only take a line away from the comparison.
 */
const optionsFor = (
  model: FitModel,
  hardwareTarget: HardwareTarget,
  selection: Selection
): RuntimeRow[] => {
  // A runtime the guide never documents on this platform is not a choice here;
  // the chip strip applies the same rule.
  const supportedOn = (engineId: string) => {
    const engine = engineById(engineId);
    return (
      engine !== undefined && engineSupports(engine, hardwareTarget.family)
    );
  };
  const options = [
    ...(supportedOn(model.pathEngineId)
      ? [pricedOption(model, hardwareTarget, selection)]
      : []),
    ...model.layouts
      .filter((layout) => supportedOn(layout.engineId))
      .map((layout) => layoutOption(model, layout, hardwareTarget, selection)),
    ...model.configs
      .filter((config) => supportedOn(config.engineId))
      .map((config) => configOption(model, config, hardwareTarget, selection)),
  ];
  return options.sort(
    (a, b) =>
      (ENGINE_ORDER.get(a.engineId) ?? Number.MAX_SAFE_INTEGER) -
      (ENGINE_ORDER.get(b.engineId) ?? Number.MAX_SAFE_INTEGER)
  );
};

const cheapest = (options: readonly RuntimeRow[]) =>
  options
    .filter((option) => option.requiredGib !== null)
    .reduce<RuntimeRow | null>(
      (best, option) =>
        best === null ||
        (option.requiredGib as number) < (best.requiredGib as number)
          ? option
          : best,
      null
    );

/**
 * The row's priced path: the selected runtime's best fitting option, else the
 * cheapest fit; without a fit, the cheapest published figure so the distance
 * stays visible. Unsized options never win a priced row.
 */
const chosenFor = (
  options: readonly RuntimeRow[],
  selection: Selection
): RuntimeRow | null => {
  if (selection.engineId !== 'all') {
    const own = options.filter(
      (option) => option.engineId === selection.engineId
    );
    return (
      cheapest(own.filter((option) => option.state === 'fits')) ??
      cheapest(own) ??
      own[0] ??
      null
    );
  }
  return (
    cheapest(options.filter((option) => option.state === 'fits')) ??
    cheapest(options)
  );
};

const rowFor = (
  model: FitModel,
  hardwareTarget: HardwareTarget,
  selection: Selection
): ResolvedRow => {
  const runtimes = optionsFor(model, hardwareTarget, selection);
  const chosen = chosenFor(runtimes, selection);
  const note = platformFor(model.id, hardwareTarget.family);
  const requiredGib = chosen?.requiredGib ?? null;
  // Only the priced path carries the toggle term: layouts and cited configs
  // state their own figures, and editing them would misquote a source.
  const mtpAdj =
    chosen?.source === 'priced'
      ? mtpDelta(model, selection.mtpEnabled ?? true)
      : 0;
  const tier =
    chosen === null ? null : tierOfOption(chosen, hardwareTarget, selection);
  const cacheGib =
    requiredGib === null
      ? null
      : cacheAtWorkload(model, selection.contextTokens);
  return {
    model,
    // A config that keeps its weights on the device is a resident row; only a
    // layout or a streamed config earns the streamed mark.
    kind:
      chosen === null ||
      chosen.source === 'priced' ||
      (chosen.source === 'config' && chosen.diskGib === null)
        ? 'resident'
        : 'streamed',
    pathLabel:
      chosen === null
        ? model.pathLabel
        : chosen.source === 'priced'
          ? model.pathLabel
          : chosen.label
            ? `${chosen.engineLabel} · ${chosen.label}`
            : chosen.engineLabel,
    requiredGib,
    interpolated: chosen?.interpolated ?? false,
    subtotal:
      chosen?.source === 'priced'
        ? model.need64k.subtotal || model.needNative.subtotal
        : false,
    surplusGib:
      requiredGib === null ||
      tier === null ||
      chosen?.state === 'devices' ||
      selection.contextTokens > model.nativeTokens
        ? null
        : tier - requiredGib,
    cacheGib,
    baseGib:
      requiredGib === null || cacheGib === null
        ? null
        : requiredGib - cacheGib * selection.conversations,
    beyondNativeCap: selection.contextTokens > model.nativeTokens,
    setup: note?.text ?? null,
    setupSource: note?.sourceUrl ?? null,
    diskGib: chosen?.diskGib ?? null,
    speed: chosen?.speed ?? null,
    testedTokens: chosen?.testedTokens ?? null,
    measured: measuredFor(model.id, hardwareTarget.id),
    runtimes,
    chosenRuntime: chosen,
    mtpDelta: mtpAdj,
  };
};

const byMemory = (a: ResolvedRow, b: ResolvedRow) =>
  (a.requiredGib ?? Number.POSITIVE_INFINITY) -
    (b.requiredGib ?? Number.POSITIVE_INFINITY) ||
  a.model.name.localeCompare(b.model.name);

export function resolveRows(selection: Selection): ResolvedRow[] {
  const hardwareTarget = hardwareById(selection.hardwareId);
  if (!hardwareTarget) return [];
  return modelsForEngine(selection.engineId)
    .map((model) => rowFor(model, hardwareTarget, selection))
    .sort(byMemory);
}

/**
 * The table's whole membership test: the chosen runtime fits at this workload.
 * WHY one predicate: the list, the count, and every rail chip must agree, so a
 * second rule would let them drift.
 */
export const fitsWorkload = (row: ResolvedRow) =>
  row.chosenRuntime?.state === 'fits';

export const fittingRows = (rows: readonly ResolvedRow[]) =>
  rows.filter(fitsWorkload);

// ---------------------------------------------------------------- outcome counts
export type OutcomeCounts = {
  /** Rows the table lists: the ones that fit at this workload. */
  fitting: number;
  total: number;
};

export function outcomeOf(rows: readonly ResolvedRow[]): OutcomeCounts {
  return { fitting: rows.filter(fitsWorkload).length, total: rows.length };
}

// ---------------------------------------------------------------- tier map
/**
 * Tiers the overview table summarises: the single-device SKUs that bracket
 * self-hosting, plus the two multi-device layouts most 1T-class recipes use.
 * Counts compare each model's two published anchors with the tier's budget, so the
 * table answers "what can this tier hold" without opening the explorer.
 */
const TIER_IDS = [
  'rtx4090',
  'rtx5090',
  'rtx-pro-5000',
  'rtx-pro-6000',
  'spark',
  'h200',
  'b200',
  'b300',
  'h100-8',
  'b300-8',
] as const;

export type TierRow = {
  hardwareId: string;
  label: string;
  screenGib: number;
  /** Models whose 64K anchor fits; a subtotal counts as its floor. */
  at64k: number;
  /** Models whose own longest-context anchor fits. */
  atNative: number;
  /** Heaviest models the tier holds at that longest context. */
  heaviest: readonly string[];
};

/**
 * A published anchor as the explorer's default state reads it: the guide's
 * figure plus the speculative component the page loads unless told otherwise.
 * WHY here: the overview counts models, so it must count the same price the
 * explorer's default view charges.
 */
const defaultNeedGib = (model: FitModel, anchor: 'need64k' | 'needNative') =>
  model[anchor].gib + mtpDelta(model, true);

const within = (
  model: FitModel,
  screenGib: number,
  anchor: 'need64k' | 'needNative'
) => defaultNeedGib(model, anchor) <= screenGib;

export function tierSummary(): TierRow[] {
  return TIER_IDS.flatMap((id) => {
    const target = hardwareById(id);
    if (!target || target.screenGib === null) return [];
    const screenGib = target.screenGib;
    const heaviest = models
      .filter((model) => within(model, screenGib, 'needNative'))
      .sort(
        (a, b) =>
          defaultNeedGib(b, 'needNative') - defaultNeedGib(a, 'needNative')
      )
      .slice(0, 2)
      .map((model) => model.name);
    return [
      {
        hardwareId: id,
        label: target.label,
        screenGib,
        at64k: models.filter((model) => within(model, screenGib, 'need64k'))
          .length,
        atNative: models.filter((model) =>
          within(model, screenGib, 'needNative')
        ).length,
        heaviest,
      },
    ];
  });
}

// ---------------------------------------------------------------- model → tier
/** Why a tier does or does not hold the selected model at the current workload. */
export type ModelTierVerdict =
  | 'fits'
  | 'over'
  /** Memory would fit, but the published layout needs more devices. */
  | 'layout'
  /** The runtime has no support on this platform. */
  | 'unsupported';

export type ModelTierRow = {
  hardwareId: string;
  label: string;
  /** Budget this tier is judged against: the reader's on their own tier. */
  screenGib: number;
  /** Resident memory for this model at the workload. */
  needGib: number;
  /** Conversations of this length the tier holds; null when the cache is unknown. */
  conversations: number | null;
  /** Devices the guide's smallest published layout needs. */
  layoutDevices: number;
  verdict: ModelTierVerdict;
  isSmallest: boolean;
  isYours: boolean;
};

/**
 * The budget each tier is judged against: the reader's own on the tier they
 * chose, the machine's default on every other, so the table never compares the
 * reader's setting with a tier they are not on.
 */
const tierBudget = (target: HardwareTarget, selection: Selection) =>
  target.id === selection.hardwareId
    ? budgetOf(target, selection)
    : defaultBudget(target);

/** Devices the guide's smallest published step needs: its placement floor. */
export const layoutDevicesOf = (model: FitModel) =>
  Math.min(...model.candidates.map((step) => step.devices));

/**
 * The drafter term a tier's price carries. WHY the same gate as the row: the
 * table adds the component only when the model's own priced path is what that
 * row chose, so a tier whose family cannot run that path must not add it
 * either — otherwise the two ends of the page would price one model twice.
 */
const pricedMtpDelta = (
  model: FitModel,
  target: HardwareTarget,
  selection: Selection
) => {
  const path = engineById(model.pathEngineId);
  if (!path || !engineSupports(path, target.family)) return 0;
  return mtpDelta(model, selection.mtpEnabled !== false);
};

/**
 * The table read from the other end: one model, every tier, ascending. Rows
 * keep the tiers that miss, so the distance to the answer stays visible.
 */
export function modelTierRows(
  modelId: string,
  selection: Selection
): ModelTierRow[] {
  const model = models.find((entry) => entry.id === modelId);
  if (!model) return [];
  const engine = engineById(selection.engineId);
  const layoutDevices = layoutDevicesOf(model);
  const ids = [...new Set<string>([...TIER_IDS, selection.hardwareId])];
  const rows = ids.flatMap((id) => {
    const target = hardwareById(id);
    if (!target) return [];
    const budget = tierBudget(target, selection);
    const need = needAt(
      model,
      selection.contextTokens,
      selection.conversations
    );
    // The tier prices the same path the row above it prices: anchors plus the
    // speculative component when the toggle loads it.
    const needGib = need.gib + pricedMtpDelta(model, target, selection);
    const conversations = concurrentConversations(
      model,
      budget,
      selection.contextTokens
    );
    const verdict = ((): ModelTierVerdict => {
      if (engine && !engineSupports(engine, target.family))
        return 'unsupported';
      if (needGib > budget) return 'over';
      if (layoutDevices > target.devices) return 'layout';
      return 'fits';
    })();
    return [
      {
        hardwareId: target.id,
        label: target.label,
        screenGib: budget,
        needGib,
        conversations,
        layoutDevices,
        verdict,
        isSmallest: false,
        isYours: target.id === selection.hardwareId,
      },
    ];
  });
  rows.sort((a, b) => a.screenGib - b.screenGib);
  const first = rows.find((row) => row.verdict === 'fits');
  if (first) first.isSmallest = true;
  return rows;
}

/** The first tier that holds the model, or null when none does. */
export const smallestFit = (rows: readonly ModelTierRow[]) =>
  rows.find((row) => row.isSmallest) ?? null;

// ---------------------------------------------------------------- options
/**
 * What a rail chip promises: the fits the selection its own click produces.
 * WHY the clamp: every update passes through the store's clamp, so a runtime
 * this hardware does not support must count as `all`, not as an empty set.
 */
const fitsIf = (selection: Selection, patch: Partial<Selection>) =>
  outcomeOf(resolveRows(clampedSelection({ ...selection, ...patch }))).fitting;

/** The "Any runtime" chip: every runtime, at the reader's budget and workload. */
export const allEngineFits = (selection: Selection) =>
  fitsIf(selection, { engineId: 'all' });

export type MtpOptions = {
  /** Models that fit with the component loaded (the default). */
  on: number;
  /** Models that fit with it switched off. */
  off: number;
  /** Checkpoints in the current rows whose component this toggle sizes. */
  sized: number;
};

/**
 * What the drafter chips print: the fits each state leaves, and how many
 * checkpoints the lever can move at all. WHY only counts: the control plane is
 * set-level, and a checkpoint's GiB belongs to that checkpoint's row, so the
 * lever states its scope here and its size there.
 */
export function mtpOptions(selection: Selection): MtpOptions {
  const clamped = clampedSelection(selection);
  // The rows the reader is looking at, filter included: a component the current
  // runtime cannot serve is not memory this lever frees here. Read from the off
  // state, which is also the count the chip prints, so one resolve serves both.
  const offRows = resolveRows({ ...clamped, mtpEnabled: false });
  const sized = offRows.filter((row) => {
    // Only a row priced from the model's own path can move: a layout or a cited
    // configuration states its own figure, so the lever has nothing to free.
    if (row.chosenRuntime?.source !== 'priced') return false;
    return Math.abs(mtpDelta(row.model, true) - mtpDelta(row.model, false)) > 0;
  });
  return {
    on: fitsIf(selection, { mtpEnabled: true }),
    off: outcomeOf(offRows).fitting,
    sized: sized.length,
  };
}

export type FamilyOption = { family: (typeof FAMILIES)[number]; fits: number };

/** One chip per family. The budget resets to the new box's default, as its
 * click does; the workload and the runtime carry over. */
export function familyOptions(selection: Selection): FamilyOption[] {
  return FAMILIES.map((family) => {
    const sku = defaultSkuOfFamily(family.id);
    return {
      family,
      fits: sku
        ? fitsIf(selection, {
            hardwareId: sku.id,
            budgetGib: undefined,
          })
        : 0,
    };
  });
}

export type DeviceOption = { target: HardwareTarget; fits: number };

/** One chip per SKU of the chosen family, with the fits its click leaves. */
export function deviceOptions(selection: Selection): DeviceOption[] {
  const hardwareTarget = hardwareById(selection.hardwareId);
  if (!hardwareTarget) return [];
  return skusOfFamily(hardwareTarget.family).map((target) => ({
    target,
    fits: fitsIf(selection, {
      hardwareId: target.id,
      budgetGib: undefined,
    }),
  }));
}

export type DeviceCountOption = { devices: number; fits: number };

/** Device counts the current SKU publishes; one entry means the group is hidden. */
export function deviceCountOptions(selection: Selection): DeviceCountOption[] {
  const hardwareTarget = hardwareById(selection.hardwareId);
  if (!hardwareTarget) return [];
  const baseId = baseHardwareId(hardwareTarget);
  return hardware
    .filter((entry) => baseHardwareId(entry) === baseId)
    .map((entry) => ({
      devices: entry.devices,
      fits: fitsIf(selection, {
        hardwareId: entry.id,
        budgetGib: undefined,
      }),
    }));
}

export type RailOptions = {
  families: FamilyOption[];
  devices: DeviceOption[];
  deviceCounts: DeviceCountOption[];
  anyEngineFits: number;
};

/** Every rail chip's number, resolved once: the promise of its own click. */
export const railOptions = (selection: Selection): RailOptions => ({
  families: familyOptions(selection),
  devices: deviceOptions(selection),
  deviceCounts: deviceCountOptions(selection),
  anyEngineFits: allEngineFits(selection),
});

export type OptionState = 'sized' | 'covered' | 'unsupported';

export type EngineOption = {
  engine: EngineTarget;
  /** `unsupported` means the guide documents no support on this platform. */
  state: OptionState;
  /** Checkpoints the guide names for this runtime: the chip's membership. */
  coverage: number;
  /** Rows that fit if the reader pressed this chip: the number it prints. */
  fits: number;
  /**
   * Checkpoints this runtime holds that no standardized runtime holds at this
   * workload. Coverage is the axis a narrow runtime can win on; a count is not,
   * because a specialized table never covers more checkpoints than a broad one.
   */
  reach: number;
  /**
   * A specialized runtime that holds a checkpoint no standardized runtime holds
   * here. Same rows the chip prints, so the two can never disagree.
   */
  beatsBaseline: boolean;
};

export function engineOptions(selection: Selection): EngineOption[] {
  const hardwareTarget = hardwareById(selection.hardwareId);
  if (!hardwareTarget) return [];
  const resolved = engines.map((engine) => {
    const scope = resolveRows({ ...selection, engineId: engine.id });
    // The guide's own path is what makes a runtime's count its own figure.
    const sized = scope.some((row) => row.model.pathEngineId === engine.id);
    // A click can carry the reader to a shorter context than the runtime can
    // serve, so the promise is read where the click lands, not where it starts.
    const clicked = clampedSelection({ ...selection, engineId: engine.id });
    const lands = clicked.engineId === engine.id ? clicked : null;
    const fitting = fittingRows(lands ? resolveRows(lands) : scope);
    return {
      engine,
      state: !engineSupports(engine, hardwareTarget.family)
        ? ('unsupported' as const)
        : sized
          ? ('sized' as const)
          : ('covered' as const),
      coverage: scope.length,
      fits: fitting.length,
      fittingIds: fitting.map((row) => row.model.id),
    };
  });
  // The baseline is every checkpoint a standardized runtime holds on this
  // machine, at the context its own click leaves.
  const baseline = new Set(
    resolved
      .filter(
        (option) =>
          option.engine.group === 'general' && option.state !== 'unsupported'
      )
      .flatMap((option) => option.fittingIds)
  );
  return resolved.map(({ fittingIds, ...option }) => {
    const reach = fittingIds.filter((id) => !baseline.has(id)).length;
    return {
      ...option,
      reach,
      beatsBaseline:
        option.engine.group === 'specialized' && option.fits > 0 && reach > 0,
    };
  });
}

export type ContextOption = {
  tokens: number;
  /** At least one checkpoint on the selected engine reaches this length. */
  reachable: boolean;
  fits: number;
};

export function contextOptions(selection: Selection): ContextOption[] {
  if (!hardwareById(selection.hardwareId)) return [];
  const reachable = reachableStops(selection.engineId);
  return CONTEXT_STOPS.map((tokens) => {
    const counts = outcomeOf(
      resolveRows({ ...selection, contextTokens: tokens })
    );
    return {
      tokens,
      reachable: reachable.includes(tokens),
      fits: counts.fitting,
    };
  });
}

export type ConversationOption = {
  conversations: number;
  /** Rows that hold at this stop, so a stop can report its own cost. */
  fits: number;
};

/**
 * What each stop in flight would leave, on the current hardware, context, and
 * runtime. Counts the same way the context rail does.
 */
export function conversationOptions(
  selection: Selection
): ConversationOption[] {
  if (!hardwareById(selection.hardwareId)) return [];
  return CONVERSATION_STOPS.map((conversations) => {
    const counts = outcomeOf(resolveRows({ ...selection, conversations }));
    return { conversations, fits: counts.fitting };
  });
}

/**
 * Keeps a carried-over choice legal when the hardware or engine changes, so the
 * instrument never renders an empty or inert result set.
 */
export function clampedSelection(selection: Selection): Selection {
  // The toggle defaults on, and it must survive the clamp: resolving it away
  // would make every read show the default, so the control could not turn off.
  const mtpEnabled = selection.mtpEnabled !== false;
  const hardwareTarget = hardwareById(selection.hardwareId);
  if (!hardwareTarget) return { ...selection, mtpEnabled };
  const engine = engines.find((entry) => entry.id === selection.engineId);
  // Both gates come from the guide: it documents this runtime for the vendor,
  // and it names at least one checkpoint the runtime serves. A runtime that
  // names none has no chip, so the store must not hold it either.
  const usable =
    engine !== undefined &&
    engineSupports(engine, hardwareTarget.family) &&
    modelsForEngine(engine.id).length > 0;
  const engineId = usable ? (engine?.id ?? 'all') : 'all';
  const reachable = reachableStops(engineId);
  const contextTokens = reachable.includes(selection.contextTokens)
    ? selection.contextTokens
    : ([...reachable]
        .reverse()
        .find((tokens) => tokens <= selection.contextTokens) ??
      reachable[0] ??
      CONTEXT_STOPS[0]);
  const resolved: Selection = {
    hardwareId: selection.hardwareId,
    engineId,
    contextTokens,
    conversations: selection.conversations,
    // The budget floor moves with the toggle, so the clamp reads it here too.
    mtpEnabled,
  };
  return {
    ...resolved,
    budgetGib: clampBudget(hardwareTarget, {
      ...resolved,
      budgetGib: selection.budgetGib,
    }),
  };
}
/** A carried-over budget must stay between the reserved ends of the new machine. */
const clampBudget = (
  hardwareTarget: HardwareTarget,
  selection: Selection
): number | undefined => {
  if (selection.budgetGib === undefined) return undefined;
  const { maxGib, minGib } = budgetBounds(hardwareTarget, selection);
  return Math.min(maxGib, Math.max(minGib, selection.budgetGib));
};

// ---------------------------------------------------------------- formatting
export const contextLabel = (tokens: number) =>
  tokens >= 1_048_576 ? '1M' : `${Math.round(tokens / 1024)}K`;

/** Unit label for the cache key, the answer line, and the workload axis. */
export const conversationsLabel = (conversations: number) =>
  `${conversations} conversation${conversations === 1 ? '' : 's'}`;

/** One name for the request's size: the track's cache key, the answer line, and
 * the zero state's explanation all print this same string. */
export const workloadLabel = (selection: Selection) =>
  `${contextLabel(selection.contextTokens)} × ${conversationsLabel(selection.conversations)}`;

/** Compact number: one decimal under 100, grouped integer above. */
export const formatNumber = (value: number) =>
  (value < 100
    ? value.toFixed(1)
    : Math.round(value).toLocaleString('en-US')
  ).replace(/\.0$/, '');

export const formatGib = (gib: number) => formatNumber(gib);

/** The figure alone: the table's column head states the unit once. */
export const memoryFigure = (row: ResolvedRow) => {
  if (row.requiredGib === null) return '—';
  const prefix = row.interpolated ? '≈' : '';
  // A streamed mark: the number is what the layout holds, not the resident size.
  const stream = row.kind === 'streamed' ? '⇢' : '';
  const suffix = row.subtotal ? '+' : '';
  return `${prefix}${stream}${formatGib(row.requiredGib)}${suffix}`;
};

/** Memory readout for prose: `≈` marks interpolation, `+` marks a subtotal. */
export const rowMemoryText = (row: ResolvedRow) => `${memoryFigure(row)} GiB`;

export const candidatesText = (model: FitModel) =>
  model.candidates
    .map((step) => {
      const entry = hardware.find(
        (candidate) =>
          candidate.devices === step.devices &&
          baseHardwareId(candidate) === step.deviceId
      );
      return (
        entry?.label.replace(/^1× /, '') ?? `${step.devices}× ${step.deviceId}`
      );
    })
    .join(' → ');

// ---------------------------------------------------------------- speed curve
export type BatchingRow = {
  key: string;
  modelName: string;
  hardwareLabel: string;
  pathLabel: string;
  concurrency: number;
  /** Output tokens per second for one conversation. */
  perUserOut: number;
  /** Output tokens per second across every conversation. */
  aggregateOut: number;
  approx: boolean;
};

/**
 * The guide's multi-point runs, with the side it omits derived from the side it
 * publishes and the concurrency. Every row therefore starts at a measured
 * figure; nothing here is a model of what batching should do.
 */
export function batchingRows(): BatchingRow[] {
  return batchRuns.flatMap((point) => {
    const model = models.find((entry) => entry.id === point.modelId);
    const target = hardwareById(point.hardwareId);
    if (!model || !target) return [];
    return [
      {
        key: `${point.modelId}-${point.hardwareId}-${point.concurrency}`,
        modelName: model.name,
        hardwareLabel: target.label,
        pathLabel: model.pathLabel,
        concurrency: point.concurrency,
        perUserOut:
          point.perUserOut ?? (point.aggregateOut ?? 0) / point.concurrency,
        aggregateOut:
          point.aggregateOut ?? (point.perUserOut ?? 0) * point.concurrency,
        approx: point.approx,
      },
    ];
  });
}
