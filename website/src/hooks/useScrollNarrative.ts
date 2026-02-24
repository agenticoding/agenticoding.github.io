import { useEffect, useRef, useState, type RefObject } from 'react';

export interface NarrativeChapter {
  id: string;
  label?: string;
}

export interface UseScrollNarrativeOptions {
  chapters: NarrativeChapter[];
  threshold?: number;
}

export interface UseScrollNarrativeResult {
  containerRef: RefObject<HTMLElement>;
  figureRef: RefObject<HTMLElement>;
  chapterRefs: RefObject<HTMLElement>[];
  activeChapter: string;
  progress: number;
  isActive: boolean;
}

export function useScrollNarrative({
  chapters,
  threshold = 0.4,
}: UseScrollNarrativeOptions): UseScrollNarrativeResult {
  const containerRef = useRef<HTMLElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  // Stable array of refs — length must not change between renders
  const chapterRefs = useRef<RefObject<HTMLElement>[]>(
    chapters.map(() => ({ current: null })),
  ).current;

  const [activeChapter, setActiveChapter] = useState(chapters[0]?.id ?? '');
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Track which chapter index is active so scroll handler can reference it
  const activeIndexRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // --- IntersectionObserver: chapter entry detection ---
    const computeProgress = () => {
      const ref = chapterRefs[activeIndexRef.current];
      const el = ref?.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress goes 0→1 as the chapter top moves from vh*threshold to 0
      const raw = 1 - rect.top / (vh * threshold);
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    const onScroll = () => computeProgress();

    const containerIO = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsActive(true);
          window.addEventListener('scroll', onScroll, { passive: true });
          computeProgress();
        } else {
          setIsActive(false);
          window.removeEventListener('scroll', onScroll);
        }
      },
      { threshold: 0 },
    );

    if (containerRef.current) containerIO.observe(containerRef.current);

    const chapterIO = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the highest intersectionRatio
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (!best || entry.intersectionRatio > best.intersectionRatio) {
            best = entry;
          }
        }
        if (!best || !best.isIntersecting) return;

        const idx = chapterRefs.findIndex((r) => r.current === best!.target);
        if (idx === -1) return;
        activeIndexRef.current = idx;
        setActiveChapter(chapters[idx].id);
        computeProgress();
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '0px 0px -20% 0px' },
    );

    chapterRefs.forEach((r) => {
      if (r.current) chapterIO.observe(r.current);
    });

    return () => {
      containerIO.disconnect();
      chapterIO.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [chapters, chapterRefs, threshold]);

  return {
    containerRef,
    figureRef,
    chapterRefs,
    activeChapter,
    progress,
    isActive,
  };
}
