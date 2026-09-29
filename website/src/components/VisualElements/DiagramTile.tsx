/* eslint-disable react/prop-types -- TypeScript owns prop validation for SVG primitive props. */
import React, { type CSSProperties } from 'react';
import { EmojiImage } from './ActorNodes';
import {
  centeredEmojiOffset,
  emojiDisplaySize,
  OPENMOJI_VIEWBOX_SIZE,
  type EmojiAsset,
} from './emojiAssets';
import { CodeSystemIcon } from './CodeSystemIcon';
import {
  tileToneVars,
  voiceStyle,
  wrapSvgText,
  type DiagramTone,
  type DiagramVoice,
} from './diagramTileLayout';
import {
  DIAGRAM_GRID,
  DIAGRAM_HALF,
  DIAGRAM_ICON_SIZE,
  DIAGRAM_SPACE,
  DIAGRAM_STROKE,
  PROCESS_TILE_SCALE,
  TILE_TYPE,
} from './diagramScale';

type Variant = 'rich' | 'compact' | 'centered' | 'process' | 'label';
type Density = 'desktop' | 'mobile';

// One tile heading, two placements. A `top` heading hangs from the tile's top edge
// (the house rich tile). A `center` heading is centred as one block — icon and copy
// together — so a tile that also holds a drawing stays balanced. `iconLayout` stacks
// the lead icon above the copy when a tile is too narrow to lead with it.
export type TileHeadingAlign = 'top' | 'center';
export type TileIconLayout = 'inline' | 'above';
export type TileIconAnchor = 'nominal' | 'drawn';

type TileHeadingSpec = {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
  align: TileHeadingAlign;
  iconLayout: TileIconLayout;
  /** `size`/`gap`/`anchor` describe the reserved icon column; `topOffset` places the
      icon in a `top` heading. Always reserved, even when the caller draws no icon. */
  icon: {
    size: number;
    gap: number;
    anchor: TileIconAnchor;
    topOffset?: number;
    scale: number;
  };
  title: { lines: number; topOffset?: number };
  detail: { lines: number; gap?: number };
  /** Distance from the title baseline down to the divider; `undefined` = no divider. */
  dividerLead?: number;
};

export type TileHeadingColumn = {
  icon: { x: number; y: number };
  iconSize: number;
  textX: number;
  textWidth: number;
};

export type TileHeadingIcon =
  | { type: 'emoji'; asset: EmojiAsset; className?: string }
  | { type: 'code' };

const LABEL_TILE_ICON_SIZE = DIAGRAM_ICON_SIZE.secondary;
const LABEL_TILE_ICON_X = DIAGRAM_GRID * 3;
const LABEL_TILE_TEXT_X = DIAGRAM_GRID * 7;
const LABEL_TILE_ICON_GAP = DIAGRAM_SPACE.iconGap;
// Mean advance of one title glyph at TILE_TYPE.detail (11px): the centred label
// variant has no text column, so the title width is estimated from its length.
const LABEL_TILE_CHAR_WIDTH = 6.8;

// A centred heading places its title baseline a fixed lift above the tile centre and
// steps the whole block up by half a line gap per wrapped detail line, so the block
// stays centred without a per-tile magic offset.
const CENTER_LIFT = DIAGRAM_GRID;
const CENTER_WEIGHT = DIAGRAM_SPACE.detailLineGap / 2;

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

export type DiagramTileProps = {
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
  detailGap?: number;
  eyebrow?: string;
  icon?: EmojiAsset;
  iconClassName?: string;
  systemIcon?: 'code';
  labelAlign?: 'start' | 'center';
  /** Body drawn between the surface and the heading, so a pulse sits under the copy. */
  children?: React.ReactNode;
  align?: TileHeadingAlign;
  iconLayout?: TileIconLayout;
  iconSize?: number;
  iconAnchor?: TileIconAnchor;
  showDivider?: boolean;
  detailMaxLines?: number;
  /** Shrinks the drawn lead icon inside its reserved column without moving the text
      column, to match an asset's visual weight to its neighbours. 1 = as drawn. */
  iconScale?: number;
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

type TextLineProps = {
  x: number;
  y: number;
  lines: readonly string[];
  fill: string;
  style: CSSProperties;
  anchor?: 'start' | 'middle';
  gap?: number;
};

export function DiagramTile(props: DiagramTileProps) {
  if (props.variant === 'centered') return <CenteredTile {...props} />;
  if (props.variant === 'compact') return <CompactTile {...props} />;
  if (props.variant === 'process') return <ProcessTile {...props} />;
  if (props.variant === 'label') return <LabelTile {...props} />;
  return <RichTile {...props} />;
}

export function DiagramTileSurface({
  x,
  y,
  width,
  height,
  tone = 'neutral',
  fill,
  stroke,
  className,
  weight,
}: DiagramTileSurfaceProps) {
  const color = tileToneVars(tone);
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={0}
      ry={0}
      fill={fill ?? color.fill}
      stroke={stroke ?? color.stroke}
      strokeWidth={weight ?? DIAGRAM_STROKE.thin}
      className={className}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function BaseTile({
  props,
  children,
}: {
  props: DiagramTileProps;
  children: React.ReactNode;
}) {
  return (
    <g className={props.className} style={props.style}>
      <DiagramTileSurface
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        tone={props.tone}
        fill={props.fill}
        weight={props.weight}
        className={props.rectClassName}
      />
      {children}
    </g>
  );
}

function RichTile(props: DiagramTileProps) {
  const color = tileToneVars(props.tone);
  const spec = richHeadingSpec(props);
  // The column never depends on the line counts, so it is safe to measure before the
  // wrap resolves them.
  const { textWidth } = tileHeadingColumn(spec);
  const titleLines = richTitleLines(props, textWidth);
  const detailLines = richDetailLines(props, textWidth);
  return (
    <BaseTile props={props}>
      {props.children}
      {richEyebrow(props, color.label)}
      {richStepLabel(props, color.text)}
      {richHeading(props, spec, color, titleLines, detailLines)}
    </BaseTile>
  );
}

function richHeading(
  props: DiagramTileProps,
  spec: TileHeadingSpec,
  color: { title: string; muted: string; accent: string },
  titleLines: readonly string[],
  detailLines: readonly string[]
) {
  return (
    <TileHeading
      spec={withHeadingLines(spec, titleLines.length, detailLines.length)}
      icon={richHeadingIcon(props)}
      titleLines={titleLines}
      detailLines={detailLines}
      {...richHeadingPaint(props, color)}
    />
  );
}

function richHeadingPaint(
  props: DiagramTileProps,
  color: { title: string; muted: string; accent: string }
) {
  return {
    titleFill: color.title,
    detailFill: color.muted,
    dividerColor: color.accent,
    titleStyle: voiceStyle(props.titleVoice ?? 'spec', TILE_TYPE.title, 700),
    detailStyle: voiceStyle('keyword', TILE_TYPE.detail, 400),
  };
}

function richTitleLines(props: DiagramTileProps, textWidth: number) {
  return wrapSvgText(
    props.title,
    textWidth,
    TILE_TYPE.title,
    props.eyebrow ? 2 : 1
  );
}

function richDetailLines(props: DiagramTileProps, textWidth: number) {
  return detailText(
    props.detail,
    textWidth,
    TILE_TYPE.detail,
    props.detailMaxLines ?? 2
  );
}

function richEyebrow(props: DiagramTileProps, fill: string) {
  if (!props.eyebrow) return null;
  return (
    <text
      x={props.x + DIAGRAM_SPACE.tilePadding}
      y={props.y + DIAGRAM_GRID * 3}
      fill={fill}
      style={eyebrowStyle()}
    >
      {props.eyebrow}
    </text>
  );
}

function richStepLabel(props: DiagramTileProps, fill: string) {
  if (!props.stepLabel) return null;
  return (
    <text
      x={props.x + DIAGRAM_SPACE.tilePadding}
      y={props.y + DIAGRAM_GRID * 2}
      fill={fill}
      style={stepStyle()}
    >
      {props.stepLabel}
    </text>
  );
}

function richHeadingSpec(props: DiagramTileProps): TileHeadingSpec {
  const eyebrow = Boolean(props.eyebrow);
  return {
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    padding: DIAGRAM_SPACE.tilePadding,
    align: props.align ?? 'top',
    iconLayout: props.iconLayout ?? 'inline',
    icon: richIconSpec(props, eyebrow),
    title: {
      lines: 0,
      topOffset: eyebrow ? DIAGRAM_GRID * 8 : DIAGRAM_GRID * 3,
    },
    detail: richDetailSpec(props, eyebrow),
    dividerLead: richDividerLead(props, eyebrow),
  };
}

function richIconSpec(
  props: DiagramTileProps,
  eyebrow: boolean
): TileHeadingSpec['icon'] {
  return {
    size: props.iconSize ?? richIconSize(props),
    gap: DIAGRAM_SPACE.iconGap,
    anchor: props.iconAnchor ?? 'nominal',
    topOffset: eyebrow ? DIAGRAM_GRID * 6 : DIAGRAM_GRID * 4,
    scale: props.iconScale ?? 1,
  };
}

function richDetailSpec(
  props: DiagramTileProps,
  eyebrow: boolean
): TileHeadingSpec['detail'] {
  return {
    lines: 0,
    gap:
      props.detailGap ?? (eyebrow ? DIAGRAM_GRID * 3 : DIAGRAM_SPACE.detailGap),
  };
}

function richDividerLead(
  props: DiagramTileProps,
  eyebrow: boolean
): number | undefined {
  if (props.showDivider === false) return undefined;
  return eyebrow ? DIAGRAM_GRID * 2 : DIAGRAM_SPACE.dividerLead;
}

function richIconSize(props: DiagramTileProps) {
  if (!props.eyebrow || props.width < 200) return DIAGRAM_ICON_SIZE.secondary;
  return props.density === 'mobile'
    ? DIAGRAM_ICON_SIZE.secondary
    : DIAGRAM_ICON_SIZE.primary;
}

function richHeadingIcon(props: DiagramTileProps): TileHeadingIcon | undefined {
  if (props.systemIcon === 'code') return { type: 'code' };
  if (props.icon)
    return { type: 'emoji', asset: props.icon, className: props.iconClassName };
  return undefined;
}

function withHeadingLines(
  spec: TileHeadingSpec,
  titleLines: number,
  detailLines: number
): TileHeadingSpec {
  return {
    ...spec,
    title: { ...spec.title, lines: titleLines },
    detail: { ...spec.detail, lines: detailLines },
  };
}

/** The single heading implementation every tile shares: reserved icon column, title,
    optional divider, detail — positioned by {@link tileHeadingColumn} and a stack. */
function TileHeading({
  spec,
  icon,
  titleLines,
  detailLines,
  titleFill,
  detailFill,
  dividerColor,
  titleStyle,
  detailStyle,
}: {
  spec: TileHeadingSpec;
  icon?: TileHeadingIcon;
  titleLines: readonly string[];
  detailLines: readonly string[];
  titleFill: string;
  detailFill: string;
  dividerColor: string;
  titleStyle: CSSProperties;
  detailStyle: CSSProperties;
}) {
  const column = tileHeadingColumn(spec);
  const stack = tileHeadingStack(spec);
  return (
    <>
      {headingIcon(icon, column, spec.icon.scale)}
      {headingTitle(
        column.textX,
        stack.titleY,
        titleLines,
        titleFill,
        titleStyle
      )}
      {headingDivider(spec, column, stack.dividerY, dividerColor)}
      {headingDetail(
        stack.detailX,
        stack.detailY,
        detailLines,
        detailFill,
        detailStyle
      )}
    </>
  );
}

function headingTitle(
  x: number,
  y: number,
  lines: readonly string[],
  fill: string,
  style: CSSProperties
) {
  return <TextLines x={x} y={y} lines={lines} fill={fill} style={style} />;
}

function headingDetail(
  x: number,
  y: number,
  lines: readonly string[],
  fill: string,
  style: CSSProperties
) {
  return (
    <TextLines
      x={x}
      y={y}
      lines={lines}
      fill={fill}
      style={style}
      gap={DIAGRAM_SPACE.detailLineGap}
    />
  );
}

function headingDivider(
  spec: TileHeadingSpec,
  column: TileHeadingColumn,
  dividerY: number | null,
  color: string
) {
  if (dividerY === null) return null;
  return (
    <line
      x1={column.textX}
      y1={dividerY}
      x2={spec.x + spec.width - spec.padding}
      y2={dividerY}
      stroke={color}
      opacity={0.45}
      strokeWidth={DIAGRAM_STROKE.thin}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function headingIcon(
  icon: TileHeadingIcon | undefined,
  column: TileHeadingColumn,
  scale: number
) {
  if (!icon) return null;
  if (icon.type === 'code') return headingCodeIcon(column);
  return headingEmojiIcon(icon, column, scale);
}

function headingCodeIcon(column: TileHeadingColumn) {
  return (
    <CodeSystemIcon
      x={column.icon.x}
      y={column.icon.y}
      size={column.iconSize}
    />
  );
}

function headingEmojiIcon(
  icon: Extract<TileHeadingIcon, { type: 'emoji' }>,
  column: TileHeadingColumn,
  scale: number
) {
  return (
    <EmojiImage
      asset={icon.asset}
      x={column.icon.x}
      y={column.icon.y}
      size={column.iconSize}
      scale={scale}
      className={icon.className}
    />
  );
}

/** The icon's reserved column and the text column beside it. Depends on line counts
    only through the centred-icon placement, so a `top` caller may measure text first. */
export function tileHeadingColumn(spec: TileHeadingSpec): TileHeadingColumn {
  const display = emojiDisplaySize(spec.icon.size);
  const offset = centeredEmojiOffset(spec.icon.size);
  const textX = headingTextX(spec, display);
  const titleY = headingTitleY(spec, display);
  return {
    icon: headingIconBox(spec, titleY, display, offset),
    iconSize: spec.icon.size,
    textX,
    textWidth: spec.x + spec.width - spec.padding - textX,
  };
}

function tileHeadingStack(spec: TileHeadingSpec) {
  const display = emojiDisplaySize(spec.icon.size);
  const titleY = headingTitleY(spec, display);
  const dividerY =
    spec.dividerLead === undefined
      ? null
      : titleY +
        spec.dividerLead +
        (spec.title.lines - 1) * DIAGRAM_SPACE.titleLineGap;
  return {
    titleY,
    dividerY,
    detailX: headingTextX(spec, display),
    detailY: headingDetailY(spec, titleY),
  };
}

function headingTitleY(spec: TileHeadingSpec, display: number) {
  if (spec.align === 'top') return spec.y + (spec.title.topOffset ?? 0);
  if (spec.iconLayout === 'above') {
    const top = stackedTop(spec, display);
    return top + display + DIAGRAM_SPACE.stackIconGap + DIAGRAM_SPACE.stackCap;
  }
  const drawn = spec.detail.lines - 1;
  return spec.y + spec.height / 2 - CENTER_LIFT - CENTER_WEIGHT * drawn;
}

function headingDetailY(spec: TileHeadingSpec, titleY: number) {
  if (spec.align === 'top') {
    return (
      titleY +
      (spec.dividerLead ?? 0) +
      (spec.title.lines - 1) * DIAGRAM_SPACE.titleLineGap +
      (spec.detail.gap ?? 0)
    );
  }
  return (
    titleY +
    (spec.iconLayout === 'above'
      ? DIAGRAM_SPACE.stackLead
      : DIAGRAM_SPACE.detailLead)
  );
}

function headingTextX(spec: TileHeadingSpec, display: number) {
  if (spec.iconLayout === 'above') return spec.x + spec.padding;
  const reach = spec.icon.anchor === 'drawn' ? display : spec.icon.size;
  return spec.x + spec.padding + reach + spec.icon.gap;
}

/** Nominal box (what `EmojiImage`/`CodeSystemIcon` take) for the reserved icon. */
function headingIconBox(
  spec: TileHeadingSpec,
  titleY: number,
  display: number,
  offset: number
) {
  const padX = spec.x + spec.padding;
  if (spec.align === 'top')
    return { x: padX, y: spec.y + (spec.icon.topOffset ?? 0) };
  if (spec.iconLayout === 'above')
    return { x: padX + offset, y: stackedTop(spec, display) + offset };
  return {
    x: padX + offset,
    y: titleY - DIAGRAM_SPACE.iconLift - display / 2 + offset,
  };
}

function stackedTop(spec: TileHeadingSpec, display: number) {
  const block =
    display +
    DIAGRAM_SPACE.stackIconGap +
    DIAGRAM_SPACE.stackCap +
    DIAGRAM_SPACE.stackLead +
    DIAGRAM_SPACE.detailLineGap * (spec.detail.lines - 1);
  return spec.y + (spec.height - block) / 2;
}

function CenteredTile(props: DiagramTileProps) {
  const color = tileToneVars(props.tone);
  const { titleLines, detailLines } = centeredCopy(props);
  return (
    <BaseTile props={props}>
      {centeredTitle(props, titleLines, color.stroke)}
      {centeredDetail(props, detailLines)}
    </BaseTile>
  );
}

function centeredCopy(props: DiagramTileProps) {
  const textWidth = props.width - DIAGRAM_SPACE.tilePadding * 2;
  return {
    titleLines: wrapSvgText(props.title, textWidth, TILE_TYPE.title, 2),
    detailLines: detailText(props.detail, textWidth, TILE_TYPE.detail, 2),
  };
}

function centeredTitle(
  props: DiagramTileProps,
  lines: readonly string[],
  fill: string
) {
  return (
    <TextLines
      x={props.x + props.width / 2}
      y={props.y + DIAGRAM_GRID * 4}
      lines={lines}
      fill={fill}
      style={voiceStyle(props.titleVoice ?? 'display', TILE_TYPE.title, 700)}
      anchor="middle"
    />
  );
}

function centeredDetail(props: DiagramTileProps, lines: readonly string[]) {
  return (
    <TextLines
      x={props.x + props.width / 2}
      y={props.y + DIAGRAM_GRID * 8}
      lines={lines}
      fill="var(--text-body)"
      style={voiceStyle('keyword', TILE_TYPE.detail, 400)}
      anchor="middle"
    />
  );
}

function CompactTile(props: DiagramTileProps) {
  const color = tileToneVars(props.tone);
  return (
    <BaseTile props={props}>
      <text
        x={props.x + props.width / 2}
        y={props.y + props.height / 2 - DIAGRAM_HALF}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color.title}
        style={voiceStyle(props.titleVoice ?? 'ai', TILE_TYPE.detail, 500)}
      >
        {props.title}
      </text>
      {compactDetail(props, color.muted)}
    </BaseTile>
  );
}

function compactDetail(props: DiagramTileProps, fill: string) {
  if (!props.detail) return null;
  return (
    <text
      x={props.x + props.width / 2}
      y={props.y + props.height / 2 + DIAGRAM_SPACE.detailLineGap}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={fill}
      style={voiceStyle('spec', TILE_TYPE.detail, 400)}
    >
      {String(props.detail)}
    </text>
  );
}

function LabelTile(props: DiagramTileProps) {
  const color = tileToneVars(props.tone);
  const iconSize = props.labelIconSize ?? LABEL_TILE_ICON_SIZE;
  const { iconX, textX } = labelLayout(props, iconSize);
  return (
    <BaseTile props={props}>
      {labelLeadIcon(props, iconX, iconSize)}
      {labelCopy(props, color.title, textX)}
    </BaseTile>
  );
}

function labelLeadIcon(props: DiagramTileProps, iconX: number, size: number) {
  if (!props.icon) return null;
  return (
    <EmojiImage
      asset={props.icon}
      x={props.x + iconX}
      y={props.y + (props.height - size) / 2}
      size={size}
    />
  );
}

function labelCopy(props: DiagramTileProps, fill: string, textX: number) {
  return (
    <text
      x={props.x + textX}
      y={props.y + props.height / 2}
      dominantBaseline="middle"
      fill={fill}
      className={props.labelClassName}
      style={
        props.labelClassName
          ? undefined
          : voiceStyle(props.titleVoice ?? 'spec', TILE_TYPE.detail, 600)
      }
    >
      {props.title}
    </text>
  );
}

function labelLayout(props: DiagramTileProps, iconSize: number) {
  if (
    props.labelIconX !== undefined ||
    props.labelTextX !== undefined ||
    props.labelAlign !== 'center'
  ) {
    return {
      iconX: props.labelIconX ?? LABEL_TILE_ICON_X,
      textX: props.labelTextX ?? LABEL_TILE_TEXT_X,
    };
  }
  return centeredLabelLayout(props, iconSize);
}

function centeredLabelLayout(props: DiagramTileProps, iconSize: number) {
  const textWidth = props.title.length * LABEL_TILE_CHAR_WIDTH;
  if (!props.icon) return { iconX: 0, textX: (props.width - textWidth) / 2 };
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

function ProcessTile(props: DiagramTileProps) {
  const color = tileToneVars(props.tone);
  const scale = processTileScale(props);
  const layout = processLayout(props, scale);
  return (
    <BaseTile props={props}>
      {processStepText(props, color.text)}
      {processLeadIcon(props, layout.iconY)}
      {processTitle(props, color.title, scale, layout)}
      {processDivider(props, color.accent, layout)}
      {processDetail(color.muted, scale, layout)}
    </BaseTile>
  );
}

function processStepText(props: DiagramTileProps, fill: string) {
  if (!props.stepLabel) return null;
  return (
    <text
      x={props.x + PROCESS_TILE_SCALE.padding}
      y={props.y + DIAGRAM_GRID * 2}
      fill={fill}
      style={processStepStyle()}
    >
      {props.stepLabel}
    </text>
  );
}

function processLeadIcon(props: DiagramTileProps, iconY: number) {
  if (!props.icon) return null;
  return (
    <EmojiImage
      asset={props.icon}
      x={props.x + PROCESS_TILE_SCALE.padding}
      y={iconY}
      size={PROCESS_TILE_SCALE.iconSize}
    />
  );
}

type ProcessTileLayout = {
  textX: number;
  dividerY: number;
  titleY: number;
  detailY: number;
  titleLines: readonly string[];
  detailLines: readonly string[];
};

function processTitle(
  props: DiagramTileProps,
  fill: string,
  scale: { titleFontSize: number },
  layout: ProcessTileLayout
) {
  return (
    <TextLines
      x={layout.textX}
      y={layout.titleY}
      lines={layout.titleLines}
      fill={fill}
      style={voiceStyle(props.titleVoice ?? 'spec', scale.titleFontSize, 700)}
    />
  );
}

function processDivider(
  props: DiagramTileProps,
  stroke: string,
  layout: ProcessTileLayout
) {
  return (
    <line
      x1={layout.textX}
      y1={layout.dividerY}
      x2={props.x + props.width - PROCESS_TILE_SCALE.padding}
      y2={layout.dividerY}
      stroke={stroke}
      opacity={0.45}
      strokeWidth={DIAGRAM_STROKE.thin}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function processDetail(
  fill: string,
  scale: { detailFontSize: number },
  layout: ProcessTileLayout
) {
  return (
    <TextLines
      x={layout.textX}
      y={layout.detailY}
      lines={layout.detailLines}
      fill={fill}
      style={voiceStyle('keyword', scale.detailFontSize, 400)}
      gap={PROCESS_TILE_SCALE.detailLineGap}
    />
  );
}

function TextLines({
  x,
  y,
  lines,
  fill,
  style,
  anchor = 'start',
  gap = DIAGRAM_SPACE.titleLineGap,
}: TextLineProps) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={fill} style={style}>
      {lines.map((line, i) => (
        <tspan key={`${line}-${i}`} x={x} dy={i === 0 ? 0 : gap}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function processTileScale(props: DiagramTileProps) {
  return props.density === 'mobile'
    ? { titleFontSize: TILE_TYPE.detail, detailFontSize: TILE_TYPE.detail }
    : {
        titleFontSize: PROCESS_TILE_SCALE.titleFontSize,
        detailFontSize: PROCESS_TILE_SCALE.detailFontSize,
      };
}

function processLayout(
  props: DiagramTileProps,
  scale: { titleFontSize: number; detailFontSize: number }
) {
  const { textX, textWidth } = processTextColumn(props);
  return {
    textX,
    textWidth,
    iconY: props.y + processIconOffset(props),
    titleY: props.y + DIAGRAM_GRID * 3,
    dividerY: props.y + DIAGRAM_GRID * 5,
    detailY: props.y + DIAGRAM_GRID * 7,
    titleLines: wrapSvgText(props.title, textWidth, scale.titleFontSize, 1),
    detailLines: detailText(props.detail, textWidth, scale.detailFontSize, 2),
  };
}

function processTextColumn(props: DiagramTileProps) {
  const textX =
    props.x +
    PROCESS_TILE_SCALE.padding +
    PROCESS_TILE_SCALE.iconSize +
    PROCESS_TILE_SCALE.iconGap;
  return {
    textX,
    textWidth: props.x + props.width - PROCESS_TILE_SCALE.padding - textX,
  };
}

function processIconOffset(props: DiagramTileProps) {
  return (props.height - PROCESS_TILE_SCALE.iconSize) / 2;
}

function detailText(
  detail: DiagramTileProps['detail'],
  maxWidth: number,
  fontSize: number,
  maxLines: number
) {
  if (!detail) return [];
  if (typeof detail === 'string')
    return wrapSvgText(detail, maxWidth, fontSize, maxLines);
  // An array is explicit line breaks: each entry keeps its own line count (wrapping
  // only when the column is too narrow) and is never truncated by `maxLines`.
  return detail.flatMap((line) =>
    wrapSvgText(line, maxWidth, fontSize, Number.MAX_SAFE_INTEGER)
  );
}

function eyebrowStyle() {
  return {
    ...voiceStyle('spec', TILE_TYPE.detail, 600),
    letterSpacing: '0.08em',
  };
}

function stepStyle() {
  return {
    ...voiceStyle('keyword', TILE_TYPE.detail, 700),
    letterSpacing: '0.08em',
  };
}

function processStepStyle() {
  return {
    ...voiceStyle('keyword', PROCESS_TILE_SCALE.stepFontSize, 700),
    letterSpacing: '0.08em',
  };
}
