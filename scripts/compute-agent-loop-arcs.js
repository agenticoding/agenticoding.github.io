#!/usr/bin/env node
/**
 * Compute geometrically correct arc paths for AgentLoopDiagram (pentagon orbit).
 *
 * Pentagon: 5 nodes clockwise from top (Perceive, Reason, Act, Observe, Verify).
 * Center: (270, 185)  Radius: 110  ViewBox: 0 0 520 352
 *
 * Arc attachment points (face-center style, same as compute-execution-loop-arcs.js):
 *   Arc 1 Perceive.right  → Reason.top     (clockwise)
 *   Arc 2 Reason.bottom   → Act.top        (clockwise)
 *   Arc 3 Act.left        → Observe.right  (clockwise)
 *   Arc 4 Observe.top     → Verify.bottom  (clockwise)
 *   Arc 5 Verify.top      → Perceive.left  (iterate / "No")
 *   Exit  Verify.left     → Done.top-face  (curved Bézier / "Yes")
 */

const BULGE = 30;   // perpendicular offset toward pentagon exterior
const REF_X = 5;   // arrowhead tip retraction (px along arrival tangent)

const CX = 270, CY = 185, R = 110;  // pentagon center & radius
const toRad = deg => deg * Math.PI / 180;

// Pentagon vertex angles in degrees, clockwise from top
const ANGLES = [-90, -18, 54, 126, 198];
const NAMES  = ['perceive', 'reason', 'act', 'observe', 'verify'];

// Compute node centers (rounded to nearest integer for clean coords)
const centers = ANGLES.map(a => ({
  x: Math.round(CX + R * Math.cos(toRad(a))),
  y: Math.round(CY + R * Math.sin(toRad(a))),
}));

// Face centers for each 48×48 node box (centered on node center)
function faces(i) {
  const { x, y } = centers[i];
  return {
    top:    { x,      y: y - 24 },
    bottom: { x,      y: y + 24 },
    left:   { x: x - 24, y },
    right:  { x: x + 24, y },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function unitVec(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  return { x: dx / len, y: dy / len };
}

/** Perpendicular (CCW 90°) of a unit vector. */
function perp(u) { return { x: -u.y, y: u.x }; }

function r2(v) { return Math.round(v * 100) / 100; }

// ── Arc computation ───────────────────────────────────────────────────────────

function computeArc(exitPt, entryPt, bulgeSign) {
  const dir = unitVec(exitPt, entryPt);
  const p   = perp(dir);
  const mid = { x: (exitPt.x + entryPt.x) / 2, y: (exitPt.y + entryPt.y) / 2 };

  const ctrl = {
    x: mid.x + bulgeSign * BULGE * p.x,
    y: mid.y + bulgeSign * BULGE * p.y,
  };

  const arrivalDir      = unitVec(ctrl, entryPt);
  const arrivalAngleDeg = Math.atan2(arrivalDir.y, arrivalDir.x) * 180 / Math.PI;

  const retracted = {
    x: entryPt.x - arrivalDir.x * REF_X,
    y: entryPt.y - arrivalDir.y * REF_X,
  };

  return {
    d:            `M ${exitPt.x} ${exitPt.y} Q ${r2(ctrl.x)} ${r2(ctrl.y)} ${r2(retracted.x)} ${r2(retracted.y)}`,
    exitPt,
    ctrl:         { x: r2(ctrl.x),      y: r2(ctrl.y)      },
    retractedEnd: { x: r2(retracted.x), y: r2(retracted.y) },
    arrowTip:     entryPt,
    arrivalAngle: arrivalAngleDeg,
  };
}

// Pentagon centroid (used for exterior-bulge direction)
const centroid = { x: CX, y: CY };

function exteriorBulgeSign(exit, entry) {
  const dir  = unitVec(exit, entry);
  const p    = perp(dir);
  const mid  = { x: (exit.x + entry.x) / 2, y: (exit.y + entry.y) / 2 };
  const toMid = { x: mid.x - centroid.x, y: mid.y - centroid.y };
  return (p.x * toMid.x + p.y * toMid.y) >= 0 ? 1 : -1;
}

// ── Define attachment points ──────────────────────────────────────────────────

const F = [0, 1, 2, 3, 4].map(faces);  // F[i] = faces of node i

// Arc 1: Perceive.right → Reason.top
const arc1 = computeArc(F[0].right, F[1].top,    exteriorBulgeSign(F[0].right, F[1].top));
// Arc 2: Reason.bottom → Act.top
const arc2 = computeArc(F[1].bottom, F[2].top,   exteriorBulgeSign(F[1].bottom, F[2].top));
// Arc 3: Act.left → Observe.right
const arc3 = computeArc(F[2].left, F[3].right,   exteriorBulgeSign(F[2].left, F[3].right));
// Arc 4: Observe.top → Verify.bottom
const arc4 = computeArc(F[3].top, F[4].bottom,   exteriorBulgeSign(F[3].top, F[4].bottom));
// Arc 5: Verify.top → Perceive.left (iterate)
const arc5 = computeArc(F[4].top, F[0].left,     exteriorBulgeSign(F[4].top, F[0].left));

// Done node: 48×48 squircle at center=(96,264)  (below-left of verify, grid-snapped to 8px)
const DONE_S = 48, DONE_CX = 96, DONE_CY = 264;
const doneFaces = {
  top:    { x: DONE_CX,          y: DONE_CY - DONE_S / 2 },
  bottom: { x: DONE_CX,          y: DONE_CY + DONE_S / 2 },
  left:   { x: DONE_CX - DONE_S / 2, y: DONE_CY },
  right:  { x: DONE_CX + DONE_S / 2, y: DONE_CY },
};
const arcExit = computeArc(F[4].left, doneFaces.top, exteriorBulgeSign(F[4].left, doneFaces.top));

/** Quadratic Bézier point at parameter t. */
function bezierPt(p0, p1, p2, t) {
  const mt = 1 - t;
  return { x: mt*mt*p0.x + 2*mt*t*p1.x + t*t*p2.x, y: mt*mt*p0.y + 2*mt*t*p1.y + t*t*p2.y };
}
// Bézier midpoint at t=0.4 (for "Yes" label placement, offset toward interior)
const exitMid = bezierPt(F[4].left, arcExit.ctrl, doneFaces.top, 0.4);

// ── Emoji positions (40×40 in 48×48 box, pad=4) ──────────────────────────────

function emojiPos(i) {
  const c = centers[i];
  return { x: c.x - 24 + 4, y: c.y - 24 + 4 };  // pad = (48-40)/2 = 4
}

// ── Label positions (radially outward, r + 38 from pentagon center) ───────────

const LABEL_R = R + 42;  // node center radius + half-node + gap + text height

function labelPos(i) {
  const angle = toRad(ANGLES[i]);
  return {
    x: r2(CX + LABEL_R * Math.cos(angle)),
    y: r2(CY + LABEL_R * Math.sin(angle)),
  };
}

// ── Output ────────────────────────────────────────────────────────────────────

console.log('=== AgentLoopDiagram Arc Computation ===\n');
console.log(`Pentagon center: (${CX}, ${CY})  radius: ${R}\n`);

console.log('── Node centers & rects ──────────────────────────────');
centers.forEach((c, i) => {
  console.log(`  ${NAMES[i].padEnd(8)}: center=(${c.x},${c.y})  rect x=${c.x-24} y=${c.y-24}`);
});
console.log();

for (const [label, arc] of [
  ['Arc 1: perceive → reason', arc1],
  ['Arc 2: reason → act',      arc2],
  ['Arc 3: act → observe',     arc3],
  ['Arc 4: observe → verify',  arc4],
  ['Arc 5: verify → perceive (iterate)', arc5],
]) {
  console.log(`── ${label} ${'─'.repeat(Math.max(0, 44 - label.length))}`);
  console.log(`  d="${arc.d}"`);
  console.log(`  ctrl:         (${arc.ctrl.x}, ${arc.ctrl.y})`);
  console.log(`  retractedEnd: (${arc.retractedEnd.x}, ${arc.retractedEnd.y})`);
  console.log(`  arrowTip:     (${arc.arrowTip.x}, ${arc.arrowTip.y})   angle: ${arc.arrivalAngle.toFixed(2)}°   rotate: ${Math.round(arc.arrivalAngle)}`);
  console.log();
}

console.log('── Exit arc: verify → done ──────────────────────────────');
console.log(`  Done rect: x=${DONE_CX - DONE_S/2} y=${DONE_CY - DONE_S/2} w=${DONE_S} h=${DONE_S}  top-face=(${doneFaces.top.x},${doneFaces.top.y})`);
console.log(`  d="${arcExit.d}"`);
console.log(`  ctrl:         (${arcExit.ctrl.x}, ${arcExit.ctrl.y})`);
console.log(`  retractedEnd: (${arcExit.retractedEnd.x}, ${arcExit.retractedEnd.y})`);
console.log(`  arrowTip: (${arcExit.arrowTip.x}, ${arcExit.arrowTip.y})   rotate: ${Math.round(arcExit.arrivalAngle)}`);
console.log(`  Bézier midpoint t=0.4: (${r2(exitMid.x)}, ${r2(exitMid.y)})  →  "Yes" label ≈ (${r2(exitMid.x + 12)}, ${r2(exitMid.y)})`);
console.log();

console.log('── Emoji positions (size=40) ─────────────────────────');
centers.forEach((_, i) => {
  const ep = emojiPos(i);
  console.log(`  ${NAMES[i].padEnd(8)}: x=${ep.x}  y=${ep.y}`);
});
console.log();

console.log('── Label positions ────────────────────────────────────');
centers.forEach((_, i) => {
  const lp = labelPos(i);
  console.log(`  ${NAMES[i].padEnd(8)}: x=${lp.x}  y=${lp.y}`);
});
console.log();

console.log('── Summary (copy into TSX) ──────────────────────────');
console.log(`  // Arc paths`);
[arc1, arc2, arc3, arc4, arc5].forEach((arc, i) => {
  console.log(`  /* arc ${i+1} */ d="${arc.d}"`);
});
console.log(`  /* exit */ d="${arcExit.d}"`);
console.log();
console.log(`  // Arrowhead transforms`);
[arc1, arc2, arc3, arc4, arc5].forEach((arc, i) => {
  console.log(`  /* arc ${i+1} */ translate(${arc.arrowTip.x},${arc.arrowTip.y}) rotate(${Math.round(arc.arrivalAngle)})`);
});
console.log(`  /* exit */ translate(${arcExit.arrowTip.x},${arcExit.arrowTip.y}) rotate(${Math.round(arcExit.arrivalAngle)})`);
console.log();
console.log(`  // Node rects`);
centers.forEach((c, i) => {
  console.log(`  /* ${NAMES[i].padEnd(8)} */ x={${c.x-24}} y={${c.y-24}} width={48} height={48}`);
});
console.log(`  /* done      */ x={${DONE_CX - DONE_S/2}} y={${DONE_CY - DONE_S/2}} width={${DONE_S}} height={${DONE_S}}  (EmojiImage x={${DONE_CX - DONE_S/2 + 4}} y={${DONE_CY - DONE_S/2 + 4}} size={40})`);
