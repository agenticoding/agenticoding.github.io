import { formatGib, formatNumber } from './figureCatalog.ts';
import type { HardwareTarget } from './figureTypes.ts';

/**
 * The words every figure shares: the machine rail, the runtime strip, and the
 * chip notation. A figure's own dictionary holds only what it alone asks.
 *
 * WHY one module: the same chip prints `fits/coverage` in both figures, and the
 * same spoken sentence names what a click promises. Two copies would drift into
 * two different promises.
 */

export const FIGURE_CONTROLS = {
  target: 'Your hardware',
  hardware: 'Hardware',
  device: 'Device',
  devices: 'Devices',
  engine: 'Runtime',
  specialized: 'Specialized runtimes',
  anyRuntime: 'Any runtime',
} as const;

/** A rail chip prints a fit count; the spoken label must carry the unit. */
export const chipSpoken = (label: string, fits: number) =>
  `${label} — ${fits === 1 ? '1 model fits' : `${fits} models fit`} at this workload`;

/**
 * A runtime's printed count: the fits its click leaves, then the checkpoints it
 * covers. WHY the denominator: a bare `3` beside a bare `15` compares two
 * different scopes, so the narrower runtime loses on sight.
 */
export const engineCount = (fits: number, coverage: number) =>
  `${fits}/${coverage}`;

/**
 * The gain, in words. The success hue repeats this phrase; it never replaces it,
 * so greyscale, print, and the selected chip keep the fact.
 */
export const onlyHereText = (reach: number) =>
  reach > 0 ? `${reach} only here` : null;

/** A runtime chip prints its fits too, so its coverage travels in the label. */
export const runtimeChipSpoken = (
  label: string,
  fits: number,
  coverage: number,
  reach = 0
) =>
  `${label} — covers ${coverage === 1 ? '1 model' : `${coverage} models`}, ${fits === 1 ? '1 fits' : `${fits} fit`} at this workload${
    reach > 0
      ? `; holds ${reach === 1 ? '1 model' : `${reach} models`} no general-purpose runtime holds here`
      : ''
  }`;

/**
 * The two runtime groups read as one trade-off: broad lists, or wide hardware
 * reach. WHY a fixed sentence: it is the legend for the notation, so its height
 * cannot move the rows below it as the workload changes. It names the chip's own
 * two numbers in the order the chip prints them.
 */
export const ENGINE_COPY = {
  generalNote: 'Chips: fits here / runtime coverage.',
  specializedNote:
    'Narrow model lists, wider hardware reach. “only here”: no general-purpose runtime holds it here.',
  // The empty group states its absence in the note's own slot: the label
  // already names the group, and the legend explains a suffix no chip shows.
  emptySpecialized: 'None fits at this workload.',
} as const;

/**
 * The machine in the reader's terms: what the box prints, how the memory is
 * shared, and the specs that change what fits. Absent specs print nothing
 * rather than "unknown".
 *
 * WHY one parts function: two panels print overlapping subsets of these facts,
 * and each fact must be spelled once. A caller that draws the memory on an axis
 * asks for the rest, never for a hand-picked copy of the strings.
 */
const hardwareFactParts = (target: HardwareTarget) => ({
  memory: `${formatNumber(target.nominalGib)} GB printed`,
  sharing: target.unified ? 'memory shared with the OS' : 'dedicated memory',
  bandwidth:
    target.bandwidthGBs === null
      ? null
      : `${formatNumber(target.bandwidthGBs)} GB/s memory bandwidth`,
  interconnect: target.interconnect,
});

const present = (facts: (string | null)[]): string[] =>
  facts.filter((fact): fact is string => fact !== null);

export const hardwareFacts = (target: HardwareTarget): string[] => {
  const { memory, sharing, bandwidth, interconnect } =
    hardwareFactParts(target);
  return present([memory, sharing, bandwidth, interconnect]);
};

/**
 * The memory the reader hands to computation, and the slice the machine keeps.
 * WHY shared words: both figures draw that quantity as a bar, so both must name
 * it with one string; a second copy would let one figure rename the budget.
 */
export const MEMORY_COPY = {
  label: 'Memory you give inference',
  reserve: (gib: number) => `OS reserve · ${formatNumber(gib)} GiB`,
} as const;

/**
 * The memory strip's keys, in both calculators. WHY shared: the chat figure and
 * the classifier figure draw one instrument — the budget, the smallest
 * deployment that can serve the workload, and the cache it holds — so a second
 * dictionary would let the two panels describe one machine differently.
 */
export const MEMORY_PANEL = {
  value: (gib: number) => `${formatGib(gib)} GiB`,
  /** The floor's owner is the figure's own noun: a chat model, a classifier. */
  weights: (noun: string, gib: number) =>
    `smallest ${noun} · ${formatGib(gib)} GiB`,
  /** The multiplier travels as a phrase: conversations, decisions in flight. */
  cache: (context: string, count: string, gib: number) =>
    `cache at ${context} × ${count} · ${formatGib(gib)} GiB`,
  // The overfull scale is the need, so the machine's share is an area on it and
  // the key names the number the colour change sits at.
  machine: (gib: number) => `this machine · ${formatGib(gib)} GiB usable`,
  over: (gib: number) => `over this machine · ${formatGib(gib)} GiB`,
  // The need's two parts, as one line: the strip states the fit, so the recipe
  // travels as numbers rather than as two more areas.
  breakdown: (weights: number, cache: number) =>
    `${formatGib(weights)} GiB model + ${formatGib(cache)} GiB cache`,
  // The panel's headline when the need is the scale: the number the strip
  // fills to, and the work the reader set it for.
  needed: (workload: string) => `Memory needed at ${workload}`,
  // The note row's one sentence: the memory cannot be raised, so only the
  // workload can change the answer. The axis is the figure's own.
  overfull: (axis: string) => `Shorten the ${axis} or pick a larger machine.`,
} as const;
