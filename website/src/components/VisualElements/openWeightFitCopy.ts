/**
 * Every reader-facing word the explorer shows.
 *
 * WHY one module: the domain layer must stay word-free, and the same vocabulary
 * feeds rows, the detail panel, and the legend. One dictionary means those can
 * never disagree.
 *
 * WHY plain words: readers are strong engineers who do not work on model
 * serving, and the page is a calculator: hardware, runtime, context, and
 * conversations in, memory and the models that hold it out.
 */
import {
  candidatesText,
  conversationsLabel,
  memoryFigure,
  modelTierRows,
  requestCachePerToken,
  rowMemoryText,
  smallestFit,
  workloadLabel,
} from './openWeightFitModel.ts';
import {
  budgetOf,
  contextLabel,
  formatGib,
  formatNumber,
  hardwareById,
} from './figureCatalog.ts';
import type {
  ModelTierRow,
  ResolvedRow,
  RuntimeRow,
  Selection,
} from './openWeightFitModel.ts';
import type { FitMtp } from './openWeightFitTypes.ts';

/** The overview table above the explorer; its own words, same dataset. */
export const TIER_MAP_COPY = {
  tier: 'Hardware tier',
  memory: 'Memory you can use',
  at64k: 'Holds at 64K',
  atNative: 'Holds at its longest context',
  heaviest: 'Largest it holds',
  model: 'Model at your workload',
  smallest: 'smallest fit',
  yours: 'your tier',
  holds: 'fits',
  over: (gib: string) => `${gib} over`,
  layout: (devices: number) => `needs ${devices} devices`,
  unsupported: 'runtime unsupported',
  caption:
    'The middle counts compare each model’s published 64K and longest-context figures with the tier’s planning budget, one conversation each, plus the drafter the calculator loads by default. The last column applies the workload and the drafter you set in the map to the model you selected there, and it judges your own tier by the budget you set there, so the smallest fit and your own tier are marked as such.',
} as const;

/** One word for the speculative component, on the page's own terms. */
const mtpKindWord = (kind: FitMtp['kind']) =>
  kind === 'mtp' ? 'MTP' : kind === 'engram' ? 'Engram' : 'drafter';

/** Why a row costs what it does: what it holds, and the caches that multiply. */
export const needBreakdown = (row: ResolvedRow, conversations: number) => {
  if (row.cacheGib === null || row.baseGib === null) return null;
  if (row.requiredGib === null) return null;
  // The first term names the tier: a streamed row's floor is not weights on the
  // device, and the arithmetic must not imply it is.
  const held =
    row.kind === 'streamed'
      ? ' GiB held in memory'
      : ' GiB weights and allowance';
  const parts = [
    `${formatGib(row.baseGib - Math.max(0, row.mtpDelta))}${held}`,
  ];
  // The drafter term appears only when the toggle loads one the guide sized
  // apart from the figure; a toggled-off figure prints its reduced total
  // without it.
  if (row.mtpDelta > 0) parts.push(`${formatGib(row.mtpDelta)} GiB MTP`);
  parts.push(
    `${conversations} × ${formatGib(row.cacheGib)} GiB cache = ${formatGib(row.requiredGib)} GiB`
  );
  const line = parts.join(' + ');
  return row.mtpDelta < 0 ? `${line} · drafter off` : line;
};

export const CONTROLS = {
  target: 'Your hardware',
  hardware: 'Hardware',
  device: 'Device',
  devices: 'Devices',
  context: 'Context length (prompt + output, in tokens)',
  /** The visible caption: the long form names the axis for assistive tech. */
  contextShort: 'Context length',
  conversations: 'Conversations in flight',
  engine: 'Runtime',
  specialized: 'Specialized runtimes',
  anyEngine: 'Any runtime',
  drafter: 'Drafter',
} as const;

/** A drafter chip's spoken name: the printed count needs its unit. */
export const mtpChipSpoken = (label: string, fits: number, total: number) =>
  `${label} — ${fits} of ${total} models fit at this workload`;

/**
 * The lever's scope, in counts. The control plane is set-level: it states how
 * many checkpoints the switch can move, never which one or how large it is — a
 * checkpoint's GiB belongs to that checkpoint's row. `sized` is zero when the
 * runtimes in view serve no sized component, and then the absence is the fact.
 */
export const drafterInventory = (sized: number, total: number): string =>
  sized === 0
    ? 'No sized drafter on these runtimes.'
    : `Changes the memory of ${sized} of ${total} models.`;

/** The only two words the table prints above its columns. */
export const FIT_TABLE_COPY = {
  model: 'Model',
  // The channels the checkpoint documents; the cell draws the book's shapes.
  modality: 'Modality',
  // The model's origin country: a selection factor the table must show.
  origin: 'Origin',
  // The unit belongs to the column, not to 34 cells.
  memory: 'Memory (GiB)',
} as const;

/**
 * The memory cell. A row the table lists always carries a number; the dash stays
 * as the guard for the day a listed row and a figure disagree.
 */
export const rowMemoryCell = (row: ResolvedRow) =>
  row.requiredGib === null ? '—' : memoryFigure(row);

/**
 * A streamed row's second figure: what the checkpoint occupies on storage. The
 * cell's primary is what the layout holds; without the disk side, a held number
 * reads as the model's whole footprint. Resident rows have no second figure.
 */
export const rowDiskLine = (row: ResolvedRow): string | null =>
  row.kind === 'streamed' && row.diskGib !== null
    ? `from ${formatGib(row.diskGib)} GiB`
    : null;

/**
 * A row's second line: the setup it was sized on, plus the cap when the number
 * is not at the slider's context. A number must name its own basis: without the
 * cap, `6.9` under a 22 GiB budget reads as a number for another context.
 */
export const rowSetupLine = (row: ResolvedRow) => {
  const base =
    row.requiredGib !== null && row.beyondNativeCap
      ? `${row.pathLabel} · at ${row.model.nativeContext}`
      : row.pathLabel;
  const fitting = row.runtimes.filter(
    (option) => option.state === 'fits'
  ).length;
  return fitting > 1 ? `${base} · ${fitting} runtimes fit` : base;
};

/**
 * The detail's own note: only facts the row can add beyond its number. The table
 * above it already prints the figure and the setup, so repeating them here would
 * be two sources for one sentence.
 */
export const rowNote = (row: ResolvedRow): string | null => {
  if (!row.subtotal) return null;
  // When the toggle loads a sized component the guide kept apart, the note
  // names it; the other floor terms stay as they were.
  if (row.mtpDelta > 0) {
    const mtp = row.model.mtp;
    const estimate = mtp?.estimate ? '~' : '';
    return `A floor: the ${mtpKindWord(mtp?.kind ?? 'mtp')} adds ${estimate}${formatGib(row.mtpDelta)} GiB; buffers and state still need budgeting.`;
  }
  return 'A floor: buffers, drafts, or state still need budgeting.';
};

/** The detail panel's one line for the model's speculative component. */
export const mtpLine = (row: ResolvedRow): string => {
  const mtp = row.model.mtp;
  if (!mtp) return '';
  const parts: string[] = [mtpKindWord(mtp.kind)];
  if (mtp.params) parts.push(mtp.params);
  if (mtp.gib !== null)
    parts.push(`${mtp.estimate ? '~' : ''}${formatGib(mtp.gib)} GiB`);
  if (mtp.kind === 'engram') {
    parts.push('placement varies by recipe');
  } else if (mtp.includedInFit) {
    parts.push(
      mtp.gib === null
        ? 'part of the weights'
        : row.mtpDelta < 0
          ? 'off'
          : 'counted in the figure'
    );
  } else {
    parts.push(
      mtp.gib === null ? 'not in the estimate' : row.mtpDelta > 0 ? 'on' : 'off'
    );
  }
  return parts.join(' · ');
};

export const rowCandidatesText = (row: ResolvedRow) =>
  candidatesText(row.model);

/** The count as one sentence: the live region's only words. The page prints the
 * numbers chip by chip and row by row, so a reader who cannot see them still
 * needs to hear what a lever did. */
export const fitCountSpeech = (fits: number, total: number) =>
  `${fits} of ${total} models fit`;

/**
 * The open model's answer, read from the other end of the same dataset: the
 * smallest tier that holds it at this workload, and how much room is left. The
 * tier table below the map expands the same rows.
 */
export const modelAnswerLine = (row: ResolvedRow, selection: Selection) => {
  // The model's own cap is what stops it here, not the budget. The row's group
  // states the same, and the two lines must never describe different limits.
  if (row.beyondNativeCap)
    return `${row.model.name} · needs a shorter context · ${row.model.nativeContext} is its limit`;
  const head = `${row.model.name} · ${rowMemoryText(row)} at ${workloadLabel(selection)}`;
  // A streamed row answers another question: the tier table prices resident
  // footprints, so it cannot name the smallest machine that holds this layout.
  if (row.kind === 'streamed') return `${head} · streamed, not resident`;
  const tiers = modelTierRows(row.model.id, selection);
  const fit = smallestFit(tiers);
  if (!fit) {
    const yours = tiers.find((tier) => tier.isYours);
    if (yours?.conversations)
      return `${head} · no tier holds ${selection.conversations}; ${conversationsLabel(yours.conversations)} fit ${yours.label}`;
    return tiers.every((tier) => tier.verdict === 'unsupported')
      ? `${head} · no tier carries a figure for this runtime`
      : `${head} · no tier holds this workload`;
  }
  const spare = ` · ${formatGib(fit.screenGib - fit.needGib)} GiB spare`;
  return fit.isYours
    ? `${head} · your tier holds it${spare}`
    : `${head} · smallest tier ${fit.label}${spare}`;
};

/** A rail chip prints a fit count; the spoken label must carry the unit. */
export const fitChipSpoken = (label: string, fits: number) =>
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
 * The runtime notation's words are the strip's own: they live beside the chips
 * that print them (`figureCopy.ts`), so a legend and the chip it explains cannot
 * drift. This module keeps only the fit figure's own sentences.
 */

/**
 * The comparison inside a row: every runtime that publishes evidence for that
 * checkpoint, its state on this machine, and the configuration it was priced on.
 * The words state the difference between cited evidence and a priced fit.
 */
export const RUNTIME_COPY = {
  heading: 'Runtimes for this model',
  fits: 'fits',
  doesNotFit: "doesn't fit",
  note: 'Cited configurations do not change the fit arithmetic. Select a runtime to reprice the row.',
} as const;

export const runtimeStateLabel = (option: RuntimeRow) =>
  option.state === 'fits' ? RUNTIME_COPY.fits : RUNTIME_COPY.doesNotFit;

/** Sizing facts only: what the option holds. The measured rate is a caveat,
 * not a size, so it travels with the option's note instead of the column the
 * reader compares across runtimes. */
export const runtimeFacts = (option: RuntimeRow) => {
  const facts: string[] = [];
  if (option.requiredGib !== null)
    facts.push(
      option.devices > 1
        ? `${formatGib(option.requiredGib)} GiB total · ${option.devices} devices`
        : `${formatGib(option.requiredGib)} GiB`
    );
  if (option.capTokens !== null)
    facts.push(`cap ${formatNumber(option.capTokens)}`);
  if (option.diskGib !== null)
    facts.push(`${formatGib(option.diskGib)} GiB on disk`);
  return facts.join(' · ');
};

/** What the source measured, plus the caveat that qualifies it: the quiet line
 * under an option, in the order the reader needs them. */
export const runtimeAside = (option: RuntimeRow): string | null => {
  const parts = [option.speed, option.note].filter(
    (part): part is string => part !== null
  );
  return parts.length ? parts.join(' · ') : null;
};

export const unreachableContextNote = (count: number) =>
  count === 1
    ? '1 context length is longer than every model this runtime serves.'
    : `${count} context lengths are longer than every model this runtime serves.`;

/**
 * The workload section's live readout. Every line is the same rule with the
 * reader's values substituted, so the formula on the page and the numbers in the
 * map cannot drift apart.
 */
export type WorkloadReadout = {
  rule: string;
  arithmetic: string;
  verdict: string;
  price: string;
  answer: string;
};

export const WORKLOAD_COPY = {
  rule: 'memory = weights + runtime allowance + cache per conversation × conversations in flight',
  unsized:
    'No model on this runtime carries a memory figure, so the rule has nothing to apply.',
} as const;

export function workloadReadout(
  row: ResolvedRow,
  selection: Selection
): WorkloadReadout {
  const hardwareTarget = hardwareById(selection.hardwareId);
  const budget = hardwareTarget ? budgetOf(hardwareTarget, selection) : null;
  const spare =
    budget === null || row.surplusGib === null
      ? null
      : budget - row.requiredGib;
  const cache = row.cacheGib;
  const perToken = requestCachePerToken(row.model);
  return {
    rule: WORKLOAD_COPY.rule,
    // The figure belongs to the checkpoint; the row's path states which runtime
    // sized it, so a second runtime reads the same number rather than none.
    arithmetic:
      needBreakdown(row, selection.conversations) ??
      `${formatGib(row.requiredGib)} GiB — the guide sizes one total, not a per-token cache`,
    verdict:
      spare === null
        ? 'This context is past the model’s own limit, so the budget has nothing to test.'
        : `${formatGib(budget as number)} GiB of budget. ${
            spare >= 0
              ? `${formatGib(spare)} GiB spare.`
              : `${formatGib(-spare)} GiB over.`
          }`,
    price:
      cache === null || perToken === null
        ? 'One conversation’s cache is not priced per token in the guide’s figures.'
        : `One conversation at ${contextLabel(selection.contextTokens)} costs ${formatGib(cache)} GiB of cache: ${formatNumber(perToken)} KiB per token.`,
    answer: modelAnswerLine(row, selection),
  };
}

/** The tier map's last column for one row: its number, verdict, and markers. */
export const tierModelCell = (tier: ModelTierRow) => {
  if (tier.verdict === 'unsupported') return TIER_MAP_COPY.unsupported;
  const gib = `${formatGib(tier.needGib)} GiB · `;
  const word =
    tier.verdict === 'over'
      ? TIER_MAP_COPY.over(formatGib(tier.needGib - tier.screenGib))
      : tier.verdict === 'layout'
        ? TIER_MAP_COPY.layout(tier.layoutDevices)
        : TIER_MAP_COPY.holds;
  return `${gib}${word}`;
};

/** Marker prefix, so the table says which end of the answer a row is. */
export const tierMarker = (tier: ModelTierRow) => {
  const marks = [
    tier.isSmallest ? TIER_MAP_COPY.smallest : null,
    tier.isYours ? TIER_MAP_COPY.yours : null,
  ].filter((mark) => mark !== null);
  return marks.join(', ');
};

export const BATCHING_COPY = {
  run: 'Run, sized on',
  conversations: 'Conversations',
  perUser: 'Each user gets',
  aggregate: 'All together',
  unit: 'output tokens per second',
  caption:
    'Three runs where the guide measured more than one operating point. A value the source did not publish is its published companion divided by, or multiplied by, the conversation count. Ripple-65B ran at the 128K recipe cap, Muse Spark at 256 conversations, and Inkling 2 Small held its per-user rate across 84 sessions. The other runs in the dataset report a single point: what one conversation gets, nothing about a batch.',
} as const;

export const batchingValue = (value: number, approx: boolean) =>
  `${approx ? '≈' : ''}${formatNumber(value)}`;
