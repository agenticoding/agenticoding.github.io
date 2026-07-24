import React from 'react';

import { EmojiImage } from './ActorNodes';
import { DiagramTile, DiagramTileSurface } from './DiagramTile';
import { TILE_LAYOUT, wrapSvgText } from './diagramTileLayout';
import {
  EMOJI,
  OPENMOJI_VIEWBOX_SIZE,
  centeredEmojiOffset,
  emojiDisplaySize,
  type EmojiAsset,
} from './emojiAssets';
import { EmojiArrowTrain, EmojiPathTrain } from './TokenArrowTrain';
import { validationClaimBenchSchedule } from './ValidationClaimBenchSchedule';
import styles from './ValidationClaimBenchDiagram.module.css';

const ARIA_LABEL =
  'Validation claim bench: an operator submits a claim with a preset tolerance to an operating profile of workflow, data, dependencies, and environment conditions. Evidence travels through the profile and a check confirms the claim holds within tolerance.';
const CONDITIONS = [
  { icon: EMOJI.laptop, label: 'workflow' },
  { icon: EMOJI.database, label: 'data + volume' },
  { icon: EMOJI.plug, label: 'dependencies' },
  { icon: EMOJI.globe, label: 'environment' },
] as const;
const FLOW_STAGGER = { mode: 'pathSpacing', spacingPx: 28 } as const;
const CONDITION_ICON_SIZE = 32;
const OPERATOR_SIZE = 40;
const ICON_RAIL_GAP = 2;

type Box = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };
type Density = 'desktop' | 'mobile';

export default function ValidationClaimBenchDiagram() {
  return (
    <div className={styles.container} role="img" aria-label={ARIA_LABEL}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}

function DesktopDiagram() {
  return (
    <svg
      className={`${styles.diagram} ${styles.desktopDiagram}`}
      viewBox="0 0 760 328"
      aria-hidden="true"
    >
      <Scene density="desktop" />
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg
      className={`${styles.diagram} ${styles.mobileDiagram}`}
      viewBox="0 0 340 636"
      aria-hidden="true"
    >
      <Scene density="mobile" />
    </svg>
  );
}

function Scene({ density }: { density: Density }) {
  const layout = sceneLayout(density);
  const schedule = validationClaimBenchSchedule();
  return (
    <>
      <Operator
        x={layout.operator.x}
        y={centeredIconY(layout.claim, OPERATOR_SIZE)}
      />
      <ClaimCard {...layout.claim} />
      <ToleranceMarker {...layout.tolerance} />
      <TestingBench
        {...layout.bench}
        density={density}
        conditionArrivalMs={schedule.conditionArrivalMs}
      />
      <EvidenceFlows
        density={density}
        claimTiming={schedule.claimTiming}
        evidenceTimings={schedule.evidenceTimings}
      />
      <Outcome
        {...layout.outcome}
        activationDelayMs={schedule.outcomeArrivalMs}
      />
    </>
  );
}

function Operator({ x, y }: Point) {
  return (
    <g>
      <EmojiImage asset={EMOJI.operator} x={x} y={y} size={OPERATOR_SIZE} />
      <text
        x={x + 20}
        y={y + 58}
        textAnchor="middle"
        fill="var(--text-body)"
        className={styles.actorLabel}
      >
        operator
      </text>
    </g>
  );
}

function ClaimCard(props: Box) {
  return (
    <g>
      <DiagramTileSurface
        {...props}
        tone="indigo"
        weight={2}
        className={styles.vectorStroke}
      />
      <EmojiImage
        asset={EMOJI.documentTabs}
        x={props.x + 16}
        y={props.y + 14}
        size={20}
      />
      <text
        x={props.x + 44}
        y={props.y + 24}
        fill="var(--visual-indigo)"
        className={styles.nodeEyebrow}
      >
        CLAIM
      </text>
      <text
        x={props.x + 16}
        y={props.y + 50}
        fill="var(--text-heading)"
        className={styles.claimText}
      >
        holds for this release
      </text>
    </g>
  );
}

function ToleranceMarker({ x, y }: Point) {
  return (
    <g>
      <polygon
        points={`${x},${y + 16} ${x + 8},${y} ${x + 16},${y + 16}`}
        fill="var(--visual-warning)"
      />
      <text
        x={x + 24}
        y={y + 12}
        fill="var(--visual-warning)"
        className={styles.nodeEyebrow}
      >
        TOLERANCE SET
      </text>
    </g>
  );
}

function TestingBench(
  props: Box & { density: Density; conditionArrivalMs: readonly number[] }
) {
  const columns = conditionPositions(props);
  return (
    <g>
      <DiagramTileSurface
        {...props}
        tone="cyan"
        weight={1.5}
        className={styles.vectorStroke}
      />
      <text
        x={props.x + 24}
        y={props.y + 26}
        fill="var(--visual-cyan)"
        className={styles.nodeEyebrow}
      >
        OPERATING PROFILE
      </text>
      <line
        x1={props.x + 24}
        y1={props.y + 42}
        x2={props.x + props.width - 24}
        y2={props.y + 42}
        stroke="var(--border-subtle)"
        className={styles.vectorStroke}
      />
      {CONDITIONS.map((condition, index) => (
        <Condition
          key={condition.label}
          {...condition}
          {...columns[index]}
          activationDelayMs={props.conditionArrivalMs[index]}
        />
      ))}
    </g>
  );
}

function conditionPositions({
  x,
  y,
  width,
  density,
}: Box & { density: Density }) {
  if (density === 'mobile') return mobileConditionPositions(x, y, width);
  const inset = TILE_LAYOUT.padding * 1.5;
  const columnWidth = (width - inset * 2) / CONDITIONS.length;
  return CONDITIONS.map((_, index) => ({
    x: x + inset + columnWidth * (index + 0.5),
    y: y + 70,
  }));
}

function mobileConditionPositions(x: number, y: number, width: number) {
  const inset = TILE_LAYOUT.padding * 1.5;
  const columnWidth = (width - inset * 2) / 2;
  return CONDITIONS.map((_, index) => ({
    x: x + inset + columnWidth * ((index % 2) + 0.5),
    y: y + 72 + Math.floor(index / 2) * 82,
  }));
}

function Condition({
  icon,
  label,
  x,
  y,
  activationDelayMs,
}: { icon: EmojiAsset; label: string; activationDelayMs: number } & Point) {
  const labelLines = wrapSvgText(label, 64, 8, 2);
  return (
    <g
      className={styles.condition}
      style={
        { '--condition-delay': `${activationDelayMs}ms` } as React.CSSProperties
      }
    >
      <EmojiImage
        asset={icon}
        x={opticalEmojiX(icon, x, CONDITION_ICON_SIZE)}
        y={y}
        size={CONDITION_ICON_SIZE}
      />
      <text
        x={x}
        y={y + 52}
        textAnchor="middle"
        fill="var(--text-body)"
        className={styles.conditionLabel}
      >
        {labelLines.map((line, index) => (
          <tspan key={line} x={x} dy={index === 0 ? 0 : 12}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function EvidenceFlows({
  density,
  claimTiming,
  evidenceTimings,
}: {
  density: Density;
  claimTiming: ReturnType<typeof validationClaimBenchSchedule>['claimTiming'];
  evidenceTimings: ReturnType<
    typeof validationClaimBenchSchedule
  >['evidenceTimings'];
}) {
  const [claimPath, ...evidencePaths] = flowPaths(density);
  return (
    <g className={styles.evidenceFlow}>
      <EmojiArrowTrain
        d={claimPath.d}
        asset={EMOJI.documentTabs}
        stroke="var(--visual-indigo)"
        timing={claimTiming}
        stagger={FLOW_STAGGER}
        size={20}
        laneOffsetPx={0}
        pathClassName={styles.claimPath}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
      {evidencePaths.map((path, index) => (
        <EvidenceTrain
          key={path.d}
          {...path}
          timing={evidenceTimings[index]}
          stroke={
            index === evidencePaths.length - 1
              ? 'var(--visual-success)'
              : 'var(--visual-violet)'
          }
        />
      ))}
    </g>
  );
}

function EvidenceTrain({
  d,
  arrow,
  timing,
  stroke,
}: {
  d: string;
  arrow: boolean;
  timing: ReturnType<
    typeof validationClaimBenchSchedule
  >['evidenceTimings'][number];
  stroke: string;
}) {
  const props = {
    d,
    asset: EMOJI.documentTabs,
    stroke,
    timing,
    stagger: FLOW_STAGGER,
    size: 20,
    laneOffsetPx: 0,
    pathClassName: styles.evidencePath,
    strokeLinecap: 'butt' as const,
    strokeLinejoin: 'miter' as const,
  };
  return arrow ? <EmojiArrowTrain {...props} /> : <EmojiPathTrain {...props} />;
}

function opticalEmojiX(asset: EmojiAsset, centerX: number, size: number) {
  const bounds = asset.visualBounds ?? { x: 0, width: OPENMOJI_VIEWBOX_SIZE };
  const scale = emojiDisplaySize(size) / OPENMOJI_VIEWBOX_SIZE;
  const visualCenter =
    -centeredEmojiOffset(size) + (bounds.x + bounds.width / 2) * scale;
  return centerX - visualCenter;
}

function centeredIconY({ y, height }: Box, size: number) {
  return y + (height - size) / 2;
}

function conditionRailY(iconY: number) {
  return iconY + CONDITION_ICON_SIZE / 2;
}

function conditionEdges(asset: EmojiAsset, centerX: number, size: number) {
  const bounds = asset.visualBounds ?? { x: 0, width: OPENMOJI_VIEWBOX_SIZE };
  const scale = emojiDisplaySize(size) / OPENMOJI_VIEWBOX_SIZE;
  const iconX = opticalEmojiX(asset, centerX, size) - centeredEmojiOffset(size);
  return {
    left: iconX + bounds.x * scale - ICON_RAIL_GAP,
    right: iconX + (bounds.x + bounds.width) * scale + ICON_RAIL_GAP,
  };
}

function flowPaths(density: Density) {
  const layout = sceneLayout(density);
  const positions = conditionPositions({ ...layout.bench, density });
  const conditions = positions.map(({ x, y }, index) => ({
    ...conditionEdges(CONDITIONS[index].icon, x, CONDITION_ICON_SIZE),
    y: conditionRailY(y),
  }));
  const [workflow, data, dependencies, environment] = conditions;

  if (density === 'desktop') {
    const claimJoinX = layout.claim.x + layout.claim.width + 16;
    const outcomeJoinX = layout.bench.x + layout.bench.width + 16;
    return [
      {
        d: `M ${layout.claim.x + layout.claim.width} ${layout.claim.y + layout.claim.height / 2} H ${claimJoinX} V ${workflow.y} H ${workflow.left}`,
        arrow: true,
      },
      { d: `M ${workflow.right} ${workflow.y} H ${data.left}`, arrow: false },
      { d: `M ${data.right} ${data.y} H ${dependencies.left}`, arrow: false },
      {
        d: `M ${dependencies.right} ${dependencies.y} H ${environment.left}`,
        arrow: false,
      },
      {
        d: `M ${environment.right} ${environment.y} H ${outcomeJoinX} V ${layout.outcome.y + layout.outcome.height / 2} H ${layout.outcome.x}`,
        arrow: true,
      },
    ];
  }

  const outcomeJoinY = layout.outcome.y - 24;
  return [
    {
      d: `M ${layout.claim.x + layout.claim.width / 2} ${layout.claim.y + layout.claim.height} V ${workflow.y} H ${workflow.left}`,
      arrow: true,
    },
    { d: `M ${workflow.right} ${workflow.y} H ${data.left}`, arrow: false },
    {
      d: `M ${data.right} ${data.y} V ${dependencies.y} H ${dependencies.left}`,
      arrow: false,
    },
    {
      d: `M ${dependencies.right} ${dependencies.y} H ${environment.left}`,
      arrow: false,
    },
    {
      d: `M ${environment.right} ${environment.y} V ${outcomeJoinY} H ${layout.outcome.x + layout.outcome.width / 2} V ${layout.outcome.y}`,
      arrow: true,
    },
  ];
}

function Outcome({
  activationDelayMs,
  ...props
}: Box & { activationDelayMs: number }) {
  return (
    <DiagramTile
      {...props}
      tone="success"
      weight={2}
      variant="rich"
      icon={EMOJI.check}
      eyebrow="HOLDS WITHIN"
      title="TOLERANCE"
      titleVoice="spec"
      className={styles.outcome}
      rectClassName={styles.vectorStroke}
      style={
        { '--outcome-delay': `${activationDelayMs}ms` } as React.CSSProperties
      }
    />
  );
}

function sceneLayout(density: Density) {
  if (density === 'desktop')
    return {
      operator: { x: 16 },
      claim: { x: 64, y: 126, width: 168, height: 72 },
      tolerance: { x: 80, y: 218 },
      bench: { x: 272, y: 70, width: 312, height: 184 },
      outcome: { x: 616, y: 120, width: 136, height: 84 },
    };
  return {
    operator: { x: 28 },
    claim: { x: 62, y: 52, width: 216, height: 72 },
    tolerance: { x: 78, y: 150 },
    bench: { x: 28, y: 204, width: 284, height: 246 },
    outcome: { x: 84, y: 520, width: 172, height: 80 },
  };
}
