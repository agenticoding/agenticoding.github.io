// Geometry + timing invariants for EmbeddingIndexDiagram. The figure's story
// is "meaning becomes distance": the close pair must actually be CLOSE, the
// outlier FAR, every scatter dot must stay inside its region without crowding,
// the HNSW proximity graph must be the nearest-neighbour graph of all its
// vectors, the corpus band the train carries must be the band drawn in the tile,
// and the loop must run in process order on one shared clock for both canvases —
// the index keeps its standing vectors while each delivered vector adds its own
// dot and links, then the reset removes exactly those again.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHUNK_TRAIN,
  CONNECT_BUDGET_MS,
  CONNECT_DRAW_MS,
  CORPUS_CLUSTER,
  CORPUS_CONCEPTS,
  TRAIN_LANE_INSET,
  DESKTOP,
  DESKTOP_HOP,
  DOT_ENTRY_MS,
  DRAWN_LINKS,
  END_HOLD_MS,
  ENTRY_ARRIVAL_MS,
  ENTRY_DOTS,
  FADE_OUT_MS,
  FADE_OUT_START_MS,
  FAR_PAIR,
  FAR_SIMILARITY,
  FLOW_START_MS,
  GRAPH_EDGES,
  LANE_LENGTH,
  LANDING_DOT_ID,
  LANDING_BEAT,
  LANDING_MS,
  LOOP_MS,
  MOBILE,
  MOBILE_HOP,
  GEAR_BEAT,
  NEIGHBOUR_PAIR,
  NEIGHBOUR_SIMILARITY,
  PULSE_BEAT,
  PULSES,
  SCATTER_DOTS,
  SCATTER_GLYPH_SIZE,
  SCATTER_SPAN_NX,
  SECONDARY_PULSE_DELAY_MS,
  SIMILARITY_LINKS,
  STANDING_EDGES,
  VECTOR_GLYPHS,
  arrivesAt,
  corpusCluster,
  corpusLabelRoom,
  distance,
  dotArrivalMs,
  dotAt,
  dotById,
  entryIndex,
  isEnteringDot,
  itemArrivalMs,
  linkBeginMs,
  scatterRegion,
  similarityLabelPos,
  similarityOf,
  lanePath,
  trainArrivalMs,
  trainClearMs,
  type TrainSpec,
} from './embeddingIndexModel.ts';
// The repo's other loop that rolls back to its initial state: this figure must
// hold and roll back on the same terms (see RESTORE_MS in its model).
import { RESTORE_MS } from './compactionLineModel.ts';
import { DIAGRAM_ICON_SIZE, DIAGRAM_TOKEN_SIZE } from './diagramScale.ts';
import {
  CONCEPT_BEAT,
  CONCEPT_BEAT_STEP_MS,
  CONCEPT_LABEL_ROOM,
  conceptBeatCss,
} from './conceptClusterGeometry.ts';
import { EMOJI, emojiDisplaySize } from './emojiAssets.ts';

// Mirrors trainLaneOffset (diagramGeometryCore): a train rides half a chip plus the
// stroke plus a 4px gutter beside its path.
const HALF_CHIP = DIAGRAM_TOKEN_SIZE.flow / 2;
const BORDER_CLEARANCE = 4;
const MOBILE_HOP_LENGTH = {
  chunk: LANE_LENGTH.chunk.mobile,
  vector: LANE_LENGTH.vector.mobile,
} as const;

const DESKTOP_SCATTER = scatterRegion(DESKTOP.index, false);
const MOBILE_SCATTER = scatterRegion(MOBILE.index, true);

test('the close pair sits close; the rocket outlier sits far', () => {
  const cat = dotAt(dotById(NEIGHBOUR_PAIR[0]), DESKTOP_SCATTER);
  const feline = dotAt(dotById(NEIGHBOUR_PAIR[1]), DESKTOP_SCATTER);
  const rocket = dotAt(dotById(FAR_PAIR[1]), DESKTOP_SCATTER);
  const near = distance(cat, feline);
  const far = distance(cat, rocket);
  // Proportional bounds: the reading is "close pair inside a small fraction of
  // the field, outlier past a large one", not a fixed pixel count.
  assert.ok(
    near < DESKTOP_SCATTER.width * 0.3,
    `neighbour too far apart: ${near}`
  );
  assert.ok(far > DESKTOP_SCATTER.width * 0.4, `outlier too close: ${far}`);
  assert.ok(
    far > near * 1.9,
    `distance story unclear: near ${near}, far ${far}`
  );
});

test('both canvases tell the same distance story (normalized layout scales)', () => {
  for (const region of [DESKTOP_SCATTER, MOBILE_SCATTER]) {
    const near = distance(
      dotAt(dotById('cat'), region),
      dotAt(dotById('feline'), region)
    );
    const far = distance(
      dotAt(dotById('cat'), region),
      dotAt(dotById('rocket'), region)
    );
    assert.ok(
      near < region.width * 0.3 && far > region.width * 0.4 && far > near * 1.9,
      `region ${region.x}: ${far} vs ${near}`
    );
  }
});

test('similarity labels match the geometry', () => {
  const value = Object.fromEntries(
    SIMILARITY_LINKS.map((link) => [link.tone, Number.parseFloat(link.value)])
  );
  assert.ok(value.near > 0.8, 'close pair should read as highly similar');
  assert.ok(value.far < 0.1, 'outlier should read as unrelated');
  assert.ok(
    value.near > value.far * 5,
    'the order-of-magnitude contrast is the point'
  );
  // The labelled lines are the pair constants, in both directions.
  assert.equal(similarityOf(...NEIGHBOUR_PAIR)?.value, NEIGHBOUR_SIMILARITY);
  assert.equal(similarityOf(FAR_PAIR[1], FAR_PAIR[0])?.value, FAR_SIMILARITY);
  assert.equal(similarityOf('a', 'd'), undefined);
});

// Nodes are drawn as vector glyphs, so two of them must be further apart than a
// glyph is wide — otherwise the brackets touch and the graph reads as one mark.
test('every scatter dot stays inside the region and clears its neighbours', () => {
  for (const [region, glyph] of [
    [DESKTOP_SCATTER, SCATTER_GLYPH_SIZE.desktop],
    [MOBILE_SCATTER, SCATTER_GLYPH_SIZE.compact],
  ] as const) {
    const points = SCATTER_DOTS.map((dot) => dotAt(dot, region));
    for (const p of points) {
      assert.ok(p.x >= region.x && p.x <= region.x + region.width);
      assert.ok(p.y >= region.y && p.y <= region.y + region.height);
    }
    let min = Infinity;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        min = Math.min(min, distance(points[i], points[j]));
      }
    }
    assert.ok(
      min >= glyph + 6,
      `nodes crowd each other (min ${min} vs glyph ${glyph} in region ${region.x})`
    );
  }
});

// A 9px similarity label is ~24px wide, so the perpendicular push has to beat half of
// that or the dashed similarity line clips the label's corner.
test('similarity labels clear their own line by half a label width', () => {
  const perpendicular = (
    p: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) =>
    Math.abs((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) /
    Math.hypot(b.x - a.x, b.y - a.y);
  for (const region of [DESKTOP_SCATTER, MOBILE_SCATTER]) {
    const cat = dotAt(dotById(NEIGHBOUR_PAIR[0]), region);
    const feline = dotAt(dotById(NEIGHBOUR_PAIR[1]), region);
    const rocket = dotAt(dotById(FAR_PAIR[1]), region);
    for (const [a, b, side] of [
      [cat, feline, 1],
      [cat, rocket, -1],
    ] as const) {
      const label = similarityLabelPos(a, b, side);
      const clearance = perpendicular(label, a, b);
      assert.ok(clearance >= 15, `label rides its line: ${clearance}`);
      assert.ok(
        label.x > region.x && label.x < region.x + region.width,
        'label leaves the panel'
      );
    }
  }
});

test('similarity labels never sit on a dot', () => {
  const cat = dotAt(dotById('cat'), DESKTOP_SCATTER);
  const feline = dotAt(dotById('feline'), DESKTOP_SCATTER);
  const rocket = dotAt(dotById('rocket'), DESKTOP_SCATTER);
  for (const label of [
    similarityLabelPos(cat, feline, 1),
    similarityLabelPos(cat, rocket, -1),
  ]) {
    for (const dot of [cat, feline, rocket]) {
      assert.ok(distance(label, dot) >= 14, 'label collides with a dot');
    }
  }
});

// The merged tile's whole point: the index IS the scatter, so the proximity
// graph must be exactly the 1-nearest-neighbour graph of the stored vectors —
// what a proximity index approximates — and no more. A node that reaches the
// graph must link to its nearest neighbour, which is what makes an outlier's
// single long link correct rather than a bug.
test('the graph links every vector to its nearest neighbour', () => {
  const ids = new Set(SCATTER_DOTS.map((n) => n.id));
  const links = new Set(GRAPH_EDGES.map(([a, b]) => [a, b].sort().join('|')));
  assert.equal(links.size, GRAPH_EDGES.length, 'duplicate link');
  for (const [a, b] of GRAPH_EDGES)
    assert.ok(
      ids.has(a) && ids.has(b),
      `edge references unknown dot ${a}-${b}`
    );
  for (const dot of SCATTER_DOTS)
    assert.ok(
      links.has([dot.id, nearestDotId(dot.id)].sort().join('|')),
      `${dot.id} is not linked to its nearest neighbour`
    );
});

// The neighbourhood keeps its shape: a link between two near neighbours is
// short (they belong together), while the outlier's lone link is allowed to be
// long — its nearest neighbour genuinely IS far away, which is exactly what a
// 0.06 similarity means.
test('only the outlier link is long', () => {
  for (const [from, to] of GRAPH_EDGES) {
    const touchesOutlier =
      dotById(from).role === 'far' || dotById(to).role === 'far';
    if (touchesOutlier) continue;
    assert.ok(
      graphSpan(from, to) <= 0.6,
      `edge ${from}-${to} joins far nodes (${graphSpan(from, to)})`
    );
  }
});

test('the graph reaches every indexed vector', () => {
  const adjacency = new Map<string, string[]>(
    SCATTER_DOTS.map((n) => [n.id, []])
  );
  for (const [a, b] of GRAPH_EDGES) {
    adjacency.get(a)?.push(b);
    adjacency.get(b)?.push(a);
  }
  const seen = new Set<string>([LANDING_DOT_ID]);
  const queue: string[] = [LANDING_DOT_ID];
  while (queue.length) {
    const node = queue.pop() as string;
    for (const next of adjacency.get(node) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  assert.equal(seen.size, SCATTER_DOTS.length, 'graph has unreachable dots');
});

// The graph is centred in the tile by translating its composition, so the empty
// tile on either side of it is equal. (Its vertical margins stay asymmetric on
// purpose: the top must clear the framing, the bottom must clear the caption.)
test('the graph is centred horizontally in its region', () => {
  const centre = (SCATTER_SPAN_NX.min + SCATTER_SPAN_NX.max) / 2;
  assert.ok(
    Math.abs(centre - 0.5) < 0.01,
    `graph centre is off: ${centre.toFixed(3)} of the region`
  );
  for (const [region, glyph] of [
    [DESKTOP_SCATTER, SCATTER_GLYPH_SIZE.desktop],
    [MOBILE_SCATTER, SCATTER_GLYPH_SIZE.compact],
  ] as const) {
    const edges = SCATTER_DOTS.map((dot) => {
      const p = dotAt(dot, region);
      return [p.x - glyph / 2, p.x + glyph / 2] as const;
    });
    const left = Math.min(...edges.map(([min]) => min)) - region.x;
    const right =
      region.x + region.width - Math.max(...edges.map(([, max]) => max));
    assert.ok(
      Math.abs(left - right) <= 1,
      `graph is off-centre in region ${region.x}: ${left} vs ${right}`
    );
  }
});

// Normalized distance between two dots, independent of any render region.
function graphSpan(a: string, b: string) {
  const from = dotById(a);
  const to = dotById(b);
  return Math.hypot(from.nx - to.nx, from.ny - to.ny);
}

function nearestDotId(id: string) {
  let nearest: string | undefined;
  for (const dot of SCATTER_DOTS) {
    if (dot.id === id) continue;
    if (nearest === undefined || graphSpan(id, dot.id) < graphSpan(id, nearest))
      nearest = dot.id;
  }
  if (nearest === undefined) throw new Error(`no neighbour for ${id}`);
  return nearest;
}

test('graph nodes land inside the scatter region in both layouts', () => {
  for (const region of [DESKTOP_SCATTER, MOBILE_SCATTER]) {
    for (const dot of SCATTER_DOTS) {
      const p = dotAt(dot, region);
      assert.ok(p.x >= region.x && p.x <= region.x + region.width);
      assert.ok(p.y >= region.y && p.y <= region.y + region.height);
    }
  }
});

// The corpus tile is a ConceptCluster (shared anatomy, see ConceptCluster.tsx); this
// figure owns only its grid. It must read as a knowledge base, not a file listing:
// a few icon + one-word items that fit inside their tile, with the same air on both
// canvases and enough room beside each icon for its label.
const CORPUS_TILES = [DESKTOP.corpus, MOBILE.corpus] as const;
const CORPUS_ICON = DIAGRAM_ICON_SIZE.secondary;

test('corpus concepts are unique one-word labels backed by declared emoji', () => {
  assert.ok(CORPUS_CONCEPTS.length >= 3, 'a knowledge base needs kinds');
  const labels = new Set(CORPUS_CONCEPTS.map((concept) => concept.label));
  assert.equal(labels.size, CORPUS_CONCEPTS.length);
  const assets = new Set(Object.values(EMOJI));
  for (const concept of CORPUS_CONCEPTS) {
    assert.ok(
      assets.has(concept.icon),
      `undeclared emoji: ${concept.icon.file}`
    );
    assert.equal(concept.label, concept.label.toLowerCase());
    assert.ok(
      concept.label.length <= 5,
      `"${concept.label}" is a sentence, not a concept word`
    );
  }
});

// The cluster FILLS the tile's content box: a row that floats in padding reads as
// an empty tile, which is what the reader saw before the rows were spread. Its
// column count follows from how many rows the tile's height allows.
test('the corpus cluster fills its tile with no dead space', () => {
  for (const tile of CORPUS_TILES) {
    const cells = corpusCluster(tile, CORPUS_ICON);
    assert.equal(cells.length, CORPUS_CONCEPTS.length);
    const top = tile.y + CORPUS_CLUSTER.contentTop;
    const bottom = tile.y + tile.height - CORPUS_CLUSTER.bottomPad;
    assert.equal(Math.min(...cells.map((cell) => cell.y)), top, 'air above');
    assert.equal(
      Math.max(...cells.map((cell) => cell.y)) + CORPUS_ICON,
      bottom,
      'air below'
    );
    for (const cell of cells) {
      assert.ok(
        cell.y > tile.y + 44,
        'an icon rides the header (it must clear the copy above)'
      );
      assert.ok(
        cell.x >= tile.x && cell.x + CORPUS_ICON <= tile.x + tile.width
      );
    }
    // One column per cell group (four on the wide mobile tile, two on desktop),
    // and never two icons on top of each other.
    const columns = new Set(cells.map((cell) => cell.x));
    assert.ok(columns.size >= 1 && columns.size <= CORPUS_CONCEPTS.length);
    assert.equal(
      columns.size * Math.ceil(cells.length / columns.size),
      cells.length
    );
  }
});

// A cluster is read left to right, then down — the order the sibling sources tile
// uses, so the same kinds appear in the same sequence wherever they are drawn.
test('corpus concepts read left to right, then down', () => {
  for (const tile of CORPUS_TILES) {
    const cells = corpusCluster(tile, CORPUS_ICON);
    const firstRow = cells.filter((cell) => cell.y === cells[0].y);
    assert.ok(firstRow.length >= 2, 'the first row holds the first concepts');
    assert.ok(
      firstRow[0].x < firstRow[firstRow.length - 1].x,
      'the first row runs rightwards'
    );
    assert.equal(cells[0].y, cells[1].y, 'the second concept starts a new row');
  }
});

// The tile is sized to the cluster it holds — header + rows + its own bottom
// padding. Anything taller is the dead space that reads as padding, anything
// shorter cannot hold the cluster at a readable row gap.
test('the corpus tile is sized to its cluster', () => {
  for (const tile of CORPUS_TILES) {
    const rows = new Set(corpusCluster(tile, CORPUS_ICON).map((c) => c.y)).size;
    assert.equal(
      tile.height,
      CORPUS_CLUSTER.contentTop +
        rows * CORPUS_ICON +
        (rows - 1) * CORPUS_CLUSTER.rowGap +
        CORPUS_CLUSTER.bottomPad,
      'the tile does not fit its cluster'
    );
  }
  // Desktop: centred on the flow line, so the connector still leaves mid-edge.
  assert.equal(DESKTOP.corpus.y + DESKTOP.corpus.height / 2, DESKTOP.flowY);
});

// The label sits BESIDE its icon (the shared ConceptCluster anatomy), so every cell
// must leave room for one word — otherwise a label runs into the next column.
test('every corpus concept label has room beside its icon', () => {
  for (const tile of CORPUS_TILES) {
    assert.ok(
      corpusLabelRoom(tile, CORPUS_ICON) >= CONCEPT_LABEL_ROOM,
      `cells are too narrow for a label: ${corpusLabelRoom(tile, CORPUS_ICON)}`
    );
  }
});

// The corpus answers before its chunks move: the last kind's beat ends exactly when
// the chunk train is released, so the figure reads as a sequence, not a coincidence.
test('the corpus answers before its chunks leave', () => {
  const lastItemStarts = CONCEPT_BEAT_STEP_MS * (CORPUS_CONCEPTS.length - 1);
  assert.equal(
    FLOW_START_MS.corpus,
    lastItemStarts + CONCEPT_BEAT.windowMs,
    'the train departs mid-beat'
  );
  assert.ok(FLOW_START_MS.corpus < GEAR_BEAT.startMs);
});

// The beat's window is an absolute duration, so a longer loop only moves its
// percentages — the pulse itself never stretches with the figure's cycle.
test('the cluster beat keeps its own window on any cycle', () => {
  const percentages = (css: string) => css.match(/[\d.]+%/g) ?? [];
  assert.notDeepEqual(
    percentages(conceptBeatCss('beat', 7427)),
    percentages(conceptBeatCss('beat', 12345))
  );
  const windowPct = (cycleMs: number) =>
    `${((CONCEPT_BEAT.windowMs / cycleMs) * 100).toFixed(2)}%`;
  assert.ok(
    conceptBeatCss('beat', 7427).includes(
      `${windowPct(7427)}, 100% { transform: scale(1); }`
    ),
    'the beat does not end at its own window'
  );
});

// Every train's items must read as separate marks, never one merged ribbon: the
// center-to-center spacing has to clear the item's own width by a gutter. This is
// the invariant that caught the chunk train shipping six 20u chips at spacing 12.
test('train items read as separate marks, never a merged ribbon', () => {
  const trains: readonly (readonly [string, TrainSpec])[] = [
    ['chunk', CHUNK_TRAIN],
    ['vector', VECTOR_GLYPHS],
  ];
  for (const [name, train] of trains)
    assert.ok(
      train.spacing >= DIAGRAM_TOKEN_SIZE.flow + 4,
      `${name} train fuses into one blob: spacing ${train.spacing}`
    );
});

// Parked trains are the reduced-motion figure, so every train must spread inside
// its lane instead of clamping onto the far tile edge.
test('parked trains fit their lanes without clamping', () => {
  const placements: readonly (readonly [TrainSpec, number])[] = [
    [CHUNK_TRAIN, LANE_LENGTH.chunk.desktop],
    [VECTOR_GLYPHS, LANE_LENGTH.vector.desktop],
    [CHUNK_TRAIN, MOBILE_HOP_LENGTH.chunk],
    [VECTOR_GLYPHS, MOBILE_HOP_LENGTH.vector],
  ];
  for (const [train, length] of placements) {
    assert.ok(
      (train.tokens - 1) * train.spacing <= length,
      `parked train clamps: ${train.tokens}×${train.spacing} in ${length}`
    );
  }
});

// A lane is inset by half an item plus a gutter, because an item's CENTRE rides
// the lane (both at rest and mid-flight): anything less and an item hangs over the
// tile border it just left. The widest item is an emoji's display box.
test('the lane inset keeps every item off the tiles it travels between', () => {
  assert.ok(
    TRAIN_LANE_INSET >=
      emojiDisplaySize(DIAGRAM_TOKEN_SIZE.flow) / 2 + BORDER_CLEARANCE,
    `lane inset is too shallow: ${TRAIN_LANE_INSET}`
  );
  const laneStart = DESKTOP.corpus.x + DESKTOP.corpus.width + TRAIN_LANE_INSET;
  assert.equal(
    lanePath(DESKTOP.corpus, DESKTOP.model, DESKTOP.flowY),
    `M ${laneStart} ${DESKTOP.flowY} L ${
      DESKTOP.model.x - TRAIN_LANE_INSET
    } ${DESKTOP.flowY}`
  );
  assert.equal(
    LANE_LENGTH.chunk.desktop,
    DESKTOP_HOP.chunk - 2 * TRAIN_LANE_INSET
  );
});

// flowTiming echoes the shared LOOP_MS/TRAVEL_MS constants verbatim, so
// asserting them back would only restate the definition; the choreography tests
// below cover the actual timing contract.

// The user-visible contract this figure has to keep: three stages — chunks in,
// gear turns, vectors out — chaining in process order with no pause bracketing a
// train, so the pipeline never idles.
test('stages chain in process order with no dead time', () => {
  const chunkClear =
    FLOW_START_MS.corpus + trainArrivalMs(CHUNK_TRAIN, 'chunk');
  const gearEnd = GEAR_BEAT.startMs + GEAR_BEAT.turnMs;
  assert.equal(
    GEAR_BEAT.startMs,
    chunkClear,
    'the gear waits after the chunks'
  );
  assert.equal(
    FLOW_START_MS.vector,
    gearEnd,
    'the vector train waits after the gear'
  );
  assert.ok(
    FLOW_START_MS.corpus < GEAR_BEAT.startMs &&
      GEAR_BEAT.startMs < FLOW_START_MS.vector,
    'stages are out of process order'
  );
});

// Both canvases ride the same schedule, so each stage must also clear inside
// its own beat on the shorter (mobile) connectors.
test('the schedule holds on both canvases', () => {
  const stages = [
    {
      train: CHUNK_TRAIN,
      start: FLOW_START_MS.corpus,
      length: DESKTOP_HOP.chunk,
      endsBy: GEAR_BEAT.startMs,
    },
    {
      train: CHUNK_TRAIN,
      start: FLOW_START_MS.corpus,
      length: MOBILE_HOP_LENGTH.chunk,
      endsBy: GEAR_BEAT.startMs,
    },
    {
      train: VECTOR_GLYPHS,
      start: FLOW_START_MS.vector,
      length: DESKTOP_HOP.vector,
      endsBy: LOOP_MS,
    },
    {
      train: VECTOR_GLYPHS,
      start: FLOW_START_MS.vector,
      length: MOBILE_HOP_LENGTH.vector,
      endsBy: LOOP_MS,
    },
  ] as const;
  for (const { train, start, length, endsBy } of stages) {
    const clear = start + trainClearMs(train, length);
    assert.ok(clear <= endsBy, `train outlives its beat: ${clear} > ${endsBy}`);
  }
});

// The gear is the embedding pass made visible: it owns exactly the beat between
// the chunk train clearing and the vector train departing — both edges of it are
// the neighbouring stages' own boundaries, so nothing waits. A whole number of
// revolutions keeps its orientation identical across loop boundaries.
test('the gear owns the beat between the two trains', () => {
  assert.equal(GEAR_BEAT.turns, 1);
  assert.equal(
    GEAR_BEAT.startMs,
    FLOW_START_MS.corpus + trainArrivalMs(CHUNK_TRAIN, 'chunk'),
    'the gear does not start when the chunks land'
  );
  assert.equal(
    GEAR_BEAT.startMs + GEAR_BEAT.turnMs,
    FLOW_START_MS.vector,
    'the vectors do not leave when the gear stops'
  );
});

// The landing beat is where the vectors are all in: the settle breath and the
// write rings must sit on the vector train's clear time.
test('the landing beat marks the vectors all arriving', () => {
  assert.equal(
    LANDING_MS,
    FLOW_START_MS.vector + trainArrivalMs(VECTOR_GLYPHS, 'vector')
  );
  assert.ok(arrivesAt(FLOW_START_MS.vector) <= LANDING_MS);
  assert.ok(LANDING_MS < LOOP_MS);
  assert.ok(
    LANDING_MS + LANDING_BEAT.holdMs < FADE_OUT_START_MS,
    'the settle breath outlives the hold it is meant to sit in'
  );
});

// The write rings both vectors of the close pair — the pair carries the meaning
// relation, so marking only one of them would read as an arbitrary highlight.
// The second ring is secondary: later, softer and smaller, inside the beat.
test('the write rings both sides of the close pair', () => {
  assert.equal(PULSES.length, 2);
  const [primary, secondary] = PULSES;
  assert.ok(
    NEIGHBOUR_PAIR.includes(primary.id as (typeof NEIGHBOUR_PAIR)[number]) &&
      NEIGHBOUR_PAIR.includes(secondary.id as (typeof NEIGHBOUR_PAIR)[number]),
    'a ring marks a vector outside the meaning pair'
  );
  assert.notEqual(primary.id, secondary.id, 'the pair is rung twice');
  assert.equal(primary.id, LANDING_DOT_ID, 'the primary ring misses the write');
  assert.equal(
    secondary.atMs - primary.atMs,
    SECONDARY_PULSE_DELAY_MS,
    'the secondary ring does not follow the primary'
  );
  assert.ok(
    secondary.opacity < primary.opacity,
    'the secondary ring shouts as loud as the write'
  );
  assert.ok(
    secondary.radius.desktop < primary.radius.desktop &&
      secondary.radius.compact < primary.radius.compact,
    'the secondary ring is not quieter in size'
  );
  for (const pulse of PULSES) {
    assert.ok(
      pulse.opacity > 0 && pulse.opacity <= 1,
      `ring ${pulse.id} has no visible peak`
    );
    assert.ok(
      pulse.atMs >= dotArrivalMs(pulse.id),
      `ring ${pulse.id} rings an empty spot before its vector lands`
    );
    assert.ok(
      pulse.atMs >= LANDING_MS && pulse.atMs < FADE_OUT_START_MS,
      `ring ${pulse.id} fires outside the write beat`
    );
    assert.ok(
      pulse.atMs + PULSE_BEAT.riseMs + PULSE_BEAT.holdMs <= FADE_OUT_START_MS,
      `ring ${pulse.id} is still drawing when the roll-back starts`
    );
    assert.ok(
      pulse.radius.desktop > SCATTER_GLYPH_SIZE.desktop / 2,
      `ring ${pulse.id} would be hidden inside its glyph`
    );
    assert.ok(
      pulse.radius.compact > SCATTER_GLYPH_SIZE.compact / 2,
      `ring ${pulse.id} touches its glyph on the compact canvas`
    );
  }
});

// The index is a living structure, not a stage that empties: it holds standing
// vectors before the loop starts, the loop adds exactly one labelled dot per
// delivered vector glyph, and the reset removes exactly those again.
test('the loop adds one dot per delivered vector to a standing index', () => {
  const standing = SCATTER_DOTS.filter((dot) => !isEnteringDot(dot.id));
  assert.ok(standing.length > 0, 'the index starts empty');
  assert.equal(ENTRY_DOTS.length, VECTOR_GLYPHS.tokens);
  assert.equal(
    standing.length + ENTRY_DOTS.length,
    SCATTER_DOTS.length,
    'the loop must not invent or lose dots'
  );
  for (const id of ENTRY_DOTS) {
    assert.ok(dotById(id), `arriving dot ${id} is not in the scatter`);
    assert.ok(dotById(id).label, `arriving dot ${id} is unlabelled`);
  }
  for (const dot of standing) assert.equal(dotArrivalMs(dot.id), 0);
});

// Each arriving dot appears the instant its own vector glyph lands — on BOTH
// canvases, because one schedule drives them — and the last arrival IS the write
// beat, so the landing pulse and the settle breath need no retiming.
test('each dot lands no earlier than its glyph, on either canvas', () => {
  const arrivals = ENTRY_ARRIVAL_MS;
  assert.equal(arrivals.length, ENTRY_DOTS.length);
  assert.equal(entryIndex(LANDING_DOT_ID), arrivals.length - 1);
  for (let index = 0; index < arrivals.length; index += 1) {
    assert.equal(entryIndex(ENTRY_DOTS[index]), index);
    assert.equal(dotArrivalMs(ENTRY_DOTS[index]), arrivals[index]);
    for (const length of Object.values(LANE_LENGTH.vector))
      assert.ok(
        arrivals[index] >=
          FLOW_START_MS.vector + itemArrivalMs(VECTOR_GLYPHS, 'vector', index),
        `dot ${ENTRY_DOTS[index]} pops before its glyph lands (${length}px hop)`
      );
    if (index > 0)
      assert.ok(arrivals[index] > arrivals[index - 1], 'entries collide');
  }
  assert.equal(arrivals[arrivals.length - 1], LANDING_MS);
});

// A link can only exist once both endpoints are in, so each arriving vector
// connects as it lands — and the reset gives every trace room to finish.
test('each arriving vector connects as it lands, then the reset removes it', () => {
  const drawnKeys = new Set(DRAWN_LINKS.map((link) => link.from + link.to));
  const hasDrawn = (from: string, to: string) =>
    drawnKeys.has(from + to) || drawnKeys.has(to + from);
  assert.ok(DRAWN_LINKS.length > 0, 'the write draws nothing');
  for (const [from, to] of STANDING_EDGES)
    assert.ok(
      !hasDrawn(from, to),
      `standing edge ${from}-${to} is redrawn as part of the write`
    );
  for (const dot of SCATTER_DOTS.filter((d) => isEnteringDot(d.id)))
    assert.ok(
      DRAWN_LINKS.some((link) => link.from === dot.id || link.to === dot.id),
      `arriving dot ${dot.id} never connects`
    );
  for (const link of DRAWN_LINKS) {
    assert.equal(
      link.availableMs,
      Math.max(dotArrivalMs(link.from), dotArrivalMs(link.to)),
      `link ${link.from}-${link.to} waits for the wrong arrival`
    );
    assert.equal(
      linkBeginMs(link.from, link.to),
      link.beginMs,
      'the schedule contradicts its own lookup'
    );
  }
  const beginTimes = DRAWN_LINKS.map((link) => link.beginMs);
  assert.deepEqual(
    beginTimes,
    [...beginTimes].sort((a, b) => a - b)
  );
  const lastEnd = Math.max(
    ...DRAWN_LINKS.map((link) => link.beginMs + CONNECT_DRAW_MS)
  );
  // The connect beat rides its own window, so it can never crowd the hold.
  assert.ok(
    lastEnd <= LANDING_MS + CONNECT_BUDGET_MS,
    'the connect beat outlives its window'
  );
  assert.ok(
    LANDING_MS + DOT_ENTRY_MS <= FADE_OUT_START_MS,
    'the roll-back cuts off the last arriving dot'
  );
});

// The tail is the user-visible pacing: the loop must show what it just built for
// a good while, then roll back INTO the wrap, on the same terms as the repo's
// other roll-back loop (CompactionLineDiagram holds its end state ~1.7–2.3s,
// restores over RESTORE_MS, and finishes that restore on the wrap).
test('the end state holds, then the roll-back lands on the loop wrap', () => {
  const connectEnd = Math.max(
    ...DRAWN_LINKS.map((link) => link.beginMs + CONNECT_DRAW_MS)
  );
  const hold = FADE_OUT_START_MS - connectEnd;
  assert.ok(hold >= 1500, `the end state flashes past: ${hold}ms`);
  assert.ok(hold <= 3000, `the end state overstays: ${hold}ms`);
  assert.equal(
    END_HOLD_MS,
    FADE_OUT_START_MS - (LANDING_MS + CONNECT_BUDGET_MS)
  );
  assert.equal(
    FADE_OUT_MS,
    RESTORE_MS,
    'the roll-back duration must match the repo convention'
  );
  assert.equal(
    FADE_OUT_START_MS + FADE_OUT_MS,
    LOOP_MS,
    'the roll-back must end exactly at the loop wrap'
  );
  assert.ok(FADE_OUT_START_MS > connectEnd, 'the roll-back starts mid-write');
});

test('lookups fail loudly, never silently', () => {
  assert.throws(() => dotById('nope'));
  assert.throws(() => entryIndex('a'));
  assert.throws(() => entryIndex('nope'));
  assert.throws(() => linkBeginMs('a', 'd'));
  assert.throws(() => dotArrivalMs('nope'));
});

test('desktop tiles stay in bounds and never overlap', () => {
  const tiles = [DESKTOP.corpus, DESKTOP.model, DESKTOP.index];
  for (const tile of tiles) {
    assert.ok(
      tile.x >= 0 &&
        tile.x + tile.width <= DESKTOP.canvas.width &&
        tile.y >= 0 &&
        tile.y + tile.height <= DESKTOP.canvas.height,
      'tile leaves the canvas'
    );
  }
  for (let i = 0; i < tiles.length; i += 1) {
    for (let j = i + 1; j < tiles.length; j += 1) {
      const a = tiles[i];
      const b = tiles[j];
      const overlaps =
        a.x < b.x + b.width &&
        b.x < a.x + a.width &&
        a.y < b.y + b.height &&
        b.y < a.y + a.height;
      assert.ok(!overlaps, 'desktop tiles overlap');
    }
  }
});

// The mobile figure is a column, so every hop between two tiles must hold its
// whole resting train (chips never clamp onto a tile border) and must leave the
// hop's annotation readable.
test('mobile hops hold their whole train between the tiles', () => {
  const tiles = [MOBILE.corpus, MOBILE.model, MOBILE.index];
  for (let index = 1; index < tiles.length; index += 1)
    assert.ok(
      tiles[index].y >= tiles[index - 1].y + tiles[index - 1].height,
      'mobile tiles overlap'
    );
  const hops = [
    {
      hop: MOBILE_HOP.chunk,
      trains: [CHUNK_TRAIN],
      above: MOBILE.corpus,
      below: MOBILE.model,
    },
    {
      hop: MOBILE_HOP.vector,
      trains: [VECTOR_GLYPHS],
      above: MOBILE.model,
      below: MOBILE.index,
    },
  ] as const;
  for (const { hop, trains, above, below } of hops) {
    assert.equal(hop.end, below.y, 'hop must land on the next tile edge');
    for (const train of trains) {
      const trainSpan = (train.tokens - 1) * train.spacing;
      const laneStart = hop.start + TRAIN_LANE_INSET;
      assert.ok(
        trainSpan <= hop.end - hop.start - 2 * TRAIN_LANE_INSET,
        `train clamps onto tile: ${trainSpan} > ${hop.end - hop.start}`
      );
      assert.ok(
        laneStart - HALF_CHIP >= above.y + above.height + BORDER_CLEARANCE,
        `chip rides the tile above: ${laneStart - HALF_CHIP}`
      );
      const lastChipBottom = hop.end - TRAIN_LANE_INSET + HALF_CHIP;
      assert.ok(
        lastChipBottom <= below.y - BORDER_CLEARANCE,
        `chip rides the tile below: ${lastChipBottom}`
      );
    }
  }
});

test('hop annotations stay clear of the trains they name', () => {
  // 'meaning → distance' sits 20px under the model tile, i.e. 11..22px under it.
  const annotationBottom = MOBILE.model.y + MOBILE.model.height + 22;
  assert.ok(
    annotationBottom <= MOBILE_HOP.vector.start + TRAIN_LANE_INSET - HALF_CHIP
  );

  // The vector hop rides straight into the merged index tile with no 'stored'
  // label: nothing else may occupy that vertical lane.
  assert.equal(MOBILE_HOP.vector.end, MOBILE.index.y);
  assert.ok(MOBILE.flowX > MOBILE.index.x);
  assert.ok(MOBILE.flowX < MOBILE.index.x + MOBILE.index.width);
});

test('mobile canvas holds the whole column plus a margin', () => {
  assert.ok(MOBILE.index.y + MOBILE.index.height + 16 <= MOBILE.canvas.height);
  for (const tile of [MOBILE.corpus, MOBILE.model, MOBILE.index]) {
    assert.ok(tile.x >= 0 && tile.x + tile.width <= MOBILE.canvas.width);
    assert.ok(tile.y >= 0 && tile.y + tile.height <= MOBILE.canvas.height);
  }
  assert.ok(
    MOBILE.flowX > MOBILE.corpus.x &&
      MOBILE.flowX < MOBILE.corpus.x + MOBILE.corpus.width
  );
});

test('the scatter region leaves room for the tile framing', () => {
  for (const [tile, region] of [
    [DESKTOP.index, DESKTOP_SCATTER],
    [MOBILE.index, MOBILE_SCATTER],
  ] as const) {
    // No wide dead column beside the graph: the framing is a header, not a
    // sidebar, so the margins stay margins and the tile stays snug around the
    // graph it holds.
    const leftMargin = region.x - tile.x;
    const rightMargin = tile.x + tile.width - (region.x + region.width);
    assert.ok(
      leftMargin <= tile.width * 0.25,
      'left margin reads as an empty column'
    );
    assert.equal(
      leftMargin,
      rightMargin,
      'the graph is not centred in its tile'
    );
    assert.ok(
      leftMargin <= 44,
      'the tile is padded wider than the graph needs'
    );
    assert.ok(region.y > tile.y + 40, 'eyebrow is not cleared');
    assert.ok(
      region.x + region.width < tile.x + tile.width,
      'scatter overflows the tile'
    );
    assert.ok(
      region.y + region.height + 30 < tile.y + tile.height,
      'caption is not cleared'
    );
  }
});
