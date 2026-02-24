#!/usr/bin/env node
// scripts/compute-actor-coords.js
// Source of truth for all actor primitive geometry.
// Run: node scripts/compute-actor-coords.js

function round2(v) { return Math.round(v * 100) / 100; }

// ── OperatorNode ──────────────────────────────────────────────────────────────
// Shape essence traced from 🧑 (U+1F9D1, gender-free Person emoji).
// Head: large circle (20% of BB). Body: smooth cubic Bezier bust silhouette
// converging at the neck point — no legs, Smooth Circuit throughout.
function computeOperator(S) {
  // Head — emoji-proportioned (larger than stick-figure 15%)
  const HEAD_R  = round2(S * 0.200);
  const HEAD_CX = round2(S * 0.500);
  const HEAD_CY = round2(HEAD_R + S * 0.025);   // 1px top margin at S=40

  // Neck: bottom tangent of head circle
  const NECK_Y  = round2(HEAD_CY + HEAD_R);

  // Body bounding edges
  const INSET   = round2(S * 0.050);            // 2px at S=40
  const BL      = INSET;                        // body left x
  const BR      = round2(S - INSET);            // body right x
  const BOTY    = S;                            // body bottom = full BB height

  // Cubic Bezier control points for the shoulder sweep
  // CP1: keeps the tangent vertical at the bottom edge (stays on the side wall)
  // CP2: arrives at the neck from the shoulder angle
  const CP1Y    = round2(NECK_Y + (BOTY - NECK_Y) * 0.55);
  const CP2X    = round2(HEAD_CX - S * 0.200);  // 8px left of center at S=40

  // Closed bust silhouette: M BL BOTY  C BL CP1Y, CP2X NECK_Y, CX NECK_Y
  //                                    C (CX+CP2_offset) NECK_Y, BR CP1Y, BR BOTY  Z
  const CP2XR   = round2(HEAD_CX + (HEAD_CX - CP2X));  // mirror
  const bodyPath =
    `M ${BL} ${BOTY}` +
    ` C ${BL} ${CP1Y}, ${CP2X} ${NECK_Y}, ${HEAD_CX} ${NECK_Y}` +
    ` C ${CP2XR} ${NECK_Y}, ${BR} ${CP1Y}, ${BR} ${BOTY}` +
    ` Z`;

  return { S, HEAD_R, HEAD_CX, HEAD_CY, NECK_Y, BL, BR, BOTY, CP1Y, CP2X, CP2XR, bodyPath };
}

// ── AgentNode ─────────────────────────────────────────────────────────────────
function computeAgent(S) {
  const HEAD_X  = round2(S * 0.075);
  const HEAD_Y  = round2(S * 0.075);
  const HEAD_W  = round2(S * 0.85);
  const HEAD_H  = round2(S * 0.85);
  const HEAD_RX = round2(HEAD_W * 0.25);
  const EYE_R   = round2(S * 0.075);
  const EYE_Y   = round2(HEAD_Y + HEAD_H * 0.38);
  const EYE_LX  = round2(HEAD_X + HEAD_W * 0.28);
  const EYE_RX  = round2(HEAD_X + HEAD_W * 0.72);
  const MOUTH_X = round2(HEAD_X + HEAD_W * 0.12);
  const MOUTH_Y = round2(HEAD_Y + HEAD_H * 0.65);
  const MOUTH_W = round2(HEAD_W * 0.76);
  const MOUTH_H = round2(HEAD_H * 0.16);
  const DIVIDER_0 = round2(MOUTH_X + MOUTH_W * 0.33);
  const DIVIDER_1 = round2(MOUTH_X + MOUTH_W * 0.66);

  return {
    S,
    HEAD_X, HEAD_Y, HEAD_W, HEAD_H, HEAD_RX,
    EYE_R, EYE_Y, EYE_LX, EYE_RX,
    MOUTH_X, MOUTH_Y, MOUTH_W, MOUTH_H,
    DIVIDERS: [DIVIDER_0, DIVIDER_1],
  };
}

// ── PromptCard ─────────────────────────────────────────────────────────────────
function computePromptCard() {
  const W = 72, H = 40, bodyH = 34, rx = 8;
  const STUBS = [
    { y: 8,  w: 44 },
    { y: 16, w: 36 },
    { y: 24, w: 28 },
  ];
  const stubH = 2, stubX = 10, stubRx = 1;
  const tailPoints = '8 34, 16 34, 8 40';

  return { W, H, bodyH, rx, STUBS, stubH, stubX, stubRx, tailPoints };
}

// ── PromptBubble (40×18 body + cubic Bezier tail, total 40×26) ─────────────────
// Shape essence traced from 💬 (Speech Bubble emoji).
// Body: rounded rect W=40, H=18, rx=9. Tail: cubic Bezier at lower-left.
// Total height including tail: 26px. Cursor bar at x=23 signals active authoring.
function computePromptBubble() {
  const W = 40, H = 18, rx = 9;
  // Tail: cubic Bezier emerging from body bottom-left, tip at (0, 26)
  const tailPath = 'M 8 18 C 4 20, 0 24, 0 26 C 4 20, 12 18, 14 18 Z';
  const stubs = [
    { x: 8, y: 6,  w: 20, h: 2, rx: 1 },
    { x: 8, y: 11, w: 14, h: 2, rx: 1 },
  ];
  const cursor = { x: 23, y: 9, w: 2, h: 6, rx: 1 };
  const totalH = 26;  // body H + tail depth

  return { W, H, rx, tailPath, stubs, cursor, totalH };
}

// ── TravelingPromptCard (36×20, centered at 0,0 for animateMotion) ────────────
function computeTravelingCard() {
  const W = 36, H = 20, rx = 8;
  const bodyX = -W / 2, bodyY = -H / 2;          // -18, -10
  const stub1W = Math.round(W * 0.50);             // 18
  const stub2W = Math.round(W * 0.33);             // 12
  const stub1X = -stub1W / 2;                      // -9
  const stub2X = -stub2W / 2;                      // -6
  const stub1Y = Math.round(-H / 2 + H * 0.30);   // -4
  const stub2Y = Math.round(-H / 2 + H * 0.60);   //  2
  return { W, H, rx, bodyX, bodyY,
    stubs: [
      { x: stub1X, y: stub1Y, w: stub1W, h: 2, rx: 1 },
      { x: stub2X, y: stub2Y, w: stub2W, h: 2, rx: 1 },
    ],
  };
}

// ── IntroHookDiagram arc (v2) ──────────────────────────────────────────────────
// New arc: operator right shoulder → agent left edge (no card intermediary).
// Operator BB at x=90/y=80, size=40 → right shoulder ≈ x=128, y=100
// Agent BB at x=370/y=80 → left edge x=370, y=100
// Control point Q(229, 42): bows 58px above chord midpoint
// Bubble placed at t=0.35 on arc, top-left = (point_x - 20, point_y - 13)
function computeIntroArc() {
  const x0 = 128, y0 = 100;  // operator right shoulder
  const cpx = 229, cpy = 42;  // control point: 58px above chord
  const x1 = 370, y1 = 100;  // agent BB left edge, mid

  // Bubble placement at t=0.35
  const t = 0.35, nt = 1 - t;
  const bubblePtX = round2(nt * nt * x0 + 2 * nt * t * cpx + t * t * x1);
  const bubblePtY = round2(nt * nt * y0 + 2 * nt * t * cpy + t * t * y1);
  // top-left of 40×26 bubble centered on arc point
  const bubbleX = round2(bubblePtX - 20);  // W/2 = 20
  const bubbleY = round2(bubblePtY - 13);  // totalH/2 = 13

  // Numerically integrate quadratic bezier length
  const N = 1000;
  let len = 0;
  let px = x0, py = y0;
  for (let i = 1; i <= N; i++) {
    const ti = i / N;
    const nti = 1 - ti;
    const qx = nti * nti * x0 + 2 * nti * ti * cpx + ti * ti * x1;
    const qy = nti * nti * y0 + 2 * nti * ti * cpy + ti * ti * y1;
    const dx = qx - px, dy = qy - py;
    len += Math.sqrt(dx * dx + dy * dy);
    px = qx; py = qy;
  }
  len = Math.ceil(len);

  return {
    x0, y0, cpx, cpy, x1, y1,
    d: `M ${x0} ${y0} Q ${cpx} ${cpy} ${x1} ${y1}`,
    len,
    bubbleX, bubbleY, bubblePtX, bubblePtY,
  };
}

// ── AgentOrchestrationDiagram connectors ─────────────────────────────────────
function computeOrchestrationConnectors() {
  // Operator center: (280, 36)   BB: x=260 y=16 size=40  → bottom center y=56
  // Orchestrator BB: x=260 y=96  → top center y=96, bottom center y=136
  const vertD = 'M 280 56 L 280 96';
  const vertLen = 40;

  // Fan arcs from orchestrator bottom center (280, 136) to worker top centers
  // Worker 1 center: (112, 220)  BB top: 200
  // Worker 2 center: (280, 220)  BB top: 200
  // Worker 3 center: (448, 220)  BB top: 200

  // Arc to Worker 1: Q with control point
  const arc1 = { d: 'M 280 136 Q 196 168 112 200' };
  const arc2 = { d: 'M 280 136 L 280 200' };
  const arc3 = { d: 'M 280 136 Q 364 168 448 200' };

  // Compute arc1 length
  function quadBezierLen(x0, y0, cpx, cpy, x1, y1) {
    const N = 1000;
    let len = 0, px = x0, py = y0;
    for (let i = 1; i <= N; i++) {
      const t = i / N, nt = 1 - t;
      const qx = nt*nt*x0 + 2*nt*t*cpx + t*t*x1;
      const qy = nt*nt*y0 + 2*nt*t*cpy + t*t*y1;
      len += Math.sqrt((qx-px)**2 + (qy-py)**2);
      px=qx; py=qy;
    }
    return Math.ceil(len);
  }

  arc1.len = quadBezierLen(280, 136, 196, 168, 112, 200);
  arc2.len = 64;  // straight line
  arc3.len = quadBezierLen(280, 136, 364, 168, 448, 200);

  return { vertD, vertLen, arc1, arc2, arc3 };
}

// ── IdeaIcon ─────────────────────────────────────────────────────────────────
// Shape essence traced from 💡 (Lightbulb emoji).
// Globe: smooth circle (Smooth Circuit), positive valence.
// Base cap: slightly rounded rect (low Terminal Geometry for mechanical terminal).
function computeIdeaIcon(S) {
  const GLOBE_R  = round2(S * 0.375);          // 12px at S=32
  const GLOBE_CX = round2(S * 0.500);          // centered horizontally
  const GLOBE_CY = round2(GLOBE_R + 2);        // 14px at S=32 (2px top margin)
  const CAP_W    = round2(S * 0.375);          // 12px at S=32
  const CAP_H    = round2(S * 0.125);          // 4px at S=32
  const CAP_X    = round2(GLOBE_CX - CAP_W / 2);  // 10px at S=32
  const CAP_Y    = round2(GLOBE_CY + GLOBE_R + 1); // 27px at S=32 (1px gap below globe)
  return { S, GLOBE_R, GLOBE_CX, GLOBE_CY, CAP_W, CAP_H, CAP_X, CAP_Y };
}

// ── Output ─────────────────────────────────────────────────────────────────────
const IDEA32 = computeIdeaIcon(32);
const OP40   = computeOperator(40);
const OP32   = computeOperator(32);
const AG40   = computeAgent(40);
const AG32   = computeAgent(32);
const AG14   = computeAgent(14);
const CARD   = computePromptCard();
const BUBBLE = computePromptBubble();
const TCARD  = computeTravelingCard();
const ARC    = computeIntroArc();
const ORCH   = computeOrchestrationConnectors();

console.log('// ── OperatorNode S=40 ──');
console.log(`const OP_40 = {`);
console.log(`  headCx: ${OP40.HEAD_CX}, headCy: ${OP40.HEAD_CY}, headR: ${OP40.HEAD_R},`);
console.log(`  bodyPath: '${OP40.bodyPath}',`);
console.log(`} as const;`);
console.log('');

console.log('// ── OperatorNode S=32 ──');
console.log(`const OP_32 = {`);
console.log(`  headCx: ${OP32.HEAD_CX}, headCy: ${OP32.HEAD_CY}, headR: ${OP32.HEAD_R},`);
console.log(`  bodyPath: '${OP32.bodyPath}',`);
console.log(`} as const;`);
console.log('');

console.log('// ── AgentNode S=40 ──');
console.log(`const AGENT_40 = {`);
console.log(`  headX: ${AG40.HEAD_X}, headY: ${AG40.HEAD_Y}, headW: ${AG40.HEAD_W}, headH: ${AG40.HEAD_H}, headRx: ${AG40.HEAD_RX},`);
console.log(`  eyeR: ${AG40.EYE_R}, eyeY: ${AG40.EYE_Y}, eyeLx: ${AG40.EYE_LX}, eyeRx: ${AG40.EYE_RX},`);
console.log(`  mouthX: ${AG40.MOUTH_X}, mouthY: ${AG40.MOUTH_Y}, mouthW: ${AG40.MOUTH_W}, mouthH: ${AG40.MOUTH_H},`);
console.log(`  dividers: [${AG40.DIVIDERS.join(', ')}] as const,`);
console.log(`} as const;`);
console.log('');

console.log('// ── AgentNode S=32 ──');
console.log(`const AGENT_32 = {`);
console.log(`  headX: ${AG32.HEAD_X}, headY: ${AG32.HEAD_Y}, headW: ${AG32.HEAD_W}, headH: ${AG32.HEAD_H}, headRx: ${AG32.HEAD_RX},`);
console.log(`  eyeR: ${AG32.EYE_R}, eyeY: ${AG32.EYE_Y}, eyeLx: ${AG32.EYE_LX}, eyeRx: ${AG32.EYE_RX},`);
console.log(`  mouthX: ${AG32.MOUTH_X}, mouthY: ${AG32.MOUTH_Y}, mouthW: ${AG32.MOUTH_W}, mouthH: ${AG32.MOUTH_H},`);
console.log(`  dividers: [${AG32.DIVIDERS.join(', ')}] as const,`);
console.log(`} as const;`);
console.log('');

console.log('// ── AgentNode S=14 ──');
console.log(`const AGENT_14 = {`);
console.log(`  headX: ${AG14.HEAD_X}, headY: ${AG14.HEAD_Y}, headW: ${AG14.HEAD_W}, headH: ${AG14.HEAD_H}, headRx: ${AG14.HEAD_RX},`);
console.log(`  eyeR: ${AG14.EYE_R}, eyeY: ${AG14.EYE_Y}, eyeLx: ${AG14.EYE_LX}, eyeRx: ${AG14.EYE_RX},`);
console.log(`  mouthX: ${AG14.MOUTH_X}, mouthY: ${AG14.MOUTH_Y}, mouthW: ${AG14.MOUTH_W}, mouthH: ${AG14.MOUTH_H},`);
console.log(`  dividers: [${AG14.DIVIDERS.join(', ')}] as const,`);
console.log(`} as const;`);
console.log('');

console.log('// ── PromptCard (72×40 fixed) — DEPRECATED, kept for reference ──');
console.log(`const PROMPT_GEOM = {`);
console.log(`  W: ${CARD.W}, H: ${CARD.H}, bodyH: ${CARD.bodyH}, rx: ${CARD.rx},`);
console.log(`  stubs: ${JSON.stringify(CARD.STUBS)} as const,`);
console.log(`  stubH: ${CARD.stubH}, stubX: ${CARD.stubX}, stubRx: ${CARD.stubRx},`);
console.log(`  tailPoints: '${CARD.tailPoints}',`);
console.log(`} as const;`);
console.log('');

console.log('// ── PromptBubble (40×18 body + 26px total with tail) ──');
console.log(`const BUBBLE_GEOM = {`);
console.log(`  W: ${BUBBLE.W}, H: ${BUBBLE.H}, rx: ${BUBBLE.rx},`);
console.log(`  tailPath: '${BUBBLE.tailPath}',`);
console.log(`  stubs: ${JSON.stringify(BUBBLE.stubs)} as const,`);
console.log(`  cursor: ${JSON.stringify(BUBBLE.cursor)} as const,`);
console.log(`} as const;`);
console.log('');

console.log('// ── IntroHookDiagram arc (v2: operator shoulder → agent left edge) ──');
console.log(`// Operator BB x=90/y=80, right shoulder ≈ x=${ARC.x0}/y=${ARC.y0}`);
console.log(`// Control point Q(${ARC.cpx}, ${ARC.cpy}). Agent BB x=370/y=80, left edge x=${ARC.x1}/y=${ARC.y1}`);
console.log(`// Bubble at t=0.35: point=(${ARC.bubblePtX}, ${ARC.bubblePtY}), top-left=(${ARC.bubbleX}, ${ARC.bubbleY})`);
console.log(`const ARC_D      = '${ARC.d}';`);
console.log(`const ARC_LEN    = ${ARC.len};  // numerically integrated`);
console.log(`const BUBBLE_X   = ${ARC.bubbleX};  // top-left x on arc at t=0.35`);
console.log(`const BUBBLE_Y   = ${ARC.bubbleY};  // top-left y on arc at t=0.35`);
console.log('');

console.log('// ── AgentOrchestrationDiagram connectors ──');
console.log(`const VERT_D   = '${ORCH.vertD}';   // length: ${ORCH.vertLen}`);
console.log(`const FAN_ARC1 = { d: '${ORCH.arc1.d}', len: ${ORCH.arc1.len} } as const;`);
console.log(`const FAN_ARC2 = { d: '${ORCH.arc2.d}', len: ${ORCH.arc2.len} } as const;`);
console.log(`const FAN_ARC3 = { d: '${ORCH.arc3.d}', len: ${ORCH.arc3.len} } as const;`);
console.log('');

console.log('// ── IdeaIcon S=32 ──');
console.log(`const IDEA_32 = {`);
console.log(`  globeR: ${IDEA32.GLOBE_R}, globeCx: ${IDEA32.GLOBE_CX}, globeCy: ${IDEA32.GLOBE_CY},`);
console.log(`  capX: ${IDEA32.CAP_X}, capY: ${IDEA32.CAP_Y}, capW: ${IDEA32.CAP_W}, capH: ${IDEA32.CAP_H}, capRx: 2,`);
console.log(`} as const;`);
console.log('');

console.log('// ── TravelingPromptCard (36×20, centered at 0,0 for animateMotion) ──');
console.log(`const TCARD_GEOM = { W: ${TCARD.W}, H: ${TCARD.H}, rx: ${TCARD.rx}, bodyX: ${TCARD.bodyX}, bodyY: ${TCARD.bodyY}, stubs: ${JSON.stringify(TCARD.stubs)} as const } as const;`);
console.log('// IH  opBubble: x=90,  y=52  (bottom=78, gap=2px to op-top=80)');
console.log('// AOD opBubble: x=260, y=60  (bottom=86, gap=10px to orch-top=96)');
console.log('// AOD orchBubble: x=260, y=68  (bottom=94, gap=2px to orch-top=96)');
