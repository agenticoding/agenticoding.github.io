import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONTEXT_MECHANISM_LAYOUT,
  CONTEXT_MECHANISM_VISUAL,
  contextMechanismCardX,
  contextMechanismGeometry,
  contextMechanismTileY,
} from './contextMechanismMapModel.ts';

const { viewWidth, cardCount, cardWidth, cardGap, cardInset, tileInset } =
  CONTEXT_MECHANISM_LAYOUT;

test('mechanism columns have equal widths, gaps, and outer margins', () => {
  const positions = Array.from({ length: cardCount }, (_, index) =>
    contextMechanismCardX(index)
  );
  const gaps = positions
    .slice(1)
    .map((x, index) => x - positions[index] - cardWidth);
  const rightMargin = viewWidth - positions.at(-1)! - cardWidth;

  assert.deepEqual(new Set(gaps), new Set([cardGap]));
  assert.equal(positions[0], rightMargin);
});

test('every column derives the same context and mechanism tile widths', () => {
  assert.equal(
    contextMechanismGeometry.contextWidth,
    cardWidth - cardInset * 2
  );
  assert.equal(
    contextMechanismGeometry.tileWidth,
    contextMechanismGeometry.contextWidth - tileInset * 2
  );
});

test('context zones cover the frame with canonical attention geometry', () => {
  assert.deepEqual(
    contextMechanismGeometry.zones.map(({ zone, y, height }) => ({
      zone,
      y,
      height,
    })),
    [
      { zone: 'primacy', y: 0, height: 22 },
      { zone: 'middle', y: 22, height: 44 },
      { zone: 'recency', y: 66, height: 22 },
    ]
  );
});

test('mechanism tiles remain centered inside their declared zones', () => {
  for (const band of contextMechanismGeometry.zones) {
    const tileY = contextMechanismTileY(band.zone);
    assert.equal(
      tileY + CONTEXT_MECHANISM_LAYOUT.tileHeight / 2,
      band.y + band.height / 2
    );
  }
});

test('context zones remain achromatic so color identifies mechanisms', () => {
  const tokens = [
    ...Object.values(CONTEXT_MECHANISM_VISUAL.zoneFill),
    CONTEXT_MECHANISM_VISUAL.separatorStroke,
  ];
  assert.ok(tokens.every((token) => /--(surface|border)-/.test(token)));
  assert.ok(tokens.every((token) => !token.includes('--visual-')));
  assert.equal(
    CONTEXT_MECHANISM_VISUAL.zoneOpacity.primacy,
    CONTEXT_MECHANISM_VISUAL.zoneOpacity.recency
  );
  assert.ok(
    CONTEXT_MECHANISM_VISUAL.zoneOpacity.middle >
      CONTEXT_MECHANISM_VISUAL.zoneOpacity.primacy
  );
});
