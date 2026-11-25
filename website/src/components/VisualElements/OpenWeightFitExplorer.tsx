import { useMemo } from 'react';

import { defaultSkuOfFamily } from './figureCatalog.ts';
import {
  FIGURE_CONTROLS,
  hardwareFacts,
  MEMORY_COPY,
  MEMORY_PANEL,
  runtimeChipSpoken,
} from './figureCopy.ts';
import type { HardwareFamily } from './figureTypes.ts';
import { pinAfter } from './figureScenario.ts';
import { FigureMachineRail } from './FigureMachineRail.tsx';
import { FigureMemoryTrack } from './FigureMemoryTrack.tsx';
import { FigureRuntimeStrip } from './FigureRuntimeStrip.tsx';
import type { RuntimeEntry } from './FigureRuntimeStrip.tsx';
import { FigureShell } from './FigureShell.tsx';
import { fitCountSpeech } from './openWeightFitCopy.ts';
import { contextLabel, hardwareById, readerBudget } from './figureCatalog.ts';
import {
  budgetBounds,
  contextOptions,
  conversationOptions,
  conversationsLabel,
  engineOptions,
  fittingRows,
  modelCount,
  mtpOptions,
  outcomeOf,
  railOptions,
  resolveRows,
} from './openWeightFitModel.ts';
import {
  scenarioSelection,
  useScenario,
  updateScenario,
} from './openWeightFitScenario.ts';
import type { ScenarioState } from './openWeightFitScenario.ts';
import { OpenWeightFitTable } from './OpenWeightFitTable.tsx';
import { OpenWeightFitWorkloadControls } from './OpenWeightFitWorkloadControls.tsx';
import styles from './Figure.module.css';

/** This figure's contract hooks, kept in one place: nothing else spells them. */
const ATTR = 'data-fit';

export default function OpenWeightFitExplorer() {
  const { scenario, selection } = useScenario();

  // Raw choices can go stale when the hardware changes; the store clamps them,
  // so the instrument never shows an empty or inert result set.
  const hardwareTarget = hardwareById(selection.hardwareId);

  const rows = useMemo(() => resolveRows(selection), [selection]);
  const fitting = useMemo(() => fittingRows(rows), [rows]);
  const outcome = useMemo(() => outcomeOf(rows), [rows]);
  const engines = useMemo(() => engineOptions(selection), [selection]);
  const contexts = useMemo(() => contextOptions(selection), [selection]);
  const conversations = useMemo(
    () => conversationOptions(selection),
    [selection]
  );
  // Every rail number is one promise: the fits its own click leaves.
  const rail = useMemo(() => railOptions(selection), [selection]);
  // The drafter lever's own numbers: the fits each of its states leaves, and the
  // size it moves. One resolver call feeds the chips and their caption.
  const mtp = useMemo(() => mtpOptions(selection), [selection]);

  if (!hardwareTarget) return null;

  // The track's ends, resolved once: the panel draws them and states the one
  // case its scale cannot hold.
  const bounds = budgetBounds(hardwareTarget, selection);

  const pinned = rows.find((row) => row.model.id === scenario.focusedModelId);

  // Two writers, as the classifier has. A press that re-scopes the table (the
  // rail, the runtime strip) drops the open card, so the card closes by its own
  // flight; a press that reprices one card (a lever, the budget, a runtime named
  // inside that card) keeps it only while the list still holds its row.
  const pickMachine = (patch: Partial<ScenarioState>) =>
    updateScenario({ ...patch, focusedModelId: null });
  const reprice = (patch: Partial<ScenarioState>) => {
    const next = { ...scenario, ...patch };
    updateScenario({
      ...patch,
      focusedModelId: pinAfter(
        fittingRows(resolveRows(scenarioSelection(next))),
        next.focusedModelId,
        (row) => row.model.id
      ),
    });
  };
  const pickFamily = (family: HardwareFamily) => {
    const sku = defaultSkuOfFamily(family);
    if (sku) pickMachine({ baseId: sku.id, devices: 1 });
  };

  // The strip's whole claim, one entry per runtime: what a click promises and
  // what the source says about this platform. The fit resolver's three states
  // map onto the shared ones without inventing a fourth.
  const runtimes: RuntimeEntry[] = engines.map((option) => {
    const reach = option.beatsBaseline ? option.reach : 0;
    return {
      engineId: option.engine.id,
      label: option.engine.label,
      group: option.engine.group,
      count: option.fits,
      coverage: option.coverage,
      spoken: runtimeChipSpoken(
        option.engine.label,
        option.fits,
        option.coverage,
        reach
      ),
      reach,
      state:
        option.state === 'unsupported'
          ? 'unsupported'
          : option.state === 'sized'
            ? 'supported'
            : 'untested',
    };
  });

  return (
    <FigureShell
      dataAttr={ATTR}
      railLabel={FIGURE_CONTROLS.target}
      rail={
        <FigureMachineRail
          hardwareTarget={hardwareTarget}
          rail={rail}
          onFamily={pickFamily}
          onBase={(baseId) => pickMachine({ baseId, devices: 1 })}
          onDevices={(devices) => pickMachine({ devices })}
        />
      }
      speech={fitCountSpeech(outcome.fitting, outcome.total)}
      footnote={hardwareTarget.caveat || undefined}
      answer={
        // Every row starts collapsed: the pin is the reader's, so the table opens
        // only the row they clicked — and that same row's next click closes it
        // again, because a disclosure the reader cannot shut is a dead end.
        <OpenWeightFitTable
          rows={fitting}
          focusedId={pinned?.model.id ?? null}
          conversations={selection.conversations}
          budgetGib={readerBudget(bounds, scenario.budgetGib)}
          onSelect={(modelId) =>
            updateScenario({
              focusedModelId:
                scenario.focusedModelId === modelId ? null : modelId,
            })
          }
          onEngine={(engineId) => reprice({ engineId })}
        />
      }
      rootProps={{
        [ATTR]: '',
        'data-fit-target': hardwareTarget.id,
        // The counts travel as data: the page prints them chip by chip, so no
        // contract has to parse prose to find them.
        'data-fit-count': outcome.fitting,
        'data-fit-total': outcome.total,
      }}
    >
      {/* Both levers the reader sets, on one row: the workload's cache is a
          zone in the track beside it, so moving an axis redraws the cost. */}
      <div className={styles.setup}>
        <FigureMemoryTrack
          dataAttr={ATTR}
          bounds={bounds}
          budgetGib={scenario.budgetGib}
          onBudget={(gib) => reprice({ budgetGib: gib })}
          label={MEMORY_COPY.label}
          overfullLabel={MEMORY_PANEL.needed(
            contextLabel(selection.contextTokens)
          )}
          value={MEMORY_PANEL.value}
          zones={{
            weights: bounds.weightsGib,
            cache: bounds.cacheGib,
            os: bounds.reserveGib,
          }}
          keys={[
            { text: MEMORY_PANEL.weights('model', bounds.weightsGib) },
            {
              tone: 'cache',
              text: MEMORY_PANEL.cache(
                contextLabel(selection.contextTokens),
                conversationsLabel(selection.conversations),
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
          facts={hardwareFacts(hardwareTarget)}
          note={bounds.overfull ? MEMORY_PANEL.overfull('context') : null}
        />
        <OpenWeightFitWorkloadControls
          selection={selection}
          contextOptions={contexts}
          conversationOptions={conversations}
          onContext={(next) => reprice({ contextTokens: next })}
          onConversations={(next) => reprice({ conversations: next })}
          onMtpEnabled={(next) => reprice({ mtpEnabled: next })}
          mtp={mtp}
          mtpTotal={modelCount}
        />
      </div>

      {/* The guide's second dimension: what runs on the machine, not the
          machine itself, so it sits with the answer rather than the rail. */}
      <FigureRuntimeStrip
        dataAttr={ATTR}
        selectedId={scenario.engineId}
        onSelect={(engineId) => pickMachine({ engineId })}
        any={{
          engineId: 'all',
          label: FIGURE_CONTROLS.anyRuntime,
          group: 'general',
          count: rail.anyEngineFits,
          coverage: modelCount,
          spoken: runtimeChipSpoken(
            FIGURE_CONTROLS.anyRuntime,
            rail.anyEngineFits,
            modelCount
          ),
          state: 'supported',
        }}
        entries={runtimes}
      />
    </FigureShell>
  );
}
