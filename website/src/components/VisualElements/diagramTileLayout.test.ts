import assert from 'node:assert/strict';
import test from 'node:test';
import { wrapSvgText } from './diagramTileLayout.ts';

test('SVG wrapping keeps mobile callout lines within the estimated width', () => {
  const lines = wrapSvgText('THIS IS WHAT “DONE” MEANS.', 188, 13, 20);

  assert.deepEqual(lines, ['THIS IS WHAT “DONE”', 'MEANS.']);
  assert.ok(lines.every((line) => line.length * 13 * 0.6 <= 188));
});

test('SVG wrapping splits an unbroken token instead of overflowing it', () => {
  const lines = wrapSvgText('A'.repeat(30), 100, 13, 20);

  assert.deepEqual(lines, ['A'.repeat(12), 'A'.repeat(12), 'A'.repeat(6)]);
});
