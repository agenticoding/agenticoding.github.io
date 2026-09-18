/**
 * One glyph set for every audio surface. Sharp geometry is the design system's icon
 * language, and a second copy of the same triangle is how two players start drifting.
 */
import React, { type ReactNode } from 'react';

import styles from './PlayerIcon.module.css';

export function PlayIcon({ playing }: { playing: boolean }): ReactNode {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      {playing ? (
        <>
          <rect x="4" y="3" width="4" height="14" />
          <rect x="12" y="3" width="4" height="14" />
        </>
      ) : (
        <polygon points="4,2 17,10 4,18" />
      )}
    </svg>
  );
}
