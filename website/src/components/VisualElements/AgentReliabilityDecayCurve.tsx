import React from 'react';

const WIDTH = 920;
const HEIGHT = 400;
const PLOT = { x: 88, y: 88, w: 768, h: 232 };
const PER_STEP = 0.95;
const STEPS = [0, 5, 10, 15, 20];

function reliability(step: number) {
  return PER_STEP ** step;
}

function xForStep(step: number) {
  return PLOT.x + (step / 20) * PLOT.w;
}

function yForReliability(value: number) {
  return PLOT.y + (1 - value) * PLOT.h;
}

function curvePath() {
  return Array.from({ length: 81 }, (_, index) => index / 4)
    .map(
      (step, index) =>
        `${index ? 'L' : 'M'} ${xForStep(step)} ${yForReliability(reliability(step))}`
    )
    .join(' ');
}

function PercentMarker({ step }: { step: number }) {
  const value = reliability(step);
  return (
    <g>
      <circle
        cx={xForStep(step)}
        cy={yForReliability(value)}
        r="4"
        fill="var(--visual-indigo)"
      />
      <text
        x={xForStep(step)}
        y={yForReliability(value) - 12}
        textAnchor="middle"
        fontFamily="var(--font-mono-keyword)"
        fontSize="var(--text-xs)"
        fontWeight="700"
        fill="var(--visual-indigo)"
      >
        {(value * 100).toFixed(step === 0 ? 0 : 1)}%
      </text>
    </g>
  );
}

export default function AgentReliabilityDecayCurve() {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      role="img"
      aria-label="Simplified exponential model of reliability decay. Assuming every dependent step succeeds independently with the same 95 percent probability, full-task reliability follows R of n equals 0.95 to the power n and falls from 100 percent at zero steps to 35.8 percent at twenty steps."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <rect
        x="8"
        y="8"
        width={WIDTH - 16}
        height={HEIGHT - 16}
        fill="var(--surface-page)"
        stroke="var(--border-subtle)"
      />
      <text
        x="48"
        y="48"
        fontFamily="var(--font-display)"
        fontSize="var(--text-xl)"
        fontWeight="700"
        fill="var(--text-heading)"
      >
        A smooth model of compounding risk
      </text>
      <text
        x="856"
        y="48"
        textAnchor="end"
        fontFamily="var(--font-mono-spec)"
        fontSize="var(--text-lg)"
        fontWeight="700"
        fill="var(--visual-indigo)"
      >
        R(n) = 0.95ⁿ
      </text>

      {[1, 0.75, 0.5, 0.25, 0].map((value) => (
        <g key={value}>
          <line
            x1={PLOT.x}
            y1={yForReliability(value)}
            x2={PLOT.x + PLOT.w}
            y2={yForReliability(value)}
            stroke="var(--border-subtle)"
            strokeDasharray={value ? '3 5' : undefined}
          />
          <text
            x={PLOT.x - 16}
            y={yForReliability(value) + 4}
            textAnchor="end"
            fontFamily="var(--font-mono-keyword)"
            fontSize="var(--text-xs)"
            fill="var(--text-muted)"
          >
            {value * 100}%
          </text>
        </g>
      ))}

      {STEPS.map((step) => (
        <g key={step}>
          <line
            x1={xForStep(step)}
            y1={PLOT.y}
            x2={xForStep(step)}
            y2={PLOT.y + PLOT.h}
            stroke="var(--border-subtle)"
            strokeDasharray="3 5"
          />
          <text
            x={xForStep(step)}
            y={PLOT.y + PLOT.h + 24}
            textAnchor="middle"
            fontFamily="var(--font-mono-keyword)"
            fontSize="var(--text-xs)"
            fill="var(--text-muted)"
          >
            {step}
          </text>
          <PercentMarker step={step} />
        </g>
      ))}

      <path
        d={curvePath()}
        fill="none"
        stroke="var(--visual-indigo)"
        strokeWidth="var(--stroke-accent)"
        strokeLinecap="butt"
      />
      <text
        x={PLOT.x + PLOT.w / 2}
        y="376"
        textAnchor="middle"
        fontFamily="var(--font-mono-keyword)"
        fontSize="var(--text-xs)"
        fill="var(--text-muted)"
      >
        dependent transformations →
      </text>
    </svg>
  );
}
