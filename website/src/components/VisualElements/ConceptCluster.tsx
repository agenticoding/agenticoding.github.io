import { useId } from 'react';
import { EmojiImage } from './ActorNodes';
import { DiagramTileSurface } from './DiagramTile';
import {
  CONCEPT_BEAT_STEP_MS,
  CONCEPT_LABEL_GAP,
  conceptBeatCss,
  conceptLabelBaseline,
} from './conceptClusterGeometry';
import { DIAGRAM_ICON_SIZE } from './diagramScale';
import { delayStyle } from './diagramMotion';
import type { EmojiAsset } from './emojiAssets';
import styles from './ConceptCluster.module.css';

// ConceptCluster — one tile of knowledge kinds, shared by every figure that shows
// "the material this pipeline reads": GroundingDistillationDiagram's grounding
// sources and EmbeddingIndexDiagram's corpus. The tile surface, the eyebrow/note
// header, the item anatomy (bare OpenMoji with its one-word label beside it) and
// the staggered arrival beat live here ONCE, so the two tiles read as the same
// kind of object instead of two lookalikes.
//
// Callers own the placement table, because their tiles differ in size — the same
// contract as ContextBand (shared anatomy, caller's geometry).

export type ConceptItem = { label: string; icon: EmojiAsset };

/** An icon's box, in the SVG coordinates of the tile it sits in. */
export type ConceptPlacement = { x: number; y: number };

/** The tile's own inner padding — the same 16 every other tile in the book uses. */
const HEADER_PAD = 16;

type ConceptClusterProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  eyebrow: string;
  note: string;
  items: readonly ConceptItem[];
  placements: readonly ConceptPlacement[];
  /** The figure's own loop: the beat rides it, but its own window is absolute. */
  cycleMs: number;
  /** When in the cycle the cluster answers the flow it belongs to. */
  startDelayMs?: number;
  iconSize?: number;
  staggerMs?: number;
  labelFill?: string;
};

export function ConceptCluster({
  x,
  y,
  width,
  height,
  eyebrow,
  note,
  items,
  placements,
  cycleMs,
  startDelayMs = 0,
  iconSize = DIAGRAM_ICON_SIZE.primary,
  staggerMs = CONCEPT_BEAT_STEP_MS,
  labelFill = 'var(--text-body)',
}: ConceptClusterProps) {
  // Named per instance: two figures loop on different cycles, so their beats have
  // different percentages and must not share one keyframe rule.
  const beatName = `concept-beat-${useId().replace(/:/g, '')}`;
  return (
    <g>
      <style>{conceptBeatCss(beatName, cycleMs)}</style>
      <DiagramTileSurface
        x={x}
        y={y}
        width={width}
        height={height}
        tone="context"
        weight={1.5}
        className={styles.surface}
      />
      <text
        x={x + HEADER_PAD}
        y={y + 24}
        fill="var(--text-heading)"
        className={styles.eyebrow}
      >
        {eyebrow}
      </text>
      <text
        x={x + HEADER_PAD}
        y={y + 44}
        fill="var(--text-muted)"
        className={styles.note}
      >
        {note}
      </text>
      {items.map((item, index) => (
        <ConceptClusterItem
          key={item.label}
          item={item}
          placement={placements[index]}
          iconSize={iconSize}
          labelFill={labelFill}
          beat={{
            name: beatName,
            cycleMs,
            delayMs: startDelayMs + index * staggerMs,
          }}
        />
      ))}
    </g>
  );
}

/** One knowledge kind: a bare OpenMoji with its one-word label beside it. The
 * shared chip anatomy, used both inside this tile and by figures that need the
 * same kinds in a smaller strip (EmbeddingTiles' index provenance row). */
export function ConceptChip({
  item,
  x,
  y,
  iconSize,
  labelFill = 'var(--text-body)',
}: {
  item: ConceptItem;
  x: number;
  y: number;
  iconSize: number;
  labelFill?: string;
}) {
  return (
    <g>
      <EmojiImage asset={item.icon} x={x} y={y} size={iconSize} />
      <text
        x={x + iconSize + CONCEPT_LABEL_GAP}
        y={y + conceptLabelBaseline(iconSize)}
        fill={labelFill}
        className={styles.label}
      >
        {item.label}
      </text>
    </g>
  );
}

function ConceptClusterItem({
  item,
  placement,
  iconSize,
  labelFill,
  beat,
}: {
  item: ConceptItem;
  placement: ConceptPlacement;
  iconSize: number;
  labelFill: string;
  beat: { name: string; cycleMs: number; delayMs: number };
}) {
  return (
    <g
      className={styles.item}
      style={{
        animationName: beat.name,
        animationDuration: `${beat.cycleMs}ms`,
        ...delayStyle(beat.delayMs),
      }}
    >
      <ConceptChip
        item={item}
        x={placement.x}
        y={placement.y}
        iconSize={iconSize}
        labelFill={labelFill}
      />
    </g>
  );
}
