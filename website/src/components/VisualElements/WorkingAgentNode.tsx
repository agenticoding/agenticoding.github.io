import React from 'react';

import { AgentNode, type AgentNodeProps } from './ActorNodes';
import { DIAGRAM_GRID, DIAGRAM_ICON_SIZE } from './diagramScale';
import { OPENMOJI_VISUAL_SCALE } from './emojiAssets';
import { GearNode, type GearSpin } from './GearNode';
import styles from './WorkingAgentNode.module.css';

export type WorkingAgentActivation = {
  activeMs: number;
  cycleMs: number;
  delayMs: number;
  turnScale?: number;
};

type SatelliteSpec = {
  gridX: number;
  gridY: number;
  nudgeX?: number;
  nudgeY?: number;
  baseSize: number;
  className: string;
  activeTurns: number;
};

type Satellite = {
  dx: number;
  dy: number;
  size: number;
  className: string;
  activeTurns: number;
};

type NodePart = { x: number; y: number; size: number };

export type WorkingAgentNodeProps = AgentNodeProps & {
  activation?: WorkingAgentActivation;
};

const DEFAULT_AGENT_SIZE = DIAGRAM_ICON_SIZE.actor;
const FIXED_LAYOUT_SCALE = 1;
const ROBOT_OFFSET = {
  gridX: 1,
  gridY: -1,
  nudgeX: -10,
  nudgeY: -10,
} as const;
const SATELLITE_SPECS: SatelliteSpec[] = [
  {
    gridX: 5,
    gridY: -3,
    nudgeX: -12,
    nudgeY: -9,
    baseSize: DIAGRAM_ICON_SIZE.secondary,
    className: styles.satellitePrimary,
    activeTurns: 2.1,
  },
  {
    gridX: 5,
    gridY: 1,
    nudgeX: -7,
    baseSize: DIAGRAM_ICON_SIZE.tertiary,
    className: styles.satelliteSecondary,
    activeTurns: -2.6,
  },
  {
    gridX: -2,
    gridY: -2,
    nudgeY: 2,
    baseSize: DIAGRAM_ICON_SIZE.tertiary,
    className: styles.satelliteTertiary,
    activeTurns: 3.2,
  },
];

export function workingAgentVisualHeight(agentSize: number) {
  return workingAgentLayout(agentSize).visualHeight;
}

export function WorkingAgentNode({
  x,
  y,
  size = DEFAULT_AGENT_SIZE,
  activation,
}: WorkingAgentNodeProps) {
  const layout = workingAgentLayout(size);

  return (
    <g>
      <AgentNode x={x + layout.robot.x} y={y + layout.robot.y} size={size} />
      {layout.satellites.map((satellite) => (
        <GearNode
          key={`${satellite.dx}-${satellite.dy}`}
          x={x + satellite.dx}
          y={y + satellite.dy}
          size={satellite.size}
          className={workingAgentGearClassName(satellite, activation)}
          spin={workingAgentGearSpin(satellite, activation)}
        />
      ))}
    </g>
  );
}

function workingAgentGearClassName(
  satellite: Satellite,
  activation?: WorkingAgentActivation
): string {
  const modeClassName = activation
    ? styles.satelliteWindowed
    : styles.satellite;
  return `${modeClassName} ${satellite.className}`;
}

function workingAgentGearSpin(
  satellite: Satellite,
  activation?: WorkingAgentActivation
): GearSpin | undefined {
  if (!activation) {
    return undefined;
  }

  const { turnScale = 1, ...spin } = activation;
  return { ...spin, turns: satellite.activeTurns * turnScale };
}

function workingAgentLayout(agentSize: number) {
  const satellites = satelliteLayout();
  const robot = {
    x: gridOffset(ROBOT_OFFSET.gridX, FIXED_LAYOUT_SCALE) + ROBOT_OFFSET.nudgeX,
    y: gridOffset(ROBOT_OFFSET.gridY, FIXED_LAYOUT_SCALE) + ROBOT_OFFSET.nudgeY,
    size: agentSize,
  };
  const frame = visualFrame([robot, ...satellites.map(satellitePart)]);
  const shiftedRobot = shiftPart(robot, frame);
  const shiftedSatellites = satellites.map((part) =>
    shiftSatellite(part, frame)
  );
  const visualParts = [shiftedRobot, ...shiftedSatellites.map(satellitePart)];
  const bounds = visualBounds(visualParts);
  return {
    robot: shiftedRobot,
    satellites: shiftedSatellites,
    visualHeight: bounds.bottom - bounds.top,
  };
}

function satelliteLayout(): Satellite[] {
  return SATELLITE_SPECS.map((spec) => ({
    dx: gridOffset(spec.gridX, FIXED_LAYOUT_SCALE) + (spec.nudgeX ?? 0),
    dy: gridOffset(spec.gridY, FIXED_LAYOUT_SCALE) + (spec.nudgeY ?? 0),
    size: spec.baseSize,
    className: spec.className,
    activeTurns: spec.activeTurns,
  }));
}

function satellitePart(satellite: Satellite): NodePart {
  return { x: satellite.dx, y: satellite.dy, size: satellite.size };
}

function shiftPart(part: NodePart, frame: NodePart): NodePart {
  return { ...part, x: part.x - frame.x, y: part.y - frame.y };
}

function shiftSatellite(satellite: Satellite, frame: NodePart): Satellite {
  return {
    ...satellite,
    dx: satellite.dx - frame.x,
    dy: satellite.dy - frame.y,
  };
}

function visualBounds(parts: readonly NodePart[]) {
  const bounds = parts.map(partBounds);
  return {
    top: Math.min(...bounds.map((bound) => bound.top)),
    bottom: Math.max(...bounds.map((bound) => bound.bottom)),
  };
}

function visualFrame(parts: readonly NodePart[]): NodePart {
  const bounds = parts.map(partBounds);
  const left = Math.min(...bounds.map((bound) => bound.left));
  const right = Math.max(...bounds.map((bound) => bound.right));
  const top = Math.min(...bounds.map((bound) => bound.top));
  const bottom = Math.max(...bounds.map((bound) => bound.bottom));
  return { x: (left + right) / 2, y: (top + bottom) / 2, size: 0 };
}

function gridOffset(slots: number, scale: number): number {
  return Math.round(slots * DIAGRAM_GRID * scale);
}

function partBounds({ x, y, size }: NodePart) {
  const displaySize = size * OPENMOJI_VISUAL_SCALE;
  const offset = (displaySize - size) / 2;
  return {
    left: x - offset,
    right: x - offset + displaySize,
    top: y - offset,
    bottom: y - offset + displaySize,
  };
}
