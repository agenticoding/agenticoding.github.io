/**
 * The page's single narration announcer.
 *
 * Exactly one, and it lives with the engine rather than inside a visible surface: the
 * desktop sidebar and the mobile drawer's dock can both be mounted at once, and two polite
 * regions would read the same sentence twice. The text changes only when the narrated section
 * does, so a listener hears a section change and never the turn-by-turn churn underneath.
 */
import React, { type ReactNode } from 'react';

import { voiceIndex, voiceRow } from '../../audiobook/outline';
import type { AudioView } from './store';
import styles from './AudioAnnouncer.module.css';

export default function AudioAnnouncer({
  view,
}: {
  view: AudioView;
}): ReactNode {
  const started = view.playing || view.timeMs > 0;
  return (
    <p className={styles.srOnly} aria-live="polite">
      {started ? sentence(view) : ''}
    </p>
  );
}

function sentence(view: AudioView): string {
  const row = voiceRow(view.outline, view.voiceId);
  if (!row) return `${view.chapterTitle}.`;
  return `Section ${voiceIndex(view.outline, view.voiceId) + 1} of ${view.outline.rows.length}, ${row.title}.`;
}
