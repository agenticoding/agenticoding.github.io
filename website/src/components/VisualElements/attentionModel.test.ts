import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ATTENTION_TIERS,
  attentionAt,
  buildCurvePaths,
  createAttentionCurve,
  fillAtAttentionCrossing,
  jCurveStrength,
  projectCurve,
  tierAt,
  toneAt,
  zoneBandFill,
} from './attentionModel.ts';

const compactMobilePlot = { left: 40, right: 316, top: 40, bottom: 176 };

/* ── Curve shape (ported from UShapeAttentionCurveGeometry.test) ── */

test('attention curve keeps both context edges above the middle at moderate fill', () => {
  const { points } = createAttentionCurve(50);
  const middle = points[points.length / 2 - 0.5];

  assert.equal(points[0].position, 0);
  assert.equal(points.at(-1)?.position, 1);
  assert.ok(points[0].attention > middle.attention);
  assert.ok(points.at(-1)!.attention > middle.attention);
});

test('long context turns the symmetric U toward recency', () => {
  const { points } = createAttentionCurve(100);

  assert.ok(points.at(-1)!.attention > points[0].attention);
  assert.equal(points.at(-1)!.cyanOpacity, 1);
});

test('compact mobile projection retains context left-to-right and attention high-to-low', () => {
  const { points } = createAttentionCurve(50);
  const projected = projectCurve(points, compactMobilePlot);
  const middle = projected[projected.length / 2 - 0.5];

  assert.equal(projected[0].x, compactMobilePlot.left);
  assert.equal(projected.at(-1)?.x, compactMobilePlot.right);
  assert.ok(projected[0].y < middle.y);
  assert.ok(projected.at(-1)!.y < middle.y);
});

/* ── Unification invariants ─────────────────────────────────────── */

test('one shared primacy-decay coefficient: J-curve is zero at half fill and ramps to 1 at full', () => {
  assert.equal(jCurveStrength(0), 0);
  assert.equal(jCurveStrength(0.5), 0);
  assert.equal(jCurveStrength(1), 1);
});

test('attention degrades monotonically as the window fills at every position', () => {
  for (const position of [0, 0.25, 0.5, 0.75, 1]) {
    for (let fill = 0; fill < 1; fill += 0.05) {
      assert.ok(
        attentionAt(position, fill) >=
          attentionAt(position, fill + 0.05) - 1e-9,
        `position ${position} fill ${fill}`
      );
    }
  }
});

test('recency edge stays strong at every fill while the middle collapses', () => {
  assert.ok(attentionAt(1, 1) >= ATTENTION_TIERS.strong);
  assert.ok(attentionAt(0.5, 1) < ATTENTION_TIERS.degraded);
});

test('attention is full in an empty window regardless of position', () => {
  for (const position of [0, 0.25, 0.5, 0.75, 1]) {
    assert.equal(attentionAt(position, 0), 1);
  }
});

/* ── Tiers, tones, band fills ───────────────────────────────────── */

test('tier and tone thresholds are consistent', () => {
  assert.equal(tierAt(ATTENTION_TIERS.strong), 'strong');
  assert.equal(tierAt(ATTENTION_TIERS.degraded), 'degraded');
  assert.equal(tierAt(0), 'collapsed');
  assert.equal(toneAt(1), 'success');
  assert.equal(toneAt(0.3), 'warning');
  assert.equal(toneAt(0.1), 'error');
});

test('middle zone band deepens muted → warning → error as fill grows', () => {
  assert.equal(zoneBandFill('middle', 0), 'var(--surface-muted)');
  assert.equal(zoneBandFill('middle', 0.5), 'var(--surface-muted)');
  assert.equal(zoneBandFill('middle', 0.7), 'var(--visual-bg-warning)');
  assert.equal(zoneBandFill('middle', 0.9), 'var(--visual-bg-error)');
});

test('recency band never degrades; primacy band fades only past half fill', () => {
  for (const fill of [0, 0.5, 0.8, 1]) {
    assert.equal(zoneBandFill('recency', fill), 'var(--visual-bg-cyan)');
  }
  assert.ok(zoneBandFill('primacy', 0.4).includes('100%'));
  assert.ok(!zoneBandFill('primacy', 1).includes('100%'));
});

test('fillAtAttentionCrossing inverts attentionAt', () => {
  for (const target of [ATTENTION_TIERS.strong, ATTENTION_TIERS.degraded]) {
    const fill = fillAtAttentionCrossing(0.5, target);
    assert.ok(Math.abs(attentionAt(0.5, fill) - target) < 0.01);
  }
  // The collapsed crossing happens at a deeper fill than the degraded one.
  assert.ok(
    fillAtAttentionCrossing(0.5, ATTENTION_TIERS.degraded) >
      fillAtAttentionCrossing(0.5, ATTENTION_TIERS.strong)
  );
});

/* ── Smooth curve paths (pressure diagram panel) ────────────────── */

test('buildCurvePaths reports the valley floor and spans the full plot', () => {
  const { minAttention, curvePath, mobileCurvePath } = buildCurvePaths(0.9);

  assert.ok(Math.abs(minAttention - attentionAt(0.5, 0.9)) < 0.02);
  assert.ok(curvePath.startsWith('M'));
  assert.ok(mobileCurvePath.startsWith('M'));
  // Empty window: no drop anywhere.
  assert.equal(buildCurvePaths(0).minAttention, 1);
});
