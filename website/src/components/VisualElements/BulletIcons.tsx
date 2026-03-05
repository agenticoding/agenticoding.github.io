import React, { useRef, useEffect } from 'react';
import styles from './BulletIcons.module.css';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import { AgentNode } from './ActorNodes';

function StopwatchBulletIcon({ size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128">
      <image href="/img/emoji/u23f1.svg" width={128} height={128} />
    </svg>
  );
}

function BugBulletIcon({ size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128">
      <image href="/img/emoji/u1f41e.svg" width={128} height={128} />
    </svg>
  );
}

function ReviewBulletIcon({ size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128">
      <image href="/img/emoji/u1f50d.svg" width={128} height={128} />
    </svg>
  );
}

function AgentBulletIcon({ size = 24 }: { className?: string; size?: number }) {
  return <AgentNode x={0} y={0} size={size} />;
}

function ArchitectBulletIcon({ size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128">
      <image href="/img/emoji/u1f4d0.svg" width={128} height={128} />
    </svg>
  );
}

function DesignBulletIcon({ size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128">
      <image href="/img/emoji/u1f58c.svg" width={128} height={128} />
    </svg>
  );
}

interface Bullet {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  hue: string;
  label: string;
  description: string;
}

const BULLETS: Bullet[] = [
  {
    icon: StopwatchBulletIcon,
    hue: 'var(--visual-indigo)',
    label: 'Onboard to unfamiliar codebases',
    description: '5–10× faster using systematic agentic research and grounding',
  },
  {
    icon: BugBulletIcon,
    hue: 'var(--visual-warning)',
    label: 'Debug production issues',
    description: 'by delegating log analysis, root cause investigation, and diagnostic scripts to agents',
  },
  {
    icon: ReviewBulletIcon,
    hue: 'var(--visual-success)',
    label: 'Review code without confirmation bias',
    description: '— fresh context, evidence-based validation, no line-by-line slog',
  },
  {
    icon: AgentBulletIcon,
    hue: 'var(--visual-violet)',
    label: 'Plan and execute features',
    description: 'with parallel sub-agents across isolated branches and contexts',
  },
  {
    icon: ArchitectBulletIcon,
    hue: 'var(--visual-indigo)',
    label: 'Architect agent-friendly codebases',
    description: 'where constraints are co-located with code and good patterns compound',
  },
  {
    icon: DesignBulletIcon,
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
