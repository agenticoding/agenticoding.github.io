import React from 'react';
import clsx from 'clsx';
import { EmojiImage } from './ActorNodes';
import { EMOJI } from './emojiAssets';
import { GearNode } from './GearNode';
import { ROLE_SLOT_MS, getRoleCycleMs, roleBoundaryTiming } from './InstructionLayerAuthorityTiming';
import styles from './InstructionLayerAuthority.module.css';

type Tone = 'cyan' | 'indigo' | 'neutral';
type StoryStyle = React.CSSProperties & { '--delay': string };
type DiagramTimingStyle = React.CSSProperties & {
  '--role-slot-ms': string;
  '--cycle-ms': string;
};
type RoleCase = {
  role: string;
  behavior: string;
  detail: string;
  tone: Tone;
  emoji: keyof typeof EMOJI;
  y: number;
  mobileY: number;
};

const PROMPT_LINES = ['Always return JSON', 'summary · risks', 'next_action'];
const CASES: RoleCase[] = [
  { role: 'SYSTEM', behavior: 'standing rule', detail: 'enforce JSON shape', tone: 'cyan', emoji: 'compass', y: 44, mobileY: 156 },
  { role: 'USER', behavior: 'task preference', detail: 'follow unless overridden', tone: 'neutral', emoji: 'operator', y: 118, mobileY: 210 },
  { role: 'OBSERVATION', behavior: 'observed text', detail: 'data, not command', tone: 'indigo', emoji: 'receipt', y: 192, mobileY: 264 },
];

const ROLE_CYCLE_MS = getRoleCycleMs(CASES.length);
const FILTER_KEYFRAMES = 'instructionLayerAuthorityFilterCycle';
const PROJECTION_KEYFRAMES = 'instructionLayerAuthorityProjectionCycle';

function toneClass(tone: Tone) {
  return styles[tone];
}

function percentOfCycle(ms: number) {
  return `${(ms / ROLE_CYCLE_MS) * 100}%`;
}

function storyStyle(index: number, animationName: string): StoryStyle {
  // Keyframes are injected globally; inline names bypass CSS Modules renaming.
  return { '--delay': `${index * ROLE_SLOT_MS}ms`, animationName };
}

const diagramTimingStyle: DiagramTimingStyle = {
  '--role-slot-ms': `${ROLE_SLOT_MS}ms`,
  '--cycle-ms': `${ROLE_CYCLE_MS}ms`,
};

const gearCycleStyle: React.CSSProperties = { animationDuration: `${ROLE_SLOT_MS}ms` };

function TimingStyles() {
  return (
    <style>
      {`
        @keyframes ${FILTER_KEYFRAMES} {
          0%, ${percentOfCycle(roleBoundaryTiming.filterDimStartMs)}, ${percentOfCycle(roleBoundaryTiming.filterResetMs)}, 100% {
            opacity: 0.22;
          }

          ${percentOfCycle(roleBoundaryTiming.filterOnMs)}, ${percentOfCycle(roleBoundaryTiming.filterOffMs)} {
            opacity: 1;
          }
        }

        @keyframes ${PROJECTION_KEYFRAMES} {
          0%, ${percentOfCycle(roleBoundaryTiming.behaviorDimStartMs)}, ${percentOfCycle(roleBoundaryTiming.behaviorResetMs)}, 100% {
            opacity: 0.22;
          }

          ${percentOfCycle(roleBoundaryTiming.behaviorOnMs)}, ${percentOfCycle(roleBoundaryTiming.behaviorOffMs)} {
            opacity: 1;
          }
        }
      `}
    </style>
  );
}

function PromptSlide({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={210} height={102} className={styles.slide} />
      <text x={x + 16} y={y + 24} className={styles.slideLabel}>same instruction text</text>
      {PROMPT_LINES.map((line, index) => <PromptLine key={line} x={x + 16} y={y + 45 + index * 18} line={line} />)}
    </g>
  );
}

function PromptLine({ x, y, line }: { x: number; y: number; line: string }) {
  return (
    <g>
      <rect x={x - 5} y={y - 12} width={line.length * 7.1 + 10} height={17} className={styles.promptChip} />
      <text x={x} y={y} className={styles.promptText}>{line}</text>
    </g>
  );
}

function LayerFilter({ item, x, y, index }: { item: RoleCase; x: number; y: number; index: number }) {
  return (
    <g className={styles.filterStory} style={storyStyle(index, FILTER_KEYFRAMES)}>
      <rect x={x} y={y} width={142} height={46} className={clsx(styles.filterPlate, toneClass(item.tone))} />
      <EmojiImage asset={EMOJI[item.emoji]} x={x + 10} y={y + 9} size={28} />
      <text x={x + 48} y={y + 19} className={styles.filterRole}>{item.role}</text>
      <text x={x + 48} y={y + 33} className={styles.filterLabel}>source role</text>
    </g>
  );
}

function ProjectionPanel({ item, x, y, index, width = 190 }: { item: RoleCase; x: number; y: number; index: number; width?: number }) {
  return (
    <g className={styles.projectionStory} style={storyStyle(index, PROJECTION_KEYFRAMES)}>
      <rect x={x} y={y} width={width} height={52} className={clsx(styles.projectionPanel, toneClass(item.tone))} />
      <text x={x + 14} y={y + 20} className={styles.behaviorText}>{item.behavior}</text>
      <text x={x + 14} y={y + 37} className={styles.detailText}>{item.detail}</text>
    </g>
  );
}

const ARROW_HEAD_W = 12;
const ARROW_HEAD_HALF_H = 6;

function rightTipPoints(x: number, y: number) {
  return `${x} ${y}, ${x - ARROW_HEAD_W} ${y - ARROW_HEAD_HALF_H}, ${x - ARROW_HEAD_W} ${y + ARROW_HEAD_HALF_H}`;
}

const FLOW_CY = 141;
const PROMPT_RIGHT_X = 250;
const PROMPT_BUS_X = 288;
const FILTER_LEFT_X = 326;
const FILTER_RIGHT_X = 468;
const PROJECTOR_LEFT_X = 620;
const PROJECTOR_RIGHT_X = 682;
const PROJECTION_LEFT_X = 738;
const FILTER_BUS_X = 544;
const OUTPUT_BUS_X = 710;

function RoleFlow({ item, index, cy }: { item: RoleCase; index: number; cy: number }) {
  const promptPath = `M ${PROMPT_RIGHT_X} ${FLOW_CY} L ${PROMPT_BUS_X} ${FLOW_CY} L ${PROMPT_BUS_X} ${cy} L ${FILTER_LEFT_X - ARROW_HEAD_W} ${cy}`;
  const filterPath = `M ${FILTER_RIGHT_X} ${cy} L ${FILTER_BUS_X} ${cy} L ${FILTER_BUS_X} ${FLOW_CY} L ${PROJECTOR_LEFT_X - ARROW_HEAD_W} ${FLOW_CY}`;
  const predictionPath = `M ${PROJECTOR_RIGHT_X} ${FLOW_CY} L ${OUTPUT_BUS_X} ${FLOW_CY} L ${OUTPUT_BUS_X} ${cy} L ${PROJECTION_LEFT_X - ARROW_HEAD_W} ${cy}`;

  return (
    <>
      <g className={styles.flowStory} style={storyStyle(index, FILTER_KEYFRAMES)}>
        <path d={promptPath} className={clsx(styles.rolePath, toneClass(item.tone))} />
        <path d={filterPath} className={clsx(styles.rolePath, toneClass(item.tone))} />
        <polygon points={rightTipPoints(FILTER_LEFT_X, cy)} className={clsx(styles.roleTip, toneClass(item.tone))} />
        <polygon points={rightTipPoints(PROJECTOR_LEFT_X, FLOW_CY)} className={clsx(styles.roleTip, toneClass(item.tone))} />
      </g>
      <g className={styles.projectionStory} style={storyStyle(index, PROJECTION_KEYFRAMES)}>
        <path d={predictionPath} className={clsx(styles.rolePath, toneClass(item.tone))} />
        <polygon points={rightTipPoints(PROJECTION_LEFT_X, cy)} className={clsx(styles.roleTip, toneClass(item.tone))} />
      </g>
    </>
  );
}

function DesktopCase({ item, index }: { item: RoleCase; index: number }) {
  const cy = item.y + 23;
  return (
    <g>
      <RoleFlow item={item} index={index} cy={cy} />
      <LayerFilter item={item} x={326} y={item.y} index={index} />
      <ProjectionPanel item={item} x={738} y={item.y - 3} index={index} />
    </g>
  );
}

function DesktopDiagram() {
  return (
    <svg viewBox="0 0 940 270" width="100%" role="img" aria-label="The same instruction text enters different source roles before the LLM predicts different behavior." className={clsx(styles.diagram, styles.desktop)} style={diagramTimingStyle} xmlns="http://www.w3.org/2000/svg">
      <text x={145} y={34} textAnchor="middle" className={styles.columnLabel}>same words</text>
      <text x={397} y={34} textAnchor="middle" className={styles.columnLabel}>source role</text>
      <text x={651} y={34} textAnchor="middle" className={styles.columnLabel}>model prediction</text>
      <text x={833} y={34} textAnchor="middle" className={styles.columnLabel}>behavior</text>
      <PromptSlide x={40} y={90} />
      {CASES.map((item, index) => <DesktopCase key={item.role} item={item} index={index} />)}
      <GearNode x={620} y={110} size={62} className={clsx(styles.projectorGear, 'inference-llm-cycle idle-inference-cycle')} style={gearCycleStyle} />
    </svg>
  );
}

function MobileCase({ item, index }: { item: RoleCase; index: number }) {
  return (
    <g>
      <LayerFilter item={item} x={109} y={item.mobileY} index={index} />
      <ProjectionPanel item={item} x={42} y={454 + index * 56} index={index} width={276} />
    </g>
  );
}

function MobileDiagram() {
  return (
    <svg viewBox="0 0 360 650" width="100%" role="img" aria-label="Mobile view: same instruction text, source role, model prediction, different behavior." className={clsx(styles.diagram, styles.mobile)} style={diagramTimingStyle} xmlns="http://www.w3.org/2000/svg">
      <PromptSlide x={75} y={24} />
      <path d="M 180 126 V 152" className={styles.mobileGuide} />
      <text x={180} y={145} textAnchor="middle" className={styles.columnLabel}>source role</text>
      {CASES.map((item, index) => <MobileCase key={item.role} item={item} index={index} />)}
      <path d="M 180 310 V 338" className={styles.mobileGuide} />
      <GearNode x={149} y={338} size={62} className={clsx(styles.projectorGear, 'inference-llm-cycle idle-inference-cycle')} style={gearCycleStyle} />
      <path d="M 180 400 V 444" className={styles.mobileGuide} />
      <text x={180} y={437} textAnchor="middle" className={styles.columnLabel}>behavior</text>
    </svg>
  );
}

export default function InstructionLayerAuthority() {
  return (
    <>
      <TimingStyles />
      <DesktopDiagram />
      <MobileDiagram />
    </>
  );
}
