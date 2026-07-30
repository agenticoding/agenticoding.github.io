import React, { useId } from 'react';

const WIDTH = 920;
const HEIGHT = 424;
const PLOT = { x: 88, y: 88, w: 768, h: 248 };
const POINTS = [1, 0.96, 0.955, 0.9, 0.89, 0.86, 0.63, 0.61, 0.35];

function xForStep(step: number) {
  return PLOT.x + (step / (POINTS.length - 1)) * PLOT.w;
}

function yForReliability(value: number) {
  return PLOT.y + (1 - value) * PLOT.h;
}

function pathFor(values: number[], startStep = 0) {
  return values
    .map(
      (value, index) =>
        `${index ? 'L' : 'M'} ${xForStep(index + startStep)} ${yForReliability(value)}`
    )
    .join(' ');
}

function Annotation({
  step,
  label,
  detail,
  tone,
}: {
  step: number;
  label: string;
  detail: string;
  tone: string;
}) {
  const x = xForStep(step);
  const y = yForReliability(POINTS[step]);
  return (
    <g>
      <line
        x1={x}
        y1={y + 8}
        x2={x}
        y2={y + 48}
        stroke={tone}
        strokeWidth="var(--stroke-light)"
      />
      <text
        x={x}
        y={y + 68}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="var(--text-sm)"
        fontWeight="700"
        fill={tone}
      >
        {label}
      </text>
      <text
        x={x}
        y={y + 88}
        textAnchor="middle"
        fontFamily="var(--font-mono-keyword)"
        fontSize="var(--text-xs)"
        fill="var(--text-muted)"
      >
        {detail}
      </text>
    </g>
  );
}

export default function UnevenReliabilityDecay() {
  const uid = useId().replace(/:/g, '');
  const baseline = POINTS.map((_, step) => 0.95 ** step);
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      role="img"
      aria-label="Comparison of a dashed smooth reliability baseline with an uneven monotonic real-run trajectory. Routine transformations form plateaus, an ambiguous decision causes a small loss, and a sticky mistaken premise causes a cascading drop across later dependent steps."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        <clipPath id={`uneven-clip-${uid}`}>
          <rect x={PLOT.x} y={PLOT.y} width={PLOT.w} height={PLOT.h} />
        </clipPath>
      </defs>
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
        Real decay is uneven and correlated
      </text>
      <line
        x1="584"
        y1="44"
        x2="632"
        y2="44"
        stroke="var(--visual-indigo)"
        strokeDasharray="6 6"
      />
      <text
        x="640"
        y="48"
        fontFamily="var(--font-body)"
        fontSize="var(--text-xs)"
        fill="var(--text-muted)"
      >
        smooth baseline
      </text>
      <line
        x1="752"
        y1="44"
        x2="800"
        y2="44"
        stroke="var(--visual-neutral)"
        strokeWidth="var(--stroke-heavy)"
      />
      <text
        x="808"
        y="48"
        fontFamily="var(--font-body)"
        fontSize="var(--text-xs)"
        fill="var(--text-muted)"
      >
        observed run
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

      <g clipPath={`url(#uneven-clip-${uid})`}>
        <path
          d={pathFor(baseline)}
          fill="none"
          stroke="var(--visual-indigo)"
          strokeWidth="var(--stroke-default)"
          strokeDasharray="6 6"
        />
        <path
          d={pathFor(POINTS)}
          fill="none"
          stroke="var(--visual-neutral)"
          strokeWidth="var(--stroke-heavy)"
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />
        <path
          d={pathFor(POINTS.slice(2, 5), 2)}
          fill="none"
          stroke="var(--visual-warning)"
          strokeWidth="var(--stroke-accent)"
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />
        <path
          d={pathFor(POINTS.slice(5), 5)}
          fill="none"
          stroke="var(--visual-error)"
          strokeWidth="var(--stroke-accent)"
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />
      </g>
      {POINTS.map((value, step) => (
        <rect
          key={step}
          x={xForStep(step) - 3}
          y={yForReliability(value) - 3}
          width="6"
          height="6"
          fill={step >= 6 ? 'var(--visual-error)' : 'var(--visual-neutral)'}
        />
      ))}

      <Annotation
        step={1}
        label="routine"
        detail="plateau"
        tone="var(--visual-neutral)"
      />
      <Annotation
        step={3}
        label="ambiguous"
        detail="small loss"
        tone="var(--visual-warning)"
      />
      <Annotation
        step={6}
        label="sticky premise"
        detail="cascading drop"
        tone="var(--visual-error)"
      />
      <text
        x={PLOT.x + PLOT.w / 2}
        y="400"
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
