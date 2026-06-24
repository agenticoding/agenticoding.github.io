import clsx from 'clsx';
import styles from './ContextFilesHierarchy.module.css';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import { useActs } from '../../hooks/useActs';
import { useMounted } from '../../hooks/useMounted';
import { Ghost } from './Ghost';

// ViewBox 480×320 — 5-tier CLAUDE.md priority hierarchy with override arrows.
//
// Tiers:   x=80  width=320  height=36  gap=20
// Arrows:  between each tier pair, centered
// Bracket: x=420 (right side merge annotation)

// ── Tier geometry ─────────────────────────────────────────────────────────────
const TIER_X = 80;
const TIER_W = 320;
const TIER_H = 36;
const TIER_GAP = 20;           // vertical gap between tiers
const TIER_TOP = 40;           // y of first tier (below title)
const ACCENT_W = 3;            // left accent strip width

// Arrow geometry (positioned between tiers)
const ARROW_X = TIER_X + TIER_W / 2;  // centered horizontally

// Bracket geometry
const BRACKET_X = 420;
const BRACKET_Y_TOP = TIER_TOP;
const BRACKET_Y_BOT = TIER_TOP + 5 * TIER_H + 4 * TIER_GAP;
const BRACKET_W = 12;

// ── Tier definitions (top = highest priority) ─────────────────────────────────
const TIERS = [
  {
    id: 'enterprise',
    label: 'Enterprise Policy',
    annotation: 'managed by org admins',
    color: 'cyan',
  },
  {
    id: 'project',
    label: 'Project CLAUDE.md',
    annotation: 'repository root',
    color: 'indigo',
  },
  {
    id: 'rules',
    label: '.claude/rules/',
    annotation: 'path-scoped',
    color: 'violet',
  },
  {
    id: 'user',
    label: 'User ~/.claude/CLAUDE.md',
    annotation: 'personal preferences',
    color: 'neutral',
  },
  {
    id: 'local',
    label: '.claude.local.md',
    annotation: 'local overrides, gitignored',
    color: 'neutral',
  },
] as const;

// Pre-compute y positions
const tierY = TIERS.map((_, i) => TIER_TOP + i * (TIER_H + TIER_GAP));

// Arrows appear between consecutive tiers (4 arrows total)
// arrow i sits between tier i and tier i+1
const ARROW_ACTS = [
  { id: 'arrow0', threshold: 0.25 },
  { id: 'arrow1', threshold: 0.43 },
  { id: 'arrow2', threshold: 0.61 },
  { id: 'arrow3', threshold: 0.79 },
] as const;

const ACTS = [
  { id: 'enterprise', threshold: 0.05 },
  { id: 'project',    threshold: 0.22 },
  { id: 'rules',      threshold: 0.40 },
  { id: 'user',       threshold: 0.58 },
  { id: 'local',      threshold: 0.76 },
  ...ARROW_ACTS,
] as const;

export default function ContextFilesHierarchy() {
  const phase = useAnimationPhase();
  const mounted = useMounted();
  const { wasReached } = useActs(ACTS, phase);

  const r = (id: (typeof ACTS)[number]['id']) => mounted && wasReached(id);

  const tierReached = TIERS.map((t) => r(t.id as (typeof ACTS)[number]['id']));
  const arrowReached = [r('arrow0'), r('arrow1'), r('arrow2'), r('arrow3')];

  // Title and bracket appear once first tier is visible
  const metaVisible = tierReached[0];

  return (
    <svg
      viewBox="0 0 480 320"
      width="100%"
      height="auto"
      role="img"
      aria-label="CLAUDE.md priority hierarchy: Enterprise Policy overrides Project CLAUDE.md, which overrides .claude/rules/, then User config, then .claude.local.md. Non-conflicting rules merge."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '480px', margin: '0 auto' }}
    >
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <text
        x={TIER_X + TIER_W / 2} y={24}
        className={clsx(styles.meta, metaVisible && styles.metaIn)}
        fill="var(--text-muted)"
        textAnchor="middle"
        fontSize={12}
        fontFamily="var(--font-mono-keyword)"
        letterSpacing="0.06em"
      >
        CLAUDE.md Priority Hierarchy
      </text>

      {/* ── Right bracket: "non-conflicting rules merge +" ─────────────────── */}
      <g className={clsx(styles.meta, metaVisible && styles.metaIn)}>
        {/* Vertical line */}
        <line
          x1={BRACKET_X} y1={BRACKET_Y_TOP}
          x2={BRACKET_X} y2={BRACKET_Y_BOT}
          stroke="var(--text-muted)"
          strokeWidth={1}
        />
        {/* Top horizontal tick */}
        <line
          x1={BRACKET_X} y1={BRACKET_Y_TOP}
          x2={BRACKET_X - BRACKET_W} y2={BRACKET_Y_TOP}
          stroke="var(--text-muted)"
          strokeWidth={1}
        />
        {/* Bottom horizontal tick */}
        <line
          x1={BRACKET_X} y1={BRACKET_Y_BOT}
          x2={BRACKET_X - BRACKET_W} y2={BRACKET_Y_BOT}
          stroke="var(--text-muted)"
          strokeWidth={1}
        />
        {/* Annotation text — rotated 90° beside bracket */}
        <text
          x={BRACKET_X + 12}
          y={(BRACKET_Y_TOP + BRACKET_Y_BOT) / 2}
          fontSize={9}
          fontFamily="var(--font-mono)"
          fill="var(--text-muted)"
          textAnchor="middle"
          transform={`rotate(90, ${BRACKET_X + 12}, ${(BRACKET_Y_TOP + BRACKET_Y_BOT) / 2})`}
        >
          non-conflicting rules merge +
        </text>
      </g>

      {/* ── Tiers ─────────────────────────────────────────────────────────── */}
      {TIERS.map((tier, i) => {
        const y = tierY[i];
        const isReached = tierReached[i];
        const colorVar = `var(--visual-${tier.color})`;
        const bgVar = `var(--visual-bg-${tier.color})`;

        return (
          <g key={tier.id}>
            {/* Ghost placeholder */}
            <Ghost
              x={TIER_X} y={y} width={TIER_W} height={TIER_H} rx={0}
              fill={bgVar}
              stroke={colorVar}
              mounted={mounted} reached={isReached}
            />

            {/* Tier group (appears on reach) */}
            <g className={clsx(styles.tier, isReached && styles.tierIn)}>
              {/* Background */}
              <rect
                x={TIER_X} y={y} width={TIER_W} height={TIER_H} rx={0}
                fill={bgVar}
                stroke={colorVar}
                strokeWidth={1.5}
              />
              {/* Left accent strip */}
              <rect
                x={TIER_X} y={y} width={ACCENT_W} height={TIER_H} rx={0}
                fill={colorVar}
              />
              {/* Label */}
              <text
                x={TIER_X + ACCENT_W + 10}
                y={y + TIER_H / 2 + 4}
                fontSize={11.5}
                fontFamily="var(--font-mono)"
                fontWeight={600}
                fill={colorVar}
              >
                {tier.label}
              </text>
              {/* Annotation */}
              <text
                x={TIER_X + TIER_W - 10}
                y={y + TIER_H / 2 + 4}
                fontSize={10}
                fontFamily="var(--font-mono)"
                fill="var(--text-muted)"
                textAnchor="end"
              >
                {tier.annotation}
              </text>
            </g>
          </g>
        );
      })}

      {/* ── Override arrows (between tiers) ───────────────────────────────── */}
      {arrowReached.map((isReached, i) => {
        const arrowY1 = tierY[i] + TIER_H;
        const arrowY2 = tierY[i + 1];
        const midY = (arrowY1 + arrowY2) / 2;

        return (
          <g
            key={`arrow-${i}`}
            className={clsx(styles.arrow, isReached && styles.arrowIn)}
          >
            {/* Shaft */}
            <line
              x1={ARROW_X} y1={arrowY1 + 2}
              x2={ARROW_X} y2={arrowY2 - 6}
              stroke="var(--text-muted)"
              strokeWidth={1}
            />
            {/* Arrowhead pointing down */}
            <polygon
              points="-4,0 0,6 4,0"
              fill="var(--text-muted)"
              transform={`translate(${ARROW_X},${arrowY2 - 6})`}
            />
            {/* "overrides ↓" label */}
            <text
              x={ARROW_X + 10}
              y={midY + 4}
              fontSize={11}
              fontFamily="var(--font-mono-keyword)"
              fill="var(--text-muted)"
              fontStyle="italic"
            >
              overrides ↓
            </text>
          </g>
        );
      })}
    </svg>
  );
}
