import clsx from 'clsx';
import styles from './PushCue.module.css';
import type { ContextLensTone } from './ContextLensWindow';

// Shared push-cue idiom: a down arrow marking content pushed across a zone
// boundary. Geometry and base stroke live here; callers own tone and
// visibility motion — keyframe loop in ContextSqueezeDiagram, user-driven
// opacity transition in interactive figures.

export function pushCuePath(x: number, y: number, length: number) {
  return `M ${x} ${y} v ${length} m -6 -6 l 6 6 6 -6`;
}

type PushCueProps = {
  x: number;
  y: number;
  length?: number;
  tone?: ContextLensTone;
  className?: string;
};

export default function PushCue({
  x,
  y,
  length = 18,
  tone,
  className,
}: PushCueProps) {
  return (
    <path
      aria-hidden="true"
      className={clsx(styles.pushCue, tone && styles[tone], className)}
      d={pushCuePath(x, y, length)}
    />
  );
}
