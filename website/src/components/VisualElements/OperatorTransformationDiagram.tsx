import React from 'react';
import styles from './OperatorTransformationDiagram.module.css';
import {
  agentIconSize,
  ContextAgentTile,
  type AgentContextTile,
} from './AgentTile';
import { EmojiImage, OperatorNode } from './ActorNodes';
import { EMOJI } from './emojiAssets';
import { wrapSvgText } from './diagramTileLayout';

type TextProps = {
  x: number;
  y: number;
  children: React.ReactNode;
  tone?: string;
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
  weight?: number;
  voice?: 'ai' | 'human' | 'spec' | 'keyword';
  dominantBaseline?: React.SVGAttributes<SVGTextElement>['dominantBaseline'];
};

type MarkerProps = {
  id: string;
  tone: string;
};

const CALLOUT_LINE_HEIGHT = 16;
const CALLOUT_TOP_PADDING = 16;
const CALLOUT_BOTTOM_PADDING = 16;
const CALLOUT_MIN_HEIGHT = 64;
const CALLOUT_INLINE_PADDING = 16;
const CALLOUT_TO_TILE_GAP = 8;
const TILE_TO_GATE_GAP = 8;
const GATE_HEIGHT = 24;
const SCENE_HEIGHT = 416;
const ONE_SHOT_TILE_HEIGHT = 208;
const SCENE_BOTTOM_PADDING = TILE_TO_GATE_GAP;
const DESKTOP_SCENE_Y = 24;
const DESKTOP_VIEWBOX_BOTTOM_PADDING = 24;
const DESKTOP_TRANSITION_Y = DESKTOP_SCENE_Y + SCENE_HEIGHT / 2 - 114;

function calloutLines(lines: readonly string[], width: number, size: number) {
  return lines.flatMap((line) =>
    wrapSvgText(line, width - CALLOUT_INLINE_PADDING * 2, size, 20)
  );
}

function calloutHeight(lines: readonly string[]) {
  return Math.max(
    CALLOUT_MIN_HEIGHT,
    lines.length * CALLOUT_LINE_HEIGHT +
      CALLOUT_TOP_PADDING +
      CALLOUT_BOTTOM_PADDING
  );
}

function oneShotSceneHeight(width: number) {
  const requestHeight = calloutHeight(
    calloutLines(['Can you fix this?'], width - 88, 13)
  );
  const feedbackHeight = calloutHeight(
    calloutLines(
      ['“It changed the wrong thing.”', '“Now I have to find what broke.”'],
      width - 32,
      13
    )
  );
  return Math.max(
    SCENE_HEIGHT,
    44 +
      requestHeight +
      CALLOUT_TO_TILE_GAP +
      ONE_SHOT_TILE_HEIGHT +
      CALLOUT_TO_TILE_GAP +
      feedbackHeight +
      SCENE_BOTTOM_PADDING
  );
}

function workingSceneHeight(width: number) {
  const requestHeight = calloutHeight(
    calloutLines(
      ['THIS IS THE JOB.', 'THIS IS WHAT “DONE” MEANS.'],
      width - 88,
      13
    )
  );
  return Math.max(
    SCENE_HEIGHT,
    44 +
      requestHeight +
      CALLOUT_TO_TILE_GAP +
      260 +
      TILE_TO_GATE_GAP +
      GATE_HEIGHT +
      SCENE_BOTTOM_PADDING
  );
}

const DESKTOP_VIEWBOX_HEIGHT =
  DESKTOP_SCENE_Y + workingSceneHeight(320) + DESKTOP_VIEWBOX_BOTTOM_PADDING;

function DiagramText({
  x,
  y,
  children,
  tone = 'var(--text-heading)',
  anchor = 'start',
  size = 11,
  weight = 500,
  voice = 'spec',
  dominantBaseline,
}: TextProps) {
  return (
    <text
      x={x}
      y={y}
      fill={tone}
      textAnchor={anchor}
      dominantBaseline={dominantBaseline}
      fontSize={size}
      fontWeight={weight}
      style={{
        fontFamily: `var(--font-mono-${voice})`,
        fontFeatureSettings: 'var(--font-mono-features)',
      }}
    >
      {children}
    </text>
  );
}

function Frame({
  x,
  y,
  width,
  height,
  tone = 'var(--border-default)',
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  tone?: string;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={0}
      fill="var(--surface-raised)"
      stroke={tone}
      strokeWidth={1}
    />
  );
}

function Callout({
  x,
  y,
  width,
  lines,
  tone,
  voice,
  size = 13,
}: {
  x: number;
  y: number;
  width: number;
  lines: readonly string[];
  tone: string;
  voice: TextProps['voice'];
  size?: number;
}) {
  const wrappedLines = calloutLines(lines, width, size);
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={calloutHeight(wrappedLines)}
        rx={0}
        fill="var(--surface-page)"
        stroke={tone}
        strokeWidth={1}
      />
      {wrappedLines.map((line, index) => (
        <DiagramText
          key={`${line}-${index}`}
          x={x + CALLOUT_INLINE_PADDING}
          y={y + CALLOUT_TOP_PADDING + (index + 0.5) * CALLOUT_LINE_HEIGHT}
          tone="var(--text-heading)"
          voice={voice}
          size={size}
          weight={400}
          dominantBaseline="middle"
        >
          {line}
        </DiagramText>
      ))}
    </>
  );
}

function contextClasses() {
  return {
    eyebrow: styles.contextEyebrow,
    detail: styles.contextDetail,
    tile: styles.contextRow,
    tileRect: styles.contextRowRect,
    tileText: styles.contextRowText,
  };
}

function OneShotScene({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const tileX = x + 16;
  const requestLines = ['Can you fix this?'];
  const feedbackLines = [
    '“It changed the wrong thing.”',
    '“Now I have to find what broke.”',
  ];
  const sceneHeight = Math.max(height, oneShotSceneHeight(width));
  const requestY = y + 44;
  const requestHeight = calloutHeight(
    calloutLines(requestLines, width - 88, 13)
  );
  const tileY = requestY + requestHeight + CALLOUT_TO_TILE_GAP;
  const tileHeight = ONE_SHOT_TILE_HEIGHT;
  const feedbackY = tileY + tileHeight + CALLOUT_TO_TILE_GAP;
  return (
    <g>
      <Frame x={x} y={y} width={width} height={sceneHeight} />
      <DiagramText
        x={x + 16}
        y={y + 24}
        tone="var(--text-muted)"
        voice="keyword"
        size={10}
      >
        ONE-SHOT CHAT
      </DiagramText>
      <OperatorNode x={x + 16} y={y + 44} size={40} />
      <Callout
        x={x + 72}
        y={requestY}
        width={width - 88}
        tone="var(--border-emphasis)"
        voice="human"
        lines={requestLines}
      />
      <ContextAgentTile
        x={tileX}
        y={tileY}
        width={width - 32}
        height={tileHeight}
        agentBlockHeight={tileHeight - 84}
        tone="warning"
        contextEyebrow="ONE-SHOT OUTPUT"
        contextDetail="no working context"
        contextTiles={[oneShotTile()]}
        contextClasses={contextClasses()}
        eyebrow="ONE-SHOT AGENT"
        title="a guess"
        iconSize={agentIconSize(true)}
        rectClassName={styles.agentRect}
        titleClassName={styles.agentTitle}
        textClasses={{ eyebrow: styles.agentEyebrow }}
      />
      <Callout
        x={x + 16}
        y={feedbackY}
        width={width - 32}
        tone="var(--visual-warning)"
        voice="human"
        lines={feedbackLines}
      />
    </g>
  );
}

function oneShotTile(): AgentContextTile {
  return {
    label: 'UNEXPECTED CHANGE',
    activationDelayMs: 900,
    className: styles.guessContext,
  };
}

function WorkingScene({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const boardX = x + 16;
  const boardWidth = width - 32;
  const boardHeight = 260;
  const requestLines = ['THIS IS THE JOB.', 'THIS IS WHAT “DONE” MEANS.'];
  const sceneHeight = Math.max(height, workingSceneHeight(width));
  const requestY = y + 44;
  const requestHeight = calloutHeight(
    calloutLines(requestLines, width - 88, 13)
  );
  const boardY = requestY + requestHeight + CALLOUT_TO_TILE_GAP;
  const gateY = boardY + boardHeight + TILE_TO_GATE_GAP;
  const gateX = x + width / 2;
  return (
    <g>
      <Frame
        x={x}
        y={y}
        width={width}
        height={sceneHeight}
        tone="var(--border-emphasis)"
      />
      <DiagramText
        x={x + 16}
        y={y + 24}
        tone="var(--text-muted)"
        voice="keyword"
        size={10}
      >
        OPERATING THE WORK
      </DiagramText>
      <OperatorNode x={x + 16} y={y + 44} size={40} />
      <Callout
        x={x + 72}
        y={requestY}
        width={width - 88}
        tone="var(--border-emphasis)"
        voice="human"
        lines={requestLines}
      />
      <ContextAgentTile
        x={boardX}
        y={boardY}
        width={boardWidth}
        height={boardHeight}
        agentBlockHeight={132}
        tone="violet"
        contextEyebrow="WORKING CONTEXT"
        contextDetail="usable working context"
        contextTiles={workingTiles()}
        contextClasses={contextClasses()}
        eyebrow="WORKING AGENT"
        title="does the work"
        iconSize={agentIconSize()}
        rectClassName={styles.agentRect}
        titleClassName={styles.agentTitle}
        textClasses={{ eyebrow: styles.agentEyebrow }}
      />
      <g className={styles.storyGate}>
        <rect
          x={x + 16}
          y={gateY}
          width={width - 32}
          height={GATE_HEIGHT}
          rx={0}
          fill="var(--visual-bg-cyan)"
          stroke="var(--visual-system)"
          strokeWidth={1}
        />
        <DiagramText
          x={gateX}
          y={gateY + 16}
          anchor="middle"
          tone="var(--text-heading)"
          voice="human"
          size={11}
          weight={700}
        >
          YOU DECIDE WHAT SHIPS.
        </DiagramText>
      </g>
    </g>
  );
}

function workingTiles(): readonly AgentContextTile[] {
  return [
    { label: 'JOB BOUNDARIES', activationDelayMs: 1400 },
    { label: 'EVIDENCE', activationDelayMs: 3000 },
    {
      label: 'CANDIDATE CHANGE',
      activationDelayMs: 4600,
      className: styles.candidateContext,
    },
  ];
}

function Transition({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <EmojiImage asset={EMOJI.books} x={x - 20} y={y + 36} size={40} />
      <DiagramText x={x} y={y + 120} anchor="middle" size={16} weight={700}>
        THE SKILL IS NOT
      </DiagramText>
      <DiagramText x={x} y={y + 140} anchor="middle" size={16} weight={700}>
        BETTER ASKING.
      </DiagramText>
      <DiagramText
        x={x}
        y={y + 172}
        anchor="middle"
        tone="var(--visual-indigo)"
        size={16}
        weight={700}
      >
        IT IS BETTER
      </DiagramText>
      <DiagramText
        x={x}
        y={y + 192}
        anchor="middle"
        tone="var(--visual-indigo)"
        size={16}
        weight={700}
      >
        DIRECTION.
      </DiagramText>
    </g>
  );
}

function ArrowMarker({ id, tone }: MarkerProps) {
  return (
    <marker
      id={id}
      viewBox="0 0 6 6"
      refX="5"
      refY="3"
      markerWidth="6"
      markerHeight="6"
      orient="auto"
    >
      <path d="M 0 0 L 6 3 L 0 6 Z" fill={tone} />
    </marker>
  );
}

function DesktopDiagram() {
  return (
    <svg
      className={styles.operatorDesktop}
      viewBox={`0 0 960 ${DESKTOP_VIEWBOX_HEIGHT}`}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <OneShotScene
        x={24}
        y={DESKTOP_SCENE_Y}
        width={320}
        height={SCENE_HEIGHT}
      />
      <Transition x={480} y={DESKTOP_TRANSITION_Y} />
      <WorkingScene
        x={616}
        y={DESKTOP_SCENE_Y}
        width={320}
        height={SCENE_HEIGHT}
      />
      <path
        d="M 360 208 H 400"
        fill="none"
        stroke="var(--border-emphasis)"
        strokeWidth={1.5}
        markerEnd="url(#operator-arrow-desktop)"
      />
      <path
        className={styles.storyEntry}
        d="M 560 208 H 600"
        fill="none"
        stroke="var(--visual-indigo)"
        strokeWidth={1.5}
        markerEnd="url(#operator-arrow-indigo-desktop)"
      />
      <defs>
        <ArrowMarker
          id="operator-arrow-desktop"
          tone="var(--border-emphasis)"
        />
        <ArrowMarker
          id="operator-arrow-indigo-desktop"
          tone="var(--visual-indigo)"
        />
      </defs>
    </svg>
  );
}

function MobileDiagram() {
  const oneShotY = 24;
  const oneShotHeight = oneShotSceneHeight(308);
  const oneShotBottom = oneShotY + oneShotHeight;
  const workingY = oneShotBottom + 192;
  const workingHeight = workingSceneHeight(308);
  const viewBoxHeight = workingY + workingHeight + 24;

  return (
    <svg
      className={styles.operatorMobile}
      viewBox={`0 0 340 ${viewBoxHeight}`}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <OneShotScene x={16} y={oneShotY} width={308} height={oneShotHeight} />
      <path
        d={`M 170 ${oneShotBottom + 8} V ${oneShotBottom + 48}`}
        fill="none"
        stroke="var(--border-emphasis)"
        strokeWidth={1.5}
        markerEnd="url(#operator-arrow-mobile)"
      />
      <EmojiImage
        asset={EMOJI.books}
        x={150}
        y={oneShotBottom + 56}
        size={40}
      />
      <DiagramText
        x={170}
        y={oneShotBottom + 116}
        anchor="middle"
        size={16}
        weight={700}
      >
        THE SKILL IS NOT BETTER ASKING.
      </DiagramText>
      <DiagramText
        x={170}
        y={oneShotBottom + 136}
        anchor="middle"
        tone="var(--visual-indigo)"
        size={16}
        weight={700}
      >
        IT IS BETTER DIRECTION.
      </DiagramText>
      <path
        className={styles.storyEntry}
        d={`M 170 ${oneShotBottom + 152} V ${oneShotBottom + 184}`}
        fill="none"
        stroke="var(--visual-indigo)"
        strokeWidth={1.5}
        markerEnd="url(#operator-arrow-indigo-mobile)"
      />
      <WorkingScene x={16} y={workingY} width={308} height={workingHeight} />
      <defs>
        <ArrowMarker id="operator-arrow-mobile" tone="var(--border-emphasis)" />
        <ArrowMarker
          id="operator-arrow-indigo-mobile"
          tone="var(--visual-indigo)"
        />
      </defs>
    </svg>
  );
}

export default function OperatorTransformationDiagram() {
  return (
    <div
      className={styles.container}
      role="img"
      aria-label="A developer moves from asking an agent for a one-shot guess to directing bounded work that builds context and returns a candidate to a human decision gate."
    >
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}
