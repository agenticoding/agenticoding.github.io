/**
 * Shapes of the classifier dataset
 * (website/src/generated/open-weight-classifiers.json).
 *
 * Hand-written, like the fit dataset's types: a schema change stays a visible
 * edit and the generated artifact stays facts-only. No price is modelled: a
 * classifier is self-hosted, so a hosted rate says nothing about its cost.
 */

/** How many questions one call answers. */
export type ClassifierProtocol = 'joint' | 'per-question';

/** The published on-disk figure and the precision it is published at. */
export type ClassifierWeights = {
  /** Comparable size in GiB; a decimal `GB` is converted at the source's unit. */
  gib: number;
  /** The guide's own wording, printed so the unit and precision never hide. */
  stated: string;
  precision: string;
};

/** The input limit and who states it: the serving docs, the checkpoint, or the
 * publisher's local reference default. */
export type ClassifierMaxInput = {
  tokens: number;
  basis: 'served' | 'config' | 'reference';
};

export type ClassifierModel = {
  id: string;
  name: string;
  lab: string;
  /** The checkpoint the head sits on, as the guide writes it. */
  base: string;
  protocol: ClassifierProtocol;
  params: string;
  /** Null when no source publishes a comparable weight figure. */
  weights: ClassifierWeights | null;
  /** Null when no source publishes an input limit. */
  maxInput: ClassifierMaxInput | null;
  /** The lab's published country; null when its card names none. */
  country: string | null;
  files: string;
  filesUrl: string | null;
  license: string;
  /** Runtimes the guide names, by the fit catalogue's own ids. */
  engineIds: readonly string[];
  /** Input channels only: a classifier's output is a decision, not text. */
  modalities: { inputs: readonly string[]; output: 'label' };
  sourceUrl: string;
};

export type ClassifierDataset = {
  meta: {
    guide: string;
    sourceUrl: string;
    checkedThrough: string;
    protocols: readonly ClassifierProtocol[];
  };
  models: readonly ClassifierModel[];
};
