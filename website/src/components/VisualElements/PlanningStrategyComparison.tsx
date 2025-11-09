import React from 'react';
import styles from './PlanningStrategyComparison.module.css';

interface PlanningStrategyComparisonProps {
  compact?: boolean;
}

export default function PlanningStrategyComparison({ compact = false }: PlanningStrategyComparisonProps) {
  return (
    <div
      className={`${styles.container} ${compact ? styles.compact : ''}`}
      role="img"
      aria-label="Abstract visualization comparing exploration planning with branching paths versus exact planning with direct linear path"
    >
      <svg
        viewBox="0 0 800 330"
        className={styles.svg}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Define arrow markers */}
        <defs>
          <marker
            id="arrowExploration"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            className={styles.arrowMarkerExploration}
          >
            <polygon points="0 0, 8 4, 0 8" />
          </marker>
          <marker
            id="arrowExact"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
            className={styles.arrowMarkerExact}
          >
            <polygon points="0 0, 10 5, 0 10" />
          </marker>
        </defs>

        {/* LEFT SIDE: Exploration Planning - Branching Network */}
        <g className={styles.explorationGroup}>
          {/* Title */}
          <text x="180" y="40" className={styles.title} textAnchor="middle">
            EXPLORATION
          </text>

          {/* Starting node */}
          <circle cx="60" cy="100" r="8" className={styles.explorationNode} />
          <text x="60" y="130" className={styles.label} textAnchor="middle">
            Start
          </text>

          {/* Branch 1 - Upper path (successful) */}
          <line
            x1="68"
            y1="100"
            x2="132"
            y2="78"
            className={styles.explorationPath}
            markerEnd="url(#arrowExploration)"
          />
          <circle cx="140" cy="73" r="6" className={styles.explorationNode} />
          <line
            x1="146"
            y1="73"
            x2="212"
            y2="73"
            className={styles.explorationPath}
            markerEnd="url(#arrowExploration)"
          />
          <circle cx="220" cy="73" r="6" className={styles.explorationNode} />
          <line
            x1="226"
            y1="73"
            x2="292"
            y2="73"
            className={styles.explorationPath}
            markerEnd="url(#arrowExploration)"
          />
          <circle cx="300" cy="73" r="7" className={styles.explorationNodeEnd} />

          {/* Branch 2 - Lower path (exploring) */}
          <line
            x1="68"
            y1="102"
            x2="132"
            y2="122"
            className={styles.explorationPath}
            markerEnd="url(#arrowExploration)"
          />
          <circle cx="140" cy="127" r="6" className={styles.explorationNode} />
          <line
            x1="146"
            y1="127"
            x2="212"
            y2="127"
            className={styles.explorationPath}
            markerEnd="url(#arrowExploration)"
          />
          <circle cx="220" cy="127" r="6" className={styles.explorationNode} />

          {/* Context label */}
          <text x="180" y="230" className={styles.contextLabel} textAnchor="middle">
            Solution unclear
          </text>
          <text x="180" y="252" className={styles.tradeoffLabel} textAnchor="middle">
            Higher cost
          </text>
          <text x="180" y="272" className={styles.tradeoffLabel} textAnchor="middle">
            Better solutions
          </text>
        </g>

        {/* CENTER DIVIDER */}
        <g className={styles.dividerGroup}>
          <line x1="400" y1="60" x2="400" y2="210" className={styles.dividerLine} />
          <text x="400" y="305" className={styles.dividerText} textAnchor="middle">
            Context-Dependent Choice
          </text>
        </g>

        {/* RIGHT SIDE: Exact Planning - Direct Arrow */}
        <g className={styles.exactGroup}>
          {/* Title */}
          <text x="620" y="40" className={styles.title} textAnchor="middle">
            EXACT
          </text>

          {/* Starting point */}
          <circle cx="480" cy="100" r="8" className={styles.exactNode} />
          <text x="480" y="130" className={styles.label} textAnchor="middle">
            Start
          </text>

          {/* Direct path to target */}
          <line
            x1="488"
            y1="100"
            x2="732"
            y2="100"
            className={styles.exactPath}
            markerEnd="url(#arrowExact)"
          />

          {/* Intermediate markers on path */}
          <circle cx="570" cy="100" r="4" className={styles.exactPathMarker} />
          <circle cx="660" cy="100" r="4" className={styles.exactPathMarker} />

          {/* Target point */}
          <circle cx="740" cy="100" r="8" className={styles.exactNodeEnd} />
          <text x="740" y="130" className={styles.label} textAnchor="middle">
            Goal
          </text>

          {/* Context label */}
          <text x="620" y="230" className={styles.contextLabel} textAnchor="middle">
            Solution known
          </text>
          <text x="620" y="252" className={styles.tradeoffLabel} textAnchor="middle">
            Faster execution
          </text>
          <text x="620" y="272" className={styles.tradeoffLabel} textAnchor="middle">
            Needs certainty
          </text>
        </g>
      </svg>

      <div className={styles.description}>
        Both strategies are valid — choose based on problem clarity and uncertainty
      </div>
    </div>
  );
}
