import React, { useEffect, useRef } from 'react';
import Reveal from 'reveal.js';
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css';
import styles from './RevealSlideshow.module.css';

// Import visual components that might be used in presentations
import CapabilityMatrix from '../VisualElements/CapabilityMatrix';
import UShapeAttentionCurve from '../VisualElements/UShapeAttentionCurve';
import WorkflowCircle from '../VisualElements/WorkflowCircle';
import GroundingComparison from '../VisualElements/GroundingComparison';
import ContextWindowMeter from '../VisualElements/ContextWindowMeter';

interface SpeakerNotes {
  talkingPoints: string;
  timing: string;
  discussion?: string;
  context?: string;
  transition?: string;
}

interface CodeExecutionStep {
  line: string;
  highlightType?: 'human' | 'prediction' | 'execution' | 'feedback' | 'summary';
  annotation?: string;
}

interface Slide {
  type: 'title' | 'concept' | 'code' | 'comparison' | 'visual' | 'takeaway' | 'marketingReality' | 'codeExecution';
  title: string;
  subtitle?: string;
  content?: string[];
  language?: string;
  code?: string;
  caption?: string;
  component?: string;
  left?: { label: string; content: string[] };
  right?: { label: string; content: string[] };
  metaphor?: { label: string; content: string[] };
  reality?: { label: string; content: string[] };
  steps?: CodeExecutionStep[];
  speakerNotes?: SpeakerNotes;
}

interface PresentationData {
  metadata: {
    title: string;
    lessonId: string;
    estimatedDuration: string;
    learningObjectives: string[];
  };
  slides: Slide[];
}

interface RevealSlideshowProps {
  presentation: PresentationData;
  onClose: () => void;
}

// Map of component names to actual components
const VISUAL_COMPONENTS = {
  CapabilityMatrix,
  UShapeAttentionCurve,
  WorkflowCircle,
  GroundingComparison,
  ContextWindowMeter,
};

export default function RevealSlideshow({ presentation, onClose }: RevealSlideshowProps) {
  const deckRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<Reveal.Api | null>(null);

  useEffect(() => {
    if (!deckRef.current) return;

    // Initialize Reveal.js
    const deck = new Reveal(deckRef.current, {
      // Presentation size
      width: 1280,
      height: 720,
      margin: 0.04,

      // Display controls
      controls: true,
      progress: true,
      center: true,
      hash: true,
      slideNumber: 'c/t',

      // Transition
      transition: 'slide',
      transitionSpeed: 'default',

      // Navigation
      keyboard: true,
      overview: true,
      touch: true,
      loop: false,

      // Plugins
      plugins: [],
    });

    deck.initialize().then(() => {
      revealRef.current = deck;
      deck.on('fragmentshown', handleFragmentShown);
    });

    // Cleanup
    return () => {
      if (revealRef.current) {
        revealRef.current.off('fragmentshown', handleFragmentShown);
        revealRef.current.destroy();
        revealRef.current = null;
      }
    };
  }, []);

  // Handle ESC key to close presentation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFragmentShown = (event: { fragment: HTMLElement }) => {
    const fragment = event.fragment;

    // Find any scrollable container parent
    const scrollContainer = fragment.closest(`.${styles.executionFlow}`) ||
                           fragment.closest(`.${styles.comparisonLeft}`) ||
                           fragment.closest(`.${styles.comparisonRight}`) ||
                           fragment.closest(`.${styles.metaphorColumn}`) ||
                           fragment.closest(`.${styles.realityColumn}`);

    if (scrollContainer) {
      // Scroll minimum amount needed to bring fragment into view
      // Does nothing if fragment already visible
      fragment.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',    // Only scroll if not visible
        inline: 'nearest'
      });
    }
  };

  const renderSlide = (slide: Slide, index: number) => {
    const key = `slide-${index}`;

    switch (slide.type) {
      case 'title':
        return (
          <section key={key} data-notes={formatSpeakerNotes(slide.speakerNotes)}>
            <h1>{slide.title}</h1>
            {slide.subtitle && <p className={styles.subtitle}>{slide.subtitle}</p>}
            {presentation.metadata.learningObjectives && (
              <div className={styles.objectives}>
                <h3>Learning Objectives</h3>
                <ul>
                  {presentation.metadata.learningObjectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );

      case 'concept':
        return (
          <section key={key} data-notes={formatSpeakerNotes(slide.speakerNotes)}>
            <h2>{slide.title}</h2>
            {slide.content && (
              <ul className={styles.bulletList}>
                {slide.content.map((item, i) => (
                  <li key={i} className="fragment">{item}</li>
                ))}
              </ul>
            )}
          </section>
        );

      case 'code':
        return (
          <section key={key} data-notes={formatSpeakerNotes(slide.speakerNotes)}>
            <h2>{slide.title}</h2>
            <pre className={styles.codeBlock}>
              <code className={`language-${slide.language || 'javascript'}`}>
                {slide.code}
              </code>
            </pre>
            {slide.caption && (
              <p className={styles.caption}>{slide.caption}</p>
            )}
          </section>
        );

      case 'comparison':
        return (
          <section key={key} data-notes={formatSpeakerNotes(slide.speakerNotes)}>
            <h2>{slide.title}</h2>
            <div className={styles.comparison}>
              {slide.left && (
                <div className={styles.comparisonLeft}>
                  <h3 className={styles.ineffective}>{slide.left.label}</h3>
                  <ul>
                    {slide.left.content.map((item, i) => (
                      <li key={i} className="fragment">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {slide.right && (
                <div className={styles.comparisonRight}>
                  <h3 className={styles.effective}>{slide.right.label}</h3>
                  <ul>
                    {slide.right.content.map((item, i) => (
                      <li key={i} className="fragment">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        );

      case 'marketingReality':
        return (
          <section key={key} data-notes={formatSpeakerNotes(slide.speakerNotes)}>
            <h2>{slide.title}</h2>
            <div className={styles.marketingReality}>
              {slide.metaphor && (
                <div className={styles.metaphorColumn}>
                  <h3 className={styles.metaphorHeading}>{slide.metaphor.label}</h3>
                  <ul>
                    {slide.metaphor.content.map((item, i) => (
                      <li key={i} className="fragment" data-fragment-index={i * 2}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {slide.reality && (
                <div className={styles.realityColumn}>
                  <h3 className={styles.realityHeading}>{slide.reality.label}</h3>
                  <ul>
                    {slide.reality.content.map((item, i) => (
                      <li key={i} className="fragment" data-fragment-index={i * 2 + 1}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        );

      case 'visual':
        const VisualComponent = slide.component ? VISUAL_COMPONENTS[slide.component] : null;
        return (
          <section key={key} data-notes={formatSpeakerNotes(slide.speakerNotes)}>
            <h2>{slide.title}</h2>
            <div className={styles.visualContainer}>
              {VisualComponent && <VisualComponent />}
              {!VisualComponent && (
                <p className={styles.error}>Visual component '{slide.component}' not found</p>
              )}
            </div>
            {slide.caption && (
              <p className={styles.caption}>{slide.caption}</p>
            )}
          </section>
        );

      case 'takeaway':
        return (
          <section key={key} data-notes={formatSpeakerNotes(slide.speakerNotes)}>
            <h2>{slide.title}</h2>
            {slide.content && (
              <ul className={styles.takeawayList}>
                {slide.content.map((item, i) => (
                  <li key={i} className="fragment">{item}</li>
                ))}
              </ul>
            )}
          </section>
        );

      case 'codeExecution':
        return (
          <section key={key} data-notes={formatSpeakerNotes(slide.speakerNotes)}>
            <h2>{slide.title}</h2>
            {slide.steps && (
              <div className={styles.executionFlow}>
                {slide.steps.map((step, i) => {
                  const highlightClass = step.highlightType
                    ? styles[`execution${step.highlightType.charAt(0).toUpperCase()}${step.highlightType.slice(1)}`]
                    : '';

                  return (
                    <div
                      key={i}
                      className={`${styles.executionStep} ${highlightClass} fragment`}
                      data-fragment-index={i}
                    >
                      <div className={styles.stepLine}>
                        {i > 0 && <span className={styles.flowArrow}>↓</span>}
                        <span className={styles.stepText}>{step.line}</span>
                      </div>
                      {step.annotation && (
                        <div className={styles.stepAnnotation}>{step.annotation}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );

      default:
        return (
          <section key={key}>
            <h2>Unknown slide type: {slide.type}</h2>
          </section>
        );
    }
  };

  const formatSpeakerNotes = (notes?: SpeakerNotes): string => {
    if (!notes) return '';

    const parts = [];

    if (notes.talkingPoints) {
      parts.push(`TALKING POINTS: ${notes.talkingPoints}`);
    }

    if (notes.timing) {
      parts.push(`TIMING: ${notes.timing}`);
    }

    if (notes.discussion) {
      parts.push(`DISCUSSION: ${notes.discussion}`);
    }

    if (notes.context) {
      parts.push(`CONTEXT: ${notes.context}`);
    }

    if (notes.transition) {
      parts.push(`TRANSITION: ${notes.transition}`);
    }

    return parts.join('\n\n');
  };

  return (
    <div className={styles.presentationOverlay}>
      <button className={styles.closeButton} onClick={onClose} title="Exit presentation (ESC)">
        ✕
      </button>
      <div className="reveal" ref={deckRef}>
        <div className="slides">
          {presentation.slides.map((slide, index) => renderSlide(slide, index))}
        </div>
      </div>
    </div>
  );
}
