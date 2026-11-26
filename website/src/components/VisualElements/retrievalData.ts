/**
 * Typed view of the generated retrieval dataset. The JSON is the artifact:
 * written by scripts/extract-open-weight-retrieval.mjs from the guide, never
 * edited by hand.
 *
 * The import attribute is required by Node's ESM loader, which reads this
 * module directly in the test run; the bundler accepts the same syntax.
 */
import raw from '../../generated/open-weight-retrieval.json' with { type: 'json' };

import type { RetrievalDataset, RetrievalKind } from './retrievalTypes.ts';

// JSON string literals widen to `string`, so the compiler cannot prove union
// membership. The dataset test checks every enum member and cross-reference.
export const retrieval = raw as RetrievalDataset;

/** One family, as a figure reads it: the dataset holds both. */
export const retrievalOfKind = (kind: RetrievalKind) =>
  retrieval.models.filter((model) => model.kind === kind);
