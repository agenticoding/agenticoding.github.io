import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './ComparisonLayout.module.css';
import CompassEmoji from './CompassEmoji';
import BullseyeEmoji from './BullseyeEmoji';

const ENTRIES = [
  {
    emoji: <CompassEmoji size={80} />,
    label: 'Exploration',
    description: 'Use when solution is unclear — accepts higher cost for better discovery through iterative learning.',
  },
  {
    emoji: <BullseyeEmoji size={80} />,
    label: 'Exact',
    description: 'Use when solution is known — optimizes for faster execution but requires upfront certainty.',
  },
] as const;

export default function PlanningStrategyComparison({
  compact = false,
}: PresentationAwareProps = {}) {
  return (
    <div
      role="img"
      aria-label="Comparison of two planning strategies: exploration (compass) for uncertain problems versus exact planning (bullseye) for known solutions"
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
