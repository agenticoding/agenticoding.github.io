import React from 'react';
import styles from './OperatorCycleDiagram.module.css';
import { OperatorNode } from './ActorNodes';
import { emojiDisplaySize } from './emojiAssets';
import { tileToneVars } from './diagramTileLayout';
import {
  WORKFLOW_LAYOUT,
  WorkflowLoopGraphic,
  type WorkflowStep,
} from './WorkflowLoopGraphic';

const OPERATOR_SIZE = 40;
const MOBILE_OPERATOR_SIZE = 32;
const OPERATOR_TILE_GAP = 16;
const OPERATOR_VISUAL_RADIUS = emojiDisplaySize(OPERATOR_SIZE) / 2;
const TILES = WORKFLOW_LAYOUT.desktop.tiles;
const TILES_BY_STEP = Object.fromEntries(
  TILES.map((tile) => [tile.id, tile])
) as Record<WorkflowStep, (typeof TILES)[number]>;

const CENTER_SPACE = {
  left: TILES_BY_STEP.validate.x + TILES_BY_STEP.validate.width,
  right: TILES_BY_STEP.plan.x,
  top: TILES_BY_STEP.grounding.y + TILES_BY_STEP.grounding.height,
  bottom: TILES_BY_STEP.execute.y,
};

function gridFitRadius(candidate: number, max: number) {
  const radius = Math.floor(Math.min(candidate, max) / 8) * 8;
  if (radius <= 0)
    throw new Error('Operator diamond cannot fit in center space.');
  return radius;
}

const OPERATOR_DIAMOND = (() => {
  const width = CENTER_SPACE.right - CENTER_SPACE.left;
  const height = CENTER_SPACE.bottom - CENTER_SPACE.top;
  const clearance = OPERATOR_VISUAL_RADIUS + OPERATOR_TILE_GAP;
  return {
    center: {
      x: CENTER_SPACE.left + width / 2,
      y: CENTER_SPACE.top + height / 2,
    },
    radiusX: gridFitRadius(width / 4, width / 2 - clearance),
    radiusY: gridFitRadius(height / 4, height / 2 - clearance),
  };
})();

function operatorOrigin(x: number, y: number) {
  return { x: x - OPERATOR_SIZE / 2, y: y - OPERATOR_SIZE / 2 };
}

const OPERATOR_STATIONS: Record<WorkflowStep, { x: number; y: number }> = {
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

const MOBILE_OPERATOR_STATIONS: Record<WorkflowStep, { x: number; y: number }> =
  {
    grounding: operatorOrigin(28, 100),
    plan: operatorOrigin(28, 242),
    execute: operatorOrigin(28, 384),
    validate: operatorOrigin(28, 526),
  };

function OperatorWatcher({ mobile = false }: { mobile?: boolean }) {
  const stations = mobile ? MOBILE_OPERATOR_STATIONS : OPERATOR_STATIONS;
  const size = mobile ? MOBILE_OPERATOR_SIZE : OPERATOR_SIZE;
  const start = stations.grounding;
  const motionStyle = {
    '--operator-plan-x': `${stations.plan.x - start.x}px`,
    '--operator-plan-y': `${stations.plan.y - start.y}px`,
    '--operator-execute-x': `${stations.execute.x - start.x}px`,
    '--operator-execute-y': `${stations.execute.y - start.y}px`,
    '--operator-validate-x': `${stations.validate.x - start.x}px`,
    '--operator-validate-y': `${stations.validate.y - start.y}px`,
  } as React.CSSProperties;
  return (
    <g
      className={mobile ? styles.mobileOperatorWatcher : styles.operatorWatcher}
      style={motionStyle}
    >
      <OperatorNode x={start.x} y={start.y} size={size} />
    </g>
  );
}

function renderCard(tile: (typeof TILES)[number]) {
  const color = tileToneVars(tile.tone).stroke;
  const content =
    tile.id === 'grounding'
      ? [
          'What reality does the agent need?',
          'Load repo facts, constraints, current state, and relevant prior decisions.',
        ]
      : tile.id === 'plan'
        ? [
            'What shape should the work take?',
            'Define add/remove/change/protect before execution begins.',
          ]
        : tile.id === 'execute'
          ? [
              'How much autonomy is safe?',
              'Delegate bounded work units with explicit checkpoints.',
            ]
          : [
              'Did it meet the goal?',
              'Check evidence, not confidence. Iterate when reality disagrees.',
            ];
  return (
    <div
      key={tile.id}
      className={styles.descCell}
      style={{ borderColor: color }}
    >
      <span className={styles.descLabel} style={{ color }}>
        {tile.id === 'validate' ? 'VALIDATE' : tile.title}
      </span>
      <span className={styles.descQuestion}>{content[0]}</span>
      <span className={styles.descText}>{content[1]}</span>
    </div>
  );
}

function DesktopDiagram() {
  return (
    <svg
      viewBox="0 0 760 464"
      width="100%"
      role="img"
      aria-label="An operator moves between Grounding, Plan, Execute, and a Validation Gate while token streams move between each step."
      className={styles.desktopDiagram}
      xmlns="http://www.w3.org/2000/svg"
    >
      <WorkflowLoopGraphic operator={<OperatorWatcher />} />
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg
      viewBox="0 0 360 620"
      width="100%"
      role="img"
      aria-label="A vertical operator loop moving from Grounding to Plan to Execute to the Validation Gate, then back to Grounding."
      className={styles.mobileDiagram}
      xmlns="http://www.w3.org/2000/svg"
    >
      <WorkflowLoopGraphic
        layout="mobile"
        operator={<OperatorWatcher mobile />}
      />
    </svg>
  );
}

export default function OperatorCycleDiagram() {
  return (
    <div>
      <DesktopDiagram />
      <MobileDiagram />
      <div className={styles.descGrid}>{TILES.map(renderCard)}</div>
    </div>
  );
}
