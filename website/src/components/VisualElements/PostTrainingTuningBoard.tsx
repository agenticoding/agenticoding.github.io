import React from 'react';
import { EmojiImage } from './ActorNodes';
import { EMOJI } from './emojiAssets';
import styles from './PostTrainingTuningBoard.module.css';

const VW = 640;
const VH = 384;
const MOBILE_VW = 360;
const MOBILE_VH = 660;

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

function semanticVar(color: string, kind: 'fg' | 'bg' = 'fg') {
  return `var(--visual${kind === 'bg' ? '-bg' : ''}-${color})`;
}

function CardTitle({
  x,
  y,
  title,
  subtitle,
}: {
  x: number;
  y: number;
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <text
        x={x}
        y={y}
        fontFamily="var(--font-mono-ai)"
        fontSize="12"
        fontWeight="700"
        fill="var(--text-heading)"
      >
        {title}
      </text>
      <text
        x={x}
        y={y + 16}
        fontFamily="var(--font-mono-spec)"
        fontSize="10"
        fill="var(--text-muted)"
      >
        {subtitle}
      </text>
    </>
  );
}

function BaseModelCard() {
  return (
    <g>
      <rect
        x="16"
        y="112"
        width="160"
        height="160"
        rx={0}
        fill="var(--visual-bg-indigo)"
        stroke="var(--visual-indigo)"
      />
      <text
        x="96"
        y="144"
        textAnchor="middle"
        fontFamily="var(--font-mono-ai)"
        fontSize="12"
        fontWeight="700"
        fill="var(--text-heading)"
      >
        base model
      </text>
      <text
        x="96"
        y="160"
        textAnchor="middle"
        fontFamily="var(--font-mono-spec)"
        fontSize="10"
        fill="var(--text-muted)"
      >
        broad patterns
      </text>
      <EmojiImage asset={EMOJI.gear} x={72} y={176} size={48} />
      <text
        x="96"
        y="248"
        textAnchor="middle"
        fontFamily="var(--font-mono-spec)"
        fontSize="10"
        fill="var(--visual-indigo)"
      >
        raw continuation
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
  color: string;
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
        fontFamily="var(--font-mono-keyword)"
        fontSize="9"
        fill="var(--text-body)"
      >
        {label}
      </text>
      <text
        x="400"
        y={y}
        textAnchor="end"
        fontFamily="var(--font-mono-spec)"
        fontSize="9"
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
      <rect
        x="216"
        y="40"
        width="208"
        height="320"
        rx={0}
        fill="var(--visual-bg-violet)"
        stroke="var(--visual-violet)"
      />
      <CardTitle
        x={240}
        y={72}
        title="post-training"
        subtitle="behavior tuning board"
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
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={0}
        fill={semanticVar(color, 'bg')}
        stroke={semanticVar(color)}
        className={styles.storyBadge}
      />
      {BADGE_EFFECTS[label as BadgeLabel].map((effectClass) => (
        <rect
          key={effectClass}
          x={x}
          y={y}
          width={width}
          height={height}
          rx={0}
          fill={semanticVar(color, 'bg')}
          stroke={semanticVar(color)}
          className={`${styles.storyEffect} ${effectClass}`}
        />
      ))}
      <text
        x={x + width / 2}
        y={y + height / 2 + fontSize / 2}
        textAnchor="middle"
        fontFamily="var(--font-mono-spec)"
        fontSize={fontSize}
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
      <rect
        x="456"
        y="72"
        width="160"
        height="240"
        rx={0}
        fill="var(--surface-raised)"
        stroke="var(--border-subtle)"
      />
      <text
        x="536"
        y="104"
        textAnchor="middle"
        fontFamily="var(--font-mono-ai)"
        fontSize="12"
        fontWeight="700"
        fill="var(--text-heading)"
      >
        product profile
      </text>
      <text
        x="536"
        y="120"
        textAnchor="middle"
        fontFamily="var(--font-mono-spec)"
        fontSize="10"
        fill="var(--text-muted)"
      >
        shaped behavior
      </text>
      <EmojiImage asset={EMOJI.agent} x={516} y={136} size={40} />
      {BADGES.map((badge, i) => (
        <BadgePill key={badge.label} {...badge} x={480} y={184 + i * 32} />
      ))}
    </g>
  );
}

function Connector({ d, markerId }: { d: string; markerId: string }) {
  return (
    <path
      d={d}
      fill="none"
      stroke="var(--visual-violet)"
      strokeWidth="2"
      strokeLinecap="butt"
      markerEnd={`url(#${markerId})`}
    />
  );
}

function ArrowMarker({ id }: { id: string }) {
  return (
    <marker
      id={id}
      markerWidth="6"
      markerHeight="6"
      refX="6"
      refY="3"
      orient="auto"
    >
      <polygon points="0 0, 6 3, 0 6" fill="var(--visual-violet)" />
    </marker>
  );
}

function MobileBaseCard() {
  return (
    <g>
      <rect
        x="32"
        y="52"
        width="296"
        height="88"
        rx={0}
        fill="var(--visual-bg-indigo)"
        stroke="var(--visual-indigo)"
      />
      <EmojiImage asset={EMOJI.gear} x={58} y={76} size={36} />
      <text
        x="112"
        y="90"
        fontFamily="var(--font-mono-ai)"
        fontSize="12"
        fontWeight="700"
        fill="var(--text-heading)"
      >
        base model
      </text>
      <text
        x="112"
        y="108"
        fontFamily="var(--font-mono-spec)"
        fontSize="10"
        fill="var(--text-muted)"
      >
        broad patterns, raw continuation
      </text>
    </g>
  );
}

function MobileLeverRow({ slider, y }: { slider: Slider; y: number }) {
  const story = SLIDER_STORIES[slider.label as SliderLabel];

  return (
    <g>
      <rect
        x="32"
        y={y}
        width="296"
        height="36"
        rx={0}
        fill="var(--surface-raised)"
        stroke="var(--border-subtle)"
      />
      <text
        x="48"
        y={y + 13}
        fontFamily="var(--font-mono-keyword)"
        fontSize="9"
        fill="var(--text-body)"
      >
        {slider.label}
      </text>
      <text
        x="308"
        y={y + 13}
        textAnchor="end"
        fontFamily="var(--font-mono-spec)"
        fontSize="9"
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
      <rect
        x="20"
        y="164"
        width="320"
        height="316"
        rx={0}
        fill="var(--visual-bg-violet)"
        stroke="var(--visual-violet)"
      />
      <CardTitle
        x={44}
        y={192}
        title="post-training"
        subtitle="behavior tuning board"
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
      <rect
        x="32"
        y="500"
        width="296"
        height="146"
        rx={0}
        fill="var(--surface-raised)"
        stroke="var(--border-subtle)"
      />
      <EmojiImage asset={EMOJI.agent} x={52} y={520} size={30} />
      <text
        x="96"
        y="530"
        fontFamily="var(--font-mono-ai)"
        fontSize="12"
        fontWeight="700"
        fill="var(--text-heading)"
      >
        product profile
      </text>
      <text
        x="96"
        y="548"
        fontFamily="var(--font-mono-spec)"
        fontSize="10"
        fill="var(--text-muted)"
      >
        shaped behavior
      </text>
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
  const markerId = 'post-training-arrow-desktop';
  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      role="img"
      aria-label="Post-training tunes a base model into shaped product behavior"
      className={`${styles.diagram} ${styles.desktopDiagram}`}
    >
      <defs>
        <ArrowMarker id={markerId} />
      </defs>
      <text
        x="320"
        y="24"
        textAnchor="middle"
        fontFamily="var(--font-mono-ai)"
        fontSize="12"
        fontWeight="700"
        fill="var(--visual-violet)"
      >
        base model → post-training → product behavior
      </text>
      <Connector
        markerId={markerId}
        d="M 176 192 C 184 192, 200 192, 216 192"
      />
      <Connector
        markerId={markerId}
        d="M 424 192 C 432 192, 448 192, 456 192"
      />
      <BaseModelCard />
      <TuningBoard />
      <ProductProfileCard />
    </svg>
  );
}

function MobileBoard() {
  const markerId = 'post-training-arrow-mobile';
  return (
    <svg
      viewBox={`0 0 ${MOBILE_VW} ${MOBILE_VH}`}
      width="100%"
      role="img"
      aria-label="Vertical post-training story: base model, tuning levers, and resulting product profile"
      className={`${styles.diagram} ${styles.mobileDiagram}`}
    >
      <defs>
        <ArrowMarker id={markerId} />
      </defs>
      <text
        x="180"
        y="32"
        textAnchor="middle"
        fontFamily="var(--font-mono-ai)"
        fontSize="12"
        fontWeight="700"
        fill="var(--visual-violet)"
      >
        base model → post-training → behavior
      </text>
      <Connector
        markerId={markerId}
        d="M 180 140 C 180 150, 180 154, 180 164"
      />
      <Connector
        markerId={markerId}
        d="M 180 480 C 180 490, 180 492, 180 500"
      />
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
