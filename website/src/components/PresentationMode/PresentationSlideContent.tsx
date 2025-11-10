import React from 'react';
import type { PresentationLayoutConfig } from './types';
import styles from './PresentationSlideContent.module.css';

/**
 * Props for PresentationSlideContent wrapper component
 */
export interface PresentationSlideContentProps {
  /** Child content to render within the slide layout */
  children: React.ReactNode;

  /** Layout configuration (alignment, overflow, scaling, sizing) */
  config?: PresentationLayoutConfig;

  /** CSS class name to apply to the container */
  className?: string;

  /** Enable GPU optimization for smooth animations */
  gpuOptimized?: boolean;
}

/**
 * Wrapper component for presentation slide content
 *
 * Provides consistent layout, spacing, and positioning for all slide types.
 * Eliminates the need for ad-hoc centering classes and visual containers.
 *
 * Features:
 * - Vertical alignment control (flex-start, center, space-between, etc.)
 * - Overflow handling (scrollable vs constrained)
 * - Content scaling for visual prominence
 * - Max width/height constraints
 * - GPU optimization for smooth transitions
 *
 * Usage:
 * ```tsx
 * <PresentationSlideContent
 *   config={{
 *     verticalAlign: 'center',
 *     scaleContent: 1.5,
 *     maxWidthPercent: 90
 *   }}
 * >
 *   <MyVisualComponent compact />
 * </PresentationSlideContent>
 * ```
 */
export const PresentationSlideContent: React.FC<
  PresentationSlideContentProps
> = ({ children, config = {}, className = '', gpuOptimized = false }) => {
  const {
    verticalAlign = 'flex-start',
    allowOverflow = false,
    scaleContent = 1.0,
    maxWidthPercent = 90,
    maxHeightPercent = 85,
  } = config;

  // Build CSS classes
  const containerClasses = [
    styles.container,
    gpuOptimized && styles.gpuOptimized,
    allowOverflow && styles.allowOverflow,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Build inline styles for dynamic configuration
  const containerStyle: React.CSSProperties = {
    justifyContent: verticalAlign,
    maxWidth: `${maxWidthPercent}%`,
    maxHeight: `${maxHeightPercent}%`,
  };

  const contentStyle: React.CSSProperties =
    scaleContent !== 1.0
      ? {
          transform: `scale(${scaleContent})`,
          transformOrigin: 'center center',
        }
      : {};

  return (
    <div className={containerClasses} style={containerStyle}>
      <div className={styles.content} style={contentStyle}>
        {children}
      </div>
    </div>
  );
};
