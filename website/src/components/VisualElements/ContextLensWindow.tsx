import type { ReactNode } from 'react';
import styles from './ContextLensWindow.module.css';

export type ContextLensZone = 'primacy' | 'middle' | 'recency';
export type ContextLensTone = 'cyan' | 'indigo' | 'violet' | 'magenta' | 'neutral' | 'success' | 'warning';

export type ContextLensBlock = {
  zone: ContextLensZone;
  label: ReactNode;
  tone?: ContextLensTone;
  dashed?: boolean;
  width?: number;
};

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
};

type ContextLensZoneBackdropProps = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ContextLensFrameProps = ContextLensZoneBackdropProps & {
  children?: ReactNode;
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

export function toneBg(tone: ContextLensTone) {
  return `var(--visual-bg-${tone})`;
}

function blockY(y: number, zoneH: number, zone: ContextLensZone, blockH: number, index: number, count: number) {
  const gap = 4;
  const contentH = count * blockH + (count - 1) * gap;
  return y + zoneIndex(zone) * zoneH + Math.max(4, (zoneH - contentH) / 2) + index * (blockH + gap);
}

function blockWidth(width: number, block: ContextLensBlock) {
  return Math.min(block.width ?? width - 20, width - 16);
}

export function ContextLensZoneBackdrop({ x, y, width, height }: ContextLensZoneBackdropProps) {
  const zoneH = height / 3;

  return (
    <g aria-hidden="true">
      <rect x={x + 1} y={y + 1} width={width - 2} height={zoneH - 1} rx={0} fill="var(--surface-raised)" />
      <rect x={x + 1} y={y + zoneH} width={width - 2} height={zoneH} rx={0} fill="var(--surface-muted)" opacity={0.62} />
      <line x1={x} y1={y + zoneH} x2={x + width} y2={y + zoneH} stroke="var(--border-subtle)" strokeWidth={1} />
      <line x1={x} y1={y + zoneH * 2} x2={x + width} y2={y + zoneH * 2} stroke="var(--border-subtle)" strokeWidth={1} />
    </g>
  );
}

export function ContextLensFrame({ x, y, width, height, children }: ContextLensFrameProps) {
  return (
    <g aria-hidden="true">
      <rect x={x} y={y} width={width} height={height} rx={0} fill="var(--surface-page)" stroke="var(--border-default)" strokeWidth={1} />
      <ContextLensZoneBackdrop x={x} y={y} width={width} height={height} />
      {children}
    </g>
  );
}

export function ContextLensZoneLabels({ x, y, width, height, labels = {} }: ContextLensZoneLabelsProps) {
  const zoneH = height / 3;
  const labelX = x + width - 12;
  const zoneLabels = {
    primacy: labels.primacy ?? 'PRIMACY',
    middle: labels.middle ?? 'MIDDLE',
    recency: labels.recency ?? 'RECENCY',
  };

  return (
    <g aria-hidden="true">
      <text x={labelX} y={y + 18} textAnchor="end" className={styles.zoneLabel} fill="var(--visual-success)">{zoneLabels.primacy}</text>
      <text x={labelX} y={y + zoneH + 18} textAnchor="end" className={styles.zoneLabel} fill="var(--visual-warning)">{zoneLabels.middle}</text>
      <text x={labelX} y={y + zoneH * 2 + 18} textAnchor="end" className={styles.zoneLabel} fill="var(--text-muted)">{zoneLabels.recency}</text>
    </g>
  );
}

export function ContextLensRegionNotes({ x, y, width, height, notes = {}, side = 'right' }: ContextLensRegionNotesProps) {
  const zoneH = height / 3;
  const noteX = side === 'right' ? x + width + 10 : x - 10;
  const anchor = side === 'right' ? 'start' : 'end';
  const zoneNotes = {
    primacy: notes.primacy ?? 'top',
    middle: notes.middle ?? 'middle',
    recency: notes.recency ?? 'latest',
  };

  return (
    <g aria-hidden="true">
      <text x={noteX} y={y + 18} textAnchor={anchor} className={styles.regionNote}>{zoneNotes.primacy}</text>
      <text x={noteX} y={y + zoneH + 18} textAnchor={anchor} className={styles.regionNote}>{zoneNotes.middle}</text>
      <text x={noteX} y={y + zoneH * 2 + 18} textAnchor={anchor} className={styles.regionNote}>{zoneNotes.recency}</text>
    </g>
  );
}

function MetricValue({ x, y, value }: { x: number; y: number; value: ContextLensMetricValue }) {
  const lines = typeof value === 'string' ? [value] : value;

  return (
    <text x={x} y={y} className={styles.metricValue} fill="var(--text-body)">
      {lines.map((line, index) => <tspan key={index} x={x} dy={index === 0 ? 0 : 12}>{line}</tspan>)}
    </text>
  );
}

export function ContextLensMetrics({ rows, x, y, columns = 1, columnGap = 160, rowGap = 40 }: ContextLensMetricsProps) {
  return (
    <g>
      {rows.map((row, index) => {
        const col = index % columns;
        const line = Math.floor(index / columns);
        const rowX = x + col * columnGap;
        const rowY = y + line * rowGap;

        return (
          <g key={`${row.label}-${index}`}>
            <text x={rowX} y={rowY} className={styles.metricLabel} fill="var(--text-muted)">{row.label}</text>
            <MetricValue x={rowX} y={rowY + 16} value={row.value} />
          </g>
        );
      })}
    </g>
  );
}

export function ContextLensWindow({ x, y, width = 144, height = 72, blocks, tone = 'cyan' }: ContextLensWindowProps) {
  const zoneH = height / 3;
  return <ContextLensFrame x={x} y={y} width={width} height={height}>{blocks.map((block, index) => (
    <ContextLensBlockShape key={`${block.zone}-${index}`} {...{ block, index, blocks, tone, x, y, width, zoneH }} />
  ))}</ContextLensFrame>;
}

function ContextLensBlockShape({ block, index, blocks, tone, x, y, width, zoneH }: {
  block: ContextLensBlock; index: number; blocks: readonly ContextLensBlock[]; tone: ContextLensTone; x: number; y: number; width: number; zoneH: number;
}) {
  const zoneBlocks = blocks.filter(({ zone }) => zone === block.zone);
  const zoneIndex = zoneBlocks.indexOf(block);
  const blockH = Math.min(18, (zoneH - 8 - (zoneBlocks.length - 1) * 4) / zoneBlocks.length);
  const blockTone = block.tone ?? tone;
  const bx = x + 10;
  const by = blockY(y, zoneH, block.zone, blockH, zoneIndex, zoneBlocks.length);
  const blockW = blockWidth(width, block);
  return <g>
    <rect x={bx} y={by} width={blockW} height={blockH} rx={0} fill={toneBg(blockTone)} stroke={toneColor(blockTone)} strokeWidth={1.5} strokeDasharray={block.dashed ? '4 3' : undefined} />
    <text x={bx + blockW / 2} y={by + blockH / 2 + 3} textAnchor="middle" className={styles.blockLabel} fill={toneColor(blockTone)}>{block.label}</text>
  </g>;
}

type ContextLensSubAgentProps = {
  x: number;
  y: number;
  width?: number;
  tone?: ContextLensTone;
};

export function ContextLensSubAgent({ x, y, width = 144, tone = 'magenta' }: ContextLensSubAgentProps) {
  const zeroWidth = Math.min(30, width / 4);
  const zeroX = x + width - zeroWidth;
  const windowWidth = Math.min(84, width - zeroWidth - 22);
  const connectorStart = x + windowWidth + 6;

  return (
    <g aria-hidden="true">
      <ContextLensWindow x={x} y={y} width={windowWidth} height={72} tone="neutral" blocks={[{ zone: 'primacy', label: 'task', tone: 'neutral', width: 54 }]} />
      <path d={`M ${connectorStart} ${y + 36} C ${connectorStart + 8} ${y + 28}, ${zeroX - 10} ${y + 28}, ${zeroX} ${y + 28}`} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="4 3" strokeLinecap="butt" />
      <rect x={zeroX} y={y + 12} width={zeroWidth} height={48} rx={0} fill={toneBg(tone)} stroke={toneColor(tone)} strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={zeroX + zeroWidth / 2} y={y + 41} textAnchor="middle" className={styles.zeroLabel} fill={toneColor(tone)}>
        0
      </text>
    </g>
  );
}
