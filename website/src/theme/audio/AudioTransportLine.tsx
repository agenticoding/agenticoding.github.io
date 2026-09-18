/**
 * The player's one line: play and the progress bar, because the two answer the same
 * question — where am I in this, and can I move it. Both surfaces render this line, so the
 * desktop and the phone can never offer different transports.
 */
import React, { type ReactNode } from 'react';

import AudioPlayButton from './AudioPlayButton';
import AudioScrubber from './AudioScrubber';
import { type AudioView } from './store';
import styles from './AudioTransport.module.css';

export default function AudioTransportLine({
  view,
}: {
  view: AudioView;
}): ReactNode {
  return (
    <div className={styles.line}>
      <AudioPlayButton view={view} />
      <AudioScrubber view={view} />
    </div>
  );
}
