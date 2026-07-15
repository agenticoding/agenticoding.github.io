import React from 'react';
import { EmojiImage } from './ActorNodes';
import {
  AgentTile,
  ContextAgentTile,
  activationStyle,
  agentIconSize,
  type AgentContextTile,
} from './AgentTile';
import type { TokenSequence } from './AnimatedTokenFlow';
import { DiagramTileSurface } from './DiagramTile';
import { DIAGRAM_ICON_SIZE, DIAGRAM_TOKEN_SIZE } from './diagramScale';
import { tileToneVars, type DiagramTone } from './diagramTileLayout';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import {
  PairedTokenArrowTrain,
  TokenArrowTrain,
  type TokenArrowTrainProps,
} from './TokenArrowTrain';
import type { TokenUnitTone } from './TokenUnit';
import type { WorkingAgentActivation } from './WorkingAgentNode';
import styles from './GroundingDistillationDiagram.module.css';

const ARIA_LABEL =
  'Grounding distillation diagram: one grounding sources container sends dense research to a grounding agent, which distills compact facts into the root orchestrator. The root can send one targeted lookup back to the sources when working context is incomplete.';

const LOOP_MS = 7800;
const FLOW_SIZE = DIAGRAM_TOKEN_SIZE.flow;
const FLOW_STAGGER = { mode: 'pathSpacing', spacingPx: 24 } as const;
const DOUBLE_ARROW_GAP = 16;
const FLOW_TIMING = {
  cycleMs: LOOP_MS,
  travelMs: 1280,
  fadeMs: 160,
  repeat: 'loop',
} as const;
const SOURCE_QUERY_DELAY_MS = 0;
const SOURCE_RESULT_DELAY_MS = 520;
const GROUNDING_TO_ROOT_DELAY_MS = 2100;
const LOOKUP_DELAY_MS = 4700;
const LOOKUP_RESULT_DELAY_MS = 5400;
const SOURCE_ACTIVATION_STEP_MS = 180;
const ROOT_CONTEXT_ACTIVATION_DELAY_MS =
  GROUNDING_TO_ROOT_DELAY_MS + FLOW_TIMING.travelMs;
const FACT_ACTIVATION_STEP_MS = 250;
const ROOT_ACTIVE_END_MS =
  LOOKUP_RESULT_DELAY_MS + FLOW_TIMING.travelMs + FLOW_TIMING.fadeMs;
const SOURCE_QUERY_TOKENS = [
  { modality: 'code', signal: 'salient' },
  { modality: 'text', signal: 'ordinary' },
] as const satisfies TokenSequence;
const SOURCE_TOKENS = [
  { modality: 'code', signal: 'ordinary' },
  { modality: 'text', signal: 'ordinary' },
  { modality: 'generic', signal: 'ordinary' },
  { modality: 'code', signal: 'salient' },
  { modality: 'text', signal: 'ordinary' },
  { modality: 'image', signal: 'ordinary' },
  { modality: 'code', signal: 'ordinary' },
  { modality: 'text', signal: 'salient' },
] as const satisfies TokenSequence;
const DISTILLED_TOKENS = [
  { modality: 'text', signal: 'compressed' },
  { modality: 'generic', signal: 'salient' },
  { modality: 'text', signal: 'compressed' },
  { modality: 'code', signal: 'salient' },
] as const satisfies TokenSequence;
const TARGETED_REQUEST_TOKENS = [
  { modality: 'code', signal: 'salient' },
  { modality: 'text', signal: 'ordinary' },
] as const satisfies TokenSequence;
const TARGETED_RESULT_TOKENS = [
  { modality: 'text', signal: 'compressed' },
  { modality: 'code', signal: 'ordinary' },
  { modality: 'image', signal: 'ordinary' },
  { modality: 'generic', signal: 'salient' },
  { modality: 'text', signal: 'compressed' },
] as const satisfies TokenSequence;
const SOURCE_ITEMS = [
  { label: 'codebase', icon: EMOJI.laptop, tone: 'var(--text-body)' },
  { label: 'docs', icon: EMOJI.books, tone: 'var(--text-body)' },
  { label: 'history', icon: EMOJI.receipt, tone: 'var(--text-body)' },
  { label: 'specs', icon: EMOJI.ruler, tone: 'var(--text-body)' },
] as const;
const ROOT_FACTS = [
  'architecture',
  'known traps',
  'where to look next',
] as const;

type BoxProps = { x: number; y: number; width: number; height: number };
type SourceItem = { label: string; icon: EmojiAsset; tone: string };
type FlowStyle = { strokeTone: DiagramTone; tokenTone: TokenUnitTone };

type FlowSpec =
  | { kind: 'pair'; pair: DoubleArrowSpec }
  | { kind: 'arrow'; arrow: TokenArrowTrainProps };

type DoubleArrowSpec = {
  request: TokenArrowTrainProps;
  response: TokenArrowTrainProps;
};

type Point = { x: number; y: number };

const FLOW_STYLES = {
  groundingQuery: { strokeTone: 'model', tokenTone: 'violet' },
  sourceResult: { strokeTone: 'context', tokenTone: 'indigo' },
  distilledContext: { strokeTone: 'context', tokenTone: 'indigo' },
  targetedLookup: { strokeTone: 'system', tokenTone: 'cyan' },
  targetedResult: { strokeTone: 'context', tokenTone: 'indigo' },
} as const satisfies Record<string, FlowStyle>;

export default function GroundingDistillationDiagram() {
  return (
    <div className={styles.container}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}

function DesktopDiagram() {
  const flows = desktopFlows();
  return (
    <svg
      className={`${styles.diagram} ${styles.desktopDiagram}`}
      viewBox="0 0 760 420"
      role="img"
      aria-label={ARIA_LABEL}
    >
      <DiagramTitle title="GROUNDING SOURCES → COMPACT ROOT CONTEXT" />
      <FlowLayer flows={flows} />
      <SourceCloud x={30} y={58} width={250} height={172} density="desktop" />
      <GroundingAgent x={330} y={260} width={176} height={128} />
      <RootOrchestrator
        x={546}
        y={58}
        width={184}
        height={260}
        facts={ROOT_FACTS}
      />
      <LookupLabel x={368} y={126} />
    </svg>
  );
}

function MobileDiagram() {
  const flows = mobileFlows();
  return (
    <svg
      className={`${styles.diagram} ${styles.mobileDiagram}`}
      viewBox="0 0 340 780"
      role="img"
      aria-label={ARIA_LABEL}
    >
      <DiagramTitle title="GROUNDING → ROOT CONTEXT" />
      <FlowLayer flows={flows} />
      <SourceCloud x={28} y={56} width={276} height={186} density="mobile" />
      <GroundingAgent x={82} y={318} width={176} height={104} compact />
      <RootOrchestrator
        x={50}
        y={500}
        width={240}
        height={260}
        facts={ROOT_FACTS}
        compact
      />
      <LookupLabel x={42} y={478} />
    </svg>
  );
}

function DiagramTitle({ title }: { title: string }) {
  return (
    <text x={24} y={26} fill="var(--text-muted)" className={styles.frameLabel}>
      {title}
    </text>
  );
}

function SourceCloud(props: BoxProps & { density: 'desktop' | 'mobile' }) {
  const layout = sourceItemLayout(props.density);
  return (
    <g>
      <DiagramTileSurface
        {...props}
        tone="context"
        weight={1.5}
        className={styles.sourceRect}
      />
      <SourceHeader x={props.x} y={props.y} />
      {SOURCE_ITEMS.map((item, index) => (
        <SourceCloudItem
          key={item.label}
          item={item}
          x={props.x + layout[index].x}
          y={props.y + layout[index].y}
          activationDelayMs={sourceActivationDelay(index)}
        />
      ))}
    </g>
  );
}

function SourceHeader({ x, y }: { x: number; y: number }) {
  return (
    <>
      <text
        x={x + 16}
        y={y + 24}
        fill="var(--text-heading)"
        className={styles.nodeEyebrow}
      >
        GROUNDING SOURCES
      </text>
      <text
        x={x + 16}
        y={y + 44}
        fill="var(--text-muted)"
        className={styles.noteText}
      >
        broad material, one searchable surface
      </text>
    </>
  );
}

function SourceCloudItem({
  item,
  x,
  y,
  activationDelayMs,
}: {
  item: SourceItem;
  x: number;
  y: number;
  activationDelayMs: number;
}) {
  return (
    <g
      className={styles.sourceItemActivation}
      style={activationStyle(activationDelayMs)}
    >
      <EmojiImage asset={item.icon} x={x} y={y} size={32} />
      <text
        x={x + 40}
        y={y + 21}
        fill={item.tone}
        className={styles.sourceLabel}
      >
        {item.label}
      </text>
    </g>
  );
}

function sourceActivationDelay(index: number) {
  return SOURCE_RESULT_DELAY_MS + index * SOURCE_ACTIVATION_STEP_MS;
}

function sourceItemLayout(density: 'desktop' | 'mobile') {
  if (density === 'mobile')
    return [
      { x: 24, y: 68 },
      { x: 150, y: 68 },
      { x: 24, y: 124 },
      { x: 150, y: 124 },
    ];
  return [
    { x: 20, y: 70 },
    { x: 132, y: 70 },
    { x: 20, y: 124 },
    { x: 132, y: 124 },
  ];
}

function GroundingAgent(props: BoxProps & { compact?: boolean }) {
  return (
    <AgentTile
      {...props}
      tone="model"
      title="Filter + distill"
      eyebrow="GROUNDING AGENT"
      titleClassName={styles.agentTitleCompact}
      iconSize={agentIconSize(props.compact)}
      rectClassName={styles.agentRect}
      gearActivation={gearActivation(
        0,
        GROUNDING_TO_ROOT_DELAY_MS + FLOW_TIMING.travelMs
      )}
    />
  );
}

function RootOrchestrator(
  props: BoxProps & { facts: readonly string[]; compact?: boolean }
) {
  return (
    <ContextAgentTile
      {...props}
      agentBlockHeight={props.compact ? 104 : 132}
      tone="system"
      contextEyebrow="ROOT ORCHESTRATOR"
      contextDetail="usable working context"
      contextTiles={rootContextTiles(props.facts)}
      contextClasses={contextClasses()}
      eyebrow="ROOT AGENT"
      title="Ask for missing pieces"
      iconSize={
        props.compact ? DIAGRAM_ICON_SIZE.primary : DIAGRAM_ICON_SIZE.actor
      }
      titleClassName={styles.agentTitleCompact}
      rectClassName={styles.agentRect}
      textClasses={{ eyebrow: styles.nodeEyebrow }}
      gearActivation={gearActivation(
        GROUNDING_TO_ROOT_DELAY_MS,
        ROOT_ACTIVE_END_MS
      )}
    />
  );
}

function contextClasses() {
  return {
    detail: styles.noteText,
    eyebrow: styles.nodeEyebrow,
    tile: styles.tileActivation,
    tileRect: styles.factRect,
    tileText: styles.factText,
  };
}

function rootContextTiles(facts: readonly string[]): AgentContextTile[] {
  return [
    ...facts.map((label, index) => ({
      label,
      activationDelayMs:
        ROOT_CONTEXT_ACTIVATION_DELAY_MS + index * FACT_ACTIVATION_STEP_MS,
    })),
    {
      label: 'targeted follow-up',
      activationDelayMs: LOOKUP_RESULT_DELAY_MS + FLOW_TIMING.travelMs,
    },
  ];
}

function gearActivation(
  startMs: number,
  endMs: number
): WorkingAgentActivation {
  return {
    activeMs: Math.max(0, endMs - startMs),
    cycleMs: LOOP_MS,
    delayMs: startMs,
  };
}

function FlowLayer({ flows }: { flows: readonly FlowSpec[] }) {
  return (
    <g>
      {flows.map((flow, index) => (
        <Flow key={index} flow={flow} />
      ))}
    </g>
  );
}

function Flow({ flow }: { flow: FlowSpec }) {
  if (flow.kind === 'pair') return <PairedTokenArrowTrain {...flow.pair} />;
  return <TokenArrowTrain {...flow.arrow} />;
}

function doubleArrow({
  requestD,
  responseD,
  requestTokens,
  responseTokens,
  requestStyle,
  responseStyle,
  requestDelayMs,
  responseDelayMs,
}: {
  requestD: string;
  responseD: string;
  requestTokens: TokenSequence;
  responseTokens: TokenSequence;
  requestStyle: FlowStyle;
  responseStyle: FlowStyle;
  requestDelayMs: number;
  responseDelayMs: number;
}): DoubleArrowSpec {
  return {
    request: arrowSpec(requestD, requestTokens, requestStyle, requestDelayMs),
    response: arrowSpec(
      responseD,
      responseTokens,
      responseStyle,
      responseDelayMs
    ),
  };
}

function arrowSpec(
  d: string,
  tokens: TokenSequence,
  style: FlowStyle,
  startDelayMs: number
): TokenArrowTrainProps {
  return {
    d,
    tokens,
    timing: { ...FLOW_TIMING, startDelayMs },
    stagger: FLOW_STAGGER,
    tone: style.tokenTone,
    stroke: tileToneVars(style.strokeTone).accent,
    size: FLOW_SIZE,
    pathClassName: styles.connector,
    strokeLinecap: 'butt',
    strokeLinejoin: 'miter',
  };
}

function pairedFlow(pair: DoubleArrowSpec): FlowSpec {
  return { kind: 'pair', pair };
}

function singleFlow(
  d: string,
  tokens: TokenSequence,
  style: FlowStyle,
  startDelayMs: number
): FlowSpec {
  return { kind: 'arrow', arrow: arrowSpec(d, tokens, style, startDelayMs) };
}

function verticalEdgePair(left: Point, right: Point) {
  const slope = (right.y - left.y) / (right.x - left.x);
  const yOffset = (DOUBLE_ARROW_GAP * Math.hypot(1, slope)) / 2;
  return {
    requestD: linePath(
      { x: right.x, y: right.y - yOffset },
      { x: left.x, y: left.y - yOffset }
    ),
    responseD: linePath(
      { x: left.x, y: left.y + yOffset },
      { x: right.x, y: right.y + yOffset }
    ),
  };
}

function verticalPair(top: Point, bottom: Point) {
  const xOffset = DOUBLE_ARROW_GAP / 2;
  return {
    requestD: linePath(
      { x: bottom.x - xOffset, y: bottom.y },
      { x: top.x - xOffset, y: top.y }
    ),
    responseD: linePath(
      { x: top.x + xOffset, y: top.y },
      { x: bottom.x + xOffset, y: bottom.y }
    ),
  };
}

function horizontalPair(left: Point, right: Point) {
  const yOffset = DOUBLE_ARROW_GAP / 2;
  return {
    requestD: linePath(
      { x: right.x, y: right.y - yOffset },
      { x: left.x, y: left.y - yOffset }
    ),
    responseD: linePath(
      { x: left.x, y: left.y + yOffset },
      { x: right.x, y: right.y + yOffset }
    ),
  };
}

function linePath(from: Point, to: Point) {
  return `M ${coordinate(from.x)} ${coordinate(from.y)} L ${coordinate(to.x)} ${coordinate(to.y)}`;
}

function coordinate(value: number) {
  return Number(value.toFixed(2));
}

function desktopFlows(): FlowSpec[] {
  return [
    pairedFlow(
      doubleArrow({
        ...verticalEdgePair({ x: 280, y: 214 }, { x: 330, y: 294 }),
        requestTokens: SOURCE_QUERY_TOKENS,
        responseTokens: SOURCE_TOKENS,
        requestStyle: FLOW_STYLES.groundingQuery,
        responseStyle: FLOW_STYLES.sourceResult,
        requestDelayMs: SOURCE_QUERY_DELAY_MS,
        responseDelayMs: SOURCE_RESULT_DELAY_MS,
      })
    ),
    singleFlow(
      linePath({ x: 506, y: 292 }, { x: 546, y: 180 }),
      DISTILLED_TOKENS,
      FLOW_STYLES.distilledContext,
      GROUNDING_TO_ROOT_DELAY_MS
    ),
    pairedFlow(
      doubleArrow({
        ...horizontalPair({ x: 280, y: 124 }, { x: 546, y: 124 }),
        requestTokens: TARGETED_REQUEST_TOKENS,
        responseTokens: TARGETED_RESULT_TOKENS,
        requestStyle: FLOW_STYLES.targetedLookup,
        responseStyle: FLOW_STYLES.targetedResult,
        requestDelayMs: LOOKUP_DELAY_MS,
        responseDelayMs: LOOKUP_RESULT_DELAY_MS,
      })
    ),
  ];
}

function mobileFlows(): FlowSpec[] {
  return [
    pairedFlow(
      doubleArrow({
        ...verticalPair({ x: 170, y: 242 }, { x: 170, y: 318 }),
        requestTokens: SOURCE_QUERY_TOKENS,
        responseTokens: SOURCE_TOKENS,
        requestStyle: FLOW_STYLES.groundingQuery,
        responseStyle: FLOW_STYLES.sourceResult,
        requestDelayMs: SOURCE_QUERY_DELAY_MS,
        responseDelayMs: SOURCE_RESULT_DELAY_MS,
      })
    ),
    singleFlow(
      linePath({ x: 170, y: 422 }, { x: 170, y: 500 }),
      DISTILLED_TOKENS,
      FLOW_STYLES.distilledContext,
      GROUNDING_TO_ROOT_DELAY_MS
    ),
    pairedFlow(
      doubleArrow({
        requestD: 'M 50 560 H 12 V 142 H 28',
        responseD: 'M 304 158 H 314 V 576 H 290',
        requestTokens: TARGETED_REQUEST_TOKENS,
        responseTokens: TARGETED_RESULT_TOKENS,
        requestStyle: FLOW_STYLES.targetedLookup,
        responseStyle: FLOW_STYLES.targetedResult,
        requestDelayMs: LOOKUP_DELAY_MS,
        responseDelayMs: LOOKUP_RESULT_DELAY_MS,
      })
    ),
  ];
}

function LookupLabel({ x, y }: { x: number; y: number }) {
  return (
    <text
      x={x}
      y={y}
      fill={tileToneVars('context').accent}
      className={styles.loopLabel}
    >
      targeted lookup
    </text>
  );
}
