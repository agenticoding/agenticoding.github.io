import React from 'react';
import clsx from 'clsx';

import { EmojiImage } from './ActorNodes';
import { ArrowMarker, trimPathEnd } from './diagramGeometry';
import { DIAGRAM_STROKE } from './diagramScale';
import { DiagramTile } from './DiagramTile';
import { tileToneVars, type DiagramTone } from './diagramTileLayout';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import styles from './ErrorReasonComparisonDiagram.module.css';

const DESKTOP_HUMAN_ARROW_ID = 'error-reason-comparison-desktop-human-arrow';
const DESKTOP_LLM_ARROW_ID = 'error-reason-comparison-desktop-llm-arrow';
const DESKTOP_ERROR_ARROW_ID = 'error-reason-comparison-desktop-error-arrow';
const MOBILE_HUMAN_ARROW_ID = 'error-reason-comparison-mobile-human-arrow';
const MOBILE_LLM_ARROW_ID = 'error-reason-comparison-mobile-llm-arrow';
const MOBILE_ERROR_ARROW_ID = 'error-reason-comparison-mobile-error-arrow';
const HUMAN = tileToneVars('neutral').accent;
const LLM = tileToneVars('model').accent;
const ERROR = 'var(--visual-error)';
const ARIA_LABEL =
  'Comparison of human and LLM errors. Human causes such as a knowledge gap, fatigue, and bias converge into a predictable error funnel that supports targeted review. An LLM can move from a flawless analysis through a plausible continuation to a wrong prediction, ending in a statistical fluctuation from a probability distribution.';

const DESKTOP = {
  canvas: { width: 760, height: 424 },
  human: { x: 16, y: 24, width: 352 },
  llm: { x: 392, y: 24, width: 352 },
  cause: { start: 44, width: 88, gap: 16 },
} as const;
const MOBILE = {
  canvas: { width: 320, height: 808 },
  human: { x: 16, y: 16, width: 288 },
  llm: { x: 16, y: 408, width: 288 },
  cause: { start: 32, width: 80, gap: 8 },
} as const;
const PANEL_HEIGHT = 376;
const TILE_HEIGHT = 48;
const SOURCE_OFFSET_Y = 64;
const FUNNEL_OFFSET_Y = 144;
const STORY_OFFSET_Y = 224;
const REVIEW_OFFSET_Y = 304;
const CONTINUATION_OFFSET_Y = FUNNEL_OFFSET_Y;
const ANSWER_OFFSET_Y = STORY_OFFSET_Y;
const NO_CAUSE_OFFSET_Y = REVIEW_OFFSET_Y;

type PanelLayout = { x: number; y: number; width: number };
type CauseLayout = { start: number; width: number; gap: number };
type TileProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  detail: string;
  tone?: DiagramTone;
};

function Tile({ tone = 'neutral', ...props }: TileProps) {
  return (
    <DiagramTile
      {...props}
      tone={tone}
      variant="compact"
      titleVoice="keyword"
    />
  );
}

function Arrow({
  d,
  markerId,
  stroke,
}: {
  d: string;
  markerId: string;
  stroke: string;
}) {
  return (
    <path
      d={trimPathEnd(d)}
      fill="none"
      stroke={stroke}
      strokeWidth={DIAGRAM_STROKE.connector}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      markerEnd={`url(#${markerId})`}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function Panel({
  layout,
  title,
  tone,
  actor,
}: {
  layout: PanelLayout;
  title: string;
  tone: string;
  actor: EmojiAsset;
}) {
  return (
    <g>
      <rect
        x={layout.x}
        y={layout.y}
        width={layout.width}
        height={PANEL_HEIGHT}
        fill="transparent"
        stroke="var(--border-subtle)"
        strokeWidth={DIAGRAM_STROKE.thin}
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={layout.x}
        y1={layout.y + 40}
        x2={layout.x + layout.width}
        y2={layout.y + 40}
        stroke={tone}
        strokeWidth={DIAGRAM_STROKE.thin}
        opacity="0.55"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={layout.x + 48}
        y={layout.y + 25}
        className={styles.panelTitle}
        fontSize="11"
        fill={tone}
      >
        {title}
      </text>
      <EmojiImage asset={actor} x={layout.x + 16} y={layout.y + 8} size={24} />
    </g>
  );
}

function HumanFlow({
  layout,
  cause,
  markerId,
}: {
  layout: PanelLayout;
  cause: CauseLayout;
  markerId: string;
}) {
  const causeY = layout.y + SOURCE_OFFSET_Y;
  const funnelY = layout.y + FUNNEL_OFFSET_Y;
  const storyY = layout.y + STORY_OFFSET_Y;
  const reviewY = layout.y + REVIEW_OFFSET_Y;
  const center = layout.x + layout.width / 2;
  const causes = [
    { title: 'Knowledge', detail: 'gap' },
    { title: 'Fatigue', detail: 'tired' },
    { title: 'Bias', detail: 'agenda' },
  ];
  return (
    <g>
      <Panel
        layout={layout}
        title="HUMAN MISTAKE"
        tone={HUMAN}
        actor={EMOJI.operator}
      />
      {causes.map((causeTile, index) => {
        const x = cause.start + index * (cause.width + cause.gap);
        const funnelX = center + (index - 1) * 48;
        return (
          <g key={causeTile.title}>
            <Tile
              x={x}
              y={causeY}
              width={cause.width}
              height={TILE_HEIGHT}
              {...causeTile}
            />
            <Arrow
              d={`M ${x + cause.width / 2} ${causeY + TILE_HEIGHT} L ${funnelX} ${funnelY}`}
              markerId={markerId}
              stroke={HUMAN}
            />
          </g>
        );
      })}
      <polygon
        points={`${center - 64},${funnelY} ${center + 64},${funnelY} ${center + 40},${funnelY + 40} ${center - 40},${funnelY + 40}`}
        fill="var(--surface-raised)"
        stroke={HUMAN}
        strokeWidth={DIAGRAM_STROKE.connector}
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={center}
        y={funnelY + 17}
        textAnchor="middle"
        className={styles.funnelTitle}
        fontSize="10"
        fill="var(--text-heading)"
      >
        predictable
      </text>
      <text
        x={center}
        y={funnelY + 30}
        textAnchor="middle"
        className={styles.funnelDetail}
        fontSize="8"
        fill="var(--text-muted)"
      >
        error funnel
      </text>
      <Arrow
        d={`M ${center} ${funnelY + 40} V ${storyY}`}
        markerId={markerId}
        stroke={HUMAN}
      />
      <FlowEmoji asset={EMOJI.brain} x={center - 120} y={storyY + 12} />
      <Tile
        x={center - 80}
        y={storyY}
        width={160}
        height={TILE_HEIGHT}
        title="Causal story"
        detail="why it happened"
      />
      <Arrow
        d={`M ${center} ${storyY + TILE_HEIGHT} V ${reviewY}`}
        markerId={markerId}
        stroke={HUMAN}
      />
      <FlowEmoji asset={EMOJI.magnify} x={center - 120} y={reviewY + 12} />
      <Tile
        x={center - 80}
        y={reviewY}
        width={160}
        height={TILE_HEIGHT}
        title="Targeted review"
        detail="know where to look"
        tone="success"
      />
    </g>
  );
}

function FlowEmoji({
  asset,
  x,
  y,
}: {
  asset: EmojiAsset;
  x: number;
  y: number;
}) {
  return <EmojiImage asset={asset} x={x} y={y} size={24} />;
}

function LlmFlow({
  layout,
  markerId,
  errorMarkerId,
}: {
  layout: PanelLayout;
  markerId: string;
  errorMarkerId: string;
}) {
  const center = layout.x + layout.width / 2;
  const sourceY = layout.y + SOURCE_OFFSET_Y;
  const continuationY = layout.y + CONTINUATION_OFFSET_Y;
  const answerY = layout.y + ANSWER_OFFSET_Y;
  return (
    <g>
      <Panel
        layout={layout}
        title="LLM MISTAKE"
        tone={LLM}
        actor={EMOJI.agent}
      />
      <Tile
        x={layout.x + 40}
        y={sourceY}
        width={layout.width - 80}
        height={TILE_HEIGHT}
        title="Flawless analysis"
        detail="correct output"
        tone="model"
      />
      <Arrow
        d={`M ${center} ${sourceY + TILE_HEIGHT} V ${continuationY}`}
        markerId={markerId}
        stroke={LLM}
      />
      <Tile
        x={center - 76}
        y={continuationY}
        width={152}
        height={TILE_HEIGHT}
        title="Plausible"
        detail="continuation"
        tone="model"
      />
      <Arrow
        d={`M ${center} ${continuationY + TILE_HEIGHT} V ${answerY}`}
        markerId={errorMarkerId}
        stroke={ERROR}
      />
      <FlowEmoji asset={EMOJI.gear} x={center - 112} y={answerY + 12} />
      <Tile
        x={center - 72}
        y={answerY}
        width={144}
        height={TILE_HEIGHT}
        title="2 + 2 = 5"
        detail="wrong prediction"
        tone="warning"
      />
      <Arrow
        d={`M ${center} ${answerY + TILE_HEIGHT} V ${layout.y + NO_CAUSE_OFFSET_Y}`}
        markerId={errorMarkerId}
        stroke={ERROR}
      />
      <FlowEmoji
        asset={EMOJI.dice}
        x={center - 112}
        y={layout.y + NO_CAUSE_OFFSET_Y + 12}
      />
      <Tile
        x={center - 72}
        y={layout.y + NO_CAUSE_OFFSET_Y}
        width={144}
        height={TILE_HEIGHT}
        title="Random distribution"
        detail="statistical fluctuation"
        tone="model"
      />
    </g>
  );
}

function Diagram({ mobile = false }: { mobile?: boolean }) {
  const layout = mobile ? MOBILE : DESKTOP;
  const ids = mobile
    ? {
        human: MOBILE_HUMAN_ARROW_ID,
        llm: MOBILE_LLM_ARROW_ID,
        error: MOBILE_ERROR_ARROW_ID,
      }
    : {
        human: DESKTOP_HUMAN_ARROW_ID,
        llm: DESKTOP_LLM_ARROW_ID,
        error: DESKTOP_ERROR_ARROW_ID,
      };
  return (
    <svg
      viewBox={`0 0 ${layout.canvas.width} ${layout.canvas.height}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={clsx(
        styles.diagram,
        mobile ? styles.mobileDiagram : styles.desktopDiagram
      )}
    >
      <defs>
        <ArrowMarker id={ids.human} fill={HUMAN} refX={0} />
        <ArrowMarker id={ids.llm} fill={LLM} refX={0} />
        <ArrowMarker id={ids.error} fill={ERROR} refX={0} />
      </defs>
      <HumanFlow
        layout={layout.human}
        cause={layout.cause}
        markerId={ids.human}
      />
      <LlmFlow
        layout={layout.llm}
        markerId={ids.llm}
        errorMarkerId={ids.error}
      />
    </svg>
  );
}

export default function ErrorReasonComparisonDiagram() {
  return (
    <div className={styles.container} role="img" aria-label={ARIA_LABEL}>
      <Diagram />
      <Diagram mobile />
    </div>
  );
}
