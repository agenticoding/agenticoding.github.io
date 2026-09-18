import { alignTokens } from './align.ts';

/**
 * Word error rate between the spoken script and an ASR transcript of the audio.
 *
 * Verification must use a transcript, not forced alignment: alignment forces the
 * known text onto the audio, so it can never reveal a substituted word.
 */

/** IPA lexeme tags are instructions to the TTS engine, not spoken words. */
export const stripPhonemeTags = (text: string): string =>
  text.replace(/<phoneme\b[^>]*>([\s\S]*?)<\/phoneme>/g, '$1');

/** Audio tags like `[pause]` or `[softly]` direct the TTS engine; they are never spoken. */
export const stripAudioTags = (text: string): string =>
  text.replace(/\[[^\]]*\]/g, ' ');

/** Both tag families are delivery instructions, so WER compares only spoken words. */
const stripInstructions = (text: string): string =>
  stripAudioTags(stripPhonemeTags(text));

/** Case, punctuation and markup are not pronunciation, so they are compared away. */
export function normalizeForWer(text: string): string {
  const cleaned = stripInstructions(text)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ');
  return cleaned.split(' ').filter(Boolean).join(' ');
}

const wordsOf = (text: string): string[] => (text ? text.split(' ') : []);

export function wordErrorRate(reference: string, hypothesis: string): number {
  const ref = wordsOf(normalizeForWer(reference));
  const hyp = wordsOf(normalizeForWer(hypothesis));
  if (ref.length === 0) return hyp.length === 0 ? 0 : 1;
  return alignTokens(ref, hyp).distance / ref.length;
}

const CRITICAL = [/\d/, /^[A-Z]{2,}$/, /[_.()-]/];

/**
 * A numeric range (`4–8`, `200-400`) is two values, not one indissoluble term.
 * TTS speaks the dash as "to" and ASR writes it back as "70 to 85", so the glued
 * tokens (`4 8`, `70 85` after normalization) can never match. Splitting the
 * endpoints lets the gate treat them like any other number: a multi-digit
 * endpoint stays critical, a lone digit is below the noise floor and drops out.
 */
const DIGIT_RANGE = /(?<=\d)[–—-](?=\d)/g;

/**
 * Terms whose loss is not a rounding error: numbers, acronyms, identifiers, flags.
 * ASR error on clean narration is a few percent, so the exact-match gate on these
 * terms carries the precision a WER threshold cannot.
 */
export function criticalTerms(text: string): string[] {
  const trimmed = (token: string): string =>
    token.replace(/^[^\p{L}\p{N}\-_()]+|[^\p{L}\p{N}\-_()]+$/gu, '');
  return stripInstructions(text)
    .replace(DIGIT_RANGE, ' ')
    .split(/\s+/)
    .map(trimmed)
    .filter(
      (token) =>
        token.length > 1 && CRITICAL.some((pattern) => pattern.test(token))
    );
}

/** Separator-bearing terms (`trade-offs`, `useDoc()`) may be joined or respaced by ASR. */
const SEPARATED_TERM = /[_.()-]/;
const squeezed = (text: string): string =>
  normalizeForWer(text).replace(/ /g, '');

/**
 * A dropped term counts as missing unless it survives as a whole phrase, or — for
 * terms that carry separators — as the same characters in any separator layout
 * (`trade-offs` matches `tradeoffs` and `trade offs`). Plain terms stay strict so
 * a short acronym can never match inside an unrelated word.
 */
export function missingCriticalTerms(
  reference: string,
  hypothesis: string
): string[] {
  const heardPhrase = ` ${normalizeForWer(hypothesis)} `;
  const heardSqueezed = squeezed(hypothesis);
  return [...new Set(criticalTerms(reference))]
    .filter((term) => {
      if (heardPhrase.includes(` ${normalizeForWer(term)} `)) return false;
      return !(
        SEPARATED_TERM.test(term) && heardSqueezed.includes(squeezed(term))
      );
    })
    .sort();
}
