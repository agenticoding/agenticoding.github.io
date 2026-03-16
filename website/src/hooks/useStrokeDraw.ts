import { RefObject, useEffect, useRef } from 'react';
import { usePhaseProgress } from './usePhaseProgress';

/**
 * SVG stroke-draw animation driven by scroll phase.
 *
 * Init effect ([]): measures getTotalLength(), writes strokeDasharray and
 * strokeDashoffset to the element so it starts fully hidden.
 *
 * Lazy-init branch: if the element wasn't ready at mount (SSR / ref not yet
 * attached), re-measures on the first onProgress call and initialises both
 * strokeDasharray and strokeDashoffset so the path stays hidden until drawn.
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
    if (lenRef.current === 0) {
      const len = el.getTotalLength();
      lenRef.current = len;
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
    }
    el.style.strokeDashoffset = `${lenRef.current * (1 - t)}`;
  });
}
