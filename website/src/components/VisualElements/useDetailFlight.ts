/**
 * The disclosure flight both figures use: a row opens and closes its own panel
 * by its own height, one exact pixel per flight.
 *
 * WHY not a grid track from `0fr` to `1fr`: the box then grows at one rate and
 * the content is clipped to a fraction of that rate, so the card opens with a
 * hole under its first lines. WHY not `height: auto`: nothing interpolates to
 * `auto` yet. A measured height is exact, and the frame returns to `auto` once
 * it lands, so a later reprice of the panel is never clipped.
 *
 * The row reads `drawn` too: its card must stay resolved (focused spine, no
 * bottom border) until the panel is gone, or an open panel would hang below a
 * closed row for the length of the exit.
 */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type TransitionEvent,
} from 'react';

const reducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Layout effects measure before the paint; on the server there is nothing to
 * measure, and React warns about using one there. */
const useMeasure = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export type Flight = {
  /** Whether the panel's node exists: true for the whole flight, both ways. */
  drawn: boolean;
  closing: boolean;
  frameProps: {
    ref: RefObject<HTMLDivElement | null>;
    onTransitionEnd: (event: TransitionEvent<HTMLDivElement>) => void;
  };
};

export function useDetailFlight(expanded: boolean): Flight {
  const frame = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(expanded);
  // Open in the same commit as the click: an effect would land after a paint.
  if (expanded && !drawn) setDrawn(true);

  useMeasure(() => {
    const el = frame.current;
    if (!el) return undefined;
    if (reducedMotion()) {
      // Nothing to measure: with motion off the panel is simply there or not.
      if (!expanded) setDrawn(false);
      return undefined;
    }
    if (expanded) {
      // Reading `scrollHeight` flushes the collapsed line first, so the write
      // animates from it instead of landing at rest.
      el.style.height = `${el.scrollHeight}px`;
      return undefined;
    }
    // Closing: from `auto` nothing is interpolable, so pin the height the reader
    // sees and drop to zero once that pin has been through a style pass.
    el.style.height = `${el.offsetHeight}px`;
    el.getBoundingClientRect();
    const frameId = requestAnimationFrame(() => {
      el.style.height = '0px';
    });
    return () => cancelAnimationFrame(frameId);
  }, [expanded]);

  return {
    drawn,
    closing: drawn && !expanded,
    frameProps: {
      ref: frame,
      onTransitionEnd: (event) => {
        // Only the panel's own height ends a flight; its children never animate
        // a height of their own.
        if (event.target !== event.currentTarget) return;
        if (event.propertyName !== 'height') return;
        const el = frame.current;
        if (!el) return;
        // Landed open: hand the frame back to its content. Landed closed: drop
        // the node the reader no longer sees.
        if (expanded) el.style.height = 'auto';
        else setDrawn(false);
      },
    },
  };
}
