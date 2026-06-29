import React from 'react';
import { EmojiImage } from './ActorNodes';
import { GearNode } from './GearNode';
import { TokenStream, type TokenStreamToken } from './TokenStream';
import {
  EMOJI,
  type EmojiAsset,
  emojiDisplaySize,
  centeredEmojiOffset,
} from './emojiAssets';
import styles from './ArchitectureToolShapeTable.module.css';


type Tone = 'neutral' | 'violet' | 'indigo' | 'warning' | 'magenta' | 'cyan';

type Row = {
  choice: string;
  change: string;
  implication: string;
  tone: Tone;
  icon: 'dense' | 'moe' | 'attention' | 'context' | 'modalities' | 'serving';
  step: string;
  mobileStep: string;
};

const ROWS: Row[] = [
  {
    choice: 'Dense model',
    step: 'mechanism',
    mobileStep: 'mechanism',
    icon: 'dense',
    tone: 'neutral',
    change: 'activates the same full network for each token',
    implication:
      'predictable latency and simpler serving; cost rises directly with model size',
  },
  {
    choice: 'Mixture-of-Experts (MoE)',
    step: 'routing',
    mobileStep: 'routing',
    icon: 'moe',
    tone: 'violet',
    change: 'routes tokens through selected expert subnetworks',
    implication:
      'more capability per inference dollar; domain quality varies — evaluate on your actual workload, not aggregate benchmarks',
  },
  {
    choice: 'Attention design',
    step: 'visibility',
    mobileStep: 'visible',
    icon: 'attention',
    tone: 'indigo',
    change:
      'controls which tokens can see each other and how expensive context becomes',
    implication:
      'long context is an operating envelope, not guaranteed recall; test attention under your real load',
  },
  {
    choice: 'Context window size',
    step: 'capacity',
    mobileStep: 'capacity',
    icon: 'context',
    tone: 'warning',
    change: 'sets maximum input/output token capacity',
    implication:
      'larger windows help whole-artifact work but increase cost, latency, and irrelevant-token distraction',
  },
  {
    choice: 'Modality pathways',
    step: 'input channels',
    mobileStep: 'inputs',
    icon: 'modalities',
    tone: 'magenta',
    change: 'encode text, images, audio, and video through different pathways',
    implication:
      'choose for the actual workload: OCR, UI layout, charts, voice, video, or cross-modal reasoning',
  },
  {
    choice: 'Serving stack',
    step: 'production runtime',
    mobileStep: 'runtime',
    icon: 'serving',
    tone: 'cyan',
    change:
      'determines runtime, caching, batching, KV-cache behavior, streaming, and placement',
    implication:
      'model quality is irrelevant if the loop misses latency, throughput, cost, or deployment constraints',
  },
];

const MODALITY_STREAM_PATTERN = [
  { modality: 'text' },
  { modality: 'image', signal: 'compressed' },
  { modality: 'audio' },
  { modality: 'text', signal: 'salient' },
  { modality: 'video', signal: 'compressed' },
] as const satisfies readonly TokenStreamToken[];

const MODALITY_STREAM_TOKENS = [
  ...MODALITY_STREAM_PATTERN,
  ...MODALITY_STREAM_PATTERN,
  ...MODALITY_STREAM_PATTERN,
] as const satisfies readonly TokenStreamToken[];

function toneVar(tone: Tone, kind: 'fg' | 'bg') {
  return `var(--visual${kind === 'bg' ? '-bg' : ''}-${tone})`;
}

function SingleIcon({
  asset,
  className,
  style,
}: {
  asset: EmojiAsset;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <EmojiImage
      asset={asset}
      x={30}
      y={10}
      size={28}
      className={className}
      style={style}
    />
  );
}

function AttentionIcon() {
  const displaySize = emojiDisplaySize(28);
  const offset = centeredEmojiOffset(28);
  return (
    <svg
      x={30 - offset}
      y={10 - offset}
      width={displaySize}
      height={displaySize}
      viewBox="0 0 72 72"
      preserveAspectRatio="xMidYMid meet"
      aria-label="attention"
    >
      {/* Static eyeballs + outlines */}
      <ellipse cx="19.5" cy="36" rx="14.5" ry="24.7" fill="#FFFFFF" />
      <ellipse cx="52.5" cy="36" rx="14.5" ry="24.7" fill="#FFFFFF" />
      <ellipse
        cx="19.5"
        cy="36"
        rx="14.5"
        ry="24.7"
        fill="none"
        stroke="#000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse
        cx="52.5"
        cy="36"
        rx="14.5"
        ry="24.7"
        fill="none"
        stroke="#000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Animated iris + pupil, centered on eyeballs */}
      <g className={styles.architectureEye} aria-hidden="true">
        <circle cx="19.5" cy="38" r="8" fill="#A57939" />
        <circle cx="19.5" cy="38" r="3.6" fill="#000" />
        <circle cx="52.5" cy="38" r="8" fill="#A57939" />
        <circle cx="52.5" cy="38" r="3.6" fill="#000" />
      </g>
    </svg>
  );
}

function MoeIcon() {
  const displaySize = emojiDisplaySize(28);
  const offset = centeredEmojiOffset(28);
  return (
    <svg
      x={30 - offset}
      y={10 - offset}
      width={displaySize}
      height={displaySize}
      viewBox="0 0 72 72"
      preserveAspectRatio="xMidYMid meet"
      aria-label="compass"
    >
      {/* Compass body */}
      <circle cx="36" cy="36" r="24" fill="#fcea2b" />
      <path
        fill="#f1b31c"
        d="M53,19A24.0417,24.0417,0,0,1,36,60a24.302,24.302,0,0,1-17-7"
      />
      {/* Actual compass needle — animated around (36,36) */}
      <g
        className={styles.architectureCompass}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        aria-hidden="true"
      >
        <polyline fill="#fff" points="33.2 33.2 24 48 38.8 38.8" />
        <polyline fill="#ea5a47" points="33.2 33.2 48 24 38.8 38.8" />
        <polyline
          fill="none"
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          points="33.2 33.2 24 48 38.8 38.8"
        />
        <polyline
          fill="none"
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          points="33.2 33.2 48 24 38.8 38.8"
        />
      </g>
      {/* Border + cardinal ticks */}
      <circle
        cx="36"
        cy="36"
        r="24"
        fill="none"
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <line
        x1="36"
        x2="36"
        y1="21"
        y2="16"
        stroke="#000"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <line
        x1="36"
        x2="36"
        y1="56"
        y2="51"
        stroke="#000"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <line
        x1="51"
        x2="56"
        y1="36"
        y2="36"
        stroke="#000"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <line
        x1="16"
        x2="21"
        y1="36"
        y2="36"
        stroke="#000"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ContextIcon() {
  // Text-line overlays mapped from emoji 72×72 space → parent 88×48 viewBox.
  // EmojiImage(x=30, y=10, size=28): displaySize=31.36, offset=1.68, scale=31.36/72.
  const lines = [
    { y: 15.92, x2: 41.7 },
    { y: 19.62, x2: 47.24 },
    { y: 22.85, x2: 47.24 },
    { y: 26.54, x2: 47.24 },
    { y: 30.23, x2: 47.24 },
  ];
  return (
    <>
      <SingleIcon asset={EMOJI.documentTabs} />
      {lines.map((l, i) => (
        <line
          key={l.y}
          className={styles.architectureTextLine}
          x1="35.24"
          x2={l.x2}
          y1={l.y}
          y2={l.y}
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            '--line-delay': `${i * 300}ms`,
          } as React.CSSProperties}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

function ModalityIcon({ clipId }: { clipId: string }) {
  return (
    <g clipPath={`url(#${clipId})`}>
      <TokenStream
        x={-93}
        y={16}
        tokens={MODALITY_STREAM_TOKENS}
        size={16}
        gap={4}
        tone="magenta"
        className={styles.modalityStream}
      />
    </g>
  );
}

function ServingIcon() {
  return (
    <g
      className={styles.architectureCloud}
      style={{ transformBox: 'view-box', transformOrigin: '44px 24px' }}
    >
      <EmojiImage asset={EMOJI.cloud} x={26} y={6} size={36} />
    </g>
  );
}

function RowIcon({ row }: { row: Row }) {
  const clipId = `${React.useId()}-window`.replace(/:/g, '');
  const content =
    row.icon === 'dense' ? (
      <GearNode
        x={30}
        y={10}
        size={28}
        className={styles.architectureGear}
      />
    ) : row.icon === 'moe' ? (
      <MoeIcon />
    ) : row.icon === 'attention' ? (
      <AttentionIcon />
    ) : row.icon === 'context' ? (
      <ContextIcon />
    ) : row.icon === 'modalities' ? (
      <ModalityIcon clipId={clipId} />
    ) : (
      <ServingIcon />
    );

  return (
    <svg
      className={styles.icon}
      viewBox="0 0 88 48"
      role="img"
      aria-label={row.step}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="4" y="4" width="80" height="40" rx={0} />
        </clipPath>
      </defs>
      <rect
        x="1"
        y="1"
        width="86"
        height="46"
        rx={0}
        fill={toneVar(row.tone, 'bg')}
        stroke={toneVar(row.tone, 'fg')}
      />
      {content}
    </svg>
  );
}

function ArchitectureRow({ row, index }: { row: Row; index: number }) {
  const headingId = `architecture-choice-${index + 1}`;

  return (
    <article
      className={`${styles.row} ${styles[row.tone]}`}
      aria-labelledby={headingId}
    >
      <div className={styles.visualCell}>
        <RowIcon row={row} />
        <span
          className={styles.stepMeta}
          aria-label={`Step ${index + 1}: ${row.step}`}
        >
          <span className={styles.stepNumber}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className={styles.stepLabel} data-mobile-label={row.mobileStep}>
            {row.step}
          </span>
        </span>
      </div>
      <div className={styles.textCell}>
        <h3 id={headingId}>{row.choice}</h3>
        <dl>
          <div>
            <dt>Effect</dt>
            <dd>{row.change}</dd>
          </div>
          <div>
            <dt>Implication</dt>
            <dd>{row.implication}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default function ArchitectureToolShapeTable() {
  return (
    <section
      className={styles.container}
      aria-label="Architecture choices and operator implications"
    >
      <div className={styles.header}>
        <p className={styles.kicker}>Architecture defines the operating envelope</p>
        <p>
          Architecture choices show up as production behavior: speed, cost,
          context reliability, modality support, and deployment constraints.
        </p>
      </div>
      <div className={styles.rows}>
        {ROWS.map((row, index) => (
          <ArchitectureRow key={row.choice} row={row} index={index} />
        ))}
      </div>
    </section>
  );
}
