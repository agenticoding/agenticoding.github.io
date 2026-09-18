import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ANSWER_LABEL_DROP,
  ANSWER_SIZE,
  ANSWER_TILE_SIZE,
  CANDIDATE_ROWS,
  CLUSTER_COUNT,
  COMPRESS_BEAT_MS,
  COMPRESS_START_MS,
  CORRIDOR_FADE_MS,
  CORRIDOR_STEP_MS,
  CORRIDOR_TRAVEL_MS,
  DEEP_RESEARCH_SYNTHESIS_LAYOUT,
  DEEP_RESEARCH_SYNTHESIS_VIEWBOX,
  EDGE_TRACE_MS,
  EXIT_LANES_MS,
  EXIT_PLUMBING,
  FINAL_START_MS,
  FINAL_TRAVEL_MS,
  GRAPH_NODES,
  LANE_TOKEN,
  LOOP_MS,
  SIGNAL_FADE_MS,
  SIGNAL_TRAVEL_MS,
  ROLLBACK_START_MS,
  STEP_MS,
  TILE_HEIGHT,
  TILE_MARGIN,
  TILE_ROW_OFFSETS,
  TRAVERSAL,
  boxBottom,
  boxCenter,
  boxRight,
  candidateArrivalMs,
  candidateDepartMs,
  candidateSlot,
  clusterRows,
  compressionMs,
  corridorPath,
  answerNodeAt,
  edgeRevealMs,
  exitJunction,
  exitRoutes,
  fillCompleteMs,
  finalJoint,
  finalPath,
  finalTrainClearsMs,
  laneDrainedMs,
  laneExitPoint,
  laneSignalStartMs,
  laneExitStartMs,
  laneWidth,
  nodeById,
  nodeLabelBox,
  nodeRevealMs,
  rowBuildMs,
  tileAxis,
  traversalEdges,
  type Box,
  type DiagramMode,
  type GraphNodeId,
  type Point,
} from './deepResearchSynthesisModel.ts';

const MODES: readonly DiagramMode[] = ['desktop', 'mobile'];

/** The two modes are TRANSPOSED: desktop lays its lanes across x, mobile down y. These
 * accessors read a box's travel extent and a point's travel position from whichever axis
 * the mode uses, so ONE assertion covers both orientations. */
function orientation(mode: DiagramMode) {
  return mode === 'desktop'
    ? {
        from: (box: Box) => box.x,
        to: (box: Box) => boxRight(box),
        at: (point: Point) => point.x,
        across: (point: Point) => point.y,
      }
    : {
        from: (box: Box) => box.y,
        to: (box: Box) => boxBottom(box),
        at: (point: Point) => point.y,
        across: (point: Point) => point.x,
      };
}

/** The lane centres measured from the tile's own origin on the axis the lanes are laid
 * on: desktop stacks them down the tile, mobile lays them across it. */
function laneRhythm(mode: DiagramMode) {
  const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].synthesis;
  return clusterRows(mode).map((lane) =>
    mode === 'desktop' ? lane.y - tile.y : lane.y - tile.x
  );
}

// The answer must be readable: it pops in on arrival and then holds this long before
// the loop rolls back.
const ANSWER_HOLD_MS = 1200;

function pathPoints(d: string) {
  return [...d.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(
    ([, x, y]) => ({ x: Number(x), y: Number(y) })
  );
}

/** Walks a cornered route (M/H/V only) into the points it lands on, so a test can
 * check where a lane's pipe actually starts and ends. */
function routePoints(d: string) {
  const visited: { x: number; y: number }[] = [];
  let at = { x: 0, y: 0 };
  for (const [, command, args] of d.matchAll(/([MHV])([^MHV]*)/g)) {
    const values = (args.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (command === 'M') at = { x: values[0], y: values[1] };
    if (command === 'H') at = { x: values[0], y: at.y };
    if (command === 'V') at = { x: at.x, y: values[0] };
    visited.push({ ...at });
  }
  return visited;
}

/** Whether a point lies on the axis-aligned run between two corners. */
function onRun(
  from: { x: number; y: number },
  to: { x: number; y: number },
  at: { x: number; y: number }
) {
  const between = (value: number, a: number, b: number) =>
    value >= Math.min(a, b) && value <= Math.max(a, b);
  return from.x === to.x
    ? at.x === from.x && between(at.y, from.y, to.y)
    : at.y === from.y && between(at.x, from.x, to.x);
}

function inside(
  point: { x: number; y: number },
  box: { x: number; y: number; width: number; height: number }
) {
  return (
    point.x >= box.x &&
    point.x <= boxRight(box) &&
    point.y >= box.y &&
    point.y <= boxBottom(box)
  );
}

test('all three tiles fit their viewBox without overlap', () => {
  for (const mode of MODES) {
    const view = DEEP_RESEARCH_SYNTHESIS_VIEWBOX[mode];
    const { exploration, synthesis, answer } =
      DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode];
    for (const box of [exploration, synthesis, answer]) {
      assert.ok(box.x >= 0 && box.y >= 0);
      assert.ok(boxRight(box) <= view.width && boxBottom(box) <= view.height);
    }
    assert.ok(
      boxRight(exploration) <= synthesis.x ||
        boxBottom(exploration) <= synthesis.y,
      'the two stage tiles overlap'
    );
    assert.ok(
      boxRight(synthesis) <= answer.x || boxBottom(synthesis) <= answer.y,
      'the answer tile overlaps the synthesis tile'
    );
  }
});

test('the trail sits inside the exploration tile', () => {
  for (const mode of MODES) {
    const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].exploration;
    for (const id of Object.keys(GRAPH_NODES[mode]) as GraphNodeId[]) {
      assert.ok(inside(nodeById(mode, id), tile), `${id} escapes the tile`);
    }
  }
});

/** Whether an axis-aligned segment touches a box: for a segment that never bends,
 * its bounding box IS the segment. */
function crosses(
  from: { x: number; y: number },
  to: { x: number; y: number },
  box: { x: number; y: number; width: number; height: number }
) {
  const overlapsX =
    Math.min(from.x, to.x) <= boxRight(box) && Math.max(from.x, to.x) >= box.x;
  const overlapsY =
    Math.min(from.y, to.y) <= boxBottom(box) && Math.max(from.y, to.y) >= box.y;
  return overlapsX && overlapsY;
}

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) {
  return (
    a.x < boxRight(b) &&
    boxRight(a) > b.x &&
    a.y < boxBottom(b) &&
    boxBottom(a) > b.y
  );
}

// The two tiles are ONE pipeline and one block: same width, same height, same three
// rows, so a topic lane sits level with the trail stop that fed it and neither tile
// reads as the odd one out.
test('both tiles are the same width and height, on one row rhythm', () => {
  for (const mode of MODES) {
    const { exploration, synthesis } = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode];
    assert.equal(exploration.width, synthesis.width);
    assert.equal(exploration.height, TILE_HEIGHT);
    assert.equal(synthesis.height, TILE_HEIGHT);
    const rowStarts = ['question', 'specs', 'idea'] as GraphNodeId[];
    assert.deepEqual(
      rowStarts.map((id) => nodeById(mode, id).y - exploration.y),
      [...TILE_ROW_OFFSETS]
    );
    // Mobile takes the trail's COLUMN rhythm instead: the outer lanes stand on the two
    // columns its stops occupy and the middle lane on the shared axis.
    const columnAt = (id: GraphNodeId) => nodeById(mode, id).x - synthesis.x;
    const expectedRhythm =
      mode === 'desktop'
        ? [...TILE_ROW_OFFSETS]
        : [columnAt('question'), tileAxis(mode) - synthesis.x, columnAt('web')];
    assert.deepEqual(
      laneRhythm(mode),
      expectedRhythm,
      'the lanes are not on the shared rhythm'
    );
  }
});

// A lane is exactly as long as the seats it holds, with the same even wrap at both ends
// — the dead space past a lane's last seat used to read as a row that never finished.
test('a topic lane is exactly as long as the seats it holds', () => {
  for (const mode of MODES) {
    const along = orientation(mode);
    const lane = clusterRows(mode)[0].box;
    assert.equal(
      along.to(lane) - along.from(lane),
      laneWidth(),
      'the lane is not as long as its seats need'
    );
    for (let row = 0; row < CLUSTER_COUNT; row += 1) {
      const seats = CANDIDATE_ROWS.map((target, candidate) => ({
        target,
        candidate,
      }))
        .filter((entry) => entry.target === row)
        .map((entry) => along.at(candidateSlot(mode, entry.candidate)));
      // Desktop derives a seat from the token's LEADING edge, so a seat's own size hangs
      // off its end; mobile centres the token on the seat and clears half a token at each
      // end instead. Both are the same even wrap of the seats by LANE_TOKEN.padding.
      const leading =
        mode === 'desktop'
          ? LANE_TOKEN.padding
          : LANE_TOKEN.padding + LANE_TOKEN.size / 2;
      const trailing = mode === 'desktop' ? leading + LANE_TOKEN.size : leading;
      assert.equal(Math.min(...seats) - along.from(lane), leading);
      assert.equal(along.to(lane) - Math.max(...seats), trailing);
    }
  }
});

// The synthesis tile is only as big as its lanes need along the exit axis: the lane's
// lead-in, the lane, then the plumbing's own inset — nothing trails off, and no dead band
// is left for the eye to read as content that failed to arrive.
test('the synthesis tile is only as big as its lanes need', () => {
  for (const mode of MODES) {
    const along = orientation(mode);
    const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].synthesis;
    const lane = clusterRows(mode)[0].box;
    const port = laneExitPoint(mode, 0);
    const { portInset, spineInset } = EXIT_PLUMBING[mode];
    // Desktop insets its lane from the tile's content edge; mobile starts its lane right
    // under the header, wrapping the first seat of the shared rhythm.
    const leadIn =
      mode === 'desktop'
        ? TILE_MARGIN
        : TILE_ROW_OFFSETS[0] - LANE_TOKEN.padding - LANE_TOKEN.size / 2;
    assert.equal(along.from(lane) - along.from(tile), leadIn);
    assert.ok(
      along.at(port) > along.to(lane),
      'candidates have no room to slide out'
    );
    assert.equal(along.to(tile) - along.at(port), portInset);
    assert.ok(spineInset < portInset, 'the exit port sits behind the spine');
  }
});

// The canvas wraps the content instead of surrounding it with dead space, so the
// figure renders as large as its column allows. Both breakpoints derive their canvas
// from the tiles, so both must be tight on every edge.
test('the canvas wraps the tiles and the answer tightly', () => {
  const MAX_SLACK = 24;
  for (const mode of MODES) {
    const view = DEEP_RESEARCH_SYNTHESIS_VIEWBOX[mode];
    const { exploration, synthesis, answer } =
      DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode];
    // The answer's node lives inside its tile, so the tile IS the content bound.
    const contentBottom = Math.max(
      boxBottom(exploration),
      boxBottom(synthesis),
      boxBottom(answer)
    );
    const contentRight = Math.max(
      boxRight(exploration),
      boxRight(synthesis),
      boxRight(answer)
    );
    assert.ok(exploration.x <= MAX_SLACK, 'dead space left of the figure');
    assert.ok(exploration.y <= MAX_SLACK, 'dead space above the figure');
    assert.ok(contentRight <= view.width && contentBottom <= view.height);
    assert.ok(
      view.width - contentRight <= MAX_SLACK,
      'dead space right of the figure'
    );
    assert.ok(
      view.height - contentBottom <= MAX_SLACK,
      'dead space below the figure'
    );
  }
});

// The composition is a SERPENTINE: it steps on the 8px grid and turns a right angle
// at every stop, so it reads as one open direction and never doubles back into a
// loop. The right angles are also what make the label-clearance rule decidable.
test('the trail is an orthogonal serpentine on the grid', () => {
  for (const mode of MODES) {
    for (const id of Object.keys(GRAPH_NODES[mode]) as GraphNodeId[]) {
      const at = nodeById(mode, id);
      assert.ok(at.x % 8 === 0 && at.y % 8 === 0, `${id} is off the 8px grid`);
    }
    for (const edge of traversalEdges(mode)) {
      const moves = [edge.to.x - edge.from.x, edge.to.y - edge.from.y];
      assert.ok(
        moves.every((delta) => delta === 0) === false,
        `${edge.key} does not move`
      );
      assert.ok(
        moves.some((delta) => delta === 0),
        `${edge.key} is not axis-aligned`
      );
    }
    for (let stop = 1; stop < TRAVERSAL.length - 1; stop += 1) {
      const [before, at, after] = [stop - 1, stop, stop + 1].map((index) =>
        nodeById(mode, TRAVERSAL[index])
      );
      const runsHorizontally = (a: { y: number }, b: { y: number }) =>
        a.y === b.y;
      assert.ok(
        runsHorizontally(before, at) !== runsHorizontally(at, after),
        `the trail doubles back at ${TRAVERSAL[stop]}`
      );
    }
  }
});

// The label is the stop's only name, so nothing may cover it: no wire crosses it, no
// other label touches it, and it never leaves the tile.
test('no wire or label ever covers another label', () => {
  for (const mode of MODES) {
    const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].exploration;
    const labels = TRAVERSAL.map((id) => ({ id, box: nodeLabelBox(mode, id) }));
    for (const { id, box } of labels) {
      assert.ok(
        inside({ x: box.x, y: box.y }, tile) &&
          inside({ x: boxRight(box), y: boxBottom(box) }, tile),
        `${id}'s label escapes the tile`
      );
      for (const edge of traversalEdges(mode))
        assert.ok(
          crosses(edge.from, edge.to, box) === false,
          `${edge.key} runs through the ${id} label`
        );
    }
    labels.forEach((a, index) =>
      labels
        .slice(index + 1)
        .forEach((b) =>
          assert.ok(
            overlaps(a.box, b.box) === false,
            `the ${a.id} and ${b.id} labels overlap`
          )
        )
    );
  }
});

test('the figure draws a trail, not a web: only consecutive stops are linked', () => {
  for (const mode of MODES) {
    const edges = traversalEdges(mode);
    assert.equal(edges.length, TRAVERSAL.length - 1);
    edges.forEach((edge, index) => {
      assert.equal(edge.from.x, nodeById(mode, TRAVERSAL[index]).x);
      assert.equal(edge.from.y, nodeById(mode, TRAVERSAL[index]).y);
      assert.equal(edge.to.x, nodeById(mode, TRAVERSAL[index + 1]).x);
      assert.equal(edge.to.y, nodeById(mode, TRAVERSAL[index + 1]).y);
    });
  }
});

test('the corridor is one straight line on the tiles shared centre axis', () => {
  for (const mode of MODES) {
    const { exploration, synthesis } = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode];
    const points = pathPoints(corridorPath(mode));
    const start = points[0];
    const end = points[points.length - 1];
    if (mode === 'desktop') {
      const y = boxCenter(exploration).y;
      assert.equal(boxCenter(synthesis).y, y, 'tiles are not on one axis');
      for (const point of points) assert.equal(point.y, y);
      assert.equal(start.x, boxRight(exploration));
      assert.equal(end.x, synthesis.x);
    } else {
      const x = boxCenter(exploration).x;
      assert.equal(boxCenter(synthesis).x, x, 'tiles are not on one axis');
      for (const point of points) assert.equal(point.x, x);
      assert.equal(start.y, boxBottom(exploration));
      assert.equal(end.y, synthesis.y);
    }
  }
});

test('the output stream joints the synthesis edge to the answer tile', () => {
  for (const mode of MODES) {
    const { synthesis, answer } = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode];
    const points = pathPoints(finalPath(mode));
    const start = points[0];
    const end = points[points.length - 1];
    if (mode === 'desktop') {
      assert.equal(start.x, boxRight(synthesis));
      assert.equal(start.y, boxCenter(synthesis).y);
      for (const point of points) assert.equal(point.y, start.y);
      assert.equal(end.x, answer.x, 'the stream misses the answer tile');
    } else {
      assert.equal(start.y, boxBottom(synthesis));
      assert.equal(start.x, boxCenter(synthesis).x);
      for (const point of points) assert.equal(point.x, start.x);
      assert.equal(end.y, answer.y, 'the stream misses the answer tile');
    }
    // It stops AT the tile's edge — the stream hands off, it never enters.
    assert.ok(
      points.every(
        (point) =>
          point.x !== boxCenter(answer).x || point.y !== boxCenter(answer).y
      )
    );
  }
});

// The answer is a container, not a bare node: the same visual language as the two
// stages but sized to the one node it holds, with the node optically centred (the
// label below the emoji balanced by a shift up).
test('the answer tile holds its node with even, optical padding', () => {
  for (const mode of MODES) {
    const { answer, synthesis } = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode];
    assert.ok(
      answer.width < synthesis.width,
      'the answer tile is not a terminal tile'
    );
    assert.ok(
      ANSWER_TILE_SIZE >= ANSWER_SIZE + ANSWER_LABEL_DROP + TILE_MARGIN * 2,
      'the answer tile is too small for its node'
    );
    const at = answerNodeAt(mode);
    assert.equal(at.x, boxCenter(answer).x);
    assert.ok(inside(at, answer), 'the answer node escapes its tile');
    // The label hangs below the emoji, so the node shifts UP out of the tile's
    // geometric centre — that is what balances the two paddings.
    assert.ok(at.y < boxCenter(answer).y, 'the answer node is not lifted');
    const above = at.y - ANSWER_SIZE / 2 - answer.y;
    const below =
      boxBottom(answer) - (at.y + ANSWER_SIZE / 2 + ANSWER_LABEL_DROP);
    assert.ok(
      Math.abs(above - below) <= 4,
      'the answer node does not look centred in its tile'
    );
  }
});

// The lanes fit inside the synthesis tile and never touch: desktop stacks them down the
// tile, mobile lays them across it.
test('topic lanes fit the synthesis tile and never overlap', () => {
  for (const mode of MODES) {
    const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].synthesis;
    const lanes = clusterRows(mode);
    assert.equal(lanes.length, CLUSTER_COUNT);
    lanes.forEach((lane, index) => {
      assert.ok(lane.box.x >= tile.x && boxRight(lane.box) <= boxRight(tile));
      assert.ok(lane.box.y >= tile.y && boxBottom(lane.box) <= boxBottom(tile));
      if (index === 0) return;
      const previous = lanes[index - 1].box;
      const clear =
        mode === 'desktop'
          ? lane.box.y >= boxBottom(previous)
          : lane.box.x >= boxRight(previous);
      assert.ok(clear, `lanes ${index - 1} and ${index} overlap`);
    });
  }
});

// Mobile TRANSPOSES the synthesis interior: the three lanes run DOWN the tile, so the
// corridor arriving at its top edge meets the centre lane head-on and the plumbing
// collects them at the bottom edge — one downward direction for the whole stacked
// figure. The lanes stay symmetric about the shared axis and their ports stay strictly
// inside the tile, below their lane and above the spine that collects them.
test('the mobile lanes run down the tile, symmetric about the shared axis', () => {
  const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT.mobile.synthesis;
  const axis = tileAxis('mobile');
  const centres = clusterRows('mobile').map((lane) => lane.y);
  assert.equal(boxCenter(tile).x, axis, 'the tile is not centred on the axis');
  assert.ok(centres.includes(axis), 'no lane rides the shared axis');
  centres.forEach((centre, index) =>
    assert.equal(
      centre + centres[centres.length - 1 - index],
      axis * 2,
      'the lane columns are not symmetric about the axis'
    )
  );
  const spine = exitJunction('mobile').y;
  for (let row = 0; row < CLUSTER_COUNT; row += 1) {
    const lane = clusterRows('mobile')[row].box;
    const port = laneExitPoint('mobile', row);
    assert.equal(
      port.x,
      lane.x + lane.width / 2,
      'the port is off its lane column'
    );
    assert.ok(
      port.y > boxBottom(lane),
      `lane ${row}'s port is not below its lane`
    );
    assert.ok(port.y < spine, `lane ${row}'s port is not above the spine`);
  }
  assert.ok(spine < boxBottom(tile), 'the spine is not above the tile edge');
});

test('every candidate seats inside its own topic lane', () => {
  for (const mode of MODES) {
    const rows = clusterRows(mode);
    CANDIDATE_ROWS.forEach((row, candidate) => {
      const at = candidateSlot(mode, candidate);
      assert.ok(
        inside(at, rows[row].box),
        `candidate ${candidate} sits outside row ${row}`
      );
    });
  }
});

test('the lane routes corner out of the tile and into the out arrow', () => {
  for (const mode of MODES) {
    const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].synthesis;
    const axis = tileAxis(mode);
    const junction = exitJunction(mode);
    const routes = exitRoutes(mode);
    // The junction is the ONE point every lane converges on: on the shared axis, inset
    // from the tile's exit edge, never past it.
    assert.ok(inside(junction, tile), 'the exit junction escapes the tile');
    assert.equal(
      mode === 'desktop' ? junction.y : junction.x,
      axis,
      'the exit junction is off the tiles shared axis'
    );
    assert.equal(routes.length, CLUSTER_COUNT);
    routes.forEach((route, row) => {
      const points = routePoints(route.d);
      const start = points[0];
      const end = points[points.length - 1];
      const port = laneExitPoint(mode, row);
      const lane = clusterRows(mode)[row];
      const along = orientation(mode);
      // It starts at its own lane, passes through that lane's exit port — where its
      // candidates dissolve — and ends exactly where the out arrow starts, so the
      // plumbing and the external stream are ONE continued line.
      assert.equal(along.at(start), along.to(lane.box));
      assert.equal(along.across(start), lane.y);
      assert.ok(
        points.some(
          (point, index) => index > 0 && onRun(points[index - 1], point, port)
        ),
        `lane ${row} misses its own exit port`
      );
      assert.deepEqual(end, finalJoint(mode).start);
      // Every run is axis-aligned and turns a right angle: no diagonals, sharp corners.
      for (let index = 1; index < points.length; index += 1) {
        const from = points[index - 1];
        const to = points[index];
        assert.ok(
          from.x === to.x || from.y === to.y,
          `lane ${row} has a diagonal run`
        );
        if (index > 1) {
          const before = points[index - 2];
          assert.ok(
            (before.x === from.x) !== (from.x === to.x),
            `lane ${row} does not turn a right angle`
          );
        }
      }
      // The signal leaves once the lane has drained, and clears before the external
      // stream starts — the tile interior never holds a train of its own.
      assert.ok(laneSignalStartMs(row) >= laneDrainedMs(row));
      assert.ok(
        laneSignalStartMs(row) + SIGNAL_TRAVEL_MS + SIGNAL_FADE_MS <=
          FINAL_START_MS,
        `lane ${row} signal is still crossing when the stream leaves`
      );
    });
  }
});

test('the trail rings its stops while the corridor streams continuously', () => {
  // The trail is sequential: each segment lands before the next traces, and the
  // stop only rings once its segment has arrived.
  for (let step = 2; step <= TRAVERSAL.length - 1; step += 1) {
    assert.ok(
      edgeRevealMs(step) >= edgeRevealMs(step - 1) + EDGE_TRACE_MS,
      `trail step ${step} starts before step ${step - 1} lands`
    );
  }
  assert.ok(STEP_MS > EDGE_TRACE_MS, 'trail steps overlap');
  // The corridor is ONE continuous stream: tokens overlap, and it spans the whole
  // walk, so candidates pour out the whole time exploration runs.
  assert.ok(
    CORRIDOR_STEP_MS < CORRIDOR_TRAVEL_MS,
    'the corridor stream has gaps'
  );
  assert.ok(
    candidateDepartMs(0) <= nodeRevealMs(1),
    'the stream starts after the first stop rings'
  );
  assert.ok(
    candidateArrivalMs(CANDIDATE_ROWS.length - 1) >=
      nodeRevealMs(TRAVERSAL.length - 1),
    'the stream stops before the walk does'
  );
  // It drains before synthesis starts folding.
  assert.ok(
    candidateArrivalMs(CANDIDATE_ROWS.length - 1) < COMPRESS_START_MS,
    'compression starts before the stream ends'
  );
  // The grey exit lanes open only once EVERY lane is full, and before folding.
  assert.ok(
    fillCompleteMs() <= EXIT_LANES_MS,
    'the exit lanes open before every lane is full'
  );
  assert.ok(
    EXIT_LANES_MS <= COMPRESS_START_MS,
    'compression begins before the exit lanes open'
  );
  // Rows build with their first candidate, compress in sequence, then merge.
  for (let row = 0; row < CLUSTER_COUNT; row += 1) {
    assert.ok(rowBuildMs(row) <= candidateArrivalMs(CANDIDATE_ROWS.length - 1));
    if (row > 0)
      assert.ok(
        compressionMs(row) >= compressionMs(row - 1) + COMPRESS_BEAT_MS,
        `row ${row} compresses before row ${row - 1} finishes`
      );
  }
  // Each lane's candidates slide out and dissolve over ONE window, opened after the
  // exit lanes appear and long enough that the row drains gently rather than
  // snapping: the exit beat outlasts the blue fact's own appearance.
  for (let row = 0; row < CLUSTER_COUNT; row += 1) {
    assert.ok(
      laneExitStartMs(row) >= EXIT_LANES_MS,
      `lane ${row} leaves before its exit lane opens`
    );
    assert.ok(
      laneDrainedMs(row) - laneExitStartMs(row) > COMPRESS_BEAT_MS,
      `lane ${row} exits no softer than the fold it feeds`
    );
    CANDIDATE_ROWS.forEach((target, candidate) => {
      if (target !== row) return;
      assert.ok(
        candidateArrivalMs(candidate) + CORRIDOR_FADE_MS <=
          laneExitStartMs(row),
        `candidate ${candidate} leaves row ${row} before it has seated`
      );
    });
  }
  assert.ok(
    laneDrainedMs(CLUSTER_COUNT - 1) <= FINAL_START_MS,
    'the output leaves before the lanes have drained'
  );
  // The answer reveals onto an EMPTY slot: the last output token has faded first.
  for (const mode of MODES) {
    assert.ok(
      finalTrainClearsMs(mode) > FINAL_START_MS + FINAL_TRAVEL_MS,
      `the answer reveals under the output stream on ${mode}`
    );
    assert.ok(
      finalTrainClearsMs(mode) < ROLLBACK_START_MS,
      `the answer arrives after rollback on ${mode}`
    );
    // The answer is the payoff: it must HOLD long enough to register, not flash.
    assert.ok(
      ROLLBACK_START_MS - finalTrainClearsMs(mode) >= ANSWER_HOLD_MS,
      `the answer holds too briefly on ${mode}`
    );
  }
  assert.ok(ROLLBACK_START_MS < LOOP_MS, 'rollback has no room in the loop');
});

test('each topic lane fills completely before the next begins', () => {
  // Grouped order: the row index only ever increases, so no lane is revisited and
  // every lane fills to completion before the next one starts.
  for (let i = 1; i < CANDIDATE_ROWS.length; i += 1)
    assert.ok(
      CANDIDATE_ROWS[i] >= CANDIDATE_ROWS[i - 1],
      `lane order goes backwards at candidate ${i}`
    );
  const rows = new Set(CANDIDATE_ROWS);
  assert.equal(rows.size, CLUSTER_COUNT);
  for (const row of rows)
    assert.ok(
      CANDIDATE_ROWS.filter((target) => target === row).length >= 2,
      `row ${row} gets too few candidates to fold`
    );
});
