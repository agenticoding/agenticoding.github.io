import { useEffect, useRef, useState } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  staggerChildren?: boolean;
}

export function useScrollReveal(options?: ScrollRevealOptions): {
  ref: React.RefObject<HTMLElement>;
  isVisible: boolean;
} {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -80px 0px',
    once = true,
    staggerChildren = false,
  } = options ?? {};

  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        el.classList.add('reveal-is-visible');
        setIsVisible(true);

        if (staggerChildren) {
          Array.from(el.children).forEach((child, index) => {
            (child as HTMLElement).style.setProperty('--stagger-index', String(index));
          });
        }

        if (once) observer.disconnect();
      },
      { threshold, rootMargin },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [threshold, rootMargin, once, staggerChildren]);

  return { ref, isVisible };
}
