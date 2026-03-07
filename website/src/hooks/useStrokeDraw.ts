import { RefObject, useEffect, useRef } from 'react';
import { usePhaseProgress } from './usePhaseProgress';

/**
 * SVG stroke-draw animation driven by scroll phase.
 *
 * Init effect ([]): measures getTotalLength(), writes strokeDasharray and
 * strokeDashoffset to the element so it starts fully hidden.
 *
 * Delegates to usePhaseProgress for the drive callback, which sets
 * strokeDashoffset = len * (1 - t) on every phase change — including scroll-back.
 *
 * Returns t (0–1) for callers that need interpolation (e.g. getPointAtLength).
 */
export function useStrokeDraw(
  ref: RefObject<SVGGeometryElement | null>,
  phase: number,
  start: number,
  end: number,
): number {
  const lenRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const len = el.getTotalLength();
    lenRef.current = len;
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
  }, []);

  return usePhaseProgress(phase, start, end, (t) => {
    const el = ref.current;
    if (!el) return;
    el.style.strokeDashoffset = `${lenRef.current * (1 - t)}`;
  });
}
