// Geometry + schedule invariants for SemanticSearchDiagram. The figure's story
// is "query the index, never rebuild it": the query vector must land inside the
// scatter region, the vectors it lights must actually be the nearest ones to it,
// the stored set must be the same one EmbeddingIndexDiagram built, and the beats
// must run in strict causal order on one clock that rolls back at the wrap.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FADE_OUT_MS,
  GRAPH_EDGES,
  SCATTER_DOTS,
  scatterRegion,
} from './embeddingIndexModel.ts';
import {
  DESKTOP,
  FADE_OUT_START_MS,
  GEAR_BEAT,
  GEAR_END_MS,
  GEAR_START_MS,
  LANE_LENGTH,
  MATCH_END_MS,
  MATCH_MS,
  MOBILE,
  QUERY_BEAT_MS,
  QUERY_MATCH,
  QUERY_TRAIN,
  QUERY_TRAIN_ARRIVAL_MS,
  QUERY_TRAIN_START_MS,
  QUERY_VECTOR_IN_MS,
  QUERY_VECTOR_TRAIN,
  SEARCH_LOOP_MS,
  VECTOR_TRAIN_ARRIVAL_MS,
  VECTOR_TRAIN_START_MS,
  nearestDotIds,
  queryLandsAt,
  trainPaths,
} from './semanticSearchModel.ts';

const DOT_IDS = SCATTER_DOTS.map((dot) => dot.id);

test('both layouts fit their canvas and read chip → model → index', () => {
  for (const layout of [DESKTOP, MOBILE]) {
    const { canvas, queryChip, model, index } = layout;
    for (const tile of [queryChip, model, index]) {
      assert.ok(tile.x >= 0 && tile.y >= 0, 'tile starts inside the canvas');
      assert.ok(
        tile.x + tile.width <= canvas.width,
        'tile ends inside the canvas'
      );
      assert.ok(
        tile.y + tile.height <= canvas.height,
        'tile ends inside the canvas'
      );
    }
  }
  // Desktop is a left-to-right row; mobile is a top-to-bottom column. Either
  // way each hop has real space, so no two tiles can overlap.
  assert.ok(
    DESKTOP.queryChip.x + DESKTOP.queryChip.width < DESKTOP.model.x &&
      DESKTOP.model.x + DESKTOP.model.width < DESKTOP.index.x
  );
  assert.ok(
    MOBILE.queryChip.y + MOBILE.queryChip.height < MOBILE.model.y &&
      MOBILE.model.y + MOBILE.model.height < MOBILE.index.y
  );
});

test('the query lights the vectors that are actually nearest to it', () => {
  const computed = nearestDotIds(QUERY_MATCH.point, QUERY_MATCH.nearest.length);
  assert.deepEqual(computed, [...QUERY_MATCH.nearest]);
  for (const id of computed) assert.ok(DOT_IDS.includes(id));
});

test('every hop has a lane long enough to deliver its train', () => {
  assert.ok(LANE_LENGTH.query > 0);
  assert.ok(LANE_LENGTH.vector > 0);
  for (const layout of ['desktop', 'mobile'] as const) {
    for (const hop of ['query', 'vector'] as const) {
      const { d, lane } = trainPaths(hop, layout);
      assert.match(d, /^M [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/);
      assert.match(lane, /^M [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/);
    }
  }
});

test('the query vector lands inside the graph region', () => {
  for (const layout of ['desktop', 'mobile'] as const) {
    const region = scatterRegion(
      layout === 'desktop' ? DESKTOP.index : MOBILE.index,
      layout === 'mobile'
    );
    const lands = queryLandsAt(region, QUERY_MATCH);
    assert.ok(
      lands.x >= region.x &&
        lands.x <= region.x + region.width &&
        lands.y >= region.y &&
        lands.y <= region.y + region.height,
      'query lands inside the scatter region'
    );
  }
});

test('the index the query reads is the one the build figure wrote', () => {
  // Matching reads stored vectors; it must never introduce new ones (the ids the
  // query highlights are drawn from the shared scatter, not an entry schedule).
  const stored = new Set(DOT_IDS);
  for (const id of QUERY_MATCH.nearest) assert.ok(stored.has(id));
  for (const [from, to] of GRAPH_EDGES) {
    assert.ok(stored.has(from) && stored.has(to));
  }
  // The figure relabels the vectors for its own query, but the far vector keeps a
  // label that the answer never claims.
  assert.ok(QUERY_MATCH.labels[QUERY_MATCH.nearest[0]]);
  assert.ok(QUERY_MATCH.labels.rocket);
  assert.ok(!QUERY_MATCH.nearest.includes('rocket'));
});

test('each beat starts when the previous one ends, and the loop rolls back', () => {
  // tokens into the model, gear, vector into the index, vector fades in, match.
  assert.equal(QUERY_TRAIN_START_MS, QUERY_BEAT_MS);
  assert.equal(GEAR_START_MS, QUERY_TRAIN_ARRIVAL_MS);
  assert.equal(VECTOR_TRAIN_START_MS, GEAR_END_MS);
  assert.equal(QUERY_VECTOR_IN_MS, VECTOR_TRAIN_ARRIVAL_MS);
  assert.ok(
    QUERY_VECTOR_IN_MS < MATCH_MS,
    'the vector settles before it matches'
  );
  assert.ok(MATCH_MS <= MATCH_END_MS);
  assert.ok(MATCH_END_MS <= FADE_OUT_START_MS);
  assert.equal(SEARCH_LOOP_MS, FADE_OUT_START_MS + FADE_OUT_MS);
  assert.equal(GEAR_BEAT.startMs, GEAR_START_MS);
  assert.equal(GEAR_BEAT.loopMs, SEARCH_LOOP_MS);
  // The beats are ordered and every stage has real time.
  assert.ok(
    QUERY_BEAT_MS < QUERY_TRAIN_ARRIVAL_MS &&
      QUERY_TRAIN_ARRIVAL_MS < VECTOR_TRAIN_ARRIVAL_MS &&
      VECTOR_TRAIN_ARRIVAL_MS < FADE_OUT_START_MS
  );
  assert.ok(QUERY_TRAIN.tokens > 0 && QUERY_VECTOR_TRAIN.tokens > 0);
});
