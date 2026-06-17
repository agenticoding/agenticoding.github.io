import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSequenceMessageGhostReached,
  getSequenceRowReached,
  getSequenceRowThreshold,
  sequenceDiagramReveal,
} from './sequenceDiagramReveal.ts';

test('sequence rows stay unreached until their threshold, then reveal and hide the message ghost together', () => {
  const rowCount = 3;
  const secondRow = 1;
  const threshold = getSequenceRowThreshold(secondRow, rowCount);

  assert.equal(getSequenceRowReached(false, threshold, secondRow, rowCount), false);
  assert.equal(getSequenceMessageGhostReached(false, threshold, secondRow, rowCount), false);

  assert.equal(getSequenceRowReached(true, threshold - 0.01, secondRow, rowCount), false);
  assert.equal(getSequenceMessageGhostReached(true, threshold - 0.01, secondRow, rowCount), false);

  assert.equal(getSequenceRowReached(true, threshold, secondRow, rowCount), true);
  assert.equal(getSequenceMessageGhostReached(true, threshold, secondRow, rowCount), true);
});

test('sequence rows settle into the final visible output at phase 1', () => {
  const rowCount = 4;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    assert.equal(getSequenceRowReached(true, 1, rowIndex, rowCount), true);
    assert.equal(getSequenceMessageGhostReached(true, 1, rowIndex, rowCount), true);
  }
});

test('single-row diagrams still reveal on the row band start', () => {
  assert.equal(getSequenceRowThreshold(0, 1), sequenceDiagramReveal.rowBandStart);
  assert.equal(getSequenceRowReached(true, sequenceDiagramReveal.rowBandStart - 0.01, 0, 1), false);
  assert.equal(getSequenceRowReached(true, sequenceDiagramReveal.rowBandStart, 0, 1), true);
});

test('rowCount=0 returns ROW_BAND_START (defensive)', () => {
  // rowCount=0 is unreachable via rows.map, but the function must not crash.
  const threshold = getSequenceRowThreshold(0, 0);
  assert.equal(threshold, sequenceDiagramReveal.rowBandStart);
  // Any phase below threshold is unreached.
  assert.equal(getSequenceRowReached(true, threshold - 0.01, 0, 0), false);
  assert.equal(getSequenceRowReached(true, threshold, 0, 0), true);
});

test('rowIndex >= rowCount returns threshold beyond ROW_BAND_END', () => {
  const rowCount = 3;
  const outOfBoundsIndex = rowCount; // one past last valid index
  const threshold = getSequenceRowThreshold(outOfBoundsIndex, rowCount);
  assert.ok(threshold > sequenceDiagramReveal.rowBandEnd);
  // Threshold > 1 means never reached (phase max is 1).
  assert.equal(getSequenceRowReached(true, 1, outOfBoundsIndex, rowCount), false);
});

test('rowIndex < 0 returns threshold below ROW_BAND_START', () => {
  const threshold = getSequenceRowThreshold(-1, 3);
  assert.ok(threshold < sequenceDiagramReveal.rowBandStart);
  // Threshold = 0.05, phase 0 is not >= 0.05, so not reached.
  assert.equal(getSequenceRowReached(true, 0, -1, 3), false);
});
