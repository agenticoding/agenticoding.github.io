import assert from 'node:assert/strict';
import test from 'node:test';
import { DIAGRAM_ARROW_TIP_TRIM } from './diagramGeometryCore.ts';
import {
  ARCH_CANDIDATE_OPACITY,
  ARCH_CYCLE_MS,
  ARCH_FADE_AT_MS,
  ARCH_FADE_END_MS,
  ARCH_GAME,
  ARCH_LANES,
  ARCH_LOOP_BEATS,
  ARCH_PLY,
  ARCH_PLY_BEATS,
  ARCH_TILES,
  ARCH_WIN_AT_MS,
  ARCH_WIN_LINE,
  archTokens,
  boardGeometry,
  edgeBy,
  storeBoardGeometry,
  tilePlacement,
  desktopLayout,
  mobileLayout,
  plyStartMs,
  plyTickMs,
  travelMarkSize,
} from './ticTacToeArchitectureModel.ts';

// Refactor-stable invariants only: the loop plays a legal game that is decided
// exactly once, in order, and both layouts carry the whole cast and every lane. No
// pixel assertions — the geometry is free to move as long as the story stays intact.

// The rule of the game, stated independently of the model's own data.
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const markAt = (plies: number) => {
  const board = new Map<number, (typeof ARCH_GAME)[number]['seat']>();
  for (const turn of ARCH_GAME.slice(0, plies)) board.set(turn.cell, turn.seat);
  return board;
};

const winnerBy = (plies: number) => {
  const board = markAt(plies);
  return LINES.map((line) => {
    const seats = new Set(line.map((cell) => board.get(cell)));
    return seats.size === 1 ? [...seats][0] : undefined;
  }).find((seat) => seat !== undefined);
};

/** Every y a path command visits, so a test can prove where a connector stops.
    Handles the M/L/H/V forms the layouts use; H keeps the current y. */
const pathYs = (d: string): number[] => {
  const ys: number[] = [];
  let y = 0;
  for (const [, cmd, args] of d.matchAll(/([MLHV])\s*([-\d.\s]+)/g)) {
    const values = args
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (cmd !== 'H') y = values[values.length - 1];
    ys.push(y);
  }
  return ys;
};

test('the scripted game is legal: alternating seats, no cell played twice', () => {
  const played = new Set<number>();
  ARCH_GAME.forEach((turn, ply) => {
    assert.equal(
      turn.seat,
      ply % 2 === 0 ? 'x' : 'o',
      `turn ${ply} broke the turn order`
    );
    assert.ok(turn.cell >= 0 && turn.cell < 9, `turn ${ply} left the board`);
    assert.ok(!played.has(turn.cell), `cell ${turn.cell} was played twice`);
    played.add(turn.cell);
  });
});

test('nobody wins before the last turn, and the last turn completes the win line', () => {
  for (let plies = 1; plies < ARCH_GAME.length; plies += 1) {
    assert.equal(
      winnerBy(plies),
      undefined,
      `the game was already decided at turn ${plies}`
    );
  }
  const winner = winnerBy(ARCH_GAME.length);
  assert.equal(winner, 'x', 'the game does not end in a win');
  const board = markAt(ARCH_GAME.length);
  for (const cell of ARCH_WIN_LINE) {
    assert.equal(
      board.get(cell),
      winner,
      `cell ${cell} of the win line is not the winner's`
    );
  }
  const last = ARCH_GAME[ARCH_GAME.length - 1];
  assert.ok(
    ARCH_WIN_LINE.some((cell) => cell === last.cell),
    'the last turn does not close the win line'
  );
});

test('every turn role sits inside one turn, and the turns fill the cycle', () => {
  // The click is the cause of the move: it must be seen before the move is on the wire.
  assert.ok(
    ARCH_PLY.click < ARCH_PLY.move,
    'the move leaves before the click that caused it'
  );
  for (const beat of ARCH_PLY_BEATS) {
    assert.ok(
      beat.at >= 0 && beat.at < ARCH_CYCLE_MS,
      `${beat.id} left the turn`
    );
  }
  ARCH_GAME.forEach((_, ply) => {
    assert.ok(plyStartMs(ply) >= 0, `turn ${ply} starts before the cycle`);
    assert.ok(
      plyTickMs(ply) < ARCH_CYCLE_MS,
      `turn ${ply} ticks after the cycle`
    );
    if (ply > 0) {
      assert.ok(
        plyStartMs(ply) + ARCH_PLY.tick > plyTickMs(ply - 1),
        `turn ${ply} overlaps the previous turn`
      );
    }
  });
});

test('every message stays on its own seat lane and inside the cycle', () => {
  const tokens = archTokens();
  assert.equal(tokens.length, ARCH_GAME.length * 4, 'a turn dropped a message');
  for (const token of tokens) {
    assert.ok(
      token.startMs >= 0,
      `a ${token.edge} message starts before the cycle`
    );
    assert.ok(
      token.startMs + token.travelMs < ARCH_CYCLE_MS,
      `a ${token.edge} message outlives the cycle`
    );
  }
  ARCH_GAME.forEach((turn, ply) => {
    const start = plyStartMs(ply);
    const moved = tokens.find(
      (token) => token.startMs === start + ARCH_PLY.move
    );
    assert.equal(
      moved?.edge,
      `move-${turn.seat}`,
      `turn ${ply} left from the wrong seat`
    );
    const pushed = tokens.filter(
      (token) => token.startMs === start + ARCH_PLY.pushStart
    );
    assert.deepEqual(
      pushed.map((token) => token.edge).sort(),
      ['state-o', 'state-x'],
      `turn ${ply} did not push to both seats`
    );
    for (const token of pushed) {
      assert.equal(token.seat, turn.seat, `turn ${ply} pushed a stale mark`);
    }
    // The write is the same turn's mark, and it is on the wire before the push:
    // the log is written before the state is broadcast.
    const written = tokens.filter(
      (token) => token.startMs === start + ARCH_PLY.appendStart
    );
    assert.deepEqual(
      written.map((token) => token.edge),
      ['append'],
      `turn ${ply} dropped its write`
    );
    assert.equal(written[0].seat, turn.seat, `turn ${ply} wrote a stale mark`);
    assert.ok(
      start + ARCH_PLY.appendStart + ARCH_PLY.appendTravel <=
        start + ARCH_PLY.pushStart,
      `turn ${ply} broadcast the state before the write landed`
    );
  });
});

// The write has to land on the thing it changed: the store holds the game itself, so
// its board must be the board the seats render, and it must sit inside its own tile
// with room left for the stamp.
test("the store renders the seats' board, inside its own tile", () => {
  for (const layout of [desktopLayout(), mobileLayout()]) {
    const store = tilePlacement(layout, 'store');
    const board = storeBoardGeometry(layout);
    const seatBoard = boardGeometry(tilePlacement(layout, 'player-x'));
    assert.deepEqual(
      { cell: board.cell, gap: board.gap, size: board.size },
      { cell: seatBoard.cell, gap: seatBoard.gap, size: seatBoard.size },
      'the seats and the store would show different boards'
    );
    assert.ok(
      board.x > store.x && board.x + board.size < store.x + store.width,
      'the stored board overflows the store sideways'
    );
    assert.ok(
      board.y > store.y && board.y + board.size < store.y + store.height,
      'the stored board overflows the store'
    );
  }
});

// This figure is the deliberate exception to "end the tether ON the thing it changed":
// the write must be seen to drop into the log, but the traversal must stop at the store
// tile's TOP EDGE and never enter it (the store's own board plays the write beat).
test('the append traversal stops at the store tile, staying outside it', () => {
  for (const layout of [desktopLayout(), mobileLayout()]) {
    const server = tilePlacement(layout, 'server');
    const store = tilePlacement(layout, 'store');
    const tether = edgeBy(layout, 'append');
    const ys = pathYs(tether.d);
    assert.equal(
      ys[0],
      server.y + server.height,
      'the tether does not leave the server'
    );
    assert.ok(ys.includes(store.y), 'the tether does not reach the store');
    for (const y of ys) {
      assert.ok(
        y <= store.y,
        `the append tether enters the store tile (y ${y} > ${store.y})`
      );
    }
    // The arrowhead is drawn one tip-trim PAST the path end (`DiagramArrowMarkers`
    // refX 0). A runway shorter than twice that trim makes `trimPathEnd` cap at half
    // and the head overshoots into the tile, so the gap is part of the contract.
    assert.ok(
      store.y - (server.y + server.height) >= 2 * DIAGRAM_ARROW_TIP_TRIM,
      'the append runway is too short: the arrowhead would enter the store tile'
    );
    // The mark that rides the tether is a glyph around its path point, so its path must
    // stop half a mark ABOVE the border — otherwise the mark itself crosses it.
    const markYs = pathYs(tether.tokenD ?? tether.d);
    assert.ok(
      Math.max(...markYs) + travelMarkSize(layout) / 2 <= store.y,
      'the append mark would cross into the store tile'
    );
  }
});

test('the local candidate precedes the authoritative write, which precedes the ack', () => {
  // The seat renders its own move the moment the hand lands, but only the server's
  // push makes it final: candidate -> store write -> ack. If the store ever lands
  // before the candidate, the figure would claim the client waited for the server.
  assert.ok(
    ARCH_PLY.press < ARCH_PLY.log,
    'the candidate is not placed before the store writes'
  );
  assert.ok(
    ARCH_PLY.log < ARCH_PLY.tick,
    'the ack cements before the store holds the truth'
  );
  assert.equal(
    ARCH_PLY.tick,
    ARCH_PLY.pushStart + ARCH_PLY.travel,
    'the ack is not the push landing'
  );
  assert.ok(
    ARCH_CANDIDATE_OPACITY > 0 && ARCH_CANDIDATE_OPACITY < 1,
    'a candidate must be provisional'
  );
});

test('the win beats after the last turn and the fade clears the board before the loop restarts', () => {
  const lastTick = plyTickMs(ARCH_GAME.length - 1);
  assert.ok(ARCH_WIN_AT_MS > lastTick, 'the win lands before the last turn');
  assert.ok(
    ARCH_FADE_AT_MS > ARCH_WIN_AT_MS,
    'the board clears before the win is read'
  );
  assert.ok(
    ARCH_FADE_END_MS < ARCH_CYCLE_MS,
    'the board is still clearing when the loop restarts'
  );
  let previous = 0;
  for (const beat of ARCH_LOOP_BEATS) {
    assert.ok(beat.at >= previous, `${beat.id} runs backwards`);
    previous = beat.at;
  }
});

test('each layout yields all four tiles and both lanes', () => {
  const tileIds = ARCH_TILES.map((tile) => tile.id).sort();
  for (const layout of [desktopLayout(), mobileLayout()]) {
    assert.deepEqual(
      layout.tiles.map((tile) => tile.id).sort(),
      tileIds,
      'a layout dropped a tile'
    );
    const lanes = new Set(
      layout.edges.flatMap((edge) => (edge.lane ? [edge.lane] : []))
    );
    for (const lane of ARCH_LANES) {
      assert.ok(lanes.has(lane.id), `a layout dropped the ${lane.id} lane`);
    }
    // Every seat owns one lane in each direction.
    const edges = layout.edges.map((edge) => edge.id);
    for (const id of ['move-x', 'move-o', 'state-x', 'state-o'] as const) {
      assert.ok(edges.includes(id), `a layout dropped the ${id} edge`);
    }
  }
});

// The user-facing contract: the two seats read as two different people, so the figure
// is a game between players, not two identical boxes.
test('the two seats carry a distinct human avatar each', () => {
  const seats = ARCH_TILES.filter((tile) => tile.id.startsWith('player-'));
  assert.equal(seats.length, 2, 'the figure is not a two-player game');
  for (const seat of seats) {
    assert.ok(seat.avatar, `${seat.id} has no avatar`);
  }
  assert.notEqual(
    seats[0].avatar,
    seats[1].avatar,
    'both seats show the same person'
  );
});
