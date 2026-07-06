import React from 'react';
import clsx from 'clsx';

import { ArrowMarker, trimPathEnd } from './diagramGeometry';
import { DIAGRAM_STROKE } from './diagramScale';
import { DiagramTile } from './DiagramTile';
import { tileToneVars, type DiagramTone } from './diagramTileLayout';
import { TokenArrowTrain } from './TokenArrowTrain';
import {
  seededTokenDrift,
  seededTokenTrain,
} from './TokenTrainSequence';
import styles from './ProbabilityIsNotLogicDiagram.module.css';

const DESKTOP_ARROW_ID = 'probability-logic-desktop-arrow';
const MOBILE_ARROW_ID = 'probability-logic-mobile-arrow';
const LOGIC = tileToneVars('success').accent;
const MODEL = tileToneVars('model').accent;
const TOKEN_COUNT = 4;
const TOKEN_SIZE = 16;
const ZIGZAG_BENDS = 3;
const TILE_SIZE = {
  desktop: { width: 80, height: 64 },
  mobile: { width: 136, height: 50 },
} as const;
const DESKTOP_TILE_Y = 116;
const MOBILE_LOGIC = { inputY: 62, arrowStartY: 124, arrowEndY: 166, outputY: 178 } as const;
const MOBILE_PROBABILITY = { inputY: 312, pathStartY: 374, pathEndY: 438, outputY: 450 } as const;
const PROBABILITY_TRAIN_TIMING = {
  startDelayMs: 900,
  cycleMs: 7200,
  travelMs: 5200,
  fadeMs: 900,
  repeat: 'loop',
} as const;
const PROBABILITY_TRAIN_STAGGER = { mode: 'pathSpacing', spacingPx: 24 } as const;
const ARIA_LABEL = 'Comparison of logical derivation with probabilistic token prediction: premises and rules entail a conclusion on a straight path, while context tokens produce an artifact as the model-selected continuation along a zigzag likelihood path.';

type Point = { x: number; y: number };
type Axis = 'horizontal' | 'vertical';

type TileProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  meta: string;
  tone?: DiagramTone;
  className?: string;
};

function Tile({ x, y, width, height, title, meta, tone = 'neutral', className }: TileProps) {
  return (
    <DiagramTile
      x={x}
      y={y}
      width={width}
      height={height}
      title={title}
      detail={meta}
      tone={tone}
      variant="compact"
      titleVoice="keyword"
      className={className}
    />
  );
}

function Arrow({ d, markerId, tone = LOGIC }: { d: string; markerId: string; tone?: string }) {
  return (
    <path
      d={trimPathEnd(d)}
      fill="none"
      stroke={tone}
      strokeWidth={DIAGRAM_STROKE.connector}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      markerEnd={`url(#${markerId})`}
    />
  );
}

function zigzagPoints(start: Point, end: Point, axis: Axis, seed: string) {
  const offsets = seededTokenDrift(seed, ZIGZAG_BENDS, { minOffsetPx: 8, maxOffsetPx: 16 });
  const bends = offsets.map((offset, index) => {
    const t = (index + 1) / (ZIGZAG_BENDS + 1);
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    return axis === 'horizontal' ? { x, y: y + offset } : { x: x + offset, y };
  });
  return [start, ...bends, end];
}

function zigzagPathD(points: readonly Point[]) {
  const [start, ...rest] = points;
  const lineCommands = rest.map(({ x, y }) => `L ${x.toFixed(1)} ${y.toFixed(1)}`);
  return [`M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`, ...lineCommands].join(' ');
}

function probabilityTokens(seed: string) {
  return seededTokenTrain(seed, TOKEN_COUNT).map((token, index) => ({
    ...token,
    signal: index === TOKEN_COUNT - 1 ? 'salient' : token.signal,
  }));
}

function ProbabilityTokenTrain({ start, end, axis, seed }: { start: Point; end: Point; axis: Axis; seed: string }) {
  const pathD = zigzagPathD(zigzagPoints(start, end, axis, seed));
  return (
    <TokenArrowTrain
      d={pathD}
      tokens={probabilityTokens(seed)}
      stroke={MODEL}
      tone="violet"
      timing={PROBABILITY_TRAIN_TIMING}
      stagger={PROBABILITY_TRAIN_STAGGER}
      size={TOKEN_SIZE}
      laneOrientation={axis === 'horizontal' ? 'above' : 'below'}
      pathClassName={styles.probabilityZigzagPath}
      strokeWidth={DIAGRAM_STROKE.connector}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
  );
}

function offsetRulePath(start: Point, end: Point, axis: Axis) {
  const offset = 14;
  const from = axis === 'horizontal' ? { x: start.x, y: start.y - offset } : { x: start.x + offset, y: start.y };
  const to = axis === 'horizontal' ? { x: end.x, y: end.y - offset } : { x: end.x + offset, y: end.y };
  return { d: `M ${from.x} ${from.y} L ${to.x} ${to.y}`, end: to };
}

function LogicRuleSignal({ start, end, axis }: { start: Point; end: Point; axis: Axis }) {
  const path = offsetRulePath(start, end, axis);
  return (
    <g aria-hidden="true">
      <g className={styles.logicRuleMotion} opacity="0">
        <rect x="-4" y="-4" width="8" height="8" transform="rotate(45)" fill={LOGIC} />
        <animateMotion path={path.d} dur="5.600s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.42;1" calcMode="linear" />
        <animate attributeName="opacity" values="0;1;1;0;0" dur="5.600s" repeatCount="indefinite" keyTimes="0;0.16;0.42;0.56;1" />
      </g>
      <g className={styles.logicRuleStatic} transform={`translate(${path.end.x} ${path.end.y})`}>
        <rect x="-4" y="-4" width="8" height="8" transform="rotate(45)" fill={LOGIC} opacity="0.8" />
      </g>
    </g>
  );
}

function PanelFrame({ x, y, width, height, title }: { x: number; y: number; width: number; height: number; title: string }) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={0} fill="transparent" stroke="var(--border-subtle)" strokeWidth="1" />
      <text x={x + 16} y={y + 24} className={styles.panelTitle} fill="var(--text-muted)">
        {title}
      </text>
    </g>
  );
}

function DesktopDiagram() {
  return (
    <svg viewBox="0 0 760 300" width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.desktopDiagram)}>
      <defs>
        <ArrowMarker id={DESKTOP_ARROW_ID} fill={LOGIC} refX={0} />
      </defs>
      <PanelFrame x={16} y={24} width={352} height={236} title="logical proof" />
      <Tile x={48} y={DESKTOP_TILE_Y} {...TILE_SIZE.desktop} title="Premises" meta="+ rules" className={styles.logicPremisePulse} />
      <Arrow d="M 142 148 H 242" markerId={DESKTOP_ARROW_ID} />
      <LogicRuleSignal start={{ x: 142, y: 148 }} end={{ x: 242, y: 148 }} axis="horizontal" />
      <Tile x={256} y={DESKTOP_TILE_Y} {...TILE_SIZE.desktop} title="Conclusion" meta="entailed" tone="success" className={styles.logicConclusionPulse} />
      <text x={192} y={104} textAnchor="middle" className={styles.arrowLabel} fill={LOGIC}>therefore</text>

      <PanelFrame x={392} y={24} width={352} height={236} title="token prediction" />
      <Tile x={424} y={DESKTOP_TILE_Y} {...TILE_SIZE.desktop} title="Context" meta="tokens" />
      <ProbabilityTokenTrain start={{ x: 520, y: 148 }} end={{ x: 632, y: 148 }} axis="horizontal" seed="probability-is-not-logic-desktop" />
      <Tile x={640} y={DESKTOP_TILE_Y} {...TILE_SIZE.desktop} title="Artifact" meta="produced" tone="model" className={styles.probabilityOutputPulse} />
      <text x={576} y={104} textAnchor="middle" className={styles.arrowLabel} fill={MODEL}>probable continuation</text>
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg viewBox="0 0 320 520" width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.mobileDiagram)}>
      <defs>
        <ArrowMarker id={MOBILE_ARROW_ID} fill={LOGIC} refX={0} />
      </defs>
      <PanelFrame x={16} y={16} width={288} height={220} title="logical proof" />
      <Tile x={92} y={MOBILE_LOGIC.inputY} {...TILE_SIZE.mobile} title="Premises" meta="+ rules" className={styles.logicPremisePulse} />
      <Arrow d={`M 160 ${MOBILE_LOGIC.arrowStartY} V ${MOBILE_LOGIC.arrowEndY}`} markerId={MOBILE_ARROW_ID} />
      <LogicRuleSignal start={{ x: 160, y: MOBILE_LOGIC.arrowStartY }} end={{ x: 160, y: MOBILE_LOGIC.arrowEndY }} axis="vertical" />
      <Tile x={92} y={MOBILE_LOGIC.outputY} {...TILE_SIZE.mobile} title="Conclusion" meta="entailed" tone="success" className={styles.logicConclusionPulse} />

      <PanelFrame x={16} y={268} width={288} height={232} title="token prediction" />
      <Tile x={92} y={MOBILE_PROBABILITY.inputY} {...TILE_SIZE.mobile} title="Context" meta="tokens" />
      <ProbabilityTokenTrain start={{ x: 160, y: MOBILE_PROBABILITY.pathStartY }} end={{ x: 160, y: MOBILE_PROBABILITY.pathEndY }} axis="vertical" seed="probability-is-not-logic-mobile" />
      <Tile x={92} y={MOBILE_PROBABILITY.outputY} {...TILE_SIZE.mobile} title="Artifact" meta="produced" tone="model" className={styles.probabilityOutputPulse} />
    </svg>
  );
}

export default function ProbabilityIsNotLogicDiagram() {
  return (
    <div className={styles.container} role="img" aria-label={ARIA_LABEL}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}
