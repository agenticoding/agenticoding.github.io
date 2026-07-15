import React from 'react';
import styles from './OperatorTransformationDiagram.module.css';
import {
  agentIconSize,
  ContextAgentTile,
  type AgentContextTile,
} from './AgentTile';
import { EmojiImage, OperatorNode } from './ActorNodes';
import { EMOJI } from './emojiAssets';

type TextProps = {
  x: number;
  y: number;
  children: React.ReactNode;
  tone?: string;
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
  weight?: number;
  voice?: 'ai' | 'human' | 'spec' | 'keyword';
};

type MarkerProps = {
  id: string;
  tone: string;
};

const CALLOUT_LINE_HEIGHT = 16;
const CALLOUT_TEXT_OFFSET = 17;
const CALLOUT_INLINE_PADDING = 16;
const CALLOUT_PADDING = 16;
const CALLOUT_TO_TILE_GAP = 8;
const TILE_TO_GATE_GAP = 8;
const GATE_HEIGHT = 24;

function calloutHeight(lines: readonly string[]) {
  return lines.length * CALLOUT_LINE_HEIGHT + CALLOUT_PADDING;
}

function DiagramText({
  x,
  y,
  children,
  tone = 'var(--text-heading)',
  anchor = 'start',
  size = 11,
  weight = 500,
  voice = 'spec',
}: TextProps) {
  return (
    <text
      x={x}
      y={y}
      fill={tone}
      textAnchor={anchor}
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
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={calloutHeight(lines)}
        rx={0}
        fill="var(--surface-page)"
        stroke={tone}
        strokeWidth={1}
      />
      {lines.map((line, index) => (
        <DiagramText
          key={`${line}-${index}`}
          x={x + CALLOUT_INLINE_PADDING}
          y={y + CALLOUT_TEXT_OFFSET + index * CALLOUT_LINE_HEIGHT}
          tone="var(--text-heading)"
          voice={voice}
          size={size}
          weight={400}
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
  const requestLines = ['“Can you fix this?”'];
  const requestY = y + 48;
  const tileHeight = 184;
  const tileY = requestY + calloutHeight(requestLines) + CALLOUT_TO_TILE_GAP;
  const feedbackY = tileY + tileHeight + CALLOUT_TO_TILE_GAP;
  return (
    <g>
      <Frame x={x} y={y} width={width} height={height} />
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
        agentBlockHeight={104}
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
        lines={['“Looks right. Is it?”', 'Who owns the result?']}
      />
    </g>
  );
}

function oneShotTile(): AgentContextTile {
  return {
    label: 'DONE?',
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
  const requestY = y + 44;
  const boardY = requestY + calloutHeight(requestLines) + CALLOUT_TO_TILE_GAP;
  const gateY = boardY + boardHeight + TILE_TO_GATE_GAP;
  const gateX = x + width / 2;
  return (
    <g>
      <Frame
        x={x}
        y={y}
        width={width}
        height={height}
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
        x={x + 76}
        y={requestY}
        width={width - 92}
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
          fill="var(--surface-raised)"
          stroke="var(--border-emphasis)"
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
      viewBox="0 0 960 448"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <OneShotScene x={24} y={24} width={320} height={336} />
      <Transition x={480} y={24} />
      <WorkingScene x={616} y={24} width={320} height={400} />
      <path
        d="M 360 114 H 400"
        fill="none"
        stroke="var(--border-emphasis)"
        strokeWidth={1.5}
        markerEnd="url(#operator-arrow-desktop)"
      />
      <path
        className={styles.storyEntry}
        d="M 560 114 H 600"
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
  return (
    <svg
      className={styles.operatorMobile}
      viewBox="0 0 340 976"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <OneShotScene x={16} y={24} width={308} height={336} />
      <path
        d="M 170 376 V 416"
        fill="none"
        stroke="var(--border-emphasis)"
        strokeWidth={1.5}
        markerEnd="url(#operator-arrow-mobile)"
      />
      <EmojiImage asset={EMOJI.books} x={150} y={424} size={40} />
      <DiagramText x={170} y={484} anchor="middle" size={16} weight={700}>
        THE SKILL IS NOT BETTER ASKING.
      </DiagramText>
      <DiagramText
        x={170}
        y={504}
        anchor="middle"
        tone="var(--visual-indigo)"
        size={16}
        weight={700}
      >
        IT IS BETTER DIRECTION.
      </DiagramText>
      <path
        className={styles.storyEntry}
        d="M 170 520 V 552"
        fill="none"
        stroke="var(--visual-indigo)"
        strokeWidth={1.5}
        markerEnd="url(#operator-arrow-indigo-mobile)"
      />
      <WorkingScene x={16} y={568} width={308} height={400} />
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
