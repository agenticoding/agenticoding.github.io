/**
 * A model's documented input → output channels, drawn with the book's token
 * shapes.
 *
 * Two forms, one mapping:
 * - `ModalityFlow` packs the shapes for a table cell, where only the drawing
 *   fits. The channel names travel in a screen-reader sentence.
 * - `LabeledModalityFlow` prints each shape beside its own channel name, for
 *   the expanded panel, where a reader must not have to decode the order.
 */
import { VISUALLY_HIDDEN } from './visuallyHidden';
import styles from './ModalityFlow.module.css';
import {
  isSink,
  modalitySentence,
  modalitySignal,
  type FlowProfile,
  type ModelModality,
  type ModalityOutput,
  type ModalitySink,
} from './modalityProfile';
import { TokenUnit } from './TokenUnit';
import { VectorGlyph } from './VectorGlyph';

const SHAPE = 12;
const SHAPE_GAP = 3;
const GROUP_GAP = 6;
const ARROW = 12;
/** One shape plus a pixel of room for its stroke on each side. */
const BOX = SHAPE + 2;
const MID = BOX / 2;

const groupWidth = (count: number) => count * SHAPE + (count - 1) * SHAPE_GAP;

const TokenShape = ({ modality }: { modality: ModelModality }) => (
  <svg
    viewBox={`0 0 ${BOX} ${BOX}`}
    className={styles.shape}
    aria-hidden="true"
    focusable="false"
  >
    <TokenUnit
      x={1}
      y={1}
      width={SHAPE}
      height={SHAPE}
      tone="violet"
      modality={modality}
      signal={modalitySignal(modality)}
    />
  </svg>
);

/** The sink: a decision, drawn as the check a label returns. Same box as one
 * channel chip, so the flow's pitch never changes with the last group. The
 * vector sink reuses the book's VectorGlyph — the same bracketed column the
 * retrieval chapter's diagrams draw as the embedder's output — so the icon that
 * means "vector" never splits into two drawings. The other sinks stay paths. */
const SINK_MARKS: Record<Exclude<ModalitySink, 'vector'>, string> = {
  // A decision: the tick a label returns.
  label: 'M 3.7 5.95 L 5.4 7.65 L 8.3 4.35',
  // A score: three ranked bars, the shortest first.
  score: 'M 3.7 8.2 V 6.6 M 6 8.2 V 5.4 M 8.3 8.2 V 4.1',
};

const Sink = ({ x, sink }: { x: number; sink: ModalitySink }) =>
  sink === 'vector' ? (
    // The vector sink is the glyph itself, drawn exactly as the retrieval
    // chapter draws an emitted vector — bracketed column, filled components —
    // so the calculator and the chapter share one icon.
    <VectorGlyph x={x} y={1} size={SHAPE} color="var(--visual-violet)" />
  ) : (
    <>
      <rect
        className={styles.sink}
        x={x}
        y={1}
        width={SHAPE}
        height={SHAPE}
        rx={2.5}
      />
      {/* Centred on the chip: the tick's own bounds (3.7–8.3 × 4.35–7.65) and
          the 1.2px stroke around them share the 12px box's centre, so the mark
          never leans up-left as it did at the old offset. */}
      <path
        className={styles.sinkMark}
        transform={`translate(${x} 1)`}
        d={SINK_MARKS[sink]}
      />
    </>
  );

/** The sink at the panel's own scale, with room for its stroke on each side. */
const SinkShape = ({ sink }: { sink: ModalitySink }) => (
  <svg
    viewBox={`0 0 ${BOX} ${BOX}`}
    className={styles.shape}
    aria-hidden="true"
    focusable="false"
  >
    <Sink x={1} sink={sink} />
  </svg>
);

/** One item of a group, at its own step on the group's pitch. */
const FlowItem = ({ item, x }: { item: ModalityOutput; x: number }) =>
  isSink(item) ? (
    <Sink x={x} sink={item} />
  ) : (
    <TokenUnit
      x={x}
      y={1}
      width={SHAPE}
      height={SHAPE}
      tone="violet"
      modality={item}
      signal={modalitySignal(item)}
    />
  );

const Group = ({ items, x }: { items: readonly ModalityOutput[]; x: number }) =>
  items.map((item, index) => (
    <FlowItem key={item} item={item} x={x + index * (SHAPE + SHAPE_GAP)} />
  ));

export function ModalityFlow({ profile }: { profile: FlowProfile }) {
  const inputWidth = groupWidth(profile.input.length);
  const arrowStart = inputWidth + GROUP_GAP;
  const outputX = arrowStart + ARROW + GROUP_GAP;
  const width = outputX + groupWidth(profile.output.length);
  return (
    <span className={styles.flow}>
      <svg
        viewBox={`0 0 ${width} ${BOX}`}
        className={styles.shapes}
        aria-hidden="true"
        focusable="false"
      >
        <Group items={profile.input} x={0} />
        {/* The arrow is the flow: without it, two groups read as one list. */}
        <path
          className={styles.arrow}
          d={`M ${arrowStart} ${MID} H ${arrowStart + ARROW - 2} M ${arrowStart + ARROW - 6} ${MID - 3.5} L ${arrowStart + ARROW - 2} ${MID} L ${arrowStart + ARROW - 6} ${MID + 3.5}`}
        />
        <Group items={profile.output} x={outputX} />
      </svg>
      <span style={VISUALLY_HIDDEN}>{modalitySentence(profile)}</span>
    </span>
  );
}

const Unit = ({ modality }: { modality: ModalityOutput }) => (
  <span className={styles.unit}>
    {isSink(modality) ? (
      <SinkShape sink={modality} />
    ) : (
      <TokenShape modality={modality} />
    )}
    <span>{modality}</span>
  </span>
);

/** The same flow, one channel name per shape; the arrow keeps the direction. */
export function LabeledModalityFlow({ profile }: { profile: FlowProfile }) {
  return (
    <span className={styles.labeled}>
      {profile.input.map((modality) => (
        <Unit key={modality} modality={modality} />
      ))}
      <span className={styles.direction} aria-hidden="true">
        →
      </span>
      {profile.output.map((modality) => (
        <Unit key={modality} modality={modality} />
      ))}
    </span>
  );
}

export default ModalityFlow;
