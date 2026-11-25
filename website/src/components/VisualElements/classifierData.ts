/**
 * Typed view of the generated classifier dataset. The JSON is the artifact:
 * written by scripts/extract-open-weight-classifiers.mjs from the guide, never
 * edited by hand.
 *
 * The import attribute is required by Node's ESM loader, which reads this
 * module directly in the test run; the bundler accepts the same syntax.
 */
import raw from '../../generated/open-weight-classifiers.json' with { type: 'json' };

import type { ClassifierDataset } from './classifierTypes.ts';

// JSON string literals widen to `string`, so the compiler cannot prove union
// membership. The dataset test checks every enum member and cross-reference.
export const classifiers = raw as ClassifierDataset;
