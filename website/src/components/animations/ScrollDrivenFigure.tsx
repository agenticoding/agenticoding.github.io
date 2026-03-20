import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import styles from './ScrollDrivenFigure.module.css';

// Context: phase 0.0 (not yet visible) → 1.0 (fully scrolled through)
interface AnimCtx { phase: number; phaseEnd: number; }
const AnimationPhaseContext = createContext<AnimCtx>({ phase: 0, phaseEnd: 0.5 });
export const useAnimationPhase = () => useContext(AnimationPhaseContext).phase;
/** Full context — use when children need phaseEnd to self-calibrate thresholds. */
export const useAnimationContext = () => useContext(AnimationPhaseContext);

interface ScrollDrivenFigureProps {
  children: ReactNode;
  caption?: string;
  className?: string;
  phaseEnd?: number;
  earlyStart?: boolean;
}

// Capability heuristic: browsers that support scroll-timeline handle JS scroll listeners well.
// Older browsers fall back to the lightweight IntersectionObserver path.
function supportsScrollTimeline(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return false;
  return CSS.supports('animation-timeline', 'scroll()');
}

export default function ScrollDrivenFigure({
  children,
  caption,
  className,
  phaseEnd = 0.5,
  earlyStart = false,
}: ScrollDrivenFigureProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setPhase(1);
      return;
    }

    const modernScroll = supportsScrollTimeline();

    if (!modernScroll) {
      // Older browsers: one-shot IntersectionObserver instead of scroll listener
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setPhase(1);
            io.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      io.observe(el);
      return () => io.disconnect();
    }

    // effectiveStart is locked on the first scroll/resize event (not mount) so that
    // child components with deferred heights (e.g. ResizeObserver-driven) are fully
    // rendered before we snapshot position. Mount only handles the "already scrolled
    // past" edge case.
    let isMount = true;
    let effectiveStart: number | null = null;

    const computePhase = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // earlyStart=false (default): animation begins as the element's bottom enters the viewport
      //   (start = vh). Good for below-fold figures — they start animating on first scroll-into-view.
      // earlyStart=true: animation begins when the element's top reaches the viewport bottom
      //   (start = vh + height). Good for figures that may already be partially visible on load.
      const start = earlyStart ? vh + rect.height : vh;
      const end = (vh + rect.height) * (1 - phaseEnd);
      if (start <= end) { setPhase(1); return; }
      const raw = (rect.bottom - start) / (end - start);

      if (isMount) {
        isMount = false;
        // Only snap to 1 if already scrolled past; leave everything else at phase=0.
        if (raw >= 1) setPhase(1);
        return;
      }

      // First scroll/resize: lock effectiveStart now that heights are stable.
      // If element is already in the animation window, anchor here so phase=0 at
      // this position and the animation plays forward from first scroll.
      // If element is below fold (raw ≤ 0), use original start — no adjustment needed.
      if (effectiveStart === null) {
        effectiveStart = (raw > 0 && raw < 1) ? rect.bottom : start;
      }

      const denom = end - effectiveStart;
      // denom < 0 when effectiveStart > end (tall element already past its animation range);
      // division yields > 1, which the clamp below collapses to 1 — intentional.
      const adjRaw = denom === 0 ? 1 : (rect.bottom - effectiveStart) / denom;
      setPhase(Math.min(1, Math.max(0, adjRaw)));
    };

    const onResize = () => {
      // Re-anchor effectiveStart on next scroll so resized layout is used.
      effectiveStart = null;
      computePhase();
    };

    document.addEventListener('scroll', computePhase, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    computePhase();

    return () => {
      document.removeEventListener('scroll', computePhase);
      window.removeEventListener('resize', onResize);
    };
  }, [phaseEnd, earlyStart]);

  const figureClass = clsx(styles.figure, className);

  return (
    <AnimationPhaseContext.Provider value={{ phase, phaseEnd }}>
      <figure className={figureClass}>
        <div ref={innerRef} className={styles.inner}>
          {children}
        </div>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </AnimationPhaseContext.Provider>
  );
}
