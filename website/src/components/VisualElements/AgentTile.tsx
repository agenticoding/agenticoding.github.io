import React from 'react';
import { DiagramTileSurface } from './DiagramTile';
import { DIAGRAM_GRID } from './diagramScale';
import { tileToneVars, type DiagramTone, voiceStyle } from './diagramTileLayout';
import {
  WorkingAgentNode,
  type WorkingAgentActivation,
} from './WorkingAgentNode';

type BoxProps = { x: number; y: number; width: number; height: number };
type AgentTileTextClasses = {
  eyebrow?: string;
  title?: string;
  detail?: string;
};

type ContextClasses = {
  eyebrow?: string;
  detail?: string;
  tile?: string;
  tileRect?: string;
  tileText?: string;
};

export type AgentTileProps = BoxProps & {
  tone: DiagramTone;
  title: string;
  agentBlockHeight?: number;
  children?: React.ReactNode;
  className?: string;
  detail?: string;
  eyebrow?: string;
  gearActivation?: WorkingAgentActivation;
  iconSize: number;
  rectClassName?: string;
  showSurface?: boolean;
  textClasses?: AgentTileTextClasses;
  titleClassName?: string;
};

export type AgentContextTile = {
  label: string;
  activationDelayMs?: number;
  className?: string;
  key?: string;
};

export type ContextAgentTileProps = Omit<AgentTileProps, 'children'> & {
  contextDetail: string;
  contextEyebrow: string;
  contextTiles: readonly AgentContextTile[];
  contextClasses?: ContextClasses;
};

export function AgentTile(props: AgentTileProps) {
  const layout = agentTileLayout(agentBox(props), Boolean(props.detail));
  return (
    <g className={props.className}>
      <AgentTileSurface {...props} />
      {props.children}
      <WorkingAgentNode
        x={layout.centerX}
        y={layout.iconY}
        size={props.iconSize}
        activation={props.gearActivation}
      />
      <AgentTileLabels {...props} layout={layout} />
    </g>
  );
}

export function ContextAgentTile(props: ContextAgentTileProps) {
  const { contextClasses } = props;
  return (
    <AgentTile {...props}>
      <ContextTileHeader {...props} />
      <ContextTiles
        tiles={props.contextTiles}
        x={props.x + 14}
        y={props.y + 62}
        width={props.width - 28}
        classes={contextClasses}
      />
    </AgentTile>
  );
}

function AgentTileSurface(props: AgentTileProps) {
  if (props.showSurface === false) return null;
  return (
    <DiagramTileSurface
      x={props.x}
      y={props.y}
      width={props.width}
      height={props.height}
      tone={props.tone}
      weight={1.5}
      className={props.rectClassName}
    />
  );
}

function ContextTileHeader(props: ContextAgentTileProps) {
  return (
    <>
      <HeaderText {...props} y={props.y + 26} field="eyebrow" />
      <HeaderText {...props} y={props.y + 46} field="detail" />
    </>
  );
}

function HeaderText(props: ContextAgentTileProps & { y: number; field: 'eyebrow' | 'detail' }) {
  const className = props.contextClasses?.[props.field];
  return (
    <text
      x={props.x + 14}
      y={props.y}
      fill={props.field === 'eyebrow' ? 'var(--text-heading)' : 'var(--text-muted)'}
      className={className}
      style={className ? undefined : headerStyle(props.field)}
    >
      {props.field === 'eyebrow' ? props.contextEyebrow : props.contextDetail}
    </text>
  );
}

function ContextTiles(props: {
  tiles: readonly AgentContextTile[];
  x: number;
  y: number;
  width: number;
  classes?: ContextClasses;
}) {
  return (
    <>
      {props.tiles.map((tile, index) => (
        <ContextChip
          key={tile.key ?? tile.label}
          tile={tile}
          x={props.x}
          y={props.y + index * 22}
          width={props.width}
          classes={props.classes}
        />
      ))}
    </>
  );
}

function ContextChip(props: {
  tile: AgentContextTile;
  x: number;
  y: number;
  width: number;
  classes?: ContextClasses;
}) {
  return (
    <g className={chipClassName(props)} style={activationStyle(props.tile.activationDelayMs)}>
      <ContextChipRect {...props} />
      <ContextChipText {...props} />
    </g>
  );
}

function ContextChipRect({ x, y, width, classes }: {
  x: number;
  y: number;
  width: number;
  classes?: ContextClasses;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={18}
      fill="var(--surface-page)"
      stroke="var(--border-subtle)"
      className={classes?.tileRect}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function ContextChipText({ tile, x, y, classes }: {
  tile: AgentContextTile;
  x: number;
  y: number;
  classes?: ContextClasses;
}) {
  return (
    <text
      x={x + 10}
      y={y + 13}
      fill="var(--text-body)"
      className={classes?.tileText}
      style={classes?.tileText ? undefined : voiceStyle('keyword', 11, 600)}
    >
      {tile.label}
    </text>
  );
}

function AgentTileLabels(props: AgentTileProps & {
  layout: ReturnType<typeof agentTileLayout>;
}) {
  const className = props.titleClassName ?? props.textClasses?.title;
  return (
    <>
      <EyebrowText {...props} />
      <CenteredText
        x={props.layout.centerX}
        y={props.layout.titleY}
        fill="var(--text-heading)"
        className={className}
        style={className ? undefined : voiceStyle('display', 13, 700)}
      >
        {props.title}
      </CenteredText>
      <DetailText {...props} />
    </>
  );
}

function EyebrowText(props: AgentTileProps & { layout: ReturnType<typeof agentTileLayout> }) {
  if (!props.eyebrow) return null;
  const className = props.textClasses?.eyebrow;
  return (
    <CenteredText
      x={props.layout.centerX}
      y={props.layout.eyebrowY}
      fill={tileToneVars(props.tone).label}
      className={className}
      style={className ? undefined : voiceStyle('spec', 10, 600)}
    >
      {props.eyebrow}
    </CenteredText>
  );
}

function DetailText(props: AgentTileProps & { layout: ReturnType<typeof agentTileLayout> }) {
  if (!props.detail) return null;
  const className = props.textClasses?.detail;
  return (
    <CenteredText
      x={props.layout.centerX}
      y={props.layout.detailY}
      fill="var(--text-muted)"
      className={className}
      style={className ? undefined : voiceStyle('keyword', 9, 500)}
    >
      {props.detail}
    </CenteredText>
  );
}

function CenteredText(props: {
  x: number;
  y: number;
  fill: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <text
      x={props.x}
      y={props.y}
      textAnchor="middle"
      fill={props.fill}
      className={props.className}
      style={props.style}
    >
      {props.children}
    </text>
  );
}

function agentTileLayout({ x, y, width, height }: BoxProps, hasDetail: boolean) {
  const centerX = x + width / 2;
  const eyebrowY = y + height - DIAGRAM_GRID * (hasDetail ? 5.25 : 4);
  return {
    centerX,
    detailY: y + height - DIAGRAM_GRID * 1.25,
    eyebrowY,
    iconY: y + (eyebrowY - y) / 2,
    titleY: y + height - DIAGRAM_GRID * (hasDetail ? 2.75 : 1.5),
  };
}

function agentBox(props: AgentTileProps): BoxProps {
  if (!props.agentBlockHeight) return props;
  return {
    ...props,
    y: props.y + props.height - props.agentBlockHeight,
    height: props.agentBlockHeight,
  };
}

export function activationStyle(delayMs: number | undefined): React.CSSProperties | undefined {
  if (delayMs === undefined) return undefined;
  return { animationDelay: `${delayMs}ms` };
}

function chipClassName({ tile, classes }: { tile: AgentContextTile; classes?: ContextClasses }) {
  return [classes?.tile, tile.className].filter(Boolean).join(' ') || undefined;
}

function headerStyle(field: 'eyebrow' | 'detail') {
  if (field === 'eyebrow') return voiceStyle('spec', 10, 600);
  return voiceStyle('keyword', 9, 500);
}
