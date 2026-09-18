/**
 * Chapter-audio engine: the only owner of the `<audio>` element.
 *
 * It publishes transport state to `store`, binds OS media controls, and remembers
 * position — so every visible surface stays a pure reader of one source of truth.
 * Rendering `<audio>` through React rather than
 * `new Audio()` keeps the element in the tree, so one effect can bind and unbind its
 * media events.
 */
import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import {
  deriveAudioOutline,
  neighbourSection,
  voiceIdAt,
  type AudioOutline,
} from '../../audiobook/outline';
import {
  type AudioMark,
  type AudioManifest,
  type ChapterAudio,
  MANIFEST_VERSION,
} from '../../audiobook/schemas';
import { useMounted } from '../../hooks/useMounted';
import { useTocEntries } from '../tocStore';
import AudioAnnouncer from './AudioAnnouncer';
import { bindMediaSession, syncPlaybackState } from './mediaSession';
import { publishAudio, type AudioView } from './store';
import { NUDGE_MS } from './AudioScrubber';
import { useAudioSource, useTransport, type AudioTransport } from './transport';
import manifestJson from '../../../static/audio/manifest.json';

const MANIFEST = manifestJson as AudioManifest;

// One-time module-scope guard: the static JSON import is typed by a blind cast, so a
// stale regenerated manifest would otherwise surface as a shape mismatch far from its
// cause. Pure JSON validation — safe during SSR, and it never runs per render.
if (MANIFEST.version !== MANIFEST_VERSION) {
  throw new Error(
    `audio manifest version ${MANIFEST.version}, expected ${MANIFEST_VERSION} — regenerate static/audio/manifest.json`
  );
}

export default function AudioEngine({
  chapterId,
  title,
}: {
  chapterId: string;
  title: string;
}): ReactNode {
  const audio = MANIFEST.chapters[chapterId];
  if (!audio) return null; // no rendered audio for this chapter ⇒ no player at all
  return <Engine key={chapterId} title={title} audio={audio} />;
}

function Engine({
  title,
  audio,
}: {
  title: string;
  audio: ChapterAudio;
}): ReactNode {
  // `preload="metadata"`, not `none`: the first press then starts the voice instead of
  // waiting for the stream to be negotiated, and the request is a small ranged one.
  const ref = useRef<HTMLAudioElement | null>(null);
  const mounted = useMounted();
  const outline = useAudioOutline(audio.marks);
  const transport = useTransport(ref, mounted);
  useAudioSource(ref, audio.file, mounted);
  useMediaSession(title, ref, transport, audio.durationMs, outline);
  const view = useView({ title, audio, outline, transport, ref });
  usePublishView(view);
  return (
    <>
      {mounted ? <audio ref={ref} preload="metadata" /> : null}
      <AudioAnnouncer view={view} />
    </>
  );
}

/** The TOC is the skeleton; the manifest only says which part of it has narration. */
function useAudioOutline(marks: readonly AudioMark[]): AudioOutline {
  const entries = useTocEntries();
  return useMemo(() => deriveAudioOutline(entries, marks), [entries, marks]);
}

function usePublishView(view: AudioView): void {
  useEffect(() => {
    publishAudio(view);
  }, [view]);
  // A chapter change unmounts this engine; clearing here is what stops the next page from
  // inheriting a transport that belongs to audio it does not have.
  useEffect(() => () => publishAudio(null), []);
}

/** Moving to the previous/next section is one behaviour with two callers — the
 * transport bar and the OS media controls — so it lives here once.
 *
 * Position is read from the element, not closed over: a stable identity keeps the
 * MediaSession handlers bound instead of tearing down on every timeupdate.
 */
function useSkipSection(
  ref: React.RefObject<HTMLAudioElement | null>,
  outline: AudioOutline,
  seek: AudioTransport['seek']
) {
  return useCallback(
    (direction: -1 | 1) => {
      const element = ref.current;
      if (!element) return;
      const row = neighbourSection(
        outline,
        element.currentTime * 1000,
        direction
      );
      if (row) seek(row.startMs);
    },
    [ref, outline, seek]
  );
}

/**
 * The media-key seek verbs get the scrubber's arrow-key notch: a fixed relative jump,
 * read from the element like useSkipSection so the bound handler never closes over a
 * stale timeupdate.
 */
function useNudge(
  ref: React.RefObject<HTMLAudioElement | null>,
  durationMs: number,
  seek: AudioTransport['seek']
) {
  return useCallback(
    (direction: -1 | 1) => {
      const element = ref.current;
      if (!element) return;
      const next = element.currentTime * 1000 + direction * NUDGE_MS;
      seek(Math.min(Math.max(next, 0), durationMs));
    },
    [ref, durationMs, seek]
  );
}

/**
 * One derived view per media event, built here rather than by each subscriber: two
 * surfaces computing section state independently is how they end up disagreeing.
 */
function useView({
  title,
  audio,
  outline,
  transport,
  ref,
}: {
  title: string;
  audio: ChapterAudio;
  outline: AudioOutline;
  transport: AudioTransport;
  ref: React.RefObject<HTMLAudioElement | null>;
}): AudioView {
  const { timeMs, playing, seek, toggle } = transport;
  const voiceId = useMemo(() => voiceIdAt(outline, timeMs), [outline, timeMs]);
  const skipSection = useSkipSection(ref, outline, seek);
  return useMemo(
    () => ({
      chapterTitle: title,
      timeMs,
      durationMs: audio.durationMs,
      playing,
      outline,
      voiceId,
      seek,
      toggle,
      skipSection,
    }),
    [
      title,
      timeMs,
      audio.durationMs,
      playing,
      outline,
      voiceId,
      seek,
      toggle,
      skipSection,
    ]
  );
}

/**
 * OS controls reuse the section model: the platform's previous/next track verbs are the
 * vocabulary a listener already has for "move through what I am hearing".
 */
function useMediaSession(
  title: string,
  ref: React.RefObject<HTMLAudioElement | null>,
  transport: AudioTransport,
  durationMs: number,
  outline: AudioOutline
): void {
  const { timeMs, playing, toggle, seek } = transport;
  const onSkip = useSkipSection(ref, outline, seek);
  const onNudge = useNudge(ref, durationMs, seek);
  // Handlers bind once per chapter — every identity is stable, so a timeupdate never
  // tears them down (the window where a media-key press was dropped).
  useEffect(
    () =>
      bindMediaSession({
        title,
        onPlay: toggle,
        onPause: toggle,
        onSkip,
        onNudge,
      }),
    [title, toggle, onSkip, onNudge]
  );
  // Lock-screen position rides the media clock; refreshing here never rebinds handlers.
  useEffect(() => {
    syncPlaybackState(playing, timeMs, durationMs);
  }, [playing, timeMs, durationMs]);
}
