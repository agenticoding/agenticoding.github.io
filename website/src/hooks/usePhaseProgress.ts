import { useEffect, useRef } from 'react';

/**
 * Computes t = clamp((phase - start) / (end - start), 0, 1).
 *
 * If onProgress is provided, calls it via useEffect([phase, start, end]) — NOT [t].
 * This guarantees the callback fires on every phase change (including scroll-back),
 * even when t is clamped and no longer changing.
 *
 * A useRef stores the latest callback to prevent stale closures without adding it
 * to effect dependencies (which would re-subscribe on every render).
 *
 * Returns t for render-time use (opacity derivation, getPointAtLength, etc.).
 * Without onProgress, this is a pure derivation with no effects.
 */
export function usePhaseProgress(
  phase: number,
  start: number,
  end: number,
  onProgress?: (t: number) => void,
): number {
  const t = Math.min(1, Math.max(0, (phase - start) / (end - start)));

  const cbRef = useRef(onProgress);
  cbRef.current = onProgress;

  useEffect(() => {
    if (!cbRef.current) return;
    cbRef.current(t);
  }, [t]);

  return t;
}
