// Embedding Index — "Embeddings: meaning becomes distance." Section 1 of the
// retrieval chapter. Raw text is split into chunks (CORPUS), a small embedding
// model turns each chunk into a vector, and the vectors are stored ONCE in a
// vector index. The index IS the vector space: every node is a stored vector,
// every edge links a vector to a near neighbour, so nearness means related
// meaning (cat/feline 0.91, rocket 0.06) and the graph is queried forever.
//
// The model tile and the index tile are shared with SemanticSearchDiagram
// (EmbeddingTiles); this figure owns only the build story — the corpus, the two
// trains and the write beat that turns the shared index from "stored" to "growing".
//
// Motion spec
// Story loop: three chained beats with no pause between them — the chunk train
//   crosses into the model, the gear turns the moment it has landed and turns the
//   text into vectors, then the vector glyphs cross into the index, where each one
//   becomes a dot as it lands and connects: the close pair settles, the write
//   pulse rings on the vector that arrived last, the finished graph holds, and the
//   added layer rolls back out at the wrap (per element, ending on the wrap) so
//   the loop can replay the write. The index's standing vectors and links never
//   move or fade: the loop adds to an existing index, it does not rebuild one. The
//   whole schedule lives in embeddingIndexModel (STEP SCHEDULE, ENTRY BEAT, LINK
//   BEAT and the tail constants) and the keyframes in EmbeddingTiles are generated
//   from it, so no stage can outlive its beat.
// Static fallback: complete — corpus rows, model tile with its gear, the
//   proximity graph with its dots, links and similarity labels, and both trains
//   at rest all read with motion disabled (the animation states are the hidden
//   ones; the base styles are the finished figure).
// Reduced motion: the shared CSS kills all loops; the figure initializes in its
//   complete end state (the gear simply rests upright).

import type { TokenSequence } from './AnimatedTokenFlow';
import { ConceptCluster } from './ConceptCluster';
import { DIAGRAM_ICON_SIZE, DIAGRAM_TOKEN_SIZE } from './diagramScale';
import { tileToneVars } from './diagramTileLayout';
import {
  EmbeddingModelTile,
  FrameLabel,
  VectorIndexTile,
  type ModelCopy,
  type ModelGear,
} from './EmbeddingTiles';
import { ResponsiveDiagram } from './ResponsiveDiagram';
import {
  TokenArrowTrain,
  VectorArrowTrain,
  type TokenArrowTrainProps,
  type VectorArrowTrainProps,
} from './TokenArrowTrain';
import {
  CHUNK_TRAIN,
  CORPUS_CONCEPTS,
  DESKTOP,
  FLOW_START_MS,
  GEAR_BEAT,
  LOOP_MS,
  MOBILE,
  MOBILE_HOP,
  VECTOR_GLYPHS,
  corpusCluster,
  flowPath,
  flowPathV,
  flowTiming,
  lanePath,
  lanePathV,
  trainStagger,
  type Region,
} from './embeddingIndexModel';
import shared from './EmbeddingTiles.module.css';
import styles from './EmbeddingIndexDiagram.module.css';

const ARIA_LABEL =
  'Embeddings turn meaning into distance: a corpus of code, docs, web and specs is split into chunks, a small embedding model converts each chunk into a vector, and the vectors are stored once in a vector index. The index is a proximity graph where every node is a stored vector and every edge links it to a near neighbour, so nearness means related meaning: cat and feline sit close at 0.91 similarity while rocket is far away at 0.06.';

const FLOW_SIZE = DIAGRAM_TOKEN_SIZE.flow;
const CONTEXT_STROKE = tileToneVars('context').accent;

// Many ordinary tokens in — mixed modalities stand in for heterogeneous raw
// text. The count is the shared train spec; the palette stays longer so the
// sequence can grow without re-authoring it.
const CHUNK_TOKENS = [
  { modality: 'text', signal: 'ordinary' },
  { modality: 'code', signal: 'ordinary' },
  { modality: 'generic', signal: 'ordinary' },
  { modality: 'image', signal: 'ordinary' },
  { modality: 'text', signal: 'ordinary' },
  { modality: 'code', signal: 'ordinary' },
  { modality: 'generic', signal: 'ordinary' },
  { modality: 'text', signal: 'ordinary' },
] as const satisfies TokenSequence;

// The build figure's copy and gear beat for the shared model tile.
const MODEL_COPY: ModelCopy = {
  title: 'Text → vector',
  notes: ['small enough', 'for a laptop'],
  annotation: 'meaning → distance',
};
const MODEL_GEAR: ModelGear = {
  startMs: GEAR_BEAT.startMs,
  turnMs: GEAR_BEAT.turnMs,
  turns: GEAR_BEAT.turns,
  loopMs: LOOP_MS,
};

export default function EmbeddingIndexDiagram() {
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
  return (
    <svg
      className={`${styles.diagram} ${styles.desktopDiagram}`}
      viewBox={`0 0 ${DESKTOP.canvas.width} ${DESKTOP.canvas.height}`}
    >
      <TokenArrowTrain
        {...chunkFlow(
          flowPath(DESKTOP.corpus, DESKTOP.model, DESKTOP.flowY),
          lanePath(DESKTOP.corpus, DESKTOP.model, DESKTOP.flowY)
        )}
      />
      <VectorArrowTrain
        {...vectorFlow(
          flowPath(DESKTOP.model, DESKTOP.index, DESKTOP.flowY),
          lanePath(DESKTOP.model, DESKTOP.index, DESKTOP.flowY)
        )}
      />
      <CorpusTile tile={DESKTOP.corpus} />
      <EmbeddingModelTile
        tile={DESKTOP.model}
        copy={MODEL_COPY}
        gear={MODEL_GEAR}
      />
      <VectorIndexTile tile={DESKTOP.index} spec={{ mode: 'build' }} />
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg
      className={`${styles.diagram} ${styles.mobileDiagram}`}
      viewBox={`0 0 ${MOBILE.canvas.width} ${MOBILE.canvas.height}`}
    >
      {/* The frame label owns the band above the first tile (MOBILE.corpus.y), so the
          column can start where the canvas does. */}
      <FrameLabel x={20} y={18}>
        MEANING BECOMES DISTANCE
      </FrameLabel>
      <TokenArrowTrain
        {...chunkFlow(
          flowPathV(MOBILE.flowX, MOBILE_HOP.chunk.start, MOBILE_HOP.chunk.end),
          lanePathV(MOBILE.flowX, MOBILE_HOP.chunk.start, MOBILE_HOP.chunk.end)
        )}
      />
      <VectorArrowTrain
        {...vectorFlow(
          flowPathV(
            MOBILE.flowX,
            MOBILE_HOP.vector.start,
            MOBILE_HOP.vector.end
          ),
          lanePathV(
            MOBILE.flowX,
            MOBILE_HOP.vector.start,
            MOBILE_HOP.vector.end
          )
        )}
      />
      <CorpusTile tile={MOBILE.corpus} />
      <EmbeddingModelTile
        tile={MOBILE.model}
        compact
        copy={MODEL_COPY}
        gear={MODEL_GEAR}
      />
      <VectorIndexTile tile={MOBILE.index} compact spec={{ mode: 'build' }} />
    </svg>
  );
}

// Both layouts ride the same trains; only the connectors differ. Each train gets
// the drawn rail (`d`) for its arrow and its own inset lane (`tokenPathD`) to
// travel on, so no item ever crosses a tile border.
function chunkFlow(d: string, lane: string): TokenArrowTrainProps {
  return {
    d,
    tokenPathD: lane,
    tokens: CHUNK_TOKENS.slice(0, CHUNK_TRAIN.tokens),
    timing: flowTiming(FLOW_START_MS.corpus),
    stagger: trainStagger(CHUNK_TRAIN),
    tone: 'indigo',
    stroke: CONTEXT_STROKE,
    size: FLOW_SIZE,
    pathClassName: shared.connector,
    strokeLinecap: 'butt',
    strokeLinejoin: 'miter',
  };
}

// The model's output is a vector, so it rides as a VectorGlyph — a bracketed
// component tuple — never as a token chip.
function vectorFlow(d: string, lane: string): VectorArrowTrainProps {
  return {
    d,
    tokenPathD: lane,
    count: VECTOR_GLYPHS.tokens,
    timing: flowTiming(FLOW_START_MS.vector),
    stagger: trainStagger(VECTOR_GLYPHS),
    tone: 'indigo',
    stroke: CONTEXT_STROKE,
    size: FLOW_SIZE,
    pathClassName: shared.connector,
    strokeLinecap: 'butt',
    strokeLinejoin: 'miter',
  };
}

// The corpus IS a concept cluster — the same shared object as
// GroundingDistillationDiagram's grounding sources (ConceptCluster owns the tile,
// its header and the staggered arrival beat). This figure only says which kinds
// a codebase's text comes in and how they sit inside its own, smaller tile: the
// icons are the standard tile size because the labels sit BESIDE them here.
function CorpusTile({ tile }: { tile: Region }) {
  const iconSize = DIAGRAM_ICON_SIZE.secondary;
  return (
    <ConceptCluster
      {...tile}
      eyebrow="CORPUS"
      note="split into chunks"
      items={CORPUS_CONCEPTS}
      placements={corpusCluster(tile, iconSize)}
      iconSize={iconSize}
      cycleMs={LOOP_MS}
    />
  );
}
