export interface ScrollElementRevealInput {
  phase: number;
  phaseEnd: number;
  viewportHeight: number;
  figureHeight: number;
  elementTop: number;
  elementHeight: number;
  earlyStart?: boolean;
  settleAtViewportFraction?: number;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

function phaseAtElementViewportY({
  phaseEnd,
  viewportHeight,
  figureHeight,
  elementTop,
  earlyStart = true,
}: Omit<ScrollElementRevealInput, 'phase' | 'elementHeight' | 'settleAtViewportFraction'>, elementOffset: number, viewportY: number) {
  const scrollStart = earlyStart ? viewportHeight + figureHeight : viewportHeight;
  const scrollEnd = (viewportHeight + figureHeight) * (1 - phaseEnd);
  if (scrollStart <= scrollEnd) return 1;

  // figureBottom = figure's rect.bottom when the element boundary at local
  // offset (elementTop + elementOffset) aligns to viewportY.
  const figureBottom = viewportY + figureHeight - (elementTop + elementOffset);
  return clamp((figureBottom - scrollStart) / (scrollEnd - scrollStart));
}

export function scrollElementRevealProgress(input: ScrollElementRevealInput) {
  const settleAtViewportFraction = input.settleAtViewportFraction ?? 0.5;
  const settleY = input.viewportHeight * settleAtViewportFraction;
  // DESIGN_SYSTEM.md §Scroll-Reveal Timing: begin when the element top enters
  // the viewport bottom; finish when the element center reaches the fixation
  // line (50vh desktop/tablet, 60vh mobile when requested by the caller).
  const start = phaseAtElementViewportY(input, 0, input.viewportHeight);
  const end = phaseAtElementViewportY(input, input.elementHeight / 2, settleY);
  const progress = start === end ? Number(input.phase >= end) : clamp((input.phase - start) / (end - start));

  return { start, end, progress };
}
