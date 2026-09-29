import assert from 'node:assert/strict';
import test from 'node:test';
import {
  contentExtent,
  contentFloorHeight,
  exitingContextRegions,
  layoutRows,
  REGION_MIN_HEIGHT,
  resolveRegionGeometry,
  zoneOfRow,
  type ContextRegionRow,
} from './contextRegions.ts';
import { DIAGRAM_HALF } from './diagramScale.ts';

const rows = (...weights: number[]): ContextRegionRow[] =>
  weights.map((weight, i) => ({ id: `r${i}`, weight }));

function total(heights: Record<string, number>) {
  return Object.values(heights).reduce((sum, height) => sum + height, 0);
}

test('layoutRows fills its canvas exactly', () => {
  const heights = layoutRows(rows(100, 300, 600), 500);
  assert.ok(Math.abs(total(heights) - 500) < 1e-9);
});

test('layoutRows enforces the readable min-height floor', () => {
  // Tiny row would get 5px raw; the water-filling fixed point pins it and lets
  // the large row absorb the difference.
  const heights = layoutRows(rows(10, 990), 500);
  assert.equal(heights.r0, REGION_MIN_HEIGHT);
  assert.equal(heights.r1, 500 - REGION_MIN_HEIGHT);
});

test('layoutRows respects per-row minHeight overrides', () => {
  const input: ContextRegionRow[] = [
    { id: 'buffer', weight: 10, minHeight: 40 },
    { id: 'rest', weight: 990 },
  ];
  const heights = layoutRows(input, 500);
  assert.equal(heights.buffer, 40);
  assert.equal(heights.rest, 460);
});

test('collapsed and zero-weight rows get no height', () => {
  const input: ContextRegionRow[] = [
    { id: 'gone', weight: 500, collapsed: true },
    { id: 'empty', weight: 0 },
    { id: 'live', weight: 500 },
  ];
  const heights = layoutRows(input, 500);
  assert.equal(heights.gone, undefined);
  assert.equal(heights.empty, undefined);
  assert.equal(heights.live, 500);
});

test('layoutRows throws when the declared floors cannot fit the canvas', () => {
  assert.throws(
    () => layoutRows(rows(1, 1, 1, 1), 40),
    /readable floors cannot fit/
  );
  assert.equal(contentFloorHeight(rows(1, 1, 1, 1)), 4 * REGION_MIN_HEIGHT);
});

test('every row clears its floor and every content height is a 4px multiple', () => {
  // Wide spread (this is the regime the old single-pass clamp inverted).
  const input: ContextRegionRow[] = [
    { id: 'block', weight: 18, minHeight: 24 },
    { id: 'pin', weight: 4, minHeight: 16 },
    { id: 'mid', weight: 14, minHeight: 16 },
    { id: 'big', weight: 18, minHeight: 24 },
    { id: 'headroom', weight: 40, minHeight: 0, spacer: true },
  ];
  const heights = layoutRows(input, 128);
  for (const row of input) {
    assert.ok(
      heights[row.id] >= (row.minHeight ?? REGION_MIN_HEIGHT),
      `${row.id} fell below its floor`
    );
    assert.equal(
      heights[row.id] % DIAGRAM_HALF,
      0,
      `${row.id} off the 4px grid`
    );
  }
  assert.ok(Math.abs(total(heights) - 128) < 1e-9);
});

test('redistribution is monotonic: heavier rows never render shorter', () => {
  const input: ContextRegionRow[] = [
    { id: 'a', weight: 4, minHeight: 16 },
    { id: 'b', weight: 14, minHeight: 16 },
    { id: 'c', weight: 18, minHeight: 24 },
  ];
  const heights = layoutRows(input, 96);
  assert.ok(heights.a <= heights.b);
  assert.ok(heights.b <= heights.c);
});

test('exiting context regions retain their last geometry', () => {
  const previous: ContextRegionRow[] = [
    { id: 'search-retry', weight: 12 },
    { id: 'candidate', weight: 12 },
    { id: 'false-start', weight: 12 },
  ];
  const exits = exitingContextRegions(previous, previous.slice(0, 1), {
    'search-retry': { top: 0, height: 80, bottom: 80, collapsed: false },
    candidate: { top: 80, height: 80, bottom: 160, collapsed: false },
    'false-start': { top: 160, height: 80, bottom: 240, collapsed: false },
  });
  assert.deepEqual(exits, [
    {
      row: previous[1],
      layout: { top: 80, height: 80, bottom: 160, collapsed: false },
    },
    {
      row: previous[2],
      layout: { top: 160, height: 80, bottom: 240, collapsed: false },
    },
  ]);
});

test('resolved geometry fills its bounded viewport while spacers stay outside content', () => {
  const height = 400;
  const geometry = resolveRegionGeometry(
    [
      { id: 'tiny', weight: 10 },
      { id: 'content', weight: 390 },
      { id: 'headroom', weight: 600, spacer: true },
    ],
    height
  );
  assert.equal(geometry.rowHeights.tiny, REGION_MIN_HEIGHT);
  assert.ok(Math.abs(total(geometry.rowHeights) - height) < 1e-9);
  assert.equal(geometry.contentTop, 0);
  assert.equal(
    geometry.contentBottom,
    geometry.rowHeights.tiny + geometry.rowHeights.content
  );
  assert.equal(geometry.contentHeight, geometry.contentBottom);
});

test('zoneOfRow classifies by cumulative center fraction', () => {
  const input = rows(10, 50, 40); // centers at 5%, 35%, 85%
  assert.equal(zoneOfRow('r0', input), 'primacy');
  assert.equal(zoneOfRow('r1', input), 'middle');
  assert.equal(zoneOfRow('r2', input), 'recency');
});

test('zoneOfRow ignores collapsed rows and throws on unknown ids', () => {
  const input: ContextRegionRow[] = [
    { id: 'dead', weight: 90, collapsed: true },
    { id: 'live', weight: 10 },
  ];
  assert.equal(zoneOfRow('live', input), 'middle');
  assert.throws(() => zoneOfRow('dead', input), /no content row/);
});

test('zoneOfRow classifies within the content span, excluding spacers', () => {
  const input: ContextRegionRow[] = [
    { id: 'first', weight: 10 },
    { id: 'mid', weight: 10 },
    { id: 'last', weight: 10 },
    { id: 'headroom', weight: 970, spacer: true },
  ];
  // Content span is only 30 weight: first/mid/last split it into thirds.
  assert.equal(zoneOfRow('first', input), 'primacy');
  assert.equal(zoneOfRow('mid', input), 'middle');
  assert.equal(zoneOfRow('last', input), 'recency');
  assert.throws(() => zoneOfRow('headroom', input), /no content row/);
});

test('contentExtent anchors the zone scale to the first and last content tiles', () => {
  const input: ContextRegionRow[] = [
    { id: 'a', weight: 20 },
    { id: 'b', weight: 20 },
    { id: 'headroom', weight: 60, spacer: true },
  ];
  assert.deepEqual(contentExtent(input), { top: 0, bottom: 0.4 });
  // No spacers: the scale spans the whole stack.
  assert.deepEqual(contentExtent(rows(50, 50)), { top: 0, bottom: 1 });
  // Leading content after a collapsed row still anchors at its own top.
  const shifted: ContextRegionRow[] = [
    { id: 'gone', weight: 20, collapsed: true },
    { id: 'a', weight: 40 },
    { id: 'headroom', weight: 40, spacer: true },
  ];
  assert.deepEqual(contentExtent(shifted), { top: 0, bottom: 0.5 });
});
