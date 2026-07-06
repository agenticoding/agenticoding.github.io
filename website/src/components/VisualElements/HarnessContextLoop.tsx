import React from 'react';
import clsx from 'clsx';
import { DiagramArrow, DiagramArrowMarkers } from './DiagramArrow';
import { DiagramTile } from './DiagramTile';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import { PROCESS_TILE_SCALE } from './diagramScale';
import type { DiagramTone } from './diagramTileLayout';
import styles from './HarnessContextLoop.module.css';

const ARIA_LABEL = 'Agent harness context loop: assemble context, call the model, validate output, execute outside the model, append observation, choose whether to continue, then either iterate or exit with a final response.';
const CARD = PROCESS_TILE_SCALE.tile;
const MOBILE_CARD = PROCESS_TILE_SCALE.mobileTile;
const EXIT_TILE = PROCESS_TILE_SCALE.exitTile;
const MOBILE_EXIT_TILE = PROCESS_TILE_SCALE.mobileExitTile;
const DESKTOP_VIEW = { width: 720, height: 416 } as const;
const MOBILE_VIEW = { width: 320, height: 704 } as const;
const LOOP_BEAT_MS = 900;
const ARROW_TONES = ['model', 'warning', 'system', 'context', 'neutral', 'success'] as const satisfies readonly DiagramTone[];

type Tone = Extract<DiagramTone, 'context' | 'model' | 'warning' | 'system' | 'decision' | 'success'>;
type Step = { n: number; title: string; detail: readonly string[]; tone: Tone; icon: EmojiAsset; x: number; y: number };
type ArrowProps = { d: string; markerIdPrefix: string; tone?: DiagramTone; label?: string; labelX?: number; labelY?: number };

const STEPS = [
  { n: 1, title: 'Assemble context', detail: ['task + repo + tools', 'prior observations'], tone: 'context', icon: EMOJI.documentTabs },
  { n: 2, title: 'Call model', detail: ['predict response', 'or structured action'], tone: 'model', icon: EMOJI.gear },
  { n: 3, title: 'Validate output', detail: ['schema + policy', 'budget + permissions'], tone: 'warning', icon: EMOJI.warning },
  { n: 4, title: 'Execute outside', detail: ['tool / command', 'edit / test'], tone: 'system', icon: EMOJI.tools },
  { n: 5, title: 'Add observation', detail: ['tool result', 'into next context'], tone: 'context', icon: EMOJI.observe },
  { n: 6, title: 'Continue?', detail: ['LLM proposes next', 'harness gates choice'], tone: 'decision', icon: EMOJI.question },
] as const satisfies readonly Omit<Step, 'x' | 'y'>[];

const DESKTOP_STEPS: readonly Step[] = STEPS.map((step, i) => ({
  ...step,
  x: [32, 264, 496, 496, 264, 32][i],
  y: [64, 64, 64, 200, 200, 200][i],
}));

const MOBILE_STEPS: readonly Step[] = STEPS.map((step, i) => ({
  ...step,
  x: 48,
  y: 32 + i * 96,
}));

function Arrow(props: ArrowProps) {
  return <DiagramArrow {...props} className={styles.connector} labelClassName={styles.branchLabel} />;
}

function Card({ n, title, detail, tone, icon, x, y, width = CARD.width, height = CARD.height }: Step & { width?: number; height?: number }) {
  return <DiagramTile variant="process" x={x} y={y} width={width} height={height} tone={tone} stepLabel={String(n).padStart(2, '0')} icon={icon} title={title} detail={detail} titleVoice="spec" className={clsx(styles.card, styles.idleBeat)} style={{ animationDelay: `${(n - 1) * LOOP_BEAT_MS}ms` }} />;
}

function ExitTile({ x, y, width = EXIT_TILE.width, height = EXIT_TILE.height }: { x: number; y: number; width?: number; height?: number }) {
  return <DiagramTile variant="process" x={x} y={y} width={width} height={height} tone="success" stepLabel="OK" icon={EMOJI.check} title="Exit loop" detail="final response" titleVoice="spec" className={clsx(styles.exitTile, styles.idleBeat)} style={{ animationDelay: `${STEPS.length * LOOP_BEAT_MS}ms` }} />;
}

function DesktopDiagram() {
  const markerIdPrefix = 'hcl-desktop';
  return (
    <svg viewBox={`0 0 ${DESKTOP_VIEW.width} ${DESKTOP_VIEW.height}`} width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.desktopDiagram)}>
      <DiagramArrowMarkers prefix={markerIdPrefix} tones={ARROW_TONES} />
      <text x="360" y="32" textAnchor="middle" className={styles.loopLabel} fill="var(--text-muted)">context → model output → validated action → observation → context</text>
      <Arrow d="M 224 104 H 264" markerIdPrefix={markerIdPrefix} tone="model" />
      <Arrow d="M 456 104 H 496" markerIdPrefix={markerIdPrefix} tone="warning" />
      <Arrow d="M 592 144 V 200" markerIdPrefix={markerIdPrefix} tone="system" />
      <Arrow d="M 496 240 H 456" markerIdPrefix={markerIdPrefix} tone="context" />
      <Arrow d="M 264 240 H 224" markerIdPrefix={markerIdPrefix} />
      <Arrow d="M 128 200 V 144" markerIdPrefix={markerIdPrefix} label="iterate" labelX={144} labelY={176} />
      <Arrow d="M 128 280 V 320" markerIdPrefix={markerIdPrefix} tone="success" />
      {DESKTOP_STEPS.map((step) => <Card key={step.n} {...step} />)}
      <ExitTile x={32} y={320} />
    </svg>
  );
}

function MobileDiagram() {
  const markerIdPrefix = 'hcl-mobile';
  return (
    <svg viewBox={`0 0 ${MOBILE_VIEW.width} ${MOBILE_VIEW.height}`} width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.mobileDiagram)}>
      <DiagramArrowMarkers prefix={markerIdPrefix} tones={ARROW_TONES} />
      {MOBILE_STEPS.map((step) => <Card key={step.n} {...step} {...MOBILE_CARD} />)}
      <Arrow d="M 160 112 V 128" markerIdPrefix={markerIdPrefix} tone="model" />
      <Arrow d="M 160 208 V 224" markerIdPrefix={markerIdPrefix} tone="warning" />
      <Arrow d="M 160 304 V 320" markerIdPrefix={markerIdPrefix} tone="system" />
      <Arrow d="M 160 400 V 416" markerIdPrefix={markerIdPrefix} tone="context" />
      <Arrow d="M 160 496 V 512" markerIdPrefix={markerIdPrefix} />
      <Arrow d="M 48 552 H 24 V 72 H 48" markerIdPrefix={markerIdPrefix} />
      <Arrow d="M 160 592 V 608" markerIdPrefix={markerIdPrefix} tone="success" />
      <ExitTile x={48} y={608} {...MOBILE_EXIT_TILE} />
    </svg>
  );
}

export default function HarnessContextLoop() {
  return (
    <div className={styles.container} role="img" aria-label={ARIA_LABEL}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}
