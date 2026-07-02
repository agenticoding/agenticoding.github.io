import React from 'react';
import clsx from 'clsx';
import styles from './ContextWindowAnatomyDiagram.module.css';
import { EmojiImage } from './ActorNodes';
import { EMOJI } from './emojiAssets';
import {
  TokenUnit,
  type TokenUnitModality,
  type TokenUnitSignal,
  type TokenUnitTone,
} from './TokenUnit';
import { DIAGRAM_TOKEN_SIZE } from './diagramScale';

type Tone = 'cyan' | 'indigo' | 'neutral' | 'violet';
type TokenSpec = { modality: TokenUnitModality; signal?: TokenUnitSignal };
type Layer = {
  label: string;
  note: string;
  tone: Tone;
  emoji: keyof typeof EMOJI;
  y: number;
  h: number;
  tokens: TokenSpec[];
};

const textRun = (count: number): TokenSpec[] =>
  Array.from({ length: count }, () => ({ modality: 'text' }));

const LAYERS: Layer[] = [
  {
    label: 'system / developer instructions',
    note: 'durable text rules near the top',
    tone: 'cyan',
    emoji: 'gear',
    y: 90,
    h: 48,
    tokens: textRun(4),
  },
  {
    label: 'tool definitions',
    note: 'tool names plus JSON schemas',
    tone: 'cyan',
    emoji: 'plug',
    y: 154,
    h: 48,
    tokens: [
      { modality: 'generic' },
      { modality: 'text' },
      { modality: 'code' },
      { modality: 'code' },
    ],
  },
  {
    label: 'conversation history',
    note: 'prior text, code, and media messages',
    tone: 'neutral',
    emoji: 'chat',
    y: 218,
    h: 54,
    tokens: [
      { modality: 'text' },
      { modality: 'text' },
      { modality: 'code' },
      { modality: 'image' },
      { modality: 'audio' },
    ],
  },
  {
    label: 'retrieved context',
    note: 'files, docs, tickets, memories',
    tone: 'indigo',
    emoji: 'books',
    y: 288,
    h: 54,
    tokens: [
      { modality: 'code' },
      { modality: 'text' },
      { modality: 'image' },
      { modality: 'video' },
      { modality: 'generic' },
      { modality: 'code' },
    ],
  },
  {
    label: 'tool calls',
    note: 'model-emitted structured text',
    tone: 'violet',
    emoji: 'writing',
    y: 358,
    h: 48,
    tokens: textRun(3),
  },
  {
    label: 'tool results / observations',
    note: 'logs, files, media, and tool payloads',
    tone: 'indigo',
    emoji: 'receipt',
    y: 422,
    h: 56,
    tokens: [
      { modality: 'code' },
      { modality: 'text' },
      { modality: 'image' },
      { modality: 'audio' },
      { modality: 'video' },
      { modality: 'generic' },
      { modality: 'code' },
    ],
  },
  {
    label: 'current user request',
    note: 'active multimodal task near the end',
    tone: 'neutral',
    emoji: 'operator',
    y: 494,
    h: 48,
    tokens: [
      { modality: 'text' },
      { modality: 'image' },
      { modality: 'code' },
      { modality: 'audio' },
      { modality: 'video' },
    ],
  },
];

const DESKTOP_TOKEN_SIZE = DIAGRAM_TOKEN_SIZE.flow;
const DESKTOP_TOKEN_STRIDE = 24;
const MOBILE_TOKEN_SIZE = DIAGRAM_TOKEN_SIZE.staticMobile;
const MOBILE_TOKEN_STRIDE = 20;

const toneToToken = (tone: Tone): TokenUnitTone =>
  tone === 'neutral' ? 'neutral' : tone;
const mobileLabel = (label: string) =>
  label
    .replace('system / developer instructions', 'system')
    .replace('tool definitions', 'tools')
    .replace('conversation history', 'history')
    .replace('retrieved context', 'retrieval')
    .replace('tool results / observations', 'tool results')
    .replace('current user request', 'request');

function tokenSignal(
  token: TokenSpec,
  index: number,
  lastIndex: number
): TokenUnitSignal {
  return token.signal ?? (index === lastIndex ? 'salient' : 'ordinary');
}

function TokenRun({
  layer,
  x,
  y,
  compact = false,
}: {
  layer: Layer;
  x: number;
  y: number;
  compact?: boolean;
}) {
  const stride = compact ? MOBILE_TOKEN_STRIDE : DESKTOP_TOKEN_STRIDE;
  return (
    <g>
      {layer.tokens.map((token, index) => (
        <Token
          key={index}
          layer={layer}
          token={token}
          x={x + index * stride}
          y={y}
          index={index}
          compact={compact}
        />
      ))}
    </g>
  );
}

function Token({
  layer,
  token,
  x,
  y,
  index,
  compact,
}: {
  layer: Layer;
  token: TokenSpec;
  x: number;
  y: number;
  index: number;
  compact: boolean;
}) {
  const size = compact ? MOBILE_TOKEN_SIZE : DESKTOP_TOKEN_SIZE;
  return (
    <TokenUnit
      x={x}
      y={y}
      width={size}
      height={size}
      tone={toneToToken(layer.tone)}
      modality={token.modality}
      signal={tokenSignal(token, index, layer.tokens.length - 1)}
    />
  );
}

function LayerRow({
  layer,
  mobile = false,
}: {
  layer: Layer;
  mobile?: boolean;
}) {
  const x = mobile ? 44 : 172;
  const width = mobile ? 272 : 468;
  const iconX = x + 18;
  const textX = x + 64;
  const tokenX = mobile ? x + 156 : x + 284;
  const labelY = mobile ? layer.y + layer.h / 2 + 4 : layer.y + layer.h / 2 - 5;
  return (
    <g>
      <rect
        x={x}
        y={layer.y}
        width={width}
        height={layer.h}
        className={clsx(styles.layer, styles[layer.tone])}
      />
      <EmojiImage
        asset={EMOJI[layer.emoji]}
        x={iconX}
        y={layer.y + Math.max(8, (layer.h - 28) / 2)}
        size={28}
      />
      <text x={textX} y={labelY} className={styles.label}>
        {mobile ? mobileLabel(layer.label) : layer.label}
      </text>
      {mobile ? null : (
        <text x={textX} y={layer.y + layer.h / 2 + 13} className={styles.note}>
          {layer.note}
        </text>
      )}
      <TokenRun
        layer={layer}
        x={tokenX}
        y={
          layer.y +
          layer.h / 2 -
          (mobile ? MOBILE_TOKEN_SIZE / 2 : DESKTOP_TOKEN_SIZE / 2)
        }
        compact={mobile}
      />
    </g>
  );
}

function DesktopDiagram() {
  return (
    <svg
      viewBox="0 0 820 570"
      width="100%"
      role="img"
      aria-label="Context window anatomy shown as a single ordered column of request layers."
      className={clsx(styles.diagram, styles.desktop)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <text x={410} y={34} textAnchor="middle" className={styles.title}>
        one model call: context window
      </text>
      <text x={410} y={58} textAnchor="middle" className={styles.note}>
        ordered request areas become semantic token runs in fixed positions
      </text>
      <rect x={140} y={72} width={540} height={486} className={styles.frame} />
      {LAYERS.map((layer) => (
        <LayerRow key={layer.label} layer={layer} />
      ))}
      <path d="M 108 90 V 542" className={styles.budgetLine} />
      <text
        x={84}
        y={316}
        textAnchor="middle"
        className={styles.sideLabel}
        transform="rotate(-90 84 316)"
      >
        finite token budget
      </text>
      <text x={690} y={180} className={styles.sideNote}>
        top stays durable
      </text>
      <text x={690} y={340} className={styles.sideNote}>
        middle accumulates
      </text>
      <text x={690} y={520} className={styles.sideNote}>
        latest task salient
      </text>
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg
      viewBox="0 0 360 570"
      width="100%"
      role="img"
      aria-label="Context window anatomy shown as a single ordered column for mobile."
      className={clsx(styles.diagram, styles.mobile)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <text x={180} y={34} textAnchor="middle" className={styles.title}>
        context window
      </text>
      <text x={180} y={58} textAnchor="middle" className={styles.note}>
        semantic request layers
      </text>
      <rect x={32} y={72} width={296} height={486} className={styles.frame} />
      {LAYERS.map((layer) => (
        <LayerRow key={layer.label} layer={layer} mobile />
      ))}
      <path d="M 22 90 V 542" className={styles.budgetLine} />
      <text
        x={12}
        y={316}
        textAnchor="middle"
        className={styles.sideLabel}
        transform="rotate(-90 12 316)"
      >
        token budget
      </text>
    </svg>
  );
}

export default function ContextWindowAnatomyDiagram() {
  return (
    <>
      <DesktopDiagram />
      <MobileDiagram />
    </>
  );
}
