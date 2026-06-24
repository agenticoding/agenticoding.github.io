import React, { useEffect, useRef, useState } from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import InlineEmojiImage from './InlineEmojiImage';
import styles from './MarketingDecoderInteractive.module.css';

type DecodePhase = 'source' | 'decode' | 'output' | 'note';

type TranslationExample = {
  id: string;
  claim: string;
  sourceUrl: string;
  sourceLabel: string;
  output: React.ReactNode;
  note: string;
  context: string;
};

const examples: TranslationExample[] = [
  {
    id: 'mythos-slow',
    context: 'Anthropic Mythos launch',
    claim: 'The most capable model we\u2019ve ever trained.',
    sourceUrl: 'https://www.anthropic.com/news/claude-fable-5-mythos-5',
    sourceLabel: 'anthropic.com',
    output: (
      <>
        Larger model: slower <ChapterLink href="#architecture-defines-the-tool-shape">inference</ChapterLink>{' '}
        and higher <ChapterLink href="#what-an-llm-actually-is">token cost</ChapterLink>.
      </>
    ),
    note: 'Use it when the quality gain beats slower feedback and premium spend.',
  },
  {
    id: 'gemini-responsiveness',
    context: 'Google Gemini 3.5 Flash',
    claim: '4x faster than competing frontier models.',
    sourceUrl:
      'https://blog.google/innovation-and-ai/technology/ai/google-io-2026-all-our-announcements/',
    sourceLabel: 'blog.google',
    output: (
      <>
        Higher <ChapterLink href="#architecture-defines-the-tool-shape">token throughput</ChapterLink>{' '}
        improves perceived responsiveness.
      </>
    ),
    note: 'Human wait time improves; end-to-end task time still depends on tool calls and review.',
  },
  {
    id: 'opus-longctx',
    context: 'Anthropic Opus 4.7 launch',
    claim: 'The most consistent long-context performance of any model we tested.',
    sourceUrl: 'https://www.anthropic.com/news/claude-opus-4-7',
    sourceLabel: 'anthropic.com',
    output: (
      <>
        Stable agent loops do not guarantee accurate{' '}
        <ChapterLink href="#long-context-is-not-reliable-memory">retrieval at 1M tokens</ChapterLink>.
      </>
    ),
    note: 'Long context buys capacity; retrieval quality still needs chunking and verification.',
  },
  {
    id: 'opus-price',
    context: 'Anthropic Opus 4.5 launch',
    claim: 'The real SOTA at a price point where it can be your go-to model.',
    sourceUrl: 'https://www.anthropic.com/news/claude-opus-4-5',
    sourceLabel: 'anthropic.com',
    output: (
      <>
        Lower price exposed Opus 4 as{' '}
        <ChapterLink href="#architecture-defines-the-tool-shape">overpriced infrastructure</ChapterLink>,
        not a new default.
      </>
    ),
    note: 'The lesson is efficiency: Opus 4 quality was trapped behind avoidable premium pricing.',
  },
  {
    id: 'gpt-multimodal',
    context: 'OpenAI GPT-5.5 launch',
    claim: 'Natively omnimodal. Best-in-class agentic, cross-modal design.',
    sourceUrl:
      'https://lushbinary.com/blog/gpt-5-5-vs-claude-opus-4-7-comparison-benchmarks-pricing/',
    sourceLabel: 'lushbinary.com',
    output: (
      <>
        <ChapterLink href="#why-token-prediction-is-useful">Multimodal strength</ChapterLink>{' '}
        can coexist with weaker pure coding depth.
      </>
    ),
    note: 'Choose it for vision-to-code workflows; route text-only coding by measured quality.',
  },
];

const phases: DecodePhase[] = ['source', 'decode', 'output', 'note'];
const phaseDurations: Record<DecodePhase, number> = {
  source: 3600,
  decode: 2600,
  output: 5200,
  note: 4200,
};

type AutoplayState = {
  activeIndex: number;
  phase: DecodePhase;
  paused: boolean;
  reducedMotion: boolean;
  selectExample: (index: number) => void;
  togglePaused: () => void;
};

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return reducedMotion;
}

function nextPhase(phase: DecodePhase) {
  return phases[(phases.indexOf(phase) + 1) % phases.length];
}

function useTranslatorAutoplay(): AutoplayState {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<DecodePhase>('source');
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (paused || reducedMotion) return undefined;
    const timer = window.setTimeout(() => {
      setPhase((current) => advancePhase(current, setActiveIndex));
    }, phaseDurations[phase]);
    return () => window.clearTimeout(timer);
  }, [paused, phase, reducedMotion]);

  return {
    activeIndex,
    phase: reducedMotion ? 'note' : phase,
    paused,
    reducedMotion,
    selectExample: (index) => {
      setActiveIndex(index);
      setPhase('source');
      setPaused(true);
    },
    togglePaused: () => setPaused((value) => !value),
  };
}

function advancePhase(
  current: DecodePhase,
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>
) {
  const next = nextPhase(current);
  if (next === 'source')
    setActiveIndex((index) => (index + 1) % examples.length);
  return next;
}

function ChapterLink({ children, href }: ChapterLinkProps) {
  return <a href={href}>{children}</a>;
}

type ChapterLinkProps = {
  children: React.ReactNode;
  href: string;
};

function RoleLabel({ asset, label }: { asset: EmojiAsset; label: string }) {
  return (
    <div className={styles.roleLabel}>
      <InlineEmojiImage asset={asset} className={styles.roleIcon} size={22} />
      <span>{label}</span>
    </div>
  );
}

function PhaseTimer({ duration }: PhaseTimerProps) {
  return (
    <span
      aria-hidden="true"
      className={styles.phaseTimer}
      style={{ '--phase-duration': `${duration}ms` } as React.CSSProperties}
    />
  );
}

type PhaseTimerProps = {
  duration: number;
};

function Pane({ active, children, duration, kind, title }: PaneProps) {
  const className = [styles.pane, styles[kind], active ? styles.active : null]
    .filter(Boolean)
    .join(' ');
  return (
    <section className={className} aria-current={active ? 'step' : undefined}>
      {title}
      {children}
      <PhaseTimer duration={duration} />
    </section>
  );
}

type PaneProps = {
  active: boolean;
  children: React.ReactNode;
  duration: number;
  kind: 'marketingPane' | 'engineeringPane';
  title: React.ReactNode;
};

function useActiveSelectorScroll(activeIndex: number, reducedMotion: boolean) {
  const selectorRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const selector = selectorRef.current;
    const button = buttonRefs.current[activeIndex];
    if (!selector || !button || selector.scrollWidth <= selector.clientWidth) return;
    button.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeIndex, reducedMotion]);

  return {
    selectorRef,
    setButtonRef: (index: number, button: HTMLButtonElement | null) => {
      buttonRefs.current[index] = button;
    },
  };
}

function ExampleSelector({ activeIndex, onSelect, reducedMotion }: ExampleSelectorProps) {
  const { selectorRef, setButtonRef } = useActiveSelectorScroll(activeIndex, reducedMotion);

  return (
    <nav
      className={styles.selector}
      aria-label="Translation examples"
      ref={selectorRef}
    >
      {examples.map((example, index) => (
        <ExampleSelectorButton
          active={activeIndex === index}
          example={example}
          index={index}
          key={example.id}
          onSelect={onSelect}
          setButtonRef={setButtonRef}
        />
      ))}
    </nav>
  );
}

type ExampleSelectorProps = {
  activeIndex: number;
  onSelect: (index: number) => void;
  reducedMotion: boolean;
};

function ExampleSelectorButton({
  active,
  example,
  index,
  onSelect,
  setButtonRef,
}: ExampleSelectorButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={styles.selectorButton}
      onClick={() => onSelect(index)}
      ref={(button) => setButtonRef(index, button)}
      type="button"
    >
      {example.context}
    </button>
  );
}

type ExampleSelectorButtonProps = {
  active: boolean;
  example: TranslationExample;
  index: number;
  onSelect: (index: number) => void;
  setButtonRef: (index: number, button: HTMLButtonElement | null) => void;
};

function PauseButton({ disabled, paused, onClick }: PauseButtonProps) {
  return (
    <button
      aria-label={disabled ? 'Motion reduced' : paused ? 'Resume autoplay' : 'Pause autoplay'}
      aria-pressed={paused || disabled}
      className={styles.pauseButton}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span
        aria-hidden="true"
        className={paused ? styles.playIcon : styles.pauseIcon}
      />
    </button>
  );
}

type PauseButtonProps = {
  disabled: boolean;
  paused: boolean;
  onClick: () => void;
};

export default function MarketingDecoderInteractive({
  compact = false,
}: PresentationAwareProps = {}) {
  const state = useTranslatorAutoplay();
  const example = examples[state.activeIndex];
  const className = [styles.container, compact ? styles.compact : null]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={className} aria-label="Marketing Translate widget">
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <div className={styles.titleLine}>
            <p className={styles.kicker}>Marketing Translate</p>
            <PauseButton
              disabled={state.reducedMotion}
              onClick={state.togglePaused}
              paused={state.paused}
            />
          </div>
          <h3>Translate launch claims into operational reality.</h3>
        </div>
      </header>
      <ExampleSelector
        activeIndex={state.activeIndex}
        onSelect={state.selectExample}
        reducedMotion={state.reducedMotion}
      />
      <div className={styles.translator}>
        <Pane
          active={state.phase === 'source'}
          duration={phaseDurations.source}
          kind="marketingPane"
          title={<RoleLabel asset={EMOJI.megaphone} label={`${example.context} says`} />}
        >
          <blockquote>
            <p>“{example.claim}”</p>
            <footer>
              —{' '}
              <cite>
                <a
                  href={example.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {example.sourceLabel}
                </a>
              </cite>
            </footer>
          </blockquote>
        </Pane>
        <div
          aria-current={state.phase === 'decode' ? 'step' : undefined}
          aria-label="Translate marketing claim into engineering reality"
          className={`${styles.decode} ${state.phase === 'decode' ? styles.active : ''}`}
          role="img"
        >
          <span className={styles.translatorGlyph} aria-hidden="true">
            <span
              className={`${styles.translatorArrow} ${styles.translatorArrowBack}`}
            />
            <span
              className={`${styles.translatorArrow} ${styles.translatorArrowForward}`}
            />
          </span>
        </div>
        <Pane
          active={state.phase === 'output'}
          duration={phaseDurations.output}
          kind="engineeringPane"
          title={<RoleLabel asset={EMOJI.tools} label="Engineering reality" />}
        >
          <p>{example.output}</p>
        </Pane>
      </div>
      <footer
        aria-current={state.phase === 'note' ? 'step' : undefined}
        className={`${styles.note} ${state.phase === 'note' ? styles.active : ''}`}
      >
        <RoleLabel asset={EMOJI.receipt} label="Decoder note" />
        <p>{example.note}</p>
        <PhaseTimer duration={phaseDurations.note} />
      </footer>
    </section>
  );
}
