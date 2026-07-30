// Shared context-window renderer. One animated frame owns every row, zone, label,
// and companion coordinate; consumers only provide content and narrative overlays.

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useMounted } from '@site/src/hooks/useMounted';
import styles from './contextRegions.module.css';
import {
  ZONE_BAND_FILLS,
  ZONE_LABELS,
  ZONE_LABEL_FILLS,
  zoneGradient,
  type AttentionZone,
} from './contextZones';
import {
  exitingContextRegions,
  REGION_MIN_HEIGHT,
  resolveRegionGeometry,
  type ContextRegionLayout,
  type ContextRegionRow,
} from './contextRegions';
import { zoneBandFill } from './attentionModel';

export type RegionBadge = {
  id: string;
  label: string;
  color?: string;
  visible: boolean;
};
export type RegionTile = ContextRegionRow & {
  label: ReactNode;
  accent?: string;
  background?: string;
  outlineColor?: string;
  labelFontFamily?: string;
  labelColor?: string;
  badges?: readonly RegionBadge[];
  meta?: ReactNode;
};
export type RegionLayout = ContextRegionLayout;
export type ContextSceneGeometry = {
  height: number;
  contentTop: number;
  contentHeight: number;
  contentBottom: number;
};
export type ContextSceneFrame = ContextSceneGeometry & {
  rows: Record<string, RegionLayout>;
  zones: Record<
    AttentionZone,
    { top: number; height: number; bottom: number; center: number }
  >;
};
export type TileRenderProps = {
  layout: RegionLayout;
  frame: ContextSceneFrame;
};

type SceneProps = {
  rows: readonly RegionTile[];
  fallbackHeight?: number;
  fillRatio?: number;
  className?: string;
  stackClassName?: string;
  companionClassName?: string;
  renderRow?: (row: RegionTile, props: TileRenderProps) => ReactNode;
  renderCompanion?: (frame: ContextSceneFrame) => ReactNode;
};

const ZONES: readonly AttentionZone[] = ['primacy', 'middle', 'recency'];
const DURATION_MS = 240;
const ease = (progress: number) => 1 - (1 - progress) ** 3;

function fillFor(zone: AttentionZone, fillRatio?: number) {
  return fillRatio === undefined
    ? ZONE_BAND_FILLS[zone]
    : zoneBandFill(zone, fillRatio);
}
function gradient(fillRatio?: number) {
  return zoneGradient(
    ZONES.map((zone) => fillFor(zone, fillRatio)) as [string, string, string]
  );
}
function interpolateNumber(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

export function resolveSceneFrame(
  rows: readonly ContextRegionRow[],
  height: number
): ContextSceneFrame {
  const resolved = resolveRegionGeometry(rows, height);
  let top = 0;
  const layouts: Record<string, RegionLayout> = {};
  for (const row of rows) {
    const rowHeight = resolved.rowHeights[row.id] ?? 0;
    layouts[row.id] = {
      top,
      height: rowHeight,
      bottom: top + rowHeight,
      collapsed: !!row.collapsed || rowHeight === 0,
    };
    top += rowHeight;
  }
  const fractions = [0, 0.25, 0.75, 1];
  const zones = Object.fromEntries(
    ZONES.map((zone, index) => {
      const zoneTop =
        resolved.contentTop + resolved.contentHeight * fractions[index];
      const zoneBottom =
        resolved.contentTop + resolved.contentHeight * fractions[index + 1];
      return [
        zone,
        {
          top: zoneTop,
          height: zoneBottom - zoneTop,
          bottom: zoneBottom,
          center: (zoneTop + zoneBottom) / 2,
        },
      ];
    })
  ) as ContextSceneFrame['zones'];
  return {
    height: resolved.height,
    contentTop: resolved.contentTop,
    contentHeight: resolved.contentHeight,
    contentBottom: resolved.contentBottom,
    rows: layouts,
    zones,
  };
}

export function interpolateSceneFrame(
  from: ContextSceneFrame,
  to: ContextSceneFrame,
  progress: number
): ContextSceneFrame {
  const lerp = (key: keyof ContextSceneGeometry) =>
    interpolateNumber(from[key], to[key], progress);
  const rows = Object.fromEntries(
    Object.keys(to.rows).map((id) => {
      const start = from.rows[id] ?? {
        top: to.rows[id].top,
        height: 0,
        bottom: to.rows[id].top,
        collapsed: true,
      };
      const end = to.rows[id];
      const top = interpolateNumber(start.top, end.top, progress);
      const height = interpolateNumber(start.height, end.height, progress);
      return [
        id,
        {
          top,
          height,
          bottom: top + height,
          collapsed: end.collapsed && progress === 1,
        },
      ];
    })
  );
  const zones = Object.fromEntries(
    ZONES.map((zone) => {
      const start = from.zones[zone] ?? to.zones[zone];
      const end = to.zones[zone];
      const top = interpolateNumber(start.top, end.top, progress);
      const height = interpolateNumber(start.height, end.height, progress);
      return [
        zone,
        { top, height, bottom: top + height, center: top + height / 2 },
      ];
    })
  ) as ContextSceneFrame['zones'];
  return {
    height: lerp('height'),
    contentTop: lerp('contentTop'),
    contentHeight: lerp('contentHeight'),
    contentBottom: lerp('contentBottom'),
    rows,
    zones,
  };
}

function useSceneLayout(rows: readonly RegionTile[], fallbackHeight: number) {
  const mounted = useMounted();
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(fallbackHeight);
  const target = useMemo(() => resolveSceneFrame(rows, height), [rows, height]);
  const current = useRef(target);
  const [frame, setFrame] = useState(target);
  useEffect(() => {
    const element = ref.current;
    if (!element || !mounted) return;
    const observer = new ResizeObserver(() => setHeight(element.clientHeight));
    observer.observe(element);
    setHeight(element.clientHeight);
    return () => observer.disconnect();
  }, [mounted]);
  useEffect(() => {
    const from = current.current;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = target;
      setFrame(target);
      return;
    }
    const start = performance.now();
    let animation = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      const next = interpolateSceneFrame(from, target, ease(progress));
      current.current = next;
      setFrame(next);
      if (progress < 1) animation = requestAnimationFrame(animate);
    };
    animation = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animation);
  }, [target]);
  return { ref, mounted, frame, target };
}

type ScenePresence = {
  entering: ReadonlySet<string>;
  exiting: ReturnType<typeof exitingContextRegions<RegionTile>>;
};

function isReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function nextPresence(
  previous: readonly RegionTile[],
  rows: readonly RegionTile[],
  frame: ContextSceneFrame,
  current: ScenePresence
): ScenePresence {
  const ids = new Set(rows.map((row) => row.id));
  const previousIds = new Set(previous.map((row) => row.id));
  const entering = new Set([...current.entering].filter((id) => ids.has(id)));
  rows
    .filter((row) => !previousIds.has(row.id))
    .forEach((row) => entering.add(row.id));
  return {
    entering,
    exiting: [
      ...current.exiting.filter((entry) => !ids.has(entry.row.id)),
      ...exitingContextRegions(previous, rows, frame.rows),
    ],
  };
}

function useScenePresence(
  rows: readonly RegionTile[],
  frame: ContextSceneFrame
) {
  const previous = useRef(rows);
  const frameRef = useRef(frame);
  const [presence, setPresence] = useState<ScenePresence>({
    entering: new Set(),
    exiting: [],
  });
  frameRef.current = frame;
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = rows;
    setPresence((current) =>
      isReducedMotion()
        ? { entering: new Set(), exiting: [] }
        : nextPresence(before, rows, frameRef.current, current)
    );
  }, [rows]);
  const finishEntering = (id: string) =>
    setPresence((current) => ({
      ...current,
      entering: new Set([...current.entering].filter((item) => item !== id)),
    }));
  const finishExiting = (id: string) =>
    setPresence((current) => ({
      ...current,
      exiting: current.exiting.filter((entry) => entry.row.id !== id),
    }));
  return { presence, finishEntering, finishExiting };
}

export function StandardContextTile({
  row,
  layout,
}: {
  row: RegionTile;
  layout: RegionLayout;
}) {
  return (
    <div
      className={`${styles.regionRow} ${layout.collapsed ? styles.rowCollapsed : ''}`}
      style={{
        height: layout.height,
        minHeight: 0,
        background: row.background,
        outlineColor: row.outlineColor,
        opacity: row.weight > 0 ? 1 : 0,
      }}
    >
      <div className={styles.rowAccent} style={{ background: row.accent }} />
      <span
        className={styles.rowLabel}
        style={{ fontFamily: row.labelFontFamily, color: row.labelColor }}
      >
        {row.label}
      </span>
      {row.badges && <ContextTileBadges badges={row.badges} />}
      {row.meta && <span className={styles.rowMeta}>{row.meta}</span>}
    </div>
  );
}
export function ContextTileBadges({
  badges,
}: {
  badges: readonly RegionBadge[];
}) {
  return (
    <span className={styles.badgeGroup}>
      {badges.map((badge) => (
        <span
          key={badge.id}
          className={`${styles.badge} ${badge.visible ? styles.badgeVisible : ''}`}
          style={{ color: badge.color }}
        >
          {badge.label}
        </span>
      ))}
    </span>
  );
}

function ZoneBackdrop({
  frame,
  fillRatio,
}: {
  frame: ContextSceneFrame;
  fillRatio?: number;
}) {
  return (
    <div className={styles.zoneBackdrop} aria-hidden="true">
      <div
        className={styles.zoneBackdropGradient}
        style={{
          top: frame.contentTop,
          height: frame.contentHeight,
          background: gradient(fillRatio),
        }}
      />
    </div>
  );
}

function rowBoxStyle(layout: RegionLayout): CSSProperties {
  return { top: layout.top, height: layout.height };
}

function SceneRow({
  row,
  layout,
  frame,
  renderRow,
  entering = false,
  exiting = false,
  onAnimationEnd,
}: {
  row: RegionTile;
  layout: RegionLayout;
  frame: ContextSceneFrame;
  renderRow?: SceneProps['renderRow'];
  entering?: boolean;
  exiting?: boolean;
  onAnimationEnd?: () => void;
}) {
  const stateClass = entering
    ? styles.rowEntering
    : exiting
      ? styles.rowExiting
      : '';
  return (
    <div
      className={`${styles.rowBox} ${stateClass}`}
      style={rowBoxStyle(layout)}
      onAnimationEnd={entering || exiting ? onAnimationEnd : undefined}
    >
      {renderRow ? (
        renderRow(row, { layout, frame })
      ) : (
        <StandardContextTile row={row} layout={layout} />
      )}
    </div>
  );
}

export function ContextRegionScene({
  rows,
  fallbackHeight = 560,
  fillRatio,
  className,
  stackClassName,
  companionClassName,
  renderRow,
  renderCompanion,
}: SceneProps) {
  const { ref, mounted, frame, target } = useSceneLayout(rows, fallbackHeight);
  const { presence, finishEntering, finishExiting } = useScenePresence(
    rows,
    frame
  );
  const stack = (
    <div className={`${styles.regionStack} ${stackClassName ?? ''}`}>
      <ZoneBackdrop frame={frame} fillRatio={fillRatio} />
      {rows.map((row) => {
        const entering = presence.entering.has(row.id);
        const targetLayout = target.rows[row.id];
        const layout = entering
          ? targetLayout
          : (frame.rows[row.id] ?? targetLayout);
        return (
          <SceneRow
            key={row.id}
            row={row}
            layout={layout}
            frame={frame}
            renderRow={renderRow}
            entering={entering}
            onAnimationEnd={() => finishEntering(row.id)}
          />
        );
      })}
      {presence.exiting.map(({ row, layout }) => (
        <SceneRow
          key={`exit-${row.id}`}
          row={row}
          layout={layout}
          frame={frame}
          renderRow={renderRow}
          exiting
          onAnimationEnd={() => finishExiting(row.id)}
        />
      ))}
    </div>
  );
  // Measure the consumer-owned scene viewport, never the stack whose row
  // heights this frame controls. This keeps geometry stable as rows animate.
  return (
    <div
      ref={ref}
      className={`${styles.scene} ${renderCompanion ? '' : styles.sceneWithoutCompanion} ${className ?? ''}`}
      style={!mounted ? { minHeight: fallbackHeight } : undefined}
    >
      {stack}
      {renderCompanion && (
        <div className={`${styles.sceneCompanion} ${companionClassName ?? ''}`}>
          {renderCompanion(frame)}
        </div>
      )}
    </div>
  );
}

export function ContextZoneStrip({
  descs,
  bandBackgrounds,
  fillRatio,
  frame,
  children,
  className,
  ariaLabel,
}: {
  descs?: Partial<Record<AttentionZone, ReactNode>>;
  bandBackgrounds?: Partial<Record<AttentionZone, string>>;
  fillRatio?: number;
  frame: ContextSceneFrame;
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const backgrounds = ZONES.map(
    (zone) => bandBackgrounds?.[zone] ?? fillFor(zone, fillRatio)
  ) as [string, string, string];
  return (
    <div
      className={`${styles.zoneStrip} ${className ?? ''}`}
      aria-label={ariaLabel}
    >
      <div
        className={styles.zoneStripGradient}
        aria-hidden="true"
        style={{
          top: frame.contentTop,
          height: frame.contentHeight,
          background: zoneGradient(backgrounds),
        }}
      />
      {ZONES.map((zone) => (
        <div
          key={zone}
          className={styles.zoneStripLabels}
          style={{ top: frame.zones[zone].center }}
        >
          <span
            className={styles.zoneLabel}
            style={{ color: ZONE_LABEL_FILLS[zone] }}
          >
            {ZONE_LABELS[zone]}
          </span>
          {descs?.[zone] && (
            <span className={styles.zoneDesc}>{descs[zone]}</span>
          )}
        </div>
      ))}
      {children}
    </div>
  );
}

export { REGION_MIN_HEIGHT };
