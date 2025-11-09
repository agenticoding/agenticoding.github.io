import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './PresentationToggle.module.css';

// Lazy load RevealSlideshow to avoid bundling Reveal.js for all users
const RevealSlideshow = lazy(() => import('./RevealSlideshow'));

interface PresentationToggleProps {
  lessonPath: string;
}

export default function PresentationToggle({ lessonPath }: PresentationToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [presentation, setPresentation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPresentation, setHasPresentation] = useState(false);
  const baseUrl = useBaseUrl('/');

  // Check if presentation exists for this lesson
  useEffect(() => {
    const checkPresentation = async () => {
      try {
        const response = await fetch(`${baseUrl}presentations/manifest.json`);
        if (response.ok) {
          const manifest = await response.json();
          // Check if this lesson has a presentation
          setHasPresentation(!!manifest[lessonPath]);
        }
      } catch (err) {
        // Manifest doesn't exist yet, hide button
        setHasPresentation(false);
      }
    };

    checkPresentation();
  }, [baseUrl, lessonPath]);

  const loadPresentation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load manifest to get presentation URL
      const manifestResponse = await fetch(`${baseUrl}presentations/manifest.json`);
      if (!manifestResponse.ok) {
        throw new Error('Presentation manifest not found');
      }

      const manifest = await manifestResponse.json();
      const lessonData = manifest[lessonPath];

      if (!lessonData) {
        throw new Error('No presentation available for this lesson');
      }

      // Load presentation data
      const presentationResponse = await fetch(`${baseUrl.replace(/\/$/, '')}${lessonData.presentationUrl}`);
      if (!presentationResponse.ok) {
        throw new Error('Failed to load presentation');
      }

      const presentationData = await presentationResponse.json();
      setPresentation(presentationData);
      setIsOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to load presentation:', err);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, lessonPath]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setPresentation(null);
    } else {
      loadPresentation();
    }
  }, [isOpen, loadPresentation]);

  // Handle keyboard shortcut (Cmd/Ctrl + Shift + P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + P
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        handleToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle]);

  // Don't show button if no presentation exists
  if (!hasPresentation) {
    return null;
  }

  return (
    <>
      <button
        className={styles.toggleButton}
        onClick={handleToggle}
        disabled={loading}
        title="Toggle presentation mode (Cmd/Ctrl + Shift + P)"
      >
        {loading ? (
          <span className={styles.spinner}>⏳</span>
        ) : (
          <span className={styles.icon}>🎭</span>
        )}
        <span className={styles.label}>
          {loading ? 'Loading...' : 'Present'}
        </span>
      </button>

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {isOpen && presentation && (
        <Suspense fallback={<div className={styles.loadingOverlay}>Loading presentation...</div>}>
          <RevealSlideshow
            presentation={presentation}
            onClose={() => {
              setIsOpen(false);
              setPresentation(null);
            }}
          />
        </Suspense>
      )}
    </>
  );
}
