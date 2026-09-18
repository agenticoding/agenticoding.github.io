/**
 * The position half of the transport line: the chapter's progress, draggable.
 *
 * The strip carries the track and the thumb; the line's play button owns the left edge, so
 * this component never positions itself against a surface.
 */
import React, { type ReactNode, useEffect, useRef, useState } from 'react';

import { formatClock } from '../../audiobook/clock';
import { chapterProgress } from '../../audiobook/outline';
import { type AudioView } from './store';
import styles from './AudioScrubber.module.css';

export default function AudioScrubber({
  view,
}: {
  view: AudioView;
}): ReactNode {
  const scrub = useScrubPosition(view);
  const progress = chapterProgress(scrub.value, view.durationMs);
  const total = formatClock(view.durationMs);
  // One indicator, two meanings: the live position while the voice plays, the chapter's
  // length while it is paused. The knob and `aria-valuetext` already carry position, so
  // the paused label is free to carry the length instead.
  const label = view.playing ? formatClock(scrub.value) : total;
  return (
    <div className={styles.scrubber} data-audio-scrubber="">
      <div className={styles.strip}>
        <div className={styles.track} aria-hidden="true">
          <div
            className={styles.fill}
            data-audio-fill=""
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
        <ScrubberInput
          view={view}
          value={scrub.value}
          total={total}
          scrub={scrub}
        />
      </div>
      <span className={styles.total} data-audio-total="">
        {label}
      </span>
    </div>
  );
}

/** Arrow keys notch by this much — the notch a native `step` cannot serve (see ScrubberInput).
 * Exported because the OS media-key seek verbs land on the same notch (AudioEngine). */
export const NUDGE_MS = 5000;
const NUDGE_KEYS: Readonly<Record<string, -1 | 1>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowDown: -1,
};

/**
 * Arrow keys notch (Left/Right and Up/Down alike — `step="any"` would otherwise leave the
 * vertical arrows on a ~1ms native step); every other key keeps the range's own behaviour,
 * so Home/End land on the ends. Keyboard seeks land immediately, unlike a drag.
 */
function nudgeByArrow(
  view: AudioView,
  value: number,
  commit: (value: number) => void
): (event: React.KeyboardEvent<HTMLInputElement>) => void {
  return (event) => {
    const direction = NUDGE_KEYS[event.key];
    if (direction === undefined) return;
    event.preventDefault();
    commit(
      Math.min(Math.max(value + direction * NUDGE_MS, 0), view.durationMs)
    );
  };
}

type ScrubState = {
  value: number;
  /** Whether a pointer drag is in progress (keyboard input never sets it). */
  isDragging: () => boolean;
  /** Drag: display only — seeking per change stutters (iOS Safari). */
  onDrag: (value: number) => void;
  /** Keyboard: land the position on the element immediately. */
  commit: (value: number) => void;
  start: () => void;
  end: () => void;
};

function useScrubPosition(view: AudioView): ScrubState {
  const [value, setValue] = useState(view.timeMs);
  const latest = useRef(view.timeMs);
  const active = useRef(false);
  useEffect(() => {
    if (!active.current) setValue(view.timeMs);
  }, [view.timeMs]);
  const onDrag = (next: number) => {
    latest.current = next;
    setValue(next);
  };
  const commit = (next: number) => {
    onDrag(next);
    view.seek(next);
  };
  // Only a pointer press opens a drag; keyboard `change` events must not freeze the clock.
  const start = () => {
    active.current = true;
  };
  // Release and a canceled pointer share one teardown: land the drag once, free the clock.
  const end = () => {
    if (!active.current) return;
    active.current = false;
    view.seek(latest.current);
  };
  return {
    value,
    isDragging: () => active.current,
    onDrag,
    commit,
    start,
    end,
  };
}

/**
 * An `input` event outside a drag is a keyboard step the nudge handler didn't take
 * (Home/End/PageUp/PageDown) or a programmatic set: there is no release coming, so the
 * value must land on the clock immediately.
 */
function handleRangeChange(
  scrub: ScrubState
): (event: React.ChangeEvent<HTMLInputElement>) => void {
  return (event) => {
    const next = Number(event.currentTarget.value);
    if (scrub.isDragging()) scrub.onDrag(next);
    else scrub.commit(next);
  };
}

type ScrubberInputProps = {
  view: AudioView;
  value: number;
  total: string;
  scrub: ScrubState;
};

function ScrubberInput({
  view,
  value,
  total,
  scrub,
}: ScrubberInputProps): ReactNode {
  // `step="any"`: the value space of a range is `min + n*step`, so a step grid can never hold
  // `max` when the chapter's length is not a multiple of it — the thumb stopped one notch short
  // of the end while the fill (the media clock) read 100%. The notch moves to `nudgeByArrow`.
  return (
    <input
      type="range"
      min="0"
      max={view.durationMs}
      step="any"
      value={value}
      aria-label="Chapter audio position"
      aria-valuetext={`${formatClock(value)} of ${total}`}
      onPointerDown={scrub.start}
      onPointerUp={scrub.end}
      onPointerCancel={scrub.end}
      onKeyUp={scrub.end}
      onBlur={scrub.end}
      onKeyDown={nudgeByArrow(view, value, scrub.commit)}
      onChange={handleRangeChange(scrub)}
    />
  );
}
