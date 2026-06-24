import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './CheckpointedAttritionFunnel.module.css';

const VIEWBOX_W = 960;
const VIEWBOX_H = 320;

const STAGES = [
  { x: 168, y: 84, w: 92, h: 152, label: 'step 1' },
  { x: 276, y: 94, w: 86, h: 132, label: 'step 4' },
  { x: 378, y: 104, w: 80, h: 112, label: 'step 8' },
  { x: 644, y: 108, w: 72, h: 104, label: 'step 12' },
  { x: 732, y: 116, w: 66, h: 88, label: 'step 16' },
] as const;

const LEAKS = [
  {
    points: '250,84 274,94 274,122 250,112',
    lineX: 262,
    lineY1: 82,
    lineY2: 44,
    textX: 262,
    textY: 32,
    label: 'drift',
  },
  {
    points: '352,94 378,104 378,132 352,122',
    lineX: 366,
    lineY1: 92,
    lineY2: 54,
    textX: 366,
    textY: 42,
    label: 'missed constraint',
  },
  {
    points: '446,104 470,112 470,138 446,130',
    lineX: 458,
    lineY1: 102,
    lineY2: 64,
    textX: 458,
    textY: 52,
    label: 'wrong reuse',
  },
] as const;

function stageCenterX(stage: (typeof STAGES)[number]) {
  return stage.x + stage.w / 2;
}

export default function CheckpointedAttritionFunnel({
  compact = false,
}: PresentationAwareProps = {}) {
  const containerClassName = compact
    ? `${styles.container} ${styles.compact}`
    : styles.container;

  return (
    <div className={containerClassName}>
      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className={styles.svg}
        role="img"
        aria-label="Checkpointed attrition funnel showing multi-step agent work losing reliability across sequential steps, with a spec checkpoint interrupting drift before a final 36 percent outcome after 20 steps"
      >
        <defs>
          <marker
            id="caf-arrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 6 3, 0 6" fill="var(--border-emphasis)" />
          </marker>
        </defs>

        <text
          x="92"
          y="58"
          textAnchor="middle"
          fontFamily="var(--font-mono-spec)"
          fontSize="11"
          fill="var(--text-muted)"
          letterSpacing="0.4"
        >
          task intent
        </text>
        <text
          x="553"
          y="58"
          textAnchor="middle"
          fontFamily="var(--font-mono-spec)"
          fontSize="11"
          fill="var(--visual-indigo)"
          letterSpacing="0.4"
        >
          readable checkpoint
        </text>
        <text
          x="858"
          y="58"
          textAnchor="middle"
          fontFamily="var(--font-mono-spec)"
          fontSize="11"
          fill="var(--text-muted)"
          letterSpacing="0.4"
        >
          outcome
        </text>

        <rect
          x="44"
          y="104"
          width="96"
          height="112"
          rx="0"
          fill="var(--surface-raised)"
          stroke="var(--border-default)"
          strokeWidth="1.5"
        />
        <text
          x="92"
          y="146"
          textAnchor="middle"
          fontFamily="var(--font-mono-keyword)"
          fontSize="18"
          fontWeight="700"
          fill="var(--text-heading)"
        >
          95%
        </text>
        <text
          x="92"
          y="170"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="12"
          fill="var(--text-body)"
        >
          right
        </text>
        <text
          x="92"
          y="190"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="12"
          fill="var(--text-body)"
        >
          per step
        </text>

        <line
          x1="140"
          y1="160"
          x2="166"
          y2="160"
          stroke="var(--border-emphasis)"
          strokeWidth="2"
          markerEnd="url(#caf-arrow)"
        />

        {STAGES.map((stage, index) => (
          <g key={stage.label}>
            <rect
              x={stage.x}
              y={stage.y}
              width={stage.w}
              height={stage.h}
              rx="0"
              fill={index < 3 ? 'var(--visual-bg-warning)' : 'var(--visual-bg-neutral)'}
              stroke={index < 3 ? 'var(--visual-warning)' : 'var(--border-default)'}
              strokeWidth="1.5"
            />
            <text
              x={stageCenterX(stage)}
              y={stage.y + stage.h + 24}
              textAnchor="middle"
              fontFamily="var(--font-mono-keyword)"
              fontSize="11"
              fill="var(--text-muted)"
            >
              {stage.label}
            </text>
          </g>
        ))}

        <line
          x1="260"
          y1="160"
          x2="276"
          y2="160"
          stroke="var(--border-emphasis)"
          strokeWidth="2"
          markerEnd="url(#caf-arrow)"
        />
        <line
          x1="362"
          y1="160"
          x2="378"
          y2="160"
          stroke="var(--border-emphasis)"
          strokeWidth="2"
          markerEnd="url(#caf-arrow)"
        />
        <line
          x1="458"
          y1="160"
          x2="486"
          y2="160"
          stroke="var(--border-emphasis)"
          strokeWidth="2"
          markerEnd="url(#caf-arrow)"
        />
        <line
          x1="620"
          y1="160"
          x2="644"
          y2="160"
          stroke="var(--border-emphasis)"
          strokeWidth="2"
          markerEnd="url(#caf-arrow)"
        />
        <line
          x1="716"
          y1="160"
          x2="732"
          y2="160"
          stroke="var(--border-emphasis)"
          strokeWidth="2"
          markerEnd="url(#caf-arrow)"
        />
        <line
          x1="798"
          y1="160"
          x2="826"
          y2="160"
          stroke="var(--border-emphasis)"
          strokeWidth="2"
          markerEnd="url(#caf-arrow)"
        />

        {LEAKS.map((leak) => (
          <g key={leak.label}>
            <polygon
              points={leak.points}
              fill="var(--visual-bg-warning)"
              stroke="var(--visual-warning)"
              strokeWidth="1.5"
            />
            <line
              x1={leak.lineX}
              y1={leak.lineY1}
              x2={leak.lineX}
              y2={leak.lineY2}
              stroke="var(--visual-warning)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <text
              x={leak.textX}
              y={leak.textY}
              textAnchor="middle"
              fontFamily="var(--font-mono-keyword)"
              fontSize="10"
              fill="var(--visual-warning)"
            >
              {leak.label}
            </text>
          </g>
        ))}

        <rect
          x="486"
          y="84"
          width="134"
          height="152"
          rx="0"
          fill="var(--visual-bg-indigo)"
          stroke="var(--visual-indigo)"
          strokeWidth="2"
        />
        <rect
          x="506"
          y="116"
          width="94"
          height="88"
          rx="0"
          fill="var(--surface-page)"
          stroke="var(--visual-indigo)"
          strokeWidth="1.5"
        />
        <text
          x="553"
          y="148"
          textAnchor="middle"
          fontFamily="var(--font-mono-spec)"
          fontSize="22"
          fontWeight="700"
          fill="var(--visual-indigo)"
        >
          SPEC
        </text>
        <text
          x="553"
          y="172"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill="var(--text-body)"
        >
          human review
        </text>
        <text
          x="553"
          y="190"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill="var(--text-body)"
        >
          before execute
        </text>

        <rect
          x="826"
          y="112"
          width="92"
          height="96"
          rx="0"
          fill="var(--visual-bg-success)"
          stroke="var(--visual-success)"
          strokeWidth="1.5"
        />
        <text
          x="872"
          y="146"
          textAnchor="middle"
          fontFamily="var(--font-mono-keyword)"
          fontSize="18"
          fontWeight="700"
          fill="var(--visual-success)"
        >
          36%
        </text>
        <text
          x="872"
          y="170"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="12"
          fill="var(--text-body)"
        >
          after 20 steps
        </text>

        <text
          x="92"
          y="274"
          textAnchor="start"
          fontFamily="var(--font-mono-keyword)"
          fontSize="11"
          fill="var(--text-muted)"
        >
          sequential probabilistic work
        </text>
        <text
          x="472"
          y="274"
          textAnchor="middle"
          fontFamily="var(--font-mono-keyword)"
          fontSize="11"
          fill="var(--visual-indigo)"
        >
          approved artifact resets the target before code changes begin
        </text>
        <text
          x="872"
          y="274"
          textAnchor="middle"
          fontFamily="var(--font-mono-keyword)"
          fontSize="11"
          fill="var(--visual-success)"
        >
          0.95^20 ≈ 0.36
        </text>
      </svg>
    </div>
  );
}
