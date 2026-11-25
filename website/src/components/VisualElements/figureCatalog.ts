/**
 * The machine catalogue and its vocabulary, shared by every figure.
 *
 * WHY this is not part of a figure's model: the hardware rail, the runtime
 * strip, and the budget track read one catalogue, so a target cannot be spelled
 * two ways on one page.
 *
 * Pure: data in, targets out. No reader-facing words live here.
 */
import { dataset } from './openWeightFitData.ts';
import type {
  EngineTarget,
  HardwareFamily,
  HardwareTarget,
  MachineChoice,
  MemoryBounds,
  PlatformVendor,
} from './figureTypes.ts';

const { engines, families, hardware } = dataset;

/** Accelerator families in picker order, from the dataset. */
export const FAMILIES = families;

// ---------------------------------------------------------------- lookups
export const hardwareById = (id: string): HardwareTarget | undefined =>
  hardware.find((entry) => entry.id === id);

export const engineById = (id: string): EngineTarget | undefined =>
  engines.find((entry) => entry.id === id);

/**
 * Does this runtime serve this checkpoint? The dataset holds the claim: the
 * guide names the runtimes per checkpoint, and `specializedIds` adds the ones
 * its family table names. `all` is a scope, not a runtime, so it serves every
 * checkpoint.
 * WHY one predicate for both figures: two copies of this rule drift, and then a
 * table lists a row its own chip excludes (classifier, 2026-11-25).
 */
export const servesEngine = (
  model: { engineIds: readonly string[]; specializedIds?: readonly string[] },
  engineId: string
) =>
  engineId === 'all' ||
  model.engineIds.includes(engineId) ||
  (model.specializedIds ?? []).includes(engineId);

export const hardwareOfFamily = (family: HardwareFamily) =>
  hardware.filter((entry) => entry.family === family);

/** The single-device SKUs of a family: what the Device group offers. */
export const skusOfFamily = (family: HardwareFamily) =>
  hardwareOfFamily(family).filter((entry) => entry.devices === 1);

/** The box a family chip selects: its first single-device SKU, and the count
 * that chip promises. Both read this one function. */
export const defaultSkuOfFamily = (family: HardwareFamily) =>
  skusOfFamily(family)[0];

/**
 * The budget a machine offers before the reader narrows it: what it printed,
 * less what it keeps for the OS and the display.
 */
export const defaultBudget = (target: HardwareTarget) =>
  target.nominalGib - target.reserveGib;

/** The budget a scenario resolves against: the reader's choice, else the machine's. */
export const budgetOf = (target: HardwareTarget, choice: MachineChoice) =>
  choice.budgetGib ?? defaultBudget(target);

/**
 * The budget the rows are tested against: the reader's number, held inside the
 * machine's reserved ends. WHY one function: the track draws this value and the
 * table's bars scale to it, so two clamps would drift into two budgets.
 */
export const readerBudget = (
  bounds: MemoryBounds,
  budgetGib?: number | null
): number =>
  Math.min(bounds.maxGib, Math.max(bounds.minGib, budgetGib ?? bounds.maxGib));

/** Datacenter SKUs split the id as `<sku>-<devices>`; others are one device. */
export const baseHardwareId = (entry: HardwareTarget) =>
  entry.devices > 1 ? entry.id.replace(/-\d+$/, '') : entry.id;

export const hardwareIdFor = (baseId: string, devices: number) =>
  devices > 1 ? `${baseId}-${devices}` : baseId;

/** Fails loudly: a family the dataset drops must not silently lose its vendor. */
export const vendorOf = (family: HardwareFamily): PlatformVendor => {
  const found = families.find((entry) => entry.id === family);
  if (!found) throw new Error(`unknown hardware family "${family}"`);
  return found.vendor;
};

export const familyLabel = (family: HardwareFamily) => {
  const found = families.find((entry) => entry.id === family);
  if (!found) throw new Error(`unknown hardware family "${family}"`);
  return found.label;
};

// ---------------------------------------------------------------- engine support
/** Support comes from the guide's engine table, never from hardware guesses. */
export const engineSupports = (engine: EngineTarget, family: HardwareFamily) =>
  engine.platforms.includes(vendorOf(family));

export const enginesForFamily = (family: HardwareFamily) =>
  engines.filter((engine) => engineSupports(engine, family));

/** Checkpoints the catalogue sizes: the denominator a count chip carries. */
export const modelCountOf = () => dataset.models.length;

// ---------------------------------------------------------------- formatting
export const contextLabel = (tokens: number) =>
  tokens >= 1_048_576 ? '1M' : `${Math.round(tokens / 1024)}K`;

/** Compact number: one decimal under 100, grouped integer above. */
export const formatNumber = (value: number) =>
  (value < 100
    ? value.toFixed(1)
    : Math.round(value).toLocaleString('en-US')
  ).replace(/\.0$/, '');

export const formatGib = (gib: number) => formatNumber(gib);

/** Ramp granularity: half a GiB on a 24 GB card, 25 GiB on a 32-GPU node. */
export const budgetStep = (trackGib: number) =>
  trackGib <= 64 ? 0.5 : trackGib <= 256 ? 1 : trackGib <= 1024 ? 5 : 25;
