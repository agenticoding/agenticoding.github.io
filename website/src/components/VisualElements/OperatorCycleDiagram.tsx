import React from 'react';
import styles from './OperatorCycleDiagram.module.css';
import { OperatorNode } from './ActorNodes';
import { EMOJI, emojiDisplaySize } from './emojiAssets';
import { TokenArrowTrain } from './TokenArrowTrain';
import { seededTokenTrain } from './TokenTrainSequence';
import { DiagramTile } from './DiagramTile';
import { TILE_GRID, tileToneVars, type DiagramTone } from './diagramTileLayout';
import { DIAGRAM_TOKEN_SIZE, RICH_TILE_SCALE } from './diagramScale';
import type { TokenUnitTone } from './TokenUnit';

type FlowStep = 'grounding' | 'plan' | 'execute' | 'validate';

type TileSpec = {
  id: FlowStep;
  title: string;
  question: string;
  instruction: string;
  tone: DiagramTone;
  tokenTone: TokenUnitTone;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ArrowSpec = {
  id: string;
  from: FlowStep;
  d: string;
  startMs: number;
};

const G = TILE_GRID;
const TILE_W = 23 * G;
const TILE_H = RICH_TILE_SCALE.comfortableHeight;
const LEFT_X = 3 * G;
const CENTER_X = 36 * G;
const RIGHT_X = 69 * G;
const TOP_Y = 6 * G;
const MID_Y = 22 * G;
const BOTTOM_Y = 38 * G;

const TILES: TileSpec[] = [
  {
    id: 'grounding',
    title: 'GROUNDING',
    question: 'What reality does the agent need?',
    instruction:
      'Load repo facts, constraints, current state, and relevant prior decisions.',
    tone: 'indigo',
    tokenTone: 'indigo',
    x: CENTER_X,
    y: TOP_Y,
    width: TILE_W,
    height: TILE_H,
  },
  {
    id: 'plan',
    title: 'PLAN',
    question: 'What shape should the work take?',
    instruction: 'Define add/remove/change/protect before execution begins.',
    tone: 'cyan',
    tokenTone: 'cyan',
    x: RIGHT_X,
    y: MID_Y,
    width: TILE_W,
    height: TILE_H,
  },
  {
    id: 'execute',
    title: 'EXECUTE',
    question: 'How much autonomy is safe?',
    instruction: 'Delegate bounded work units with explicit checkpoints.',
    tone: 'magenta',
    tokenTone: 'magenta',
    x: CENTER_X,
    y: BOTTOM_Y,
    width: TILE_W,
    height: TILE_H,
  },
  {
    id: 'validate',
    title: 'VALIDATION GATE',
    question: 'Did it meet the goal?',
    instruction:
      'Check evidence, not confidence. Iterate when reality disagrees.',
    tone: 'warning',
    tokenTone: 'warning',
    x: LEFT_X,
    y: MID_Y,
    width: TILE_W,
    height: TILE_H,
  },
];

const TILE_BY_ID = Object.fromEntries(
  TILES.map((tile) => [tile.id, tile])
) as Record<FlowStep, TileSpec>;

// 80×80 diagonals keep every connector at exactly 45° while leaving tile interiors open.
const ARROWS: ArrowSpec[] = [
  {
    id: 'grounding-to-plan',
    from: 'grounding',
    d: 'M 472 120 L 552 200',
    startMs: 0,
  },
  {
    id: 'plan-to-execute',
    from: 'plan',
    d: 'M 552 264 L 472 344',
    startMs: 2400,
  },
  {
    id: 'execute-to-validate',
    from: 'execute',
    d: 'M 288 344 L 208 264',
    startMs: 4800,
  },
  {
    id: 'validate-to-grounding',
    from: 'validate',
    d: 'M 208 200 L 288 120',
    startMs: 7200,
  },
];

const TOKEN_SEQUENCE = seededTokenTrain('operator-cycle', 5);

const FLOW_DURATION_MS = 9600;
const TOKEN_TRAIN_TIMING = {
  cycleMs: FLOW_DURATION_MS,
  travelMs: 900,
  fadeMs: 180,
  repeat: 'loop',
} as const;
const TOKEN_TRAIN_STAGGER = {
  mode: 'pathSpacing',
  spacingPx: DIAGRAM_TOKEN_SIZE.flow * 1.35,
} as const;
const TOKEN_FLOW_SIZE = DIAGRAM_TOKEN_SIZE.flow;
const OPERATOR_SIZE = 40;
const OPERATOR_TILE_GAP = 2 * G;
const OPERATOR_VISUAL_RADIUS = emojiDisplaySize(OPERATOR_SIZE) / 2;

const CENTER_SPACE = {
  left: TILE_BY_ID.validate.x + TILE_BY_ID.validate.width,
  right: TILE_BY_ID.plan.x,
  top: TILE_BY_ID.grounding.y + TILE_BY_ID.grounding.height,
  bottom: TILE_BY_ID.execute.y,
};

function gridFitRadius(candidate: number, max: number) {
  const radius = Math.floor(Math.min(candidate, max) / G) * G;
  if (radius <= 0)
    throw new Error('Operator diamond cannot fit in center space.');
  return radius;
}

const OPERATOR_DIAMOND = (() => {
  const width = CENTER_SPACE.right - CENTER_SPACE.left;
  const height = CENTER_SPACE.bottom - CENTER_SPACE.top;
  const clearance = OPERATOR_VISUAL_RADIUS + OPERATOR_TILE_GAP;
  const center = {
    x: CENTER_SPACE.left + width / 2,
    y: CENTER_SPACE.top + height / 2,
  };
  return {
    center,
    radiusX: gridFitRadius(width / 4, width / 2 - clearance),
    radiusY: gridFitRadius(height / 4, height / 2 - clearance),
  };
})();

function operatorOrigin(x: number, y: number) {
  return { x: x - OPERATOR_SIZE / 2, y: y - OPERATOR_SIZE / 2 };
}

// A scaled-down copy of the tile diamond, constrained to the central negative space.
const OPERATOR_STATIONS: Record<FlowStep, { x: number; y: number }> = {
  grounding: operatorOrigin(
    OPERATOR_DIAMOND.center.x,
    OPERATOR_DIAMOND.center.y - OPERATOR_DIAMOND.radiusY
  ),
  plan: operatorOrigin(
    OPERATOR_DIAMOND.center.x + OPERATOR_DIAMOND.radiusX,
    OPERATOR_DIAMOND.center.y
  ),
  execute: operatorOrigin(
    OPERATOR_DIAMOND.center.x,
    OPERATOR_DIAMOND.center.y + OPERATOR_DIAMOND.radiusY
  ),
  validate: operatorOrigin(
    OPERATOR_DIAMOND.center.x - OPERATOR_DIAMOND.radiusX,
    OPERATOR_DIAMOND.center.y
  ),
};

function WorkflowTile({ tile }: { tile: TileSpec }) {
  if (tile.id === 'validate') return <ValidationGate tile={tile} />;

  const icon =
    tile.id === 'grounding'
      ? EMOJI.microscope
      : tile.id === 'plan'
        ? EMOJI.documentTabs
        : EMOJI.agent;
  const title =
    tile.id === 'grounding'
      ? 'reality?'
      : tile.id === 'plan'
        ? 'shape?'
        : 'autonomy?';
  const detail =
    tile.id === 'grounding'
      ? 'facts · constraints'
      : tile.id === 'plan'
        ? 'scope · checkpoints'
        : 'bounded agent work';
  return (
    <DiagramTile
      x={tile.x}
      y={tile.y}
      width={tile.width}
      height={tile.height}
      tone={tile.tone}
      icon={icon}
      eyebrow={tile.title}
      title={title}
      detail={detail}
      titleVoice={tile.id === 'execute' ? 'ai' : 'spec'}
      variant="rich"
      fill="var(--surface-raised)"
      rectClassName={styles.vectorStroke}
      density="desktop"
    />
  );
}

function ValidationGate({ tile }: { tile: TileSpec }) {
  return (
    <DiagramTile
      x={tile.x}
      y={tile.y}
      width={tile.width}
      height={tile.height}
      tone="warning"
      icon={EMOJI.question}
      eyebrow="VALIDATION GATE"
      title="accept?"
      detail="accept · iterate"
      titleVoice="spec"
      variant="rich"
      fill="var(--surface-raised)"
      rectClassName={styles.vectorStroke}
      density="desktop"
      weight={2}
    />
  );
}

function TokenStreams() {
  return (
    <g>
      {ARROWS.map((arrow) => {
        const tile = TILE_BY_ID[arrow.from];
        return (
          <TokenArrowTrain
            key={arrow.id}
            d={arrow.d}
            tokens={TOKEN_SEQUENCE}
            stroke={tileToneVars(tile.tone).stroke}
            timing={{ ...TOKEN_TRAIN_TIMING, startDelayMs: arrow.startMs }}
            stagger={TOKEN_TRAIN_STAGGER}
            size={TOKEN_FLOW_SIZE}
            tone={tile.tokenTone}
            pathClassName={styles.vectorStroke}
          />
        );
      })}
    </g>
  );
}

function OperatorWatcher() {
  const start = OPERATOR_STATIONS.grounding;
  const motionStyle = {
    '--operator-plan-x': `${OPERATOR_STATIONS.plan.x - start.x}px`,
    '--operator-plan-y': `${OPERATOR_STATIONS.plan.y - start.y}px`,
    '--operator-execute-x': `${OPERATOR_STATIONS.execute.x - start.x}px`,
    '--operator-execute-y': `${OPERATOR_STATIONS.execute.y - start.y}px`,
    '--operator-validate-x': `${OPERATOR_STATIONS.validate.x - start.x}px`,
    '--operator-validate-y': `${OPERATOR_STATIONS.validate.y - start.y}px`,
  } as React.CSSProperties;
  return (
    <g className={styles.operatorWatcher} style={motionStyle}>
      <OperatorNode x={start.x} y={start.y} size={OPERATOR_SIZE} />
    </g>
  );
}

function renderCard(tile: TileSpec) {
  const color = tileToneVars(tile.tone).stroke;
  return (
    <div
      key={tile.id}
      className={styles.descCell}
      style={{ borderColor: color }}
    >
      <span className={styles.descLabel} style={{ color }}>
        {tile.id === 'validate' ? 'VALIDATE' : tile.title}
      </span>
      <span className={styles.descQuestion}>{tile.question}</span>
      <span className={styles.descText}>{tile.instruction}</span>
    </div>
  );
}

export default function OperatorCycleDiagram() {
  return (
    <div>
      <svg
        viewBox="0 0 760 464"
        width="100%"
        role="img"
        aria-label="An operator moves between Grounding, Plan, Execute, and a Validation Gate while token streams move between each step."
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', maxWidth: '760px', margin: '0 auto' }}
      >
        <TokenStreams />
        {TILES.map((tile) => (
          <WorkflowTile key={tile.id} tile={tile} />
        ))}
        <OperatorWatcher />
      </svg>

      <div className={styles.descGrid}>{TILES.map(renderCard)}</div>
    </div>
  );
}
