import React from 'react';

import { AgentNode, type AgentNodeProps } from './ActorNodes';
import { DIAGRAM_ICON_SIZE } from './diagramScale';
import { GearNode } from './GearNode';
import styles from './WorkingAgentNode.module.css';

type Satellite = {
  dx: number;
  dy: number;
  size: number;
  className: string;
};

export type WorkingAgentNodeProps = AgentNodeProps;

const DEFAULT_AGENT_SIZE = DIAGRAM_ICON_SIZE.actor;
const DEFAULT_SATELLITE_SIZE = DIAGRAM_ICON_SIZE.tertiary;

export function WorkingAgentNode({
  x,
  y,
  size = DEFAULT_AGENT_SIZE,
}: WorkingAgentNodeProps) {
  const satellites = satelliteLayout(size);

  return (
    <g>
      <AgentNode x={x} y={y} size={size} />
      {satellites.map((satellite) => (
        <GearNode
          key={`${satellite.dx}-${satellite.dy}`}
          x={x + satellite.dx}
          y={y + satellite.dy}
          size={satellite.size}
          className={`${styles.satellite} ${satellite.className}`}
        />
      ))}
    </g>
  );
}

function satelliteLayout(agentSize: number): Satellite[] {
  const scale = agentSize / DEFAULT_AGENT_SIZE;
  const small = scaledSatellite(DIAGRAM_ICON_SIZE.tertiary, scale);
  const medium = scaledSatellite(DIAGRAM_ICON_SIZE.secondary, scale);

  return [
    {
      dx: agentSize * 1.25,
      dy: -agentSize * 0.72,
      size: medium,
      className: styles.satellitePrimary,
    },
    {
      dx: agentSize * 1.3,
      dy: -agentSize * 0.05,
      size: small,
      className: styles.satelliteSecondary,
    },
    {
      dx: agentSize * 1.18,
      dy: agentSize * 0.58,
      size: small,
      className: styles.satelliteTertiary,
    },
  ];
}

function scaledSatellite(baseSize: number, scale: number): number {
  return Math.max(DEFAULT_SATELLITE_SIZE, Math.round(baseSize * scale));
}
