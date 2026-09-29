import React from 'react';
import clsx from 'clsx';
import { DiagramArrow, DiagramArrowMarkers } from './DiagramArrow';
import { DiagramTile } from './DiagramTile';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import { DIAGRAM_GRID, PROCESS_TILE_SCALE } from './diagramScale';
import type { DiagramTone } from './diagramTileLayout';
import { ResponsiveDiagram } from './ResponsiveDiagram';
import styles from './HarnessContextLoop.module.css';

const ARIA_LABEL =
  'Agent harness context loop: assemble context, call the model, validate output, execute outside the model, append observation, choose whether to continue, then either iterate or exit with a final response.';
const CARD = PROCESS_TILE_SCALE.tile;
const MOBILE_CARD = PROCESS_TILE_SCALE.mobileTile;
const EXIT_TILE = PROCESS_TILE_SCALE.exitTile;
const MOBILE_EXIT_TILE = PROCESS_TILE_SCALE.mobileExitTile;

// The snapped 13/11 tile ramp overflows the 192×80 process tile: a 208-wide column
// clears the 13px title, and one extra detail line (96 tall) fits the 11px detail's
// three wrapped lines. Both desktop rows share these tile metrics.
const DESKTOP_TILE_WIDTH = DIAGRAM_GRID * 26; // 208
const DESKTOP_TILE_HEIGHT = CARD.height + PROCESS_TILE_SCALE.detailLineGap; // 96
const DESKTOP_GAP = DIAGRAM_GRID * 2; // 16
const DESKTOP_MARGIN = DIAGRAM_GRID * 4; // 32
const DESKTOP_COLUMN = DESKTOP_TILE_WIDTH + DESKTOP_GAP; // 224
const DESKTOP_X = [
  DESKTOP_MARGIN,
  DESKTOP_MARGIN + DESKTOP_COLUMN,
  DESKTOP_MARGIN + 2 * DESKTOP_COLUMN,
] as const; // 32 / 256 / 480
const DESKTOP_ROW1_Y = DIAGRAM_GRID * 8; // 64
const DESKTOP_ROW2_Y = DESKTOP_ROW1_Y + DESKTOP_TILE_HEIGHT + DIAGRAM_GRID * 7; // 216
const DESKTOP_EXIT_Y = DESKTOP_ROW2_Y + DESKTOP_TILE_HEIGHT + DIAGRAM_GRID * 5; // 352
const DESKTOP_ROW1_CENTER = DESKTOP_ROW1_Y + DESKTOP_TILE_HEIGHT / 2; // 112
const DESKTOP_ROW2_CENTER = DESKTOP_ROW2_Y + DESKTOP_TILE_HEIGHT / 2; // 264
const DESKTOP_ROW1_BOTTOM = DESKTOP_ROW1_Y + DESKTOP_TILE_HEIGHT; // 160
const DESKTOP_ROW2_BOTTOM = DESKTOP_ROW2_Y + DESKTOP_TILE_HEIGHT; // 312
const DESKTOP_MID_X = DESKTOP_X[0] + DESKTOP_TILE_WIDTH / 2; // 136
const DESKTOP_RIGHT_X = DESKTOP_X[2] + DESKTOP_TILE_WIDTH / 2; // 584
const DESKTOP_VIEW = {
  width: 720,
  height: DESKTOP_EXIT_Y + EXIT_TILE.height + DESKTOP_MARGIN, // 448
} as const;
const MOBILE_VIEW = { width: 320, height: 704 } as const;
const LOOP_BEAT_MS = 900;
const ARROW_TONES = [
  'model',
  'warning',
  'system',
  'context',
  'neutral',
  'success',
] as const satisfies readonly DiagramTone[];

type Tone = Extract<
  DiagramTone,
  'context' | 'model' | 'warning' | 'system' | 'decision' | 'success'
>;
type Step = {
  n: number;
  title: string;
  detail: readonly string[];
  tone: Tone;
  icon: EmojiAsset;
  x: number;
  y: number;
};
type ArrowProps = {
  d: string;
  markerIdPrefix: string;
  tone?: DiagramTone;
  label?: string;
  labelX?: number;
  labelY?: number;
};

const STEPS = [
  {
    n: 1,
    title: 'Assemble context',
    detail: ['task + repo + tools', 'prior observations'],
    tone: 'context',
    icon: EMOJI.documentTabs,
  },
  {
    n: 2,
    title: 'Call model',
    detail: ['predict response', 'or structured action'],
    tone: 'model',
    icon: EMOJI.gear,
  },
  {
    n: 3,
    title: 'Validate output',
    detail: ['schema + policy', 'budget + permissions'],
    tone: 'warning',
    icon: EMOJI.warning,
  },
  {
    n: 4,
    title: 'Execute outside',
    detail: ['tool / command', 'edit / test'],
    tone: 'system',
    icon: EMOJI.tools,
  },
  {
    n: 5,
    title: 'Add observation',
    detail: ['tool result', 'into next context'],
    tone: 'context',
    icon: EMOJI.observe,
  },
  {
    n: 6,
    title: 'Continue?',
    detail: ['LLM proposes next', 'harness gates choice'],
    tone: 'decision',
    icon: EMOJI.question,
  },
] as const satisfies readonly Omit<Step, 'x' | 'y'>[];

const DESKTOP_STEPS: readonly Step[] = STEPS.map((step, i) => ({
  ...step,
  x: DESKTOP_X[[0, 1, 2, 2, 1, 0][i]],
  y: [
    DESKTOP_ROW1_Y,
    DESKTOP_ROW1_Y,
    DESKTOP_ROW1_Y,
    DESKTOP_ROW2_Y,
    DESKTOP_ROW2_Y,
    DESKTOP_ROW2_Y,
  ][i],
}));

const MOBILE_STEPS: readonly Step[] = STEPS.map((step, i) => ({
  ...step,
  x: 48,
  y: 32 + i * 96,
}));

function Arrow(props: ArrowProps) {
  return (
    <DiagramArrow
      {...props}
      className={styles.connector}
      labelClassName={styles.branchLabel}
    />
  );
}

function Card({
  n,
  title,
  detail,
  tone,
  icon,
  x,
  y,
  width = CARD.width,
  height = CARD.height,
}: Step & { width?: number; height?: number }) {
  return (
    <DiagramTile
      variant="process"
      x={x}
      y={y}
      width={width}
      height={height}
      tone={tone}
      stepLabel={String(n).padStart(2, '0')}
      icon={icon}
      title={title}
      detail={detail}
      titleVoice="spec"
      className={clsx(styles.card, styles.idleBeat)}
      style={{ animationDelay: `${(n - 1) * LOOP_BEAT_MS}ms` }}
    />
  );
}

function ExitTile({
  x,
  y,
  width = EXIT_TILE.width,
  height = EXIT_TILE.height,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
}) {
  return (
    <DiagramTile
      variant="process"
      x={x}
      y={y}
      width={width}
      height={height}
      tone="success"
      stepLabel="OK"
      icon={EMOJI.check}
      title="Exit loop"
      detail="final response"
      titleVoice="spec"
      className={clsx(styles.exitTile, styles.idleBeat)}
      style={{ animationDelay: `${STEPS.length * LOOP_BEAT_MS}ms` }}
    />
  );
}

function DesktopDiagram() {
  const markerIdPrefix = 'hcl-desktop';
  const rightEdge = (col: number) => DESKTOP_X[col] + DESKTOP_TILE_WIDTH;
  return (
    <svg
      viewBox={`0 0 ${DESKTOP_VIEW.width} ${DESKTOP_VIEW.height}`}
      width="100%"
      aria-hidden="true"
      className={clsx(styles.diagram, styles.desktopDiagram)}
    >
      <DiagramArrowMarkers prefix={markerIdPrefix} tones={ARROW_TONES} />
      <text
        x="360"
        y="32"
        textAnchor="middle"
        className={styles.loopLabel}
        fill="var(--text-muted)"
      >
        context → model output → validated action → observation → context
      </text>
      <Arrow
        d={`M ${rightEdge(0)} ${DESKTOP_ROW1_CENTER} H ${DESKTOP_X[1]}`}
        markerIdPrefix={markerIdPrefix}
        tone="model"
      />
      <Arrow
        d={`M ${rightEdge(1)} ${DESKTOP_ROW1_CENTER} H ${DESKTOP_X[2]}`}
        markerIdPrefix={markerIdPrefix}
        tone="warning"
      />
      <Arrow
        d={`M ${DESKTOP_RIGHT_X} ${DESKTOP_ROW1_BOTTOM} V ${DESKTOP_ROW2_Y}`}
        markerIdPrefix={markerIdPrefix}
        tone="system"
      />
      <Arrow
        d={`M ${DESKTOP_X[2]} ${DESKTOP_ROW2_CENTER} H ${rightEdge(1)}`}
        markerIdPrefix={markerIdPrefix}
        tone="context"
      />
      <Arrow
        d={`M ${DESKTOP_X[1]} ${DESKTOP_ROW2_CENTER} H ${rightEdge(0)}`}
        markerIdPrefix={markerIdPrefix}
      />
      <Arrow
        d={`M ${DESKTOP_MID_X} ${DESKTOP_ROW2_Y} V ${DESKTOP_ROW1_BOTTOM}`}
        markerIdPrefix={markerIdPrefix}
        label="iterate"
        labelX={DESKTOP_MID_X + DIAGRAM_GRID * 2}
        labelY={DESKTOP_ROW1_BOTTOM + DIAGRAM_GRID * 4}
      />
      <Arrow
        d={`M ${DESKTOP_MID_X} ${DESKTOP_ROW2_BOTTOM} V ${DESKTOP_EXIT_Y}`}
        markerIdPrefix={markerIdPrefix}
        tone="success"
      />
      {DESKTOP_STEPS.map((step) => (
        <Card
          key={step.n}
          {...step}
          width={DESKTOP_TILE_WIDTH}
          height={DESKTOP_TILE_HEIGHT}
        />
      ))}
      <ExitTile
        x={DESKTOP_X[0]}
        y={DESKTOP_EXIT_Y}
        width={DESKTOP_TILE_WIDTH}
      />
    </svg>
  );
}

function MobileDiagram() {
  const markerIdPrefix = 'hcl-mobile';
  return (
    <svg
      viewBox={`0 0 ${MOBILE_VIEW.width} ${MOBILE_VIEW.height}`}
      width="100%"
      aria-hidden="true"
      className={clsx(styles.diagram, styles.mobileDiagram)}
    >
      <DiagramArrowMarkers prefix={markerIdPrefix} tones={ARROW_TONES} />
      {MOBILE_STEPS.map((step) => (
        <Card key={step.n} {...step} {...MOBILE_CARD} />
      ))}
      <Arrow d="M 160 112 V 128" markerIdPrefix={markerIdPrefix} tone="model" />
      <Arrow
        d="M 160 208 V 224"
        markerIdPrefix={markerIdPrefix}
        tone="warning"
      />
      <Arrow
        d="M 160 304 V 320"
        markerIdPrefix={markerIdPrefix}
        tone="system"
      />
      <Arrow
        d="M 160 400 V 416"
        markerIdPrefix={markerIdPrefix}
        tone="context"
      />
      <Arrow d="M 160 496 V 512" markerIdPrefix={markerIdPrefix} />
      <Arrow d="M 48 552 H 24 V 72 H 48" markerIdPrefix={markerIdPrefix} />
      <Arrow
        d="M 160 592 V 608"
        markerIdPrefix={markerIdPrefix}
        tone="success"
      />
      <ExitTile x={48} y={608} {...MOBILE_EXIT_TILE} />
    </svg>
  );
}

export default function HarnessContextLoop() {
  return (
    <ResponsiveDiagram
      className={styles.container}
      breakpoint="560px"
      mode="container"
      fallbackBreakpoint="580px"
      ariaLabel={ARIA_LABEL}
      desktop={<DesktopDiagram />}
      mobile={<MobileDiagram />}
    />
  );
}
