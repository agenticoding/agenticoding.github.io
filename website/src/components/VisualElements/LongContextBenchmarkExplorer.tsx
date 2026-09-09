import React, { useEffect, useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ARENA_SOURCE,
  benchmarkRows,
  type BenchmarkRow,
} from './longContextBenchmarkData';
import {
  BenchmarkChartSvg,
  desktopChart,
  desktopXTicks,
  layoutCurveLabels,
  MobileCurveSummary,
  mobileChart,
  mobileXTicks,
  type CurveLabelLayout,
  type RenderedCurveLabel,
} from './LongContextBenchmarkChart';
import {
  benchmarkHueKeys,
  deriveDefaultSelections,
  groupChipTiers,
  hueClassOf,
} from './longContextBenchmarkModel';
import { ResponsiveDiagram } from './ResponsiveDiagram';
import styles from './LongContextBenchmarkExplorer.module.css';

// One hue per provider, ranked from the shipped rows — shared with the model
// cards via longContextBenchmarkModel.benchmarkHueKeys.
const chipGroups = groupChipTiers(benchmarkRows);
function ChartStage({
  selectedRows,
  selectedIds,
  onToggle,
}: {
  selectedRows: BenchmarkRow[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className={styles.chartStage}>
      <EvidenceChart
        selectedRows={selectedRows}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
      <ModelChipRail selectedIds={selectedIds} onToggle={onToggle} />
    </div>
  );
}

function EvidenceChart({
  selectedRows,
  selectedIds,
  onToggle,
}: {
  selectedRows: BenchmarkRow[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const labelLayout = useMemo(
    () => layoutCurveLabels(selectedRows, desktopChart),
    [selectedRows]
  );
  const labels = useRenderedCurveLabels(labelLayout);
  return (
    <ResponsiveDiagram
      className={styles.chartFigure}
      breakpoint="768px"
      mode="viewport"
      ariaLabel="Long-context benchmark curves plotted across context lengths."
      desktop={
        <BenchmarkChartSvg
          chart={desktopChart}
          ticks={desktopXTicks}
          rows={benchmarkRows}
          selectedIds={selectedIds}
          labels={labels}
          onToggle={onToggle}
          variant="desktop"
          hueKeys={benchmarkHueKeys}
        />
      }
      mobile={
        <>
          <BenchmarkChartSvg
            chart={mobileChart}
            ticks={mobileXTicks}
            rows={benchmarkRows}
            selectedIds={selectedIds}
            onToggle={onToggle}
            variant="mobile"
            hueKeys={benchmarkHueKeys}
          />
          <MobileCurveSummary rows={selectedRows} hueKeys={benchmarkHueKeys} />
        </>
      }
    />
  );
}

function ModelChipRail({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const pickerId = useId();
  const closeEditor = () => setMobileEditorOpen(false);
  const toggleLabel = mobileEditorOpen ? 'Close comparison' : 'Edit comparison';
  const toggleEditor = () => setMobileEditorOpen((open) => !open);
  return (
    <div className={styles.modelPicker} aria-label="Compare model evidence">
      <div className={styles.desktopChipGroups}>
        <ModelChipGroups selectedIds={selectedIds} onToggle={onToggle} />
      </div>
      <div className={styles.mobileModelPicker}>
        <button
          type="button"
          className={styles.modelEditorToggle}
          aria-expanded={mobileEditorOpen}
          aria-controls={pickerId}
          onClick={toggleEditor}
        >
          {toggleLabel}
        </button>
        <MobileEditorPanel
          id={pickerId}
          open={mobileEditorOpen}
          onDismiss={closeEditor}
        >
          <div className={styles.mobileEditorHeader}>
            <button
              type="button"
              className={styles.modelEditorToggle}
              onClick={closeEditor}
            >
              Done
            </button>
          </div>
          <ModelChipGroups selectedIds={selectedIds} onToggle={onToggle} />
        </MobileEditorPanel>
      </div>
    </div>
  );
}

function MobileEditorPanel({
  id,
  open,
  onDismiss,
  children,
}: {
  id: string;
  open: boolean;
  onDismiss: () => void;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div
      className={`${styles.mobileEditorLayer} ${open ? styles.mobileEditorLayerOpen : ''}`}
      aria-hidden={!open}
      inert={open ? undefined : true}
      onPointerDown={onDismiss}
    >
      <div
        id={id}
        className={`${styles.mobileEditorPanel} ${open ? styles.mobileEditorPanelOpen : ''}`}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className={styles.mobileEditorClip}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

function ModelChipGroups({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <>
      {chipGroups.map((group) => (
        <section
          key={group.label}
          className={styles.chipGroup}
          aria-label={group.label}
        >
          <p>{group.label}</p>
          <div className={styles.chipRail}>
            {group.rows.map((row) => (
              <ModelChip
                key={row.id}
                row={row}
                selected={selectedIds.includes(row.id)}
                onToggle={onToggle}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function ModelChip({
  row,
  selected,
  onToggle,
}: {
  row: BenchmarkRow;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.modelChip} ${styles[hueClassOf(benchmarkHueKeys, row.vendor)]} ${styles[row.signalTone]}`}
      aria-pressed={selected}
      onClick={() => onToggle(row.id)}
    >
      <strong>{row.model}</strong>
    </button>
  );
}

function useRenderedCurveLabels(labels: CurveLabelLayout[]) {
  const [renderedLabels, setRenderedLabels] = useState<RenderedCurveLabel[]>(
    labels.map((label) => ({ ...label, visible: true }))
  );

  useEffect(() => {
    setRenderedLabels((current) => mergeRenderedCurveLabels(current, labels));
  }, [labels]);

  useEffect(() => {
    if (renderedLabels.every((label) => label.visible)) return undefined;
    const timer = window.setTimeout(
      () =>
        setRenderedLabels((current) =>
          current.filter((label) => label.visible)
        ),
      220
    );
    return () => window.clearTimeout(timer);
  }, [renderedLabels]);

  return renderedLabels;
}

function mergeRenderedCurveLabels(
  current: RenderedCurveLabel[],
  labels: CurveLabelLayout[]
) {
  const selectedIds = new Set(labels.map((label) => label.row.id));
  const exitingLabels = current
    .filter((label) => !selectedIds.has(label.row.id))
    .map((label) => ({ ...label, visible: false }));
  return [
    ...labels.map((label) => ({ ...label, visible: true })),
    ...exitingLabels,
  ];
}

function getSelectedRows(selectedIds: string[]) {
  const selectedSet = new Set(selectedIds);
  return benchmarkRows.filter((row) => selectedSet.has(row.id));
}

function toggleSelectedId(selectedIds: string[], id: string) {
  if (selectedIds.includes(id))
    return selectedIds.length === 1
      ? selectedIds
      : selectedIds.filter((selectedId) => selectedId !== id);
  return normalizeSelectedIds([...selectedIds, id]);
}

function normalizeSelectedIds(selectedIds: string[]) {
  const selectedSet = new Set(selectedIds);
  return benchmarkRows
    .filter((row) => selectedSet.has(row.id))
    .map((row) => row.id);
}

export default function LongContextBenchmarkExplorer() {
  const [selectedIds, setSelectedIds] = useState(() =>
    deriveDefaultSelections(benchmarkRows)
  );
  const selectedRows = getSelectedRows(selectedIds);
  const containerClassName = styles.container;

  return (
    <section
      className={containerClassName}
      aria-label="Long-context benchmark explorer"
    >
      <p className={styles.provenance}>
        Effective-context retrieval by model, measured on{' '}
        <a href={ARENA_SOURCE}>Context Arena</a> (MRCR v2, 8-needle).
      </p>
      <ChartStage
        selectedRows={selectedRows}
        selectedIds={selectedIds}
        onToggle={(id) =>
          setSelectedIds((current) => toggleSelectedId(current, id))
        }
      />
    </section>
  );
}
