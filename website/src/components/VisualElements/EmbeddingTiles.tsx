// EmbeddingTiles — the shared visual language for the two retrieval figures.
//
// EmbeddingIndexDiagram ("meaning becomes distance, then gets indexed") and
// SemanticSearchDiagram ("one question in, matched against the index") must read
// as one piece of machinery at two moments: build the index, then query it. So
// the embedding-model tile, the vector-index tile, the proximity graph and its
// vector glyphs live HERE, once. The figures differ only in what animates over
// that shared space:
//   build → vectors arrive and write themselves into the graph;
//   query → one query vector matches against the graph that is already there.
// The stored vectors and links are identical in both; query mode never rebuilds
// them — it only lights the ones the query answers.

import { useId, type CSSProperties, type ReactNode } from 'react';
import { EmojiImage } from './ActorNodes';
import { ConceptChip, type ConceptItem } from './ConceptCluster';
import { DiagramTileSurface } from './DiagramTile';
import { DIAGRAM_ICON_SIZE } from './diagramScale';
import { tileToneVars } from './diagramTileLayout';
import { EMOJI } from './emojiAssets';
import { GearNode } from './GearNode';
import { VectorGlyph } from './VectorGlyph';
import {
  CONNECT_DRAW_MS,
  DOT_ENTRY_MS,
  DRAWN_LINKS,
  ENTRY_ARRIVAL_MS,
  ENTRY_DOTS,
  FADE_OUT_MS,
  FADE_OUT_START_MS,
  GRAPH_EDGES,
  LANDING_BEAT,
  LANDING_MS,
  LOOP_MS,
  NEIGHBOUR_PAIR,
  PULSES,
  PULSE_BEAT,
  SCATTER_DOTS,
  SCATTER_GLYPH_SIZE,
  STANDING_EDGES,
  dotAt,
  dotById,
  entryIndex,
  isEnteringDot,
  linkKey,
  scatterRegion,
  similarityLabelPos,
  similarityOf,
  type Pt,
  type Region,
  type ScatterDot,
} from './embeddingIndexModel';
import {
  FADE_OUT_START_MS as SEARCH_FADE_OUT_START_MS,
  MATCH_DRAW_MS,
  MATCH_MS,
  MATCH_STAGGER_MS,
  QUERY_VECTOR_IN_MS,
  SEARCH_LOOP_MS,
  queryLandsAt,
  type QueryMatch,
} from './semanticSearchModel';
import styles from './EmbeddingTiles.module.css';

const MODEL_LABEL = tileToneVars('model').label;
const SYSTEM_LABEL = tileToneVars('system').label;
const MODEL_ICON_SIZE = DIAGRAM_ICON_SIZE.primary;

/** Frame label above a retrieval figure — one definition, both figures. */
export function FrameLabel({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: ReactNode;
}) {
  return (
    <text x={x} y={y} fill="var(--text-muted)" className={styles.frameLabel}>
      {children}
    </text>
  );
}

// --- Embedding-model tile --------------------------------------------------
export type ModelCopy = {
  title: string;
  notes: readonly string[];
  annotation?: string;
};

export type ModelGear = {
  startMs: number;
  turnMs: number;
  turns: number;
  loopMs: number;
};

export function EmbeddingModelTile({
  tile,
  compact,
  copy,
  gear,
}: {
  tile: Region;
  compact?: boolean;
  copy: ModelCopy;
  gear?: ModelGear;
}) {
  const cx = tile.x + tile.width / 2;
  const name = `emb-gear-${useId().replace(/:/g, '')}`;
  return (
    <g
      style={
        gear
          ? ({ '--cycle-ms': `${gear.loopMs}ms` } as CSSProperties)
          : undefined
      }
    >
      {gear && <style>{gearCss(name, gear)}</style>}
      <DiagramTileSurface {...tile} tone="model" weight={1.5} />
      <text
        x={tile.x + 16}
        y={tile.y + 26}
        fill={MODEL_LABEL}
        className={styles.nodeEyebrow}
      >
        EMBEDDING MODEL
      </text>
      <GearNode
        x={cx - MODEL_ICON_SIZE / 2}
        y={tile.y + 40}
        size={MODEL_ICON_SIZE}
        className={gear ? `${styles.gearSpin} inference-llm-cycle` : undefined}
        style={gear ? { animationName: name } : undefined}
      />
      <text
        x={cx}
        y={tile.y + 102}
        textAnchor="middle"
        fill="var(--text-heading)"
        className={styles.tileTitle}
      >
        {copy.title}
      </text>
      {copy.notes.map((note, index) => (
        <text
          key={note}
          x={cx}
          y={tile.y + 116 + index * 12}
          textAnchor="middle"
          fill="var(--text-muted)"
          className={styles.noteText}
        >
          {note}
        </text>
      ))}
      {copy.annotation && (
        <text
          x={cx}
          y={tile.y + (compact ? tile.height + 20 : tile.height + 22)}
          textAnchor="middle"
          fill={MODEL_LABEL}
          className={styles.annotationLabel}
        >
          {copy.annotation}
        </text>
      )}
    </g>
  );
}

// --- Vector-index tile ------------------------------------------------------
// ONE tile for the vector space AND its index: the scatter is the HNSW proximity
// graph, so the reader sees that the index is the space itself. `spec` decides
// which moment of that space is shown, never which vectors it holds.
export type GraphSpec =
  | { mode: 'build' }
  | { mode: 'query'; match: QueryMatch };

export function VectorIndexTile({
  tile,
  compact,
  spec,
  provenance,
}: {
  tile: Region;
  compact?: boolean;
  spec: GraphSpec;
  provenance?: readonly ConceptItem[];
}) {
  const region = scatterRegion(tile, compact);
  const loopMs = spec.mode === 'build' ? LOOP_MS : SEARCH_LOOP_MS;
  return (
    <g style={{ '--cycle-ms': `${loopMs}ms` } as CSSProperties}>
      <DiagramTileSurface {...tile} tone="system" weight={1.5} />
      <VectorIndexFraming
        tile={tile}
        compact={compact}
        provenance={provenance}
      />
      <ProximityGraph region={region} compact={compact} spec={spec} />
      <text
        x={region.x + region.width / 2}
        y={region.y + region.height + 18}
        textAnchor="middle"
        fill="var(--text-muted)"
        className={styles.noteText}
      >
        near = related meaning
      </text>
    </g>
  );
}

function ProximityGraph({
  region,
  compact,
  spec,
}: {
  region: Region;
  compact?: boolean;
  spec: GraphSpec;
}) {
  return spec.mode === 'build' ? (
    <BuildGraph region={region} compact={compact} />
  ) : (
    <QueryGraph region={region} compact={compact} spec={spec} />
  );
}

// Desktop puts the framing in a header row and centres the graph beneath it;
// mobile stacks the same framing. The query figure swaps the "stored once" note
// for the corpus the index was built from, so the reader sees where the stored
// vectors came from without a second tile.
function VectorIndexFraming({
  tile,
  compact,
  provenance,
}: {
  tile: Region;
  compact?: boolean;
  provenance?: readonly ConceptItem[];
}) {
  return (
    <g>
      <text
        x={tile.x + 16}
        y={tile.y + 26}
        fill={SYSTEM_LABEL}
        className={styles.nodeEyebrow}
      >
        VECTOR INDEX
      </text>
      {provenance ? (
        <ProvenanceStrip tile={tile} compact={compact} items={provenance} />
      ) : (
        <StoredOnceFraming tile={tile} compact={compact} />
      )}
    </g>
  );
}

function StoredOnceFraming({
  tile,
  compact,
}: {
  tile: Region;
  compact?: boolean;
}) {
  const facts = compact
    ? ['HNSW graph', 'queried forever']
    : ['HNSW graph · queried forever'];
  return (
    <g>
      <EmojiImage
        asset={EMOJI.database}
        x={tile.x + 16}
        y={tile.y + (compact ? 42 : 40)}
        size={DIAGRAM_ICON_SIZE.secondary}
      />
      <text
        x={tile.x + 46}
        y={tile.y + 58}
        fill="var(--text-heading)"
        className={styles.tileTitle}
      >
        Stored once
      </text>
      {facts.map((line, index) => (
        <text
          key={line}
          x={compact ? tile.x + 46 : tile.x + 16}
          y={tile.y + (compact ? 74 + index * 14 : 74)}
          fill="var(--text-muted)"
          className={styles.noteText}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/** The corpus the index was built from, in the shared concept-chip anatomy: the
 * query figure's index is not an empty tile, it already holds these vectors. */
function ProvenanceStrip({
  tile,
  compact,
  items,
}: {
  tile: Region;
  compact?: boolean;
  items: readonly ConceptItem[];
}) {
  const step = (tile.width - 32) / items.length;
  return (
    <g>
      {items.map((item, index) => (
        <ConceptChip
          key={item.label}
          item={item}
          x={tile.x + 16 + index * step}
          y={tile.y + (compact ? 44 : 42)}
          iconSize={DIAGRAM_ICON_SIZE.tertiary}
        />
      ))}
      <text
        x={tile.x + 16}
        y={tile.y + (compact ? 80 : 78)}
        fill="var(--text-muted)"
        className={styles.noteText}
      >
        stored once · queried forever
      </text>
    </g>
  );
}

// --- Build graph (EmbeddingIndexDiagram) -----------------------------------
// The graph the vectors are written into: the standing index first (its links,
// then its dots, so dots paint over link ends), then what this cycle adds — the
// drawn links, the arriving dots and the write pulse — which rolls back out at
// the wrap. Only the added elements animate: the framing and the caption stay
// put, because they describe the index, not this one write.
type BuildGraphNames = {
  settle: string;
  dotIn: (index: number) => string;
  pulse: (index: number) => string;
  linkIn: (key: string) => string;
};

function BuildGraph({
  region,
  compact,
}: {
  region: Region;
  compact?: boolean;
}) {
  const names = useBuildGraphNames();
  const glyph = compact
    ? SCATTER_GLYPH_SIZE.compact
    : SCATTER_GLYPH_SIZE.desktop;
  const drawn = partitionDrawn();
  return (
    <g aria-hidden="true">
      <style>{buildGraphCss(names, LOOP_MS)}</style>
      {/* The index as this cycle finds it: vectors and links already stored.
          They never fade, so the loop reads as another write, not a rebuild. */}
      <StoredLayer region={region} glyph={glyph} />
      {/* What this chunk's vectors add: each pops in as its glyph lands and
          connects, then rolls back out at the loop wrap. */}
      <AddedLayer
        names={names}
        region={region}
        glyph={glyph}
        compact={compact}
        drawn={drawn}
      />
    </g>
  );
}

/** The drawn links and entering dots, split by whether they belong to the close
 * pair: between them the two entry lists cover ENTRY_DOTS exactly once, so a
 * delivered vector can never go missing. */
type DrawnParts = {
  nearLinks: typeof DRAWN_LINKS;
  otherLinks: typeof DRAWN_LINKS;
  nearEntries: string[];
  otherEntries: string[];
};

function partitionDrawn(): DrawnParts {
  const nearLinks = DRAWN_LINKS.filter(
    (link) => similarityOf(link.from, link.to)?.tone === 'near'
  );
  const otherLinks = DRAWN_LINKS.filter(
    (link) => similarityOf(link.from, link.to)?.tone !== 'near'
  );
  const nearEntries = enteringNear(nearLinks);
  return {
    nearLinks,
    otherLinks,
    nearEntries,
    otherEntries: ENTRY_DOTS.filter((id) => !nearEntries.includes(id)),
  };
}

/** Everything this cycle adds on top of the standing index: the lone arrivals,
 * the breathing close pair, and the write rings. */
function AddedLayer({
  names,
  region,
  glyph,
  compact,
  drawn,
}: {
  names: BuildGraphNames;
  region: Region;
  glyph: number;
  compact?: boolean;
  drawn: DrawnParts;
}) {
  return (
    <g>
      {drawn.otherLinks.map((link) => (
        <GraphLink
          key={linkKey(link.from, link.to)}
          from={link.from}
          to={link.to}
          region={region}
          name={names.linkIn(linkKey(link.from, link.to))}
        />
      ))}
      {drawn.otherEntries.map((id) => (
        <GraphNode
          key={id}
          id={id}
          region={region}
          glyph={glyph}
          dotIn={names.dotIn(entryIndex(id))}
        />
      ))}
      <SettleGroup
        names={names}
        region={region}
        glyph={glyph}
        links={drawn.nearLinks}
        entries={drawn.nearEntries}
      />
      <WritePulses names={names} region={region} compact={compact} />
    </g>
  );
}

/** Indigo = the meaning relation: the two vectors that mean the same. The settle
 * breath scales the close pair together with its own link, so that link and
 * those dots render inside this group, where the dots never drift off the
 * line's ends. */
function SettleGroup({
  names,
  region,
  glyph,
  links,
  entries,
}: {
  names: BuildGraphNames;
  region: Region;
  glyph: number;
  links: DrawnParts['nearLinks'];
  entries: readonly string[];
}) {
  return (
    <g
      className={styles.neighbourBreathe}
      style={{ animationName: names.settle }}
    >
      {links.map((link) => (
        <GraphLink
          key={linkKey(link.from, link.to)}
          from={link.from}
          to={link.to}
          region={region}
          name={names.linkIn(linkKey(link.from, link.to))}
        />
      ))}
      {entries.map((id) => (
        <GraphNode
          key={id}
          id={id}
          region={region}
          glyph={glyph}
          dotIn={names.dotIn(entryIndex(id))}
        />
      ))}
    </g>
  );
}

/** The write rings: the last arrival, then its pair partner a beat later. */
function WritePulses({
  names,
  region,
  compact,
}: {
  names: BuildGraphNames;
  region: Region;
  compact?: boolean;
}) {
  return PULSES.map((pulse, index) => {
    const at = dotAt(dotById(pulse.id), region);
    return (
      <circle
        key={pulse.id}
        cx={at.x}
        cy={at.y}
        r={compact ? pulse.radius.compact : pulse.radius.desktop}
        className={styles.landingPulse}
        style={{ animationName: names.pulse(index) }}
      />
    );
  });
}

/** The standing vectors and links, painted before anything this cycle adds. */
function StoredLayer({ region, glyph }: { region: Region; glyph: number }) {
  return (
    <g>
      {STANDING_EDGES.map(([from, to]) => (
        <StandingEdge
          key={linkKey(from, to)}
          from={from}
          to={to}
          region={region}
        />
      ))}
      {SCATTER_DOTS.filter((dot) => !isEnteringDot(dot.id)).map((dot) => (
        <StandingNode key={dot.id} id={dot.id} region={region} glyph={glyph} />
      ))}
    </g>
  );
}

function enteringNear(links: readonly { from: string; to: string }[]) {
  return [
    ...new Set(
      links
        .flatMap((link) => [link.from, link.to])
        .filter((id) => isEnteringDot(id))
    ),
  ];
}

function useBuildGraphNames(): BuildGraphNames {
  const raw = useId().replace(/:/g, '');
  return {
    settle: `emb-settle-${raw}`,
    dotIn: (index) => `emb-dot-${raw}-${index}`,
    pulse: (index) => `emb-pulse-${raw}-${index}`,
    linkIn: (key) => `emb-link-${raw}-${key}`,
  };
}

// --- Query graph (SemanticSearchDiagram) -----------------------------------
// The same stored graph, drawn whole and still: querying never rebuilds it. Over
// it, one query vector crosses in and matches: the stored vectors nearest it
// light up (with the similarity relation drawn between them) while the rest stay
// dim. Everything this cycle adds rolls back at the wrap, leaving the index the
// figure found.
function QueryGraph({
  region,
  compact,
  spec,
}: {
  region: Region;
  compact?: boolean;
  spec: Extract<GraphSpec, { mode: 'query' }>;
}) {
  const names = useQueryGraphNames();
  const glyph = compact
    ? SCATTER_GLYPH_SIZE.compact
    : SCATTER_GLYPH_SIZE.desktop;
  return (
    <g aria-hidden="true">
      <style>{queryGraphCss(names, spec)}</style>
      {/* The index as the query finds it: every stored vector and link, neutral.
          Nothing here moves — querying reads the index. */}
      <QueriedIndex region={region} glyph={glyph} match={spec.match} />
      <MatchOverlay
        names={names}
        region={region}
        glyph={glyph}
        compact={compact}
        match={spec.match}
      />
    </g>
  );
}

/** The still index the query reads: every stored edge and vector, unanimated. */
function QueriedIndex({
  region,
  glyph,
  match,
}: {
  region: Region;
  glyph: number;
  match: QueryMatch;
}) {
  return (
    <>
      {GRAPH_EDGES.map(([from, to]) => (
        <StandingEdge
          key={linkKey(from, to)}
          from={from}
          to={to}
          region={region}
        />
      ))}
      {SCATTER_DOTS.map((dot) => (
        <StoredVector
          key={dot.id}
          dot={dot}
          region={region}
          glyph={glyph}
          label={match.labels[dot.id] ?? dot.label}
        />
      ))}
    </>
  );
}

/** The match begins only after the vector has arrived: each nearest stored
 * vector brightens, its link traces to the query and its ring answers. */
function MatchOverlay({
  names,
  region,
  glyph,
  compact,
  match,
}: {
  names: QueryGraphNames;
  region: Region;
  glyph: number;
  compact?: boolean;
  match: QueryMatch;
}) {
  const at = queryLandsAt(region, match);
  return (
    <>
      {match.nearest.map(dotById).map((dot, index) => (
        <MatchedVector
          key={dot.id}
          dot={dot}
          index={index}
          at={at}
          names={names}
          region={region}
          glyph={glyph}
          compact={compact}
          similarity={index === 0 ? match.similarity : undefined}
        />
      ))}
      <QueryVector names={names} glyph={glyph} at={at} />
    </>
  );
}

/** One nearest stored vector answering the query: its traced relation, its lit
 * glyph, and the ring that answers a beat after the line lands. */
function MatchedVector({
  dot,
  index,
  at,
  names,
  region,
  glyph,
  compact,
  similarity,
}: {
  dot: ScatterDot;
  index: number;
  at: Pt;
  names: QueryGraphNames;
  region: Region;
  glyph: number;
  compact?: boolean;
  similarity?: string;
}) {
  const pos = dotAt(dot, region);
  return (
    <g>
      <MatchLine
        from={at}
        to={pos}
        name={names.lineIn(index)}
        similarity={similarity}
      />
      <g
        className={styles.graphNode}
        style={{ animationName: names.lineIn(index) }}
      >
        <VectorGlyph
          x={pos.x - glyph / 2}
          y={pos.y - glyph / 2}
          size={glyph}
          color="var(--visual-indigo)"
        />
      </g>
      <circle
        cx={pos.x}
        cy={pos.y}
        r={compact ? 11 : 13}
        className={styles.queryRing}
        style={{ animationName: names.ring(index) }}
      />
    </g>
  );
}

/** The delivered query vector, and the label that names it. */
function QueryVector({
  names,
  glyph,
  at,
}: {
  names: QueryGraphNames;
  glyph: number;
  at: Pt;
}) {
  const style = {
    animationName: names.queryIn,
    transformOrigin: `${at.x}px ${at.y}px`,
  };
  return (
    <>
      <g className={styles.graphNode} style={style}>
        <VectorGlyph
          x={at.x - glyph / 2}
          y={at.y - glyph / 2}
          size={glyph}
          color="var(--visual-indigo)"
        />
      </g>
      <text
        x={at.x}
        y={at.y + glyph / 2 + 12}
        textAnchor="middle"
        fill="var(--visual-indigo)"
        className={`${styles.dotLabel} ${styles.graphNode}`}
        style={style}
      >
        query
      </text>
    </>
  );
}

type QueryGraphNames = {
  queryIn: string;
  lineIn: (index: number) => string;
  ring: (index: number) => string;
};

function useQueryGraphNames(): QueryGraphNames {
  const raw = useId().replace(/:/g, '');
  return {
    queryIn: `query-in-${raw}`,
    lineIn: (index) => `query-line-${raw}-${index}`,
    ring: (index) => `query-ring-${raw}-${index}`,
  };
}

/** A stored vector as the query finds it: neutral, with its label readable so
 * the reader can see what the index holds before the query answers. The match
 * overlay, not this node, supplies the highlight. */
function StoredVector({
  dot,
  region,
  glyph,
  label,
}: {
  dot: ScatterDot;
  region: Region;
  glyph: number;
  label?: string;
}) {
  const pos = dotAt(dot, region);
  const text = label ? dotLabel(dot, region, glyph) : undefined;
  return (
    <g>
      <g opacity={0.55}>
        <VectorGlyph
          x={pos.x - glyph / 2}
          y={pos.y - glyph / 2}
          size={glyph}
          color="var(--text-muted)"
        />
      </g>
      {text && label && (
        <text
          x={text.x}
          y={text.y}
          textAnchor={text.anchor}
          fill="var(--text-body)"
          className={styles.dotLabel}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** One query → nearest-vector relation. Only the closest carries the similarity
 * value; the rest trace the same relation without restating the number. */
function MatchLine({
  from,
  to,
  name,
  similarity,
}: {
  from: Pt;
  to: Pt;
  name: string;
  similarity?: string;
}) {
  const label = similarity ? similarityLabelPos(from, to, 1) : undefined;
  return (
    <>
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="var(--visual-indigo)"
        className={styles.queryLine}
        style={{ animationName: name }}
      />
      {label && similarity && (
        <text
          x={label.x}
          y={label.y}
          fill="var(--visual-indigo)"
          className={styles.similarityLabel}
          style={{ animationName: name }}
        >
          {similarity}
        </text>
      )}
    </>
  );
}

// --- Shared leaf primitives -------------------------------------------------
/** A vector already in the index: drawn as the same glyph, unlabelled and
 * dimmed, so labelled nodes read as the ones in play. */
function StandingNode({
  id,
  region,
  glyph,
}: {
  id: string;
  region: Region;
  glyph: number;
}) {
  const pos = dotAt(dotById(id), region);
  return (
    <g opacity={0.55}>
      <VectorGlyph
        x={pos.x - glyph / 2}
        y={pos.y - glyph / 2}
        size={glyph}
        color="var(--text-muted)"
      />
    </g>
  );
}

/** A link between two vectors already stored: part of the standing graph. */
function StandingEdge({
  from,
  to,
  region,
}: {
  from: string;
  to: string;
  region: Region;
}) {
  const a = dotAt(dotById(from), region);
  const b = dotAt(dotById(to), region);
  return (
    <line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      stroke="var(--border-default)"
      className={styles.graphEdge}
    />
  );
}

/** A drawn link is the similarity it stands for: when the pair carries a cosine
 * the line is labelled, and the outlier's lone line stays dashed and neutral (a
 * low similarity is a fact, not an error). */
function GraphLink({
  from,
  to,
  region,
  name,
}: {
  from: string;
  to: string;
  region: Region;
  name: string;
}) {
  const similarity = similarityOf(from, to);
  const a = dotAt(dotById(from), region);
  const b = dotAt(dotById(to), region);
  const tone = similarity?.tone;
  const dashed = tone === 'far';
  const stroke =
    tone === 'near'
      ? 'var(--visual-indigo)'
      : dashed
        ? 'var(--text-muted)'
        : 'var(--border-default)';
  const label = similarity
    ? similarityLabelPos(a, b, tone === 'near' ? 1 : -1)
    : undefined;
  const animation = { animationName: name };
  return (
    <>
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        pathLength={dashed ? undefined : 1}
        stroke={stroke}
        className={`${styles.graphEdge} ${
          dashed ? styles.graphEdgeDashed : styles.graphEdgeTrace
        }`}
        style={animation}
      />
      {label && similarity && (
        <text
          x={label.x}
          y={label.y}
          fill={stroke}
          className={styles.similarityLabel}
          style={animation}
        >
          {similarity.value}
        </text>
      )}
    </>
  );
}

/** One stored vector entering the graph: its glyph, its label, and the moment
 * it entered. The pop scales around the glyph's own centre. */
function GraphNode({
  id,
  region,
  glyph,
  dotIn,
}: {
  id: string;
  region: Region;
  glyph: number;
  dotIn: string;
}) {
  const dot = dotById(id);
  const pos = dotAt(dot, region);
  const label = dotLabel(dot, region, glyph);
  const isFar = dot.role === 'far';
  return (
    <g
      className={styles.graphNode}
      style={{ animationName: dotIn, transformOrigin: `${pos.x}px ${pos.y}px` }}
    >
      <VectorGlyph
        x={pos.x - glyph / 2}
        y={pos.y - glyph / 2}
        size={glyph}
        color={isFar ? 'var(--text-muted)' : 'var(--visual-indigo)'}
      />
      <text
        x={label.x}
        y={label.y}
        textAnchor={label.anchor}
        fill="var(--text-body)"
        className={styles.dotLabel}
      >
        {dot.label}
      </text>
    </g>
  );
}

type DotLabel = { x: number; y: number; anchor: 'start' | 'end' | 'middle' };

/** Neighbours label away from each other so the close pair stays readable, with a
 * gap that clears the glyph box rather than a dot's radius. The outlier labels to
 * the RIGHT: it is the lowest node, so a label under itself would meet the graph's
 * bottom caption (`near = related meaning`) at the tile heights both figures use. */
function dotLabel(dot: ScatterDot, region: Region, glyph: number): DotLabel {
  const pos = dotAt(dot, region);
  if (dot.role === 'far')
    return { x: pos.x + glyph / 2 + 10, y: pos.y + 3, anchor: 'start' };
  const partner = NEIGHBOUR_PAIR.find((id) => id !== dot.id);
  const anchor =
    partner && dotAt(dotById(partner), region).x > pos.x ? 'end' : 'start';
  const offset = glyph / 2 + 10;
  return {
    x: pos.x + (anchor === 'end' ? -offset : offset),
    y: pos.y + 3,
    anchor,
  };
}

// --- Keyframes --------------------------------------------------------------
// The animation must be explainable from the models alone, so every keyframe
// percentage is generated from the same millisecond markers the schedules use —
// never re-typed as magic percentages. Names are unique per figure instance
// (useId) because both figures can appear on one page.
function pct(ms: number, loopMs: number) {
  return `${((ms / loopMs) * 100).toFixed(2)}%`;
}

function gearCss(name: string, gear: ModelGear) {
  const at = (ms: number) => pct(ms, gear.loopMs);
  return `@keyframes ${name} {
    0%, ${at(gear.startMs)} { transform: rotate(0turn); }
    ${at(gear.startMs + gear.turnMs)}, 100% { transform: rotate(${gear.turns}turn); }
  }`;
}

function buildGraphCss(names: BuildGraphNames, loopMs: number) {
  const at = (ms: number) => pct(ms, loopMs);
  const lead = at(LANDING_MS - LANDING_BEAT.leadMs);
  const done = at(LANDING_MS + LANDING_BEAT.holdMs);
  const settle = `@keyframes ${names.settle} {
    0%, ${lead}, ${done}, 100% { transform: scale(1); }
    ${at(LANDING_MS)} { transform: scale(1.06); }
  }`;
  const pulses = PULSES.map((pulse, index) =>
    pulseRule(names, at, pulse, index)
  ).join('\n');
  const dots = ENTRY_ARRIVAL_MS.map((arrival, index) =>
    dotInRule(names, at, arrival, index)
  ).join('\n');
  const links = DRAWN_LINKS.map((link) => linkInRule(names, at, link)).join(
    '\n'
  );
  return [settle, pulses, dots, links].join('\n');
}

/** One write ring: the vector lands, then the ring answers it (rise), holds its
 * moment, and clears — so the primary and the softer secondary read as two
 * events rather than one flicker. */
function pulseRule(
  names: BuildGraphNames,
  at: (ms: number) => string,
  pulse: (typeof PULSES)[number],
  index: number
) {
  const start = at(pulse.atMs);
  const peak = at(pulse.atMs + PULSE_BEAT.riseMs);
  const done = at(pulse.atMs + PULSE_BEAT.riseMs + PULSE_BEAT.holdMs);
  return `@keyframes ${names.pulse(index)} {
    0%, ${start} { opacity: 0; }
    ${peak} { opacity: ${pulse.opacity}; }
    ${done}, 100% { opacity: 0; }
  }`;
}

/** One arriving vector: its dot pops in the instant its glyph lands, then rolls
 * back out at the wrap. A single curve covers both directions on purpose — an
 * element that both enters and rolls back in one animation cannot use per-phase
 * easings (an `animation-timing-function` inside a keyframe is only substituted
 * literally). */
function dotInRule(
  names: BuildGraphNames,
  at: (ms: number) => string,
  arrival: number,
  index: number
) {
  return `@keyframes ${names.dotIn(index)} {
    0%, ${at(arrival)} { opacity: 0; transform: scale(0.55); }
    ${at(arrival + DOT_ENTRY_MS)}, ${at(FADE_OUT_START_MS)} { opacity: 1; transform: scale(1); }
    ${at(FADE_OUT_START_MS + FADE_OUT_MS)}, 100% { opacity: 0; transform: scale(1); }
  }`;
}

/** A repeating dash pattern cannot be revealed by shifting it, so only a solid
 * link traces from node to node; a labelled dashed line fades in instead. */
function linkInRule(
  names: BuildGraphNames,
  at: (ms: number) => string,
  link: (typeof DRAWN_LINKS)[number]
) {
  const traced = similarityOf(link.from, link.to)?.tone !== 'far';
  const start = traced ? ' stroke-dashoffset: 1;' : '';
  const drawn = traced ? ' stroke-dashoffset: 0;' : '';
  return `@keyframes ${names.linkIn(linkKey(link.from, link.to))} {
    0%, ${at(link.beginMs)} { opacity: 0;${start} }
    ${at(link.beginMs + CONNECT_DRAW_MS)}, ${at(FADE_OUT_START_MS)} { opacity: 1;${drawn} }
    ${at(FADE_OUT_START_MS + FADE_OUT_MS)}, 100% { opacity: 0;${drawn} }
  }`;
}

/** The query overlay's keyframes: the vector delivered by the model train fades
 * into the space, then the nearest links trace and their rings answer. All three
 * roll back together at the wrap, so the match can replay over a still index. */
function queryGraphCss(
  names: QueryGraphNames,
  spec: Extract<GraphSpec, { mode: 'query' }>
) {
  const p = (ms: number) => pct(ms, SEARCH_LOOP_MS);
  const query = `@keyframes ${names.queryIn} {
    0%, ${p(QUERY_VECTOR_IN_MS)} { opacity: 0; transform: scale(0.6); }
    ${p(MATCH_MS)}, ${p(SEARCH_FADE_OUT_START_MS)} { opacity: 1; transform: scale(1); }
    ${p(SEARCH_FADE_OUT_START_MS + FADE_OUT_MS)}, 100% { opacity: 0; transform: scale(1); }
  }`;
  const links = spec.match.nearest.map((_, index) =>
    matchLineRule(names, p, index)
  );
  const rings = spec.match.nearest.map((_, index) =>
    queryRingRule(names, p, index)
  );
  return [query, ...links, ...rings].join('\n');
}

function matchLineRule(
  names: QueryGraphNames,
  p: (ms: number) => string,
  index: number
) {
  const begin = MATCH_MS + index * MATCH_STAGGER_MS;
  const drawn = Math.min(SEARCH_FADE_OUT_START_MS, begin + MATCH_DRAW_MS);
  return `@keyframes ${names.lineIn(index)} {
    0%, ${p(begin)} { opacity: 0; }
    ${p(drawn)}, ${p(SEARCH_FADE_OUT_START_MS)} { opacity: 1; }
    ${p(SEARCH_FADE_OUT_START_MS + FADE_OUT_MS)}, 100% { opacity: 0; }
  }`;
}

function queryRingRule(
  names: QueryGraphNames,
  p: (ms: number) => string,
  index: number
) {
  const begin = MATCH_MS + index * MATCH_STAGGER_MS;
  return `@keyframes ${names.ring(index)} {
    0%, ${p(begin)} { opacity: 0; transform: scale(0.6); }
    ${p(begin + MATCH_DRAW_MS)}, ${p(SEARCH_FADE_OUT_START_MS)} { opacity: 0.85; transform: scale(1); }
    ${p(SEARCH_FADE_OUT_START_MS + FADE_OUT_MS)}, 100% { opacity: 0; transform: scale(1); }
  }`;
}
