import React, { useId } from 'react';

import type { PresentationAwareProps } from '@site/src/components/PresentationMode/types';
import { Arrow, G, Marker, Step, TextLine, svgStyle } from './ReliabilityLeverPrimitives';

const W = 920;
const H = 432;
const BAD_Y = 104;
const GOOD_Y = 272;
const STEP_W = 128;
const GOOD_STEPS = [
  { x: 160, label: 'inspect', detail: 'patterns' },
  { x: 328, label: 'locate', detail: 'Redis' },
  { x: 496, label: 'implement', detail: 'limiter' },
  { x: 664, label: 'validate', detail: 'tests' },
];

function TooCoarse() {
  return (
    <g>
      <rect x={160} y={BAD_Y} width={600} height={80} rx={0} fill="var(--visual-bg-warning)" stroke="var(--visual-warning)" strokeWidth="var(--stroke-light)" />
      <TextLine x={184} y={BAD_Y + 34} tone="var(--visual-warning)" size="var(--text-sm)" weight={700} family="var(--font-display)">too coarse: “implement rate limiting”</TextLine>
      <TextLine x={184} y={BAD_Y + 58} tone="var(--text-muted)" family="var(--font-mono-keyword)">one oversized step pushes past model capability</TextLine>
    </g>
  );
}

export default function OrchestrationLeverDiagram({ compact = false }: PresentationAwareProps = {}) {
  const uid = useId().replace(/:/g, '');
  const markerId = `orchestration-${uid}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" role="img" aria-label="Orchestration lever diagram: an oversized single rate-limiting task is risky, while a capability-sized chain of inspect, locate, implement, and validate steps changes step hardness without creating unnecessary dependencies." xmlns="http://www.w3.org/2000/svg" style={svgStyle(compact, W)}>
      <defs><Marker id={markerId} tone="var(--visual-cyan)" /></defs>
      <rect x={G} y={G} width={W - G * 2} height={H - G * 2} rx={0} fill="var(--surface-page)" stroke="var(--border-subtle)" />
      <TextLine x={56} y={48} tone="var(--text-heading)" size="var(--text-lg)" weight={700} family="var(--font-display)">Orchestration changes work shape</TextLine>
      <TextLine x={96} y={BAD_Y + 48} tone="var(--visual-warning)" weight={700} family="var(--font-mono-keyword)" anchor="middle">too hard</TextLine>
      <TooCoarse />
      <TextLine x={96} y={GOOD_Y + 36} tone="var(--visual-cyan)" weight={700} family="var(--font-mono-keyword)" anchor="middle">bounded</TextLine>
      {GOOD_STEPS.map((step) => <Step key={step.label} x={step.x} y={GOOD_Y} w={STEP_W} label={step.label} detail={step.detail} tone="var(--visual-cyan)" fill="var(--visual-bg-cyan)" />)}
      {GOOD_STEPS.slice(0, -1).map((step, i) => <Arrow key={step.label} x1={step.x + STEP_W} y1={GOOD_Y + G * 3.5} x2={GOOD_STEPS[i + 1].x} y2={GOOD_Y + G * 3.5} tone="var(--visual-cyan)" markerId={markerId} />)}
      <TextLine x={496} y={224} tone="var(--text-muted)" family="var(--font-body)" anchor="middle">parallel research when independent</TextLine>
      <path d="M 328 248 C 392 228, 600 228, 664 248" fill="none" stroke="var(--border-default)" strokeWidth="var(--stroke-light)" strokeDasharray="5 5" />
      <TextLine x={W / 2} y={392} tone="var(--visual-cyan)" weight={700} family="var(--font-mono-spec)" anchor="middle">fewer dependent hard steps → stronger chain</TextLine>
    </svg>
  );
}
