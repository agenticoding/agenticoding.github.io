import React from 'react';
import clsx from 'clsx';

import { AnimatedPathTraveler } from './AnimatedTokenFlow';
import { EmojiImage } from './ActorNodes';
import { ArrowMarker, trimPathEnd } from './diagramGeometry';
import { DIAGRAM_STROKE } from './diagramScale';
import { DiagramTile } from './DiagramTile';
import { tileToneVars, type DiagramTone } from './diagramTileLayout';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import { TokenArrowTrain } from './TokenArrowTrain';
import { seededTokenTrain, seededZigzagPath } from './TokenTrainSequence';
import type { TokenUnitTone } from './TokenUnit';
import type { TokenTrainTiming } from './TokenTrainTiming';
import { ResponsiveDiagram } from './ResponsiveDiagram';
import styles from './ErrorReasonComparisonDiagram.module.css';

const DESKTOP_HUMAN_ARROW_ID = 'error-reason-comparison-desktop-human-arrow';
const MOBILE_HUMAN_ARROW_ID = 'error-reason-comparison-mobile-human-arrow';
const HUMAN = tileToneVars('neutral').accent;
const LLM = tileToneVars('model').accent;
const ERROR = 'var(--visual-error)';
const ARIA_LABEL =
  'Comparison of human and LLM errors. Human causes such as a knowledge gap, fatigue, and bias converge into a predictable error funnel that supports targeted review. An LLM can move from a flawless analysis through a plausible continuation to a wrong prediction, ending in a statistical fluctuation from a probability distribution.';

const DESKTOP = {
  canvas: { width: 760, height: 456 },
  human: { x: 16, y: 24, width: 352 },
  llm: { x: 392, y: 24, width: 352 },
  cause: { start: 44, width: 88, gap: 16 },
} as const;
const MOBILE = {
  canvas: { width: 320, height: 840 },
  human: { x: 16, y: 16, width: 288 },
  llm: { x: 16, y: 408, width: 288 },
  cause: { start: 32, width: 80, gap: 8 },
} as const;
const HUMAN_PANEL_HEIGHT = 376;
const LLM_PANEL_HEIGHT = 416;
const TILE_HEIGHT = 48;
const SOURCE_OFFSET_Y = 64;
const FUNNEL_OFFSET_Y = 144;
const STORY_OFFSET_Y = 224;
const REVIEW_OFFSET_Y = 304;
const CONTINUATION_OFFSET_Y = 160;
const ANSWER_OFFSET_Y = 256;
const NO_CAUSE_OFFSET_Y = 352;
const FLOW_STAGGER = { mode: 'fixedStep', stepMs: 0 } as const;
const PROBABILITY_TRAIN_STAGGER = {
  mode: 'pathSpacing',
  spacingPx: 24,
} as const;
const TOKEN_COUNT = 3;
const TOKEN_SIZE = 16;
const ZIGZAG_BENDS = 2;
const HUMAN_CAUSE_TIMING = {
  cycleMs: 7200,
  travelMs: 1400,
  fadeMs: 240,
  repeat: 'loop',
} as const satisfies TokenTrainTiming;
const HUMAN_STORY_TIMING = {
  startDelayMs: 1500,
  cycleMs: 7200,
  travelMs: 650,
  fadeMs: 180,
  repeat: 'loop',
} as const satisfies TokenTrainTiming;
const HUMAN_REVIEW_TIMING = {
  startDelayMs: 2350,
  cycleMs: 7200,
  travelMs: 650,
  fadeMs: 180,
  repeat: 'loop',
} as const satisfies TokenTrainTiming;
const LLM_CONTINUATION_TIMING = {
  startDelayMs: 400,
  cycleMs: 7200,
  travelMs: 1200,
  fadeMs: 200,
  repeat: 'loop',
} as const satisfies TokenTrainTiming;
const LLM_ERROR_TIMING = {
  startDelayMs: 2800,
  cycleMs: 7200,
  travelMs: 1200,
  fadeMs: 200,
  repeat: 'loop',
} as const satisfies TokenTrainTiming;
const LLM_DISTRIBUTION_TIMING = {
  startDelayMs: 5200,
  cycleMs: 7200,
  travelMs: 1200,
  fadeMs: 200,
  repeat: 'loop',
} as const satisfies TokenTrainTiming;

/**
 * Motion spec
 * Story loop: singular causes converge into review; token trains reach error.
 * Meaning: neutral diamond = causal signal; violet train = model continuation.
 * Benefit: motion contrasts diagnosis with a probability-driven wrong turn.
 * Fallback: static connectors and labels remain complete without motion.
 * Coherence: LLM trains run sequentially; error paths follow continuation.
 * Rejection: signals trace real paths rather than decorate the panels.
 */
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

function Signal({
  d,
  timing,
  color,
}: {
  d: string;
  timing: TokenTrainTiming;
  color: string;
}) {
  return (
    <AnimatedPathTraveler
      pathD={d}
      items={[color]}
      timing={timing}
      stagger={FLOW_STAGGER}
      renderStaticItems={false}
      renderItem={(fill, { x, y }) => (
        <rect
          x={x - 3}
          y={y - 3}
          width="6"
          height="6"
          transform={`rotate(45 ${x} ${y})`}
          fill={fill}
        />
      )}
    />
  );
}

function DeterministicFlow({
  d,
  markerId,
  stroke,
  timing,
}: {
  d: string;
  markerId: string;
  stroke: string;
  timing: TokenTrainTiming;
}) {
  return (
    <>
      <Arrow d={d} markerId={markerId} stroke={stroke} />
      <Signal d={d} timing={timing} color={stroke} />
    </>
  );
}

function probabilityTokens(seed: string) {
  return seededTokenTrain(seed, TOKEN_COUNT).map((token, index) => ({
    ...token,
    signal: index === TOKEN_COUNT - 1 ? 'salient' : token.signal,
  }));
}

function ProbabilisticFlow({
  start,
  end,
  stroke,
  tone,
  timing,
  seed,
}: {
  start: { x: number; y: number };
  end: { x: number; y: number };
  stroke: string;
  tone: TokenUnitTone;
  timing: TokenTrainTiming;
  seed: string;
}) {
  const d = seededZigzagPath(start, end, 'vertical', seed, ZIGZAG_BENDS);
  return (
    <TokenArrowTrain
      d={d}
      tokens={probabilityTokens(seed)}
      stroke={stroke}
      tone={tone}
      timing={timing}
      stagger={PROBABILITY_TRAIN_STAGGER}
      size={TOKEN_SIZE}
      laneOffsetPx={0}
      strokeWidth={DIAGRAM_STROKE.connector}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
  );
}

function Panel({
  layout,
  height,
  title,
  tone,
  actor,
}: {
  layout: PanelLayout;
  height: number;
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
        height={height}
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
        height={HUMAN_PANEL_HEIGHT}
        title="HUMAN MISTAKE"
        tone={HUMAN}
        actor={EMOJI.operator}
      />
      {causes.map((causeTile, index) => {
        const x = cause.start + index * (cause.width + cause.gap);
        const funnelX = center + (index - 1) * 48;
        const causePath = `M ${x + cause.width / 2} ${causeY + TILE_HEIGHT} L ${funnelX} ${funnelY}`;
        return (
          <g key={causeTile.title}>
            <Tile
              x={x}
              y={causeY}
              width={cause.width}
              height={TILE_HEIGHT}
              {...causeTile}
            />
            <DeterministicFlow
              d={causePath}
              markerId={markerId}
              stroke={HUMAN}
              timing={HUMAN_CAUSE_TIMING}
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
      <DeterministicFlow
        d={`M ${center} ${funnelY + 40} V ${storyY}`}
        markerId={markerId}
        stroke={HUMAN}
        timing={HUMAN_STORY_TIMING}
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
      <DeterministicFlow
        d={`M ${center} ${storyY + TILE_HEIGHT} V ${reviewY}`}
        markerId={markerId}
        stroke={HUMAN}
        timing={HUMAN_REVIEW_TIMING}
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
  seedPrefix,
}: {
  layout: PanelLayout;
  seedPrefix: string;
}) {
  const center = layout.x + layout.width / 2;
  const sourceY = layout.y + SOURCE_OFFSET_Y;
  const continuationY = layout.y + CONTINUATION_OFFSET_Y;
  const answerY = layout.y + ANSWER_OFFSET_Y;
  return (
    <g>
      <Panel
        layout={layout}
        height={LLM_PANEL_HEIGHT}
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
      <ProbabilisticFlow
        start={{ x: center, y: sourceY + TILE_HEIGHT }}
        end={{ x: center, y: continuationY }}
        stroke={LLM}
        tone="violet"
        timing={LLM_CONTINUATION_TIMING}
        seed={`${seedPrefix}-continuation`}
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
      <ProbabilisticFlow
        start={{ x: center, y: continuationY + TILE_HEIGHT }}
        end={{ x: center, y: answerY }}
        stroke={ERROR}
        tone="error"
        timing={LLM_ERROR_TIMING}
        seed={`${seedPrefix}-wrong-prediction`}
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
      <ProbabilisticFlow
        start={{ x: center, y: answerY + TILE_HEIGHT }}
        end={{ x: center, y: layout.y + NO_CAUSE_OFFSET_Y }}
        stroke={ERROR}
        tone="error"
        timing={LLM_DISTRIBUTION_TIMING}
        seed={`${seedPrefix}-distribution`}
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
  const humanMarkerId = mobile ? MOBILE_HUMAN_ARROW_ID : DESKTOP_HUMAN_ARROW_ID;
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
        <ArrowMarker id={humanMarkerId} fill={HUMAN} refX={0} />
      </defs>
      <HumanFlow
        layout={layout.human}
        cause={layout.cause}
        markerId={humanMarkerId}
      />
      <LlmFlow
        layout={layout.llm}
        seedPrefix={`error-reason-comparison-${mobile ? 'mobile' : 'desktop'}`}
      />
    </svg>
  );
}

export default function ErrorReasonComparisonDiagram() {
  return (
    <ResponsiveDiagram
      className={styles.container}
      breakpoint="520px"
      mode="container"
      ariaLabel={ARIA_LABEL}
      desktop={<Diagram />}
      mobile={<Diagram mobile />}
    />
  );
}
