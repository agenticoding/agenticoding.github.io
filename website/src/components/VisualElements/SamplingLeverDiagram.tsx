import React, { useId } from 'react';

import { Arrow, G, Marker, Step, TextLine, svgStyle } from './ReliabilityLeverPrimitives';

const W = 920;
const H = 384;
const LANE_X = 248;
const JUDGE_X = 632;
const STEP_W = 192;
const LANES = [
  { y: 104, label: 'candidate A', detail: 'fresh context' },
  { y: 184, label: 'candidate B', detail: 'fresh context' },
  { y: 264, label: 'candidate C', detail: 'fresh context' },
];

function JudgeGate() {
  return (
    <g>
      <rect x={JUDGE_X} y={152} width={152} height={104} rx={0} fill="var(--surface-raised)" stroke="var(--visual-violet)" />
      <TextLine x={JUDGE_X + 76} y={192} tone="var(--visual-violet)" size="var(--text-sm)" weight={700} family="var(--font-display)" anchor="middle">judge</TextLine>
      <TextLine x={JUDGE_X + 76} y={216} tone="var(--text-muted)" family="var(--font-mono-keyword)" anchor="middle">tests / review</TextLine>
    </g>
  );
}

export default function SamplingLeverDiagram() {
  const uid = useId().replace(/:/g, '');
  const markerId = `sampling-${uid}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Sampling lever diagram: one noisy implementation step splits into three independent candidate lanes, then an independent judge selects a passing result, increasing effective reliability R eff." xmlns="http://www.w3.org/2000/svg" style={svgStyle(W)}>
      <defs><Marker id={markerId} tone="var(--visual-violet)" /></defs>
      <rect x={G} y={G} width={W - G * 2} height={H - G * 2} rx={0} fill="var(--surface-page)" stroke="var(--border-subtle)" />
      <TextLine x={56} y={48} tone="var(--text-heading)" size="var(--text-lg)" weight={700} family="var(--font-display)">Sampling raises effective reliability</TextLine>
      <Step x={56} y={176} w={128} label="noisy step" detail="implementation" tone="var(--visual-warning)" fill="var(--visual-bg-warning)" angular />
      {LANES.map((lane) => <Step key={lane.label} x={LANE_X} y={lane.y} w={STEP_W} label={lane.label} detail={lane.detail} tone="var(--visual-violet)" fill="var(--visual-bg-violet)" />)}
      {LANES.map((lane) => <Arrow key={lane.label} x1={184} y1={204} x2={LANE_X} y2={lane.y + G * 3.5} tone="var(--visual-violet)" markerId={markerId} />)}
      <JudgeGate />
      {LANES.map((lane) => <Arrow key={`${lane.label}-judge`} x1={LANE_X + STEP_W} y1={lane.y + G * 3.5} x2={JUDGE_X} y2={204} tone="var(--visual-violet)" markerId={markerId} />)}
      <Arrow x1={JUDGE_X + 152} y1={204} x2={848} y2={204} tone="var(--visual-success)" markerId={markerId} />
      <TextLine x={840} y={192} tone="var(--visual-success)" weight={700} family="var(--font-mono-spec)" anchor="middle">R_eff ↑</TextLine>
      <TextLine x={W / 2} y={344} tone="var(--text-muted)" family="var(--font-mono-keyword)" anchor="middle">benefit depends on independent attempts and a trustworthy judge</TextLine>
    </svg>
  );
}
