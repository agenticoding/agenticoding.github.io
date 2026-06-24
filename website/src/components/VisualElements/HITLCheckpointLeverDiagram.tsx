import React, { useId } from 'react';

import type { PresentationAwareProps } from '@site/src/components/PresentationMode/types';
import { OperatorNode } from './ActorNodes';
import { Arrow, G, Marker, Step, TextLine, svgStyle } from './ReliabilityLeverPrimitives';

const W = 920;
const H = 360;
const Y = 176;
const STEP_W = 144;
const PLAN_X = 72;
const CHECK_X = 330;
const EXEC_X = 480;
const RESET_X = 688;

function Checkpoint() {
  return (
    <g>
      <line x1={CHECK_X} y1={96} x2={CHECK_X} y2={272} stroke="var(--visual-warning)" strokeWidth="var(--stroke-accent)" strokeLinecap="square" />
      <OperatorNode x={CHECK_X - 24} y={56} size={48} />
      <TextLine x={CHECK_X} y={300} tone="var(--visual-warning)" weight={700} family="var(--font-mono-human)" anchor="middle">human checkpoint</TextLine>
    </g>
  );
}

export default function HITLCheckpointLeverDiagram({ compact = false }: PresentationAwareProps = {}) {
  const uid = useId().replace(/:/g, '');
  const errorMarker = `hitl-error-${uid}`;
  const successMarker = `hitl-success-${uid}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" role="img" aria-label="Human in the loop checkpoint diagram: a flawed plan would contaminate execution through a red propagation path, but a human checkpoint blocks it and creates a green reset path into validated execution, reducing failure stickiness S." xmlns="http://www.w3.org/2000/svg" style={svgStyle(compact, W)}>
      <defs><Marker id={errorMarker} tone="var(--visual-error)" /><Marker id={successMarker} tone="var(--visual-success)" /></defs>
      <rect x={G} y={G} width={W - G * 2} height={H - G * 2} rx={0} fill="var(--surface-page)" stroke="var(--border-subtle)" />
      <TextLine x={56} y={48} tone="var(--text-heading)" size="var(--text-lg)" weight={700} family="var(--font-display)">HITL checkpoints lower stickiness S</TextLine>
      <Step x={PLAN_X} y={Y} w={STEP_W} label="plan" detail="missed constraint" tone="var(--visual-error)" fill="var(--visual-bg-error)" angular />
      <Checkpoint />
      <Step x={EXEC_X} y={Y} w={STEP_W} label="execution" detail="would inherit" tone="var(--visual-error)" fill="var(--visual-bg-error)" angular />
      <line x1={PLAN_X + STEP_W} y1={Y + G * 3.5} x2={CHECK_X - 16} y2={Y + G * 3.5} stroke="var(--visual-error)" strokeWidth="var(--stroke-heavy)" strokeLinecap="square" />
      <line x1={CHECK_X - 16} y1={Y + G * 1.5} x2={CHECK_X - 16} y2={Y + G * 5.5} stroke="var(--visual-error)" strokeWidth="var(--stroke-heavy)" strokeLinecap="square" />
      <TextLine x={272} y={144} tone="var(--visual-error)" family="var(--font-mono-keyword)" anchor="middle">blocked</TextLine>
      <Arrow x1={CHECK_X} y1={128} x2={RESET_X} y2={128} tone="var(--visual-success)" markerId={successMarker} />
      <Step x={RESET_X} y={Y - 76} w={160} label="validated" detail="fresh start" tone="var(--visual-success)" fill="var(--visual-bg-success)" />
      <Arrow x1={RESET_X + 80} y1={Y - 20} x2={RESET_X + 80} y2={Y} tone="var(--visual-success)" markerId={successMarker} />
      <Step x={RESET_X} y={Y} w={160} label="execution" detail="reset state" tone="var(--visual-success)" fill="var(--visual-bg-success)" />
      <TextLine x={W / 2} y={328} tone="var(--visual-warning)" weight={700} family="var(--font-mono-spec)" anchor="middle">small review surface prevents large downstream cascade</TextLine>
    </svg>
  );
}
