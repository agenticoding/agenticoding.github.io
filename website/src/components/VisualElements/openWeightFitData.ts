/**
 * Typed view of the generated dataset. The JSON is the artifact: written by
 * scripts/extract-open-weight-fit.mjs from the guide, never edited by hand.
 *
 * The import attribute is required by Node's ESM loader, which reads this
 * module directly in the test run; the bundler accepts the same syntax.
 */
import raw from '../../generated/open-weight-fit.json' with { type: 'json' };

import type { FitDataset } from './openWeightFitTypes.ts';

// JSON string literals widen to `string`, so the compiler cannot prove union
// membership. openWeightFitData.test.ts checks every enum member and every
// cross-reference instead.
export const dataset = raw as FitDataset;
