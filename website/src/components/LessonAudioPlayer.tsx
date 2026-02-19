import React, { useState, useEffect, useRef } from 'react';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './LessonAudioPlayer.module.css';

interface AudioManifest {
  [key: string]: {
    audioUrl: string;
    size: number;
    format: string;
    generatedAt: string;
  };
}

export default function LessonAudioPlayer(): React.ReactElement | null {
  const { metadata } = useDoc();
  const { siteConfig } = useDocusaurusContext();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Load manifest and find audio for current page
  useEffect(() => {
    async function loadAudio() {
      try {
        const baseUrl = siteConfig.baseUrl;
        const manifestUrl = `${baseUrl}audio/manifest.json`;
        const response = await fetch(manifestUrl);

        if (!response.ok) {
          setIsLoading(false);
          return;
        }

        const manifest: AudioManifest = await response.json();

        // Get source file path from metadata
        const sourcePath = metadata.source.replace(/@site\/docs\//, '');

        // Look for matching audio in manifest
        const audioEntry = manifest[sourcePath];

        if (audioEntry) {
          // Prepend base URL for Docusaurus (audioUrl starts with /)
          const fullAudioUrl = `${baseUrl}${audioEntry.audioUrl.substring(1)}`;
          setAudioUrl(fullAudioUrl);
        }

        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    }

    loadAudio();
  }, [metadata.source, siteConfig.baseUrl]);

  // Update time display
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changePlaybackRate = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || !audioUrl) {
    return null;
  }

  return (
    <div
      className={styles.strip}
      data-playing={isPlaying || undefined}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <button
        className={styles.playButton}
        onClick={togglePlayPause}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <rect x="2" y="2" width="3.5" height="10" rx="0.5"/>
            <rect x="8.5" y="2" width="3.5" height="10" rx="0.5"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <path d="M4 2.5l8 4.5-8 4.5V2.5z"/>
          </svg>
        )}
      </button>

      <span className={styles.idleIcon} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9V8a5 5 0 0 1 10 0v1"/>
          <rect x="1" y="9" width="3" height="4" rx="1"/>
          <rect x="12" y="9" width="3" height="4" rx="1"/>
        </svg>
      </span>

      <span className={styles.labelText}>Audio companion</span>

      <input
        type="range"
        className={styles.seekBar}
        min="0"
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        style={{
          '--seek-progress': `${duration ? (currentTime / duration) * 100 : 0}%`
        } as React.CSSProperties}
        aria-label="Seek"
      />

      <span className={styles.timeDisplay}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <div className={styles.speedButtons} role="group" aria-label="Playback speed">
        {([1, 1.25, 1.5, 2] as const).map(rate => (
          <button
            key={rate}
            className={playbackRate === rate ? styles.rateActive : styles.rateInactive}
            onClick={() => changePlaybackRate(rate)}
            aria-label={`${rate}x speed`}
            aria-pressed={playbackRate === rate}
          >
            {rate}x
          </button>
        ))}
      </div>
    </div>
  );
}
