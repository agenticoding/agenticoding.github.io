import { existsSync, readFileSync } from 'node:fs';
import type { SpeakerRole } from './config.ts';
import type { Anchor } from './schemas.ts';

/** One authored turn: who speaks, what they say, and where it highlights. */
export type DialogueTurn = {
  id: string;
  speaker: SpeakerRole;
  text: string;
  anchor: Anchor;
  label?: string;
};

/**
 * A source critical term the voice describes instead of speaks: an arbitrary
 * example literal (a random hash in a quoted benchmark prompt), never a
 * semantic number, identifier or flag. The book text keeps the literal; only
 * the ear is spared. `reason` is required so the coverage gate can tell a
 * listenability fix from a term that matters being hidden.
 */
export type DescribedLiteral = {
  term: string;
  reason: string;
};

/**
 * A plain source word (or quoted example) the pattern classifier cannot see and
 * the voice must therefore speak verbatim. The symmetric counterpart to
 * `describedLiterals`: where that exempts a term from the required set, this adds
 * one. `reason` is required so the field cannot become a dumping ground.
 */
export type DeclaredCriticalTerm = {
  term: string;
  reason: string;
};

/** Committed, diffable dialogue script. Audio lags it; `sourceHash` detects drift. */
export type DialogueFile = {
  chapterId: string;
  sourceHash: string;
  turns: DialogueTurn[];
  describedLiterals?: DescribedLiteral[];
  declaredCriticalTerms?: DeclaredCriticalTerm[];
};

export const dialogueFile = (id: string): URL =>
  new URL(`../../audio/dialogue/${id}.json`, import.meta.url);

export const loadDialogueFile = (id: string): DialogueFile | null => {
  const file = dialogueFile(id);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as DialogueFile;
  } catch (error) {
    // A raw SyntaxError names no file; the operator would be debugging a mystery.
    throw new Error(
      `${file.pathname}: malformed dialogue JSON — ${error.message}`
    );
  }
};

/** Routing predicate: a committed dialogue script selects the two-speaker path. */
export const isDialogueChapter = (id: string): boolean =>
  existsSync(dialogueFile(id));
