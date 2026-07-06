import React from 'react';
import clsx from 'clsx';
import styles from './LivingContextWindowStream.module.css';
import { EMOJI } from './emojiAssets';
import { DiagramTile } from './DiagramTile';

type Tone = 'cyan' | 'indigo' | 'neutral' | 'violet';
type AssemblyStyle = React.CSSProperties & { '--step': number };
type Variant = 'desktop' | 'mobile';
type LayerSlice = { label: string; tone: Tone; emoji: keyof typeof EMOJI; x: number; y: number; w: number; h: number; threadStartX: number; rawY: number; step: number };
type RawLine = { text: string; tone?: Tone; indent?: number; small?: boolean };
type RawBlock = { y: number; tone: Tone; lines: RawLine[]; step: number };
type Region = {
  label: string;
  tone: Tone;
  emoji: keyof typeof EMOJI;
  desktopLines: RawLine[];
  mobileLines: RawLine[];
};

const TILE_LAYOUTS = {
  desktop: { x: 104, y: 90, width: 170, height: 32, stride: 38, threadStartX: 276 },
  mobile: { x: 70, y: 54, width: 220, height: 24, stride: 32, threadStartX: 0 },
} as const;

const DESKTOP_LAYOUT = {
  rawY: 90,
  rawGap: 16,
  lineHeight: 18,
  threadJointX: 290,
  threadEndX: 306,
} as const;

const MOBILE_LAYOUT = {
  rawY: 334,
  rawGap: 10,
  lineHeight: 16,
} as const;

const RAW_TEXT_METRICS = {
  topOffset: 12,
  bottomOffset: 3,
} as const;

const REGIONS: Region[] = [
  {
    label: 'system prompt',
    tone: 'cyan',
    emoji: 'compass',
    desktopLines: [
      { text: '<system_instructions>', tone: 'cyan' },
      { text: 'You are a coding agent; prefer small verified patches.' },
      { text: '</system_instructions>', tone: 'cyan' },
    ],
    mobileLines: [
      { text: '<system_instructions>', tone: 'cyan' },
      { text: 'You are a coding agent...' },
      { text: '</system_instructions>', tone: 'cyan' },
    ],
  },
  {
    label: 'tool schemas',
    tone: 'cyan',
    emoji: 'plug',
    desktopLines: [
      { text: '<tool_definitions>', tone: 'cyan' },
      { text: 'read(path)  edit(path, oldText, newText)  bash(command)' },
      { text: '</tool_definitions>', tone: 'cyan' },
    ],
    mobileLines: [
      { text: '<tool_definitions>', tone: 'cyan' },
      { text: 'read, edit, bash, search...' },
      { text: '</tool_definitions>', tone: 'cyan' },
    ],
  },
  {
    label: 'prev turns',
    tone: 'neutral',
    emoji: 'chat',
    desktopLines: [
      { text: '<previous_conversation_turns>', tone: 'neutral' },
      { text: 'user: inspect the registration flow and find where' },
      { text: 'email validation should happen' },
      { text: '</previous_conversation_turns>', tone: 'neutral' },
    ],
    mobileLines: [
      { text: '<previous_conversation_turns>', tone: 'neutral' },
      { text: 'user: inspect registration flow' },
      { text: 'find validation point' },
      { text: '</previous_conversation_turns>', tone: 'neutral' },
    ],
  },
  {
    label: 'memory',
    tone: 'indigo',
    emoji: 'database',
    desktopLines: [
      { text: '<memory_context>', tone: 'indigo' },
      { text: 'src/routes/register.ts  src/validators/email.ts' },
      { text: '</memory_context>', tone: 'indigo' },
    ],
    mobileLines: [
      { text: '<memory_context>', tone: 'indigo' },
      { text: 'register.ts, email.ts' },
      { text: '</memory_context>', tone: 'indigo' },
    ],
  },
  {
    label: 'tool call',
    tone: 'violet',
    emoji: 'tools',
    desktopLines: [
      { text: '<tool_call>', tone: 'violet' },
      { text: '{', small: true },
      { text: '"name": "read",', indent: 24, small: true },
      { text: '"arguments": { "path": "src/routes/register.ts" }', indent: 24, small: true },
      { text: '}', small: true },
      { text: '</tool_call>', tone: 'violet' },
    ],
    mobileLines: [
      { text: '<tool_call>', tone: 'violet' },
      { text: 'read({ path: "register.ts" })', small: true },
      { text: '</tool_call>', tone: 'violet' },
    ],
  },
  {
    label: 'observation',
    tone: 'indigo',
    emoji: 'receipt',
    desktopLines: [
      { text: '<tool_result tool_call_id="call_read_register">', tone: 'indigo' },
      { text: '{', small: true },
      { text: '"path": "src/routes/register.ts",', indent: 24, small: true },
      { text: '"observation": "email accepted before validation"', indent: 24, small: true },
      { text: '}', small: true },
      { text: '</tool_result>', tone: 'indigo' },
    ],
    mobileLines: [
      { text: '<tool_result>', tone: 'indigo' },
      { text: 'email accepted before validation', small: true },
      { text: '</tool_result>', tone: 'indigo' },
    ],
  },
  {
    label: 'prompt',
    tone: 'neutral',
    emoji: 'operator',
    desktopLines: [
      { text: '<user_request>', tone: 'neutral' },
      { text: 'Update the registration handler to validate email' },
      { text: 'before account creation.' },
      { text: '</user_request>', tone: 'neutral' },
    ],
    mobileLines: [
      { text: '<user_request>', tone: 'neutral' },
      { text: 'validate email' },
      { text: 'before account creation' },
      { text: '</user_request>', tone: 'neutral' },
    ],
  },
];

function sumDesktopRawHeight(region: Region) {
  return region.desktopLines.length * DESKTOP_LAYOUT.lineHeight + DESKTOP_LAYOUT.rawGap;
}

function sumMobileRawHeight(region: Region) {
  return region.mobileLines.length * MOBILE_LAYOUT.lineHeight + MOBILE_LAYOUT.rawGap;
}

function tileLayout(variant: Variant, index: number) {
  const layout = TILE_LAYOUTS[variant];
  return { ...layout, y: layout.y + index * layout.stride };
}

function desktopRawY(index: number) {
  return REGIONS.slice(0, index).reduce((y, region) => y + sumDesktopRawHeight(region), DESKTOP_LAYOUT.rawY);
}

function mobileRawY(index: number) {
  return REGIONS.slice(0, index).reduce((y, region) => y + sumMobileRawHeight(region), MOBILE_LAYOUT.rawY);
}

function layerSlice(region: Region, index: number, variant: Variant = 'desktop'): LayerSlice {
  const tile = tileLayout(variant, index);
  return {
    label: region.label,
    tone: region.tone,
    emoji: region.emoji,
    x: tile.x,
    y: tile.y,
    w: tile.width,
    h: tile.height,
    threadStartX: tile.threadStartX,
    rawY: variant === 'mobile' ? mobileRawY(index) : desktopRawY(index),
    step: index,
  };
}

function rawBlock(region: Region, index: number, variant: Variant = 'desktop'): RawBlock {
  return {
    y: variant === 'mobile' ? mobileRawY(index) : desktopRawY(index),
    tone: region.tone,
    lines: variant === 'mobile' ? region.mobileLines : region.desktopLines,
    step: index,
  };
}

function rawRailBounds(blockY: number, lineCount: number, lineHeight: number) {
  const top = blockY - RAW_TEXT_METRICS.topOffset;
  const bottom = blockY + (lineCount - 1) * lineHeight + RAW_TEXT_METRICS.bottomOffset;
  return { top, bottom, center: (top + bottom) / 2 };
}

function strokeClass(tone: Tone) {
  return styles[`${tone}Stroke`];
}

function tagClass(tone: Tone | undefined) {
  if (!tone) return undefined;
  return styles[`tag${tone[0].toUpperCase()}${tone.slice(1)}`];
}

function stepStyle(step: number): AssemblyStyle {
  return { '--step': step };
}

function ContextRegionTile({ layer }: { layer: LayerSlice }) {
  return (
    <DiagramTile
      variant="label"
      x={layer.x}
      y={layer.y}
      width={layer.w}
      height={layer.h}
      tone={layer.tone}
      title={layer.label}
      icon={EMOJI[layer.emoji]}
      labelAlign="center"
      labelIconSize={18}
      rectClassName={styles.slice}
    />
  );
}

function LayerSurface() {
  return (
    <g aria-hidden="true">
      <text x={189} y={68} textAnchor="middle" className={styles.depthLabel}>context regions</text>
      <g className={styles.assemblerCursor}>
        <g className={styles.assemblerCursorMotion}>
          <g className={styles.assemblerCursorSize}>
            <path d="M 96 88 V 124" />
            <path d="M 96 88 H 102 M 96 124 H 102" />
          </g>
        </g>
      </g>
      {REGIONS.map((region, index) => {
        const layer = layerSlice(region, index);
        const threadEndY = rawRailBounds(layer.rawY, region.desktopLines.length, DESKTOP_LAYOUT.lineHeight).center;
        return (
          <g key={layer.label} className={styles.assemblyLayer} style={stepStyle(layer.step)}>
            <ContextRegionTile layer={layer} />
            <path d={`M ${layer.threadStartX} ${layer.y + layer.h / 2} H ${DESKTOP_LAYOUT.threadJointX} V ${threadEndY} H ${DESKTOP_LAYOUT.threadEndX}`} className={clsx(styles.thread, styles.assemblyThread, strokeClass(layer.tone))} />
          </g>
        );
      })}
    </g>
  );
}

function MobileLayerRail() {
  return (
    <g aria-hidden="true">
      <text x={70} y={40} className={styles.depthLabel}>context regions</text>
      <g className={clsx(styles.assemblerCursor, styles.mobileAssemblerCursor)}>
        <g className={styles.mobileAssemblerCursorMotion}>
          <path d="M 62 52 V 80" />
          <path d="M 62 52 H 68 M 62 80 H 68" />
        </g>
      </g>
      {REGIONS.map((region, index) => <MobileLayerRow key={region.label} layer={layerSlice(region, index, 'mobile')} />)}
    </g>
  );
}

function MobileLayerRow({ layer }: { layer: LayerSlice }) {
  return (
    <g className={styles.assemblyLayer} style={stepStyle(layer.step)}>
      <ContextRegionTile layer={layer} />
    </g>
  );
}

function RawBlockView({ block }: { block: RawBlock }) {
  return <RawTextBlock block={block} x={330} railX={314} lineHeight={DESKTOP_LAYOUT.lineHeight} />;
}

function MobileRawBlockView({ block }: { block: RawBlock }) {
  return <RawTextBlock block={block} x={56} railX={42} lineHeight={MOBILE_LAYOUT.lineHeight} mobile />;
}

function RawTextBlock({ block, x, railX, lineHeight, mobile = false }: { block: RawBlock; x: number; railX: number; lineHeight: number; mobile?: boolean }) {
  const rail = rawRailBounds(block.y, block.lines.length, lineHeight);
  return (
    <g className={styles.rawBlock} style={stepStyle(block.step)}>
      <path d={`M ${railX} ${rail.top} V ${rail.bottom}`} className={clsx(styles.rawRail, strokeClass(block.tone))} />
      {block.lines.map((line, index) => <RawLineText key={`${block.y}-${line.text}`} line={line} x={x} y={block.y + index * lineHeight} mobile={mobile} />)}
    </g>
  );
}

function RawLineText({ line, x, y, mobile }: { line: RawLine; x: number; y: number; mobile: boolean }) {
  const indent = line.indent ?? (line.tone ? 0 : 12);
  return (
    <text x={x + indent} y={y} className={clsx(styles.rawText, mobile && styles.rawTextMobile, line.small && styles.rawTextSmall, tagClass(line.tone))}>{line.text}</text>
  );
}

function DesktopDiagram() {
  return (
    <svg viewBox="0 0 900 740" width="100%" role="img" aria-label="A context window cutaway where ordered layers are exposed as raw serialized request text." className={clsx(styles.diagram, styles.desktopDiagram)} xmlns="http://www.w3.org/2000/svg">
      <rect x={54} y={24} width={792} height={701} className={styles.window} />
      <LayerSurface />
      <text x={576} y={68} textAnchor="middle" className={styles.depthLabel}>serialized request</text>
      {REGIONS.map((region, index) => <RawBlockView key={region.label} block={rawBlock(region, index)} />)}
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg viewBox="0 0 360 804" width="100%" role="img" aria-label="A mobile context window cutaway where context regions serialize into raw request text." className={clsx(styles.diagram, styles.mobileDiagram)} xmlns="http://www.w3.org/2000/svg">
      <rect x={24} y={24} width={312} height={760} className={styles.window} />
      <MobileLayerRail />
      <text x={48} y={306} className={styles.depthLabel}>serialized request</text>
      <g className={clsx(styles.assemblerCursor, styles.mobileRawCursor)} aria-hidden="true">
        <g className={styles.mobileRawCursorMotion}>
          <g className={styles.mobileRawCursorSize}>
            <path d="M 34 320 V 371" />
            <path d="M 34 320 H 40 M 34 371 H 40" />
          </g>
        </g>
      </g>
      {REGIONS.map((region, index) => <MobileRawBlockView key={region.label} block={rawBlock(region, index, 'mobile')} />)}
    </svg>
  );
}

export default function LivingContextWindowStream() {
  return (
    <div className={styles.container}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}
