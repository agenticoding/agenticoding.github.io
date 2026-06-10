export interface ScrollPhaseState {
  isMount: boolean;
  effectiveStart: number | null;
}

export interface ScrollPhaseInput {
  rectBottom: number;
  rectHeight: number;
  viewportHeight: number;
  phaseEnd: number;
  earlyStart: boolean;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Lock the animation baseline on first interaction so in-view loads don't
 * mount halfway through the reveal. This preserves the design contract:
 * initial render stays static; user scroll drives the narrative forward.
 */
export function resolveScrollPhase(
  input: ScrollPhaseInput,
  state: ScrollPhaseState,
): ScrollPhaseState & { phase: number } {
  const start = input.earlyStart ? input.viewportHeight + input.rectHeight : input.viewportHeight;
  const end = (input.viewportHeight + input.rectHeight) * (1 - input.phaseEnd);
  if (start <= end) return { phase: 1, isMount: false, effectiveStart: null };

  const raw = (input.rectBottom - start) / (end - start);
  if (state.isMount) {
    return { phase: raw >= 1 ? 1 : 0, isMount: false, effectiveStart: null };
  }

  const effectiveStart = state.effectiveStart ?? (raw > 0 && raw < 1 ? input.rectBottom : start);
  const denom = end - effectiveStart;
  const adjusted = denom === 0 ? 1 : (input.rectBottom - effectiveStart) / denom;
  return { phase: clamp(adjusted), isMount: false, effectiveStart };
}
