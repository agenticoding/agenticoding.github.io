import { useId, type ReactNode } from 'react';
import styles from './ContextLensWindow.module.css';
import regionStyles from './contextRegions.module.css';
import {
  ZONE_BAND_FILLS,
  ZONE_LABELS,
  ZONE_LABEL_FILLS,
  zoneBlendOffsets,
  zoneBounds,
  zoneBoundsInExtent,
  type AttentionZone,
  type ZoneBounds,
} from './contextZones';
import { zoneBandFill } from './attentionModel';

export type ContextLensZone = AttentionZone;
export type ContextLensTone =
  | 'cyan'
  | 'indigo'
  | 'violet'
  | 'magenta'
  | 'neutral'
  | 'success'
  | 'warning';

export type ContextLensBlock = {
  zone: ContextLensZone;
  label: ReactNode;
  tone?: ContextLensTone;
  dashed?: boolean;
};

type ContextLensZonePalette = 'attention' | 'neutral';

export type ContextLensMetricValue = string | readonly string[];

export type ContextLensMetric = {
  label: ReactNode;
  value: ContextLensMetricValue;
};

type ContextLensWindowProps = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  blocks: readonly ContextLensBlock[];
  tone?: ContextLensTone;
  // Representative window fill [0..1] — bands shade via the shared attention
  // model so the window itself tells the lost-in-the-middle story (ruling D3).
  fillRatio?: number;
  zonePalette?: ContextLensZonePalette;
  frameTone?: ContextLensTone;
  frameDashed?: boolean;
  blockHeight?: number;
  blockInset?: number;
};

// Optional content-relative band extent, as offsets relative to the frame's
// y: bands span [top, bottom] instead of the full frame height. Used when a
// figure's zone grammar must anchor to its content tiles rather than the
// window chrome (user directive: bands are content-relative).
export type ContextLensExtent = {
  top: number;
  bottom: number;
};

type ContextLensZoneBackdropProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  extent?: ContextLensExtent;
  // Window fill [0..1]: bands shade via the shared attention model (valley
  // deepens, primacy fades). Undefined keeps the static ZONE_BAND_FILLS.
  fillRatio?: number;
  zonePalette?: ContextLensZonePalette;
};

type ContextLensFrameProps = ContextLensZoneBackdropProps & {
  children?: ReactNode;
  frameTone?: ContextLensTone;
  frameDashed?: boolean;
};

type ContextLensZoneLabelsProps = ContextLensZoneBackdropProps & {
  labels?: Partial<Record<ContextLensZone, ReactNode>>;
};

type ContextLensRegionNotesProps = ContextLensZoneBackdropProps & {
  notes?: Partial<Record<ContextLensZone, ReactNode>>;
  side?: 'left' | 'right';
};

type ContextLensMetricsProps = {
  rows: readonly ContextLensMetric[];
  x: number;
  y: number;
  columns?: number;
  columnGap?: number;
  rowGap?: number;
};

const ZONE_ORDER: ContextLensZone[] = ['primacy', 'middle', 'recency'];

function zoneIndex(zone: ContextLensZone) {
  return ZONE_ORDER.indexOf(zone);
}

export function toneColor(tone: ContextLensTone) {
  return `var(--visual-${tone})`;
}

function blockY(
  y: number,
  bounds: readonly ZoneBounds[],
  zone: ContextLensZone,
  blockH: number,
  index: number,
  count: number
) {
  const gap = 4;
  const band = bounds[zoneIndex(zone)];
  const contentH = count * blockH + (count - 1) * gap;
  return (
    y +
    band.y +
    Math.max(4, (band.height - contentH) / 2) +
    index * (blockH + gap)
  );
}

function extentBounds(
  height: number,
  extent?: ContextLensExtent
): readonly ZoneBounds[] {
  return extent
    ? zoneBoundsInExtent(extent.top, extent.bottom - extent.top)
    : zoneBounds(height);
}

// Two stacked gradient rects over the band span: each layer is a pure
// ALPHA fade of one zone color (stop-color constant within a fade, only
// stop-opacity changes) — never hue interpolation, which would mix a muddy
// third color (user directive). Middle layer keeps the legacy 0.62 ceiling
// so the valley stays quieter than the edges.
export function ContextLensZoneBackdrop({
  x,
  y,
  width,
  height,
  extent,
  fillRatio,
  zonePalette = 'attention',
}: ContextLensZoneBackdropProps) {
  const gradientId = useId();
  const [primacy, , recency] = extentBounds(height, extent);
  const [pFill, mFill, rFill] = ZONE_ORDER.map((zone) =>
    zonePalette === 'neutral'
      ? 'var(--visual-bg-neutral)'
      : fillRatio === undefined
        ? ZONE_BAND_FILLS[zone]
        : zoneBandFill(zone, fillRatio)
  );
  const bandTop = y + primacy.y;
  const bandHeight = recency.y + recency.height - primacy.y;
  const { a, b, c, d } = zoneBlendOffsets();
  const geometry = {
    gradientUnits: 'userSpaceOnUse' as const,
    x1: 0,
    y1: bandTop,
    x2: 0,
    y2: bandTop + bandHeight,
  };
  const stop = (
    offset: number,
    color: string,
    opacity: number,
    key: string
  ) => (
    <stop
      key={key}
      offset={offset}
      style={{ stopColor: color }}
      stopOpacity={opacity}
    />
  );

  return (
    <g aria-hidden="true">
      <defs>
        {/* Intentional local gradient exception: attention varies continuously
            across context position. Alpha-only fades encode that field without
            decorative hue interpolation; opaque square tiles preserve crisp edges. */}
        <linearGradient id={`${gradientId}m`} {...geometry}>
          {stop(0, mFill, 0, 'm0')}
          {stop(a, mFill, 0, 'm1')}
          {stop(b, mFill, 0.62, 'm2')}
          {stop(c, mFill, 0.62, 'm3')}
          {stop(d, mFill, 0, 'm4')}
          {stop(1, mFill, 0, 'm5')}
        </linearGradient>
        <linearGradient id={`${gradientId}e`} {...geometry}>
          {stop(0, pFill, 1, 'e0')}
          {stop(a, pFill, 1, 'e1')}
          {stop(b, pFill, 0, 'e2')}
          {stop(c, rFill, 0, 'e3')}
          {stop(d, rFill, 1, 'e4')}
          {stop(1, rFill, 1, 'e5')}
        </linearGradient>
      </defs>
      <rect
        x={x + 1}
        y={bandTop + 1}
        width={width - 2}
        height={bandHeight - 2}
        rx={0}
        fill={`url(#${gradientId}m)`}
      />
      <rect
        x={x + 1}
        y={bandTop + 1}
        width={width - 2}
        height={bandHeight - 2}
        rx={0}
        fill={`url(#${gradientId}e)`}
      />
    </g>
  );
}

export function ContextLensFrame({
  x,
  y,
  width,
  height,
  extent,
  fillRatio,
  zonePalette,
  frameTone,
  frameDashed,
  children,
}: ContextLensFrameProps) {
  return (
    <g aria-hidden="true">
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={0}
        fill="var(--surface-page)"
        stroke={frameTone ? toneColor(frameTone) : 'var(--border-default)'}
        strokeWidth={1}
        strokeDasharray={frameDashed ? '4 3' : undefined}
      />
      <ContextLensZoneBackdrop
        x={x}
        y={y}
        width={width}
        height={height}
        extent={extent}
        fillRatio={fillRatio}
        zonePalette={zonePalette}
      />
      {children}
    </g>
  );
}

export function ContextLensZoneLabels({
  x,
  y,
  width,
  height,
  extent,
  labels = {},
}: ContextLensZoneLabelsProps) {
  const bounds = extentBounds(height, extent);
  const labelX = x + width - 12;
  const zoneLabels = {
    primacy: labels.primacy ?? ZONE_LABELS.primacy,
    middle: labels.middle ?? ZONE_LABELS.middle,
    recency: labels.recency ?? ZONE_LABELS.recency,
  };

  return (
    <g aria-hidden="true">
      {bounds.map(({ zone, y: bandY }) => (
        <text
          key={zone}
          x={labelX}
          y={y + bandY + 18}
          textAnchor="end"
          className={regionStyles.zoneLabel}
          fill={ZONE_LABEL_FILLS[zone]}
        >
          {zoneLabels[zone]}
        </text>
      ))}
    </g>
  );
}

export function ContextLensRegionNotes({
  x,
  y,
  width,
  height,
  extent,
  notes = {},
  side = 'right',
}: ContextLensRegionNotesProps) {
  const bounds = extentBounds(height, extent);
  const noteX = side === 'right' ? x + width + 10 : x - 10;
  const anchor = side === 'right' ? 'start' : 'end';
  const zoneNotes = {
    primacy: notes.primacy ?? 'top',
    middle: notes.middle ?? 'middle',
    recency: notes.recency ?? 'latest',
  };

  return (
    <g aria-hidden="true">
      {bounds.map(({ zone, y: bandY }) => (
        <text
          key={zone}
          x={noteX}
          y={y + bandY + 18}
          textAnchor={anchor}
          className={styles.regionNote}
        >
          {zoneNotes[zone]}
        </text>
      ))}
    </g>
  );
}

function MetricValue({
  x,
  y,
  value,
}: {
  x: number;
  y: number;
  value: ContextLensMetricValue;
}) {
  const lines = typeof value === 'string' ? [value] : value;

  return (
    <text x={x} y={y} className={styles.metricValue} fill="var(--text-body)">
      {lines.map((line, index) => (
        <tspan key={index} x={x} dy={index === 0 ? 0 : 12}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function ContextLensMetrics({
  rows,
  x,
  y,
  columns = 1,
  columnGap = 160,
  rowGap = 40,
}: ContextLensMetricsProps) {
  return (
    <g>
      {rows.map((row, index) => {
        const col = index % columns;
        const line = Math.floor(index / columns);
        const rowX = x + col * columnGap;
        const rowY = y + line * rowGap;

        return (
          <g key={`${row.label}-${index}`}>
            <text
              x={rowX}
              y={rowY}
              className={styles.metricLabel}
              fill="var(--text-muted)"
            >
              {row.label}
            </text>
            <MetricValue x={rowX} y={rowY + 16} value={row.value} />
          </g>
        );
      })}
    </g>
  );
}

export function ContextLensWindow({
  x,
  y,
  width = 144,
  height = 72,
  blocks,
  tone = 'cyan',
  fillRatio,
  zonePalette,
  frameTone,
  frameDashed,
  blockHeight = 14,
  blockInset = 10,
}: ContextLensWindowProps) {
  const bounds = zoneBounds(height);
  return (
    <ContextLensFrame
      x={x}
      y={y}
      width={width}
      height={height}
      fillRatio={fillRatio}
      zonePalette={zonePalette}
      frameTone={frameTone}
      frameDashed={frameDashed}
    >
      {blocks.map((block, index) => (
        <ContextLensBlockShape
          key={`${block.zone}-${index}`}
          {...{
            block,
            blocks,
            tone,
            x,
            y,
            width,
            bounds,
            blockHeight,
            blockInset,
          }}
        />
      ))}
    </ContextLensFrame>
  );
}

function ContextLensBlockShape({
  block,
  blocks,
  tone,
  x,
  y,
  width,
  bounds,
  blockHeight,
  blockInset,
}: {
  block: ContextLensBlock;
  blocks: readonly ContextLensBlock[];
  tone: ContextLensTone;
  x: number;
  y: number;
  width: number;
  bounds: readonly ZoneBounds[];
  blockHeight: number;
  blockInset: number;
}) {
  const zoneBlocks = blocks.filter(({ zone }) => zone === block.zone);
  const zoneIndex = zoneBlocks.indexOf(block);
  const band = bounds[ZONE_ORDER.indexOf(block.zone)];
  const blockH = Math.min(
    blockHeight,
    (band.height - 8 - (zoneBlocks.length - 1) * 4) / zoneBlocks.length
  );
  const blockTone = block.tone ?? tone;
  const bx = x + blockInset;
  const by = blockY(
    y,
    bounds,
    block.zone,
    blockH,
    zoneIndex,
    zoneBlocks.length
  );
  const blockW = width - blockInset * 2;
  return (
    <g>
      <rect
        x={bx}
        y={by}
        width={blockW}
        height={blockH}
        rx={0}
        fill="var(--surface-page)"
        stroke={toneColor(blockTone)}
        strokeWidth={1.5}
        strokeDasharray={block.dashed ? '4 3' : undefined}
      />
      <text
        x={bx + blockW / 2}
        y={by + blockH / 2 + 3}
        textAnchor="middle"
        className={styles.blockLabel}
        fill={toneColor(blockTone)}
      >
        {block.label}
      </text>
    </g>
  );
}
