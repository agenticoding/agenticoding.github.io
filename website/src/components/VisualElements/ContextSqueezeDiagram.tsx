import clsx from 'clsx';
import styles from './ContextSqueezeDiagram.module.css';
import shared from './diagram.module.css';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import { useActs } from '../../hooks/useActs';
import { useMounted } from '../../hooks/useMounted';
import { Ghost } from './Ghost';

// ViewBox 400×320 — The Primacy Squeeze.
// Context files (AGENTS.md) expand in the primacy zone and push the user
// task downward into the forgotten middle zone.

// ── Act thresholds ──────────────────────────────────────────────────────────
const ACTS = [
  { id: 'zones',    threshold: 0.05 },
  { id: 'baseline', threshold: 0.25 },
  { id: 'grow',     threshold: 0.50 },
  { id: 'danger',   threshold: 0.75 },
] as const;

// ── Geometry ────────────────────────────────────────────────────────────────
const ZONE_X = 20;
const ZONE_W = 360;

const BLOCK_X = 40;
const BLOCK_W = 320;
const BLOCK_RX = 8;

const CF_Y = 8;
const CF_H_INITIAL = 48;

const TASK_Y = 64;
const TASK_H = 32;

// Zone label pills — empirically offset +3 for fontSize=9 all-caps Monaspace Xenon
const PILL_H = 16;
const PRIMACY_PILL_Y = 32;   // centered in primacy zone (0–80)
const MIDDLE_PILL_Y = 152;   // centered in middle zone (80–240)
const RECENCY_PILL_Y = 272;  // centered in recency zone (240–320)
const ZONE_LABEL_OFFSET = 3;

// Block labels — empirically offset +4 for fontSize=11 Monaspace Neon
const BLOCK_LABEL_OFFSET = 4;

export default function ContextSqueezeDiagram() {
  const phase = useAnimationPhase();
  const mounted = useMounted();
  const { wasReached } = useActs(ACTS, phase);

  const zones    = mounted && wasReached('zones');
  const baseline = mounted && wasReached('baseline');
  const grow     = mounted && wasReached('grow');
  const danger   = mounted && wasReached('danger');

  if (!mounted) {
    return <div style={{ minHeight: 320 }} />;
  }

  return (
    <svg
      viewBox="0 0 400 320"
      width="100%"
      height="auto"
      role="img"
      aria-label="The Primacy Squeeze: context files (AGENTS.md) consume primacy-zone space and push the user task downward into the forgotten middle zone."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '400px', margin: '0 auto' }}
    >
      {/* ── Zone background rects (labels render later for top z-order) ──── */}
      <g className={clsx(styles.zone, zones && styles.zoneIn)}>
        <rect
          x={ZONE_X} y={0} width={ZONE_W} height={80}
          fill="var(--visual-bg-cyan)"
        />
        <rect
          x={ZONE_X} y={80} width={ZONE_W} height={160}
          fill="var(--surface-muted)"
        />
        <rect
          x={ZONE_X} y={240} width={ZONE_W} height={80}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={1}
        />
      </g>

      {/* ── Context File block ─────────────────────────────────────────────── */}
      <Ghost
        x={BLOCK_X} y={CF_Y} width={BLOCK_W} height={CF_H_INITIAL} rx={BLOCK_RX}
        fill="var(--visual-bg-cyan)" stroke="var(--visual-cyan)"
        mounted={mounted} reached={baseline}
      />

      <g className={clsx(styles.contextFile, baseline && styles.contextFileIn)}>
        <rect
          className={clsx(styles.cfRect, grow && styles.cfRectGrown)}
          x={BLOCK_X} y={CF_Y} width={BLOCK_W} rx={BLOCK_RX}
          fill="var(--visual-bg-cyan)"
          stroke="var(--visual-cyan)"
          strokeWidth={1.5}
        />
        <text
          className={clsx(styles.cfText, grow && styles.cfTextGrown)}
          x={BLOCK_X + 13}
          y={CF_Y + CF_H_INITIAL / 2 + BLOCK_LABEL_OFFSET}
          fontSize={11}
          fontFamily="var(--font-mono)"
          fontWeight={600}
          fill="var(--visual-cyan)"
        >
          AGENTS.md
        </text>
      </g>

      {/* ── Directional arrow ──────────────────────────────────────────────── */}
      <g className={clsx(styles.arrow, baseline && styles.arrowIn, grow && styles.arrowGrown)}>
        <polygon
          points="-4,0 0,6 4,0"
          fill="var(--text-muted)"
          transform={`translate(200, ${CF_Y + CF_H_INITIAL})`}
        />
      </g>

      {/* ── User Task block ────────────────────────────────────────────────── */}
      <Ghost
        x={BLOCK_X} y={TASK_Y} width={BLOCK_W} height={TASK_H} rx={BLOCK_RX}
        fill="var(--visual-bg-success)" stroke="var(--visual-success)"
        mounted={mounted} reached={baseline}
      />

      <g className={clsx(styles.taskBlock, baseline && styles.taskBlockIn)}>
        <g className={clsx(styles.taskInner, grow && styles.taskInnerGrown)}>
          <rect
            className={clsx(styles.taskBlockSafe, danger && styles.taskBlockDanger)}
            x={BLOCK_X} y={TASK_Y} width={BLOCK_W} height={TASK_H} rx={BLOCK_RX}
            strokeWidth={2}
          />
          <text
            x={BLOCK_X + 13}
            y={TASK_Y + TASK_H / 2 + BLOCK_LABEL_OFFSET}
            fontSize={11}
            fontFamily="var(--font-mono)"
            fill="var(--text-body)"
          >
            User Task
          </text>
        </g>
      </g>

      {/* ── Zone labels — rendered last so they float above all blocks ─────── */}
      <g className={clsx(styles.zoneLabel, zones && styles.zoneLabelIn)}>
        {/* Primacy */}
        <rect x={161} y={PRIMACY_PILL_Y} width={78} height={PILL_H} rx={4} fill="var(--surface-page)" />
        <text
          x={200} y={PRIMACY_PILL_Y + PILL_H / 2 + ZONE_LABEL_OFFSET}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--font-mono-spec)"
          fill="var(--text-muted)"
          style={{ fontFeatureSettings: 'var(--font-mono-features)', letterSpacing: '0.06em' }}
        >
          PRIMACY ZONE
        </text>

        {/* Middle */}
        <rect x={164} y={MIDDLE_PILL_Y} width={72} height={PILL_H} rx={4} fill="var(--surface-page)" />
        <text
          x={200} y={MIDDLE_PILL_Y + PILL_H / 2 + ZONE_LABEL_OFFSET}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--font-mono-spec)"
          fill="var(--text-muted)"
          style={{ fontFeatureSettings: 'var(--font-mono-features)', letterSpacing: '0.06em' }}
        >
          MIDDLE ZONE
        </text>

        {/* Recency */}
        <rect x={161} y={RECENCY_PILL_Y} width={78} height={PILL_H} rx={4} fill="var(--surface-page)" />
        <text
          x={200} y={RECENCY_PILL_Y + PILL_H / 2 + ZONE_LABEL_OFFSET}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--font-mono-spec)"
          fill="var(--text-muted)"
          style={{ fontFeatureSettings: 'var(--font-mono-features)', letterSpacing: '0.06em' }}
        >
          RECENCY ZONE
        </text>
      </g>
    </svg>
  );
}
