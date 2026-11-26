/**
 * Shapes of the retrieval dataset
 * (website/src/generated/open-weight-retrieval.json).
 *
 * Hand-written, like the fit and classifier datasets' types: a schema change
 * stays a visible edit and the generated artifact stays facts-only. No price is
 * modelled: these models are self-hosted, so a hosted rate would say nothing
 * about the cost of running them.
 */

/**
 * The two families sit in one dataset because they share one arithmetic: both
 * load once and keep nothing between requests. The kind decides the figure's
 * levers, its words, and the vector it draws as the sink.
 */
export type RetrievalKind = 'embedding' | 'reranking';

/** The published on-disk figure and the precision it is published at. */
export type RetrievalWeights = {
  /** Comparable size in GiB; a decimal unit is converted at the source's unit. */
  gib: number;
  /** The guide's own wording, printed so the unit and precision never hide. */
  stated: string;
  precision: string;
};

/** A runtime limit, configured limit, advertised limit, release-post limit, or
 * default truncation. */
export type RetrievalMaxInput = {
  tokens: number;
  basis: 'served' | 'config' | 'card' | 'blog' | 'default';
};

/** The vector an embedder emits: its native width, and the card's qualifier
 * (a Matryoshka floor, or `fixed` where truncation is unmeasured). */
export type RetrievalDims = {
  width: number;
  note: string | null;
};

/** A published benchmark figure and the run that produced it. A bare number
 * would invite a comparison across pools, so the run travels with it. */
export type RetrievalScore = {
  value: number;
  benchmark: string;
};

/** The scalar an embedder or reranker returns, never text. */
export type RetrievalSink = 'vector' | 'score';

export type RetrievalModel = {
  id: string;
  name: string;
  lab: string;
  kind: RetrievalKind;
  /** The checkpoint the head sits on, as the guide writes it. */
  base: string;
  params: string;
  /** Null when no source publishes a comparable weight figure. */
  weights: RetrievalWeights | null;
  /** Null when no source publishes an input limit. */
  maxInput: RetrievalMaxInput | null;
  /** An embedder's output width; null for a reranker or an unpublished card. */
  dims: RetrievalDims | null;
  /** Null when no comparable published figure exists. */
  score: RetrievalScore | null;
  /** The lab's published country; null when its card names none. */
  country: string | null;
  files: string;
  filesUrl: string | null;
  license: string;
  /** Runtimes the guide names, by the fit catalogue's own ids. */
  engineIds: readonly string[];
  /** Input channels only: the output is a vector or a score, not a channel. */
  modalities: { inputs: readonly string[]; output: RetrievalSink };
  sourceUrl: string;
};

export type RetrievalDataset = {
  meta: {
    guide: string;
    sourceUrl: string;
    checkedThrough: string;
    kinds: readonly RetrievalKind[];
  };
  models: readonly RetrievalModel[];
};
