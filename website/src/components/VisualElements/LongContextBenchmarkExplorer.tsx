import React, { useEffect, useId, useMemo, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { benchmarkRows, type BenchmarkPoint, type BenchmarkRow } from './LongContextBenchmarkTable';
import styles from './LongContextBenchmarkExplorer.module.css';

type ChartLayout = { width: number; height: number; leftX: number; rightX: number; labelX?: number; topY: number; bottomY: number; yLabelX: number; tickLabelY: number; axisLabelY: number };

const desktopChart: ChartLayout = { width: 820, height: 360, leftX: 92, rightX: 650, labelX: 674, topY: 42, bottomY: 262, yLabelX: 34, tickLabelY: 288, axisLabelY: 332 };
const mobileChart: ChartLayout = { width: 340, height: 260, leftX: 36, rightX: 332, topY: 28, bottomY: 202, yLabelX: 2, tickLabelY: 226, axisLabelY: 248 };
const desktopXTicks = [8192, 32768, 131072, 262144, 524288, 1048576];
const mobileXTicks = [8192, 131072, 1048576];
const defaultSelectedIds = ['gpt-55', 'opus-46', 'deepseek-v4-pro'];
const longScoreRows = [...benchmarkRows].sort((a, b) => b.longScore - a.longScore);
const chipGroups = [
  { label: 'Native 1M candidates', rows: longScoreRows.filter((row) => row.longScore >= 60) },
  { label: 'Validate or chunk near 1M', rows: longScoreRows.filter((row) => row.longScore < 60) },
];
const thresholdBands = [
  { label: 'full-context viable', from: 80, to: 100, className: styles.bandStrong },
  { label: 'validate', from: 60, to: 80, className: styles.bandUsable },
  { label: 'risk', from: 40, to: 60, className: styles.bandRisk },
  { label: 'chunk/RAG', from: 0, to: 40, className: styles.bandWeak },
];
function ChartStage({ selectedRows, selectedIds, onToggle }: { selectedRows: BenchmarkRow[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  return <div className={styles.chartStage}><EvidenceChart selectedRows={selectedRows} selectedIds={selectedIds} onToggle={onToggle} /><SourceDataPanel selectedRows={selectedRows} selectedIds={selectedIds} onToggle={onToggle} /></div>;
}

function EvidenceChart({ selectedRows, selectedIds, onToggle }: { selectedRows: BenchmarkRow[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  const labelLayout = useMemo(() => layoutCurveLabels(selectedRows, desktopChart), [selectedRows]);
  const labels = useRenderedCurveLabels(labelLayout);
  return <figure className={styles.chartFigure}><ChartSvg chart={desktopChart} ticks={desktopXTicks} selectedIds={selectedIds} labels={labels} onToggle={onToggle} variant="desktop" /><ChartSvg chart={mobileChart} ticks={mobileXTicks} selectedIds={selectedIds} onToggle={onToggle} variant="mobile" /><MobileCurveSummary rows={selectedRows} /><figcaption>Reported benchmark points from 8K to 1M context, plotted on a log-scale x-axis.</figcaption></figure>;
}

function ChartSvg({ chart, ticks, selectedIds, labels = [], onToggle, variant }: { chart: ChartLayout; ticks: number[]; selectedIds: string[]; labels?: RenderedCurveLabel[]; onToggle: (id: string) => void; variant: 'desktop' | 'mobile' }) {
  const selectedSet = new Set(selectedIds);
  const titleId = `benchmark-chart-title-${variant}`, descId = `benchmark-chart-desc-${variant}`;
  const className = variant === 'desktop' ? styles.desktopChart : styles.mobileChart;
  return <svg className={className} viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-labelledby={`${titleId} ${descId}`}><title id={titleId}>Effective-context retrieval curves by product</title><desc id={descId}>Reported benchmark points show retrieval score as context grows from thousands of tokens to one million. Selected products are marked in the chart; mobile lists selected endpoints below the graph instead of forcing a wide label rail.</desc><ChartFrame chart={chart} ticks={ticks} />{benchmarkRows.map((row) => <Curve key={row.id} chart={chart} row={row} selected={selectedSet.has(row.id)} onToggle={onToggle} />)}{labels.map((label) => <CurveLabel key={label.row.id} chart={chart} row={label.row} y={label.y} visible={label.visible} />)}</svg>;
}

function ChartFrame({ chart, ticks }: { chart: ChartLayout; ticks: number[] }) {
  return <g className={styles.chartFrame}><ThresholdBands chart={chart} />{[100, 80, 60, 40, 20, 0].map((score) => <line key={score} x1={chart.leftX} x2={chart.rightX} y1={scoreY(score, chart)} y2={scoreY(score, chart)} />)}<line x1={chart.leftX} x2={chart.leftX} y1={chart.topY} y2={chart.bottomY} /><line x1={chart.rightX} x2={chart.rightX} y1={chart.topY} y2={chart.bottomY} />{[100, 80, 60, 40, 0].map((score) => <text key={score} x={chart.yLabelX} y={scoreY(score, chart) + 5}>{score}%</text>)}{ticks.map((tick) => <Tick key={tick} chart={chart} tokens={tick} />)}<text x={chart.leftX} y={chart.axisLabelY}>context length, log scale</text><text x={chart.rightX} y={chart.axisLabelY} textAnchor="end">near max window</text></g>;
}

function ThresholdBands({ chart }: { chart: ChartLayout }) {
  return <>{thresholdBands.map((band) => <g key={band.label}><rect className={band.className} x={chart.leftX} y={scoreY(band.to, chart)} width={chart.rightX - chart.leftX} height={scoreY(band.from, chart) - scoreY(band.to, chart)} /><text className={styles.bandLabel} x={chart.leftX + 10} y={(scoreY(band.from, chart) + scoreY(band.to, chart)) / 2 + 4}>{band.label}</text></g>)}</>;
}

function Tick({ chart, tokens }: { chart: ChartLayout; tokens: number }) {
  const x = contextX(tokens, chart);
  return <g><line x1={x} x2={x} y1={chart.bottomY} y2={chart.bottomY + 6} /><text x={x} y={chart.tickLabelY} textAnchor="middle">{tokenLabel(tokens)}</text></g>;
}

function Curve({ chart, row, selected, onToggle }: { chart: ChartLayout; row: BenchmarkRow; selected: boolean; onToggle: (id: string) => void }) {
  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => selectOnEnter(event, row.id, onToggle);
  const relation = selected ? styles.selectedCurve : styles.contextCurve;
  const className = `${styles.curve} ${familyClassName(row)} ${styles[row.signalTone]} ${styles[row.curveDensity]} ${row.benchmark === 'GraphWalks BFS' ? styles.graphWalks : ''} ${relation}`;
  return <g className={className} role="button" tabIndex={0} aria-label={`${selected ? 'Remove' : 'Compare'} ${row.model}`} aria-pressed={selected} onClick={() => onToggle(row.id)} onKeyDown={handleKeyDown}><path className={styles.hitLine} d={pathD(row.points, chart)} /><path d={pathD(row.points, chart)} />{selected ? row.points.map((point) => <Marker key={`${row.id}-${point.label}`} chart={chart} point={point} row={row} />) : null}</g>;
}

function Marker({ chart, point, row }: { chart: ChartLayout; point: BenchmarkPoint; row: BenchmarkRow }) {
  const x = contextX(point.tokens, chart), y = scoreY(point.score, chart);
  if (row.signalTone === 'warning') return <rect x={x - 4.5} y={y - 4.5} width="9" height="9" rx={0}><title>{`${row.model}: ${point.score}% at ${point.label}`}</title></rect>;
  return <circle cx={x} cy={y} r="4.5"><title>{`${row.model}: ${point.score}% at ${point.label}`}</title></circle>;
}

function CurveLabel({ chart, row, y, visible }: { chart: ChartLayout; row: BenchmarkRow; y: number; visible: boolean }) {
  const last = row.points[row.points.length - 1], labelX = chart.labelX ?? chart.rightX;
  const activeClass = visible ? styles.curveLabelsActive : '';
  return <g className={`${styles.curveLabels} ${activeClass} ${familyClassName(row)} ${styles[row.signalTone]}`}><text className={styles.labelScore} x={labelX + 30} y={y} textAnchor="end">{last.score}%</text><text className={styles.labelModel} x={labelX + 38} y={y}>{row.model}</text></g>;
}

function MobileCurveSummary({ rows }: { rows: BenchmarkRow[] }) {
  return <ul className={styles.mobileCurveSummary} aria-label="Selected curve endpoints">{rows.map((row) => <li key={row.id} className={`${familyClassName(row)} ${styles[row.signalTone]}`}><strong>{row.model}</strong><span>{row.longScore}% @1M</span></li>)}</ul>;
}

function ModelChipRail({ selectedIds, onToggle }: { selectedIds: string[]; onToggle: (id: string) => void }) {
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const pickerId = useId();
  const closeEditor = () => setMobileEditorOpen(false);
  const toggleLabel = mobileEditorOpen ? 'Close comparison' : 'Edit comparison';
  const toggleEditor = () => setMobileEditorOpen((open) => !open);
  return <div className={styles.modelPicker} aria-label="Compare model evidence"><div className={styles.desktopChipGroups}><ModelChipGroups selectedIds={selectedIds} onToggle={onToggle} /></div><div className={styles.mobileModelPicker}><button type="button" className={styles.modelEditorToggle} aria-expanded={mobileEditorOpen} aria-controls={pickerId} onClick={toggleEditor}>{toggleLabel}</button><MobileEditorPanel id={pickerId} open={mobileEditorOpen} onDismiss={closeEditor}><div className={styles.mobileEditorHeader}><button type="button" className={styles.modelEditorToggle} onClick={closeEditor}>Done</button></div><ModelChipGroups selectedIds={selectedIds} onToggle={onToggle} /></MobileEditorPanel></div></div>;
}

function MobileEditorPanel({ id, open, onDismiss, children }: { id: string; open: boolean; onDismiss: () => void; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<div className={`${styles.mobileEditorLayer} ${open ? styles.mobileEditorLayerOpen : ''}`} aria-hidden={!open} inert={open ? undefined : true} onPointerDown={onDismiss}><div id={id} className={`${styles.mobileEditorPanel} ${open ? styles.mobileEditorPanelOpen : ''}`} onPointerDown={(event) => event.stopPropagation()}><div className={styles.mobileEditorClip}>{children}</div></div></div>, document.body);
}

function ModelChipGroups({ selectedIds, onToggle }: { selectedIds: string[]; onToggle: (id: string) => void }) {
  return <>{chipGroups.map((group) => <section key={group.label} className={styles.chipGroup} aria-label={group.label}><p>{group.label}</p><div className={styles.chipRail}>{group.rows.map((row) => <ModelChip key={row.id} row={row} selected={selectedIds.includes(row.id)} onToggle={onToggle} />)}</div></section>)}</>;
}

function ModelChip({ row, selected, onToggle }: { row: BenchmarkRow; selected: boolean; onToggle: (id: string) => void }) {
  return <button type="button" className={`${styles.modelChip} ${familyClassName(row)} ${styles[row.signalTone]}`} aria-pressed={selected} onClick={() => onToggle(row.id)}><strong>{row.model}</strong></button>;
}

function SourceDataPanel({ selectedRows, selectedIds, onToggle }: { selectedRows: BenchmarkRow[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  return <section className={styles.sourcePanel} aria-label="Model selection and plotted source data"><ModelChipRail selectedIds={selectedIds} onToggle={onToggle} /><SourceDataTable rows={selectedRows} /></section>;
}

function SourceDataTable({ rows }: { rows: BenchmarkRow[] }) {
  return <table className={styles.sourceTable}><caption>Exact plotted values, modes, and source links for selected products.</caption><thead><tr><th scope="col">Model</th><th scope="col">Benchmark</th><th scope="col">Mode</th><th scope="col">Evidence</th><th scope="col">Plotted points</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><th scope="row" data-label="Model"><span>{row.model}</span><a href={row.source} aria-label={`Open source for ${row.model}: ${row.source}`}>Source ↗</a></th><td data-label="Benchmark">{row.benchmark}</td><td data-label="Mode">{row.mode}</td><td data-label="Evidence"><EvidenceBadge row={row} /></td><td data-label="Plotted points">{formatPoints(row.points)}</td></tr>)}</tbody></table>;
}

function EvidenceBadge({ row }: { row: BenchmarkRow }) {
  const differentBenchmark = row.benchmark !== 'MRCR v2 8-needle';
  const className = differentBenchmark ? `${styles.evidenceBadge} ${styles.evidenceBadgeDifferent}` : styles.evidenceBadge;
  return <span className={className}>{differentBenchmark ? 'Different benchmark' : row.curveDensity === 'full' ? 'Full curve' : 'Sparse points'}</span>;
}

function formatPoints(points: BenchmarkPoint[]) {
  return points.map((point) => `${point.label}: ${point.score}%`).join('; ');
}

function selectOnEnter(event: KeyboardEvent<SVGGElement>, id: string, onToggle: (id: string) => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault(); onToggle(id);
}

function scoreY(score: number, chart: ChartLayout) {
  const range = chart.bottomY - chart.topY;
  return chart.bottomY - (score / 100) * range;
}

function contextX(tokens: number, chart: ChartLayout) {
  const min = Math.log(8192), max = Math.log(1048576);
  const position = (Math.log(tokens) - min) / (max - min);
  return chart.leftX + position * (chart.rightX - chart.leftX);
}

function pathD(points: BenchmarkPoint[], chart: ChartLayout) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${contextX(point.tokens, chart)} ${scoreY(point.score, chart)}`).join(' ');
}

function tokenLabel(tokens: number) {
  if (tokens >= 1048576) return '1M';
  return `${Math.round(tokens / 1024)}K`;
}

function familyClassName(row: BenchmarkRow) {
  if (row.model.startsWith('GPT')) return styles.familyOpenAI;
  if (row.model.startsWith('Claude')) return styles.familyAnthropic;
  if (row.model.startsWith('DeepSeek')) return styles.familyDeepSeek;
  if (row.model.startsWith('Gemini')) return styles.familyGoogle;
  return styles.familyOther;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type CurveLabelLayout = { row: BenchmarkRow; y: number };
type RenderedCurveLabel = CurveLabelLayout & { visible: boolean };

function useRenderedCurveLabels(labels: CurveLabelLayout[]) {
  const [renderedLabels, setRenderedLabels] = useState<RenderedCurveLabel[]>(labels.map((label) => ({ ...label, visible: true })));

  useEffect(() => {
    setRenderedLabels((current) => mergeRenderedCurveLabels(current, labels));
  }, [labels]);

  useEffect(() => {
    if (renderedLabels.every((label) => label.visible)) return undefined;
    const timer = window.setTimeout(() => setRenderedLabels((current) => current.filter((label) => label.visible)), 220);
    return () => window.clearTimeout(timer);
  }, [renderedLabels]);

  return renderedLabels;
}

function mergeRenderedCurveLabels(current: RenderedCurveLabel[], labels: CurveLabelLayout[]) {
  const selectedIds = new Set(labels.map((label) => label.row.id));
  const exitingLabels = current.filter((label) => !selectedIds.has(label.row.id)).map((label) => ({ ...label, visible: false }));
  return [...labels.map((label) => ({ ...label, visible: true })), ...exitingLabels];
}

function layoutCurveLabels(rows: BenchmarkRow[], chart: ChartLayout) {
  const minGap = 18;
  const labels = rows.map((row) => ({ row, y: desiredLabelY(row, chart) })).sort((a, b) => a.y - b.y);
  labels.forEach((label, index) => { if (index > 0) label.y = Math.max(label.y, labels[index - 1].y + minGap); });
  const overflow = labels.length === 0 ? 0 : labels[labels.length - 1].y - (chart.bottomY - 12);
  if (overflow <= 0) return labels;
  labels[labels.length - 1].y -= overflow;
  for (let index = labels.length - 2; index >= 0; index -= 1) labels[index].y = Math.min(labels[index].y, labels[index + 1].y - minGap);
  return labels.map((label) => ({ ...label, y: clamp(label.y, chart.topY + 12, chart.bottomY - 12) }));
}

function desiredLabelY(row: BenchmarkRow, chart: ChartLayout) {
  const last = row.points[row.points.length - 1];
  return clamp(scoreY(last.score, chart), chart.topY + 12, chart.bottomY - 12);
}

function getSelectedRows(selectedIds: string[]) {
  const selectedSet = new Set(selectedIds);
  return benchmarkRows.filter((row) => selectedSet.has(row.id));
}

function toggleSelectedId(selectedIds: string[], id: string) {
  if (selectedIds.includes(id)) return selectedIds.length === 1 ? selectedIds : selectedIds.filter((selectedId) => selectedId !== id);
  return normalizeSelectedIds([...selectedIds, id]);
}

function normalizeSelectedIds(selectedIds: string[]) {
  const selectedSet = new Set(selectedIds);
  return benchmarkRows.filter((row) => selectedSet.has(row.id)).map((row) => row.id);
}

export default function LongContextBenchmarkExplorer() {
  const [selectedIds, setSelectedIds] = useState(defaultSelectedIds);
  const selectedRows = getSelectedRows(selectedIds);
  const containerClassName = styles.container;

  return <section className={containerClassName} aria-labelledby="long-context-benchmark-title"><header className={styles.header}><p className={styles.eyebrow}>Long-context benchmark explorer</p><h3 id="long-context-benchmark-title">Choose by effective context, not advertised window.</h3><p>Context windows are capacity. Effective context is the part the model can still retrieve from when the prompt approaches production scale.</p></header><p className={styles.screenSummary}>The chart plots reported benchmark points from 8K to 1M where available. GPT-5.5 and some DeepSeek rows have full MRCR curves; Claude and Gemini rows use sparse measured points.</p><ChartStage selectedRows={selectedRows} selectedIds={selectedIds} onToggle={(id) => setSelectedIds((current) => toggleSelectedId(current, id))} /></section>;
}
