import React from 'react';
import { OperatorNode } from './ActorNodes';
import { DiagramArrow, DiagramArrowMarkers } from './DiagramArrow';
import { DiagramTile } from './DiagramTile';
import { TokenArrowTrain } from './TokenArrowTrain';
import type { TokenSequence } from './AnimatedTokenFlow';
import {
  WORKFLOW_FLOW_TIMING,
  WORKFLOW_TOKEN_STAGGER,
  WorkflowLoopGraphic,
} from './WorkflowLoopGraphic';
import styles from './SpecExecutionRunsDiagram.module.css';

const ARIA_LABEL =
  'A human approves one stable feature spec. The spec guides repeated bounded runs through Grounding, Plan, Execute, and Validation, which returns current code to Grounding.';
const SPEC_TOKENS = [
  { modality: 'text', signal: 'compressed' },
  { modality: 'code', signal: 'salient' },
] as const satisfies TokenSequence;

type Layout = { x: number; y: number; width: number; height: number };

export default function SpecExecutionRunsDiagram() {
  return (
    <div className={styles.container}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}

function DesktopDiagram() {
  return (
    <svg
      className={`${styles.diagram} ${styles.desktopDiagram}`}
      viewBox="0 0 760 624"
      role="img"
      aria-label={ARIA_LABEL}
    >
      <DiagramArrowMarkers
        prefix="spec-runs-desktop"
        tones={['neutral', 'success']}
      />
      <DesktopApproval markerIdPrefix="spec-runs-desktop" />
      <SpecFlow d="M 428 120 V 160 H 380 V 208" />
      <WorkflowLoopGraphic
        transform="translate(0 160)"
        returnLabel="current code"
      />
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg
      className={`${styles.diagram} ${styles.mobileDiagram}`}
      viewBox="0 0 360 830"
      role="img"
      aria-label={ARIA_LABEL}
    >
      <DiagramArrowMarkers
        prefix="spec-runs-mobile"
        tones={['neutral', 'success']}
      />
      <MobileApproval markerIdPrefix="spec-runs-mobile" />
      <SpecFlow d="M 180 200 V 238" />
      <WorkflowLoopGraphic
        layout="mobile"
        transform="translate(0 190)"
        returnLabel="current code"
      />
    </svg>
  );
}

function DesktopApproval({ markerIdPrefix }: { markerIdPrefix: string }) {
  return (
    <>
      <OperatorNode x={40} y={60} size={40} />
      <DiagramArrow
        d="M 80 80 H 104"
        markerIdPrefix={markerIdPrefix}
        tone="neutral"
      />
      <ApprovalGate x={104} y={40} width={176} height={80} />
      <DiagramArrow
        d="M 280 80 H 328"
        markerIdPrefix={markerIdPrefix}
        tone="success"
        label="approved"
        labelX={292}
        labelY={68}
        labelClassName={styles.flowLabel}
      />
      <FeatureSpec x={328} y={40} width={200} height={80} />
    </>
  );
}

function MobileApproval({ markerIdPrefix }: { markerIdPrefix: string }) {
  return (
    <>
      <OperatorNode x={20} y={40} size={40} />
      <DiagramArrow
        d="M 60 60 H 76"
        markerIdPrefix={markerIdPrefix}
        tone="neutral"
      />
      <ApprovalGate x={76} y={20} width={264} height={80} compact />
      <DiagramArrow
        d="M 208 100 V 120"
        markerIdPrefix={markerIdPrefix}
        tone="success"
        label="approved"
        labelX={218}
        labelY={114}
        labelClassName={styles.flowLabel}
      />
      <FeatureSpec x={56} y={120} width={248} height={80} compact />
    </>
  );
}

function ApprovalGate(props: Layout & { compact?: boolean }) {
  return (
    <DiagramTile
      {...props}
      tone="warning"
      eyebrow="HUMAN APPROVAL"
      title="approve intent?"
      detail="scope + trade-offs"
      titleVoice="human"
      variant="rich"
      density={props.compact ? 'mobile' : 'desktop'}
      fill="var(--surface-raised)"
      weight={2}
    />
  );
}

function FeatureSpec(props: Layout & { compact?: boolean }) {
  return (
    <DiagramTile
      {...props}
      tone="indigo"
      eyebrow="APPROVED FEATURE SPEC"
      title="stable intent"
      detail="boundaries + evidence"
      titleVoice="spec"
      variant="rich"
      density={props.compact ? 'mobile' : 'desktop'}
      fill="var(--surface-raised)"
      weight={2}
    />
  );
}

function SpecFlow({ d }: { d: string }) {
  return (
    <TokenArrowTrain
      d={d}
      tokens={SPEC_TOKENS}
      stroke="var(--visual-indigo)"
      tone="indigo"
      timing={WORKFLOW_FLOW_TIMING}
      stagger={WORKFLOW_TOKEN_STAGGER}
      laneOrientation="above"
      className={styles.specFlow}
      pathClassName={styles.connector}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
  );
}
