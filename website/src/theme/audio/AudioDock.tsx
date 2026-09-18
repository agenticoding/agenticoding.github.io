/**
 * Mobile audio surface: a bar that keeps the narration reachable from anywhere in the
 * chapter — one line of controls, one line naming the heading being narrated.
 *
 * Nothing auto-hides: a control that vanishes on a timer is one the reader has to hunt for,
 * and its disappearance is announced to nobody.
 */
import React, { type ReactNode } from 'react';

import AudioStatus from './AudioStatus';
import AudioTransportLine from './AudioTransportLine';
import { useAudioState } from './store';
import styles from './AudioDock.module.css';

export default function AudioDock(): ReactNode {
  const view = useAudioState();
  if (!view) return null;
  return (
    <>
      {/* In flow at the end of the article: the fixed bar must never cover the last paragraph. */}
      <div className={styles.spacer} aria-hidden="true" />
      <div className={styles.dock} data-chapter-audio="">
        {/* One line of controls. The dock's own 1px top edge separates it from the page. */}
        <div className={styles.transportRow}>
          <AudioTransportLine view={view} />
        </div>
        <div className={styles.statusRow}>
          <AudioStatus />
        </div>
      </div>
    </>
  );
}
