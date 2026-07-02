import assert from 'node:assert/strict';
import test from 'node:test';
import {
  codeGlyphStrokeWidth,
  compressedOverlayInset,
  insetBox,
  nonNegativeDimension,
  salientStrokeWidth,
  scaledInset,
  supportsDashedOverlay,
  tokenStrokeWidth,
} from './TokenUnitGeometry.ts';

test('token geometry keeps tiny base silhouettes visible', () => {
  const tinyToken = { x: 203, y: 347, width: 7, height: 7 };
  const box = insetBox(tinyToken, scaledInset(tinyToken));

  assert.ok(box.width >= 5.5);
  assert.ok(box.height >= 5.5);
});

test('compressed signal uses overlay space instead of destructive shrink', () => {
  const tinyToken = { x: 0, y: 0, width: 7, height: 7 };
  const overlay = insetBox(tinyToken, compressedOverlayInset(tinyToken));

  assert.ok(overlay.width >= 3.5);
  assert.equal(supportsDashedOverlay(tinyToken), false);
  assert.equal(
    supportsDashedOverlay({ ...tinyToken, width: 14, height: 14 }),
    true
  );
});

test('token geometry exposes non-negative SVG dimensions', () => {
  assert.equal(nonNegativeDimension(-1), 0);
  assert.equal(nonNegativeDimension(4), 4);
});

test('token strokes scale down before they consume miniature tokens', () => {
  const tinyToken = { x: 0, y: 0, width: 7, height: 7 };

  assert.ok(tokenStrokeWidth(tinyToken, 1.6) < 1.6);
  assert.ok(salientStrokeWidth(tinyToken) < 3);
});

test('code glyph stroke stays independent of token signal emphasis', () => {
  const codeSignalStrokes = ['ordinary', 'compressed', 'salient'].map(() =>
    codeGlyphStrokeWidth()
  );

  assert.deepEqual(codeSignalStrokes, [1.6, 1.6, 1.6]);
});
