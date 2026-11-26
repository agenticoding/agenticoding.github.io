import { formatNumber } from './figureCatalog.ts';
import type {
  RetrievalKind,
  RetrievalMaxInput,
  RetrievalModel,
} from './retrievalTypes.ts';

/**
 * Every reader-facing word the two retrieval figures show.
 *
 * WHY one module: the table, the levers, the diagram, and the detail panel name
 * the same quantities, and one dictionary means they cannot disagree.
 *
 * WHY plain words: a reader meets these models here for the first time. The
 * figures say model, fit, memory, and items in flight; no card vocabulary
 * reaches them.
 */
export const RETRIEVAL_COPY = {
  /** The workload panel's title above its two levers. */
  workload: 'Workload',
  columnModality: 'Modality',
  columnContext: 'Context',
  columnMemory: 'Memory (GiB)',
  /** The shared rule for a fact no source states: the mark both tables print. */
  unpublished: '—',
  /** A listed row fits by construction: the table never prints a losing row. */
  verdict: {
    fits: 'fits at this workload',
  },
  /** The live count: the rows on the runtime the machine names, then the rows
   * this length puts out of reach. The verb follows the denominator, so an empty
   * list still reads as one sentence. */
  speech: (
    noun: string,
    nounPlural: string,
    fits: number,
    total: number,
    engine: string | null,
    outOfRange: number,
    tokenLabel: string
  ) =>
    `${fits} of ${total} ${
      total === 1 ? noun : nounPlural
    } ${total === 1 ? 'fits' : 'fit'} on ${engine ?? 'any runtime'}${
      outOfRange > 0
        ? `; ${outOfRange} out of range at ${tokenLabel} tokens`
        : ''
    }`,
} as const;

/**
 * A length in the guide's own notation. WHY not `contextLabel`: that one rounds
 * to whole thousands, and a 512-token cap must not print as "1K".
 */
export const spanLabel = (tokens: number) =>
  tokens >= 1024 ? `${tokens / 1024}K` : `${tokens}`;

/** One lever's own words: the unit is the family's, the number is the reader's. */
export const AXIS_COPY: Record<
  RetrievalKind,
  { length: string; lengthSpoken: string; flight: string; flightSpoken: string }
> = {
  embedding: {
    length: 'Text length',
    lengthSpoken: 'Text length, in tokens',
    flight: 'Texts in flight',
    flightSpoken: 'Texts in flight, batched through the model',
  },
  reranking: {
    length: 'Pair length',
    lengthSpoken: 'Pair length, in tokens',
    flight: 'Candidates in flight',
    flightSpoken: 'Candidate pairs scored at once',
  },
};

/** The workload as one line, for the memory panel's headline. */
export const workloadAt = (
  lengthLabel: string,
  unit: string,
  inFlight: number
) => `${lengthLabel} × ${inFlight} ${unit}${inFlight === 1 ? '' : 's'}`;

/**
 * A row's second line: the shape of the checkpoint and the precision its weight
 * figure is published at. WHY precision and not the size: the memory column
 * already prints the size, and the precision is the basis that number rests on.
 * The lab and the base belong to the panel, so they stay out of a line the card
 * clips.
 */
export const rowPath = (model: RetrievalModel) =>
  model.weights ? `${model.params} · ${model.weights.precision}` : model.params;

/** The hover text: the full path the row's line leaves out. */
export const rowPathTitle = (model: RetrievalModel) =>
  `${model.name} — ${model.lab}, built on ${model.base}`;

/** What a cap costs the list, as one sentence under the table. */
export const capNote = (
  noun: string,
  nounPlural: string,
  count: number,
  tokenLabel: string
) =>
  count === 1
    ? `The listed input limit for one ${noun} is below ${tokenLabel} tokens.`
    : `The listed input limits for ${count} ${nounPlural} are below ${tokenLabel} tokens.`;

/** An embedder's width and the card's qualifier, as the panel states it. */
export const dimsText = (dims: { width: number; note: string | null }) =>
  dims.note === null
    ? `${formatNumber(dims.width)} per vector`
    : `${formatNumber(dims.width)} (${dims.note})`;

/** A score with the run it came from: the two travel as one fact. */
export const scoreText = (score: { value: number; benchmark: string }) =>
  `${score.value} ${score.benchmark}`;

/** A default truncation is not a hard context limit. */
export const inputBasisLabel = (basis: RetrievalMaxInput['basis']) =>
  ({
    served: 'served',
    config: 'config',
    card: 'model card',
    blog: 'publisher post',
    default: 'default truncation',
  })[basis];
