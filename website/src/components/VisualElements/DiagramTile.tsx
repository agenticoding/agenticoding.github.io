/* eslint-disable react/prop-types -- TypeScript owns prop validation for SVG primitive props. */
import React, { type CSSProperties } from 'react';
import { EmojiImage } from './ActorNodes';
import { centeredEmojiOffset, emojiDisplaySize, OPENMOJI_VIEWBOX_SIZE, type EmojiAsset } from './emojiAssets';
import { TILE_LAYOUT, tileToneVars, voiceStyle, wrapSvgText, type DiagramTone, type DiagramVoice } from './diagramTileLayout';
import { DIAGRAM_STROKE, PROCESS_TILE_SCALE } from './diagramScale';

type Variant = 'rich' | 'compact' | 'centered' | 'accent' | 'process' | 'label';
type Density = 'desktop' | 'mobile';

const LABEL_TILE_ICON_SIZE = TILE_LAYOUT.iconSize.compact;
const LABEL_TILE_ICON_X = 28;
const LABEL_TILE_TEXT_X = 56;
const LABEL_TILE_ICON_GAP = 12;
const LABEL_TILE_CHAR_WIDTH = 6.8;

export type DiagramTileSurfaceProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  tone?: DiagramTone;
  fill?: string;
  stroke?: string;
  className?: string;
  weight?: number;
};

type DiagramTileProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  tone: DiagramTone;
  title: string;
  fill?: string;
  className?: string;
  detail?: string | readonly string[];
  density?: Density;
  eyebrow?: string;
  icon?: EmojiAsset;
  labelAlign?: 'start' | 'center';
  labelClassName?: string;
  labelIconSize?: number;
  labelIconX?: number;
  labelTextX?: number;
  rectClassName?: string;
  stepLabel?: string;
  style?: CSSProperties;
  titleVoice?: DiagramVoice;
  variant?: Variant;
  weight?: number;
};

type TextLineProps = { x: number; y: number; lines: readonly string[]; fill: string; style: CSSProperties; anchor?: 'start' | 'middle'; gap?: number };

export function DiagramTile(props: DiagramTileProps) {
  if (props.variant === 'centered') return <CenteredTile {...props} />;
  if (props.variant === 'compact') return <CompactTile {...props} />;
  if (props.variant === 'accent') return <AccentTile {...props} />;
  if (props.variant === 'process') return <ProcessTile {...props} />;
  if (props.variant === 'label') return <LabelTile {...props} />;
  return <RichTile {...props} />;
}

export function DiagramTileSurface({ x, y, width, height, tone = 'neutral', fill, stroke, className, weight }: DiagramTileSurfaceProps) {
  const color = tileToneVars(tone);
  return <rect x={x} y={y} width={width} height={height} rx={0} ry={0} fill={fill ?? color.fill} stroke={stroke ?? color.stroke} strokeWidth={weight ?? DIAGRAM_STROKE.thin} className={className} vectorEffect="non-scaling-stroke" />;
}

function BaseTile({ props, children }: { props: DiagramTileProps; children: React.ReactNode }) {
  return (
    <g className={props.className} style={props.style}>
      <DiagramTileSurface x={props.x} y={props.y} width={props.width} height={props.height} tone={props.tone} fill={props.fill} weight={props.weight} className={props.rectClassName} />
      {children}
    </g>
  );
}

function RichTile(props: DiagramTileProps) {
  const color = tileToneVars(props.tone);
  const layout = richLayout(props);
  const titleLines = wrapSvgText(props.title, layout.textWidth, 12, props.eyebrow ? 2 : 1);
  const dividerY = layout.titleY + (props.eyebrow ? 12 : 8) + (titleLines.length - 1) * 14;
  const detailY = dividerY + (props.eyebrow ? 23 : 18);
  const detailFontSize = props.width < 200 ? 8 : 9;
  const detailLines = detailText(props.detail, layout.textWidth, detailFontSize, 2);
  return (
    <BaseTile props={props}>
      {props.eyebrow && <text x={props.x + TILE_LAYOUT.padding} y={props.y + 24} fill={color.label} style={eyebrowStyle()}>{props.eyebrow}</text>}
      {props.stepLabel && <text x={props.x + TILE_LAYOUT.padding} y={props.y + 18} fill={color.text} style={stepStyle()}>{props.stepLabel}</text>}
      {props.icon && <EmojiImage asset={props.icon} x={props.x + TILE_LAYOUT.padding} y={layout.iconY} size={layout.iconSize} />}
      <TextLines x={layout.textX} y={layout.titleY} lines={titleLines} fill={color.title} style={voiceStyle(props.titleVoice ?? 'spec', 12, 700)} />
      <line x1={layout.textX} y1={dividerY} x2={props.x + props.width - TILE_LAYOUT.padding} y2={dividerY} stroke={color.accent} opacity={0.45} strokeWidth={DIAGRAM_STROKE.thin} vectorEffect="non-scaling-stroke" />
      <TextLines x={layout.textX} y={detailY} lines={detailLines} fill={color.muted} style={voiceStyle('keyword', detailFontSize, 400)} gap={12} />
    </BaseTile>
  );
}

function CenteredTile(props: DiagramTileProps) {
  const color = tileToneVars(props.tone);
  const titleLines = wrapSvgText(props.title, props.width - TILE_LAYOUT.padding * 2, 15, 2);
  const detailLines = detailText(props.detail, props.width - TILE_LAYOUT.padding * 2, 11, 2);
  return (
    <BaseTile props={props}>
      <TextLines x={props.x + props.width / 2} y={props.y + 34} lines={titleLines} fill={color.stroke} style={voiceStyle(props.titleVoice ?? 'display', 15, 700)} anchor="middle" />
      <TextLines x={props.x + props.width / 2} y={props.y + 60} lines={detailLines} fill="var(--text-body)" style={voiceStyle('keyword', 11, 400)} anchor="middle" />
    </BaseTile>
  );
}

function CompactTile(props: DiagramTileProps) {
  const color = tileToneVars(props.tone);
  return (
    <BaseTile props={props}>
      <text x={props.x + props.width / 2} y={props.y + props.height / 2 - 4} textAnchor="middle" dominantBaseline="middle" fill={color.title} style={voiceStyle(props.titleVoice ?? 'ai', 11, 500)}>{props.title}</text>
      {props.detail && <text x={props.x + props.width / 2} y={props.y + props.height / 2 + 12} textAnchor="middle" dominantBaseline="middle" fill={color.muted} style={voiceStyle('spec', 9, 400)}>{String(props.detail)}</text>}
    </BaseTile>
  );
}

function LabelTile(props: DiagramTileProps) {
  const color = tileToneVars(props.tone);
  const iconSize = props.labelIconSize ?? LABEL_TILE_ICON_SIZE;
  const { iconX, textX } = labelLayout(props, iconSize);
  return (
    <BaseTile props={props}>
      {props.icon && <EmojiImage asset={props.icon} x={props.x + iconX} y={props.y + (props.height - iconSize) / 2} size={iconSize} />}
      <text x={props.x + textX} y={props.y + props.height / 2} dominantBaseline="middle" fill={color.title} className={props.labelClassName} style={props.labelClassName ? undefined : voiceStyle(props.titleVoice ?? 'spec', 11, 600)}>{props.title}</text>
    </BaseTile>
  );
}

function labelLayout(props: DiagramTileProps, iconSize: number) {
  if (props.labelIconX !== undefined || props.labelTextX !== undefined || props.labelAlign !== 'center') {
    return { iconX: props.labelIconX ?? LABEL_TILE_ICON_X, textX: props.labelTextX ?? LABEL_TILE_TEXT_X };
  }
  const textWidth = props.title.length * LABEL_TILE_CHAR_WIDTH;
  if (!props.icon) {
    return { iconX: 0, textX: (props.width - textWidth) / 2 };
  }
  const icon = labelIconVisualMetrics(props.icon, iconSize);
  const contentWidth = icon.width + LABEL_TILE_ICON_GAP + textWidth;
  const visualIconX = (props.width - contentWidth) / 2;
  return {
    iconX: visualIconX + icon.offset - icon.x,
    textX: visualIconX + icon.width + LABEL_TILE_ICON_GAP,
  };
}

function labelIconVisualMetrics(icon: EmojiAsset, iconSize: number) {
  const displaySize = emojiDisplaySize(iconSize);
  const scale = displaySize / OPENMOJI_VIEWBOX_SIZE;
  const bounds = icon.visualBounds ?? { x: 0, width: OPENMOJI_VIEWBOX_SIZE };
  return {
    offset: centeredEmojiOffset(iconSize),
    x: bounds.x * scale,
    width: bounds.width * scale,
  };
}

function AccentTile(props: DiagramTileProps) {
  const color = tileToneVars(props.tone);
  const lines = detailText(props.detail, props.width - 48, 10, 4);
  return (
    <BaseTile props={props}>
      <line x1={props.x + 16} y1={props.y + 24} x2={props.x + 16} y2={props.y + props.height - 24} stroke={color.accent} strokeWidth="var(--stroke-heavy)" />
      <text x={props.x + 32} y={props.y + 32} fill="var(--text-heading)" style={voiceStyle('display', 13, 700)}>{props.title}</text>
      <TextLines x={props.x + 32} y={props.y + 56} lines={lines} fill="var(--text-body)" style={voiceStyle('keyword', 10, 500)} gap={18} />
    </BaseTile>
  );
}

function ProcessTile(props: DiagramTileProps) {
  const color = tileToneVars(props.tone);
  const layout = processLayout(props);
  return (
    <BaseTile props={props}>
      {props.stepLabel && <text x={props.x + PROCESS_TILE_SCALE.padding} y={props.y + 18} fill={color.text} style={processStepStyle()}>{props.stepLabel}</text>}
      {props.icon && <EmojiImage asset={props.icon} x={props.x + PROCESS_TILE_SCALE.padding} y={layout.iconY} size={PROCESS_TILE_SCALE.iconSize} />}
      <TextLines x={layout.textX} y={layout.titleY} lines={layout.titleLines} fill={color.title} style={voiceStyle(props.titleVoice ?? 'spec', PROCESS_TILE_SCALE.titleFontSize, 700)} />
      <line x1={layout.textX} y1={layout.dividerY} x2={props.x + props.width - PROCESS_TILE_SCALE.padding} y2={layout.dividerY} stroke={color.accent} opacity={0.45} strokeWidth={DIAGRAM_STROKE.thin} vectorEffect="non-scaling-stroke" />
      <TextLines x={layout.textX} y={layout.detailY} lines={layout.detailLines} fill={color.muted} style={voiceStyle('keyword', PROCESS_TILE_SCALE.detailFontSize, 400)} gap={PROCESS_TILE_SCALE.detailLineGap} />
    </BaseTile>
  );
}

function TextLines({ x, y, lines, fill, style, anchor = 'start', gap = 14 }: TextLineProps) {
  return <text x={x} y={y} textAnchor={anchor} fill={fill} style={style}>{lines.map((line, i) => <tspan key={`${line}-${i}`} x={x} dy={i === 0 ? 0 : gap}>{line}</tspan>)}</text>;
}

function richLayout(props: DiagramTileProps) {
  const iconSize = richIconSize(props);
  const iconGap = props.width < 200 ? 6 : props.eyebrow ? TILE_LAYOUT.iconGap : 8;
  const textX = props.x + TILE_LAYOUT.padding + iconSize + iconGap;
  return { iconSize, iconY: props.y + (props.eyebrow ? 48 : 30), textX, textWidth: props.x + props.width - TILE_LAYOUT.padding - textX, titleY: props.y + (props.eyebrow ? 61 : 24) };
}

function richIconSize(props: DiagramTileProps) {
  if (!props.eyebrow || props.width < 200) return TILE_LAYOUT.iconSize.mobile;
  return props.density === 'mobile' ? TILE_LAYOUT.iconSize.mobile : TILE_LAYOUT.iconSize.desktop;
}

function processLayout(props: DiagramTileProps) {
  const textX = props.x + PROCESS_TILE_SCALE.padding + PROCESS_TILE_SCALE.iconSize + PROCESS_TILE_SCALE.iconGap;
  const textWidth = props.x + props.width - PROCESS_TILE_SCALE.padding - textX;
  return {
    textX,
    textWidth,
    iconY: props.y + processIconOffset(props),
    titleY: props.y + (isShortProcessTile(props) ? 24 : 25),
    dividerY: props.y + (isShortProcessTile(props) ? 38 : 40),
    detailY: props.y + 52,
    titleLines: wrapSvgText(props.title, textWidth, PROCESS_TILE_SCALE.titleFontSize, 1),
    detailLines: detailText(props.detail, textWidth, PROCESS_TILE_SCALE.detailFontSize, 2),
  };
}

function processIconOffset(props: DiagramTileProps) {
  return isShortProcessTile(props) ? 24 : 32;
}

function isShortProcessTile(props: DiagramTileProps) {
  return props.height <= PROCESS_TILE_SCALE.shortHeight;
}

function detailText(detail: DiagramTileProps['detail'], maxWidth: number, fontSize: number, maxLines: number) {
  if (!detail) return [];
  if (typeof detail === 'string') return wrapSvgText(detail, maxWidth, fontSize, maxLines);
  return detail.flatMap((line) => wrapSvgText(line, maxWidth, fontSize, 1)).slice(0, maxLines);
}

function eyebrowStyle() {
  return { ...voiceStyle('spec', 9, 600), letterSpacing: '0.08em' };
}

function stepStyle() {
  return { ...voiceStyle('keyword', 10, 700), letterSpacing: '0.08em' };
}

function processStepStyle() {
  return { ...voiceStyle('keyword', PROCESS_TILE_SCALE.stepFontSize, 700), letterSpacing: '0.08em' };
}
