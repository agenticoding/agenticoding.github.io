import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ZONE_FRACTIONS,
  zoneAtOffset,
  zoneBlendOffsets,
  zoneBounds,
  zoneGradient,
} from './contextZones.ts';

test('zone bounds are fractional and contiguous, never equal thirds', () => {
  const height = 312;
  const [primacy, middle, recency] = zoneBounds(height);

  assert.equal(primacy.y, 0);
  assert.equal(primacy.height, height * ZONE_FRACTIONS.primacyEnd);
  assert.equal(middle.y, primacy.height);
  assert.equal(recency.y, height * ZONE_FRACTIONS.recencyStart);
  assert.equal(middle.y + middle.height, recency.y);
  assert.equal(recency.y + recency.height, height);
  assert.notEqual(primacy.height, height / 3);
});

test('zone edges are symmetric: primacy and recency are equally tall', () => {
  // U-shape grammar — both edges receive high attention.
  const [primacy, , recency] = zoneBounds(400);
  assert.equal(primacy.height, recency.height);
});

test('zoneAtOffset classifies by the shared fractions', () => {
  assert.equal(zoneAtOffset(0, 100), 'primacy');
  assert.equal(zoneAtOffset(24, 100), 'primacy');
  assert.equal(zoneAtOffset(25, 100), 'middle');
  assert.equal(zoneAtOffset(74, 100), 'middle');
  assert.equal(zoneAtOffset(75, 100), 'recency');
  assert.equal(zoneAtOffset(99, 100), 'recency');
});

test('zone transitions are pure alpha cross-fades, never hue interpolation', () => {
  // User directive: blends must dissolve between the EXISTING zone colors —
  // two stacked layers whose fade stops are zero-alpha twins of zone fills,
  // so no muddy third color can appear.
  const { a, b, c, d } = zoneBlendOffsets();
  assert.ok(0 < a && a < b && b < c && c < d && d < 1);
  // Blend regions center exactly on the zone boundaries.
  assert.ok(Math.abs((a + b) / 2 - ZONE_FRACTIONS.primacyEnd) < 1e-9);
  assert.ok(Math.abs((c + d) / 2 - ZONE_FRACTIONS.recencyStart) < 1e-9);

  const bg = zoneGradient(['P', 'M', 'R']);
  assert.equal(bg.split('linear-gradient').length - 1, 2);
  for (const fill of ['P', 'M', 'R']) {
    assert.ok(
      bg.includes(`color-mix(in srgb, ${fill} 0%, transparent)`),
      `blend must fade ${fill} through its zero-alpha twin`
    );
  }
});
