import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAttentionCurve,
  projectCurve,
} from './UShapeAttentionCurveGeometry.ts';

const compactMobilePlot = { left: 40, right: 316, top: 40, bottom: 176 };

test('attention curve keeps both context edges above the middle at moderate fill', () => {
  const { points } = createAttentionCurve(50);
  const middle = points[points.length / 2 - 0.5];

  assert.equal(points[0].position, 0);
  assert.equal(points.at(-1)?.position, 1);
  assert.ok(points[0].attention > middle.attention);
  assert.ok(points.at(-1)!.attention > middle.attention);
});

test('long context turns the symmetric U toward recency', () => {
  const { points } = createAttentionCurve(100);

  assert.ok(points.at(-1)!.attention > points[0].attention);
  assert.equal(points.at(-1)!.cyanOpacity, 1);
});

test('compact mobile projection retains context left-to-right and attention high-to-low', () => {
  const { points } = createAttentionCurve(50);
  const projected = projectCurve(points, compactMobilePlot);
  const middle = projected[projected.length / 2 - 0.5];

  assert.equal(projected[0].x, compactMobilePlot.left);
  assert.equal(projected.at(-1)?.x, compactMobilePlot.right);
  assert.ok(projected[0].y < middle.y);
  assert.ok(projected.at(-1)!.y < middle.y);
});
