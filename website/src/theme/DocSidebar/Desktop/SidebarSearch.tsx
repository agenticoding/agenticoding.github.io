import {type ReactNode, useState, useRef, useEffect, useCallback} from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import SearchBar from '@theme/SearchBar';
import styles from './styles.module.css';

type SearchPhase = 'idle' | 'mounting' | 'active' | 'collapsing';

export default function SidebarSearch(): ReactNode {
  const [phase, setPhase] = useState<SearchPhase>('idle');
  const slotRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasBeenExpanded = useRef(false);
  const rAFHandle = useRef<number | null>(null);
  const isBrowser = useIsBrowser();

  const expand = useCallback(() => {
    setPhase(prev => {
      if (prev === 'active' || prev === 'mounting') return prev;
      if (prev === 'collapsing') return 'active';
      return 'mounting'; // from idle
    });
  }, []);

  const collapse = useCallback(() => {
    if (rAFHandle.current) {
      cancelAnimationFrame(rAFHandle.current);
      rAFHandle.current = null;
    }
    setPhase(prev => {
      if (prev === 'idle' || prev === 'collapsing') return prev;
      if (prev === 'mounting') return 'idle';
      return 'collapsing'; // from active
    });
  }, []);

  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.target !== e.currentTarget) return;
    setPhase(prev => (prev === 'collapsing' ? 'idle' : prev));
  }, []);

  // Double rAF: first frame commits opacity:0 paint, second triggers transition
  useEffect(() => {
    if (phase !== 'mounting') return;
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        rAFHandle.current = null;
        setPhase(prev => (prev === 'mounting' ? 'active' : prev));
      });
      rAFHandle.current = raf2;
    });
    rAFHandle.current = raf1;
    return () => {
      if (rAFHandle.current) {
        cancelAnimationFrame(rAFHandle.current);
        rAFHandle.current = null;
      }
    };
  }, [phase]);

  // Fallback: resolve collapsing if transitionend never fires (reduced motion, interrupted)
  useEffect(() => {
    if (phase !== 'collapsing') return;
    const timer = setTimeout(() => {
      setPhase(prev => (prev === 'collapsing' ? 'idle' : prev));
    }, 250);
    return () => clearTimeout(timer);
  }, [phase]);

  // Auto-focus input when active
  useEffect(() => {
    if (phase !== 'active' || !slotRef.current) return;
    hasBeenExpanded.current = true;
    requestAnimationFrame(() => {
      slotRef.current?.querySelector('input')?.focus();
    });
  }, [phase]);

  // Return focus to button on close
  useEffect(() => {
    if (phase !== 'idle' || !hasBeenExpanded.current) return;
    buttonRef.current?.focus();
  }, [phase]);

  // Cmd+K / Ctrl+K when not expanded
  useEffect(() => {
    if (!isBrowser || phase === 'active' || phase === 'mounting') return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        expand();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isBrowser, phase, expand]);

  // Escape when not idle
  useEffect(() => {
    if (!isBrowser || phase === 'idle') return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') collapse();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isBrowser, phase, collapse]);

  // Collapse on blur when input is empty
  useEffect(() => {
    if (phase !== 'active' || !slotRef.current) return;
    function onFocusOut(e: FocusEvent) {
      // Focus moving to close button — let its click handler decide
      if (buttonRef.current?.contains(e.relatedTarget as Node)) return;
      const slot = slotRef.current;
      if (!slot) return;
      requestAnimationFrame(() => {
        if (slot.contains(document.activeElement)) return;
        const input = slot.querySelector('input');
        if (input && input.value.length > 0) return;
        collapse();
      });
    }
    const slot = slotRef.current;
    slot.addEventListener('focusout', onFocusOut);
    return () => slot.removeEventListener('focusout', onFocusOut);
  }, [phase, collapse]);

  const showSearchBar = phase !== 'idle';
  const isExpanded = phase === 'active';
  const showClose = phase === 'mounting' || phase === 'active';

  return (
    <>
      <div
        ref={slotRef}
        className={styles.searchSlot}
        data-search-active={isExpanded || undefined}
        onTransitionEnd={handleTransitionEnd}
      >
        {showSearchBar && <SearchBar />}
      </div>
      <button
        ref={buttonRef}
        type="button"
        className={styles.searchButton}
        onClick={showClose ? collapse : expand}
        aria-expanded={showClose}
        aria-label={showClose ? 'Close search' : 'Open search'}
        title={showClose ? 'Close search' : 'Search (\u2318K)'}
      >
        {showClose ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <line x1="9.68" y1="9.68" x2="14" y2="14" />
          </svg>
        )}
      </button>
    </>
  );
}
