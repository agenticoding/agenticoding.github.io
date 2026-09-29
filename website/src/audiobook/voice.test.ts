import assert from 'node:assert/strict';
import test from 'node:test';
import { AUDIO_CONFIG } from './config.ts';
import { medianPitchHz, voiceProblems, type TurnPitch } from './voice.ts';

const SAMPLE_RATE = AUDIO_CONFIG.sourceSampleRate;
const GATES = AUDIO_CONFIG.voice;

/**
 * A pure tone at `hz`, long enough to clear the gate's `minVoicedFrames`. Synthetic
 * input keeps these tests on the real DSP path without a binary audio fixture.
 */
function tone(hz: number, ms: number, amplitude = 12000): Int16Array {
  const samples = Math.round((ms / 1000) * SAMPLE_RATE);
  return Int16Array.from({ length: samples }, (_, index) =>
    Math.round(amplitude * Math.sin((2 * Math.PI * hz * index) / SAMPLE_RATE))
  );
}

const turn = (
  unitId: string,
  speaker: 'alex' | 'sam',
  pitchHz: number
): TurnPitch => ({
  unitId,
  segmentId: `${unitId}-${speaker}`,
  speaker,
  pitchHz,
});

// The two configured hosts are a female and a male voice; the gate only works if
// the estimator can tell those registers apart.
test('medianPitchHz recovers the two host registers', () => {
  const male = medianPitchHz(tone(110, 1500), SAMPLE_RATE, GATES);
  const female = medianPitchHz(tone(190, 1500), SAMPLE_RATE, GATES);
  assert.ok(male !== null && Math.abs(male - 110) / 110 < 0.05);
  assert.ok(female !== null && Math.abs(female - 190) / 190 < 0.05);
});

test('medianPitchHz reports silence as unmeasurable', () => {
  assert.equal(
    medianPitchHz(new Int16Array(SAMPLE_RATE), SAMPLE_RATE, GATES),
    null
  );
});

test('a sub-minVoicedFrames short turn measures null and its chapter is skipped', () => {
  // 200 ms of loud tone yields ~9 voiced frames < minVoicedFrames (20):
  // too short to measure on the real DSP path, so the gate skips, not flags.
  assert.equal(medianPitchHz(tone(190, 200), SAMPLE_RATE, GATES), null);
  const short = (unitId: string, speaker: 'alex' | 'sam'): TurnPitch => ({
    unitId,
    segmentId: `${unitId}-${speaker}`,
    speaker,
    pitchHz: null,
  });
  assert.deepEqual(
    voiceProblems(
      [short('c1', 'alex'), short('c1', 'sam')],
      GATES
    ),
    []
  );
});

test('medianPitchHz reports a tone below the voiced RMS floor as unmeasurable', () => {
  // Amplitude 100 ≈ RMS 71 < voicedRmsFloor (250): a low-SNR take measures
  // null instead of hallucinating a pitch from noise.
  assert.equal(medianPitchHz(tone(190, 1500, 100), SAMPLE_RATE, GATES), null);
});

test('voiceProblems skips an all-silence chapter instead of flagging it', () => {
  const silent = (unitId: string, speaker: 'alex' | 'sam'): TurnPitch => ({
    unitId,
    segmentId: `${unitId}-${speaker}`,
    speaker,
    pitchHz: medianPitchHz(new Int16Array(SAMPLE_RATE), SAMPLE_RATE, GATES),
  });
  const turns = [
    silent('c1', 'alex'),
    silent('c1', 'sam'),
    silent('c2', 'alex'),
    silent('c2', 'sam'),
  ];
  assert.ok(turns.every((turn) => turn.pitchHz === null));
  assert.deepEqual(voiceProblems(turns, GATES), []);
});

test('voiceProblems accepts a chapter where both hosts are present', () => {
  const turns = [
    turn('c1', 'alex', 190),
    turn('c1', 'sam', 110),
    turn('c4', 'alex', 185),
    turn('c4', 'sam', 115),
  ];
  assert.deepEqual(voiceProblems(turns, GATES), []);
});

// The shipped defect: one chunk's Sam turns came back in the Alex voice.
test('voiceProblems flags the chunk whose take never reaches the second register', () => {
  const turns = [
    turn('c1', 'alex', 190),
    turn('c1', 'sam', 110),
    turn('c2', 'alex', 185),
    turn('c2', 'sam', 115),
    turn('c4', 'alex', 180),
    turn('c4', 'sam', 178),
  ];
  const problems = voiceProblems(turns, GATES);
  assert.deepEqual(
    problems.map((problem) => problem.unitId),
    ['c4']
  );
  assert.match(problems[0].problem, /never reaches Sam's register/);
});

// Per-turn ASR boundaries drift inside a take; the gate must judge the take, not the label.
test('voiceProblems tolerates turn-boundary drift while both registers are present', () => {
  const turns = [
    turn('c1', 'alex', 190),
    turn('c1', 'sam', 110),
    turn('c2', 'alex', 188),
    turn('c2', 'sam', 112),
    turn('c2', 'alex', 185),
    turn('c2', 'sam', 108),
    turn('c2', 'alex', 191),
    turn('c2', 'sam', 114),
    turn('c3', 'alex', 112),
    turn('c3', 'sam', 188),
    turn('c3', 'alex', 108),
    turn('c3', 'sam', 186),
  ];
  assert.deepEqual(voiceProblems(turns, GATES), []);
});

test('voiceProblems catches a chapter rendered in a single voice', () => {
  const turns = [
    turn('c1', 'alex', 180),
    turn('c1', 'sam', 182),
    turn('c2', 'alex', 178),
    turn('c2', 'sam', 175),
  ];
  const problems = voiceProblems(turns, GATES);
  assert.deepEqual(
    problems.map((problem) => problem.unitId),
    ['c1', 'c2']
  );
  assert.match(problems[0].problem, /one voice/);
});

test('voiceProblems stays silent when only one host is present', () => {
  assert.deepEqual(voiceProblems([turn('c1', 'alex', 190)], GATES), []);
});

// One Sam sample is not a register: a Sam-light chapter must skip, not re-roll-loop.
test('voiceProblems skips a chapter with a single measurable Sam turn', () => {
  const turns = [
    turn('c1', 'alex', 190),
    turn('c1', 'sam', 188),
    turn('c2', 'alex', 185),
    turn('c2', 'alex', 192),
  ];
  assert.deepEqual(voiceProblems(turns, GATES), []);
});

// Short-turn chapters measure nothing: null pitches on both sides must skip too.
test('voiceProblems skips a chapter with too few measurable turns per role', () => {
  const unmeasurable = (
    unitId: string,
    speaker: 'alex' | 'sam'
  ): TurnPitch => ({
    unitId,
    segmentId: `${unitId}-${speaker}`,
    speaker,
    pitchHz: null,
  });
  const turns = [
    unmeasurable('c1', 'alex'),
    unmeasurable('c1', 'sam'),
    turn('c2', 'alex', 190),
    unmeasurable('c2', 'sam'),
  ];
  assert.deepEqual(voiceProblems(turns, GATES), []);
});

// The floor must not swallow the real defect: a mono take with enough turns still fails.
test('voiceProblems still fails a mono take with enough measurable turns', () => {
  const turns = [
    turn('c1', 'alex', 180),
    turn('c1', 'sam', 182),
    turn('c1', 'alex', 178),
    turn('c1', 'sam', 175),
  ];
  const problems = voiceProblems(turns, GATES);
  assert.deepEqual(
    problems.map((problem) => problem.unitId),
    ['c1']
  );
  assert.match(problems[0].problem, /one voice/);
});
