#!/usr/bin/env node
/**
 * Compute geometrically correct, symmetric arc paths for ExecutionLoopDiagram.
 *
 * Node rects (all 48×48, rx=12):
 *   Brain:   x=216 y=32   → center (240, 56)
 *   Execute: x=312 y=152  → center (336, 176)
 *   Observe: x=120 y=152  → center (144, 176)
 *
 * Triangle is isoceles: Brain at top-center, Execute/Observe symmetric at bottom.
 *
 * Arc endpoints are pinned to edge-center coordinates (not ray-intersection),
 * so diagonal arcs exit/enter at the midpoint of the respective face.
 */

const BULGE  = 44;  // perpendicular offset toward triangle exterior
const REF_X  = 5;   // arrowhead tip retraction distance (px along arrival tangent)

// ── Edge-center attachment points ────────────────────────────────────────────
// Each arc is defined by the center of the source edge it exits from
// and the center of the destination edge it enters into.

const EDGES = {
  brain:   { bottom: { x: 240, y: 80  }, right: { x: 264, y: 56 }, left: { x: 216, y: 56 } },
  execute: { top:    { x: 336, y: 152 }, left: { x: 312, y: 176 } },
  observe: { top:    { x: 144, y: 152 }, right: { x: 168, y: 176 } },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function unitVec(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  return { x: dx / len, y: dy / len };
}

/** Perpendicular (CCW rotation 90°) of a unit vector. */
function perp(u) {
  return { x: -u.y, y: u.x };
}

function r2(v) { return Math.round(v * 100) / 100; }

// ── Arc computation ───────────────────────────────────────────────────────────

/**
 * Compute a quadratic Bezier arc between two explicit edge-center points.
 *
 * @param exitPt  - source attachment point (edge center on source box)
 * @param entryPt - destination attachment point (edge center on dest box)
 * @param bulgeSign - +1 or -1, which side to bulge toward
 */
function computeArc(exitPt, entryPt, bulgeSign) {
  const dir = unitVec(exitPt, entryPt);
  const p   = perp(dir);

  // Chord midpoint
  const mid = {
    x: (exitPt.x + entryPt.x) / 2,
    y: (exitPt.y + entryPt.y) / 2,
  };

  // Control point: chord midpoint offset perpendicularly toward exterior
  const ctrl = {
    x: mid.x + bulgeSign * BULGE * p.x,
    y: mid.y + bulgeSign * BULGE * p.y,
  };

  // Tangent at t=1 of quadratic Bezier = direction from ctrl to entryPt
  const arrivalDir = unitVec(ctrl, entryPt);
  const arrivalAngleDeg = Math.atan2(arrivalDir.y, arrivalDir.x) * 180 / Math.PI;

  // Retract path endpoint along arrival tangent by REF_X — no grid snap
  const retracted = {
    x: entryPt.x - arrivalDir.x * REF_X,
    y: entryPt.y - arrivalDir.y * REF_X,
  };

  return {
    d:            `M ${exitPt.x} ${exitPt.y} Q ${r2(ctrl.x)} ${r2(ctrl.y)} ${r2(retracted.x)} ${r2(retracted.y)}`,
    exitPt,
    ctrl:         { x: r2(ctrl.x),      y: r2(ctrl.y)      },
    retractedEnd: { x: r2(retracted.x), y: r2(retracted.y) },
    arrowTip:     entryPt,   // un-retracted edge center, for <polygon> tip placement
    arrivalAngle: arrivalAngleDeg,
  };
}

// ── Bulge sign ────────────────────────────────────────────────────────────────

// Centroid of the three node centers:
const centroid = {
  x: (240 + 336 + 144) / 3,
  y: ( 56 + 176 + 176) / 3,
};

/**
 * Determine bulge sign so the control point is pushed toward the exterior
 * of the triangle (away from centroid).
 */
function exteriorBulgeSign(exit, entry) {
  const dir  = unitVec(exit, entry);
  const p    = perp(dir);
  const mid  = { x: (exit.x + entry.x) / 2, y: (exit.y + entry.y) / 2 };
  const toMid = { x: mid.x - centroid.x, y: mid.y - centroid.y };
  return (p.x * toMid.x + p.y * toMid.y) >= 0 ? 1 : -1;
}

// ── Emoji centering ───────────────────────────────────────────────────────────

const NODES = {
  brain:   { x: 216, y:  32, w: 48, h: 48 },
  execute: { x: 312, y: 152, w: 48, h: 48 },
  observe: { x: 120, y: 152, w: 48, h: 48 },
};

function emojiPos(node, emojiSize = 40) {
  const pad = (node.w - emojiSize) / 2;
  return { x: node.x + pad, y: node.y + pad };
}

// ── Main ──────────────────────────────────────────────────────────────────────

const E = EDGES;

const arc1Sign = exteriorBulgeSign(E.brain.right,    E.execute.top);
const arc2Sign = exteriorBulgeSign(E.execute.left,   E.observe.right);
const arc3Sign = exteriorBulgeSign(E.observe.top,    E.brain.left);

const arc1 = computeArc(E.brain.right,    E.execute.top,    arc1Sign);
const arc2 = computeArc(E.execute.left,   E.observe.right,  arc2Sign);
const arc3 = computeArc(E.observe.top,    E.brain.left,     arc3Sign);

console.log('=== ExecutionLoopDiagram Arc Computation ===\n');
console.log(`Centroid: (${centroid.x.toFixed(1)}, ${centroid.y.toFixed(1)})\n`);

for (const [label, arc] of [['Arc 1: brain → execute', arc1], ['Arc 2: execute → observe', arc2], ['Arc 3: observe → brain', arc3]]) {
  console.log(`── ${label} ${'─'.repeat(Math.max(0, 43 - label.length))}`);
  console.log(`  d="${arc.d}"`);
  console.log(`  exit:         (${arc.exitPt.x}, ${arc.exitPt.y})`);
  console.log(`  ctrl:         (${arc.ctrl.x}, ${arc.ctrl.y})`);
  console.log(`  retractedEnd: (${arc.retractedEnd.x}, ${arc.retractedEnd.y})`);
  console.log(`  arrowTip:     (${arc.arrowTip.x}, ${arc.arrowTip.y})   angle: ${arc.arrivalAngle.toFixed(2)}°   rotate: ${Math.round(arc.arrivalAngle)}`);
  console.log();
}

console.log('── Emoji positions (size=40) ─────────────────────────');
const brainEmoji   = emojiPos(NODES.brain);
const executeEmoji = emojiPos(NODES.execute);
const observeEmoji = emojiPos(NODES.observe);
console.log(`  Brain:   x=${brainEmoji.x}   y=${brainEmoji.y}`);
console.log(`  Execute: x=${executeEmoji.x} y=${executeEmoji.y}`);
console.log(`  Observe: x=${observeEmoji.x} y=${observeEmoji.y}`);
console.log();

console.log('── Summary (copy into TSX) ──────────────────────────');
console.log(`  d="${arc1.d}"   // brain → execute`);
console.log(`  d="${arc2.d}"   // execute → observe`);
console.log(`  d="${arc3.d}"   // observe → brain`);
console.log();
console.log(`  translate(${arc1.arrowTip.x},${arc1.arrowTip.y}) rotate(${Math.round(arc1.arrivalAngle)})   // arc1 arrowhead`);
console.log(`  translate(${arc2.arrowTip.x},${arc2.arrowTip.y}) rotate(${Math.round(arc2.arrivalAngle)})   // arc2 arrowhead`);
console.log(`  translate(${arc3.arrowTip.x},${arc3.arrowTip.y}) rotate(${Math.round(arc3.arrivalAngle)})    // arc3 arrowhead`);
