import React, { useId } from 'react';
import type { KeyboardEvent } from 'react';

import type { BenchmarkPoint, BenchmarkRow } from './LongContextBenchmarkTable';
import styles from './LongContextBenchmarkExplorer.module.css';

export type ChartLayout = {
  width: number;
  height: number;
  leftX: number;
  rightX: number;
  labelX?: number;
  topY: number;
  bottomY: number;
  yLabelX: number;
  tickLabelY: number;
  axisLabelY: number;
};

export type CurveLabelLayout = { row: BenchmarkRow; y: number };
export type RenderedCurveLabel = CurveLabelLayout & { visible: boolean };

export const desktopChart: ChartLayout = {
  width: 820,
  height: 360,
  leftX: 92,
  rightX: 650,
  labelX: 674,
  topY: 42,
  bottomY: 262,
  yLabelX: 34,
  tickLabelY: 288,
  axisLabelY: 332,
};

export const mobileChart: ChartLayout = {
  width: 340,
  height: 260,
  leftX: 36,
  rightX: 332,
  topY: 28,
  bottomY: 202,
  yLabelX: 2,
  tickLabelY: 226,
  axisLabelY: 248,
};

export const compactChart: ChartLayout = {
  // The card gives the SVG a wide column; expand the plot horizontally while
  // keeping its logarithmic domain and score mapping unchanged.
  width: 520,
  height: 260,
  leftX: 44,
  rightX: 470,
  labelX: 500,
  topY: 28,
  bottomY: 190,
  yLabelX: 2,
  tickLabelY: 214,
  axisLabelY: 246,
};

export const desktopXTicks = [8192, 32768, 131072, 262144, 524288, 1048576];
export const mobileXTicks = [8192, 131072, 1048576];
export const compactXTicks = [8192, 131072, 1048576];

const thresholdBands = [
  {
    label: 'full-context viable',
    from: 80,
    to: 100,
    className: styles.bandStrong,
  },
  { label: 'validate', from: 60, to: 80, className: styles.bandUsable },
  { label: 'risk', from: 40, to: 60, className: styles.bandRisk },
  { label: 'chunk/RAG', from: 0, to: 40, className: styles.bandWeak },
];

export function BenchmarkChartSvg({
  chart,
  ticks,
  rows,
  selectedIds,
  labels = [],
  onToggle,
  variant = 'desktop',
  title = 'Effective-context retrieval curves by product',
  description = 'Reported benchmark points show retrieval score as context grows from thousands of tokens to one million.',
  className,
}: {
  chart: ChartLayout;
  ticks: number[];
  rows: readonly BenchmarkRow[];
  selectedIds: readonly string[];
  labels?: readonly RenderedCurveLabel[];
  onToggle?: (id: string) => void;
  variant?: 'desktop' | 'mobile' | 'compact';
  title?: string;
  description?: string;
  className?: string;
}) {
  const instanceId = useId();
  const titleId = `benchmark-chart-title-${variant}-${instanceId}`;
  const descId = `benchmark-chart-desc-${variant}-${instanceId}`;
  const selectedSet = new Set(selectedIds);
  const svgClassName =
    className ??
    (variant === 'mobile'
      ? styles.mobileChart
      : variant === 'compact'
        ? styles.compactChart
        : styles.desktopChart);
  return (
    <svg
      className={svgClassName}
      viewBox={`0 0 ${chart.width} ${chart.height}`}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>{title}</title>
      <desc id={descId}>{description}</desc>
      <BenchmarkChartFragment
        chart={chart}
        ticks={ticks}
        rows={rows}
        selectedIds={selectedSet}
        labels={labels}
        onToggle={onToggle}
      />
    </svg>
  );
}

export function BenchmarkChartFragment({
  chart,
  ticks,
  rows,
  selectedIds,
  labels,
  onToggle,
}: {
  chart: ChartLayout;
  ticks: number[];
  rows: readonly BenchmarkRow[];
  selectedIds: ReadonlySet<string>;
  labels?: readonly RenderedCurveLabel[];
  onToggle?: (id: string) => void;
}) {
  return (
    <>
      <ChartFrame chart={chart} ticks={ticks} />
      {rows.map((row) => (
        <Curve
          key={row.id}
          chart={chart}
          row={row}
          selected={selectedIds.has(row.id)}
          onToggle={onToggle}
        />
      ))}
      {labels?.map((label) => (
        <CurveLabel
          key={label.row.id}
          chart={chart}
          row={label.row}
          y={label.y}
          visible={label.visible}
        />
      ))}
    </>
  );
}

function ChartFrame({ chart, ticks }: { chart: ChartLayout; ticks: number[] }) {
  return (
    <g className={styles.chartFrame}>
      <ThresholdBands chart={chart} />
      {[100, 80, 60, 40, 20, 0].map((score) => (
        <line
          key={score}
          x1={chart.leftX}
          x2={chart.rightX}
          y1={scoreY(score, chart)}
          y2={scoreY(score, chart)}
        />
      ))}
      <line
        x1={chart.leftX}
        x2={chart.leftX}
        y1={chart.topY}
        y2={chart.bottomY}
      />
      <line
        x1={chart.rightX}
        x2={chart.rightX}
        y1={chart.topY}
        y2={chart.bottomY}
      />
      {[100, 80, 60, 40, 0].map((score) => (
        <text key={score} x={chart.yLabelX} y={scoreY(score, chart) + 5}>
          {score}%
        </text>
      ))}
      {ticks.map((tick) => (
        <Tick key={tick} chart={chart} tokens={tick} />
      ))}
      <text x={chart.leftX} y={chart.axisLabelY}>
        context length, log scale
      </text>
      <text x={chart.rightX} y={chart.axisLabelY} textAnchor="end">
        near max window
      </text>
    </g>
  );
}

function ThresholdBands({ chart }: { chart: ChartLayout }) {
  return (
    <>
      {thresholdBands.map((band) => (
        <rect
          key={band.label}
          className={band.className}
          x={chart.leftX}
          y={scoreY(band.to, chart)}
          width={chart.rightX - chart.leftX}
          height={scoreY(band.from, chart) - scoreY(band.to, chart)}
        />
      ))}
    </>
  );
}

function Tick({ chart, tokens }: { chart: ChartLayout; tokens: number }) {
  const x = contextX(tokens, chart);
  return (
    <g>
      <line x1={x} x2={x} y1={chart.bottomY} y2={chart.bottomY + 6} />
      <text x={x} y={chart.tickLabelY} textAnchor="middle">
        {tokenLabel(tokens)}
      </text>
    </g>
  );
}

function Curve({
  chart,
  row,
  selected,
  onToggle,
}: {
  chart: ChartLayout;
  row: BenchmarkRow;
  selected: boolean;
  onToggle?: (id: string) => void;
}) {
  const path = pathD(row.points, chart);
  const relation = selected ? styles.selectedCurve : styles.contextCurve;
  const className = `${styles.curve} ${familyClassName(row)} ${styles[row.signalTone]} ${styles[row.curveDensity]} ${relation}`;
  const interactiveProps = onToggle
    ? {
        role: 'button' as const,
        tabIndex: 0,
        'aria-label': `${selected ? 'Remove' : 'Compare'} ${row.model}`,
        'aria-pressed': selected,
        onClick: () => onToggle(row.id),
        onKeyDown: (event: KeyboardEvent<SVGGElement>) =>
          selectOnEnter(event, row.id, onToggle),
      }
    : {};
  return (
    <g className={className} {...interactiveProps}>
      {onToggle ? <path className={styles.hitLine} d={path} /> : null}
      <path d={path} />
      {selected
        ? row.points.map((point) => (
            <Marker
              key={`${row.id}-${point.label}`}
              chart={chart}
              point={point}
              row={row}
            />
          ))
        : null}
    </g>
  );
}

function Marker({
  chart,
  point,
  row,
}: {
  chart: ChartLayout;
  point: BenchmarkPoint;
  row: BenchmarkRow;
}) {
  const x = contextX(point.tokens, chart);
  const y = scoreY(point.score, chart);
  if (row.signalTone === 'warning') {
    return (
      <rect x={x - 4.5} y={y - 4.5} width="9" height="9" rx={0}>
        <title>{`${row.model}: ${point.score}% at ${point.label}`}</title>
      </rect>
    );
  }
  return (
    <circle cx={x} cy={y} r="4.5">
      <title>{`${row.model}: ${point.score}% at ${point.label}`}</title>
    </circle>
  );
}

function CurveLabel({
  chart,
  row,
  y,
  visible,
}: {
  chart: ChartLayout;
  row: BenchmarkRow;
  y: number;
  visible: boolean;
}) {
  const last = row.points[row.points.length - 1];
  const labelX = chart.labelX ?? chart.rightX;
  const activeClass = visible ? styles.curveLabelsActive : '';
  return (
    <g
      className={`${styles.curveLabels} ${activeClass} ${familyClassName(row)} ${styles[row.signalTone]}`}
    >
      <text
        className={styles.labelScore}
        x={labelX + 30}
        y={y}
        textAnchor="end"
      >
        {last.score}%
      </text>
      <text className={styles.labelModel} x={labelX + 38} y={y}>
        {row.model}
      </text>
    </g>
  );
}

export function MobileCurveSummary({
  rows,
}: {
  rows: readonly BenchmarkRow[];
}) {
  return (
    <ul
      className={styles.mobileCurveSummary}
      aria-label="Selected curve endpoints"
    >
      {rows.map((row) => (
        <li
          key={row.id}
          className={`${familyClassName(row)} ${styles[row.signalTone]}`}
        >
          <strong>{row.model}</strong>
          <span>{row.longScore}% @1M</span>
        </li>
      ))}
    </ul>
  );
}

export function layoutCurveLabels(
  rows: readonly BenchmarkRow[],
  chart: ChartLayout
): CurveLabelLayout[] {
  const minGap = 18;
  const labels = rows
    .map((row) => ({ row, y: desiredLabelY(row, chart) }))
    .sort((a, b) => a.y - b.y);
  labels.forEach((label, index) => {
    if (index > 0) label.y = Math.max(label.y, labels[index - 1].y + minGap);
  });
  const overflow =
    labels.length === 0
      ? 0
      : labels[labels.length - 1].y - (chart.bottomY - 12);
  if (overflow <= 0) return labels;
  labels[labels.length - 1].y -= overflow;
  for (let index = labels.length - 2; index >= 0; index -= 1)
    labels[index].y = Math.min(labels[index].y, labels[index + 1].y - minGap);
  return labels.map((label) => ({
    ...label,
    y: clamp(label.y, chart.topY + 12, chart.bottomY - 12),
  }));
}

function desiredLabelY(row: BenchmarkRow, chart: ChartLayout) {
  const last = row.points[row.points.length - 1];
  return clamp(scoreY(last.score, chart), chart.topY + 12, chart.bottomY - 12);
}

function selectOnEnter(
  event: KeyboardEvent<SVGGElement>,
  id: string,
  onToggle: (id: string) => void
) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onToggle(id);
}

function scoreY(score: number, chart: ChartLayout) {
  const range = chart.bottomY - chart.topY;
  return chart.bottomY - (score / 100) * range;
}

function contextX(tokens: number, chart: ChartLayout) {
  const min = Math.log(8192);
  const max = Math.log(1048576);
  const position = (Math.log(tokens) - min) / (max - min);
  return chart.leftX + position * (chart.rightX - chart.leftX);
}

function pathD(points: BenchmarkPoint[], chart: ChartLayout) {
  return points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${contextX(point.tokens, chart)} ${scoreY(point.score, chart)}`
    )
    .join(' ');
}

function tokenLabel(tokens: number) {
  if (tokens >= 1048576) return '1M';
  return `${Math.round(tokens / 1024)}K`;
}

export function familyClassName(row: BenchmarkRow) {
  if (row.model.startsWith('GPT')) return styles.familyOpenAI;
  if (row.model.startsWith('Claude')) return styles.familyAnthropic;
  if (row.model.startsWith('DeepSeek')) return styles.familyDeepSeek;
  if (row.model.startsWith('Gemini')) return styles.familyGoogle;
  return styles.familyOther;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
