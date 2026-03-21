import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './ComparisonLayout.module.css';
import AirplaneEmoji from './AirplaneEmoji';
import BabysitEmoji from './BabysitEmoji';

const ENTRIES = [
  {
    emoji: <BabysitEmoji size={80} />,
    label: 'Babysitting',
    description:
      'Active monitoring for learning, critical code, or when trust is still developing.',
  },
  {
    emoji: <AirplaneEmoji size={80} />,
    label: 'Autopilot',
    description:
      'Fire-and-forget with a solid plan — maximize parallel throughput by working on other things.',
  },
] as const;

export default function ExecutionModeComparison({
  compact = false,
}: PresentationAwareProps = {}) {
  return (
    <div
      role="img"
      aria-label="Comparison of two execution modes: babysitting for active monitoring versus autopilot (airplane) for fire-and-forget parallel work"
      style={{ maxWidth: compact ? '95%' : 520, margin: '0 auto' }}
    >
      <div className={styles.halves}>
        {ENTRIES.map((entry, i) => (
          <React.Fragment key={entry.label}>
            {i > 0 && <div className={styles.divider} />}
            <div className={styles.half}>
              {entry.emoji}
              <span className={styles.title}>{entry.label}</span>
              <p className={styles.desc}>{entry.description}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
