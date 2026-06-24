import React, { type ReactNode, useId } from 'react';

import { AgentNode, OperatorNode } from './ActorNodes';
import styles from './OwnershipBoundaryDiagram.module.css';

const DESKTOP = { w: 720, h: 384, cardW: 144, cardH: 104 } as const;
const DESKTOP_X = { intent: 40, agent: 40, candidate: 248, gate: 328, result: 504 } as const;
const DESKTOP_Y = { top: 96, bottom: 244, result: 112 } as const;
const MOBILE = { w: 360, h: 812, cardX: 36, cardW: 288, cardH: 104 } as const;
const MOBILE_Y = { intent: 92, agent: 244, candidate: 380, gate: 536, result: 688 } as const;
const MARKER_SIZE = 6;

const MARKER_TONES = ['neutral', 'violet', 'success'] as const;

type CardProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  tone?: string;
  children: ReactNode;
};
type TextLineProps = {
  x: number;
  y: number;
  className: string;
  children: ReactNode;
};
type ActorCardProps = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ArrowProps = {
  d: string;
  markerId: string;
  tone?: string;
  className?: string;
};

function TextLine({ x, y, className, children }: TextLineProps) {
  return (
    <text x={x} y={y} className={className} textAnchor="middle">
      {children}
    </text>
  );
}

function Card({ x, y, width, height, tone, children }: CardProps) {
  const style = {
    fill: tone ? `var(--visual-bg-${tone})` : 'var(--surface-raised)',
    stroke: tone ? `var(--visual-${tone})` : 'var(--border-default)',
  };
  return (
    <g>
      <rect className={styles.card} x={x} y={y} width={width} height={height} rx={0} style={style} />
      {children}
    </g>
  );
}

function Arrow({ d, markerId, tone = 'neutral', className = styles.flow }: ArrowProps) {
  return <path className={className} d={d} stroke={`var(--visual-${tone})`} markerEnd={`url(#${markerId}-${tone})`} />;
}

function SectionDivider({ y, mobile = false }: { y: number; mobile?: boolean }) {
  return <line x1={mobile ? 36 : 24} y1={y} x2={mobile ? 324 : 696} y2={y} className={styles.sectionDivider} aria-hidden="true" />;
}

function LaneLabel({ x, y, children }: Omit<TextLineProps, 'className'>) {
  return (
    <text x={x} y={y} className={styles.laneLabel} textAnchor="start">
      {children}
    </text>
  );
}

function IntentCard({ x, y, width, height }: ActorCardProps) {
  const iconX = x + (width - 40) / 2;
  const cx = x + width / 2;
  return (
    <Card x={x} y={y} width={width} height={height}>
      <OperatorNode x={iconX} y={y + 14} size={40} />
      <TextLine x={cx} y={y + height - 30} className={styles.title}>operator intent</TextLine>
      <TextLine x={cx} y={y + height - 12} className={styles.human}>task + constraints</TextLine>
    </Card>
  );
}

function AgentCard({ x, y, width, height }: ActorCardProps) {
  const iconX = x + (width - 40) / 2;
  const cx = x + width / 2;
  return (
    <Card x={x} y={y} width={width} height={height} tone="magenta">
      <AgentNode x={iconX} y={y + 14} size={40} />
      <TextLine x={cx} y={y + height - 30} className={styles.title}>LLM / agent</TextLine>
      <TextLine x={cx} y={y + height - 12} className={styles.ai}>generates candidate</TextLine>
    </Card>
  );
}

function CandidateCard({ x, y, width, height }: Omit<CardProps, 'children'>) {
  const cx = x + width / 2;
  return (
    <g className={styles.candidateCheckpoint}>
      <Card x={x} y={y} width={width} height={height} tone="violet">
        <TextLine x={cx} y={y + 26} className={styles.title}>candidate work</TextLine>
        <rect className={styles.candidatePrimaryLine} x={cx - 44} y={y + 42} width="88" height="6" rx={0} fill="var(--visual-violet)" />
        <rect className={styles.candidateSecondaryLine} x={cx - 36} y={y + 58} width="72" height="4" rx={0} fill="var(--text-muted)" />
        <rect className={styles.candidateSecondaryLine} x={cx - 28} y={y + 72} width="56" height="4" rx={0} fill="var(--text-muted)" />
        <TextLine x={cx} y={y + height - 14} className={styles.body}>plausible ≠ proven</TextLine>
      </Card>
    </g>
  );
}

function JudgmentGate({ x, y, width, height }: Omit<CardProps, 'children'>) {
  const cx = x + width / 2;
  return (
    <g className={styles.gateCheckpoint}>
      <Card x={x} y={y} width={width} height={height}>
        <TextLine x={cx} y={y + 26} className={styles.title}>judgment gate</TextLine>
        <TextLine x={cx} y={y + 50} className={styles.check}>✓ pattern fit</TextLine>
        <TextLine x={cx} y={y + 70} className={`${styles.check} ${styles.validationDetail}`}>✓ validation</TextLine>
        <TextLine x={cx} y={y + height - 14} className={styles.human}>human-owned</TextLine>
      </Card>
    </g>
  );
}

function OwnedResult({ x, y, width }: { x: number; y: number; width: number }) {
  const cx = x + width / 2;
  return (
    <g className={styles.acceptedCheckpoint}>
      <rect className={styles.acceptedCard} x={x} y={y} width={width} height="72" rx={0} fill="var(--visual-bg-success)" stroke="var(--visual-success)" />
      <TextLine x={cx} y={y + 26} className={styles.title}>accepted result</TextLine>
      <TextLine x={cx} y={y + 46} className={styles.success}>shipped by human</TextLine>
      <TextLine x={cx} y={y + 62} className={styles.success}>responsibility</TextLine>
    </g>
  );
}

function CheckpointTrace({ d, className }: { d: string; className: string }) {
  return <path className={`${styles.checkpointTrace} ${className}`} d={d} pathLength="100" />;
}

function CheckpointMotion({ variant }: { variant: 'desktop' | 'mobile' }) {
  const paths = variant === 'desktop'
    ? ['M 112 200 C 112 216, 112 228, 112 240', 'M 184 296 C 204 296, 224 296, 244 296', 'M 356 244 C 356 226, 400 226, 400 214 L 400 202', 'M 472 148 C 480 148, 490 148, 500 148']
    : ['M 180 196 C 180 212, 180 228, 180 240', 'M 180 348 C 180 360, 180 368, 180 376', 'M 180 484 C 180 504, 180 520, 180 532', 'M 180 640 C 180 656, 180 672, 180 684'];
  return (
    <g className={styles.checkpointMotion} aria-hidden="true">
      <CheckpointTrace d={paths[0]} className={styles.traceDelegated} />
      <CheckpointTrace d={paths[1]} className={styles.traceGenerated} />
      <CheckpointTrace d={paths[2]} className={styles.traceToGate} />
      <CheckpointTrace d={paths[3]} className={styles.traceAccepted} />
    </g>
  );
}

function Markers({ markerId }: { markerId: string }) {
  return (
    <defs>
      {MARKER_TONES.map((tone) => <Marker key={tone} id={`${markerId}-${tone}`} tone={tone} />)}
    </defs>
  );
}

function DesktopDiagram({ markerId }: { markerId: string }) {
  const { w, h, cardW, cardH } = DESKTOP;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="auto" role="img" aria-label="An operator-owned workflow contains a human responsibility lane and an LLM execution lane. The agent generates candidate work, but the work returns to human judgment before it becomes an accepted result." className={styles.desktopDiagram} xmlns="http://www.w3.org/2000/svg">
      <Markers markerId={markerId} />
      <text x="360" y="34" className={styles.label} textAnchor="middle">candidate work becomes owned only in the operator lane</text>
      <LaneLabel x={40} y={80}>human/operator responsibility</LaneLabel>
      <SectionDivider y={220} />
      <LaneLabel x={200} y={236}>LLM/agent execution</LaneLabel>
      <IntentCard x={DESKTOP_X.intent} y={DESKTOP_Y.top} width={cardW} height={cardH} />
      <JudgmentGate x={DESKTOP_X.gate} y={DESKTOP_Y.top} width={cardW} height={cardH} />
      <OwnedResult x={DESKTOP_X.result} y={DESKTOP_Y.result} width={176} />
      <AgentCard x={DESKTOP_X.agent} y={DESKTOP_Y.bottom} width={cardW} height={cardH} />
      <CandidateCard x={DESKTOP_X.candidate} y={DESKTOP_Y.bottom} width={cardW} height={cardH} />
      <Arrow d="M 112 200 C 112 216, 112 228, 112 240" markerId={markerId} />
      <Arrow d="M 184 296 C 204 296, 224 296, 244 296" markerId={markerId} tone="violet" />
      <Arrow d="M 356 244 C 356 226, 400 226, 400 214 L 400 202" markerId={markerId} tone="violet" />
      <Arrow d="M 472 148 C 480 148, 490 148, 500 148" markerId={markerId} tone="success" />
      <CheckpointMotion variant="desktop" />
    </svg>
  );
}

function MobileDiagram({ markerId }: { markerId: string }) {
  const { w, h, cardX, cardW, cardH } = MOBILE;
  const cx = w / 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="auto" role="img" aria-label="An operator-owned workflow contains human responsibility zones and an LLM execution zone. The agent generates candidate work, but the work returns to human judgment before it becomes an accepted result." className={styles.mobileDiagram} xmlns="http://www.w3.org/2000/svg">
      <Markers markerId={`${markerId}-m`} />
      <text x={cx} y="26" className={styles.label} textAnchor="middle">owned work returns to the operator lane</text>
      <LaneLabel x={40} y={80}>human/operator responsibility</LaneLabel>
      <SectionDivider y={220} mobile />
      <LaneLabel x={40} y={236}>LLM/agent execution</LaneLabel>
      <SectionDivider y={512} mobile />
      <LaneLabel x={40} y={528}>human judgment</LaneLabel>
      <IntentCard x={cardX} y={MOBILE_Y.intent} width={cardW} height={cardH} />
      <AgentCard x={cardX} y={MOBILE_Y.agent} width={cardW} height={cardH} />
      <CandidateCard x={cardX} y={MOBILE_Y.candidate} width={cardW} height={cardH} />
      <JudgmentGate x={cardX} y={MOBILE_Y.gate} width={cardW} height={cardH} />
      <OwnedResult x={cardX} y={MOBILE_Y.result} width={cardW} />
      <Arrow d="M 180 196 C 180 212, 180 228, 180 240" markerId={`${markerId}-m`} />
      <Arrow d="M 180 348 C 180 360, 180 368, 180 376" markerId={`${markerId}-m`} tone="violet" />
      <Arrow d="M 180 484 C 180 504, 180 520, 180 532" markerId={`${markerId}-m`} tone="violet" />
      <Arrow d="M 180 640 C 180 656, 180 672, 180 684" markerId={`${markerId}-m`} tone="success" />
      <CheckpointMotion variant="mobile" />
    </svg>
  );
}

export default function OwnershipBoundaryDiagram() {
  const markerId = useId().replace(/:/g, '');
  return (
    <div className={styles.diagram}>
      <DesktopDiagram markerId={markerId} />
      <MobileDiagram markerId={markerId} />
    </div>
  );
}

function Marker({ id, tone }: { id: string; tone: string }) {
  return (
    <marker id={id} markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE} refX="5" refY="3" orient="auto">
      <polygon points="0 0, 6 3, 0 6" fill={`var(--visual-${tone})`} />
    </marker>
  );
}
