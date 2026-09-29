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
import { RICH_TILE_SCALE } from './diagramScale';
import { ResponsiveDiagram } from './ResponsiveDiagram';
import styles from './SpecExecutionRunsDiagram.module.css';

const ARIA_LABEL =
  'A human approves one stable feature spec. The spec guides repeated bounded runs through Grounding, Plan, Execute, and Validation, which returns current code to Grounding.';
const SPEC_TOKENS = [
  { modality: 'text', signal: 'compressed' },
  { modality: 'code', signal: 'salient' },
] as const satisfies TokenSequence;

type Layout = { x: number; y: number; width: number; height: number };

// WorkflowLoopGraphic authors its loop from y=0 (grounding tile at y=48) and is built to
// render without a transform (see OperatorCycleDiagram). The approval band sits above
// that origin, so it is authored at negative y in the same space and the viewBox origin
// is raised to include it. One coordinate system keeps every edge/arrow anchor exact.
const TILE_HEIGHT = RICH_TILE_SCALE.comfortableHeight;
const DESKTOP_BAND_Y = -128;
const MOBILE_APPROVAL_Y = -224;
const MOBILE_SPEC_Y = -96;

export default function SpecExecutionRunsDiagram() {
  return (
    <ResponsiveDiagram
      className={styles.container}
      breakpoint="40rem"
      mode="container"
      desktop={<DesktopDiagram />}
      mobile={<MobileDiagram />}
    />
  );
}

function DesktopDiagram() {
  return (
    <svg
      className={`${styles.diagram} ${styles.desktopDiagram}`}
      viewBox="0 -160 760 624"
      role="img"
      aria-label={ARIA_LABEL}
    >
      <DiagramArrowMarkers
        prefix="spec-runs-desktop"
        tones={['neutral', 'success']}
      />
      <DesktopApproval markerIdPrefix="spec-runs-desktop" />
      <SpecFlow d="M 484 -16 V 16 H 380 V 48" />
      <WorkflowLoopGraphic returnLabel="current code" />
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg
      className={`${styles.diagram} ${styles.mobileDiagram}`}
      viewBox="0 -256 360 896"
      role="img"
      aria-label={ARIA_LABEL}
    >
      <DiagramArrowMarkers
        prefix="spec-runs-mobile"
        tones={['neutral', 'success']}
      />
      <MobileApproval markerIdPrefix="spec-runs-mobile" />
      <SpecFlow d="M 180 16 V 48" />
      <WorkflowLoopGraphic layout="mobile" returnLabel="current code" />
    </svg>
  );
}

function DesktopApproval({ markerIdPrefix }: { markerIdPrefix: string }) {
  return (
    <>
      <OperatorNode x={40} y={DESKTOP_BAND_Y + 44} size={40} />
      <DiagramArrow
        d={`M 80 ${DESKTOP_BAND_Y + 64} H 104`}
        markerIdPrefix={markerIdPrefix}
        tone="neutral"
      />
      <ApprovalGate
        x={104}
        y={DESKTOP_BAND_Y}
        width={208}
        height={TILE_HEIGHT}
      />
      <DiagramArrow
        d={`M 312 ${DESKTOP_BAND_Y + 64} H 368`}
        markerIdPrefix={markerIdPrefix}
        tone="success"
        label="approved"
        labelX={316}
        labelY={DESKTOP_BAND_Y + 52}
        labelClassName={styles.flowLabel}
      />
      <FeatureSpec
        x={368}
        y={DESKTOP_BAND_Y}
        width={232}
        height={TILE_HEIGHT}
      />
    </>
  );
}

function MobileApproval({ markerIdPrefix }: { markerIdPrefix: string }) {
  return (
    <>
      <OperatorNode x={20} y={MOBILE_APPROVAL_Y + 36} size={40} />
      <DiagramArrow
        d={`M 60 ${MOBILE_APPROVAL_Y + 56} H 76`}
        markerIdPrefix={markerIdPrefix}
        tone="neutral"
      />
      <ApprovalGate
        x={76}
        y={MOBILE_APPROVAL_Y}
        width={264}
        height={TILE_HEIGHT}
        compact
      />
      <DiagramArrow
        d={`M 208 ${MOBILE_APPROVAL_Y + TILE_HEIGHT} V ${MOBILE_SPEC_Y}`}
        markerIdPrefix={markerIdPrefix}
        tone="success"
        label="approved"
        labelX={218}
        labelY={MOBILE_APPROVAL_Y + TILE_HEIGHT + 10}
        labelClassName={styles.flowLabel}
      />
      <FeatureSpec
        x={56}
        y={MOBILE_SPEC_Y}
        width={248}
        height={TILE_HEIGHT}
        compact
      />
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
