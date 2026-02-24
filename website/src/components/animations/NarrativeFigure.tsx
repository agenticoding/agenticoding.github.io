import React, { type ReactNode } from 'react';
import { useScrollNarrative, type NarrativeChapter } from '../../hooks/useScrollNarrative';

interface NarrativeChapterDef extends NarrativeChapter {
  content: ReactNode;
}

interface NarrativeFigureProps {
  chapters: NarrativeChapterDef[];
  figure: (activeChapter: string, progress: number) => ReactNode;
  caption: string;
  className?: string;
}

const ACCENT_ACTIVE = 'var(--visual-cyan)';
const ACCENT_IDLE = 'var(--border-subtle)';

export default function NarrativeFigure({
  chapters,
  figure,
  caption,
  className,
}: NarrativeFigureProps) {
  const { containerRef, figureRef, chapterRefs, activeChapter, progress } =
    useScrollNarrative({ chapters });

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
    >
      <style>{`
        @media (min-width: 768px) {
          .narrative-layout { display: grid !important; grid-template-columns: 1fr 1fr; gap: var(--space-5); align-items: start; }
          .narrative-figure-col { position: sticky !important; top: var(--space-4); }
        }
      `}</style>

      <div className="narrative-layout" style={{ display: 'contents' }}>
        {/* Figure column */}
        <div
          ref={figureRef as React.RefObject<HTMLDivElement>}
          className="narrative-figure-col"
          style={{ position: 'static' }}
        >
          <figure style={{ margin: 0 }}>
            {figure(activeChapter, progress)}
            <figcaption
              style={{
                fontSize: 'var(--text-sm)',
                lineHeight: 'var(--lh-sm)',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginTop: 'var(--space-1)',
              }}
            >
              {caption}
            </figcaption>
          </figure>
        </div>

        {/* Chapters column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {chapters.map((chapter, i) => {
            const isActive = chapter.id === activeChapter;
            return (
              <div
                key={chapter.id}
                ref={chapterRefs[i] as React.RefObject<HTMLDivElement>}
                style={{
                  borderLeft: `3px solid ${isActive ? ACCENT_ACTIVE : ACCENT_IDLE}`,
                  paddingLeft: 'var(--space-3)',
                  opacity: isActive ? 1 : 0.6,
                  transition: 'border-color 0.3s ease, opacity 0.3s ease',
                }}
              >
                {chapter.label && (
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      lineHeight: 'var(--lh-sm)',
                      color: 'var(--text-muted)',
                      marginBottom: 'var(--space-1)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {chapter.label}
                  </div>
                )}
                {chapter.content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
