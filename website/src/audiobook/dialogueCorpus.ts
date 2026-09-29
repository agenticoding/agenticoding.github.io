import { AUDIO_DOC_IDS, chapterMeta } from './docs.ts';
import { buildCorpus, type Corpus } from './lexical.ts';
import { isDialogueChapter, loadDialogueFile } from './dialogueTypes.ts';

let wholeBook: Corpus | null = null;

/**
 * Live per-run IDF over every doc block plus every dialogue turn in the book,
 * memoized per process and discarded at exit (never persisted). A malformed
 * dialogue file fails loudly; the failed cache build is retried on the next call.
 * Per-chapter violation conversion skipped: this returns a bare `Corpus` consumed
 * as a default param (`dialogueLexical.ts`), so there is no violations channel —
 * threading one through would change every caller for no gain; the loud throw stays.
 */
export function wholeBookCorpus(): Corpus {
  if (!wholeBook) {
    const texts: string[] = [];
    for (const docId of AUDIO_DOC_IDS) {
      texts.push(...chapterMeta(docId).blocks.map((block) => block.text));
      if (isDialogueChapter(docId)) {
        const dialogue = loadDialogueFile(docId);
        if (!dialogue) throw new Error(`${docId}: dialogue file disappeared while building corpus`);
        texts.push(...dialogue.turns.map((turn) => turn.text));
      }
    }
    const corpus = buildCorpus(texts);
    // Corpus shape log: doc count is the drift signal (a chapter that stops contributing changes every score).
    console.log(`[corpus] built from ${corpus.documents} documents across ${AUDIO_DOC_IDS.length} chapters`);
    wholeBook = corpus;
  }
  return wholeBook;
}

/** Test-only reset for the memoized corpus: the next call rebuilds from disk. */
export const resetWholeBookCorpus = (): void => {
  wholeBook = null;
};
