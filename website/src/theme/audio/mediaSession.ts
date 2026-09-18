/**
 * OS-level media controls: media keys, headset buttons, lock screen, notifications.
 *
 * Section skipping maps to the platform's previous/next *track* verbs, because a
 * narrated chapter is a list of sections rather than one opaque track — those are the
 * verbs a listener already knows for "move through the thing I am hearing".
 *
 * The seek verbs bind to a small fixed relative jump — the same notch the scrubber's
 * arrow keys use — because an unbound seek verb gets no response at all on most
 * platforms, rather than any platform default.
 */
export type MediaHandlers = {
  title: string;
  onPlay: () => void;
  onPause: () => void;
  onSkip: (direction: -1 | 1) => void;
  onNudge: (direction: -1 | 1) => void;
};

const BOUND: MediaSessionAction[] = [
  'play',
  'pause',
  'previoustrack',
  'nexttrack',
  'seekbackward',
  'seekforward',
];

/**
 * Lock-screen truth: play state plus position, refreshed on every media event (~4x/s).
 * Pure bookkeeping — unlike handler binding, refreshing here never drops a media-key press.
 */
export function syncPlaybackState(
  playing: boolean,
  timeMs: number,
  durationMs: number
): void {
  const session = navigator.mediaSession;
  if (!session) return;
  session.playbackState = playing ? 'playing' : 'paused';
  try {
    session.setPositionState({
      duration: durationMs / 1000,
      playbackRate: 1,
      position: timeMs / 1000,
    });
  } catch {
    // Transiently invalid values while a seek settles (position past duration, duration 0);
    // the next timeupdate retries with values the platform accepts.
  }
}

export function bindMediaSession(handlers: MediaHandlers): () => void {
  const session = navigator.mediaSession;
  // Older browsers simply do not expose the API; a chapter read aloud is not the place
  // to demand hardware media keys.
  if (!session || typeof MediaMetadata === 'undefined') return () => undefined;
  session.metadata = new MediaMetadata({
    title: handlers.title,
    artist: 'Agentic Coding',
  });
  BOUND.forEach((action) =>
    setHandler(session, action, handlerFor(action, handlers))
  );
  // Handlers, metadata and state must all die together: a chapter without audio that
  // inherits them still shows the previous chapter on the lock screen.
  return () => {
    BOUND.forEach((action) => setHandler(session, action, null));
    session.metadata = null;
    session.playbackState = 'none';
  };
}

function handlerFor(
  action: MediaSessionAction,
  { onPlay, onPause, onSkip, onNudge }: MediaHandlers
): MediaSessionActionHandler {
  if (action === 'play') return onPlay;
  if (action === 'pause') return onPause;
  if (action === 'seekbackward' || action === 'seekforward')
    return () => onNudge(action === 'seekbackward' ? -1 : 1);
  return () => onSkip(action === 'previoustrack' ? -1 : 1);
}

/** Browsers may refuse an action they do not implement; that is not a failure of ours. */
function setHandler(
  session: MediaSession,
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null
): void {
  try {
    session.setActionHandler(action, handler);
  } catch {
    return;
  }
}
