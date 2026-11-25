import { useMemo } from 'react';

import { DECISION_COPY, decisionsInFlight } from './decisionModelCopy.ts';
import {
  DECISION_STOPS,
  STATE_STOPS,
  decisionBounds,
  decisionCounts,
  decisionEngines,
  decisionRail,
  decisionRows,
  listedRows,
} from './decisionModelModel.ts';
import { DecisionModelTable } from './DecisionModelTable.tsx';
import {
  contextLabel,
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
  decisionMachineScenario,
  machineSelection,
  pinAfter,
  selectMachine,
} from './figureScenario.ts';
import type { MachineScenarioState } from './figureScenario.ts';
import decisionStyles from './DecisionModelExplorer.module.css';
import shared from './Figure.module.css';

/** This figure's contract hooks, kept in one place: nothing else spells them. */
const ATTR = 'data-decision';

type DecisionState = {
  stateTokens: number;
  /** Decisions the deployment runs at once: the cache's own multiplier. */
  decisions: number;
  focusedId: string | null;
};

/** A state is read at a length the reader sets; four stops cover the shapes. */
const DEFAULT_DECISION: DecisionState = {
  stateTokens: STATE_STOPS[1],
  decisions: DECISION_STOPS[0],
  focusedId: null,
};

const decisionScenario = createStore<DecisionState>(DEFAULT_DECISION);

export default function DecisionModelExplorer() {
  const machine = decisionMachineScenario.use();
  const decision = decisionScenario.use();
  const choice = machineSelection(machine);
  const target = hardwareById(choice.hardwareId);

  const rows = useMemo(
    () => decisionRows(choice, decision.stateTokens, decision.decisions),
    [choice, decision]
  );
  // The chips price every runtime, so they read the set before the scope: a
  // chip's count is the list its own click leaves, and the strip may not thin
  // out as the reader presses it.
  const everyRow = useMemo(
    () =>
      decisionRows(
        { ...choice, engineId: 'all' },
        decision.stateTokens,
        decision.decisions
      ),
    [choice, decision]
  );
  const everyCount = decisionCounts(everyRow);
  const rail = useMemo(
    () => decisionRail(choice, decision.stateTokens, decision.decisions),
    [choice, decision]
  );
  const counts = decisionCounts(rows);
  // The table lists what the figure claims: the rows that fit at this workload.
  const listed = listedRows(rows);
  const bounds = decisionBounds(
    choice,
    rows,
    decision.stateTokens,
    decision.decisions
  );

  if (!target) return null;

  const runtimes: RuntimeEntry[] = decisionEngines(everyRow)
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
    selectMachine(decisionMachineScenario, patch);
    decisionScenario.update({ focusedId: null });
  };
  // A lever can delete the open row: the pin follows the list, never survives it
  // (one rule, `pinAfter`, shared with the fit figure).
  const lever = (patch: Partial<DecisionState>) => {
    const next = { ...decision, ...patch };
    decisionScenario.update({
      ...patch,
      focusedId: pinAfter(
        listedRows(decisionRows(choice, next.stateTokens, next.decisions)),
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
      speech={DECISION_COPY.speech(
        counts.fitting,
        counts.total,
        engineById(machine.engineId)?.label ?? null
      )}
      footnote={target.caveat || undefined}
      answer={
        <DecisionModelTable
          rows={listed}
          focusedId={decision.focusedId}
          stateTokens={decision.stateTokens}
          decisions={decision.decisions}
          budgetGib={bounds.maxGib}
          onSelect={(id) =>
            lever({ focusedId: decision.focusedId === id ? null : id })
          }
        />
      }
      rootProps={{
        [ATTR]: '',
        'data-decision-target': target.id,
        'data-decision-count': counts.fitting,
        'data-decision-total': counts.total,
      }}
    >
      {/* The fit calculator's instrument: the machine's memory beside the
          workload it prices, one row. The read-out spans both below them, so
          the workload band keeps only the controls that size it. */}
      <div className={shared.setup}>
        <FigureMemoryTrack
          dataAttr={ATTR}
          bounds={bounds}
          budgetGib={null}
          label={MEMORY_COPY.label}
          overfullLabel={MEMORY_PANEL.needed(
            DECISION_COPY.workloadAt(
              contextLabel(decision.stateTokens),
              decision.decisions
            )
          )}
          value={MEMORY_PANEL.value}
          zones={{
            weights: bounds.weightsGib,
            cache: bounds.cacheGib,
            os: bounds.reserveGib,
          }}
          keys={[
            { text: MEMORY_PANEL.weights('classifier', bounds.weightsGib) },
            {
              tone: 'cache',
              text: MEMORY_PANEL.cache(
                contextLabel(decision.stateTokens),
                decisionsInFlight(decision.decisions),
                bounds.cacheGib
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
              text: MEMORY_PANEL.breakdown(bounds.weightsGib, bounds.cacheGib),
            },
          ]}
          facts={hardwareFacts(target)}
          note={bounds.overfull ? MEMORY_PANEL.overfull('state') : null}
        />
        <div className={decisionStyles.levers}>
          <p className={decisionStyles.leversHead}>
            <span className={decisionStyles.leversTitle}>
              {DECISION_COPY.workload}
            </span>
          </p>
          <FigureStopSlider
            label={DECISION_COPY.stateSpoken}
            caption={DECISION_COPY.state}
            axis="state"
            stops={STATE_STOPS.map((tokens) => ({
              key: tokens,
              label: contextLabel(tokens),
              spoken: `${contextLabel(tokens)} state tokens`,
            }))}
            selected={decision.stateTokens}
            onStop={(stop) => lever({ stateTokens: stop.key })}
          />
          <FigureStopSlider
            label={DECISION_COPY.decisions}
            caption={DECISION_COPY.decisions}
            axis="decisions"
            stops={DECISION_STOPS.map((count) => ({
              key: count,
              label: `${count}`,
              spoken: `${count} ${count === 1 ? 'decision' : 'decisions'} in flight`,
            }))}
            selected={decision.decisions}
            onStop={(stop) => lever({ decisions: stop.key })}
          />
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
