/**
 * Media-element plumbing for the chapter audio engine.
 *
 * Every hook here is deliberately return-value-only: position and play state are read
 * from the element and reported upward, so the engine stays the single place that
 * decides what the rest of the page is allowed to know.
 */
import { useCallback, useEffect, useState } from 'react';

export type AudioTransport = {
  timeMs: number;
  playing: boolean;
  seek: (ms: number) => void;
  toggle: () => void;
};

export function useTransport(
  ref: React.RefObject<HTMLAudioElement | null>,
  mounted: boolean
): AudioTransport {
  const clock = usePlaybackClock(ref, mounted);
  const controls = usePlaybackToggle(ref);
  return { ...clock, ...controls };
}

/**
 * Media events are the single source of truth for position and play state, and the element
 * is the only place position is kept: a chapter therefore always opens at 0. Nothing
 * outlives the element — the reader asked for the player to be reset on chapter navigation
 * and on reload, so no offset may be restored from a previous visit.
 */
function usePlaybackClock(
  ref: React.RefObject<HTMLAudioElement | null>,
  mounted: boolean
): Pick<AudioTransport, 'timeMs' | 'playing' | 'seek'> {
  const [timeMs, setTimeMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    return bindAudioEvents(element, {
      timeupdate: () => setTimeMs(element.currentTime * 1000),
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
    });
  }, [ref, mounted]);
  const seek = useCallback(
    (ms: number) => {
      const element = ref.current;
      if (!element) return;
      element.currentTime = ms / 1000;
      setTimeMs(ms); // optimistic: `timeupdate` is coarse while a seek settles
    },
    [ref]
  );
  return { timeMs, playing, seek };
}

/** Pause and play act on the element's own position, so a press never moves the listener. */
function usePlaybackToggle(
  ref: React.RefObject<HTMLAudioElement | null>
): Pick<AudioTransport, 'toggle'> {
  const toggle = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    if (!element.paused) {
      element.pause();
      return;
    }
    void element.play().catch((error: unknown) => {
      console.error('Chapter audio could not start', error);
    });
  }, [ref]);
  return { toggle };
}

/** Client-only media element: SSR emits none, so nothing is fetched before hydration. */
export function useAudioSource(
  ref: React.RefObject<HTMLAudioElement | null>,
  file: string,
  mounted: boolean
): void {
  useEffect(() => {
    const element = ref.current;
    if (element) element.src = `/audio/${file}`;
  }, [ref, file, mounted]);
}

function bindAudioEvents(
  element: HTMLAudioElement,
  handlers: Partial<Record<keyof HTMLMediaElementEventMap, () => void>>
): () => void {
  const entries = Object.entries(handlers) as [string, () => void][];
  entries.forEach(([type, handler]) => element.addEventListener(type, handler));
  return () =>
    entries.forEach(([type, handler]) =>
      element.removeEventListener(type, handler)
    );
}
