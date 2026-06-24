import React from 'react';

import type { PresentationAwareProps } from '@site/src/components/PresentationMode/types';

const WIDTH = 920;
const HEIGHT = 488;
const PLOT = { x: 72, y: 96, w: 520, h: 344 };
const PER_STEP = 0.95;
const MARKERS = [1, 5, 10, 15, 20];
// SVG coordinate math needs numbers; these mirror DESIGN_SYSTEM spacing tokens.
const SPACE_1 = 8;
const SPACE_2 = 16;
const SPACE_3 = 24;
const SPACE_4 = 32;
const SPACE_5 = 48;
const PLOT_INSET = SPACE_1;
const PLOT_LEFT = PLOT.x + PLOT_INSET;
const PLOT_RIGHT = PLOT.x + PLOT.w - PLOT_INSET;
const PLOT_TOP = PLOT.y + PLOT_INSET;
const PLOT_BOTTOM = PLOT.y + PLOT.h - PLOT_INSET;
const PLOT_INNER_W = PLOT_RIGHT - PLOT_LEFT;
const PLOT_INNER_H = PLOT_BOTTOM - PLOT_TOP;
const CARD_X = 624;
const CARD_W = 240;
const THRESHOLD_Y = PLOT.y;
const THRESHOLD_H = 136;
const PLAY_CARD_H = 96;
const PLAY_1_Y = THRESHOLD_Y + THRESHOLD_H + SPACE_1;
const PLAY_2_Y = PLAY_1_Y + PLAY_CARD_H + SPACE_1;
const AXIS_LABEL_Y = PLOT.y + PLOT.h + SPACE_4;

function xForStep(step: number) {
  return PLOT_LEFT + (step / 20) * PLOT_INNER_W;
}

function yForReliability(value: number) {
  return PLOT_TOP + (1 - value) * PLOT_INNER_H;
}

function reliability(steps: number) {
  return Math.pow(PER_STEP, steps);
}

function atLeastOneSuccess(singleAttemptReliability: number, attempts: number) {
  return 1 - Math.pow(1 - singleAttemptReliability, attempts);
}

function percent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function curvePath() {
  const points: string[] = [];

  for (let step = 0; step <= 20; step += 0.25) {
    const command = step === 0 ? 'M' : 'L';
    points.push(
      `${command} ${xForStep(step).toFixed(1)} ${yForReliability(reliability(step)).toFixed(1)}`
    );
  }

  return points.join(' ');
}

function ThresholdWash({
  y1,
  y2,
  fill,
}: {
  y1: number;
  y2: number;
  fill: string;
}) {
  return (
    <rect
      x={PLOT_LEFT}
      y={y1}
      width={PLOT_INNER_W}
      height={y2 - y1}
      fill={fill}
      opacity="0.1"
      clipPath="url(#reliability-plot-clip)"
    />
  );
}

function ThresholdGuide() {
  const headingStyle = { fontFamily: 'var(--font-display)' };
  const bodyStyle = { fontFamily: 'var(--font-body)' };
  const monoStyle = { fontFamily: 'var(--font-mono-keyword)' };
  const rows = [
    {
      range: '≥90%',
      action: 'Automate directly',
      note: 'Observable, reversible work',
      tone: 'var(--visual-success)',
    },
    {
      range: '70–90%',
      action: 'Verify before continuing',
      note: 'Checkpoint before risk propagates',
      tone: 'var(--visual-warning)',
    },
    {
      range: '<70%',
      action: 'Add judge or restructure',
      note: 'Judge N candidates or decompose',
      tone: 'var(--visual-error)',
    },
  ];

  return (
    <g>
      <rect
        x={CARD_X}
        y={THRESHOLD_Y}
        width={CARD_W}
        height={THRESHOLD_H}
        rx="0"
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
      />
      <text
        x={CARD_X + SPACE_2}
        y={THRESHOLD_Y + SPACE_3}
        style={headingStyle}
        fontSize="var(--text-sm)"
        fontWeight="700"
        fill="var(--text-heading)"
      >
        Decision thresholds
      </text>
      {rows.map((row, index) => {
        const y = THRESHOLD_Y + SPACE_5 + index * SPACE_4;
        return (
          <g key={row.range}>
            <circle
              cx={CARD_X + SPACE_2}
              cy={y - SPACE_1 / 2}
              r="4"
              fill={row.tone}
            />
            <text
              x={CARD_X + SPACE_4}
              y={y}
              style={monoStyle}
              fontSize="var(--text-xs)"
              fontWeight="700"
              fill={row.tone}
            >
              {row.range}
            </text>
            <text
              x={CARD_X + SPACE_4 + SPACE_5}
              y={y}
              style={bodyStyle}
              fontSize="var(--text-xs)"
              fontWeight="700"
              fill="var(--text-heading)"
            >
              {row.action}
            </text>
            <text
              x={CARD_X + SPACE_4}
              y={y + SPACE_2}
              style={bodyStyle}
              fontSize="var(--text-xs)"
              fill="var(--text-muted)"
            >
              {row.note}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Card({
  y,
  height,
  tone,
  title,
  lines,
}: {
  y: number;
  height: number;
  tone: string;
  title: string;
  lines: string[];
}) {
  const headingStyle = { fontFamily: 'var(--font-display)' };
  const bodyStyle = { fontFamily: 'var(--font-body)' };
  const monoStyle = { fontFamily: 'var(--font-mono-keyword)' };

  return (
    <g>
      <rect
        x={CARD_X}
        y={y}
        width={CARD_W}
        height={height}
        rx="0"
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
      />
      <line
        x1={CARD_X + SPACE_2}
        y1={y + SPACE_3}
        x2={CARD_X + SPACE_2}
        y2={y + height - SPACE_3}
        stroke={tone}
        strokeWidth="var(--stroke-heavy)"
      />
      <text
        x={CARD_X + SPACE_4}
        y={y + SPACE_4}
        style={headingStyle}
        fontSize="var(--text-sm)"
        fontWeight="700"
        fill="var(--text-heading)"
      >
        {title}
      </text>
      {lines.map((line, index) => (
        <text
          key={line}
          x={CARD_X + SPACE_4}
          y={y + SPACE_4 + SPACE_3 + index * SPACE_2}
          style={
            line.includes('=') || line.includes('^') ? monoStyle : bodyStyle
          }
          fontSize="var(--text-xs)"
          fill={index === 0 ? tone : 'var(--text-body)'}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export default function AgentReliabilityDecayCurve({
  compact = false,
}: PresentationAwareProps = {}) {
  const path = curvePath();
  const labelStyle = { fontFamily: 'var(--font-mono-keyword)' };
  const bodyStyle = { fontFamily: 'var(--font-body)' };
  const headingStyle = { fontFamily: 'var(--font-display)' };
  const r20 = reliability(20);
  const scale = compact ? 0.96 : 1;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      height="auto"
      role="img"
      aria-label="Exact exponential reliability diagram: task reliability equals 0.95 to the power of dependent steps, falling from 95 percent at one step to 35.8 percent at twenty steps. The chart emphasizes the decay curve, with external guidance thresholds: automate directly above 90 percent, verify before continuing between 70 and 90 percent, and add a judge or restructure below 70 percent. Engineering responses are to shrink and checkpoint dependent chains or sample independent candidates and select with tests, an LLM judge, or a human judge."
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        transform: `scale(${scale})`,
        transformOrigin: 'center',
      }}
    >
      <defs>
        <clipPath id="reliability-plot-clip">
          <rect
            x={PLOT.x}
            y={PLOT.y}
            width={PLOT.w}
            height={PLOT.h}
            rx="0"
          />
        </clipPath>
      </defs>

      <rect
        x="0"
        y="0"
        width={WIDTH}
        height={HEIGHT}
        rx="0"
        fill="var(--surface-page)"
        stroke="var(--border-subtle)"
      />

      <text
        x={SPACE_5}
        y="38"
        style={headingStyle}
        fontSize="var(--text-xl)"
        fontWeight="700"
        fill="var(--text-heading)"
      >
        Reliability is multiplicative
      </text>
      <text
        x={SPACE_5}
        y="62"
        style={bodyStyle}
        fontSize="var(--text-sm)"
        fill="var(--text-body)"
      >
        A 95% step is strong. Twenty dependent steps still succeed only 35.8% of
        the time.
      </text>

      <rect
        x={PLOT.x}
        y={PLOT.y}
        width={PLOT.w}
        height={PLOT.h}
        rx="0"
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
      />

      <ThresholdWash
        y1={yForReliability(1)}
        y2={yForReliability(0.9)}
        fill="var(--visual-bg-success)"
      />
      <ThresholdWash
        y1={yForReliability(0.9)}
        y2={yForReliability(0.7)}
        fill="var(--visual-bg-warning)"
      />
      <ThresholdWash
        y1={yForReliability(0.7)}
        y2={yForReliability(0)}
        fill="var(--visual-bg-error)"
      />

      {[1, 0.9, 0.7, 0.5, 0.25, 0].map((value) => (
        <g key={value}>
          <line
            x1={PLOT_LEFT}
            y1={yForReliability(value)}
            x2={PLOT_RIGHT}
            y2={yForReliability(value)}
            stroke="var(--border-subtle)"
            strokeWidth="var(--stroke-fine)"
            strokeDasharray={value === 0 ? undefined : '3 5'}
          />
          <text
            x={PLOT.x - 12}
            y={yForReliability(value) + 4}
            textAnchor="end"
            style={labelStyle}
            fontSize="var(--text-xs)"
            fill="var(--text-muted)"
          >
            {Math.round(value * 100)}%
          </text>
        </g>
      ))}

      {[
        { key: 'automate', value: 0.9, color: 'var(--visual-success)' },
        { key: 'verify', value: 0.8, color: 'var(--visual-warning)' },
        { key: 'judge', value: 0.7, color: 'var(--visual-error)' },
      ].map(({ key, value, color }) => {
        const y = yForReliability(value);
        return (
          <line
            key={`threshold-${key}`}
            x1={PLOT_LEFT}
            y1={y}
            x2={PLOT_RIGHT}
            y2={y}
            stroke={color}
            strokeWidth="var(--stroke-default)"
            opacity="0.55"
          />
        );
      })}

      {[0, 5, 10, 15, 20].map((step) => (
        <g key={step}>
          <line
            x1={xForStep(step)}
            y1={PLOT_TOP}
            x2={xForStep(step)}
            y2={PLOT_BOTTOM}
            stroke="var(--border-subtle)"
            strokeWidth="var(--stroke-fine)"
            strokeDasharray="3 5"
          />
          <text
            x={xForStep(step)}
            y={PLOT.y + PLOT.h + 22}
            textAnchor="middle"
            style={labelStyle}
            fontSize="var(--text-xs)"
            fill="var(--text-muted)"
          >
            {step}
          </text>
        </g>
      ))}

      <path
        d={path}
        fill="none"
        stroke="var(--visual-indigo)"
        strokeWidth="var(--stroke-accent)"
        strokeLinecap="butt"
        strokeLinejoin="round"
        clipPath="url(#reliability-plot-clip)"
      />

      {MARKERS.map((step) => {
        const value = reliability(step);
        return (
          <g key={step}>
            <line
              x1={xForStep(step)}
              y1={yForReliability(value)}
              x2={xForStep(step)}
              y2={PLOT_BOTTOM}
              stroke="var(--visual-indigo)"
              strokeWidth="var(--stroke-light)"
              strokeDasharray="4 5"
              opacity="0.7"
            />
            <circle
              cx={xForStep(step)}
              cy={yForReliability(value)}
              r="var(--space-0h)"
              fill="var(--visual-indigo)"
              stroke="var(--surface-raised)"
              strokeWidth="var(--stroke-default)"
            />
            <text
              x={xForStep(step)}
              y={yForReliability(value) - 14}
              textAnchor="middle"
              style={labelStyle}
              fontSize="var(--text-xs)"
              fontWeight="600"
              fill="var(--visual-indigo)"
            >
              {percent(value)}
            </text>
          </g>
        );
      })}

      <text
        x={PLOT.x + PLOT.w / 2}
        y={AXIS_LABEL_Y}
        textAnchor="middle"
        style={labelStyle}
        fontSize="var(--text-xs)"
        fill="var(--text-muted)"
      >
        dependent reasoning steps →
      </text>
      <text
        x="20"
        y={PLOT.y + PLOT.h / 2}
        textAnchor="middle"
        transform={`rotate(-90 20 ${PLOT.y + PLOT.h / 2})`}
        style={labelStyle}
        fontSize="var(--text-xs)"
        fill="var(--text-muted)"
      >
        full-task reliability
      </text>

      <ThresholdGuide />
      <Card
        y={PLAY_1_Y}
        height={PLAY_CARD_H}
        tone="var(--visual-success)"
        title="Play 1: shrink + checkpoint"
        lines={['R(n) = p^n', '20 steps: 35.8%', '5-step chunk: 77.4%']}
      />
      <Card
        y={PLAY_2_Y}
        height={PLAY_CARD_H}
        tone="var(--visual-warning)"
        title="Play 2: sample + judge"
        lines={[
          'independent candidates',
          'tests / LLM judge / human',
          `k=3 → ${percent(atLeastOneSuccess(r20, 3))}`,
        ]}
      />
    </svg>
  );
}
