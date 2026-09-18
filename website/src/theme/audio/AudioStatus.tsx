/**
 * Which heading the voice is in, in one line.
 *
 * It is a surface, not a part: it reads the store itself and renders nothing on a chapter
 * without audio, so both of its hosts — the sidebar's bottom button strip and the mobile
 * dock's status row — stay one line of markup.
 *
 * A title that does not fit ellipsises (the stylesheet's business); the heading is named by
 * `voiceRow`, the same helper the announcer uses, so the seen and the heard section cannot
 * disagree.
 */
import React, { type ReactNode } from 'react';

import { voiceIndex, voiceRow } from '../../audiobook/outline';
import { useAudioState } from './store';
import styles from './AudioTransport.module.css';

export default function AudioStatus(): ReactNode {
  const view = useAudioState();
  if (!view) return null;
  const row = voiceRow(view.outline, view.voiceId);
  // A chapter the manifest has no outline for still plays; it simply has no heading to name.
  if (!row && view.outline.rows.length === 0) return null;
  const index = voiceIndex(view.outline, view.voiceId);
  return (
    <span className={styles.status} data-audio-status="">
      {index < 0 ? null : (
        <span className={styles.position} data-audio-position="">
          §{index + 1}/{view.outline.rows.length}
        </span>
      )}
      <span className={styles.heading} data-audio-heading="">
        {row ? row.title : view.chapterTitle}
      </span>
    </span>
  );
}
