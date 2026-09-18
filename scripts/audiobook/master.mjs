/**
 * Master — the loudness stage between raw TTS takes and verification/encode.
 *
 * The model returns hot, unnormalized PCM (true peaks near 0 dBFS), and publishing
 * needs one consistent loudness across the whole book, so each chapter is scaled
 * once by a single scalar gain held under two ceilings at the same time: the
 * true-peak ceiling, so nothing clips, and the book's loudness ceiling, so no
 * chapter is louder than the book.
 *
 * Those two cannot both be a fixed target for this material: raw TTS sits ~19.5 dB
 * below its own true peak, so normalizing up to -19 LUFS puts the peak ~3.5 dB over
 * the ceiling. ffmpeg's loudnorm resolved that silently, by limiting: it modulated
 * the loudest syllables by up to 3.6 dB, which is audible as pumping. So the gain is
 * computed here and applied with `volume`, and the result is asserted to be that one
 * gain — a master may be quiet, but it may never pump.
 */
import { linearityProblems } from '../../website/src/audiobook/artifacts.ts';
import { AUDIO_CONFIG } from '../../website/src/audiobook/config.ts';
import { asInt16, FFMPEG, log, measureChapter, PCM_HEAD, PCM_INPUT, pcmBytesForMs, runTool } from './report.mjs';

const PCM_OUTPUT = [...PCM_HEAD, '-'];

/**
 * Both ceilings are targeted half a dB under their gate: a master that lands exactly
 * on a ceiling can measure a hair over it and fail its own gate.
 */
const CEILING_MARGIN_DB = 0.5;

/** `volume` decodes to float and re-quantizes, so a correct gain still drifts by a sample step or two. */
const LINEARITY_TOLERANCE_LSB = 2;

/** The loudest gain the chapter can take without clipping: peak headroom first, then the book's ceiling. */
const gainDbFor = (measured) =>
  Math.min(
    AUDIO_CONFIG.gates.truePeakMaxDb - CEILING_MARGIN_DB - measured.truePeakDb,
    AUDIO_CONFIG.gates.lufsMaxDb - CEILING_MARGIN_DB - measured.lufs
  );

/** A metric ffmpeg did not report is not a measurement: fail loudly instead of scaling by NaN. */
function measuredOrFail(pcm) {
  const measured = measureChapter(pcm);
  if (!Number.isFinite(measured.lufs) || !Number.isFinite(measured.truePeakDb)) {
    throw new Error(`mastering needs a loudness and a true-peak measurement, got ${JSON.stringify(measured)}`);
  }
  return measured;
}

/**
 * Applies the one gain, then proves it: the bytes verify and encode consume must be the
 * linear gain the chapter was designed around, or the master is pumping and nothing
 * downstream can fix that.
 */
export function masterPcm(pcm) {
  const gainDb = gainDbFor(measuredOrFail(pcm));
  log('master', `${gainDb.toFixed(2)} dB, peak-safe at ${AUDIO_CONFIG.gates.truePeakMaxDb} dBFS and ${AUDIO_CONFIG.gates.lufsMaxDb} LUFS`);
  const mastered = runTool(FFMPEG, [...PCM_INPUT, '-af', `volume=${gainDb.toFixed(6)}dB`, ...PCM_OUTPUT], pcm).stdout;
  // Segment spans are byte offsets into the raw stream; scaling must not move them.
  if (mastered.length !== pcm.length) {
    throw new Error(`mastering changed the chapter length (${pcm.length} -> ${mastered.length} bytes); segment spans would be wrong`);
  }
  const problems = linearityProblems(asInt16(pcm), asInt16(mastered), 10 ** (gainDb / 20), LINEARITY_TOLERANCE_LSB);
  if (problems.length) throw new Error(`master file is not a linear gain: ${problems.join('; ')}`);
  return { pcm: mastered, gainDb };
}

/**
 * Normalizes an already-assembled stream. Taking the stream (not the script) keeps
 * this pure: `dialogueStream(script)` assembles it, and every chapter gets the same
 * loudness treatment.
 */
export function masterStream(stream) {
  const { pcm } = masterPcm(stream.pcm);
  const parts = stream.parts.map((part, index) => ({
    ...part,
    pcm: pcm.subarray(pcmBytesForMs(stream.spans[index].startMs), pcmBytesForMs(stream.spans[index].endMs)),
  }));
  return { ...stream, pcm, parts };
}
