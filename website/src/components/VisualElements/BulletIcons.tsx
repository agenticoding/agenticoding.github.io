import React from 'react';
import styles from './BulletIcons.module.css';
import StopwatchEmoji from './StopwatchEmoji';
import BugEmoji from './BugEmoji';
import MagnifyEmoji from './MagnifyEmoji';
import RobotEmoji from './RobotEmoji';
import RulerEmoji from './RulerEmoji';
import BrushEmoji from './BrushEmoji';

const BULLETS = [
  { icon: StopwatchEmoji, label: 'Onboard to unfamiliar codebases', description: '5–10× faster using systematic agentic research and grounding' },
  { icon: BugEmoji,       label: 'Debug production issues',         description: 'by delegating log analysis, root cause investigation, and diagnostic scripts to agents' },
  { icon: MagnifyEmoji,   label: 'Review code without confirmation bias', description: '— fresh context, evidence-based validation, no line-by-line slog' },
  { icon: RobotEmoji,     label: 'Plan and execute features',       description: 'with parallel sub-agents across isolated branches and contexts' },
  { icon: RulerEmoji,     label: 'Architect agent-friendly codebases', description: 'where constraints are co-located with code and good patterns compound' },
  { icon: BrushEmoji,     label: 'Generate complete design systems', description: 'from computed first principles — brand palettes, typography scales, spatial grids, and illustrations derived by code rather than guessed' },
] as const;

export default function BulletIcons() {
  return (
    <div className={styles.list} role="list">
      {BULLETS.map(({ icon: Icon, label, description }) => (
        <div key={label} className={styles.item} role="listitem">
          <Icon size={32} />
          <div className={styles.text}>
            <span className={styles.label}>{label}</span>
            <span className={styles.description}>{description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
