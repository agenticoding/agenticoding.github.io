import React from 'react';
import styles from './OutcomeIcons.module.css';

interface OutcomeIconProps {
  label: string;
  color: string;
  children: React.ReactNode;
}

function OutcomeIcon({ label, color, children }: OutcomeIconProps) {
  return (
    <div className={styles.iconItem} role="listitem" style={{ color }}>
      <svg
        viewBox="0 0 24 24"
        width="48"
        height="48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        {children}
      </svg>
      <span className={styles.iconLabel}>{label}</span>
    </div>
  );
}

/** Icon 1: Onboard codebases faster — open document with magnifying glass (curved geometry) */
function OnboardIcon() {
  return (
    <OutcomeIcon label="Onboard Faster" color="var(--visual-indigo)">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="14" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 16l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </OutcomeIcon>
  );
}

/** Icon 2: Refactor reliably — two rotating arrows (curved geometry) */
function RefactorIcon() {
  return (
    <OutcomeIcon label="Refactor Reliably" color="var(--visual-violet)">
      <path d="M21 2v6h-6" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M3 12a9 9 0 0 1 15-6.7L21 8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 22v-6h6" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M21 12a9 9 0 0 1-15 6.7L3 16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </OutcomeIcon>
  );
}

/** Icon 3: Debug by delegating — terminal with search prompt (Terminal Geometry) */
function DebugIcon() {
  return (
    <OutcomeIcon label="Debug by Delegating" color="var(--visual-warning)">
      <rect
        x="2"
        y="3"
        width="20"
        height="15"
        rx="0"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path d="M8 21h8" strokeLinecap="square" />
      <path d="M12 18v3" strokeLinecap="square" />
      <path d="M6 9l3 3-3 3" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M13 15h4" strokeLinecap="square" />
    </OutcomeIcon>
  );
}

/** Icon 4: Review systematically — shield with checkmark (curved geometry) */
function ReviewIcon() {
  return (
    <OutcomeIcon label="Review Systematically" color="var(--visual-success)">
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </OutcomeIcon>
  );
}

/** Icon 5: Plan & execute features — checklist (curved geometry) */
function PlanIcon() {
  return (
    <OutcomeIcon label="Plan & Execute" color="var(--visual-magenta)">
      {/* Row 1 — checked */}
      <path d="M 3,5 L 5,7 L 8,3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="5" x2="21" y2="5" strokeWidth="2" strokeLinecap="round" />
      {/* Row 2 — checked */}
      <path d="M 3,12 L 5,14 L 8,10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="12" x2="18" y2="12" strokeWidth="2" strokeLinecap="round" />
      {/* Row 3 — pending */}
      <circle cx="5.5" cy="19" r="1.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="19" x2="16" y2="19" strokeWidth="2" strokeLinecap="round" />
    </OutcomeIcon>
  );
}

export default function OutcomeIcons() {
  return (
    <div className={styles.iconGrid} role="list" aria-label="Course outcomes">
      <OnboardIcon />
      <RefactorIcon />
      <DebugIcon />
      <ReviewIcon />
      <PlanIcon />
    </div>
  );
}
