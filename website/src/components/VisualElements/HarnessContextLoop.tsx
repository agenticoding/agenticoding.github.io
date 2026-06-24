import React from 'react';
import clsx from 'clsx';
import type { PresentationAwareProps } from '../PresentationMode/types';
import { EmojiImage } from './ActorNodes';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import styles from './HarnessContextLoop.module.css';

const ARIA_LABEL = 'Agent harness context loop: assemble context, call the model, validate output, execute outside the model, append observation, choose whether to continue, then either iterate or exit with a final response.';
const CARD = { width: 192, height: 80 } as const;
const MOBILE_CARD = { width: 240, height: 80 } as const;
const EXIT_TILE = { width: 192, height: 64 } as const;
const MOBILE_EXIT_TILE = { width: 240, height: 64 } as const;
const DESKTOP_VIEW = { width: 720, height: 416 } as const;
const MOBILE_VIEW = { width: 320, height: 704 } as const;
const ICON = 32;
const MOBILE_ICON = 32;
const ARROW = '-8,-4 0,0 -8,4';
const LOOP_BEAT_MS = 900;

type Tone = 'context' | 'model' | 'warning' | 'system' | 'decision' | 'success';
type Step = { n: number; title: string; detail: readonly string[]; tone: Tone; icon: EmojiAsset; x: number; y: number };
type ArrowProps = { d: string; end: string; tone?: Tone; label?: string; labelX?: number; labelY?: number };

const COLORS: Record<Tone, { stroke: string; fill: string; text: string }> = {
  context: { stroke: 'var(--visual-indigo)', fill: 'var(--visual-bg-indigo)', text: 'var(--visual-indigo)' },
  model: { stroke: 'var(--visual-violet)', fill: 'var(--visual-bg-violet)', text: 'var(--visual-violet)' },
  warning: { stroke: 'var(--visual-warning)', fill: 'var(--visual-bg-warning)', text: 'var(--visual-warning)' },
  system: { stroke: 'var(--visual-cyan)', fill: 'var(--visual-bg-cyan)', text: 'var(--visual-cyan)' },
  decision: { stroke: 'var(--visual-violet)', fill: 'var(--visual-bg-violet)', text: 'var(--visual-violet)' },
  success: { stroke: 'var(--visual-success)', fill: 'var(--visual-bg-success)', text: 'var(--visual-success)' },
};

const STEPS = [
  { n: 1, title: 'Assemble context', detail: ['task + repo + tools', 'prior observations'], tone: 'context', icon: EMOJI.documentTabs },
  { n: 2, title: 'Call model', detail: ['predict response', 'or structured action'], tone: 'model', icon: EMOJI.gear },
  { n: 3, title: 'Validate output', detail: ['schema + policy', 'budget + permissions'], tone: 'warning', icon: EMOJI.warning },
  { n: 4, title: 'Execute outside', detail: ['tool / command', 'edit / test'], tone: 'system', icon: EMOJI.tools },
  { n: 5, title: 'Append obs.', detail: ['serialize result', 'into next context'], tone: 'context', icon: EMOJI.receipt },
  { n: 6, title: 'Continue?', detail: ['LLM proposes next', 'harness gates choice'], tone: 'decision', icon: EMOJI.question },
] as const satisfies readonly Omit<Step, 'x' | 'y'>[];

const DESKTOP_STEPS: readonly Step[] = STEPS.map((step, i) => ({
  ...step,
  x: [32, 264, 496, 496, 264, 32][i],
  y: [64, 64, 64, 200, 200, 200][i],
}));

const MOBILE_STEPS: readonly Step[] = STEPS.map((step, i) => ({
  ...step,
  x: 40,
  y: 32 + i * 96,
}));

function Arrow({ d, end, tone, label, labelX, labelY }: ArrowProps) {
  const stroke = tone ? COLORS[tone].stroke : 'var(--text-muted)';
  return (
    <g className={styles.connector}>
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={ARROW} transform={end} fill={stroke} />
      {label && <text x={labelX} y={labelY} className={styles.branchLabel} fill={stroke}>{label}</text>}
    </g>
  );
}

function Card({ n, title, detail, tone, icon, x, y, width = CARD.width, height = CARD.height }: Step & { width?: number; height?: number }) {
  const color = COLORS[tone];
  const iconSize = width === MOBILE_CARD.width ? MOBILE_ICON : ICON;
  const textX = x + 56;
  return (
    <g className={clsx(styles.card, styles.idleBeat)} style={{ animationDelay: `${(n - 1) * LOOP_BEAT_MS}ms` }}>
      <rect x={x} y={y} width={width} height={height} rx={0} fill={color.fill} stroke={color.stroke} strokeWidth="1" />
      <EmojiImage asset={icon} x={x + 16} y={y + 16} size={iconSize} />
      <text x={textX} y={y + 24} className={styles.cardTitle} fill={color.text}>{n}. {title}</text>
      {detail.map((line, i) => (
        <text key={line} x={textX} y={y + 48 + i * 16} className={styles.cardDetail} fill="var(--text-muted)">{line}</text>
      ))}
    </g>
  );
}


function ExitTile({ x, y, width = EXIT_TILE.width, height = EXIT_TILE.height }: { x: number; y: number; width?: number; height?: number }) {
  return (
    <g className={clsx(styles.exitTile, styles.idleBeat)} style={{ animationDelay: `${STEPS.length * LOOP_BEAT_MS}ms` }}>
      <rect x={x} y={y} width={width} height={height} rx={0} fill="var(--visual-bg-success)" stroke="var(--visual-success)" strokeWidth="1" />
      <EmojiImage asset={EMOJI.check} x={x + 16} y={y + 16} size={32} />
      <text x={x + 56} y={y + 26} className={styles.cardTitle} fill="var(--visual-success)">Exit loop</text>
      <text x={x + 56} y={y + 50} className={styles.cardDetail} fill="var(--text-muted)">final response</text>
    </g>
  );
}

function DesktopDiagram() {
  return (
    <svg viewBox={`0 0 ${DESKTOP_VIEW.width} ${DESKTOP_VIEW.height}`} width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.desktopDiagram)}>
      <text x="360" y="32" textAnchor="middle" className={styles.loopLabel} fill="var(--text-muted)">context → model output → validated action → observation → context</text>
      <Arrow d="M 224 104 H 256" end="translate(264,104)" tone="model" />
      <Arrow d="M 456 104 H 488" end="translate(496,104)" tone="warning" />
      <Arrow d="M 592 144 V 192" end="translate(592,200) rotate(90)" tone="system" />
      <Arrow d="M 496 240 H 464" end="translate(456,240) rotate(180)" tone="context" />
      <Arrow d="M 264 240 H 232" end="translate(224,240) rotate(180)" />
      <Arrow d="M 128 200 V 152" end="translate(128,144) rotate(-90)" label="iterate" labelX={144} labelY={176} />
      <Arrow d="M 128 280 V 312" end="translate(128,320) rotate(90)" tone="success" />
      {DESKTOP_STEPS.map((step) => <Card key={step.n} {...step} />)}
      <ExitTile x={32} y={320} />
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg viewBox={`0 0 ${MOBILE_VIEW.width} ${MOBILE_VIEW.height}`} width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.mobileDiagram)}>
      {MOBILE_STEPS.map((step) => <Card key={step.n} {...step} {...MOBILE_CARD} />)}
      <Arrow d="M 160 112 V 120" end="translate(160,128) rotate(90)" tone="model" />
      <Arrow d="M 160 208 V 216" end="translate(160,224) rotate(90)" tone="warning" />
      <Arrow d="M 160 304 V 312" end="translate(160,320) rotate(90)" tone="system" />
      <Arrow d="M 160 400 V 408" end="translate(160,416) rotate(90)" tone="context" />
      <Arrow d="M 160 496 V 504" end="translate(160,512) rotate(90)" />
      <Arrow d="M 40 552 H 16 V 72 H 32" end="translate(40,72)" />
      <Arrow d="M 160 592 V 600" end="translate(160,608) rotate(90)" tone="success" />
      <ExitTile x={40} y={608} {...MOBILE_EXIT_TILE} />
    </svg>
  );
}

export default function HarnessContextLoop({ compact = false }: PresentationAwareProps = {}) {
  return (
    <div className={clsx(styles.container, compact && styles.compact)} role="img" aria-label={ARIA_LABEL}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}
