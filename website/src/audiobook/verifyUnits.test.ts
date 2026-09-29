import assert from 'node:assert/strict';
import test from 'node:test';
import { AUDIO_CONFIG } from './config.ts';
import type { TurnPitch } from './voice.ts';
import {
  attachVoiceProblems,
  turnPitches,
  unitRequiredTerms,
} from '../../../scripts/audiobook/verify.mjs';

// The verify unit is the render unit: each chunk is gated only on the terms it
// actually speaks, so a chapter-level required term must not fail a chunk that
// never says it.

test('unitRequiredTerms keeps a term the unit text speaks', () => {
  assert.deepEqual(
    unitRequiredTerms('Deploy the AI safely over HTTP/2.', ['AI', 'HTTP/2']),
    ['AI', 'HTTP/2']
  );
});

test('unitRequiredTerms drops terms spoken only elsewhere in the chapter', () => {
  assert.deepEqual(
    unitRequiredTerms('Deploy the AI safely.', ['AI', 'strawberry']),
    ['AI']
  );
});

test('unitRequiredTerms matches case- and punctuation-insensitively', () => {
  assert.deepEqual(unitRequiredTerms('Deploy the AI safely.', ['ai']), ['ai']);
  assert.deepEqual(unitRequiredTerms('Hello, world!', ['WORLD']), ['WORLD']);
  assert.deepEqual(
    unitRequiredTerms('the physician salary gap', ['Physician Salary']),
    ['Physician Salary']
  );
});

// turnPitches tags every part with its owning render unit: unitId is what the
// build's re-roll loop discards, so a misattributed turn would retry the wrong take.
// Silence keeps the test on the real DSP path with a deterministic null pitch.
const silence = (): Buffer =>
  Buffer.alloc(AUDIO_CONFIG.sourceSampleRate * 2);

test('turnPitches attributes every part to its owning render unit', () => {
  const stream = {
    units: [
      { id: 'c1', partIndexes: [0, 1] },
      { id: 'c2', partIndexes: [2] },
    ],
    parts: [
      { pcm: silence(), segment: { id: 'c1-alex', speaker: 'alex' } },
      { pcm: silence(), segment: { id: 'c1-sam', speaker: 'sam' } },
      { pcm: silence(), segment: { id: 'c2-alex', speaker: 'alex' } },
    ],
  };
  const turns = turnPitches(stream);
  assert.deepEqual(
    turns.map((turn: TurnPitch) => [turn.unitId, turn.segmentId, turn.speaker]),
    [
      ['c1', 'c1-alex', 'alex'],
      ['c1', 'c1-sam', 'sam'],
      ['c2', 'c2-alex', 'alex'],
    ]
  );
});

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

const segment = (segmentId: string) => ({ segmentId, problems: [] });

// The shipped defect shape: one chunk's Sam turns came back in the Alex voice,
// so only that chunk's segment may fail.
test('attachVoiceProblems lands the failure on the owning render unit', () => {
  const segments = [segment('c1'), segment('c4')];
  attachVoiceProblems(segments, [
    turn('c1', 'alex', 190),
    turn('c1', 'sam', 110),
    turn('c2', 'alex', 185),
    turn('c2', 'sam', 115),
    turn('c4', 'alex', 180),
    turn('c4', 'sam', 178),
  ]);
  assert.deepEqual(segments[0].problems, []);
  assert.equal(segments[1].problems.length, 1);
  assert.match(segments[1].problems[0], /never reaches Sam's register/);
});

test('attachVoiceProblems ignores a problem for an unknown unit', () => {
  const segments = [segment('c1')];
  attachVoiceProblems(segments, [
    turn('c9', 'alex', 180),
    turn('c9', 'sam', 182),
  ]);
  assert.deepEqual(segments[0].problems, []);
});
