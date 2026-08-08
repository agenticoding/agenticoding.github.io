import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './ResponsiveDiagram.module.css';

export const RESPONSIVE_DIAGRAM_BREAKPOINTS = [
  '36rem',
  '40rem',
  '420px',
  '430px',
  '480px',
  '500px',
  '520px',
  '560px',
  '580px',
  '640px',
  '700px',
  '704px',
  '720px',
  '768px',
] as const;

export type ResponsiveDiagramBreakpoint =
  (typeof RESPONSIVE_DIAGRAM_BREAKPOINTS)[number];
export type ResponsiveDiagramMode = 'container' | 'viewport';

type ResponsiveDiagramProps = {
  ariaLabel?: string;
  breakpoint: ResponsiveDiagramBreakpoint;
  children?: never;
  className?: string;
  desktop: ReactNode;
  mobile: ReactNode;
  mode?: ResponsiveDiagramMode;
  style?: CSSProperties;
  fallbackBreakpoint?: ResponsiveDiagramBreakpoint;
};

export function ResponsiveDiagram({
  ariaLabel = 'Responsive diagram',
  breakpoint,
  className,
  desktop,
  mobile,
  mode = 'container',
  fallbackBreakpoint,
  style,
}: ResponsiveDiagramProps) {
  return (
    <div
      className={clsx(styles.container, className)}
      data-responsive-breakpoint={breakpoint}
      data-responsive-mode={mode}
      data-responsive-fallback={fallbackBreakpoint}
      style={style}
      role="img"
      aria-label={ariaLabel}
    >
      <div className={styles.desktopVariant} aria-hidden="true">
        {desktop}
      </div>
      <div className={styles.mobileVariant} aria-hidden="true">
        {mobile}
      </div>
    </div>
  );
}
