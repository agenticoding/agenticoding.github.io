/**
 * Verify — did the model actually say the script, at a publishable level?
 *
 * WER comes from an ASR transcript (gemini-3.5-transcribe, word timestamps off),
 * never from forced alignment: alignment forces the known text onto the audio, so
 * it can never reveal a substitution (D2). Loudness, silence and joins come from
 * ffmpeg, which is already a pipeline requirement.
 *
 * Gates fail closed: a metric ffmpeg did not report (`-inf`, missing) is a FAIL,
 * because an unmeasured segment is not a verified segment.
 */
import { spliceProblems } from '../../website/src/audiobook/artifacts.ts';
import { AUDIO_CONFIG } from '../../website/src/audiobook/config.ts';
import { missingCriticalTerms, wordErrorRate } from '../../website/src/audiobook/wer.ts';
import { asInt16, log, measureChapter, measureLevels, pcmBytesForMs, reportFile, statusLine, table, transcribe, writeJson } from './report.mjs';

/**
 * Integrated loudness is a chapter-file contract, not a per-segment one: natural
 * speech varies by more than a decibel between segments even after normalization,
 * so gating each segment against the chapter's loudness would only force pumping.
 * A segment is held to WER, critical terms, a true-peak ceiling and a non-silent
 * RMS floor; the whole chapter carries the loudness window and the joins.
 */
export function segmentProblems(wer, missing, levels) {
  const gates = AUDIO_CONFIG.gates;
  const problems = [];
  if (!(wer <= gates.werMax)) problems.push(`wer ${wer.toFixed(3)} > ${gates.werMax}`);
  if (missing.length) problems.push(`missing: ${missing.join(', ')}`);
  if (!(levels.truePeakDb <= gates.truePeakMaxDb)) problems.push(`peak ${levels.truePeakDb} > ${gates.truePeakMaxDb} dBFS`);
  if (!(levels.rmsDb >= gates.segmentRmsMinDb)) problems.push(`rms ${levels.rmsDb} < ${gates.segmentRmsMinDb} dB`);
  return problems;
}

async function verifySegment(segment, pcm) {
  const { text: transcript } = await transcribe(pcm);
  const wer = wordErrorRate(segment.text, transcript);
  const missing = missingCriticalTerms(segment.text, transcript);
  const levels = measureLevels(pcm);
  return { segmentId: segment.id, kind: segment.kind, wer, missing, ...levels, transcript, problems: segmentProblems(wer, missing, levels) };
}

/**
 * Loudness is a WINDOW, not a target: the master picks the loudest gain the true peak
 * allows, so a chapter may come out quieter than the book, never louder. The floor
 * only catches a master that came out broken.
 */
function loudnessProblems(chapter) {
  const gates = AUDIO_CONFIG.gates;
  const problems = [];
  if (!(chapter.lufs <= gates.lufsMaxDb)) problems.push(`lufs ${chapter.lufs} over the ${gates.lufsMaxDb} ceiling`);
  if (!(chapter.lufs >= gates.lufsMinDb)) problems.push(`lufs ${chapter.lufs} under the ${gates.lufsMinDb} floor`);
  if (!(chapter.truePeakDb <= gates.truePeakMaxDb)) problems.push(`peak ${chapter.truePeakDb} > ${gates.truePeakMaxDb} dBFS`);
  return problems;
}

export function chapterProblems(chapter) {
  return [...loudnessProblems(chapter), ...(chapter.joinProblems ?? [])];
}

/** Sample offset of every interior chunk join: where two independently rendered takes meet. */
const chunkJoins = (stream) =>
  stream.units.slice(1).map((unit) => pcmBytesForMs(stream.spans[unit.partIndexes[0]].startMs) >> 1);

/**
 * Verifies the mastered chapter stream, so the gates measure the bytes encode
 * publishes. The verify unit is the render unit — one dialogue chunk — and every
 * dialogue stream must declare its units. Per-turn slices are for marks only:
 * their acoustic boundaries are approximate, so a per-turn ASR would fail WER
 * spuriously.
 */
/** Each verify unit is re-transcribed and gated on its own PCM slice. */
async function verifyUnits(stream) {
  const segments = [];
  for (const unit of stream.units) {
    const pcm = Buffer.concat(unit.partIndexes.map((index) => stream.parts[index].pcm));
    segments.push(await verifySegment({ id: unit.id, kind: unit.kind, text: unit.text }, pcm));
  }
  return segments;
}

/** The chapter-level report: loudness/peak on the mastered PCM plus the chunk-join checks. */
function chapterReport(script, stream, segments) {
  const gates = AUDIO_CONFIG.gates;
  const joinProblems = spliceProblems(
    asInt16(stream.pcm),
    AUDIO_CONFIG.sourceSampleRate,
    chunkJoins(stream),
    gates.spliceSilenceMaxRmsDb,
    gates.spliceMaxStepLsb
  );
  return {
    chapterId: script.chapterId,
    narrationHash: script.contentHash,
    ...measureChapter(stream.pcm),
    joinProblems,
    segments,
  };
}

export async function verifyChapter(script, stream) {
  if (!stream.units) throw new Error(`${script.chapterId}: stream carries no verify units`);
  const report = chapterReport(script, stream, await verifyUnits(stream));
  writeJson(reportFile(script.chapterId), { ...report, problems: verifyProblems(report) });
  return report;
}

/** All gate failures for one chapter, in segment order, as explicit strings. */
export function verifyProblems(report) {
  const problems = report.segments.flatMap((segment) => segment.problems.map((problem) => `${segment.segmentId}: ${problem}`));
  return [...problems, ...chapterProblems(report).map((problem) => `chapter: ${problem}`)];
}

const fmt = (value) => (Number.isFinite(value) ? value.toFixed(1) : String(value));

export function printVerification(script, report) {
  const rows = report.segments.map((segment) => [
    segment.segmentId,
    segment.kind,
    segment.wer.toFixed(3),
    fmt(segment.lufs),
    fmt(segment.truePeakDb),
    fmt(segment.rmsDb),
    segment.problems.length ? 'FAIL' : 'PASS',
    segment.problems.join('; '),
  ]);
  console.log(table(['segment', 'kind', 'wer', 'lufs', 'peak', 'rms', 'gate', 'detail'], rows));
  console.log(statusLine(chapterProblems(report).length === 0, 'chapter', `${fmt(report.lufs)} LUFS / ${fmt(report.truePeakDb)} dBFS peak`));
  log('verify', `${script.chapterId}: ${verifyProblems(report).length} problem(s) across ${report.segments.length} segments`);
}
