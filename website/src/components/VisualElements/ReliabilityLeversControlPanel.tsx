import React, { useId } from 'react';

import type { PresentationAwareProps } from '@site/src/components/PresentationMode/types';
import { Arrow, Card, G, Marker, TextLine, svgStyle } from './ReliabilityLeverPrimitives';

const W = 920;
const H = 448;
const CARD_W = 368;
const CARD_H = 136;
const LEFT = 72;
const RIGHT = 480;
const TOP = 104;
const BOTTOM = 264;

const levers = [
  { x: LEFT, y: TOP, title: 'Context quality', tone: 'var(--visual-indigo)', lines: ['Raises baseline step reliability', 'by loading the right facts.'], varLabel: 'R ↑' },
  { x: RIGHT, y: TOP, title: 'Orchestration', tone: 'var(--visual-cyan)', lines: ['Changes step hardness and', 'dependency shape.'], varLabel: 'N / deps' },
  { x: LEFT, y: BOTTOM, title: 'Sampling', tone: 'var(--visual-violet)', lines: ['Runs independent attempts, then', 'uses a judge to select.'], varLabel: 'R_eff ↑' },
  { x: RIGHT, y: BOTTOM, title: 'HITL checkpoints', tone: 'var(--visual-warning)', lines: ['Stops bad state from carrying', 'into the next phase.'], varLabel: 'S ↓' },
];

function VariableBadge({ x, y, label, tone }: { x: number; y: number; label: string; tone: string }) {
  return (
    <g>
      <rect x={x} y={y} width={G * 13} height={G * 6} rx={0} fill="var(--surface-page)" stroke={tone} strokeWidth="var(--stroke-light)" />
      <TextLine x={x + G * 6.5} y={y + G * 3.7} tone={tone} size="var(--text-sm)" weight={700} family="var(--font-mono-spec)" anchor="middle">{label}</TextLine>
    </g>
  );
}

export default function ReliabilityLeversControlPanel({ compact = false }: PresentationAwareProps = {}) {
  const uid = useId().replace(/:/g, '');
  const markerId = `levers-panel-${uid}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" role="img" aria-label="Reliability levers control panel: context quality raises R, orchestration changes step hardness and dependencies, sampling raises effective reliability R eff, and human checkpoints reduce failure stickiness S." xmlns="http://www.w3.org/2000/svg" style={svgStyle(compact, W)}>
      <defs><Marker id={markerId} tone="var(--visual-neutral)" /></defs>
      <rect x={G} y={G} width={W - G * 2} height={H - G * 2} rx={0} fill="var(--surface-page)" stroke="var(--border-subtle)" />
      <TextLine x={W / 2} y={48} tone="var(--text-heading)" size="var(--text-lg)" weight={700} family="var(--font-display)" anchor="middle">Four independent reliability controls</TextLine>
      <TextLine x={W / 2} y={72} tone="var(--text-muted)" family="var(--font-body)" anchor="middle">Each lever changes a different variable in the system.</TextLine>
      {levers.map((lever) => <Card key={lever.title} x={lever.x} y={lever.y} w={CARD_W} h={CARD_H} title={lever.title} lines={lever.lines} tone={lever.tone} />)}
      {levers.map((lever) => <VariableBadge key={lever.varLabel} x={lever.x + CARD_W - G * 17} y={lever.y + G * 4} label={lever.varLabel} tone={lever.tone} />)}
      <Arrow x1={W / 2 - G * 8} y1={224} x2={W / 2 + G * 8} y2={224} tone="var(--visual-neutral)" markerId={markerId} />
      <TextLine x={W / 2} y={224 + G * 7} tone="var(--text-muted)" family="var(--font-mono-keyword)" anchor="middle">combine deliberately</TextLine>
    </svg>
  );
}
