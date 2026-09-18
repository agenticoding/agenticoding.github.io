import assert from 'node:assert/strict';
import test from 'node:test';
import { linearityProblems, spliceProblems } from './artifacts.ts';

const SAMPLE_RATE = 24000;

test('a pure gain is accepted as linear', () => {
  const raw = Int16Array.from([0, 1000, -1000, 32767, -32768, 12]);
  const mastered = Int16Array.from(raw, (value) => Math.round(value * 0.5));
  assert.deepEqual(linearityProblems(raw, mastered, 0.5, 1), []);
});

test('a gain that moves mid-chapter is reported with its worst sample', () => {
  const raw = Int16Array.from([0, 1000, 1000, 1000]);
  const mastered = Int16Array.from([0, 500, 300, 500]);
  const problems = linearityProblems(raw, mastered, 0.5, 1);
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /200 LSB off/);
});

test('a length change is a failure, because segment spans are byte offsets', () => {
  const problems = linearityProblems(
    Int16Array.from([1, 2, 3]),
    Int16Array.from([1, 2]),
    1,
    1
  );
  assert.match(problems[0]!, /differs from the raw/);
});

const silence = (length: number, level = 0): Int16Array => {
  const pcm = new Int16Array(length);
  if (level !== 0) pcm.fill(level);
  return pcm;
};

test('a join into silence is accepted', () => {
  assert.deepEqual(
    spliceProblems(silence(4000), SAMPLE_RATE, [2000], -50, 1024),
    []
  );
});

test('a join inside speech is reported', () => {
  const problems = spliceProblems(
    silence(4000, 8000),
    SAMPLE_RATE,
    [2000],
    -50,
    1024
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /0\.083s sits in/);
});

test('a step across an otherwise quiet join is reported as a click', () => {
  const pcm = silence(4000);
  pcm[2000] = 2000;
  const problems = spliceProblems(pcm, SAMPLE_RATE, [2000], -20, 1024);
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /steps 2000 LSB/);
});

test('every join is checked, and only the offending one is reported', () => {
  const pcm = silence(9000);
  pcm.fill(8000, 6000, 9000);
  const problems = spliceProblems(pcm, SAMPLE_RATE, [1000, 6000], -50, 1024);
  assert.equal(problems.length, 2);
  assert.ok(problems.every((problem) => problem.includes('0.250s')));
});
