import assert from 'node:assert/strict';
import test from 'node:test';
import { alignTokens, parseOffsetToMs } from './align.ts';

test('parseOffsetToMs parses fractional and whole-second offsets', () => {
  assert.equal(parseOffsetToMs('0.200s'), 200);
  assert.equal(parseOffsetToMs('1s'), 1000);
  assert.equal(parseOffsetToMs('1.567s'), 1567);
});

test('parseOffsetToMs throws on non-numeric offsets', () => {
  assert.throws(() => parseOffsetToMs('soon'));
  assert.throws(() => parseOffsetToMs('200'));
});

test('alignTokens handles empty arrays', () => {
  assert.deepEqual(alignTokens([], []), { distance: 0, refToHyp: [] });
  assert.equal(alignTokens(['a'], []).distance, 1);
  assert.equal(alignTokens([], ['a']).distance, 1);
});

test('alignTokens maps identical sequences with distance 0', () => {
  assert.deepEqual(alignTokens(['a', 'b'], ['a', 'b']), {
    distance: 0,
    refToHyp: [0, 1],
  });
});

test('alignTokens counts a substitution as distance 1', () => {
  assert.deepEqual(alignTokens(['a', 'b'], ['a', 'c']), {
    distance: 1,
    refToHyp: [0, 1],
  });
});

test('alignTokens marks a deleted ref token as -1', () => {
  assert.deepEqual(alignTokens(['a', 'b', 'c'], ['a', 'c']), {
    distance: 1,
    refToHyp: [0, -1, 1],
  });
});

test('alignTokens skips an inserted hyp token', () => {
  assert.deepEqual(alignTokens(['a', 'c'], ['a', 'b', 'c']), {
    distance: 1,
    refToHyp: [0, 2],
  });
});
