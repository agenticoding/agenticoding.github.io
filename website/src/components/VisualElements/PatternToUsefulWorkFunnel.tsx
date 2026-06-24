import React, { type CSSProperties } from 'react';
import clsx from 'clsx';

import type { PresentationAwareProps } from '@site/src/components/PresentationMode/types';
import { EmojiImage } from './ActorNodes';
import { centeredEmojiOffset, EMOJI, type EmojiAsset } from './emojiAssets';
import { GearNode } from './GearNode';
import {
  TokenUnit,
  type TokenUnitModality,
  type TokenUnitSignal,
} from './TokenUnit';
import { MIXED_CONTEXT_TOKENS, OUTPUT_TOKENS } from './TokenStream';
import styles from './PatternToUsefulWorkFunnel.module.css';

type Tone = 'indigo' | 'violet' | 'cyan';
type Chip = {
  label: string;
  emoji: EmojiAsset;
  x: number;
  y: number;
  tone: Exclude<Tone, 'violet'>;
  delay: string;
};
type ChipPillProps = Chip & { storyClassName: string };
type Card = { title: string; detail: string; x: number; y: number; tone: Tone };
type MotionStyle = CSSProperties & {
  '--delay': string;
  '--travel-y'?: string;
  '--fade-y'?: string;
};
type FlowTokenSpec = {
  delay: string;
  modality: TokenUnitModality;
  signal: TokenUnitSignal;
};
type TokenSequence = readonly {
  modality: TokenUnitModality;
  signal?: TokenUnitSignal;
}[];

const W = 744;
const H = 360;
const CARD_Y = 48;
const CARD_W = 200;
const CARD_H = 280;
const CHIP_W = 152;
const CHIP_H = 40;
const CHIP_ICON_SIZE = 24;
const CHIP_ICON_LABEL_GAP = 8;
const CHIP_LABEL_CHAR_W = 6.82;
const LEFT_X = 32;
const MID_X = 280;
const RIGHT_X = 528;
const CENTER_Y = CARD_Y + CARD_H / 2;

// SVG coordinate math needs numbers; these mirror DESIGN_SYSTEM spacing tokens.
const SPACE_0H = 4;
const SPACE_1 = 8;
const SPACE_2 = 16;
const SPACE_3 = 24;
const SPACE_4 = 32;
const SPACE_5 = 48;
const SPACE_10 = 160;

const MW = 320;
const MOBILE_STAGE_X = SPACE_3;
const MOBILE_STAGE_W = MW - SPACE_3 * 2;
const MOBILE_STAGE_H = SPACE_10 - SPACE_1;
const MOBILE_STAGE_GAP = SPACE_5;
const MOBILE_STEP_R = SPACE_2 - SPACE_0H;
const MOBILE_CHIP_ROW_INSET = SPACE_1;
const MOBILE_CHIP_GAP = SPACE_1;
const MOBILE_CHIP_W =
  (MOBILE_STAGE_W - MOBILE_CHIP_ROW_INSET * 2 - MOBILE_CHIP_GAP) / 2;
const MOBILE_CHIP_H = SPACE_4;
const MOBILE_CHIP_ICON_SIZE = SPACE_3 - SPACE_0H;
const MOBILE_CHIP_LABEL_CHAR_W = 7;
const MOBILE_STAGE_YS = [
  SPACE_4,
  SPACE_4 + MOBILE_STAGE_H + MOBILE_STAGE_GAP,
  SPACE_4 + (MOBILE_STAGE_H + MOBILE_STAGE_GAP) * 2,
] as const;
const MH = MOBILE_STAGE_YS[2] + MOBILE_STAGE_H + SPACE_4;
const MOBILE_CENTER_X = MW / 2;
const MOBILE_STREAM_SIZE = 18;
const MOBILE_GEAR_SIZE = SPACE_5;
const MOBILE_GEAR_X = MOBILE_CENTER_X - MOBILE_GEAR_SIZE / 2;
const MOBILE_GEAR_Y = MOBILE_STAGE_YS[1] + SPACE_5 + SPACE_3;
const MOBILE_GEAR_TOP_Y = MOBILE_GEAR_Y;
const MOBILE_GEAR_BOTTOM_Y = MOBILE_GEAR_Y + MOBILE_GEAR_SIZE;
const MOBILE_INPUT_GEAR_BOUNDARY_Y = MOBILE_GEAR_TOP_Y - SPACE_0H;
const MOBILE_OUTPUT_GEAR_BOUNDARY_Y = MOBILE_GEAR_BOTTOM_Y - SPACE_1;
const MOBILE_INPUT_CONNECTOR_START_Y = MOBILE_STAGE_YS[0] + MOBILE_STAGE_H + SPACE_1;
const MOBILE_INPUT_CONNECTOR_END_Y = MOBILE_STAGE_YS[1] - SPACE_1;
const MOBILE_OUTPUT_CONNECTOR_START_Y = MOBILE_STAGE_YS[1] + MOBILE_STAGE_H + SPACE_1;
const MOBILE_OUTPUT_CONNECTOR_END_Y = MOBILE_STAGE_YS[2] - SPACE_1;

const INPUT_CHIPS: Chip[] = [
  {
    label: 'code',
    emoji: EMOJI.computer,
    x: LEFT_X + 24,
    y: 120,
    tone: 'indigo',
    delay: '0ms',
  },
  {
    label: 'logs',
    emoji: EMOJI.receipt,
    x: LEFT_X + 24,
    y: 168,
    tone: 'indigo',
    delay: '240ms',
  },
  {
    label: 'docs',
    emoji: EMOJI.books,
    x: LEFT_X + 24,
    y: 216,
    tone: 'indigo',
    delay: '480ms',
  },
  {
    label: 'screenshots',
    emoji: EMOJI.observe,
    x: LEFT_X + 24,
    y: 264,
    tone: 'indigo',
    delay: '720ms',
  },
];
const OUTPUT_CHIPS: Chip[] = [
  {
    label: 'implementation',
    emoji: EMOJI.tools,
    x: RIGHT_X + 24,
    y: 136,
    tone: 'cyan',
    delay: '4600ms',
  },
  {
    label: 'plan / summary',
    emoji: EMOJI.writing,
    x: RIGHT_X + 24,
    y: 196,
    tone: 'cyan',
    delay: '4900ms',
  },
  {
    label: 'tool call',
    emoji: EMOJI.plug,
    x: RIGHT_X + 24,
    y: 256,
    tone: 'cyan',
    delay: '5200ms',
  },
];
function tokenFlowSpecs(
  tokens: TokenSequence,
  startDelayMs: number,
  stepMs: number,
): FlowTokenSpec[] {
  return tokens.map(({ modality, signal = 'ordinary' }, index) => ({
    delay: `${startDelayMs + index * stepMs}ms`,
    modality,
    signal,
  }));
}

const INPUT_FLOW_TOKENS = tokenFlowSpecs(MIXED_CONTEXT_TOKENS, 1320, 160);
const OUTPUT_FLOW_TOKENS = tokenFlowSpecs(OUTPUT_TOKENS, 3520, 220);
const CARDS: Card[] = [
  {
    title: 'artifacts as tokens',
    detail: 'work context',
    x: LEFT_X,
    y: CARD_Y,
    tone: 'indigo',
  },
  {
    title: 'token prediction',
    detail: 'patterns continue work',
    x: MID_X,
    y: CARD_Y,
    tone: 'violet',
  },
  {
    title: 'useful work',
    detail: 'output path',
    x: RIGHT_X,
    y: CARD_Y,
    tone: 'cyan',
  },
];
const MOBILE_STAGES = [
  { ...CARDS[0], chips: INPUT_CHIPS, storyClassName: styles.inputStory },
  { ...CARDS[1], chips: [], storyClassName: '' },
  { ...CARDS[2], chips: OUTPUT_CHIPS, storyClassName: styles.outputStory },
] as const;

function toneVars(tone: Tone) {
  return { stroke: `var(--visual-${tone})`, fill: `var(--visual-bg-${tone})` };
}
function motionStyle(delay: string): MotionStyle {
  return { '--delay': delay };
}
function mobileTokenMotionStyle(delay: string, travelY: number): MotionStyle {
  return {
    '--delay': delay,
    '--travel-y': `${travelY}px`,
    '--fade-y': `${travelY + 14}px`,
  };
}
function chipContentLayout({
  x,
  width,
  iconSize,
  label,
  charWidth,
}: {
  x: number;
  width: number;
  iconSize: number;
  label: string;
  charWidth: number;
}) {
  const labelWidth = label.length * charWidth;
  const iconOffset = centeredEmojiOffset(iconSize);
  const contentWidth = iconSize + CHIP_ICON_LABEL_GAP + labelWidth - iconOffset;
  const iconX = x + (width - contentWidth) / 2;
  return { iconX, textX: iconX + iconSize + CHIP_ICON_LABEL_GAP };
}
function CardBox({ title, detail, x, y, tone }: Card) {
  const colors = toneVars(tone);
  return (
    <g className={styles.card}>
      <rect
        x={x}
        y={y}
        width={CARD_W}
        height={CARD_H}
        rx={0}
        fill={colors.fill}
        stroke={colors.stroke}
      />
      <text
        x={x + CARD_W / 2}
        y={y + 34}
        className={styles.cardTitle}
        fill={colors.stroke}
      >
        {title}
      </text>
      <text x={x + CARD_W / 2} y={y + 60} className={styles.cardDetail}>
        {detail}
      </text>
    </g>
  );
}
function ChipPill({
  label,
  emoji,
  x,
  y,
  tone,
  delay,
  storyClassName,
}: ChipPillProps) {
  const colors = toneVars(tone);
  const { iconX, textX } = chipContentLayout({
    x,
    width: CHIP_W,
    iconSize: CHIP_ICON_SIZE,
    label,
    charWidth: CHIP_LABEL_CHAR_W,
  });
  return (
    <g
      className={`${styles.chipStory} ${storyClassName}`}
      style={motionStyle(delay)}
    >
      <rect
        x={x}
        y={y}
        width={CHIP_W}
        height={CHIP_H}
        rx={0}
        fill="var(--surface-raised)"
        stroke={colors.stroke}
      />
      <EmojiImage asset={emoji} x={iconX} y={y + 8} size={CHIP_ICON_SIZE} />
      <text x={textX} y={y + 21} className={styles.chipText}>
        {label}
      </text>
    </g>
  );
}
function mobileChipLabel(label: string) {
  if (label === 'implementation') return 'implement';
  if (label === 'plan / summary') return 'plan';
  return label;
}
function MobileChip({
  chip,
  x,
  y,
  width = MOBILE_CHIP_W,
  storyClassName,
}: {
  chip: Chip;
  x: number;
  y: number;
  width?: number;
  storyClassName: string;
}) {
  const colors = toneVars(chip.tone);
  const label = mobileChipLabel(chip.label);
  const { iconX, textX } = chipContentLayout({
    x,
    width,
    iconSize: MOBILE_CHIP_ICON_SIZE,
    label,
    charWidth: MOBILE_CHIP_LABEL_CHAR_W,
  });
  return (
    <g
      className={`${styles.chipStory} ${storyClassName}`}
      style={motionStyle(chip.delay)}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={MOBILE_CHIP_H}
        rx={0}
        fill="var(--surface-raised)"
        stroke={colors.stroke}
      />
      <EmojiImage
        asset={chip.emoji}
        x={iconX}
        y={y + 6}
        size={MOBILE_CHIP_ICON_SIZE}
      />
      <text x={textX} y={y + 19} className={styles.mobileChipText}>
        {label}
      </text>
    </g>
  );
}
function arrowHeadPoints(x: number, y: number) {
  return `${x} ${y}, ${x - 8} ${y - 4}, ${x - 8} ${y + 4}`;
}
function downArrowHeadPoints(x: number, y: number) {
  return `${x} ${y}, ${x - 6} ${y - 10}, ${x + 6} ${y - 10}`;
}
function Connector({
  d,
  delay,
  tipX,
  tipY,
}: {
  d: string;
  delay: string;
  tipX: number;
  tipY: number;
}) {
  return (
    <g>
      <path className={`${styles.connector} ${styles.connectorBase}`} d={d} />
      <polygon
        className={`${styles.connectorHead} ${styles.connectorBase}`}
        points={arrowHeadPoints(tipX, tipY)}
      />
      <path
        className={`${styles.connector} ${styles.flowStory}`}
        style={motionStyle(delay)}
        d={d}
        pathLength={1}
      />
      <polygon
        className={`${styles.connectorHead} ${styles.flowHead}`}
        style={motionStyle(delay)}
        points={arrowHeadPoints(tipX, tipY)}
      />
    </g>
  );
}
function MobileConnector({
  startY,
  tipY,
  delay,
}: {
  startY: number;
  tipY: number;
  delay: string;
}) {
  const d = `M ${MOBILE_CENTER_X} ${startY} C ${MOBILE_CENTER_X} ${startY + 34}, ${MOBILE_CENTER_X} ${tipY - 34}, ${MOBILE_CENTER_X} ${tipY}`;
  return (
    <g>
      <path className={`${styles.connector} ${styles.connectorBase}`} d={d} />
      <polygon
        className={`${styles.connectorHead} ${styles.connectorBase}`}
        points={downArrowHeadPoints(MOBILE_CENTER_X, tipY)}
      />
      <path
        className={`${styles.connector} ${styles.flowStory}`}
        style={motionStyle(delay)}
        d={d}
        pathLength={1}
      />
      <polygon
        className={`${styles.connectorHead} ${styles.flowHead}`}
        style={motionStyle(delay)}
        points={downArrowHeadPoints(MOBILE_CENTER_X, tipY)}
      />
    </g>
  );
}
function FlowToken({
  x,
  y,
  delay,
  className,
  modality,
  signal,
  size = 20,
}: {
  x: number;
  y: number;
  delay: string;
  className: string;
  modality: TokenUnitModality;
  signal: TokenUnitSignal;
  size?: number;
}) {
  return (
    <g
      className={`${styles.tokenFlow} ${className}`}
      style={motionStyle(delay)}
      aria-hidden="true"
    >
      <TokenUnit
        x={x}
        y={y}
        width={size}
        height={size}
        tone="violet"
        modality={modality}
        signal={signal}
      />
    </g>
  );
}

function MobileTokenFlow({
  x,
  y,
  travelY,
  tokens,
  className,
}: {
  x: number;
  y: number;
  travelY: number;
  tokens: FlowTokenSpec[];
  className: string;
}) {
  return (
    <>
      {tokens.map(({ delay, modality, signal }) => (
        <g
          key={`${delay}-${modality}`}
          className={`${styles.tokenFlow} ${className}`}
          style={mobileTokenMotionStyle(delay, travelY)}
          aria-hidden="true"
        >
          <TokenUnit
            x={x}
            y={y}
            width={MOBILE_STREAM_SIZE}
            height={MOBILE_STREAM_SIZE}
            tone="violet"
            modality={modality}
            signal={signal}
          />
        </g>
      ))}
    </>
  );
}
function MobileStage({
  stage,
  y,
  index,
}: {
  stage: (typeof MOBILE_STAGES)[number];
  y: number;
  index: number;
}) {
  const colors = toneVars(stage.tone);
  return (
    <g className={styles.mobileStage}>
      <rect
        x={MOBILE_STAGE_X}
        y={y}
        width={MOBILE_STAGE_W}
        height={MOBILE_STAGE_H}
        rx={0}
        fill={colors.fill}
        stroke={colors.stroke}
      />
      <circle
        cx={MOBILE_STAGE_X + 28}
        cy={y + 30}
        r={MOBILE_STEP_R}
        fill="var(--surface-raised)"
        stroke={colors.stroke}
      />
      <text x={MOBILE_STAGE_X + 28} y={y + 34} className={styles.stepNumber}>
        {index + 1}
      </text>
      <text
        x={MOBILE_CENTER_X}
        y={y + 34}
        className={styles.mobileCardTitle}
        fill={colors.stroke}
      >
        {stage.title}
      </text>
      <text x={MOBILE_CENTER_X} y={y + 58} className={styles.mobileCardDetail}>
        {stage.detail}
      </text>
      {stage.tone === 'violet' ? (
        <>
          <GearNode
            x={MOBILE_GEAR_X}
            y={MOBILE_GEAR_Y}
            size={MOBILE_GEAR_SIZE}
            className={styles.gearStory}
            style={motionStyle('2380ms')}
          />
          <text x={MOBILE_CENTER_X} y={y + 136} className={styles.nodeText}>
            LLM continues patterns
          </text>
        </>
      ) : (
        stage.chips.map((chip, chipIndex) => {
          const chipWidth = MOBILE_CHIP_W;
          const isCenteredOddChip =
            stage.chips.length % 2 === 1 &&
            chipIndex === stage.chips.length - 1;
          const x = isCenteredOddChip
            ? MOBILE_CENTER_X - chipWidth / 2
            : MOBILE_STAGE_X +
              MOBILE_CHIP_ROW_INSET +
              (chipIndex % 2) * (chipWidth + MOBILE_CHIP_GAP);
          const chipY =
            y +
            SPACE_5 +
            SPACE_3 +
            Math.floor(chipIndex / 2) * (SPACE_4 + SPACE_1);
          return (
            <MobileChip
              key={chip.label}
              chip={chip}
              x={x}
              y={chipY}
              width={chipWidth}
              storyClassName={stage.storyClassName}
            />
          );
        })
      )}
    </g>
  );
}

function DesktopDiagram() {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Pattern prediction turns encoded artifacts into useful system-facing work"
      className={clsx(styles.diagram, styles.desktopDiagram)}
    >
      <g transform="translate(-8, -8)">
      {CARDS.map((card) => (
        <CardBox key={card.title} {...card} />
      ))}
      {INPUT_CHIPS.map((chip) => (
        <ChipPill
          key={chip.label}
          {...chip}
          storyClassName={styles.inputStory}
        />
      ))}
      <Connector
        delay="1300ms"
        tipX={MID_X}
        tipY={CENTER_Y}
        d={`M ${LEFT_X + CARD_W} ${CENTER_Y} C 250 ${CENTER_Y}, 260 ${CENTER_Y}, ${MID_X} ${CENTER_Y}`}
      />
      {INPUT_FLOW_TOKENS.map(({ delay, modality, signal }) => (
        <FlowToken
          key={`${delay}-${modality}`}
          x={LEFT_X + CARD_W - 8}
          y={CENTER_Y - 10}
          delay={delay}
          className={styles.inputTokenFlow}
          modality={modality}
          signal={signal}
        />
      ))}
      <FlowToken
        x={MID_X + 76}
        y={CENTER_Y - 10}
        delay="2460ms"
        className={styles.gearTokenFlow}
        modality="generic"
        signal="compressed"
      />
      <GearNode
        x={MID_X + 72}
        y={158}
        size={56}
        className={styles.gearStory}
        style={motionStyle('2380ms')}
      />
      <text x={MID_X + CARD_W / 2} y="252" className={styles.nodeText}>
        LLM
      </text>
      <Connector
        delay="3500ms"
        tipX={RIGHT_X}
        tipY={CENTER_Y}
        d={`M ${MID_X + CARD_W} ${CENTER_Y} C 500 ${CENTER_Y}, 510 ${CENTER_Y}, ${RIGHT_X} ${CENTER_Y}`}
      />
      {OUTPUT_FLOW_TOKENS.map(({ delay, modality, signal }) => (
        <FlowToken
          key={`${delay}-${modality}`}
          x={MID_X + 120}
          y={CENTER_Y - 10}
          delay={delay}
          className={styles.outputTokenFlow}
          modality={modality}
          signal={signal}
        />
      ))}
      {OUTPUT_CHIPS.map((chip) => (
        <ChipPill
          key={chip.label}
          {...chip}
          storyClassName={styles.outputStory}
        />
      ))}
      </g>
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg
      viewBox={`0 0 ${MW} ${MH}`}
      role="img"
      aria-label="Pattern prediction turns encoded artifacts into useful system-facing work"
      className={clsx(styles.diagram, styles.mobileDiagram)}
    >
      {MOBILE_STAGES.map((stage, index) => (
        <MobileStage
          key={stage.title}
          stage={stage}
          y={MOBILE_STAGE_YS[index]}
          index={index}
        />
      ))}
      <MobileConnector
        startY={MOBILE_INPUT_CONNECTOR_START_Y}
        tipY={MOBILE_INPUT_CONNECTOR_END_Y}
        delay="1300ms"
      />
      <MobileTokenFlow
        x={MOBILE_CENTER_X - MOBILE_STREAM_SIZE / 2}
        y={MOBILE_INPUT_CONNECTOR_START_Y - MOBILE_STREAM_SIZE / 2}
        travelY={MOBILE_INPUT_GEAR_BOUNDARY_Y - MOBILE_INPUT_CONNECTOR_START_Y}
        tokens={INPUT_FLOW_TOKENS}
        className={styles.mobileInputTokenFlow}
      />
      <MobileConnector
        startY={MOBILE_OUTPUT_CONNECTOR_START_Y}
        tipY={MOBILE_OUTPUT_CONNECTOR_END_Y}
        delay="3500ms"
      />
      <MobileTokenFlow
        x={MOBILE_CENTER_X - MOBILE_STREAM_SIZE / 2}
        y={MOBILE_OUTPUT_GEAR_BOUNDARY_Y - MOBILE_STREAM_SIZE / 2}
        travelY={MOBILE_OUTPUT_CONNECTOR_END_Y - MOBILE_OUTPUT_GEAR_BOUNDARY_Y}
        tokens={OUTPUT_FLOW_TOKENS}
        className={styles.mobileOutputTokenFlow}
      />
    </svg>
  );
}

export default function PatternToUsefulWorkFunnel({
  compact = false,
}: PresentationAwareProps = {}) {
  const containerClassName = compact
    ? `${styles.container} ${styles.compact}`
    : styles.container;

  return (
    <div className={containerClassName}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}
