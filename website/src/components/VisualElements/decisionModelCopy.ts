import type { ClassifierModel } from './classifierTypes.ts';

/**
 * Every reader-facing word the decision figure shows.
 *
 * WHY one module: the table, the levers, the diagram, and the detail panel name
 * the same quantities, and one dictionary means they cannot disagree.
 *
 * WHY plain words: a reader meets these models here for the first time. The
 * figure says model, fit, memory, and decisions in flight; no card vocabulary
 * reaches it.
 */
export const DECISION_COPY = {
  /** The workload panel's two axes, as captions and as contract names. */
  state: 'State per decision',
  /** The axis memory follows: what the runtime runs at once. */
  decisions: 'Decisions in flight',
  /** The state axis prints a compact length, so its unit travels as the name. */
  stateSpoken: 'State per decision, in tokens',
  /**
   * The memory panel's phrase for the workload as one line, which the panel's
   * headline prints when the need is the scale.
   */
  workloadAt: (state: string, decisions: number) =>
    `${state} × ${decisionsInFlight(decisions)}`,
  /** The workload panel's title above its two levers. */
  workload: 'Workload',
  columnModality: 'Modality',
  columnOrigin: 'Origin',
  columnMemory: 'Memory (GiB)',
  /** The shared rule for a fact no source states: the mark both tables print. */
  unpublished: '—',
  /** A listed row fits by construction: the table never prints a losing row. */
  verdict: {
    fits: 'fits at this workload',
  },
  /** The live count: the rows on the runtime the machine names. The verb
   * follows the denominator, so an empty list still reads as one sentence. */
  speech: (fits: number, total: number, engine: string | null) =>
    `${fits} of ${total} ${total === 1 ? 'classifier' : 'classifiers'} ${
      total === 1 ? 'fits' : 'fit'
    } on ${engine ?? 'any runtime'}`,
} as const;

/** One decision count, as the two keys and the panel print it. */
export const decisionsInFlight = (decisions: number) =>
  `${decisions} ${decisions === 1 ? 'decision' : 'decisions'}`;

/**
 * A row's second line: the shape of the checkpoint and the precision its weight
 * figure is published at. WHY precision and not the size: the memory column
 * already prints the size, and the precision is the basis that number rests on.
 * The lab and the base belong to the Origin cell and the panel, so they stay
 * out of a line the card clips.
 */
export const rowPath = (model: ClassifierModel) =>
  model.weights ? `${model.params} · ${model.weights.precision}` : model.params;

/** The hover text: the full path the row's line leaves out. */
export const rowPathTitle = (model: ClassifierModel) =>
  `${model.lab} · ${rowPath(model)} · ${model.base}`;
