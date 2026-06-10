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
import { resolveScrollPhase, type ScrollPhaseState } from './scrollPhase';

// Context: phase 0.0 (not yet visible) → 1.0 (fully scrolled through)
interface AnimCtx { phase: number; phaseEnd: number; earlyStart: boolean; }
const AnimationPhaseContext = createContext<AnimCtx>({ phase: 0, phaseEnd: 0.5, earlyStart: true });
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
  earlyStart = true,
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

    let phaseState: ScrollPhaseState = { isMount: true, effectiveStart: null };

    const computePhase = () => {
      const rect = el.getBoundingClientRect();
      const next = resolveScrollPhase({
        rectBottom: rect.bottom,
        rectHeight: rect.height,
        viewportHeight: window.innerHeight,
        phaseEnd,
        earlyStart,
      }, phaseState);
      phaseState = { isMount: next.isMount, effectiveStart: next.effectiveStart };
      setPhase(next.phase);
    };

    const onResize = () => {
      phaseState = { ...phaseState, effectiveStart: null };
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
    <AnimationPhaseContext.Provider value={{ phase, phaseEnd, earlyStart }}>
      <figure className={figureClass}>
        <div ref={innerRef} className={styles.inner}>
          {children}
        </div>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </AnimationPhaseContext.Provider>
  );
}
