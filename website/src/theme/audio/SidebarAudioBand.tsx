/**
 * The chapter's transport, pinned at the bottom of the sidebar inside SidebarFooter —
 * reachable from wherever the reader has scrolled to, which is the one thing the
 * first player failed at.
 *
 * It is one line: play, and how far into the chapter the voice has got. Which heading that
 * voice is in belongs to the site's own bottom button strip one row below (AudioStatus), so
 * the band's height is fixed and the contents list above it never moves.
 *
 * The band exists only where audio does: a chapter without audio renders no DOM at all.
 */
import React, { type ReactNode } from 'react';

import AudioTransportLine from './AudioTransportLine';
import { useAudioState } from './store';
import styles from './AudioBand.module.css';

export default function SidebarAudioBand(): ReactNode {
  const view = useAudioState();
  if (!view) return null;
  return (
    <div className={styles.band} data-audio-band="">
      <AudioTransportLine view={view} />
    </div>
  );
}
