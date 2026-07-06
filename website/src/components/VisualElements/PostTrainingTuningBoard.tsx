import React from 'react';
import { EmojiImage } from './ActorNodes';
import { EMOJI } from './emojiAssets';
import { DiagramArrow, DiagramArrowMarkers } from './DiagramArrow';
import { DiagramTileSurface } from './DiagramTile';
import { tileToneVars, voiceStyle, type DiagramTone } from './diagramTileLayout';
import styles from './PostTrainingTuningBoard.module.css';

const VW = 640;
const VH = 384;
const MOBILE_VW = 360;
const MOBILE_VH = 660;
const CONNECTOR_TARGET_GAP = 8;

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function coord(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function horizontalConnector(from: Box, to: Box) {
  const startX = from.x + from.width;
  const endX = to.x - CONNECTOR_TARGET_GAP;
  const y = from.y + from.height / 2;
  const controlOffset = Math.max(8, (endX - startX) / 3);
  return `M ${coord(startX)} ${coord(y)} C ${coord(startX + controlOffset)} ${coord(y)}, ${coord(endX - controlOffset)} ${coord(y)}, ${coord(endX)} ${coord(y)}`;
}

function verticalConnector(from: Box, to: Box) {
  const startY = from.y + from.height;
  const endY = to.y - CONNECTOR_TARGET_GAP;
  const x = from.x + from.width / 2;
  const controlOffset = Math.max(6, (endY - startY) / 3);
  return `M ${coord(x)} ${coord(startY)} C ${coord(x)} ${coord(startY + controlOffset)}, ${coord(x)} ${coord(endY - controlOffset)}, ${coord(x)} ${coord(endY)}`;
}

const SLIDERS = [
  {
    label: 'instruction following',
    stage: 'SFT',
    color: 'magenta',
    value: 0.78,
    badge: 'answers tasks',
  },
  {
    label: 'helpfulness',
    stage: 'preference',
    color: 'violet',
    value: 0.66,
    badge: 'answers tasks',
  },
  {
    label: 'safety + refusal',
    stage: 'policy',
    color: 'warning',
    value: 0.58,
    badge: 'refuses unsafe',
  },
  {
    label: 'checked reasoning',
    stage: 'rewards',
    color: 'success',
    value: 0.72,
    badge: 'uses tools',
  },
  {
    label: 'tool use',
    stage: 'traces',
    color: 'cyan',
    value: 0.61,
    badge: 'uses tools',
  },
  {
    label: 'domain fit',
    stage: 'domain data',
    color: 'indigo',
    value: 0.69,
    badge: 'fits domain',
  },
] as const;

const BADGES = [
  { label: 'answers tasks', color: 'magenta' },
  { label: 'refuses unsafe', color: 'warning' },
  { label: 'uses tools', color: 'cyan' },
  { label: 'fits domain', color: 'indigo' },
] as const;

const CARD_COPY = {
  base: {
    title: 'base model',
    desktopSubtitle: 'broad patterns',
    mobileSubtitle: 'broad patterns, raw continuation',
    detail: 'raw continuation',
  },
  tuning: {
    title: 'post-training',
    subtitle: 'behavior tuning board',
  },
  profile: {
    title: 'product profile',
    subtitle: 'shaped behavior',
  },
} as const;

const FLOW_LABELS = {
  desktop: `${CARD_COPY.base.title} → ${CARD_COPY.tuning.title} → product behavior`,
  mobile: `${CARD_COPY.base.title} → ${CARD_COPY.tuning.title} → behavior`,
} as const;

const DESKTOP_BOXES = {
  base: { x: 16, y: 112, width: 160, height: 160 },
  tuning: { x: 216, y: 40, width: 208, height: 320 },
  profile: { x: 456, y: 72, width: 160, height: 240 },
} as const;

const MOBILE_BOXES = {
  base: { x: 32, y: 52, width: 296, height: 88 },
  tuning: { x: 20, y: 164, width: 320, height: 316 },
  profile: { x: 32, y: 500, width: 296, height: 146 },
} as const;

const DESKTOP_CONNECTORS = [
  horizontalConnector(DESKTOP_BOXES.base, DESKTOP_BOXES.tuning),
  horizontalConnector(DESKTOP_BOXES.tuning, DESKTOP_BOXES.profile),
] as const;

const MOBILE_CONNECTORS = [
  verticalConnector(MOBILE_BOXES.base, MOBILE_BOXES.tuning),
  verticalConnector(MOBILE_BOXES.tuning, MOBILE_BOXES.profile),
] as const;

const SLIDER_STORIES = {
  'instruction following': {
    boost: 8,
    knobClass: styles.instructionKnob,
    trackClass: styles.instructionTrack,
  },
  helpfulness: {
    boost: 16,
    knobClass: styles.helpfulnessKnob,
    trackClass: styles.helpfulnessTrack,
  },
  'safety + refusal': {
    boost: 8,
    knobClass: styles.safetyKnob,
    trackClass: styles.safetyTrack,
  },
  'checked reasoning': {
    boost: 8,
    knobClass: styles.reasoningKnob,
    trackClass: styles.reasoningTrack,
  },
  'tool use': {
    boost: 16,
    knobClass: styles.toolKnob,
    trackClass: styles.toolTrack,
  },
  'domain fit': {
    boost: 16,
    knobClass: styles.domainKnob,
    trackClass: styles.domainTrack,
  },
} as const;

const BADGE_EFFECTS = {
  'answers tasks': [styles.instructionEffect, styles.helpfulnessEffect],
  'refuses unsafe': [styles.safetyEffect],
  'uses tools': [styles.toolEffect, styles.reasoningEffect],
  'fits domain': [styles.domainEffect, styles.reasoningEffect],
} as const;

type Slider = (typeof SLIDERS)[number];
type Badge = (typeof BADGES)[number];
type SliderLabel = Slider['label'];
type BadgeLabel = Badge['label'];

function semanticVar(color: DiagramTone, kind: 'fg' | 'bg' = 'fg') {
  const tone = tileToneVars(color);
  return kind === 'bg' ? tone.fill : tone.accent;
}

function CardTitle({
  x,
  y,
  title,
  subtitle,
  textAnchor,
}: {
  x: number;
  y: number;
  title: string;
  subtitle: string;
  textAnchor?: 'start' | 'middle' | 'end';
}) {
  const anchorProps = textAnchor ? { textAnchor } : {};

  return (
    <>
      <text
        x={x}
        y={y}
        style={voiceStyle('ai', 12, 700)}
        fill="var(--text-heading)"
        {...anchorProps}
      >
        {title}
      </text>
      <text
        x={x}
        y={y + 16}
        style={voiceStyle('spec', 10, 400)}
        fill="var(--text-muted)"
        {...anchorProps}
      >
        {subtitle}
      </text>
    </>
  );
}

function FlowLabel({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      style={voiceStyle('ai', 12, 700)}
      fill="var(--visual-violet)"
    >
      {label}
    </text>
  );
}

function BaseModelCard() {
  return (
    <g>
      <DiagramTileSurface {...DESKTOP_BOXES.base} tone="neutral" />
      <CardTitle
        x={96}
        y={144}
        title={CARD_COPY.base.title}
        subtitle={CARD_COPY.base.desktopSubtitle}
        textAnchor="middle"
      />
      <EmojiImage asset={EMOJI.gear} x={72} y={176} size={48} />
      <text
        x="96"
        y="248"
        textAnchor="middle"
        style={voiceStyle('spec', 10, 400)}
        fill="var(--visual-indigo)"
      >
        {CARD_COPY.base.detail}
      </text>
    </g>
  );
}

function storyStyle(boost: number) {
  return { '--story-boost-x': `${boost}px` } as React.CSSProperties;
}

function sliderKnobX(x: number, width: number, value: number) {
  return x + Math.round(value * 15) * (width / 15);
}

function SliderTrack({
  x,
  y,
  width,
  value,
  color,
  boost,
  knobRadius,
  story,
}: {
  x: number;
  y: number;
  width: number;
  value: number;
  color: DiagramTone;
  boost: number;
  knobRadius: number;
  story: (typeof SLIDER_STORIES)[SliderLabel];
}) {
  const knobX = sliderKnobX(x, width, value);
  const boostedKnobX = Math.min(x + width, knobX + boost);

  return (
    <>
      <line
        x1={x}
        y1={y}
        x2={x + width}
        y2={y}
        stroke="var(--border-subtle)"
        strokeWidth="4"
        strokeLinecap="butt"
      />
      <line
        x1={x}
        y1={y}
        x2={knobX}
        y2={y}
        stroke={semanticVar(color)}
        strokeWidth="4"
        strokeLinecap="butt"
      />
      <line
        x1={knobX}
        y1={y}
        x2={boostedKnobX}
        y2={y}
        stroke={semanticVar(color)}
        strokeWidth="4"
        strokeLinecap="butt"
        className={`${styles.storyTrack} ${story.trackClass}`}
      />
      <rect
        x={knobX - knobRadius}
        y={y - knobRadius}
        width={knobRadius * 2}
        height={knobRadius * 2}
        rx={0}
        fill={semanticVar(color, 'bg')}
        stroke={semanticVar(color)}
        className={`${styles.storyKnob} ${story.knobClass}`}
        style={storyStyle(boost)}
      />
    </>
  );
}

function SliderRow({ label, stage, color, value, y }: Slider & { y: number }) {
  const story = SLIDER_STORIES[label as SliderLabel];

  return (
    <g>
      <text
        x="240"
        y={y}
        style={voiceStyle('keyword', 9, 400)}
        fill="var(--text-body)"
      >
        {label}
      </text>
      <text
        x="400"
        y={y}
        textAnchor="end"
        style={voiceStyle('spec', 9, 400)}
        fill={semanticVar(color)}
      >
        {stage}
      </text>
      <SliderTrack
        x={240}
        y={y + 16}
        width={120}
        value={value}
        color={color}
        boost={story.boost}
        knobRadius={8}
        story={story}
      />
    </g>
  );
}

function TuningBoard() {
  return (
    <g>
      <DiagramTileSurface {...DESKTOP_BOXES.tuning} tone="model" />
      <CardTitle
        x={240}
        y={72}
        title={CARD_COPY.tuning.title}
        subtitle={CARD_COPY.tuning.subtitle}
      />
      {SLIDERS.map((slider, i) => (
        <SliderRow key={slider.label} {...slider} y={112 + i * 40} />
      ))}
    </g>
  );
}

function BadgePill({
  label,
  color,
  x,
  y,
  width = 112,
  height = 24,
  fontSize = 9,
}: Badge & {
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
}) {
  return (
    <g>
      <DiagramTileSurface x={x} y={y} width={width} height={height} tone={color} className={styles.storyBadge} />
      {BADGE_EFFECTS[label as BadgeLabel].map((effectClass) => (
        <DiagramTileSurface key={effectClass} x={x} y={y} width={width} height={height} tone={color} className={`${styles.storyEffect} ${effectClass}`} />
      ))}
      <text
        x={x + width / 2}
        y={y + height / 2 + fontSize / 2}
        textAnchor="middle"
        style={voiceStyle('spec', fontSize, 400)}
        fill={semanticVar(color)}
      >
        {label}
      </text>
    </g>
  );
}

function ProductProfileCard() {
  return (
    <g>
      <DiagramTileSurface {...DESKTOP_BOXES.profile} tone="neutral" />
      <CardTitle
        x={536}
        y={104}
        title={CARD_COPY.profile.title}
        subtitle={CARD_COPY.profile.subtitle}
        textAnchor="middle"
      />
      <EmojiImage asset={EMOJI.agent} x={516} y={136} size={40} />
      {BADGES.map((badge, i) => (
        <BadgePill key={badge.label} {...badge} x={480} y={184 + i * 32} />
      ))}
    </g>
  );
}

function Connector({ d, markerIdPrefix }: { d: string; markerIdPrefix: string }) {
  return <DiagramArrow d={d} markerIdPrefix={markerIdPrefix} tone="model" />;
}

function Connectors({
  paths,
  markerIdPrefix,
}: {
  paths: readonly string[];
  markerIdPrefix: string;
}) {
  return (
    <>
      {paths.map((d) => (
        <Connector key={d} markerIdPrefix={markerIdPrefix} d={d} />
      ))}
    </>
  );
}

function MobileBaseCard() {
  return (
    <g>
      <DiagramTileSurface {...MOBILE_BOXES.base} tone="neutral" />
      <EmojiImage asset={EMOJI.gear} x={58} y={76} size={36} />
      <CardTitle
        x={112}
        y={90}
        title={CARD_COPY.base.title}
        subtitle={CARD_COPY.base.mobileSubtitle}
      />
    </g>
  );
}

function MobileLeverRow({ slider, y }: { slider: Slider; y: number }) {
  const story = SLIDER_STORIES[slider.label as SliderLabel];

  return (
    <g>
      <DiagramTileSurface x={32} y={y} width={296} height={36} tone="neutral" stroke="var(--border-subtle)" />
      <text
        x="48"
        y={y + 13}
        style={voiceStyle('keyword', 9, 400)}
        fill="var(--text-body)"
      >
        {slider.label}
      </text>
      <text
        x="308"
        y={y + 13}
        textAnchor="end"
        style={voiceStyle('spec', 9, 400)}
        fill={semanticVar(slider.color)}
      >
        {slider.stage}
      </text>
      <SliderTrack
        x={48}
        y={y + 26}
        width={260}
        value={slider.value}
        color={slider.color}
        boost={8}
        knobRadius={6}
        story={story}
      />
    </g>
  );
}

function MobileTuningStack() {
  return (
    <g>
      <DiagramTileSurface {...MOBILE_BOXES.tuning} tone="model" />
      <CardTitle
        x={44}
        y={192}
        title={CARD_COPY.tuning.title}
        subtitle={CARD_COPY.tuning.subtitle}
      />
      {SLIDERS.map((slider, i) => (
        <MobileLeverRow key={slider.label} slider={slider} y={216 + i * 42} />
      ))}
    </g>
  );
}

function MobileProfileCard() {
  return (
    <g>
      <DiagramTileSurface {...MOBILE_BOXES.profile} tone="neutral" />
      <EmojiImage asset={EMOJI.agent} x={52} y={520} size={30} />
      <CardTitle
        x={96}
        y={530}
        title={CARD_COPY.profile.title}
        subtitle={CARD_COPY.profile.subtitle}
      />
      {BADGES.map((badge, i) => (
        <BadgePill
          key={badge.label}
          {...badge}
          x={52 + (i % 2) * 144}
          y={566 + Math.floor(i / 2) * 36}
          width={112}
          fontSize={9}
        />
      ))}
    </g>
  );
}

function DesktopBoard() {
  const markerIdPrefix = 'post-training-desktop';
  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      role="img"
      aria-label="Post-training tunes a base model into shaped product behavior"
      className={`${styles.diagram} ${styles.desktopDiagram}`}
    >
      <DiagramArrowMarkers prefix={markerIdPrefix} tones={['model']} />
      <FlowLabel x={320} y={24} label={FLOW_LABELS.desktop} />
      <Connectors paths={DESKTOP_CONNECTORS} markerIdPrefix={markerIdPrefix} />
      <BaseModelCard />
      <TuningBoard />
      <ProductProfileCard />
    </svg>
  );
}

function MobileBoard() {
  const markerIdPrefix = 'post-training-mobile';
  return (
    <svg
      viewBox={`0 0 ${MOBILE_VW} ${MOBILE_VH}`}
      width="100%"
      role="img"
      aria-label="Vertical post-training story: base model, tuning levers, and resulting product profile"
      className={`${styles.diagram} ${styles.mobileDiagram}`}
    >
      <DiagramArrowMarkers prefix={markerIdPrefix} tones={['model']} />
      <FlowLabel x={180} y={32} label={FLOW_LABELS.mobile} />
      <Connectors paths={MOBILE_CONNECTORS} markerIdPrefix={markerIdPrefix} />
      <MobileBaseCard />
      <MobileTuningStack />
      <MobileProfileCard />
    </svg>
  );
}

export default function PostTrainingTuningBoard() {
  return (
    <div className={styles.container}>
      <DesktopBoard />
      <MobileBoard />
    </div>
  );
}
