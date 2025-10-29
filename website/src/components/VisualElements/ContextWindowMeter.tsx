import React, { useState } from 'react';
import styles from './ContextWindowMeter.module.css';

interface ContextWindowMeterProps {
  initialTokens?: number;
  maxTokens?: number;
}

export default function ContextWindowMeter({
  initialTokens = 2000,
  maxTokens = 200000,
}: ContextWindowMeterProps) {
  const [tokens, setTokens] = useState(initialTokens);

  const percentage = (tokens / maxTokens) * 100;
  const isWarning = percentage > 60;
  const isCritical = percentage > 80;

  const addContext = (amount: number) => {
    setTokens((prev) => Math.min(maxTokens, prev + amount));
  };

  const reset = () => {
    setTokens(initialTokens);
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>Context Window Usage</h4>
        <span className={styles.stats}>
          {formatNumber(tokens)} / {formatNumber(maxTokens)} tokens
        </span>
      </div>

      <div className={styles.meterContainer}>
        <div
          className={`${styles.meterFill} ${
            isCritical
              ? styles.meterFillCritical
              : isWarning
                ? styles.meterFillWarning
                : styles.meterFillNormal
          }`}
          style={{ width: `${percentage}%` }}
        >
          <span className={styles.percentage}>{percentage.toFixed(1)}%</span>
        </div>
      </div>

      <div className={styles.controls}>
        <button
          className={styles.button}
          onClick={() => addContext(10000)}
          disabled={tokens >= maxTokens}
        >
          + Add 10K Context
        </button>
        <button
          className={styles.button}
          onClick={() => addContext(50000)}
          disabled={tokens >= maxTokens}
        >
          + Add 50K Context
        </button>
        <button
          className={`${styles.button} ${styles.buttonReset}`}
          onClick={reset}
        >
          Reset
        </button>
      </div>

      <div className={styles.statusMessage}>
        {isCritical && (
          <div className={styles.alertCritical}>
            ⚠️ Context window nearly full. Model may start dropping early
            messages.
          </div>
        )}
        {isWarning && !isCritical && (
          <div className={styles.alertWarning}>
            💡 Consider starting a new conversation to maintain context quality.
          </div>
        )}
        {!isWarning && (
          <div className={styles.alertInfo}>
            ✓ Plenty of context space available.
          </div>
        )}
      </div>

      <p className={styles.explanation}>
        LLMs have finite memory. As context grows, early information may be
        forgotten. Modern models support 200K+ tokens (~150K words), but quality
        degrades as you approach limits.
      </p>
    </div>
  );
}
