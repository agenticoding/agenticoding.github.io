import React, { useId } from 'react';

import type { PresentationAwareProps } from '@site/src/components/PresentationMode/types';
import { Arrow, G, Marker, Noise, Step, TextLine, svgStyle } from './ReliabilityLeverPrimitives';

const W = 920;
const H = 360;
const CHAIN_Y = 208;
const STEP_W = 128;
const BUNDLE = { x: 56, y: 88, w: 224, h: 144 };
const STEPS = [
  { x: 360, label: 'pattern', detail: 'middleware' },
  { x: 528, label: 'client', detail: 'Redis' },
  { x: 696, label: 'limit', detail: 'API shape' },
];
const FACTS = ['middleware pattern', 'Redis abstraction', 'error contract'];

function ContextBundle() {
  return (
    <g>
      <rect x={BUNDLE.x} y={BUNDLE.y} width={BUNDLE.w} height={BUNDLE.h} rx={0} fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)" />
      <TextLine x={BUNDLE.x + G * 3} y={BUNDLE.y + G * 4} tone="var(--visual-indigo)" weight={700} family="var(--font-display)">relevant context</TextLine>
      {FACTS.map((fact, i) => <TextLine key={fact} x={BUNDLE.x + G * 4} y={BUNDLE.y + G * (7 + i * 2.6)} tone="var(--text-body)" family="var(--font-mono-keyword)">• {fact}</TextLine>)}
    </g>
  );
}

export default function ContextQualityLeverDiagram({ compact = false }: PresentationAwareProps = {}) {
  const uid = useId().replace(/:/g, '');
  const markerId = `context-quality-${uid}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" role="img" aria-label="Context quality lever diagram: a compact bundle of relevant facts feeds the rate-limiting task chain while irrelevant noisy context stays outside, raising the baseline reliability R for each step." xmlns="http://www.w3.org/2000/svg" style={svgStyle(compact, W)}>
      <defs><Marker id={markerId} tone="var(--visual-indigo)" /></defs>
      <rect x={G} y={G} width={W - G * 2} height={H - G * 2} rx={0} fill="var(--surface-page)" stroke="var(--border-subtle)" />
      <TextLine x={56} y={48} tone="var(--text-heading)" size="var(--text-lg)" weight={700} family="var(--font-display)">Context quality raises baseline R</TextLine>
      <ContextBundle />
      <Noise x={72} y={256} label="irrelevant history" />
      <Noise x={624} y={72} label="stale notes" />
      <Arrow x1={BUNDLE.x + BUNDLE.w} y1={160} x2={STEPS[0].x} y2={CHAIN_Y + G * 3.5} tone="var(--visual-indigo)" markerId={markerId} />
      {STEPS.map((step) => <Step key={step.label} x={step.x} y={CHAIN_Y} w={STEP_W} label={step.label} detail={step.detail} tone="var(--visual-indigo)" fill="var(--surface-raised)" />)}
      <Arrow x1={488} y1={CHAIN_Y + G * 3.5} x2={528} y2={CHAIN_Y + G * 3.5} tone="var(--visual-indigo)" markerId={markerId} />
      <Arrow x1={656} y1={CHAIN_Y + G * 3.5} x2={696} y2={CHAIN_Y + G * 3.5} tone="var(--visual-indigo)" markerId={markerId} />
      <TextLine x={616} y={328} tone="var(--visual-indigo)" weight={700} family="var(--font-mono-spec)" anchor="middle">less noise → higher R per step</TextLine>
    </svg>
  );
}
