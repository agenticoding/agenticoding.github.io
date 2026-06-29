import React from 'react';
import clsx from 'clsx';
import styles from './LivingContextWindowStream.module.css';
import { EmojiImage } from './ActorNodes';
import { EMOJI } from './emojiAssets';

type Tone = 'cyan' | 'indigo' | 'neutral' | 'violet';
type AssemblyStyle = React.CSSProperties & { '--step': number };
type Variant = 'desktop' | 'mobile';
type LayerSlice = { label: string; tone: Tone; emoji: keyof typeof EMOJI; x: number; y: number; w: number; h: number; emojiX: number; textX: number; threadStartX: number; rawY: number; step: number };
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
  desktop: { x: 104, y: 142, width: 170, height: 32, stride: 38, emojiX: 112, textX: 138, threadStartX: 276 },
  mobile: { x: 70, y: 96, width: 220, height: 24, stride: 32, emojiX: 80, textX: 106, threadStartX: 0 },
} as const;

const DESKTOP_LAYOUT = {
  rawY: 142,
  rawGap: 16,
  lineHeight: 18,
  threadJointX: 290,
  threadEndX: 306,
} as const;

const MOBILE_LAYOUT = {
  rawY: 376,
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
    emojiX: tile.emojiX,
    textX: tile.textX,
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

function toneClass(tone: Tone) {
  return styles[tone];
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

function LayerSurface() {
  return (
    <g aria-hidden="true">
      <text x={189} y={120} textAnchor="middle" className={styles.depthLabel}>context regions</text>
      <g className={styles.assemblerCursor}>
        <g className={styles.assemblerCursorMotion}>
          <g className={styles.assemblerCursorSize}>
            <path d="M 96 140 V 176" />
            <path d="M 96 140 H 102 M 96 176 H 102" />
          </g>
        </g>
      </g>
      {REGIONS.map((region, index) => {
        const layer = layerSlice(region, index);
        return (
          <g key={layer.label} className={styles.assemblyLayer} style={stepStyle(layer.step)}>
            <rect x={layer.x} y={layer.y} width={layer.w} height={layer.h} className={clsx(styles.slice, toneClass(layer.tone))} />
            <EmojiImage asset={EMOJI[layer.emoji]} x={layer.emojiX} y={layer.y + (layer.h - 18) / 2} size={18} />
            <text x={layer.textX} y={layer.y + layer.h / 2} className={styles.sliceText}>{layer.label}</text>
            <path d={`M ${layer.threadStartX} ${layer.y + layer.h / 2} H ${DESKTOP_LAYOUT.threadJointX} V ${layer.rawY - RAW_TEXT_METRICS.topOffset} H ${DESKTOP_LAYOUT.threadEndX}`} className={clsx(styles.thread, styles.assemblyThread, strokeClass(layer.tone))} />
          </g>
        );
      })}
    </g>
  );
}

function MobileLayerRail() {
  return (
    <g aria-hidden="true">
      <text x={70} y={82} className={styles.depthLabel}>context regions</text>
      <g className={clsx(styles.assemblerCursor, styles.mobileAssemblerCursor)}>
        <g className={styles.mobileAssemblerCursorMotion}>
          <path d="M 58 94 V 122" />
          <path d="M 58 94 H 64 M 58 122 H 64" />
        </g>
      </g>
      {REGIONS.map((region, index) => <MobileLayerRow key={region.label} layer={layerSlice(region, index, 'mobile')} />)}
    </g>
  );
}

function MobileLayerRow({ layer }: { layer: LayerSlice }) {
  return (
    <g className={styles.assemblyLayer} style={stepStyle(layer.step)}>
      <rect x={layer.x} y={layer.y} width={layer.w} height={layer.h} className={clsx(styles.slice, toneClass(layer.tone))} />
      <EmojiImage asset={EMOJI[layer.emoji]} x={layer.emojiX} y={layer.y + (layer.h - 18) / 2} size={18} />
      <text x={layer.textX} y={layer.y + layer.h / 2} className={styles.sliceText}>{layer.label}</text>
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
  const railTop = block.y - RAW_TEXT_METRICS.topOffset;
  const railBottom = block.y + (block.lines.length - 1) * lineHeight + RAW_TEXT_METRICS.bottomOffset;
  return (
    <g className={styles.rawBlock} style={stepStyle(block.step)}>
      <path d={`M ${railX} ${railTop} V ${railBottom}`} className={clsx(styles.rawRail, strokeClass(block.tone))} />
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
    <svg viewBox="0 0 900 830" width="100%" height="auto" role="img" aria-label="A context window cutaway where ordered layers are exposed as raw serialized request text." className={clsx(styles.diagram, styles.desktopDiagram)} xmlns="http://www.w3.org/2000/svg">
      <text x={450} y={28} textAnchor="middle" className={styles.title}>context regions become raw request</text>
      <text x={450} y={48} textAnchor="middle" className={styles.note}>the harness selects context; the model receives serialized text and payloads</text>
      <rect x={54} y={76} width={792} height={701} className={styles.window} />
      <LayerSurface />
      <text x={576} y={120} textAnchor="middle" className={styles.depthLabel}>serialized request</text>
      {REGIONS.map((region, index) => <RawBlockView key={region.label} block={rawBlock(region, index)} />)}
      <text x={450} y={810} textAnchor="middle" className={styles.note}>each turn: the harness walks regions and serializes the next model request</text>
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg viewBox="0 0 360 892" width="100%" height="auto" role="img" aria-label="A mobile context window cutaway where context regions serialize into raw request text." className={clsx(styles.diagram, styles.mobileDiagram)} xmlns="http://www.w3.org/2000/svg">
      <text x={180} y={24} textAnchor="middle" className={styles.title}>context regions become</text>
      <text x={180} y={46} textAnchor="middle" className={styles.title}>raw request</text>
      <text x={180} y={64} textAnchor="middle" className={styles.note}>harness walks regions into requests</text>
      <rect x={24} y={66} width={312} height={760} className={styles.window} />
      <MobileLayerRail />
      <text x={48} y={348} className={styles.depthLabel}>serialized request</text>
      <g className={clsx(styles.assemblerCursor, styles.mobileRawCursor)} aria-hidden="true">
        <path d="M 30 366 V 414" />
        <path d="M 30 366 H 36 M 30 414 H 36" />
      </g>
      {REGIONS.map((region, index) => <MobileRawBlockView key={region.label} block={rawBlock(region, index, 'mobile')} />)}
      <text x={180} y={864} textAnchor="middle" className={styles.note}>active row and raw block advance together</text>
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
