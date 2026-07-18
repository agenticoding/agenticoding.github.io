import React from 'react';
import { EmojiImage } from './ActorNodes';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import {
  type ModelCallFrameBounds,
  type ModelCallFrameTabAlign,
  modelCallFrameTab,
} from './ModelCallFrameGeometry';
import {
  MODEL_CALL_FRAME_LAYOUT,
  TILE_GRID,
  voiceStyle,
} from './diagramTileLayout';
import { DIAGRAM_STROKE } from './diagramScale';

export {
  MODEL_CALL_FRAME_STROKE_OUTSET,
  MODEL_CALL_FRAME_TAB_OVERHANG,
  MODEL_CALL_FRAME_VISUAL_OUTSET,
  type ModelCallFrameBounds,
  type ModelCallFrameTabAlign,
  type ModelCallFrameTabOptions,
  modelCallFrameTab,
  modelCallFrameVisualBounds,
} from './ModelCallFrameGeometry';

const {
  tabIconSize: TAB_ICON_SIZE,
  tabGap: TAB_GAP,
  tabPaddingX: TAB_PADDING_X,
  framePaddingX: FRAME_PADDING_X,
  titleFontSize: TITLE_FONT_SIZE,
  detailFontSize: DETAIL_FONT_SIZE,
} = MODEL_CALL_FRAME_LAYOUT;

export type ModelCallFrameProps = ModelCallFrameBounds & {
  tabLabel: string;
  tabIcon?: EmojiAsset;
  className?: string;
  rectClassName?: string;
  title?: string;
  detail?: string;
  subtitle?: string;
  subtitleX?: number;
  subtitleY?: number;
  fill?: string;
  stroke?: string;
  tabWidth?: number;
  tabAlign?: ModelCallFrameTabAlign;
};

export function ModelCallFrame({
  x,
  y,
  width,
  height,
  tabLabel,
  title,
  detail,
  subtitle,
  tabIcon = EMOJI.gear,
  subtitleX,
  subtitleY,
  className,
  rectClassName,
  fill = 'var(--surface-raised)',
  stroke = 'var(--visual-violet)',
  tabWidth,
  tabAlign = 'start',
}: ModelCallFrameProps) {
  const tab = modelCallFrameTab(x, y, tabLabel, tabWidth, {
    tabAlign,
    frameWidth: width,
  });
  return (
    <g className={className}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={0}
        ry={0}
        fill={fill}
        stroke={stroke}
        strokeWidth={DIAGRAM_STROKE.default}
        className={rectClassName}
        vectorEffect="non-scaling-stroke"
      />
      <rect
        {...tab}
        rx={0}
        ry={0}
        fill="var(--surface-page)"
        stroke={stroke}
        strokeWidth={DIAGRAM_STROKE.default}
        className={rectClassName}
        vectorEffect="non-scaling-stroke"
      />
      <EmojiImage
        asset={tabIcon}
        x={tab.x + TAB_PADDING_X}
        y={tab.y + TILE_GRID / 2}
        size={TAB_ICON_SIZE}
      />
      <text
        x={tab.x + TAB_PADDING_X + TAB_ICON_SIZE + TAB_GAP}
        y={tab.y + 21}
        fill="var(--text-heading)"
        style={voiceStyle('spec', TITLE_FONT_SIZE, 600)}
      >
        {tabLabel}
      </text>
      {title && (
        <text
          x={x + FRAME_PADDING_X}
          y={contentTitleY(y, height)}
          fill="var(--text-heading)"
          style={voiceStyle('ai', TITLE_FONT_SIZE, 700)}
        >
          {title}
        </text>
      )}
      {detail && (
        <text
          x={x + FRAME_PADDING_X}
          y={contentDetailY(y, height)}
          fill="var(--text-muted)"
          style={voiceStyle('keyword', DETAIL_FONT_SIZE, 400)}
        >
          {detail}
        </text>
      )}
      {subtitle && (
        <text
          x={subtitleX ?? x + width / 2}
          y={subtitleY ?? y + height - 24}
          textAnchor="middle"
          fill="var(--text-muted)"
          style={voiceStyle('spec', DETAIL_FONT_SIZE, 400)}
        >
          {subtitle}
        </text>
      )}
    </g>
  );
}

function contentTitleY(y: number, height: number) {
  return y + (height < 80 ? 42 : 48);
}

function contentDetailY(y: number, height: number) {
  return y + (height < 80 ? 58 : 70);
}
