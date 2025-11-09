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

interface Slide {
  type: 'title' | 'concept' | 'code' | 'comparison' | 'visual' | 'takeaway';
  title: string;
  subtitle?: string;
  content?: string[];
  language?: string;
  code?: string;
  caption?: string;
  component?: string;
  left?: { label: string; content: string[] };
  right?: { label: string; content: string[] };
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
    });

    // Cleanup
    return () => {
      if (revealRef.current) {
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
