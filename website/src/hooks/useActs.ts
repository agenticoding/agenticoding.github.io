import { useMemo, useCallback } from 'react';

export type ActDef = { id: string; threshold: number };

/**
 * Phase-gated act hook (DESIGN_SYSTEM.md §Motion — Act System).
 * phase: 0–1, sourced from useAnimationPhase() (ScrollDrivenFigure context).
 * Acts are purely reactive to the current phase value — they re-evaluate on every
 * render and can reverse when phase decreases. Enforce monotonicity at the call site
 * with a useRef guard when one-way semantics are required.
 */
export function useActs(actDefs: ActDef[], phase: number) {
  const sorted = useMemo(
    () => [...actDefs].sort((a, b) => a.threshold - b.threshold),
    [actDefs],
  );

  const reachedIds = useMemo(
    () => new Set(sorted.filter((a) => phase >= a.threshold).map((a) => a.id)),
    [sorted, phase],
  );

  const currentActId = useMemo(() => {
    const r = sorted.filter((a) => phase >= a.threshold);
    return r.length ? r[r.length - 1].id : null;
  }, [sorted, phase]);

  const wasReached = useCallback((id: string) => reachedIds.has(id), [reachedIds]);
  const isCurrentAct = useCallback((id: string) => currentActId === id, [currentActId]);

  return { wasReached, isCurrentAct };
}
