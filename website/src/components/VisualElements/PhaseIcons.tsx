import React from 'react';
import styles from './PhaseIcons.module.css';
import ResearchIcon from './icons/ResearchIcon';
import ChecklistIcon from './icons/ChecklistIcon';
import ExecuteIcon from './icons/ExecuteIcon';
import ValidateIcon from './icons/ValidateIcon';

interface Phase {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  description: string;
}

const PHASES: Phase[] = [
  {
    icon: ResearchIcon,
    label: 'Grounding',
    description: "Ground the agent in the specific task's reality before acting",
  },
  {
    icon: ChecklistIcon,
    label: 'Plan',
    description: 'Design changes strategically — explore when uncertain, be directive when clear',
  },
  {
    icon: ExecuteIcon,
    label: 'Execute',
    description: 'Run agents supervised or autonomous based on trust and task criticality',
  },
  {
    icon: ValidateIcon,
    label: 'Validate',
    description: 'Verify against your mental model, then iterate or regenerate',
  },
];

export default function PhaseIcons() {
  return (
    <div className={styles.grid} role="list" aria-label="Operator methodology phases">
      {PHASES.map(({ icon: Icon, label, description }) => (
        <div key={label} className={styles.card} role="listitem">
          <div className={styles.iconWrapper}>
            <Icon size={32} aria-hidden="true" />
          </div>
          <div className={styles.text}>
            <span className={styles.label}>{label}</span>
            <span className={styles.description}>{description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
