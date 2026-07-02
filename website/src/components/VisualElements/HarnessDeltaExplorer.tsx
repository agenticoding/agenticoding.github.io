import React, { type CSSProperties, useState } from 'react';
import styles from './HarnessDeltaExplorer.module.css';

type HarnessPoint = {
  harness: string;
  model: string;
  date: string;
  org: string;
  score: number;
  ci?: number;
  benchmark: string;
};

type ModelSeries = {
  id: string;
  label: string;
  points: HarnessPoint[];
};

type ColorPair = {
  color: string;
  bg: string;
};

type ChartLayout = {
  width: number;
  leftX: number;
  rightX: number;
  topY: number;
  rowHeight: number;
  barHeight: number;
  bottomPadding: number;
};

const sourceUrl = 'https://www.tbench.ai/leaderboard';
const sourceLabel = 'Terminal-Bench leaderboard ↗';
const benchmark = 'Terminal-Bench';
const desktopChart: ChartLayout = {
  width: 820,
  leftX: 116,
  rightX: 760,
  topY: 42,
  rowHeight: 28,
  barHeight: 16,
  bottomPadding: 48,
};
const mobileChart: ChartLayout = {
  width: 340,
  leftX: 98,
  rightX: 326,
  topY: 32,
  rowHeight: 28,
  barHeight: 16,
  bottomPadding: 44,
};
const scoreTicks = [0, 20, 40, 60, 80];
const scoreMax = 90;

const harnessColors: Record<string, ColorPair> = {
  'Claude Code': {
    bg: 'color-mix(in srgb, var(--visual-warning) 14%, transparent)',
    color: 'color-mix(in srgb, var(--visual-warning) 68%, var(--visual-neutral))',
  },
  'Codex CLI': colorPair('indigo'),
  OpenCode: colorPair('success'),
};

const series: ModelSeries[] = [
  {
    id: 'gpt-55',
    label: 'GPT-5.5',
    points: rows([
      row('NexAU-AHE', 'GPT-5.5', '2026-05-14', 'china-qijizhifeng', 84.7, 2.1),
      row('Capy', 'GPT-5.5', '2026-05-14', 'Capy', 83.1, 2.1),
      row('Codex CLI', 'GPT-5.5', '2026-04-23', 'OpenAI', 82.2, 2.2),
      row('clnkr', 'GPT-5.5', '2026-05-14', 'clnkr', 66.1, 2.5),
    ]),
  },
  {
    id: 'opus-46',
    label: 'Claude Opus 4.6',
    points: rows([
      row('Meta-Harness', 'Claude Opus 4.6', '2026-05-14', 'Stanford IRIS', 76.4, 2.4),
      row('Capy', 'Claude Opus 4.6', '2026-03-12', 'Capy', 75.3, 2.4),
      row('Terminus-KIRA', 'Claude Opus 4.6', '2026-02-22', 'KRAFTON AI', 74.7, 2.6),
      row('TongAgents', 'Claude Opus 4.6', '2026-02-22', 'Bigai', 71.9, 2.7),
      row('Droid', 'Claude Opus 4.6', '2026-02-05', 'Factory', 69.9, 2.5),
      row('Crux', 'Claude Opus 4.6', '2026-02-23', 'Roam', 66.9),
      row('Mux', 'Claude Opus 4.6', '2026-02-13', 'Coder', 66.5, 2.5),
      row('Terminus 2', 'Claude Opus 4.6', '2026-02-06', 'Terminal-Bench', 62.9, 2.7),
      row('Claude Code', 'Claude Opus 4.6', '2026-02-07', 'Anthropic', 58.0, 2.9),
    ]),
  },
  {
    id: 'opus-45',
    label: 'Claude Opus 4.5',
    points: rows([
      row('Droid', 'Claude Opus 4.5', '2025-12-11', 'Factory', 63.1, 2.7),
      row('Letta Code', 'Claude Opus 4.5', '2025-12-17', 'Letta', 59.1, 2.4),
      row('Mux', 'Claude Opus 4.5', '2026-01-17', 'Coder', 58.4),
      row('Terminus 2', 'Claude Opus 4.5', '2025-11-22', 'Terminal-Bench', 57.8, 2.5),
      row('Goose', 'Claude Opus 4.5', '2025-12-11', 'Block', 54.3, 2.6),
      row('Claude Code', 'Claude Opus 4.5', '2025-12-18', 'Anthropic', 52.1, 2.5),
      row('OpenHands', 'Claude Opus 4.5', '2026-01-04', 'OpenHands', 51.9, 2.9),
      row('OpenCode', 'Claude Opus 4.5', '2026-01-12', 'Anomaly Innovations', 51.7),
    ]),
  },
  {
    id: 'gemini-3-pro',
    label: 'Gemini 3 Pro',
    points: rows([
      row('Ante', 'Gemini 3 Pro', '2026-01-06', 'Antigma Labs', 69.4, 2.1),
      row('SageAgent', 'Gemini 3 Pro', '2026-02-23', 'OpenSage', 65.2, 2.1),
      row('CodeBrain-1.5', 'Gemini 3 Pro', '2026-02-05', 'Feeling AI', 62.2, 2.6),
      row('II-Agent', 'Gemini 3 Pro', '2025-12-23', 'Intelligent Internet', 61.8, 2.8),
      row('Droid', 'Gemini 3 Pro', '2025-12-24', 'Factory', 61.1, 2.8),
      row('Terminus 2', 'Gemini 3 Pro', '2025-11-21', 'Terminal-Bench', 56.9, 2.5),
      row('Letta Code', 'Gemini 3 Pro', '2025-12-17', 'Letta', 56.0, 3.0),
    ]),
  },
];
const stableRowCount = Math.max(...series.map((item) => item.points.length));

function row(
  harness: string,
  model: string,
  date: string,
  org: string,
  score: number,
  ci?: number,
) {
  return { harness, model, date, org, score, ci };
}

function rows(points: Array<Omit<HarnessPoint, 'benchmark'>>) {
  return points.map((point) => ({ ...point, benchmark }));
}

function ChartStage({
  activeSeries,
  onSelect,
}: {
  activeSeries: ModelSeries;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={styles.chartStage}>
      <HarnessChartFigure activeSeries={activeSeries} />
      <SourceDataPanel activeSeries={activeSeries} onSelect={onSelect} />
    </div>
  );
}

function HarnessChartFigure({ activeSeries }: { activeSeries: ModelSeries }) {
  return (
    <div className={styles.chartFigure}>
      <HarnessChart
        activeSeries={activeSeries}
        chart={desktopChart}
        variant="desktop"
      />
      <HarnessChart
        activeSeries={activeSeries}
        chart={mobileChart}
        variant="mobile"
      />
      <p className={styles.chartCaption}>
        Each bar is a Terminal-Bench harness row for the selected model group.
        Error bars show reported confidence intervals where available.
      </p>
    </div>
  );
}

function SourceDataPanel({
  activeSeries,
  onSelect,
}: {
  activeSeries: ModelSeries;
  onSelect: (id: string) => void;
}) {
  return (
    <section
      className={styles.sourcePanel}
      aria-label="Model selection and plotted source data"
    >
      <ModelChipRail activeId={activeSeries.id} onSelect={onSelect} />
      <SourceDataTable activeSeries={activeSeries} />
    </section>
  );
}

function ModelChipRail({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className={styles.chipGroup} aria-label="Choose one model group">
      <p>Hold model group constant</p>
      <div className={styles.chipRail}>
        {series.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.modelChip}
            aria-pressed={activeId === item.id}
            onClick={() => onSelect(item.id)}
          >
            <strong>{item.label}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function HarnessChart({
  activeSeries,
  chart,
  variant,
}: {
  activeSeries: ModelSeries;
  chart: ChartLayout;
  variant: 'desktop' | 'mobile';
}) {
  const titleId = `harness-delta-title-${variant}`;
  const descId = `harness-delta-desc-${variant}`;
  const className =
    variant === 'desktop' ? styles.desktopChart : styles.mobileChart;
  const height = chartHeight(chart, stableRowCount);
  const rowOffset = (stableRowCount - activeSeries.points.length) / 2;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${chart.width} ${height}`}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>Same model-group performance by harness</title>
      <desc id={descId}>{chartDescription(activeSeries)}</desc>
      <ChartFrame chart={chart} count={stableRowCount} />
      {activeSeries.points.map((point, index) => (
        <Bar key={point.harness} chart={chart} point={point} index={index + rowOffset} />
      ))}
    </svg>
  );
}

function ChartFrame({ chart, count }: { chart: ChartLayout; count: number }) {
  const bottomY = chartBottomY(chart, count);
  return (
    <g className={styles.chartFrame}>
      {scoreTicks.map((tick) => (
        <XTick key={tick} chart={chart} bottomY={bottomY} tick={tick} />
      ))}
      <line x1={chart.leftX} x2={chart.rightX} y1={bottomY} y2={bottomY} />
      <text className={styles.axisLabel} x={chart.leftX} y={bottomY + 32}>
        Terminal-Bench accuracy
      </text>
    </g>
  );
}

function XTick({
  chart,
  bottomY,
  tick,
}: {
  chart: ChartLayout;
  bottomY: number;
  tick: number;
}) {
  const x = scoreX(tick, chart);
  return (
    <g>
      <line x1={x} x2={x} y1={chart.topY - 10} y2={bottomY} />
      <text className={styles.tickLabel} x={x} y={bottomY + 18} textAnchor="middle">
        {tick}%
      </text>
    </g>
  );
}

function Bar({
  chart,
  point,
  index,
}: {
  chart: ChartLayout;
  point: HarnessPoint;
  index: number;
}) {
  const x = scoreX(point.score, chart),
    y = rowY(index, chart),
    startX = chart.leftX,
    scoreInside = point.score > 60,
    scoreLabelX = scoreInside ? x - 8 : x + 8;
  return (
    <g className={styles.barGroup} style={harnessColorStyle(point.harness)}>
      <text className={styles.harnessLabel} x={startX - 10} y={y + 4} textAnchor="end">
        {point.harness}
      </text>
      <rect
        className={styles.bar}
        x={startX}
        y={y - chart.barHeight / 2}
        width={x - startX}
        height={chart.barHeight}
        rx={0}
      >
        <title>{`${point.harness}: ${formatPoint(point)}`}</title>
      </rect>
      {point.ci ? <ErrorBar chart={chart} point={point} x={x} y={y} /> : null}
      <text
        className={styles.scoreLabel}
        x={scoreLabelX}
        y={y + 4}
        textAnchor={scoreInside ? 'end' : 'start'}
      >
        {formatPoint(point)}
      </text>
    </g>
  );
}

function ErrorBar({
  chart,
  point,
  x,
  y,
}: {
  chart: ChartLayout;
  point: HarnessPoint;
  x: number;
  y: number;
}) {
  const high = scoreX(point.score + (point.ci ?? 0), chart);
  const low = scoreX(point.score - (point.ci ?? 0), chart);
  return (
    <g className={styles.errorBar} aria-hidden="true">
      <line x1={low} x2={high} y1={y} y2={y} />
      <line x1={high} x2={high} y1={y - 6} y2={y + 6} />
      <line x1={low} x2={low} y1={y - 6} y2={y + 6} />
    </g>
  );
}

function SourceDataTable({ activeSeries }: { activeSeries: ModelSeries }) {
  return (
    <table className={styles.sourceTable}>
      <caption>
        Plotted rows: harness, submitted model, organization, date, score, and
        reported CI. Source:{' '}
        <a href={sourceUrl}>{sourceLabel}</a>
      </caption>
      <thead>
        <tr>
          <th scope="col">Model</th>
          <th scope="col">Harness</th>
          <th scope="col">Agent org</th>
          <th scope="col">Date</th>
          <th scope="col">Score</th>
          <th scope="col">CI</th>
        </tr>
      </thead>
      <tbody>
        {activeSeries.points.map((point) => (
          <SourceDataRow key={point.harness} point={point} />
        ))}
      </tbody>
    </table>
  );
}

function SourceDataRow({ point }: { point: HarnessPoint }) {
  return (
    <tr>
      <th className={styles.modelCell} scope="row" data-label="Model">
        {point.model}
      </th>
      <td
        className={styles.harnessCell}
        data-label="Harness"
        style={harnessColorStyle(point.harness)}
      >
        {point.harness}
      </td>
      <td data-label="Agent org">{point.org}</td>
      <td className={styles.numericCell} data-label="Date">
        {point.date}
      </td>
      <td className={styles.numericCell} data-label="Score">
        {point.score.toFixed(1)}%
      </td>
      <td className={styles.numericCell} data-label="CI">
        {point.ci ? `±${point.ci.toFixed(1)}` : 'not reported'}
      </td>
    </tr>
  );
}

function ScreenSummary({ activeSeries }: { activeSeries: ModelSeries }) {
  const { best, worst } = rankedSpread(activeSeries.points);
  return (
    <p className={styles.screenSummary}>
      {activeSeries.label} ranges from {worst.score.toFixed(1)}% on{' '}
      {worst.harness} to {best.score.toFixed(1)}% on {best.harness} on {benchmark}.
    </p>
  );
}

function colorPair(name: string): ColorPair {
  return {
    bg: `var(--visual-bg-${name})`,
    color: `var(--visual-${name})`,
  };
}

function harnessColorStyle(harness: string) {
  return colorStyle('harness', harnessColors[harness] ?? defaultHarnessColor());
}

function defaultHarnessColor(): ColorPair {
  return {
    bg: 'var(--surface-muted)',
    color: 'var(--border-emphasis)',
  };
}

function colorStyle(prefix: 'harness', pair: ColorPair) {
  return {
    [`--${prefix}-bg`]: pair.bg,
    [`--${prefix}-color`]: pair.color,
  } as CSSProperties;
}

function rankedSpread(points: HarnessPoint[]) {
  const sorted = [...points].sort((a, b) => b.score - a.score);
  const best = sorted[0],
    worst = sorted[sorted.length - 1];
  return { best, worst, delta: best.score - worst.score };
}

function chartHeight(chart: ChartLayout, count: number) {
  return chartBottomY(chart, count) + chart.bottomPadding;
}

function chartBottomY(chart: ChartLayout, count: number) {
  return chart.topY + count * chart.rowHeight;
}

function rowY(index: number, chart: ChartLayout) {
  return chart.topY + index * chart.rowHeight;
}

function scoreX(score: number, chart: ChartLayout) {
  const range = chart.rightX - chart.leftX;
  return chart.leftX + (score / scoreMax) * range;
}

function formatPoint(point: HarnessPoint) {
  return `${point.score.toFixed(1)}%${point.ci ? ` ±${point.ci.toFixed(1)}` : ''}`;
}

function chartDescription(activeSeries: ModelSeries) {
  return `A horizontal bar chart plots Terminal-Bench accuracy for ${activeSeries.label}. Each bar is a coding harness row. Error bars show reported confidence intervals where available.`;
}

export default function HarnessDeltaExplorer() {
  const [activeId, setActiveId] = useState(series[0].id);
  const activeSeries = series.find((item) => item.id === activeId) ?? series[0];

  return (
    <section
      className={styles.container}
      aria-label="Harness benchmark comparison"
    >
      <ScreenSummary activeSeries={activeSeries} />
      <ChartStage activeSeries={activeSeries} onSelect={setActiveId} />
    </section>
  );
}
