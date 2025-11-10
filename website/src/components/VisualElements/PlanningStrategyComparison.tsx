import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './PlanningStrategyComparison.module.css';

export default function PlanningStrategyComparison({ compact = false }: PresentationAwareProps = {}) {
  const containerClassName = compact
    ? `${styles.container} ${styles.compact}`
    : styles.container;

  return (
    <div
      className={containerClassName}
      role="img"
      aria-label="Abstract visualization comparing exploration planning approach with scattered discovery pattern versus exact planning with direct linear path"
    >
      <svg
        viewBox="0 0 800 240"
        className={styles.svg}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Define arrow marker for exact planning */}
        <defs>
          <marker
            id="arrowExact"
            markerWidth="12"
            markerHeight="12"
            refX="11"
            refY="6"
            orient="auto"
            className={styles.arrowMarkerExact}
          >
            <polygon points="0 0, 12 6, 0 12" />
          </marker>
        </defs>

        {/* LEFT SIDE: Exploration Planning - Scattered Discovery Pattern */}
        <g className={styles.explorationGroup}>
          {/* Title */}
          <text
            x="180"
            y="35"
            className={`${styles.title} planning-title`}
            textAnchor="middle"
          >
            EXPLORATION
          </text>

          {/* Starting node */}
          <circle cx="60" cy="90" r="10" className={styles.explorationStart} />
          <text
            x="60"
            y="120"
            className={`${styles.label} planning-label`}
            textAnchor="middle"
          >
            Start
          </text>

          {/* Scattered nodes suggesting multiple exploration paths */}
          <circle cx="140" cy="70" r="7" className={styles.explorationNode} />
          <circle cx="160" cy="110" r="7" className={styles.explorationNode} />
          <circle cx="220" cy="60" r="7" className={styles.explorationNode} />
          <circle cx="200" cy="100" r="7" className={styles.explorationNode} />
          <circle cx="240" cy="90" r="7" className={styles.explorationNode} />
          <circle cx="280" cy="75" r="7" className={styles.explorationNode} />
          <circle cx="300" cy="105" r="7" className={styles.explorationNode} />

          {/* Light connecting lines showing non-linear exploration */}
          <line
            x1="60"
            y1="90"
            x2="140"
            y2="70"
            className={styles.explorationPathLight}
          />
          <line
            x1="60"
            y1="90"
            x2="160"
            y2="110"
            className={styles.explorationPathLight}
          />
          <line
            x1="140"
            y1="70"
            x2="220"
            y2="60"
            className={styles.explorationPathLight}
          />
          <line
            x1="160"
            y1="110"
            x2="200"
            y2="100"
            className={styles.explorationPathLight}
          />
          <line
            x1="220"
            y1="60"
            x2="280"
            y2="75"
            className={styles.explorationPathLight}
          />
          <line
            x1="200"
            y1="100"
            x2="240"
            y2="90"
            className={styles.explorationPathLight}
          />
          <line
            x1="240"
            y1="90"
            x2="300"
            y2="105"
            className={styles.explorationPathLight}
          />
        </g>

        {/* CENTER DIVIDER */}
        <g className={styles.dividerGroup}>
          <line
            x1="400"
            y1="50"
            x2="400"
            y2="150"
            className={styles.dividerLine}
          />
        </g>

        {/* RIGHT SIDE: Exact Planning - Direct Linear Path */}
        <g className={styles.exactGroup}>
          {/* Title */}
          <text
            x="620"
            y="35"
            className={`${styles.title} planning-title`}
            textAnchor="middle"
          >
            EXACT
          </text>

          {/* Starting point */}
          <circle cx="480" cy="90" r="10" className={styles.exactStart} />
          <text
            x="480"
            y="120"
            className={`${styles.label} planning-label`}
            textAnchor="middle"
          >
            Start
          </text>

          {/* Direct path to goal */}
          <line
            x1="490"
            y1="90"
            x2="730"
            y2="90"
            className={styles.exactPath}
            markerEnd="url(#arrowExact)"
          />

          {/* Goal point */}
          <circle cx="740" cy="90" r="10" className={styles.exactGoal} />
          <text
            x="740"
            y="120"
            className={`${styles.label} planning-label`}
            textAnchor="middle"
          >
            Goal
          </text>
        </g>
      </svg>

      <div className={styles.description}>
        <strong>Exploration:</strong> Use when solution is unclear — accepts
        higher cost for better discovery through iterative learning.
        <br />
        <strong>Exact:</strong> Use when solution is known — optimizes for
        faster execution but requires upfront certainty.
        <br />
        <em>
          Both strategies are valid — choose based on problem clarity and
          uncertainty.
        </em>
      </div>
    </div>
  );
}
