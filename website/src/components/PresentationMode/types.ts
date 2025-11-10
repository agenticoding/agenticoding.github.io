/**
 * Type definitions for presentation-aware components
 *
 * These types establish a contract for visual components that need to work
 * in both regular documentation pages and presentation slides (Reveal.js).
 *
 * Key Principles:
 * - Presentations use a fixed 1280x720 viewport (non-scrollable)
 * - Components must support compact mode to maximize content area
 * - Dark mode is always active in presentations (Reveal.js black theme)
 * - All colors must use CSS variables for automatic dark mode adaptation
 */

/**
 * Props interface for components that support presentation mode
 *
 * Usage:
 * ```tsx
 * interface MyComponentProps extends PresentationAwareProps {
 *   title: string;
 *   data: number[];
 * }
 *
 * export const MyComponent: React.FC<MyComponentProps> = ({ compact, title, data }) => {
 *   return (
 *     <div className={compact ? styles.containerCompact : styles.container}>
 *       ...
 *     </div>
 *   );
 * };
 * ```
 */
export interface PresentationAwareProps {
  /**
   * Enable compact mode for presentations
   *
   * When true, the component should:
   * - Remove or minimize padding/margins
   * - Maximize visual content area
   * - Ensure all colors use CSS variables (no hardcoded values)
   * - Handle fixed viewport constraints (1280x720)
   *
   * @default false
   */
  compact?: boolean;
}

/**
 * Layout configuration for presentation slides
 *
 * Defines spacing, sizing, and alignment rules for consistent
 * slide layouts across different content types.
 */
export interface PresentationLayoutConfig {
  /**
   * Vertical alignment of content within slide
   * @default 'flex-start' - Content starts at top after title
   */
  verticalAlign?: 'flex-start' | 'center' | 'flex-end' | 'space-between';

  /**
   * Whether content can overflow the slide boundaries
   * @default false - Content is constrained to slide viewport
   */
  allowOverflow?: boolean;

  /**
   * Scale factor for visual prominence
   * @default 1.0 - No scaling
   */
  scaleContent?: number;

  /**
   * Maximum width as percentage of slide width
   * @default 90 - Leaves margin on sides
   */
  maxWidthPercent?: number;

  /**
   * Maximum height as percentage of available content area
   * @default 85 - Accounts for title and caption
   */
  maxHeightPercent?: number;
}

/**
 * Slide type enum for type-safe slide rendering
 *
 * Each slide type may have different layout requirements.
 * Used by RevealSlideshow to apply appropriate styling.
 */
export enum SlideType {
  /** Title slide with main heading and optional subtitle */
  TITLE = 'title',
  /** Section divider slide */
  SECTION = 'section',
  /** Learning objectives list */
  OBJECTIVES = 'objectives',
  /** Bullet point list content */
  BULLET_LIST = 'bulletList',
  /** Key takeaways summary */
  TAKEAWAYS = 'takeaways',
  /** Side-by-side comparison (ineffective vs effective) */
  COMPARISON = 'comparison',
  /** Marketing metaphor vs technical reality translation */
  MARKETING_REALITY = 'marketingReality',
  /** Visual diagram or interactive component */
  VISUAL = 'visual',
  /** Code block with syntax highlighting */
  CODE = 'code',
  /** Step-by-step execution flow with fragments */
  EXECUTION_FLOW = 'executionFlow',
}

/**
 * Props for visual components that need scaling in presentations
 *
 * Some visual components (SVGs, diagrams) are too small at 1:1 scale
 * in the fixed 1280x720 viewport. This interface provides scaling control.
 */
export interface ScalableVisualProps extends PresentationAwareProps {
  /**
   * CSS transform scale factor
   * @default 1.5 for presentations, 1.0 for normal docs
   */
  scale?: number;
}

/**
 * Type guard to check if a component implements PresentationAwareProps
 *
 * Usage:
 * ```tsx
 * if (isPresentationAware(props)) {
 *   return <Component {...props} compact={true} />;
 * }
 * ```
 */
export function isPresentationAware(
  props: any
): props is PresentationAwareProps {
  return props !== null && typeof props === 'object';
}

/**
 * Presentation mode context type
 *
 * Can be used with React Context to provide global presentation state
 * if components need to detect presentation mode without explicit props.
 */
export interface PresentationContextValue {
  /** Whether presentation mode is currently active */
  isPresenting: boolean;
  /** Current slide index (0-based) */
  currentSlide: number;
  /** Total number of slides */
  totalSlides: number;
}

/**
 * CSS Module class name mapping for compact mode
 *
 * Helper type for components using CSS Modules that need to switch
 * between normal and compact class names.
 */
export type CompactModeClassNames<T extends string> = {
  [K in T]: string;
} & {
  [K in `${T}Compact`]: string;
};
