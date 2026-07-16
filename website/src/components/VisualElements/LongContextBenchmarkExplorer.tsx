import React, { useEffect, useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { benchmarkRows, type BenchmarkPoint, type BenchmarkRow } from './LongContextBenchmarkTable';
import {
  BenchmarkChartSvg,
  desktopChart,
  desktopXTicks,
  familyClassName,
  layoutCurveLabels,
  MobileCurveSummary,
  mobileChart,
  mobileXTicks,
  type CurveLabelLayout,
  type RenderedCurveLabel,
} from './LongContextBenchmarkChart';
import styles from './LongContextBenchmarkExplorer.module.css';

const defaultSelectedIds = ['gpt-55', 'gpt-54', 'opus-46', 'sonnet-46', 'deepseek-v4-pro'];
const longScoreRows = [...benchmarkRows].sort((a, b) => b.longScore - a.longScore);
const chipGroups = [
  { label: 'Native 1M candidates', rows: longScoreRows.filter((row) => row.longScore >= 60) },
  { label: 'Validate or chunk near 1M', rows: longScoreRows.filter((row) => row.longScore < 60) },
];
function ChartStage({ selectedRows, selectedIds, onToggle }: { selectedRows: BenchmarkRow[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  return <div className={styles.chartStage}><EvidenceChart selectedRows={selectedRows} selectedIds={selectedIds} onToggle={onToggle} /><SourceDataPanel selectedRows={selectedRows} selectedIds={selectedIds} onToggle={onToggle} /></div>;
}

function EvidenceChart({ selectedRows, selectedIds, onToggle }: { selectedRows: BenchmarkRow[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  const labelLayout = useMemo(() => layoutCurveLabels(selectedRows, desktopChart), [selectedRows]);
  const labels = useRenderedCurveLabels(labelLayout);
  return <div className={styles.chartFigure}><BenchmarkChartSvg chart={desktopChart} ticks={desktopXTicks} rows={benchmarkRows} selectedIds={selectedIds} labels={labels} onToggle={onToggle} variant="desktop" /><BenchmarkChartSvg chart={mobileChart} ticks={mobileXTicks} rows={benchmarkRows} selectedIds={selectedIds} onToggle={onToggle} variant="mobile" /><MobileCurveSummary rows={selectedRows} /></div>;
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
  return <table className={styles.sourceTable} aria-label="Exact plotted long-context benchmark values"><thead><tr><th scope="col">Model</th><th scope="col">Benchmark</th><th scope="col">Mode</th><th scope="col">Evidence</th><th scope="col">Plotted points</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><th scope="row" data-label="Model"><span>{row.model}</span><a href={row.source} aria-label={`Open source for ${row.model}: ${row.source}`}>Source ↗</a></th><td data-label="Benchmark">{row.benchmark}</td><td data-label="Mode">{row.mode}</td><td data-label="Evidence"><EvidenceBadge row={row} /></td><td data-label="Plotted points">{formatPoints(row.points)}</td></tr>)}</tbody></table>;
}

function EvidenceBadge({ row }: { row: BenchmarkRow }) {
  const differentBenchmark = row.benchmark !== 'MRCR v2 8-needle';
  const className = differentBenchmark ? `${styles.evidenceBadge} ${styles.evidenceBadgeDifferent}` : styles.evidenceBadge;
  return <span className={className}>{differentBenchmark ? 'Different benchmark' : row.curveDensity === 'full' ? 'Full curve' : 'Sparse points'}</span>;
}

function formatPoints(points: BenchmarkPoint[]) {
  return points.map((point) => `${point.label}: ${point.score}%`).join('; ');
}

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

  return <section className={containerClassName} aria-label="Long-context benchmark explorer"><p className={styles.screenSummary}>The chart plots reported benchmark points from 8K to 1M where available. GPT-5.5, GPT-5.4, and both DeepSeek V4 rows have full MRCR curves; Claude and Gemini rows use sparse published points.</p><ChartStage selectedRows={selectedRows} selectedIds={selectedIds} onToggle={(id) => setSelectedIds((current) => toggleSelectedId(current, id))} /></section>;
}
