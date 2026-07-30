import React, { type ReactNode } from 'react';
import { EMOJI } from './emojiAssets';
import { DiagramTile } from './DiagramTile';
import { DIAGRAM_TOKEN_SIZE, RICH_TILE_SCALE } from './diagramScale';
import { tileToneVars, type DiagramTone } from './diagramTileLayout';
import { TokenArrowTrain } from './TokenArrowTrain';
import { seededTokenTrain } from './TokenTrainSequence';
import type { TokenUnitTone } from './TokenUnit';

export type WorkflowStep = 'grounding' | 'plan' | 'execute' | 'validate';
type Layout = 'desktop' | 'mobile';

type TileSpec = {
  id: WorkflowStep;
  title: string;
  tone: DiagramTone;
  tokenTone: TokenUnitTone;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ArrowSpec = {
  id: string;
  from: WorkflowStep;
  d: string;
  startMs: number;
  travelMs?: number;
};

type WorkflowLoopGraphicProps = {
  layout?: Layout;
  transform?: string;
  operator?: ReactNode;
  returnLabel?: string;
};

const G = 8;
const TILE_W = 23 * G;
const TILE_H = RICH_TILE_SCALE.comfortableHeight;
const TILES: TileSpec[] = [
  {
    id: 'grounding',
    title: 'GROUNDING',
    tone: 'indigo',
    tokenTone: 'indigo',
    x: 36 * G,
    y: 6 * G,
    width: TILE_W,
    height: TILE_H,
  },
  {
    id: 'plan',
    title: 'PLAN',
    tone: 'cyan',
    tokenTone: 'cyan',
    x: 69 * G,
    y: 22 * G,
    width: TILE_W,
    height: TILE_H,
  },
  {
    id: 'execute',
    title: 'EXECUTE',
    tone: 'magenta',
    tokenTone: 'magenta',
    x: 36 * G,
    y: 38 * G,
    width: TILE_W,
    height: TILE_H,
  },
  {
    id: 'validate',
    title: 'VALIDATION GATE',
    tone: 'warning',
    tokenTone: 'warning',
    x: 3 * G,
    y: 22 * G,
    width: TILE_W,
    height: TILE_H,
  },
];

const MOBILE_TILES = TILES.map((tile, index) => ({
  ...tile,
  x: 56,
  y: 48 + index * 142,
  width: 248,
  height: 104,
}));

const ARROWS: ArrowSpec[] = [
  {
    id: 'grounding-to-plan',
    from: 'grounding',
    d: 'M 472 120 L 552 200',
    startMs: 0,
  },
  {
    id: 'plan-to-execute',
    from: 'plan',
    d: 'M 552 264 L 472 344',
    startMs: 2400,
  },
  {
    id: 'execute-to-validate',
    from: 'execute',
    d: 'M 288 344 L 208 264',
    startMs: 4800,
  },
  {
    id: 'validate-to-grounding',
    from: 'validate',
    d: 'M 208 200 L 288 120',
    startMs: 7200,
  },
];

const MOBILE_ARROWS: ArrowSpec[] = [
  {
    id: 'grounding-to-plan-mobile',
    from: 'grounding',
    d: 'M 180 152 L 180 190',
    startMs: 0,
  },
  {
    id: 'plan-to-execute-mobile',
    from: 'plan',
    d: 'M 180 294 L 180 332',
    startMs: 2400,
  },
  {
    id: 'execute-to-validate-mobile',
    from: 'execute',
    d: 'M 180 436 L 180 474',
    startMs: 4800,
  },
  {
    id: 'validate-to-grounding-mobile',
    from: 'validate',
    d: 'M 56 526 H 16 V 100 H 56',
    startMs: 7200,
    travelMs: 2400,
  },
];

const TILES_BY_STEP = Object.fromEntries(
  TILES.map((tile) => [tile.id, tile])
) as Record<WorkflowStep, TileSpec>;
const TOKEN_SEQUENCE = seededTokenTrain('operator-cycle', 5);
export const WORKFLOW_FLOW_TIMING = {
  cycleMs: 9600,
  travelMs: 900,
  fadeMs: 180,
  repeat: 'loop',
} as const;
export const WORKFLOW_TOKEN_STAGGER = {
  mode: 'pathSpacing',
  spacingPx: DIAGRAM_TOKEN_SIZE.flow * 1.35,
} as const;

export function WorkflowLoopGraphic({
  layout = 'desktop',
  transform,
  operator,
  returnLabel,
}: WorkflowLoopGraphicProps) {
  const mobile = layout === 'mobile';
  const tiles = mobile ? MOBILE_TILES : TILES;
  const arrows = mobile ? MOBILE_ARROWS : ARROWS;
  return (
    <g transform={transform}>
      {arrows.map((arrow) => (
        <WorkflowTokenStream key={arrow.id} arrow={arrow} />
      ))}
      {tiles.map((tile) => (
        <WorkflowTile
          key={tile.id}
          tile={tile}
          density={mobile ? 'mobile' : 'desktop'}
        />
      ))}
      {returnLabel && <ReturnLabel mobile={mobile}>{returnLabel}</ReturnLabel>}
      {operator}
    </g>
  );
}

function WorkflowTokenStream({ arrow }: { arrow: ArrowSpec }) {
  const tile = TILES_BY_STEP[arrow.from];
  return (
    <TokenArrowTrain
      d={arrow.d}
      tokens={TOKEN_SEQUENCE}
      stroke={tileToneVars(tile.tone).stroke}
      tone={tile.tokenTone}
      timing={{
        ...WORKFLOW_FLOW_TIMING,
        startDelayMs: arrow.startMs,
        travelMs: arrow.travelMs ?? WORKFLOW_FLOW_TIMING.travelMs,
      }}
      stagger={WORKFLOW_TOKEN_STAGGER}
      size={DIAGRAM_TOKEN_SIZE.flow}
    />
  );
}

function WorkflowTile({ tile, density }: { tile: TileSpec; density: Layout }) {
  const content =
    tile.id === 'grounding'
      ? {
          icon: EMOJI.microscope,
          title: 'reality?',
          detail: 'facts · constraints',
          voice: 'spec' as const,
        }
      : tile.id === 'plan'
        ? {
            icon: EMOJI.documentTabs,
            title: 'shape?',
            detail: 'scope · checkpoints',
            voice: 'spec' as const,
          }
        : tile.id === 'execute'
          ? {
              icon: EMOJI.agent,
              title: 'autonomy?',
              detail: 'bounded agent work',
              voice: 'ai' as const,
            }
          : {
              icon: EMOJI.question,
              title: 'accept?',
              detail: 'accept · iterate',
              voice: 'spec' as const,
            };
  return (
    <DiagramTile
      {...tile}
      icon={content.icon}
      title={content.title}
      detail={content.detail}
      titleVoice={content.voice}
      variant="rich"
      fill="var(--surface-raised)"
      density={density}
      weight={tile.id === 'validate' ? 2 : undefined}
    />
  );
}

function ReturnLabel({
  mobile,
  children,
}: {
  mobile: boolean;
  children: string;
}) {
  return (
    <text
      x={mobile ? 20 : 220}
      y={mobile ? 36 : 154}
      fill="var(--text-muted)"
      style={{
        fontFamily: 'var(--font-mono-keyword)',
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.06em',
      }}
    >
      {children}
    </text>
  );
}

export const WORKFLOW_LAYOUT = {
  desktop: { tiles: TILES, arrows: ARROWS },
  mobile: { tiles: MOBILE_TILES, arrows: MOBILE_ARROWS },
} as const;
