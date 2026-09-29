import { AUDIO_CONFIG } from './config.ts';
import { normalizeForWer } from './wer.ts';

/**
 * Spoken-text guard for visual deixis.
 *
 * A listener cannot see the page, so any spoken reference to an on-page visual
 * ("the figure above", "shown below") points at nothing audible. Source prose may
 * keep its figure references — a sighted reader sees them — but the text that
 * becomes the voice (dialogue turns and figure/code narration) must carry the idea,
 * not the pointer. The vocabulary is `AUDIO_CONFIG.deixis` (single source of truth);
 * this module only composes it into patterns and matches.
 */

const { visualNouns, pointers, positions } = AUDIO_CONFIG.deixis;

/** Config holds the singular form; the plural is matched by the same pattern. */
const nouns = visualNouns.map((noun) => `${noun}s?`).join('|');
const determiners = 'the|this|that|these|those';
const locators = pointers.join('|');
const layout = positions.join('|');
/** Verbs that turn a visual into a pointer: "shown above", "as illustrated". */
const verbs = 'shown|illustrated|depicted';
/**
 * "labelled" is also machine-learning vocabulary: `labeled examples/data/training` means
 * annotated, not drawn on the page. Only the drawing-walkthrough sense is a defect
 * ("a gear labelled LLM", "the row labelled Revenue"), so the ML collocations are let
 * through — same job the "<noun> of" lookahead does for "the figure of speech".
 */
const labelIdioms =
  'examples?|data|datasets?|samples?|instances?|inputs?|outputs?|training|annotations?|corpus|ground|truth';

/**
 * The patterns are deliberately word-based, not proximity-based: each one is a
 * shape a visual reference actually takes ("the diagram", "the above figure",
 * "figure 3", "shown below", "left panel"). Matching on `normalizeForWer` output
 * means case, punctuation and audio tags can never hide or split a reference. The
 * bare "<determiner> <noun>" case rejects a following "of" so idioms that share a
 * visual noun ("the figure of speech", "the chart of accounts") are not flagged —
 * and a layout word only counts when it is attached to a visual noun, never bare.
 */
const DEIXIS = new RegExp(
  [
    `\\b(?:${determiners})\\s+(?:(?:${locators})\\s+)?(?:${nouns})\\b(?!\\s+of\\b)`, // the figure / the above figure
    `\\b(?:${locators})\\s+(?:${nouns})\\b`, // next diagram / earlier figure
    `\\b(?:${nouns})\\s+(?:above|below|${verbs}|there|\\d+)\\b`, // figure above / figure 3
    `\\b(?:${verbs})\\s+(?:above|below)\\b`, // shown below
    `\\bthe\\s+(?:above|below)\\b`, // the above
    `\\bas\\s+(?:${verbs})\\b`, // as shown / as illustrated
    `\\b(?:${layout})\\s+(?:${nouns})\\b(?!\\s+of\\b)`, // left panel / top tile
    `\\blabell?ed\\b(?!\\s+(?:${labelIdioms})\\b)`, // a gear labelled LLM
  ].join('|'),
  'g'
);

/** Every visual reference in a text, lowercased and deduped, in first-seen order. */
export function visualDeixisHits(text: string): string[] {
  const normalized = normalizeForWer(text);
  const hits = [...normalized.matchAll(DEIXIS)].map((match) => match[0]);
  return [...new Set(hits)];
}
