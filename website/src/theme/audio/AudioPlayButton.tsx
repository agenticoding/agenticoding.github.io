/**
 * The player's one play/pause control, for the sidebar band, the mobile dock and the OS
 * media keys. Its accessible name comes from `labels.ts` so the button and the
 * browser-contract test read one string instead of disagreeing about what it offers.
 */
import React, { type ReactNode } from 'react';

import { chapterAudioLabel } from './labels';
import { PlayIcon } from './PlayerIcon';
import { type AudioView } from './store';
import styles from './AudioTransport.module.css';

export default function AudioPlayButton({
  view,
}: {
  view: AudioView;
}): ReactNode {
  return (
    <button
      type="button"
      className={styles.play}
      aria-label={chapterAudioLabel(view.playing)}
      onClick={view.toggle}
    >
      <PlayIcon playing={view.playing} />
    </button>
  );
}
