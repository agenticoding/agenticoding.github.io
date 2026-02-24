import React, { useRef, useEffect } from 'react';
import styles from './BulletIcons.module.css';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import ClockIcon from './icons/ClockIcon';
import BugIcon from './icons/BugIcon';
import ReviewLensIcon from './icons/ReviewLensIcon';
import PlanExecuteIcon from './icons/PlanExecuteIcon';
import ArchitectIcon from './icons/ArchitectIcon';
import PencilIcon from './icons/PencilIcon';

interface Bullet {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  hue: string;
  label: string;
  description: string;
}

const BULLETS: Bullet[] = [
  {
    icon: ClockIcon,
    hue: 'var(--visual-indigo)',
    label: 'Onboard to unfamiliar codebases',
    description: '5–10× faster using systematic agentic research and grounding',
  },
  {
    icon: BugIcon,
    hue: 'var(--visual-warning)',
    label: 'Debug production issues',
    description: 'by delegating log analysis, root cause investigation, and diagnostic scripts to agents',
  },
  {
    icon: ReviewLensIcon,
    hue: 'var(--visual-success)',
    label: 'Review code without confirmation bias',
    description: '— fresh context, evidence-based validation, no line-by-line slog',
  },
  {
    icon: PlanExecuteIcon,
    hue: 'var(--visual-violet)',
    label: 'Plan and execute features',
    description: 'with parallel sub-agents across isolated branches and contexts',
  },
  {
    icon: ArchitectIcon,
    hue: 'var(--visual-cyan)',
    label: 'Architect agent-friendly codebases',
    description: 'where constraints are co-located with code and good patterns compound',
  },
  {
    icon: PencilIcon,
    hue: 'var(--visual-magenta)',
    label: 'Generate complete design systems',
    description: 'from computed first principles — brand palettes, typography scales, spatial grids, and illustrations derived by code rather than guessed',
  },
];

const STAGGER = 0.08;
const ITEM_SPAN = 0.25;
const BASE_OPACITY = 0.4;
const OFFSET_Y = 6;

export default function BulletIcons() {
  const phase = useAnimationPhase();
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    BULLETS.forEach((_, i) => {
      const el = itemRefs.current[i];
      if (!el) return;
      const start = i * STAGGER;
      const t = Math.min(Math.max((phase - start) / ITEM_SPAN, 0), 1);
      el.style.opacity = String(BASE_OPACITY + t * (1 - BASE_OPACITY));
      el.style.transform = `translateY(${OFFSET_Y * (1 - t)}px)`;
    });
  }, [phase]);

  return (
    <div className={styles.list} role="list">
      {BULLETS.map(({ icon: Icon, hue, label, description }, i) => (
        <div
          key={label}
          className={styles.item}
          role="listitem"
          ref={(el) => { itemRefs.current[i] = el; }}
        >
          <div className={styles.iconWrapper} style={{ color: hue }}>
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
