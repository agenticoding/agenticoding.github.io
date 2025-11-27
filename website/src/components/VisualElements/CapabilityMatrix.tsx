import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './CapabilityMatrix.module.css';

interface Capability {
  name: string;
  inputType: string;
  trustLevel: 'high' | 'medium' | 'low';
  useCases: string[];
}

const capabilities: Capability[] = [
  {
    name: 'Code Generation',
    inputType: 'Natural language',
    trustLevel: 'medium',
    useCases: ['Boilerplate', 'Algorithms', 'Tests'],
  },
  {
    name: 'Code Explanation',
    inputType: 'Complex code',
    trustLevel: 'high',
    useCases: ['Learning', 'Documentation', 'Onboarding'],
  },
  {
    name: 'Refactoring',
    inputType: 'Existing code',
    trustLevel: 'medium',
    useCases: ['Readability', 'Patterns', 'Optimization'],
  },
  {
    name: 'Debugging',
    inputType: 'Code + errors',
    trustLevel: 'medium',
    useCases: ['Error fixing', 'Stack traces', 'Quick iteration'],
  },
  {
    name: 'API Usage',
    inputType: 'Library name',
    trustLevel: 'low',
    useCases: ['Exploration', 'Prototyping'],
  },
];

function getTrustIndicator(level: 'high' | 'medium' | 'low'): {
  icon: string;
  label: string;
  color: string;
} {
  switch (level) {
    case 'high':
      return {
        icon: '✅',
        label: 'Reliable',
        color: 'var(--visual-capability)',
      };
    case 'medium':
      return { icon: '⚠️', label: 'Verify', color: 'var(--visual-limitation)' };
    case 'low':
      return { icon: '❌', label: 'Check docs', color: 'var(--visual-error)' };
  }
}

export default function CapabilityMatrix({
  compact = false,
}: PresentationAwareProps = {}) {
  // Compact mode: show simple three-badge preview
  if (compact) {
    const trustLevels = [
      { level: 'high' as const, icon: '✅', label: 'Reliable' },
      { level: 'medium' as const, icon: '⚠️', label: 'Verify' },
      { level: 'low' as const, icon: '❌', label: 'Check docs' },
    ];

    return (
      <div className={styles.compactView}>
        {trustLevels.map(({ level, icon, label }) => (
          <div
            key={level}
            className={`${styles.compactBadge} ${styles[level]}`}
          >
            <span className={styles.compactIcon}>{icon}</span>
            <span className={styles.compactLabel}>{label}</span>
          </div>
        ))}
      </div>
    );
  }

  // Full table view for lesson pages
  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Capability</th>
              <th>Input Type</th>
              <th>Trust Level</th>
              <th>Best For</th>
            </tr>
          </thead>
          <tbody>
            {capabilities.map((capability, index) => {
              const trust = getTrustIndicator(capability.trustLevel);
              return (
                <tr key={index} className={styles.row}>
                  <td className={styles.cellName}>
                    <strong>{capability.name}</strong>
                  </td>
                  <td className={styles.cellInput}>{capability.inputType}</td>
                  <td className={styles.cellTrust}>
                    <span
                      className={styles.trustBadge}
                      style={{ borderColor: trust.color, color: trust.color }}
                    >
                      <span className={styles.trustIcon}>{trust.icon}</span>
                      {trust.label}
                    </span>
                  </td>
                  <td className={styles.cellUseCases}>
                    {capability.useCases.map((useCase, i) => (
                      <span key={i} className={styles.tag}>
                        {useCase}
                      </span>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon}>✅</span>
          <span className={styles.legendText}>
            <strong>Reliable:</strong> Output generally accurate, light review
          </span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon}>⚠️</span>
          <span className={styles.legendText}>
            <strong>Verify:</strong> Likely 80% correct, thorough review
            required
          </span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon}>❌</span>
          <span className={styles.legendText}>
            <strong>Check docs:</strong> High hallucination risk, verify against
            source
          </span>
        </div>
      </div>
    </div>
  );
}
