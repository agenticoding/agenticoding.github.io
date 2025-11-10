import React, { useState } from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './GroundingComparison.module.css';

// Import icons
import QuestionIcon from './icons/QuestionIcon';
import DisconnectedIcon from './icons/DisconnectedIcon';
import WarningIcon from './icons/WarningIcon';
import CheckIcon from './icons/CheckIcon';
import ConnectedIcon from './icons/ConnectedIcon';
import StructuredIcon from './icons/StructuredIcon';

interface PhaseData {
  id: number;
  title: string;
  withoutGrounding: {
    summary: string;
    details: string;
    icon: 'question' | 'disconnected' | 'warning';
  };
  withGrounding: {
    summary: string;
    details: string;
    tools: string[];
    icon: 'check' | 'connected' | 'structured';
  };
}

const phases: PhaseData[] = [
  {
    id: 1,
    title: 'Phase 1: Understanding Codebase',
    withoutGrounding: {
      summary: 'Agent works from generic training data',
      details:
        'Context available to agent:\n• Generic JWT patterns from training data\n• Typical Express middleware structure\n• Common auth libraries (guess: Passport? jose?)\n\nAgent reasoning:\n"Auth likely uses JWT... probably Express middleware... I\'ll assume standard patterns."',
      icon: 'question',
    },
    withGrounding: {
      summary: 'Agent works from actual codebase context',
      details:
        'Context available to agent:\n• Your actual JWT middleware: middleware/auth.ts:45-89\n• Library version: jsonwebtoken@8.5.1\n• Your custom error handling pattern\n• How it integrates with Express routing\n\nAgent reasoning:\n"I can see the exact implementation. Custom error handler at line 67, token extraction from Authorization header."',
      tools: ['ChunkHound'],
      icon: 'connected',
    },
  },
  {
    id: 2,
    title: 'Phase 2: Security Knowledge',
    withoutGrounding: {
      summary: 'Agent works from outdated training data',
      details:
        'Context available to agent:\n• General JWT security practices (frozen at Jan 2025)\n• Generic advice: "validate expiry, check signature"\n• No knowledge of recent vulnerabilities\n\nAgent reasoning:\n"JWT best practices suggest RS256, validate expiry... standard security measures should work."',
      icon: 'warning',
    },
    withGrounding: {
      summary: 'Agent works from current security knowledge',
      details:
        'Context available to agent:\n• CVE-2025-23529: Critical vulnerability in jsonwebtoken <9.0.0\n• Auth bypass via algorithm confusion attack\n• Upgrade path and mitigation required\n• Security advisory published March 2025\n\nAgent reasoning:\n"Version 8.5.1 is vulnerable to CVE-2025-23529. This is a critical auth bypass. Upgrade to 9.0.0+ is mandatory."',
      tools: ['ArguSeek'],
      icon: 'connected',
    },
  },
  {
    id: 3,
    title: 'Phase 3: Library Documentation',
    withoutGrounding: {
      summary: 'Agent works from training data memory',
      details:
        'Context available to agent:\n• Generic jsonwebtoken v8 API from training\n• Standard verify() signature (may be outdated)\n• No v9 migration information\n\nAgent reasoning:\n"Based on v8 patterns I know: jwt.verify(token, secret). Generate code using this API."\n\napp.use(async (req, res, next) => {\n  const decoded = jwt.verify(token, SECRET);\n  // ... v8 API pattern\n});',
      icon: 'disconnected',
    },
    withGrounding: {
      summary: 'Agent works from current API documentation',
      details:
        'Context available to agent:\n• Exact v8→v9 breaking changes from official docs\n• verify() now requires algorithms parameter\n• Callback pattern deprecated, use promise or sync\n• Migration examples with before/after code\n\nAgent reasoning:\n"v9 requires algorithms param. Old code: verify(token, secret). New code: verify(token, secret, { algorithms: [\'HS256\'] })."',
      tools: ['ArguSeek'],
      icon: 'structured',
    },
  },
  {
    id: 4,
    title: 'Phase 4: Solution Quality',
    withoutGrounding: {
      summary: 'Agent generates from incomplete context',
      details:
        'Context available to agent:\n• Generic patterns from training data\n• No awareness of security vulnerability\n• Outdated API patterns\n• Missing your architecture specifics\n\nResult:\nGeneric solution that may not match your middleware pattern, misses critical CVE, uses deprecated API. Built from guesswork.',
      icon: 'warning',
    },
    withGrounding: {
      summary: 'Agent extracts/reasons from complete context',
      details:
        'Context available to agent:\n✓ Your exact middleware architecture and error handling\n✓ Critical CVE-2025-23529 security vulnerability\n✓ Breaking changes in v9 upgrade path\n✓ Your coding conventions and patterns\n\nResult:\nArchitecture-aware solution that upgrades to v9.x, fixes CVE-2025-23529, uses correct verify() signature with algorithms param, preserves your error handling style. Built from knowledge.',
      tools: [],
      icon: 'check',
    },
  },
];

// Icon mapping
const iconMap = {
  question: QuestionIcon,
  disconnected: DisconnectedIcon,
  warning: WarningIcon,
  check: CheckIcon,
  connected: ConnectedIcon,
  structured: StructuredIcon,
};

interface PhaseCardProps {
  phase: PhaseData;
  side: 'without' | 'with';
  isExpanded: boolean;
  onToggle: () => void;
}

function PhaseCard({ phase, side, isExpanded, onToggle }: PhaseCardProps) {
  const data =
    side === 'without' ? phase.withoutGrounding : phase.withGrounding;
  const Icon = iconMap[data.icon];
  const isWithGrounding = side === 'with';

  return (
    <div
      className={`${styles.phaseCard} ${isWithGrounding ? styles.phaseCardWith : styles.phaseCardWithout}`}
    >
      <button
        className={styles.phaseHeader}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`phase-${phase.id}-${side}-details`}
      >
        <Icon className={styles.phaseIcon} size={20} />
        <span className={styles.phaseTitle}>{phase.title}</span>
        <svg
          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      <div className={styles.phaseSummary}>{data.summary}</div>

      <div
        id={`phase-${phase.id}-${side}-details`}
        className={`${styles.phaseDetails} ${isExpanded ? styles.phaseDetailsExpanded : ''}`}
      >
        <pre className={styles.phaseDetailsContent}>{data.details}</pre>
        {isWithGrounding && 'tools' in data && data.tools.length > 0 && (
          <div className={styles.toolBadges}>
            {data.tools.map((tool) => (
              <span key={tool} className={styles.toolBadge}>
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GroundingComparison({
  compact = false,
}: PresentationAwareProps = {}) {
  const containerClassName = compact
    ? `${styles.container} ${styles.compact}`
    : styles.container;
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const togglePhase = (phaseId: number, side: 'without' | 'with') => {
    const key = `${phaseId}-${side}`;
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allKeys = new Set<string>();
    phases.forEach((phase) => {
      allKeys.add(`${phase.id}-without`);
      allKeys.add(`${phase.id}-with`);
    });
    setExpandedPhases(allKeys);
  };

  const collapseAll = () => {
    setExpandedPhases(new Set());
  };

  return (
    <div
      className={containerClassName}
      role="region"
      aria-label="Grounding comparison visualization"
    >
      <div className={styles.header}>
        <h4 className={styles.mainTitle}>With vs Without Grounding</h4>
        <p className={styles.subtitle}>
          Same task, dramatically different context quality. Click phases to
          explore.
        </p>
        <div className={styles.expandCollapseControls}>
          <button
            className={styles.expandCollapseButton}
            onClick={expandAll}
            aria-label="Expand all phases"
          >
            Expand All
          </button>
          <button
            className={styles.expandCollapseButton}
            onClick={collapseAll}
            aria-label="Collapse all phases"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className={styles.comparisonWrapper}>
        {/* Left side - Without Grounding */}
        <div
          className={`${styles.side} ${styles.sideWithout}`}
          role="group"
          aria-label="Without grounding scenario"
        >
          <div className={styles.sideLabel}>WITHOUT GROUNDING</div>
          <div className={styles.phases}>
            {phases.map((phase) => (
              <PhaseCard
                key={`${phase.id}-without`}
                phase={phase}
                side="without"
                isExpanded={expandedPhases.has(`${phase.id}-without`)}
                onToggle={() => togglePhase(phase.id, 'without')}
              />
            ))}
          </div>
        </div>

        {/* Right side - With Grounding */}
        <div
          className={`${styles.side} ${styles.sideWith}`}
          role="group"
          aria-label="With grounding scenario"
        >
          <div className={styles.sideLabel}>WITH GROUNDING</div>
          <div className={styles.phases}>
            {phases.map((phase) => (
              <PhaseCard
                key={`${phase.id}-with`}
                phase={phase}
                side="with"
                isExpanded={expandedPhases.has(`${phase.id}-with`)}
                onToggle={() => togglePhase(phase.id, 'with')}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.tokenEfficiencyBox}>
        <strong>Paving the Road:</strong> Grounding is about giving the agent
        high-quality context to work from. Without grounding, the agent guesses
        from incomplete/outdated information. With grounding, you&apos;ve paved
        a clear road filled with the answers—your actual codebase, current
        security knowledge, specific documentation—so the agent extracts and
        reasons from facts instead of guessing.
      </div>
    </div>
  );
}
