import { useMemo } from 'react';

import {
  AXIS_COPY,
  RETRIEVAL_COPY,
  capNote,
  spanLabel,
  workloadAt,
} from './retrievalCopy.ts';
import {
  KIND_SHAPES,
  TOKEN_STOPS,
  listedRows,
  retrievalBounds,
  retrievalCounts,
  retrievalEngines,
  retrievalRail,
  retrievalRows,
} from './retrievalModel.ts';
import { RetrievalModelTable } from './RetrievalModelTable.tsx';
import type { RetrievalKind } from './retrievalTypes.ts';
import {
  defaultSkuOfFamily,
  engineById,
  hardwareById,
} from './figureCatalog.ts';
import {
  FIGURE_CONTROLS,
  MEMORY_COPY,
  MEMORY_PANEL,
  hardwareFacts,
  runtimeChipSpoken,
} from './figureCopy.ts';
import { FigureMachineRail } from './FigureMachineRail.tsx';
import { FigureMemoryTrack } from './FigureMemoryTrack.tsx';
import type { RuntimeEntry } from './FigureRuntimeStrip.tsx';
import { FigureRuntimeStrip } from './FigureRuntimeStrip.tsx';
import { FigureShell } from './FigureShell.tsx';
import { FigureStopSlider } from './FigureStopSlider.tsx';
import {
  createStore,
  embeddingMachineScenario,
  machineSelection,
  pinAfter,
  rerankerMachineScenario,
  selectMachine,
} from './figureScenario.ts';
import type { MachineScenarioState, Store } from './figureScenario.ts';
import retrievalStyles from './RetrievalModelExplorer.module.css';
import shared from './Figure.module.css';

/**
 * One figure per family, one implementation. WHY: the two families are priced
 * the same way -- weights once, plus the tokens one batch reads -- so only the
 * levers' units, the words, and the dataset rows differ. A second copy would be
 * the first place the two figures disagreed about the same machine.
 */

type FigureState = {
  /** Tokens one text or one query-passage pair holds. */
  tokens: number;
  /** Items the model reads at once: a batch, or a candidate pool. */
  inFlight: number;
  focusedId: string | null;
};

const defaultState = (kind: RetrievalKind): FigureState => {
  const shape = KIND_SHAPES[kind];
  return {
    tokens: shape.tokensDefault,
    inFlight: shape.flightDefault,
    focusedId: null,
  };
};

/** The workload is the figure's own; the machine is a module store, one per
 * figure, so a click in one never resizes another figure's table. */
const workloadScenarios: Record<RetrievalKind, Store<FigureState>> = {
  embedding: createStore<FigureState>(defaultState('embedding')),
  reranking: createStore<FigureState>(defaultState('reranking')),
};

const machineScenarios: Record<RetrievalKind, Store<MachineScenarioState>> = {
  embedding: embeddingMachineScenario,
  reranking: rerankerMachineScenario,
};

/** This figure's contract hooks, kept in one place: nothing else spells them. */
const attrOf = (kind: RetrievalKind) => `data-${kind}`;

/** The stops are the guide's published lengths; the levers move between them. */
const tokenStops = TOKEN_STOPS.map((tokens) => ({
  key: tokens,
  label: spanLabel(tokens),
  spoken: `${spanLabel(tokens)} tokens`,
}));

function RetrievalFigure({ kind }: { kind: RetrievalKind }) {
  const shape = KIND_SHAPES[kind];
  const axis = AXIS_COPY[kind];
  const ATTR = attrOf(kind);
  const machineStore = machineScenarios[kind];
  const workloadStore = workloadScenarios[kind];
  const machine = machineStore.use();
  const workload = workloadStore.use();
  const choice = machineSelection(machine);
  const target = hardwareById(choice.hardwareId);

  const rows = useMemo(
    () => retrievalRows(kind, choice, workload.tokens, workload.inFlight),
    [kind, choice, workload]
  );
  // The chips price every runtime, so they read the set before the scope: a
  // chip's count is the list its own click leaves, and the strip may not thin
  // out as the reader presses it.
  const everyRow = useMemo(
    () =>
      retrievalRows(
        kind,
        { ...choice, engineId: 'all' },
        workload.tokens,
        workload.inFlight
      ),
    [kind, choice, workload]
  );
  const everyCount = retrievalCounts(everyRow);
  const rail = useMemo(
    () => retrievalRail(kind, choice, workload.tokens, workload.inFlight),
    [kind, choice, workload]
  );
  const counts = retrievalCounts(rows);
  // The table lists what the figure claims: the rows that serve this workload.
  const listed = listedRows(rows);
  const bounds = retrievalBounds(
    choice,
    rows,
    workload.tokens,
    workload.inFlight
  );

  if (!target) return null;

  const runtimes: RuntimeEntry[] = retrievalEngines(everyRow)
    .map((entry) => ({ entry, engine: engineById(entry.engineId) }))
    .filter(({ engine }) => engine !== undefined)
    .map(({ entry, engine }) => ({
      engineId: entry.engineId,
      label: engine?.label ?? entry.engineId,
      group: engine?.group ?? 'general',
      count: entry.count,
      coverage: entry.coverage,
      spoken: runtimeChipSpoken(
        engine?.label ?? entry.engineId,
        entry.count,
        entry.coverage
      ),
      state: 'supported' as const,
    }));

  // A machine choice clears the pin: a row open on one box may not exist on the
  // next, and the budget that decides its verdict is the machine's. A runtime is
  // a machine choice too: the table only lists what it serves.
  const pickMachine = (patch: Partial<MachineScenarioState>) => {
    selectMachine(machineStore, patch);
    workloadStore.update({ focusedId: null });
  };
  // A lever can delete the open row: the pin follows the list, never survives it
  // (one rule, `pinAfter`, shared with the other figures).
  const lever = (patch: Partial<FigureState>) => {
    const next = { ...workload, ...patch };
    workloadStore.update({
      ...patch,
      focusedId: pinAfter(
        listedRows(retrievalRows(kind, choice, next.tokens, next.inFlight)),
        next.focusedId,
        (row) => row.model.id
      ),
    });
  };

  return (
    <FigureShell
      dataAttr={ATTR}
      railLabel={FIGURE_CONTROLS.target}
      rail={
        <FigureMachineRail
          hardwareTarget={target}
          rail={rail}
          onFamily={(family) => {
            const sku = defaultSkuOfFamily(family);
            if (sku) pickMachine({ baseId: sku.id, devices: 1 });
          }}
          onBase={(baseId) => pickMachine({ baseId, devices: 1 })}
          onDevices={(devices) => pickMachine({ devices })}
        />
      }
      speech={RETRIEVAL_COPY.speech(
        shape.noun,
        shape.nounPlural,
        counts.fitting,
        counts.total,
        engineById(machine.engineId)?.label ?? null,
        counts.outOfRange,
        spanLabel(workload.tokens)
      )}
      footnote={target.caveat || undefined}
      answer={
        <RetrievalModelTable
          kind={kind}
          rows={listed}
          focusedId={workload.focusedId}
          tokensPerItem={workload.tokens}
          itemsInFlight={workload.inFlight}
          budgetGib={bounds.maxGib}
          onSelect={(id) =>
            lever({ focusedId: workload.focusedId === id ? null : id })
          }
        />
      }
      rootProps={{
        [ATTR]: '',
        [`${ATTR}-target`]: target.id,
        [`${ATTR}-count`]: counts.fitting,
        [`${ATTR}-total`]: counts.total,
      }}
    >
      {/* The same instrument as the other figures: the machine's memory beside
          the workload it prices, one row. The read-out spans both below them,
          so the workload band keeps only the controls that size it. */}
      <div className={shared.setup}>
        <FigureMemoryTrack
          dataAttr={ATTR}
          bounds={bounds}
          budgetGib={null}
          label={MEMORY_COPY.label}
          overfullLabel={MEMORY_PANEL.needed(
            workloadAt(
              spanLabel(workload.tokens),
              shape.unit,
              workload.inFlight
            )
          )}
          value={MEMORY_PANEL.value}
          zones={{
            weights: bounds.weightsGib,
            cache: bounds.workingSetGib,
            os: bounds.reserveGib,
          }}
          keys={[
            { text: MEMORY_PANEL.weights(shape.noun, bounds.weightsGib) },
            {
              tone: 'cache',
              text: MEMORY_PANEL.workingSet(
                spanLabel(workload.tokens),
                `${workload.inFlight} ${shape.unit}${
                  workload.inFlight === 1 ? '' : 's'
                } in flight`,
                bounds.workingSetGib
              ),
            },
            { tone: 'os', text: MEMORY_COPY.reserve(bounds.reserveGib) },
          ]}
          overfullKeys={[
            { tone: 'covered', text: MEMORY_PANEL.machine(bounds.maxGib) },
            {
              tone: 'over',
              text: MEMORY_PANEL.over(bounds.floorGib - bounds.maxGib),
            },
            {
              breakdown: true,
              text: MEMORY_PANEL.breakdownWorkingSet(
                bounds.weightsGib,
                bounds.workingSetGib
              ),
            },
          ]}
          facts={hardwareFacts(target)}
          note={bounds.overfull ? MEMORY_PANEL.overfull(shape.unit) : null}
        />
        <div className={retrievalStyles.levers}>
          <p className={retrievalStyles.leversHead}>
            <span className={retrievalStyles.leversTitle}>
              {RETRIEVAL_COPY.workload}
            </span>
          </p>
          <FigureStopSlider
            label={axis.lengthSpoken}
            caption={axis.length}
            axis={`${kind}-length`}
            stops={tokenStops}
            selected={workload.tokens}
            onStop={(stop) => lever({ tokens: stop.key })}
          />
          <FigureStopSlider
            label={axis.flight}
            caption={axis.flight}
            axis={`${kind}-flight`}
            stops={shape.flightStops.map((count) => ({
              key: count,
              label: `${count}`,
              spoken: `${count} ${shape.unit}${count === 1 ? '' : 's'} in flight`,
            }))}
            selected={workload.inFlight}
            onStop={(stop) => lever({ inFlight: stop.key })}
          />
          {/* A cap is why a row left the list: the count alone would read as a
              machine limit, so the sentence names the cap as the cause. */}
          {counts.outOfRange > 0 ? (
            <p className={retrievalStyles.capNote}>
              {capNote(
                shape.noun,
                shape.nounPlural,
                counts.outOfRange,
                spanLabel(workload.tokens)
              )}
            </p>
          ) : null}
        </div>
      </div>

      <FigureRuntimeStrip
        dataAttr={ATTR}
        selectedId={machine.engineId}
        onSelect={(engineId) => pickMachine({ engineId })}
        any={{
          engineId: 'all',
          label: FIGURE_CONTROLS.anyRuntime,
          group: 'general',
          count: everyCount.fitting,
          coverage: everyCount.total,
          spoken: runtimeChipSpoken(
            FIGURE_CONTROLS.anyRuntime,
            everyCount.fitting,
            everyCount.total
          ),
          state: 'supported',
        }}
        entries={runtimes}
      />
    </FigureShell>
  );
}

/** The embedder figure: which vector model fits, at the batch you index with. */
export function EmbeddingModelExplorer() {
  return <RetrievalFigure kind="embedding" />;
}

/** The reranker figure: which cross-encoder fits, at the pool you score. */
export function RerankerModelExplorer() {
  return <RetrievalFigure kind="reranking" />;
}
