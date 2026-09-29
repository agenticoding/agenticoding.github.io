import { figureDrawnLabels } from '../components/VisualElements/figureDrawnLabels.ts';
import { normalizeForWer } from './wer.ts';

/**
 * Guard against audio that reads the drawing aloud.
 *
 * `figureDrawnLabels.ts` lists the words a diagram paints; naming one out loud tells a
 * listener nothing they can see ("the row that says trust earned"). The check is
 * word-aligned and case/punctuation-insensitive — it runs on `normalizeForWer` output,
 * the same normalization the WER gate uses, so audio tags and quotes cannot hide a
 * label or split one across a hyphen.
 */

/** Token-aligned haystack/needle: padded so a hit is a whole word run, not a infix. */
const words = (text: string): string => ` ${normalizeForWer(text)} `;

/** Declared labels of one figure's component that a spoken text names, in map order. */
export function drawnLabelHits(
  visual: string | undefined,
  text: string
): string[] {
  if (!visual) return [];
  const spoken = words(text);
  return (figureDrawnLabels[visual] ?? []).filter((label) =>
    spoken.includes(words(label))
  );
}

/** The shared complaint, so extraction and dialogue cannot drift apart in wording. */
export const drawnLabelProblem = (label: string): string =>
  `names "${label}": text drawn inside the figure — a listener cannot see the page, so voice the idea, not the diagram`;
