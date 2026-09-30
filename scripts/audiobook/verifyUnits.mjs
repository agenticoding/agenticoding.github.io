/**
 * The render-unit model: the grain the build's re-roll loop discards and the
 * website unit test gates (`website/src/audiobook/verifyUnits.test.ts`).
 *
 * Imported by verify.mjs and the test, but never by the provider path: the test
 * runs under the website suite, which installs only `website/` deps, so pulling
 * report.mjs (and its `@google/genai`) in here would fail CI. Keep this module's
 * graph to pure website logic plus primitives.mjs.
 */
import { AUDIO_CONFIG } from '../../website/src/audiobook/config.ts';
import { normalizeForWer } from '../../website/src/audiobook/wer.ts';
import { medianPitchHz, voiceProblems } from '../../website/src/audiobook/voice.ts';
import { asInt16, warn } from './primitives.mjs';

/** Declared terms this unit owns: those that actually occur in its text (they live in one chunk). */
export const unitRequiredTerms = (text, requiredTerms) => {
  const haystack = ` ${normalizeForWer(text)} `;
  return requiredTerms.filter((term) => haystack.includes(` ${normalizeForWer(term)} `));
};

/**
 * Per-turn pitch, tagged with the render unit that owns the turn.
 * `unitId` is what the build's re-roll loop discards, so a collapsed take is retried.
 */
export function turnPitches(stream) {
  const unitOfPart = new Map();
  stream.units.forEach((unit) => unit.partIndexes.forEach((index) => unitOfPart.set(index, unit.id)));
  return stream.parts.map((part, index) => {
    const unitId = unitOfPart.get(index);
    // A part with no owning unit would verify under `undefined`: warn loudly instead of passing silently.
    if (unitId === undefined) warn('verify', `part ${index} (${part.segment.id}) has no owning unit`);
    return {
      unitId,
      segmentId: part.segment.id,
      speaker: part.segment.speaker,
      pitchHz: medianPitchHz(asInt16(part.pcm), AUDIO_CONFIG.sourceSampleRate, AUDIO_CONFIG.voice),
    };
  });
}

/** Appends each voice-identity failure to the render unit it belongs to. */
export function attachVoiceProblems(segments, turns) {
  voiceProblems(turns, AUDIO_CONFIG.voice).forEach(({ unitId, problem }) => {
    const segment = segments.find((segment) => segment.segmentId === unitId);
    // A problem with no owning segment would vanish: warn loudly instead of dropping it.
    if (!segment) warn('verify', `voice problem for unit ${unitId} has no matching segment: ${problem}`);
    else segment.problems.push(problem);
  });
}
