import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './AbstractShapesVisualization.module.css';

export default function AbstractShapesVisualization({
  compact = false,
}: PresentationAwareProps = {}) {
  const containerClassName = compact
    ? `${styles.container} ${styles.compact}`
    : styles.container;

  return (
    <div
      className={containerClassName}
      role="img"
      aria-label="Comparison of cluttered context with multiple squares versus clean context with single circle, demonstrating how context density affects agent solutions"
    >
      <div className={styles.comparison}>
        {/* Cluttered Context Side */}
        <div className={styles.side}>
          <div className={styles.label}>Cluttered Context</div>
          <div className={styles.shapes}>
            <div className={styles.clutteredShapes}>
              <div className={styles.row}>■ ■ ■ ■</div>
              <div className={styles.row}>■ ■ ■</div>
              <div className={styles.row}>■ ■</div>
            </div>
          </div>
          <div className={styles.arrow}>↓</div>
          <div className={styles.outcome}>Small patch</div>
        </div>

        {/* Clean Context Side */}
        <div className={styles.side}>
          <div className={styles.label}>Clean Context (after /clear)</div>
          <div className={styles.shapes}>
            <div className={styles.cleanShape}>○</div>
          </div>
          <div className={styles.arrow}>↓</div>
          <div className={styles.outcome}>Architectural solution</div>
        </div>
      </div>

      <div className={styles.description}>
        Same problem → Different context → Different solution class
      </div>
    </div>
  );
}
