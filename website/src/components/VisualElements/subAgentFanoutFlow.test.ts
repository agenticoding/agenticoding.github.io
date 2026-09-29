// Guards for the fan-out router. These are the invariants the figure broke
// silently before: an outbound leg and its inbound synthesis sharing one stroke,
// a synthesis leg crossing the dispatch's elbow column, and a corridor that
// silently shrank both lanes onto the ledger border.
//
// One composition now serves every width (the old desktop/mobile split is gone),
// so these run across the real scene-width range instead of two viewports. Row
// fixtures use the foundation's real weight model and its derived canvas;
// rendered geometry is verified in the browser phase.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  contentFloorHeight,
  resolveRegionGeometry,
  type ContextRegionRow,
} from './contextRegions.ts';
import {
  DIAGRAM_GRID,
  DIAGRAM_HALF,
  DIAGRAM_ICON_SIZE,
  DIAGRAM_STROKE,
  DIAGRAM_TOKEN_SIZE,
  SPACE,
} from './diagramScale.ts';
import {
  arrowTipTrim,
  MAX_TERMINAL_TRIM_RATIO,
  trainLaneOffset,
} from './diagramGeometryCore.ts';
import {
  SUB_AGENT_PROFILES,
  PARENT_STACK_HEIGHT,
  dispatchDelayMs,
  FLOW_LOOP_MS,
  parentRows,
  synthesisDelayMs,
  WORK_WINDOW_MS,
  workDelayMs,
} from './SubAgentFanoutModel.ts';
import {
  COMPACT_ACTOR_SIZE,
  COMPACT_MIN_ARROW_LEG,
  COMPACT_MIN_CORRIDOR,
  COMPACT_TOKEN_GEOMETRY,
  FLOW_ACTOR_SIZE,
  FLOW_ROW_MIN_HEIGHT,
  FLOW_TOKEN_GEOMETRY,
  IDENTITY_MEASURE,
  MIN_ARROW_LEG,
  MIN_CORRIDOR,
  RAIL_MIN,
  actorAnchor,
  callerRail,
  fanoutLayout,
  fanoutScale,
  flowGeometry,
  flowLane,
  identityMeasure,
  ledgerInset,
  tokenCapacity,
  workerCenter,
  type FanoutLayout,
  type FlowFrame,
  type FlowGeometry,
  type FlowSegment,
} from './subAgentFanoutFlow.ts';

const AGENT_COUNT = SUB_AGENT_PROFILES.length;
const EPS = 0.01;
/** Sub-pixel contact is a corner meeting, not a doubled line. */
const MIN_OVERLAP = 0.5;

/** The scene widths the composition really renders at: the phone floor (238px,
 *  the narrowest harness column) up past the wide tier switch (704px) to the
 *  desk's own ceiling. Every router invariant runs across all of them. */
const WIDTHS = [238, 320, 400, 560, 704, 900, 1200] as const;
/** The width where the actor tier and its glyph train step up to the flow tier. */
const WIDE_TIER_WIDTH = 704;

function frameFrom(
  rows: readonly ContextRegionRow[],
  height: number
): FlowFrame {
  const { rowHeights } = resolveRegionGeometry(rows, height);
  let top = 0;
  const placed: Record<string, { top: number; height: number }> = {};
  for (const row of rows) {
    const rowHeight = rowHeights[row.id] ?? 0;
    placed[row.id] = { top, height: rowHeight };
    top += rowHeight;
  }
  return { rows: placed };
}

/** One ledger for every width: the rows and the canvas share one budget. */
const FRAME = frameFrom(parentRows(), PARENT_STACK_HEIGHT);

type Routed = {
  width: number;
  index: number;
  frame: FlowFrame;
  flow: FlowGeometry;
  layout: FanoutLayout;
};

/** Routes every caller at every renderable width. */
function everyRoute(visit: (routed: Routed) => void) {
  for (const width of WIDTHS) {
    for (let index = 0; index < AGENT_COUNT; index += 1) {
      visit({
        width,
        index,
        frame: FRAME,
        flow: flowGeometry(index, FRAME, width),
        layout: fanoutLayout(index, width),
      });
    }
  }
}

function isHorizontal(segment: FlowSegment) {
  return Math.abs(segment.y1 - segment.y2) < EPS;
}

function span(segment: FlowSegment, axis: 'x' | 'y') {
  const [from, to] =
    axis === 'x' ? [segment.x1, segment.x2] : [segment.y1, segment.y2];
  return [Math.min(from, to), Math.max(from, to)] as const;
}

function collinearOverlap(a: FlowSegment, b: FlowSegment) {
  if (isHorizontal(a) !== isHorizontal(b)) return 0;
  const horizontal = isHorizontal(a);
  const offsetOf = (segment: FlowSegment) =>
    horizontal ? segment.y1 : segment.x1;
  if (Math.abs(offsetOf(a) - offsetOf(b)) >= EPS) return 0;
  const [aFrom, aTo] = span(a, horizontal ? 'x' : 'y');
  const [bFrom, bTo] = span(b, horizontal ? 'x' : 'y');
  return Math.min(aTo, bTo) - Math.max(aFrom, bFrom);
}

/** A crossing is a strictly interior horizontal×vertical intersection — the one
    defect the collinear-overlap guard above cannot see. */
function crosses(a: FlowSegment, b: FlowSegment) {
  if (isHorizontal(a) === isHorizontal(b)) return false;
  const [horizontal, vertical] = isHorizontal(a) ? [a, b] : [b, a];
  const [x1, x2] = span(horizontal, 'x');
  const [y1, y2] = span(vertical, 'y');
  return (
    vertical.x1 > x1 + EPS &&
    vertical.x1 < x2 - EPS &&
    horizontal.y1 > y1 + EPS &&
    horizontal.y1 < y2 - EPS
  );
}

function sharesPoint(a: FlowSegment, b: FlowSegment) {
  if (isHorizontal(a) === isHorizontal(b)) {
    const horizontal = isHorizontal(a);
    const offset = (segment: FlowSegment) =>
      horizontal ? segment.y1 : segment.x1;
    if (Math.abs(offset(a) - offset(b)) >= EPS) return false;
    return collinearOverlap(a, b) > -EPS;
  }
  const [horizontal, vertical] = isHorizontal(a) ? [a, b] : [b, a];
  const [from, to] = span(horizontal, 'x');
  const [top, bottom] = span(vertical, 'y');
  return (
    vertical.x1 >= from - EPS &&
    vertical.x1 <= to + EPS &&
    horizontal.y1 >= top - EPS &&
    horizontal.y1 <= bottom + EPS
  );
}

function segmentsByTone(flow: FlowGeometry, tone: FlowSegment['tone']) {
  return flow.segments.filter((segment) => segment.tone === tone);
}

/** The rectangle a train sweeps: its lane, offset off the line, half a glyph wide. */
function glyphBand(flow: FlowGeometry, tone: 'dispatch' | 'return') {
  const { offset, orientation } = flowLane(tone, flow.tokens);
  const center =
    orientation === 'above'
      ? flow.lanes[tone] - offset
      : flow.lanes[tone] + offset;
  return [
    center - flow.tokens.size / 2,
    center + flow.tokens.size / 2,
  ] as const;
}

function animatedKeyframes(css: string) {
  return [...css.matchAll(/@keyframes (\w+) \{[\s\S]*?\n\}/g)].map(
    (match) => match[0]
  );
}

function animatedProperties(body: string) {
  return [...body.matchAll(/^\s{2,}([a-z-]+):/gm)].map((match) => match[1]);
}

test('the overlap detector sees a shared stroke', () => {
  // Guards the guard: an inverted span axis makes every overlap test pass.
  const shared: FlowSegment = {
    tone: 'dispatch',
    x1: 0,
    y1: 10,
    x2: 40,
    y2: 10,
  };
  const trailing: FlowSegment = {
    tone: 'return',
    x1: 20,
    y1: 10,
    x2: 60,
    y2: 10,
  };
  const elsewhere: FlowSegment = { ...trailing, y1: 30, y2: 30 };
  assert.equal(collinearOverlap(shared, trailing), 20);
  assert.equal(collinearOverlap(shared, elsewhere), 0);
  assert.ok(sharesPoint(shared, trailing));
  assert.ok(!sharesPoint(shared, elsewhere));
});

test('a round trip never touches itself: outbound and inbound strokes are disjoint', () => {
  everyRoute(({ width, index, flow }) => {
    for (const dispatch of segmentsByTone(flow, 'dispatch')) {
      for (const ret of segmentsByTone(flow, 'return')) {
        assert.ok(
          !sharesPoint(dispatch, ret),
          `${width}px agent ${index + 1}: dispatch and return strokes touch`
        );
      }
    }
  });
});

test('no two flows in the figure share a collinear span', () => {
  for (const width of WIDTHS) {
    const segments = Array.from({ length: AGENT_COUNT }, (_, index) =>
      flowGeometry(index, FRAME, width).segments.map((segment) => ({
        index,
        segment,
      }))
    ).flat();
    for (let a = 0; a < segments.length; a += 1) {
      for (let b = a + 1; b < segments.length; b += 1) {
        const overlap = collinearOverlap(
          segments[a].segment,
          segments[b].segment
        );
        assert.ok(
          overlap < MIN_OVERLAP,
          `${width}px: agents ${segments[a].index + 1} and ${segments[b].index + 1} overlap by ${overlap.toFixed(2)}px`
        );
      }
    }
  }
});

test('no two flows cross', () => {
  for (const width of WIDTHS) {
    const segments = Array.from({ length: AGENT_COUNT }, (_, index) =>
      flowGeometry(index, FRAME, width).segments.map((segment) => ({
        index,
        segment,
      }))
    ).flat();
    for (let a = 0; a < segments.length; a += 1) {
      for (let b = a + 1; b < segments.length; b += 1) {
        if (segments[a].index === segments[b].index) continue;
        assert.ok(
          !crosses(segments[a].segment, segments[b].segment),
          `${width}px: agents ${segments[a].index + 1} and ${segments[b].index + 1} cross`
        );
      }
    }
  }
});

test('elbow columns sit where their layout puts them, inside the corridor', () => {
  everyRoute(({ width, index, flow, layout }) => {
    const corridor = Math.abs(flow.robotX - flow.rootX);
    const fromRoot = (elbow: number) => Math.abs(elbow - flow.rootX);
    const reach = (elbow: number) => Math.abs(flow.robotX - elbow);
    for (const [name, elbow] of Object.entries(flow.elbows)) {
      assert.ok(
        fromRoot(elbow) > 0 && fromRoot(elbow) < corridor,
        `${width}px agent ${index + 1}: ${name} column outside the corridor`
      );
    }
    assert.ok(
      Math.abs(reach(flow.elbows.dispatch) - layout.elbowOffsets[0]) < EPS &&
        Math.abs(reach(flow.elbows.return) - layout.elbowOffsets[1]) < EPS,
      `${width}px agent ${index + 1}: elbow columns drift from the layout offsets`
    );
    // Separated columns keep a request and its synthesis off one stroke; a
    // shared column (compact corridors) must still never sit nearer the actor
    // than the dispatch column.
    assert.ok(
      reach(flow.elbows.return) >= reach(flow.elbows.dispatch) - EPS,
      `${width}px agent ${index + 1}: return column is nearer the actor`
    );
  });
});

test('both lanes attach inside the actor box, one gap short of the drawn arrow', () => {
  for (const width of WIDTHS) {
    const { tokens, actorSize } = fanoutScale(width);
    assert.ok(
      tokens.lanePitch >= tokens.size + SPACE['1'],
      `${width}px: lanes closer than one shape gap`
    );
    assert.ok(
      tokens.lanePitch <= actorSize,
      `${width}px: lanes attach outside the actor box`
    );
    assert.ok(tokens.spacing >= tokens.size + SPACE['1']);
    assert.ok(tokens.size > SPACE['1']);
  }
  everyRoute(({ width, index, frame, flow, layout }) => {
    const center = workerCenter(frame, index);
    for (const tone of ['dispatch', 'return'] as const) {
      assert.ok(
        Math.abs(flow.lanes[tone] - center) <= layout.actorSize / 2 + EPS,
        `${width}px agent ${index + 1}: ${tone} lane outside the actor box`
      );
    }
    const boxEdge =
      layout.actorCenterX + layout.towardLedger * (layout.actorSize / 2);
    assert.ok(
      Math.abs(Math.abs(flow.robotX - boxEdge) - SPACE['1']) < EPS,
      `${width}px agent ${index + 1}: arrow does not stop SPACE['1'] short of the actor`
    );
  });
});

test('a flow row is tall enough to host its own glyph lane', () => {
  // The row floor is derived from the lane geometry, so raising a width's pitch,
  // offset or glyph tier cannot silently outgrow the row that carries it — the
  // shortfall that made the trains ride the connector line itself.
  for (const width of WIDTHS) {
    const { tokens } = fanoutScale(width);
    const offset = trainLaneOffset(tokens.size, tokens.strokeWidth);
    assert.ok(
      offset > 0,
      'a train must ride beside its line, not on top of it'
    );
    const laneReach = tokens.lanePitch / 2 + offset + tokens.size / 2;
    assert.ok(
      FLOW_ROW_MIN_HEIGHT >= laneReach,
      `${width}px: a ${FLOW_ROW_MIN_HEIGHT}px row cannot reach a ${laneReach}px glyph lane`
    );
  }
  assert.equal(FLOW_ROW_MIN_HEIGHT % DIAGRAM_GRID, 0);
  // A train's first glyph must stay inside the rail whatever the lane offset's x
  // component turns out to be.
  everyRoute(({ width, index, flow }) => {
    assert.ok(
      flow.tokenInset >=
        flow.tokens.size / 2 +
          trainLaneOffset(flow.tokens.size, flow.tokens.strokeWidth),
      `${width}px agent ${index + 1}: the train can start on the window border and paint over it`
    );
  });
});

test('every runway carries a full train, and the wide band a third glyph', () => {
  everyRoute(({ width, index, flow }) => {
    const capacity = tokenCapacity(flow.tokens, flow.tokenRun);
    assert.ok(
      capacity >= 2,
      `${width}px agent ${index + 1}: a ${flow.tokenRun.toFixed(1)}px runway holds only ${capacity} glyphs`
    );
    assert.ok(
      (capacity - 1) * flow.tokens.spacing <= flow.tokenRun + EPS,
      `${width}px agent ${index + 1}: a ${capacity}-glyph train overruns its runway`
    );
  });
  // The site-standard wide glyph at the tier switch: the wide corridor still
  // hosts a third glyph. The compact rail spends its width on the ledger (the
  // hairline arrow tier buys the narrower corridor), so its shorter runway
  // carries exactly two — the floor the two-glyph invariant above already holds.
  for (const width of [238, 400, WIDE_TIER_WIDTH, 900]) {
    const floor = width >= WIDE_TIER_WIDTH ? 3 : 2;
    for (let index = 0; index < AGENT_COUNT; index += 1) {
      const flow = flowGeometry(index, FRAME, width);
      assert.ok(
        tokenCapacity(flow.tokens, flow.tokenRun) >= floor,
        `${width}px agent ${index + 1}: a ${flow.tokenRun.toFixed(1)}px runway cannot carry ${floor} glyphs`
      );
    }
  }
  assert.equal(
    flowGeometry(0, FRAME, WIDE_TIER_WIDTH).tokens.size,
    DIAGRAM_TOKEN_SIZE.flow
  );
  assert.equal(
    flowGeometry(0, FRAME, 238).tokens.size,
    DIAGRAM_TOKEN_SIZE.dense
  );
});

test('the actor work window matches every caller span', () => {
  // The schedule and the beat share one clock: a caller works from its dispatch
  // landing to its synthesis leaving, identically for every caller.
  for (let index = 0; index < SUB_AGENT_PROFILES.length; index += 1) {
    assert.equal(
      synthesisDelayMs(index) - workDelayMs(index),
      WORK_WINDOW_MS,
      `agent ${index + 1} works for a different span`
    );
  }
});

test('each train rides the side of its line where its own row has room', () => {
  for (const width of WIDTHS) {
    const { tokens } = fanoutScale(width);
    assert.equal(flowLane('dispatch', tokens).orientation, 'above');
    assert.equal(flowLane('return', tokens).orientation, 'below');
  }
  everyRoute(({ width, index, frame, flow, layout }) => {
    const box = layout.actorSize / 2;
    const center = workerCenter(frame, index);
    for (const tone of ['dispatch', 'return'] as const) {
      const band = glyphBand(flow, tone);
      assert.ok(
        band[1] <= center - box + EPS || band[0] >= center + box - EPS,
        `${width}px agent ${index + 1}: ${tone} train overlaps its actor box`
      );
    }
  });
});

test('glyph trains sharing a rail never overlap', () => {
  for (const width of WIDTHS) {
    const byRail = new Map<number, (readonly [number, number])[]>();
    for (let index = 0; index < AGENT_COUNT; index += 1) {
      const flow = flowGeometry(index, FRAME, width);
      const rail = fanoutLayout(index, width).towardLedger;
      byRail.set(rail, [
        ...(byRail.get(rail) ?? []),
        glyphBand(flow, 'dispatch'),
        glyphBand(flow, 'return'),
      ]);
    }
    for (const bands of byRail.values()) {
      const sorted = [...bands].sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < sorted.length; i += 1) {
        assert.ok(
          sorted[i][0] >= sorted[i - 1][1] - EPS,
          `${width}px: two glyph trains share one rail span`
        );
      }
    }
  }
});

test('same-rail actors stay one actor box plus SPACE[1] apart', () => {
  for (const width of WIDTHS) {
    const byRail = new Map<number, number[]>();
    for (let index = 0; index < AGENT_COUNT; index += 1) {
      const rail = fanoutLayout(index, width).towardLedger;
      byRail.set(rail, [
        ...(byRail.get(rail) ?? []),
        workerCenter(FRAME, index),
      ]);
    }
    const actorSize = fanoutScale(width).actorSize;
    for (const centers of byRail.values()) {
      const sorted = [...centers].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i += 1) {
        assert.ok(
          sorted[i] - sorted[i - 1] >= actorSize + SPACE['1'] - EPS,
          `${width}px: same-rail actors only ${(sorted[i] - sorted[i - 1]).toFixed(2)}px apart`
        );
      }
    }
  }
});

test('each path is the polyline its own segments describe', () => {
  everyRoute(({ width, index, flow }) => {
    for (const tone of ['dispatch', 'return'] as const) {
      const segments = flow.segments.filter((s) => s.tone === tone);
      assert.equal(segments.length, 3, `${tone} is not a three-leg L`);
      for (let i = 1; i < segments.length; i += 1) {
        assert.ok(
          sharesPoint(segments[i - 1], segments[i]),
          `${width}px agent ${index + 1}: ${tone} legs ${i} and ${i + 1} are not continuous`
        );
      }
      const ends = tone === 'dispatch' ? flow.robotX : flow.rootX;
      assert.ok(
        Math.abs(segments[2].x2 - ends) < EPS,
        `${width}px agent ${index + 1}: ${tone} does not reach its anchor`
      );
      assert.ok(
        flow.paths[tone].split(' ').length === 9,
        `${width}px agent ${index + 1}: ${tone} path lost a leg`
      );
    }
  });
});

test('the corridor hosts the layout reach and a full arrow leg on both ends', () => {
  everyRoute(({ width, index, flow, layout }) => {
    const corridor = Math.abs(flow.robotX - flow.rootX);
    const offsets = layout.elbowOffsets;
    const leg = arrowTipTrim(flow.tokens.strokeWidth) / MAX_TERMINAL_TRIM_RATIO;
    assert.ok(
      corridor >= 2 * leg - EPS,
      `${width}px agent ${index + 1}: corridor ${corridor.toFixed(2)}px < one shared column`
    );
    for (const offset of offsets) {
      assert.ok(
        offset >= leg - EPS,
        `${width}px agent ${index + 1}: elbow reach ${offset}px < the tier's min arrow leg`
      );
    }
    assert.ok(
      corridor - Math.max(...offsets) >= leg - EPS,
      `${width}px agent ${index + 1}: terminal leg shorter than the arrow head stand-off`
    );
  });
});

test('the compact arrow-stroke tier shrinks the rail floor', () => {
  assert.equal(
    FLOW_TOKEN_GEOMETRY.strokeWidth,
    DIAGRAM_STROKE.connector,
    'the wide train rides the standard connector stroke'
  );
  assert.equal(
    COMPACT_TOKEN_GEOMETRY.strokeWidth,
    DIAGRAM_STROKE.default,
    'the compact train rides the hairline stroke'
  );
  assert.equal(
    MIN_ARROW_LEG,
    arrowTipTrim(DIAGRAM_STROKE.connector) / MAX_TERMINAL_TRIM_RATIO
  );
  assert.equal(
    COMPACT_MIN_ARROW_LEG,
    arrowTipTrim(DIAGRAM_STROKE.default) / MAX_TERMINAL_TRIM_RATIO
  );
  assert.equal(MIN_CORRIDOR, 2 * MIN_ARROW_LEG);
  assert.equal(COMPACT_MIN_CORRIDOR, 2 * COMPACT_MIN_ARROW_LEG);
  assert.equal(
    RAIL_MIN,
    COMPACT_MIN_CORRIDOR + SPACE['1'] + COMPACT_ACTOR_SIZE
  );
  assert.ok(
    COMPACT_MIN_CORRIDOR < MIN_CORRIDOR,
    'the hairline stroke must buy a narrower corridor'
  );
});

test('the ledger is a rectangle every caller insets from its own edge alike', () => {
  // One composition: the ledger is the scene minus two equal insets, so its left
  // and right edges stay symmetric at every width — a caller's rail side must
  // never tax the ledger more than the other.
  for (const width of WIDTHS) {
    const inset = ledgerInset(width);
    const leftRootX = fanoutLayout(0, width).rootX;
    const rightRootX = fanoutLayout(1, width).rootX;
    assert.ok(
      Math.abs(Math.abs(leftRootX) - Math.abs(width - rightRootX)) < EPS,
      `${width}px: the ledger edges are not symmetric`
    );
    for (let index = 0; index < AGENT_COUNT; index += 1) {
      const { rootX } = fanoutLayout(index, width);
      const fromEdge = rootX < width / 2 ? rootX : width - rootX;
      assert.ok(
        Math.abs(fromEdge - inset) < EPS,
        `${width}px agent ${index + 1}: the ledger edge drifts from the shared inset`
      );
    }
  }
});

test('actors live on their rail side, outside the ledger', () => {
  everyRoute(({ width, index, layout }) => {
    // The actor box's edge nearest the ledger, measured out from the actor
    // centre. Multiplying by the inward direction makes both rails read alike.
    const ledgerSideEdge =
      layout.actorCenterX + layout.towardLedger * (layout.actorSize / 2);
    const clearance = layout.towardLedger * (layout.rootX - ledgerSideEdge);
    assert.ok(
      clearance >= SPACE['1'] - EPS,
      `${width}px agent ${index + 1}: the actor box crosses the ledger edge (${clearance.toFixed(2)}px)`
    );
  });
});

test('the corridor never falls below one shared elbow column', () => {
  everyRoute(({ width, index, flow }) => {
    const corridor = Math.abs(flow.robotX - flow.rootX);
    const corridorFloor =
      2 * (arrowTipTrim(flow.tokens.strokeWidth) / MAX_TERMINAL_TRIM_RATIO);
    assert.ok(
      corridor >= corridorFloor - EPS,
      `${width}px agent ${index + 1}: corridor ${corridor.toFixed(2)}px < ${corridorFloor}px`
    );
  });
});

test('the ledger inset holds the rail floor and never falls as the scene widens', () => {
  for (const width of WIDTHS) {
    assert.ok(
      ledgerInset(width) >= RAIL_MIN - EPS,
      `${width}px: the ledger inset is narrower than the rail floor`
    );
  }
  // The inset itself grows with the scene; so does the share it spends, once the
  // fixed-px rail floor stops binding (below the floor the share is just the
  // floor, which is why the raw inset/width ratio dips at the phone end).
  for (let i = 1; i < WIDTHS.length; i += 1) {
    assert.ok(
      ledgerInset(WIDTHS[i]) >= ledgerInset(WIDTHS[i - 1]) - EPS,
      `${WIDTHS[i]}px: the ledger inset shrank as the scene widened`
    );
  }
  let previousShare = -Infinity;
  for (const width of WIDTHS) {
    const inset = ledgerInset(width);
    if (inset <= RAIL_MIN + EPS) continue;
    const share = inset / width;
    assert.ok(
      share >= previousShare - EPS,
      `${width}px: the inset share fell to ${share.toFixed(3)}`
    );
    previousShare = share;
  }
});

test('the wide desk keeps the identity label while the compact floor drops it', () => {
  // One rule for every width: the label fits only where the rail measure hosts
  // the longest task line. That is the desk; the phone drops the label instead
  // of squeezing it.
  for (const width of WIDTHS) {
    const { actorSize } = fanoutScale(width);
    assert.ok(
      Math.abs(
        identityMeasure(width, actorSize) -
          (actorAnchor(width, actorSize) - actorSize / 2)
      ) < EPS,
      `${width}px: the identity measure is not the rail's own budget`
    );
    if (width >= WIDE_TIER_WIDTH) {
      assert.ok(
        identityMeasure(width, actorSize) >= IDENTITY_MEASURE - EPS,
        `${width}px: the wide rail cannot host a full identity line`
      );
    }
  }
  const floor = Math.min(...WIDTHS);
  assert.ok(
    identityMeasure(floor, fanoutScale(floor).actorSize) < IDENTITY_MEASURE,
    `${floor}px: the compact rail must drop the identity, not squeeze it`
  );
});

test('elbow columns follow the corridor: split when it fits, else one shared', () => {
  let sawShared = false;
  let sawSplit = false;
  everyRoute(({ width, index, flow, layout }) => {
    const corridor = Math.abs(flow.robotX - flow.rootX);
    const lanePitch = layout.tokens.lanePitch;
    const leg =
      arrowTipTrim(layout.tokens.strokeWidth) / MAX_TERMINAL_TRIM_RATIO;
    const split = corridor + EPS >= 2 * leg + lanePitch;
    const expected: readonly [number, number] = split
      ? [leg, leg + lanePitch]
      : [leg, leg];
    assert.deepEqual(
      layout.elbowOffsets,
      expected,
      `${width}px agent ${index + 1}: elbow columns do not follow its corridor`
    );
    if (split) sawSplit = true;
    else sawShared = true;
  });
  assert.ok(
    sawShared && sawSplit,
    'the width set must exercise both elbow shapes'
  );
});

test('the actor tier and its token geometry step together at the wide threshold', () => {
  assert.equal(fanoutScale(238).actorSize, COMPACT_ACTOR_SIZE);
  assert.equal(fanoutScale(238).tokens.size, COMPACT_TOKEN_GEOMETRY.size);
  assert.equal(fanoutScale(WIDE_TIER_WIDTH).actorSize, FLOW_ACTOR_SIZE);
  assert.equal(
    fanoutScale(WIDE_TIER_WIDTH).tokens.size,
    FLOW_TOKEN_GEOMETRY.size
  );
  assert.equal(
    COMPACT_ACTOR_SIZE,
    DIAGRAM_ICON_SIZE.secondary * 1.5,
    'the compact actor is 1.5× the --icon-md tier (phone legibility request)'
  );
});

test('the ledger reads the orchestrator context in causal order', () => {
  const rows = parentRows();
  const ids = rows.map((row) => row.id);
  // The parallel pair fires together then answers together: its dispatch rows
  // and its synthesis rows are adjacent, one causal order for every width.
  const at = ids.indexOf('dispatch-2');
  assert.deepEqual(
    ids.slice(at, at + 4),
    ['dispatch-2', 'dispatch-3', 'synthesis-2', 'synthesis-3'],
    'the parallel pair must read dispatch, dispatch, synthesis, synthesis'
  );
  // No caption or spacer row may enter the reading: the ledger is schedule rows
  // only, at every width.
  const frame = frameFrom(rows, PARENT_STACK_HEIGHT);
  const visible = rows.filter((row) => (frame.rows[row.id]?.height ?? 0) > 0);
  assert.deepEqual(
    visible.map((row) => row.id),
    rows.filter((row) => !row.spacer).map((row) => row.id),
    'the reading must contain only schedule rows'
  );
});

test('callers split the two rails by parity at every width', () => {
  for (const width of WIDTHS) {
    for (let index = 0; index < AGENT_COUNT; index += 1) {
      const expected = callerRail(index) === 'left' ? 1 : -1;
      assert.equal(
        fanoutLayout(index, width).towardLedger,
        expected,
        `width ${width}px: caller ${index + 1} drifts from callerRail`
      );
    }
  }
});

test('the actor side has a single source: callerRail', () => {
  const flowSource = readFileSync(
    new URL('./subAgentFanoutFlow.ts', import.meta.url),
    'utf8'
  );
  const tsx = readFileSync(
    new URL('./SubAgentFanoutDiagram.tsx', import.meta.url),
    'utf8'
  );
  assert.equal(
    flowSource.match(/export function callerRail\(/g)?.length,
    1,
    'callerRail must have a single definition'
  );
  assert.ok(
    tsx.includes("callerRail(index) === 'left'") &&
      tsx.includes('styles.leftWorker') &&
      tsx.includes('styles.rightWorker'),
    'the actor side must derive from callerRail'
  );
});

test('every task label fits one rail identity line', () => {
  // The rail's label measure is IDENTITY_MEASURE (the longest task line at the
  // --text-xs Argon measure, ~14 chars). The unified composition renders the
  // identity wherever that measure fits; a longer task would wrap past the rail.
  for (const [index, profile] of SUB_AGENT_PROFILES.entries()) {
    assert.ok(
      profile.task.length <= 14,
      `agent ${index + 1} task "${profile.task}" wraps the rail identity`
    );
  }
});

test('the figure keeps one source of truth for size, inset and rail geometry', () => {
  const css = readFileSync(
    new URL('./SubAgentFanoutDiagram.module.css', import.meta.url),
    'utf8'
  );
  const tsx = readFileSync(
    new URL('./SubAgentFanoutDiagram.tsx', import.meta.url),
    'utf8'
  );

  // The flow model owns the rail geometry and hands it to CSS as px variables, so
  // the DOM and the routed arrows read the same numbers.
  for (const pipe of [
    "'--fanout-ledger-inset': `${ledgerInset(width)}px`",
    "'--fanout-actor-center': `${anchor}px`",
    "'--fanout-actor-size': `${actorSize}px`",
    "'--fanout-identity-measure': `${identityMeasure(width, actorSize)}px`",
  ]) {
    assert.ok(
      tsx.includes(pipe),
      `the panel must set its rail variable from the layout: ${pipe}`
    );
  }
  // A width share must not creep back into the stylesheet: the flow model is the
  // only place that decides the rail.
  for (const mirror of [
    '--root-inset',
    '--rail-width',
    '--mobile-rail-width',
  ]) {
    assert.ok(
      !css.includes(mirror),
      `${mirror} must not mirror geometry into the stylesheet`
    );
  }
  // Paint-order regression: `.worker` must keep `z-index: 1` so the row boxes
  // (and their accents) cannot paint over an actor the way they did on phones.
  const workerStart = css.indexOf('.worker {');
  assert.ok(workerStart >= 0, '.worker missing from the module stylesheet');
  const workerBlock = css.slice(workerStart, css.indexOf('}', workerStart));
  assert.ok(
    /z-index:\s*1\b/.test(workerBlock),
    '.worker must keep z-index: 1 to outrank the row boxes'
  );
  // The unified form has no mobile-only class and no per-row rail carve.
  assert.ok(
    !/\.mobile[A-Za-z]/.test(css),
    'the unified stylesheet must not carry a .mobile* class'
  );
  assert.ok(
    !css.includes('[data-rail]') && !tsx.includes('data-rail'),
    'the per-row rail carve must be gone'
  );
  assert.equal(FLOW_TOKEN_GEOMETRY.size, DIAGRAM_TOKEN_SIZE.flow);
  assert.equal(COMPACT_TOKEN_GEOMETRY.size, DIAGRAM_TOKEN_SIZE.dense);
});

test('the stylesheet motion mirrors the schedule and stays switchable off', () => {
  const css = readFileSync(
    new URL('./SubAgentFanoutDiagram.module.css', import.meta.url),
    'utf8'
  );
  const tsx = readFileSync(
    new URL('./SubAgentFanoutDiagram.tsx', import.meta.url),
    'utf8'
  );
  // Motion mirrors: one loop, one easing token, and every beat at the phase the
  // schedule derives (SubAgentFanoutModel) instead of a hand-written number.
  const loopMs = Number(css.match(/--flow-loop:\s*(\d+)ms/)?.[1]);
  assert.equal(loopMs, FLOW_LOOP_MS);
  const delayOf = (selector: string) => {
    const escaped = selector.replace(/[.:]/g, '\\$&');
    const rules = [
      ...css.matchAll(new RegExp(`${escaped} \\{[^}]*\\}`, 'g')),
    ].map((match) => match[0]);
    const rule = rules.find((candidate) =>
      candidate.includes('animation-delay')
    );
    assert.ok(rule, `${selector} declares no animation delay`);
    return Number(rule.match(/animation-delay:\s*(\d+)ms/)?.[1]);
  };
  const beats: (readonly [string, number])[] = [
    ['.dispatchOne::after', dispatchDelayMs(0)],
    ['.returnOne::after', synthesisDelayMs(0)],
    ['.dispatchTwo::after', dispatchDelayMs(1)],
    ['.returnTwo::after', synthesisDelayMs(1)],
    ['.dispatchPair::after', dispatchDelayMs(2)],
    ['.returnPair::after', synthesisDelayMs(2)],
  ];
  for (const [selector, phase] of beats) {
    assert.equal(
      delayOf(selector),
      phase,
      `${selector} drifts from the schedule`
    );
  }
  assert.ok(
    /animation: rowPulse var\(--flow-loop\) var\(--ease-standard\) infinite/.test(
      css
    ),
    'every row beat runs one loop on a design-system easing token'
  );
  assert.ok(
    css.includes('@keyframes rowPulse') &&
      !css.includes('@keyframes workPulse') &&
      !css.includes('@keyframes dispatchPulse') &&
      !css.includes('@keyframes returnPulse') &&
      tsx.includes('arrivalBeatKeyframes('),
    'one row keyframe; the actor reuses the shared arrival beat'
  );
  assert.ok(
    /prefers-reduced-motion: reduce[\s\S]*animation: none !important/.test(css),
    'motion must stay switchable off'
  );
  for (const body of animatedKeyframes(css)) {
    for (const property of animatedProperties(body)) {
      assert.ok(
        ['opacity', 'transform', 'scale'].includes(property),
        `motion may only animate opacity/transform/scale, found ${property}`
      );
    }
  }
  // The ledger clips horizontal overflow, so the row highlight must never
  // translate: a shifted `::after` loses its leading border at the ledger edge
  // and reads as misaligned with the row it marks (the bug this guards).
  const rowPulse = animatedKeyframes(css).find((body) =>
    body.startsWith('@keyframes rowPulse')
  );
  assert.ok(rowPulse, 'rowPulse keyframe missing');
  const pulseProperties = animatedProperties(rowPulse);
  assert.ok(pulseProperties.includes('opacity'), 'the row pulse must fade');
  assert.ok(
    !pulseProperties.includes('transform'),
    'the row pulse must animate opacity only, never a transform'
  );
});

test('the ledger canvas is the rows own budget, with no spare-capacity void', () => {
  assert.equal(PARENT_STACK_HEIGHT, contentFloorHeight(parentRows()));
  for (const row of parentRows()) {
    if (!row.spacer) assert.ok((row.minHeight ?? 0) >= FLOW_ROW_MIN_HEIGHT);
  }
  const heights = Object.values(FRAME.rows).map((row) => row.height);
  for (const height of heights) assert.equal(height % DIAGRAM_HALF, 0);
  assert.equal(
    heights.reduce((sum, height) => sum + height, 0),
    PARENT_STACK_HEIGHT
  );
  assert.equal(
    FRAME.rows.headroom?.height,
    0,
    'the spare-capacity void is gone'
  );
});

test('the actor reuses the shared arrival beat, not a local keyframe', () => {
  // The actor's pulse belongs to the book's one arrival beat: this figure must
  // not hand-roll its own amplitude, nor re-time a shared class to its window.
  const css = readFileSync(
    new URL('./SubAgentFanoutDiagram.module.css', import.meta.url),
    'utf8'
  );
  const tsx = readFileSync(
    new URL('./SubAgentFanoutDiagram.tsx', import.meta.url),
    'utf8'
  );
  assert.ok(
    !css.includes('@keyframes workPulse') &&
      !css.includes('workBreatheWindow') &&
      !css.includes('--flow-work-window'),
    'no local actor pulse keyframe or window override'
  );
  assert.ok(
    tsx.includes('arrivalBeatKeyframes(') && tsx.includes('shared.arrivalBeat'),
    'the shared arrival beat is applied'
  );
  assert.ok(
    tsx.includes('animationDelay') && tsx.includes('workDelayMs(index)'),
    'each caller lands its beat on its own schedule offset'
  );
});
