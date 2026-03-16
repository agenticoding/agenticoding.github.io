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

// Context: 0.0 (not yet visible) → 1.0 (fully scrolled through)
const AnimationPhaseContext = createContext<number>(0);
export const useAnimationPhase = () => useContext(AnimationPhaseContext);

interface ScrollDrivenFigureProps {
  children: ReactNode;
  caption?: string;
  className?: string;
  phaseEnd?: number;
  earlyStart?: boolean;
  skipReveal?: boolean;
}

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
  skipReveal = false,
}: ScrollDrivenFigureProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [noScrollTimeline, setNoScrollTimeline] = useState(false);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setPhase(1);
      setRevealed(true);
      return;
    }

    const cssSupported = supportsScrollTimeline();

    if (!cssSupported) {
      setNoScrollTimeline(true);

      // Fallback: IntersectionObserver one-shot reveal
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            setPhase(1);
            io.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      io.observe(el);
      return () => io.disconnect();
    }

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
      setPhase(Math.min(1, Math.max(0, raw)));
    };

    document.addEventListener('scroll', computePhase, { passive: true });
    window.addEventListener('resize', computePhase, { passive: true });
    computePhase();

    return () => {
      document.removeEventListener('scroll', computePhase);
      window.removeEventListener('resize', computePhase);
    };
  }, [phaseEnd, earlyStart]);

  const figureClass = clsx(styles.figure, noScrollTimeline && styles.noScrollTimeline, className);
  const innerClass  = clsx(styles.inner, revealed && styles.revealed, skipReveal && styles.skipReveal);

  return (
    <AnimationPhaseContext.Provider value={phase}>
      <figure className={figureClass}>
        <div
          ref={innerRef}
          className={innerClass}
          style={{ animationRange: `entry 0% cover ${phaseEnd * 100}%` } as React.CSSProperties}
        >
          {children}
        </div>
        {caption && <figcaption className={styles.figcaption}>{caption}</figcaption>}
      </figure>
    </AnimationPhaseContext.Provider>
  );
}
