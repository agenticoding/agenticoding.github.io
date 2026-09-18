/**
 * Chapter-audio state store.
 *
 * Exactly one media element owns the truth, and every audio surface (the sidebar band
 * and the bottom button strip carrying its status text, plus the mobile dock)
 * subscribes here rather than threading transport state from the content column into
 * the sidebar.
 *
 * The narrated position is derived once per media event, inside the publisher, so
 * subscribers only ever read — no view recomputes it. Those player surfaces are the
 * store's only readers, which is what keeps the page identical on a chapter without
 * narration.
 */
import { createStore } from '../tocStore';
import type { AudioOutline } from '../../audiobook/outline';

export type AudioView = {
  /** The chapter's own title: the voice says it until the first heading, so the opener names it. */
  chapterTitle: string;
  timeMs: number;
  durationMs: number;
  playing: boolean;
  outline: AudioOutline;
  /** Section being narrated; null while the opener plays or before narration starts. */
  voiceId: string | null;
  seek: (ms: number) => void;
  toggle: () => void;
  /** Move the voice one section back or forward, for media keys and the dock. */
  skipSection: (direction: -1 | 1) => void;
};

const audio = createStore<AudioView | null>(null);

export const publishAudio = audio.publish;
export const useAudioState = audio.useValue;
