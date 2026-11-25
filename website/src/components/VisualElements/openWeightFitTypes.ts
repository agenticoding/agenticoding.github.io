/**
 * Shapes shared by the generated dataset
 * (website/src/generated/open-weight-fit.json), its typed view
 * (openWeightFitData.ts), and the resolver (openWeightFitModel.ts).
 *
 * Hand-written so a schema change is a visible edit and the generated artifact
 * stays facts-only.
 */

import type { ModalityProfile } from './modalityProfile.ts';

import type {
  EngineTarget,
  FamilyTarget,
  HardwareTarget,
} from './figureTypes.ts';

export type MemoryBudget = {
  gib: number;
  /** Subtotal: allocations still to budget, so not a standalone fit estimate. */
  subtotal: boolean;
};

export type FitStep = {
  deviceId: string;
  devices: number;
};

/**
 * A second, non-resident path for one checkpoint on one runtime. Its figure is
 * the memory that layout holds, never the checkpoint's resident size, so it
 * carries the context the source states it at and the storage it reads.
 */
export type FitLayout = {
  engineId: string;
  /** What the layout does with the weights: the row's second line. */
  label: string;
  /** Machines the held figure is totalled across. */
  devices: number;
  /** Memory the layout holds at `testedTokens`; totalled across `devices`. */
  gib: number;
  /** The context the source states `gib` at; null = a floor at zero tokens. */
  testedTokens: number | null;
  /** Longest context the layout supports; null when the source states none. */
  capTokens: number | null;
  /** Artifact streamed from storage; null when the source states none. */
  diskGib: number | null;
  /** Decode rate the source publishes for this layout; null when none. */
  speed: string | null;
  sourceUrl: string;
};

/**
 * A speculative component that loads with the weights: built-in multi-token
 * prediction layers (MTP), a separate drafter, or a resident co-model such as
 * Engram. The page's drafter toggle switches it on and off, so the record
 * states what the guide publishes: the kind, any measured size, and whether the
 * fit figures already count it. A null size means the toggle cannot move the
 * number and the component is a note, not an arithmetic term.
 */
export type FitMtp = {
  kind: 'mtp' | 'drafter' | 'engram';
  /** Parameters the guide states for this component, e.g. "3.8B". */
  params: string | null;
  /** Resident size in GiB when the guide publishes one; null when unsized. */
  gib: number | null;
  /** The size is derived from the guide's parameters, not a published figure. */
  estimate: boolean;
  /** The fit figures above already include this component's memory. */
  includedInFit: boolean;
  /** The component sits in accelerator memory when loaded; false = host RAM. */
  resident: boolean;
  note: string | null;
  sourceUrl: string;
};

/**
 * A published configuration the calculator does not price as the model's path:
 * a resident preset, a quant variant, or a topology with its own cap or rate.
 * It is cited evidence, never an inferred fit.
 */
export type FitConfig = {
  engineId: string;
  label: string;
  devices: number;
  /** Memory held at `testedTokens`; totalled across `devices`; null when unstated. */
  gib: number | null;
  testedTokens: number | null;
  capTokens: number | null;
  diskGib: number | null;
  speed: string | null;
  /** The source's own caveat for this configuration; null when none. */
  note: string | null;
  sourceUrl: string;
};

export type FitModel = {
  id: string;
  name: string;
  lab: string;
  country: string;
  params: string;
  license: string;
  checkpoint: string;
  contextCap: string;
  speedNote: string;
  runtimeMemory: string;
  /** The checkpoint's documented input and output channels, from the guide. */
  modalities: ModalityProfile;
  /** Raw engine list from the country table, qualifiers included. */
  enginesListed: string;
  /** Runtimes the country table's Engines column names. */
  engineIds: readonly string[];
  /**
   * Runtimes the specialized table names for this model's family. Kept apart
   * from `engineIds` because the source differs: a coverage claim, not a
   * per-checkpoint row. Read through `servesEngine`.
   */
  specializedIds: readonly string[];
  /** Streamed paths the guide publishes for this checkpoint, one per runtime. */
  layouts: readonly FitLayout[];
  /** Other published configurations: cited, not the priced path. */
  configs: readonly FitConfig[];
  /** The engine the guide's memory path is sized for. */
  pathEngineId: string;
  pathLabel: string;
  need64k: MemoryBudget;
  needNative: MemoryBudget;
  nativeContext: string;
  nativeTokens: number;
  candidates: readonly FitStep[];
  sourceUrl: string | null;
  /** Speculative component the checkpoint ships; absent when it has none. */
  mtp?: FitMtp | null;
};

export type ThroughputRun = {
  modelId: string;
  hardwareId: string;
  text: string;
};

/**
 * One published operating point on the speed curve. The guide reports either a
 * per-user rate or an aggregate; whichever it omits is derived from the other
 * and the concurrency, never typed twice.
 */
export type BatchingPoint = {
  modelId: string;
  hardwareId: string;
  /** Requests in flight at this point. */
  concurrency: number;
  perUserOut: number | null;
  aggregateOut: number | null;
  /** The source rounds the published value with a tilde. */
  approx: boolean;
};

/** A deployment path the guide documents for a platform it does not screen. */
export type PlatformNote = {
  modelId: string;
  family: 'amd' | 'apple';
  text: string;
  sourceUrl: string;
};

export type FitMeta = {
  guide: string;
  sourceUrl: string;
  /** Sources-checked date quoted by the guide. */
  checkedThrough: string;
  /** Context lengths the table can be queried at, ascending. */
  contextStops: readonly number[];
};

export type FitDataset = {
  meta: FitMeta;
  families: readonly FamilyTarget[];
  engines: readonly EngineTarget[];
  hardware: readonly HardwareTarget[];
  models: readonly FitModel[];
  throughput: readonly ThroughputRun[];
  batching: readonly BatchingPoint[];
  platformNotes: readonly PlatformNote[];
};
