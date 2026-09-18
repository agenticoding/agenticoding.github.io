// Semantic Search — "one question in, matched against the index." Query time,
// shown as the second moment of the retrieval pipeline EmbeddingIndexDiagram
// builds: the question's tokens ride into the SAME model that built the index,
// the model's vector rides into the index, and only then is that query vector
// matched against the graph that is already there. The query only reads that
// graph — it lights its nearest neighbours while the rest stay dim. The
// embedding-model tile and the vector-index tile are shared with the build figure
// (EmbeddingTiles), so the reader recognises the machinery; only the overlay is
// new.
//
// Motion spec
// Story loop: one query per cycle, each beat starting only when the one before it
//   has ended — the chip states the question, its tokens ride into the model, the
//   gear turns once (the embedding pass), the model's vector rides into the index,
//   the delivered vector fades in inside the vector space, then the nearest links
//   trace out and their rings answer. The finished match holds, then the overlay
//   rolls back at the wrap so the query can replay over a still index. The stored
//   vectors and links never move: a query reads the index, it does not write one.
// Static fallback: complete — the chip, the model tile, and the index with its
//   full graph, the query vector parked at its landing point, the nearest links,
//   rings and labels all read with motion disabled (the figure initialises in its
//   matched state; the trains rest on their lanes).
// Reduced motion: the shared CSS kills all loops; the figure rests matched.

import { useId, type CSSProperties } from 'react';
import type { TokenSequence } from './AnimatedTokenFlow';
import {
  EmbeddingModelTile,
  FrameLabel,
  VectorIndexTile,
  type ModelCopy,
  type ModelGear,
} from './EmbeddingTiles';
import { CORPUS_CONCEPTS } from './embeddingIndexModel';
import { DIAGRAM_TOKEN_SIZE } from './diagramScale';
import { tileToneVars } from './diagramTileLayout';
import { ResponsiveDiagram } from './ResponsiveDiagram';
import { TokenArrowTrain, VectorArrowTrain } from './TokenArrowTrain';
import {
  DESKTOP,
  GEAR_BEAT,
  MOBILE,
  QUERY_BEAT_MS,
  QUERY_MATCH,
  QUERY_TRAIN,
  QUERY_TRAIN_START_MS,
  QUERY_VECTOR_TRAIN,
  SEARCH_LOOP_MS,
  VECTOR_TRAIN_START_MS,
  queryFlowTiming,
  trainPaths,
} from './semanticSearchModel';
import shared from './EmbeddingTiles.module.css';
import styles from './SemanticSearchDiagram.module.css';

const ARIA_LABEL =
  'Semantic search at query time: a query chip carrying the question “doctor pay” sends its tokens into a small embedding model — the same model that built the index — which turns them into one query vector. That vector crosses into the vector index tile and is matched against the graph of stored vectors: the index was built once, and query time only reads it. The stored vectors nearest the query light up as its nearest neighbours, with the similarity relation drawn between them, while the rest stay dim. Near means related meaning.';

const FLOW_SIZE = DIAGRAM_TOKEN_SIZE.flow;
const CONTEXT_STROKE = tileToneVars('context').accent;

// The question, tokenized: plain text chips, because a question carries no
// modality the way a page of source material does.
const QUERY_TOKENS = [
  { modality: 'text', signal: 'ordinary' },
  { modality: 'text', signal: 'ordinary' },
  { modality: 'text', signal: 'ordinary' },
  { modality: 'text', signal: 'ordinary' },
] as const satisfies TokenSequence;

// The shared model tile reads the same as it did when it built the index; only
// the note and the annotation say what it is doing now.
const MODEL_COPY: ModelCopy = {
  title: 'Text → vector',
  notes: ['same model that', 'built the index'],
  annotation: 'query → vector',
};
const MODEL_GEAR: ModelGear = {
  startMs: GEAR_BEAT.startMs,
  turnMs: GEAR_BEAT.turnMs,
  turns: GEAR_BEAT.turns,
  loopMs: SEARCH_LOOP_MS,
};

export default function SemanticSearchDiagram() {
  return (
    <ResponsiveDiagram
      className={styles.container}
      breakpoint="768px"
      mode="viewport"
      ariaLabel={ARIA_LABEL}
      desktop={<DesktopDiagram />}
      mobile={<MobileDiagram />}
    />
  );
}

function DesktopDiagram() {
  const chipBeat = useChipBeatName();
  return (
    <svg
      className={`${styles.diagram} ${styles.desktopDiagram}`}
      style={{ '--cycle-ms': `${SEARCH_LOOP_MS}ms` } as CSSProperties}
      viewBox={`0 0 ${DESKTOP.canvas.width} ${DESKTOP.canvas.height}`}
    >
      <TimingStyles name={chipBeat} />
      <FrameLabel x={24} y={34}>
        ONE QUERY → NEAREST FEW OUT
      </FrameLabel>
      <QueryTrains layout="desktop" />
      <QueryChip chip={DESKTOP.queryChip} beatName={chipBeat} />
      <EmbeddingModelTile
        tile={DESKTOP.model}
        copy={MODEL_COPY}
        gear={MODEL_GEAR}
      />
      <VectorIndexTile
        tile={DESKTOP.index}
        provenance={CORPUS_CONCEPTS}
        spec={{ mode: 'query', match: QUERY_MATCH }}
      />
    </svg>
  );
}

function MobileDiagram() {
  const chipBeat = useChipBeatName();
  return (
    <svg
      className={`${styles.diagram} ${styles.mobileDiagram}`}
      style={{ '--cycle-ms': `${SEARCH_LOOP_MS}ms` } as CSSProperties}
      viewBox={`0 0 ${MOBILE.canvas.width} ${MOBILE.canvas.height}`}
    >
      <TimingStyles name={chipBeat} />
      {/* The frame label owns the band above the query chip, so the column can start
          where the canvas does (see SemanticSearchModel's MOBILE.queryChip). */}
      <FrameLabel x={20} y={18}>
        ONE QUERY → NEAREST FEW
      </FrameLabel>
      <QueryTrains layout="mobile" />
      <QueryChip chip={MOBILE.queryChip} beatName={chipBeat} />
      <EmbeddingModelTile
        tile={MOBILE.model}
        compact
        copy={MODEL_COPY}
        gear={MODEL_GEAR}
      />
      <VectorIndexTile
        tile={MOBILE.index}
        compact
        provenance={CORPUS_CONCEPTS}
        spec={{ mode: 'query', match: QUERY_MATCH }}
      />
    </svg>
  );
}

/** The two hops: the question's tokens into the model, then the model's vector
 * into the index. Rendering order is paint order — the trains sit on their
 * connectors, under the tiles they ride between. */
function QueryTrains({ layout }: { layout: 'desktop' | 'mobile' }) {
  const query = trainPaths('query', layout);
  const vector = trainPaths('vector', layout);
  return (
    <g>
      <TokenArrowTrain
        d={query.d}
        tokenPathD={query.lane}
        tokens={QUERY_TOKENS.slice(0, QUERY_TRAIN.tokens)}
        timing={queryFlowTiming(QUERY_TRAIN_START_MS)}
        stagger={{ mode: 'pathSpacing', spacingPx: QUERY_TRAIN.spacing }}
        tone="indigo"
        stroke={CONTEXT_STROKE}
        size={FLOW_SIZE}
        pathClassName={shared.connector}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
      <VectorArrowTrain
        d={vector.d}
        tokenPathD={vector.lane}
        count={QUERY_VECTOR_TRAIN.tokens}
        timing={queryFlowTiming(VECTOR_TRAIN_START_MS)}
        stagger={{ mode: 'pathSpacing', spacingPx: QUERY_VECTOR_TRAIN.spacing }}
        tone="indigo"
        stroke={CONTEXT_STROKE}
        size={FLOW_SIZE}
        pathClassName={shared.connector}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
    </g>
  );
}

/** The chip's keyframe name, unique per figure instance (useId): both
 * responsive variants render on one page, and both retrieval figures can share
 * it, so a bare module-level name would collide. */
function useChipBeatName() {
  return `semantic-chip-beat-${useId().replace(/:/g, '')}`;
}

/** The chip's one beat: the question is stated before it is sent to the model. */
function TimingStyles({ name }: { name: string }) {
  const peak = `${((QUERY_BEAT_MS * 0.5 * 100) / SEARCH_LOOP_MS).toFixed(2)}%`;
  const end = `${((QUERY_BEAT_MS * 100) / SEARCH_LOOP_MS).toFixed(2)}%`;
  return (
    <style>
      {`@keyframes ${name} {
        0% { transform: scale(1); }
        ${peak} { transform: scale(1.04); }
        ${end}, 100% { transform: scale(1); }
      }`}
    </style>
  );
}

/** One dashed input box: the question itself, not a pipeline stage. */
function QueryChip({
  chip,
  beatName,
}: {
  chip: { x: number; y: number; width: number; height: number };
  beatName: string;
}) {
  return (
    <g className={styles.chipBeat} style={{ animationName: beatName }}>
      <rect
        x={chip.x}
        y={chip.y}
        width={chip.width}
        height={chip.height}
        rx={0}
        className={styles.queryChip}
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={chip.x + 12}
        y={chip.y + 22}
        fill={tileToneVars('model').label}
        className={styles.queryEyebrow}
      >
        QUERY
      </text>
      <text
        x={chip.x + 12}
        y={chip.y + 46}
        fill="var(--text-heading)"
        className={styles.queryText}
      >
        “doctor pay”
      </text>
    </g>
  );
}
