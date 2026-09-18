/**
 * The player's one play/pause control, for the sidebar band, the mobile dock and the OS
 * media keys. The label lives here because a second copy of it is how two surfaces start
 * disagreeing about what the button offers.
 */
import React, { type ReactNode } from 'react';

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
      aria-label={`${actionLabel(view)} chapter audio`}
      onClick={view.toggle}
    >
      <PlayIcon playing={view.playing} />
    </button>
  );
}

/** The button says what pressing it does: stop the voice, or start it from the beginning. */
function actionLabel({ playing }: AudioView): string {
  return playing ? 'Pause' : 'Listen to';
}
