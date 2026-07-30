import assert from 'node:assert/strict';
import test from 'node:test';
import {
  contentExtent,
  exitingContextRegions,
  layoutRows,
  REGION_MIN_HEIGHT,
  resolveRegionGeometry,
  zoneOfRow,
  type ContextRegionRow,
} from './contextRegions.ts';

const rows = (...weights: number[]): ContextRegionRow[] =>
  weights.map((weight, i) => ({ id: `r${i}`, weight }));

test('layoutRows shares sum to the total weight', () => {
  const input = rows(100, 300, 600);
  const total = 1000;
  const shares = layoutRows(input, 500);
  const sum = Object.values(shares).reduce((s, v) => s + v, 0);
  assert.ok(Math.abs(sum - total) < 1e-9);
});

test('layoutRows enforces the readable min-height floor', () => {
  // Tiny row would get 10px raw; it must be pinned to the floor while the
  // large row absorbs the difference.
  const input = rows(10, 990);
  const shares = layoutRows(input, 500);
  const tinyHeight = (shares.r0 / 1000) * 500;
  assert.equal(tinyHeight, REGION_MIN_HEIGHT);
  const largeHeight = (shares.r1 / 1000) * 500;
  assert.ok(Math.abs(largeHeight - (500 - REGION_MIN_HEIGHT)) < 1e-9);
});

test('layoutRows respects per-row minHeight overrides', () => {
  const input: ContextRegionRow[] = [
    { id: 'buffer', weight: 10, minHeight: 40 },
    { id: 'rest', weight: 990 },
  ];
  const shares = layoutRows(input, 500);
  assert.equal((shares.buffer / 1000) * 500, 40);
});

test('collapsed and zero-weight rows get no share', () => {
  const input: ContextRegionRow[] = [
    { id: 'gone', weight: 500, collapsed: true },
    { id: 'empty', weight: 0 },
    { id: 'live', weight: 500 },
  ];
  const shares = layoutRows(input, 500);
  assert.equal(shares.gone, undefined);
  assert.equal(shares.empty, undefined);
  assert.equal(shares.live, 500);
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

test('redistribution is monotonic: heavier rows stay taller', () => {
  const input = rows(50, 200, 800);
  const shares = layoutRows(input, 400);
  assert.ok(shares.r0 <= shares.r1);
  assert.ok(shares.r1 <= shares.r2);
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
  assert.equal(
    Object.values(geometry.rowHeights).reduce(
      (sum, rowHeight) => sum + rowHeight,
      0
    ),
    height
  );
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
