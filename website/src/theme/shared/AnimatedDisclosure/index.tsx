import React, {type ReactNode} from 'react';
import clsx from 'clsx';

import styles from './styles.module.css';

const DISCLOSURE_DURATION_MS = 110;

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function disclosureDelay(delayMs: number): number {
  return reducedMotion() ? 1 : delayMs;
}

function useDisclosureState({
  show,
  enterDelayMs,
  exitDelayMs,
  initialRenderAllowed,
  onShowCommitted,
}: {
  show: boolean;
  enterDelayMs: number;
  exitDelayMs: number;
  initialRenderAllowed: boolean;
  onShowCommitted?: () => void;
}) {
  const [render, setRender] = React.useState(() => show && initialRenderAllowed);

  React.useEffect(() => {
    if (show) return enterDisclosure(render, enterDelayMs, onShowCommitted, setRender);
    if (!render) return undefined;
    return exitDisclosure(exitDelayMs, setRender);
  }, [show, render, enterDelayMs, exitDelayMs, onShowCommitted]);

  return render;
}

function enterDisclosure(
  render: boolean,
  delayMs: number,
  onShowCommitted: (() => void) | undefined,
  setRender: React.Dispatch<React.SetStateAction<boolean>>,
): (() => void) | undefined {
  if (render) {
    onShowCommitted?.();
    return undefined;
  }

  const timeout = window.setTimeout(() => {
    onShowCommitted?.();
    setRender(true);
  }, disclosureDelay(delayMs));
  return () => window.clearTimeout(timeout);
}

function exitDisclosure(
  delayMs: number,
  setRender: React.Dispatch<React.SetStateAction<boolean>>,
): () => void {
  const timeout = window.setTimeout(() => setRender(false), disclosureDelay(delayMs));
  return () => window.clearTimeout(timeout);
}

export default function AnimatedDisclosure({
  show,
  children,
  className,
  innerClassName,
  enterDelayMs = DISCLOSURE_DURATION_MS,
  exitDelayMs = DISCLOSURE_DURATION_MS,
  initialRenderAllowed = true,
  onShowCommitted,
}: {
  show: boolean;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  enterDelayMs?: number;
  exitDelayMs?: number;
  initialRenderAllowed?: boolean;
  onShowCommitted?: () => void;
}): ReactNode {
  const render = useDisclosureState({
    show,
    enterDelayMs,
    exitDelayMs,
    initialRenderAllowed,
    onShowCommitted,
  });
  if (!render) return null;

  return (
    <div className={clsx(styles.disclosure, show ? styles.disclosureEnter : styles.disclosureExit, className)}>
      <div className={clsx(styles.disclosureInner, innerClassName)}>{children}</div>
    </div>
  );
}
