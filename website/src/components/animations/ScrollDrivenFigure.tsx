import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import styles from './ScrollDrivenFigure.module.css';

// Context: 0.0 (not yet visible) → 1.0 (fully scrolled through)
const AnimationPhaseContext = createContext<number>(0);
export const useAnimationPhase = () => useContext(AnimationPhaseContext);

interface ScrollDrivenFigureProps {
  children: ReactNode;
  caption?: string;
  className?: string;
  phaseEnd?: number;
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

    const mountBottom = el.getBoundingClientRect().bottom;

    const computePhase = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // phase=0 anchor: viewport edge for below-fold elements, mount position for above-fold.
      // phase=1 anchor: CSS cover <phaseEnd×100>% endpoint.
      const start = Math.min(mountBottom, vh);
      const end = (vh + rect.height) * (1 - phaseEnd);
      if (start <= end) { setPhase(1); return; }
      const raw = (rect.bottom - start) / (end - start);
      setPhase(Math.min(1, Math.max(0, raw)));
    };

    document.addEventListener('scroll', computePhase, { passive: true });
    window.addEventListener('resize', computePhase, { passive: true });

    return () => {
      document.removeEventListener('scroll', computePhase);
      window.removeEventListener('resize', computePhase);
    };
  }, [phaseEnd]);

  const figureClass = [
    styles.figure,
    noScrollTimeline ? styles.noScrollTimeline : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const innerClass = [styles.inner, revealed ? styles.revealed : '']
    .filter(Boolean)
    .join(' ');

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
