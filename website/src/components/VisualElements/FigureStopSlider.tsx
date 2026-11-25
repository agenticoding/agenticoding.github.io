import { useId } from 'react';

import styles from './Figure.module.css';

/** One published stop on an axis: the value the model accepts, and its words. */
export type Stop = {
  key: number;
  label: string;
  spoken: string;
};

type StopSliderProps = {
  /** The precise name the browser contracts hold the axis to. */
  label: string;
  /** The visible caption: the axis's unit rides it, so the ends stay numbers. */
  caption: string;
  stops: readonly Stop[];
  selected: number;
  onStop: (stop: Stop) => void;
  /** This axis's contract hook, e.g. `state`, `questions`, `context`. */
  axis: string;
  /** The axis's own scope line: what it moves, or what it leaves alone. */
  note?: string;
};

/**
 * An ordinal track: the stops are the guide's published values, not a continuous
 * range, so the handle moves between them. Both ends print their own number,
 * because a track that states only its position does not say its span.
 *
 * WHY shared: every workload lever on the page is the same thing — a published
 * value the reader picks — so one geometry means a handle always reads as the
 * same kind of control. The chip row stays what it is elsewhere: a filter.
 */
export function FigureStopSlider({
  label,
  caption,
  stops,
  selected,
  onStop,
  axis,
  note,
}: StopSliderProps) {
  const captionId = useId();
  if (!stops.length) return null;
  const found = stops.findIndex((stop) => stop.key === selected);
  const index = found < 0 ? 0 : found;
  const stop = stops[index];

  return (
    // The stops the handle can take travel as data: a contract reads the same
    // ordinals the handle uses instead of re-deriving them from the labels.
    <div
      className={styles.leverField}
      role="group"
      aria-label={label}
      data-lever={axis}
      data-lever-stops={stops.map((entry) => entry.label).join(',')}
    >
      <p className={styles.leverHead}>
        <span id={captionId} className={styles.leverLabel}>
          {caption}
        </span>
        <span className={styles.leverValue}>{stop.label}</span>
      </p>
      <div className={styles.leverTrack}>
        <span className={styles.leverEnd} aria-hidden="true">
          {stops[0].label}
        </span>
        {/* Same strip and handle as the memory track: one control geometry for
            both levers, so the handle reads as the same kind of thing. */}
        <span className={styles.leverScale}>
          <input
            className={styles.budgetRange}
            type="range"
            min={0}
            max={stops.length - 1}
            step={1}
            value={index}
            aria-labelledby={captionId}
            aria-valuetext={stop.spoken}
            data-lever-input={axis}
            data-lever-value={stop.key}
            onChange={(event) =>
              onStop(stops[Number(event.currentTarget.value)] ?? stop)
            }
          />
        </span>
        <span className={styles.leverEnd} aria-hidden="true">
          {stops[stops.length - 1].label}
        </span>
      </div>
      {note ? <p className={styles.leverNote}>{note}</p> : null}
    </div>
  );
}
