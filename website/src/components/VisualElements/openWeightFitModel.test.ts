import assert from 'node:assert/strict';
import test from 'node:test';

import { dataset } from './openWeightFitData.ts';
import { servesEngine } from './figureCatalog.ts';
import { ENGINE_COPY } from './figureCopy.ts';
import {
  drafterInventory,
  engineCount,
  modelAnswerLine,
  mtpLine,
  needBreakdown,
  onlyHereText,
  rowDiskLine,
  rowMemoryCell,
  rowSetupLine,
} from './openWeightFitCopy.ts';
import type { RuntimeRow, Selection } from './openWeightFitModel.ts';
import {
  CONVERSATION_STOPS,
  CONTEXT_STOPS,
  batchingRows,
  clampedSelection,
  concurrentConversations,
  contextOptions,
  conversationCacheGib,
  conversationOptions,
  engineOptions,
  budgetBounds,
  fittingRows,
  fitsWorkload,
  memoryFigure,
  modelCount,
  modelTierRows,
  mtpDelta,
  mtpOptions,
  needAt,
  outcomeOf,
  railOptions,
  reachableStops,
  requestCachePerToken,
  resolveRows,
  tierSummary,
} from './openWeightFitModel.ts';
import {
  engineSupports,
  formatGib,
  budgetStep,
  defaultBudget,
  defaultSkuOfFamily,
  hardwareById,
  hardwareOfFamily,
  readerBudget,
} from './figureCatalog.ts';

const { models } = dataset;
const screened = dataset.hardware.filter((entry) => entry.screenGib !== null);
const fitsAt = (selection: Selection) =>
  outcomeOf(resolveRows(selection)).fitting;
/** An option is a choice only when it states something the reader can compare. */
const hasEvidence = (option: RuntimeRow) =>
  option.label !== '' ||
  option.requiredGib !== null ||
  option.capTokens !== null ||
  option.diskGib !== null ||
  option.speed !== null;

test('every checkpoint carries the identity the page renders', () => {
  for (const model of models) {
    assert.ok(model.sourceUrl, `${model.name} source`);
  }
});

test('a budget never loses a fit when it grows', () => {
  for (const engineId of ['all', 'llamacpp', 'vllm', 'sglang']) {
    for (const contextTokens of CONTEXT_STOPS) {
      // A bigger budget is only monotonic when the machine can price the same
      // host tier: a streamed layout needs a published system-memory figure.
      for (const devices of [1, 2, 4, 8, 16, 32])
        for (const hasHost of [true, false]) {
          const fitsByHardware = screened
            .filter(
              (entry) =>
                entry.family === 'datacenter' &&
                entry.devices === devices &&
                (entry.hostGib !== null) === hasHost
            )
            .map((entry) => ({
              budget: entry.screenGib ?? 0,
              fits: fitsAt({
                hardwareId: entry.id,
                engineId,
                contextTokens,
                conversations: 1,
              }),
            }))
            .sort((a, b) => a.budget - b.budget);
          for (let index = 1; index < fitsByHardware.length; index += 1) {
            const previous = fitsByHardware[index - 1];
            const current = fitsByHardware[index];
            assert.ok(
              current.fits >= previous.fits,
              `${engineId} @ ${contextTokens}: ${current.budget} GiB fit fewer than ${previous.budget} GiB`
            );
          }
        }
    }
  }
});

test('required memory never shrinks as context grows', () => {
  for (const model of models) {
    const stops = CONTEXT_STOPS.filter((stop) => stop <= model.nativeTokens);
    let last = 0;
    for (const stop of stops) {
      const row = resolveRows({
        hardwareId: 'rtx-pro-6000',
        engineId: 'all',
        contextTokens: stop,
        conversations: 1,
      }).find((candidate) => candidate.model.id === model.id);
      assert.ok(row?.requiredGib != null, model.name);
      assert.ok(row.requiredGib >= last - 1e-9, `${model.name} at ${stop}`);
      last = row.requiredGib;
    }
  }
});

test('published anchors are never labelled interpolated, and values stay inside them', () => {
  for (const model of models) {
    const rows = CONTEXT_STOPS.map((stop) =>
      resolveRows({
        hardwareId: 'b300-8',
        engineId: 'all',
        contextTokens: stop,
        conversations: 1,
      }).find((row) => row.model.id === model.id)
    ).filter(
      (row) =>
        row?.requiredGib != null &&
        row !== undefined &&
        // The published anchors price the guide's path; a cited configuration is
        // a different artifact and has its own figure.
        row.chosenRuntime?.source === 'priced'
    );
    for (const row of rows) {
      const value = row.requiredGib as number;
      // The published anchors price the guide's path; the drafter toggle moves
      // the figure on top of them, so the anchor part stays bounded.
      const anchorValue = value - row.mtpDelta;
      assert.ok(
        anchorValue >= model.need64k.gib - 1e-9 &&
          anchorValue <= model.needNative.gib + 1e-9,
        `${model.name}: ${value} outside anchors`
      );
      if (row.interpolated) {
        assert.ok(
          anchorValue > model.need64k.gib && anchorValue < model.needNative.gib,
          model.name
        );
      }
    }
    if (rows.length)
      assert.equal(rows[0].interpolated, false, `${model.name} first anchor`);
  }
});

test('a runtime without a published footprint is never offered', () => {
  // The guide sizes one path per checkpoint. A second runtime that names the
  // checkpoint but publishes no layout or configuration has nothing to compare,
  // so it is absent from the row instead of standing in as a placeholder.
  const rows = resolveRows({
    hardwareId: 'rtx5090',
    engineId: 'llamacpp',
    contextTokens: 65_536,
    conversations: 1,
  });
  const crossPath = rows.filter((row) => row.model.pathEngineId !== 'llamacpp');
  assert.ok(
    crossPath.length > 0,
    'llama.cpp is a second runtime for some rows'
  );
  for (const row of crossPath) {
    // Whatever llama.cpp publishes here, it is cited evidence, not a stub.
    if (row.chosenRuntime !== null) {
      assert.equal(row.chosenRuntime.engineId, 'llamacpp', row.model.name);
      assert.ok(hasEvidence(row.chosenRuntime), row.model.name);
      continue;
    }
    assert.equal(row.requiredGib, null, row.model.name);
    assert.ok(!fitsWorkload(row), row.model.name);
  }
  for (const row of rows)
    for (const option of row.runtimes)
      assert.ok(
        hasEvidence(option),
        `${row.model.name}/${option.engineId} is a placeholder`
      );
});

test('an engine filter only returns checkpoints it serves', () => {
  for (const engineId of ['llamacpp', 'vllm', 'mlx', 'gr8', 'warp']) {
    for (const row of resolveRows({
      hardwareId: 'rtx5090',
      engineId,
      contextTokens: 262_144,
      conversations: 1,
    })) {
      assert.ok(
        servesEngine(row.model, engineId),
        `${row.model.name} does not serve ${engineId}`
      );
    }
  }
});

test('a context past the native cap reads as exceeding memory', () => {
  const rows = resolveRows({
    hardwareId: 'gb300-32',
    engineId: 'all',
    contextTokens: 1_048_576,
    conversations: 1,
  });
  const shortContext = rows.filter((row) => row.model.nativeTokens < 1_048_576);
  assert.ok(shortContext.length > 0);
  for (const row of shortContext) {
    assert.equal(row.beyondNativeCap, true, row.model.name);
    assert.equal(fitsWorkload(row), false, row.model.name);
  }
});

test('every machine carries the memory it printed and the reserve it keeps', () => {
  for (const entry of dataset.hardware) {
    assert.ok(entry.nominalGib > 0, entry.id);
    assert.ok(entry.reserveGib > 0, entry.id);
    assert.ok(entry.reserveGib < entry.nominalGib, entry.id);
    // The guide's screening figure is the printed capacity less the reserve, so
    // the two can never drift apart where it publishes one.
    if (entry.screenGib !== null)
      assert.equal(defaultBudget(entry), entry.screenGib, entry.id);
  }
});

test('a budget track offers a range between its reserved ends', () => {
  for (const entry of dataset.hardware) {
    for (const contextTokens of [CONTEXT_STOPS[0], CONTEXT_STOPS[2]]) {
      const bounds = budgetBounds(entry, {
        hardwareId: entry.id,
        engineId: 'all',
        contextTokens,
        conversations: 1,
      });
      const step = budgetStep(bounds.trackGib);
      assert.ok(bounds.minGib > 0, entry.id);
      assert.ok(bounds.minGib <= bounds.maxGib, entry.id);
      assert.ok(bounds.maxGib < bounds.trackGib, entry.id);
      assert.ok(bounds.reserveGib > 0, entry.id);
      assert.ok(bounds.weightsGib > 0, entry.id);
      // The ends are the step grid, so the thumb always lands on its value.
      for (const bound of [bounds.minGib, bounds.maxGib])
        assert.ok(
          Math.abs(bound / step - Math.round(bound / step)) < 1e-9,
          `${entry.id} ${bound} off the ${step} grid`
        );
      if (!bounds.outgrown)
        assert.ok(bounds.minGib >= bounds.floorGib, entry.id);
    }
  }
});

test('the floor is the smallest model that can serve the context', () => {
  const target = hardwareById('rtx4090')!;
  const at = (contextTokens: number, conversations = 1) =>
    budgetBounds(target, {
      hardwareId: target.id,
      engineId: 'all',
      contextTokens,
      conversations,
    });
  for (const contextTokens of CONTEXT_STOPS) {
    const bounds = at(contextTokens);
    // A model that stops before this context cannot price it: the cache it
    // would draw counts tokens it never reads.
    const lightest = Math.min(
      ...models
        .filter((model) => model.nativeTokens >= contextTokens)
        .map((model) => needAt(model, contextTokens, 1).gib)
    );
    assert.ok(
      Math.abs(bounds.floorGib - lightest) < 1e-9,
      `${contextTokens} floors at ${bounds.floorGib}, not ${lightest}`
    );
    // Weights load once, caches multiply: the floor is their sum.
    for (const conversations of [1, 16]) {
      const split = at(contextTokens, conversations);
      assert.ok(
        Math.abs(split.weightsGib + split.cacheGib - split.floorGib) < 1e-9,
        `${contextTokens} × ${conversations}`
      );
    }
  }
  // The reported bug: a longer context must repaint the cache zone.
  assert.ok(at(262_144).cacheGib > at(131_072).cacheGib);
  assert.ok(at(262_144).floorGib > at(131_072).floorGib);
});

test('the list is exactly the rows that fit the settings', () => {
  // The count, every rail chip, and the table read one predicate. Pin it over
  // the matrix: a listed row carries a number at or under the budget, at a
  // context its model serves, on the runtime that sized it.
  for (const entry of screened)
    for (const contextTokens of CONTEXT_STOPS)
      for (const conversations of CONVERSATION_STOPS)
        for (const engineId of ['all', 'vllm', 'llamacpp']) {
          const selection = {
            hardwareId: entry.id,
            engineId,
            contextTokens,
            conversations,
          };
          const rows = resolveRows(clampedSelection(selection));
          const fitting = fittingRows(rows);
          assert.equal(outcomeOf(rows).fitting, fitting.length);
          for (const row of fitting) {
            assert.equal(row.beyondNativeCap, false, row.model.name);
            assert.ok(
              row.surplusGib !== null && row.surplusGib >= 0,
              row.model.name
            );
          }
          for (let index = 1; index < fitting.length; index += 1)
            assert.ok(
              fitting[index].requiredGib >= fitting[index - 1].requiredGib,
              `${entry.id} ${engineId} is unordered`
            );
        }
});

test('an outgrown track always lands on the zero verdict', () => {
  // The track's explanation sits in the zero band, not in the panel. That is
  // sound only if the panel's own arithmetic guarantees that nothing fits when
  // the note speaks, so the note is never the only word on the page.
  for (const entry of dataset.hardware)
    for (const contextTokens of CONTEXT_STOPS)
      for (const conversations of CONVERSATION_STOPS) {
        const selection = {
          hardwareId: entry.id,
          engineId: 'all',
          contextTokens,
          conversations,
        };
        const bounds = budgetBounds(entry, selection);
        if (!bounds.outgrown) continue;
        assert.equal(
          outcomeOf(resolveRows(selection)).fitting,
          0,
          `${entry.id} ${contextTokens} x ${conversations}`
        );
      }
});

test('an overfull track always exceeds the machine it draws', () => {
  // The overfull strip states the need against the machine; the ratio it draws
  // is true only while the need is above the supply. The flag is the one gate
  // for that comparison, so every state that shows it must satisfy it.
  for (const entry of dataset.hardware)
    for (const contextTokens of CONTEXT_STOPS)
      for (const conversations of CONVERSATION_STOPS) {
        const bounds = budgetBounds(entry, {
          hardwareId: entry.id,
          engineId: 'all',
          contextTokens,
          conversations,
        });
        if (!bounds.overfull) continue;
        assert.ok(
          bounds.floorGib > bounds.maxGib,
          `${entry.id} ${contextTokens} x ${conversations}`
        );
        assert.equal(bounds.minGib, bounds.maxGib, entry.id);
      }
});

test('a lower budget never adds a fit', () => {
  const target = hardwareById('rtx4090')!;
  const bounds = budgetBounds(target, {
    hardwareId: target.id,
    engineId: 'all',
    contextTokens: 65_536,
    conversations: 1,
  });
  const fitsAtBudget = (budgetGib: number) =>
    fitsAt({
      hardwareId: target.id,
      engineId: 'all',
      contextTokens: 65_536,
      conversations: 1,
      budgetGib,
    });
  let previous = fitsAtBudget(bounds.minGib);
  for (const gib of [bounds.minGib + 4, bounds.minGib + 8, bounds.maxGib]) {
    const fits = fitsAtBudget(gib);
    assert.ok(fits >= previous, `${gib} GiB lost a fit`);
    previous = fits;
  }
  // The reader's number reaches the resolver: a budget no model can fit fits none.
  assert.equal(fitsAtBudget(1), 0);
});

test('a workload that outgrows the machine parks the thumb at the ceiling', () => {
  const bounds = budgetBounds(hardwareById('rtx4090')!, {
    hardwareId: 'rtx4090',
    engineId: 'all',
    contextTokens: 65_536,
    conversations: 256,
  });
  assert.ok(bounds.outgrown, 'a 4090 held 256 conversations');
  assert.equal(bounds.minGib, bounds.maxGib);
  assert.ok(bounds.floorGib > bounds.maxGib);
  // The range is empty, so the panel stops offering a handle and draws the need
  // against the machine instead. One flag owns both facts.
  assert.ok(bounds.overfull);
});

test('a platform the guide never screens still gets a scale and rows', () => {
  for (const family of ['amd', 'apple'] as const) {
    for (const entry of hardwareOfFamily(family)) {
      const selection: Selection = {
        hardwareId: entry.id,
        engineId: 'all',
        contextTokens: 65_536,
        conversations: 1,
      };
      const rows = resolveRows(selection);
      assert.ok(rows.length > 0, entry.id);
      // The list only carries priced rows; a cited configuration is a choice
      // in the comparison, never a number in the table.
      for (const row of fittingRows(rows))
        assert.ok(Number.isFinite(row.requiredGib), entry.id);
      const bounds = budgetBounds(entry, selection);
      assert.ok(bounds.maxGib > bounds.minGib, entry.id);
      assert.ok(
        contextOptions(selection).length === CONTEXT_STOPS.length,
        entry.id
      );
      assert.ok(conversationOptions(selection).length > 0, entry.id);
      // A runtime's coverage never exceeds the table it filters.
      for (const option of engineOptions(selection))
        assert.ok(option.coverage <= rows.length, entry.id);
    }
  }
});

test('the list ranks by what each model needs', () => {
  for (const entry of screened) {
    for (const engineId of ['all', 'vllm']) {
      const fitting = fittingRows(
        resolveRows({
          hardwareId: entry.id,
          engineId,
          contextTokens: 65_536,
          conversations: 1,
        })
      );
      for (let index = 1; index < fitting.length; index += 1)
        assert.ok(
          fitting[index].requiredGib >= fitting[index - 1].requiredGib,
          `${entry.id} ${engineId} is unordered`
        );
    }
  }
});

test('a listed row always prints a published figure', () => {
  const rows = resolveRows({
    hardwareId: 'h200-8',
    engineId: 'vllm',
    contextTokens: 65_536,
    conversations: 1,
  });
  for (const row of fittingRows(rows)) {
    assert.ok(Number.isFinite(row.requiredGib), row.model.name);
    assert.match(rowMemoryCell(row), /^[⇢≈]?[\d,.]+\+?$/);
  }
  // A runtime with no cited footprint is never listed as a fit.
  for (const row of rows.filter((entry) => entry.requiredGib === null))
    assert.ok(!fitsWorkload(row), row.model.name);
});

test('a row names the context its number was taken at', () => {
  // A model that cannot serve the slider's context prints its own cap's number,
  // so that number must say which context it belongs to.
  const rows = resolveRows({
    hardwareId: 'rtx4090',
    engineId: 'all',
    contextTokens: 524_288,
    conversations: 1,
  });
  const capped = rows.filter((row) => row.beyondNativeCap);
  assert.ok(capped.length > 0, 'no row stops before the slider');
  for (const row of capped) {
    assert.match(rowSetupLine(row), / · at \d+K/);
    assert.ok(rowSetupLine(row).startsWith(row.pathLabel));
  }
  for (const row of rows.filter((entry) => !entry.beyondNativeCap))
    assert.ok(rowSetupLine(row).startsWith(row.pathLabel));
});

test('a row past its own cap carries no surplus', () => {
  for (const entry of screened) {
    for (const engineId of ['all', 'llamacpp', 'vllm']) {
      const rows = resolveRows({
        hardwareId: entry.id,
        engineId,
        contextTokens: 524_288,
        conversations: 1,
      });
      for (const row of rows) {
        if (
          row.beyondNativeCap ||
          // No option carries a figure for this checkpoint on this runtime.
          row.chosenRuntime === null ||
          row.chosenRuntime.state === 'unsized' ||
          row.chosenRuntime.state === 'devices'
        )
          assert.equal(row.surplusGib, null, row.model.name);
        else assert.equal(typeof row.surplusGib, 'number', row.model.name);
      }
    }
  }
});

test('outcome counts account for every row', () => {
  for (const entry of screened.slice(0, 8)) {
    const rows = resolveRows({
      hardwareId: entry.id,
      engineId: 'all',
      contextTokens: 262_144,
      conversations: 1,
    });
    const counts = outcomeOf(rows);
    assert.equal(counts.total, rows.length, entry.id);
    assert.equal(counts.fitting, fittingRows(rows).length, entry.id);
    assert.ok(counts.fitting <= counts.total, entry.id);
  }
});

test('engine options follow the guide platform table', () => {
  for (const family of ['workstation', 'datacenter', 'amd', 'apple'] as const) {
    const target = hardwareOfFamily(family)[0];
    const options = engineOptions({
      hardwareId: target.id,
      engineId: 'all',
      contextTokens: 131_072,
      conversations: 1,
    });
    assert.equal(options.length, dataset.engines.length);
    for (const option of options) {
      assert.equal(
        option.state === 'unsupported',
        !engineSupports(option.engine, family),
        `${option.engine.id} on ${family}`
      );
    }
  }
});

test('a runtime is selectable exactly when the guide documents it here', () => {
  for (const family of ['workstation', 'datacenter', 'amd', 'apple'] as const) {
    const target = hardwareOfFamily(family)[0];
    const base = {
      hardwareId: target.id,
      contextTokens: CONTEXT_STOPS[0],
      conversations: 1,
    };
    const options = engineOptions({ ...base, engineId: 'all' });
    assert.ok(options.some((option) => option.coverage > 0));
    for (const option of options) {
      const clamped = clampedSelection({ ...base, engineId: option.engine.id });
      assert.equal(
        clamped.engineId === option.engine.id,
        option.state !== 'unsupported' && option.coverage > 0,
        `${option.engine.id} on ${family} is ${option.state}`
      );
    }
  }
});

test('every offered runtime prints the count its click leaves', () => {
  for (const hardwareId of ['rtx4090', 'spark', 'apple-m4-max', 'mi355x'])
    for (const contextTokens of [65_536, 262_144]) {
      const selection = clampedSelection({
        hardwareId,
        engineId: 'all',
        contextTokens,
        conversations: 1,
      });
      for (const option of engineOptions(selection)) {
        const clicked = clampedSelection({
          ...selection,
          engineId: option.engine.id,
        });
        if (option.state === 'unsupported' || option.coverage === 0) {
          // No chip, so the store never holds it: the click lands on `all`.
          assert.equal(
            clicked.engineId,
            'all',
            `${hardwareId}/${option.engine.id}`
          );
          continue;
        }
        assert.equal(clicked.engineId, option.engine.id);
        assert.equal(
          outcomeOf(resolveRows(clicked)).fitting,
          option.fits,
          `${hardwareId}/${option.engine.id}`
        );
      }
    }
});

test('coverage counts the checkpoints the guide names for a runtime', () => {
  for (const hardwareId of ['rtx4090', 'apple-m4-max']) {
    for (const option of engineOptions({
      hardwareId,
      engineId: 'all',
      contextTokens: 65_536,
      conversations: 1,
    }))
      assert.equal(
        option.coverage,
        models.filter((model) => servesEngine(model, option.engine.id)).length,
        option.engine.id
      );
  }
});

test('a runtime chip states its scope, and its gain in words', () => {
  // A chip's words and the model's rule are one fact: the phrase appears
  // exactly when the model says the runtime beats the general baseline. The
  // colour repeats that phrase, so nothing here depends on the hue.
  for (const entry of dataset.hardware)
    for (const contextTokens of CONTEXT_STOPS) {
      const options = engineOptions({
        hardwareId: entry.id,
        engineId: 'all',
        contextTokens,
        conversations: 1,
      }).filter(
        (option) => option.state !== 'unsupported' && option.coverage > 0
      );
      for (const option of options) {
        const where = `${entry.id}/${option.engine.id}`;
        // The denominator is a superset of the printed count, or the chip
        // would promise a share larger than the list it shares.
        assert.ok(option.fits <= option.coverage, where);
        assert.ok(option.reach <= option.fits, where);
        const gain = option.beatsBaseline ? onlyHereText(option.reach) : null;
        if (option.beatsBaseline) {
          assert.ok(gain?.endsWith('only here'), where);
          assert.ok(gain?.startsWith(String(option.reach)), where);
        } else assert.equal(gain, null, where);
        // `0 only here` is a contradiction; the phrase never states a zero.
        assert.equal(onlyHereText(0), null, where);
        assert.equal(
          engineCount(option.fits, option.coverage).split('/').length,
          2,
          where
        );
      }
    }
  // The sentence that defines the phrase the gain marks print.
  assert.match(ENGINE_COPY.specializedNote, /“only here”/);
  // "Any runtime" is scoped to every checkpoint, never to the selected engine:
  // its denominator cannot move when the reader picks a runtime.
  assert.equal(modelCount, models.length);
});

test('a specialized runtime the guide names reaches the machine it serves', () => {
  const shown = (hardwareId: string) =>
    engineOptions({
      hardwareId,
      engineId: 'all',
      contextTokens: 65_536,
      conversations: 1,
    })
      .filter((option) => option.state !== 'unsupported' && option.coverage > 0)
      .map((option) => option.engine.id);
  const workstation = shown('rtx4090');
  for (const id of ['dwarfstar', 'gr8', 'delta', 'ljqinfer', 'pulsar'])
    assert.ok(workstation.includes(id), `workstation hides ${id}`);
  for (const id of ['warp', 'pulsarmlx'])
    assert.ok(shown('apple-m4-max').includes(id), `apple hides ${id}`);
  // The vendor gate still hides what the guide never documents here.
  assert.ok(!workstation.includes('warp'));
});

test('a specialized runtime wins by reach, not by count', () => {
  let reached = 0;
  for (const entry of dataset.hardware)
    for (const contextTokens of CONTEXT_STOPS) {
      const selection: Selection = {
        hardwareId: entry.id,
        engineId: 'all',
        contextTokens,
        conversations: 1,
      };
      const options = engineOptions(selection);
      // The count a chip prints is read where its click lands, so the reach
      // comparison must read the same place or the two would disagree.
      const landed = (engineId: string) => {
        const clicked = clampedSelection({ ...selection, engineId });
        return clicked.engineId === engineId &&
          clicked.contextTokens === contextTokens
          ? clicked
          : null;
      };
      const heldBy = (engineId: string) => {
        const clicked = landed(engineId);
        if (!clicked) return null;
        return new Set(
          fittingRows(resolveRows(clicked)).map((row) => row.model.id)
        );
      };
      const standardized = new Set<string>();
      for (const option of options) {
        if (option.engine.group !== 'general' || option.state === 'unsupported')
          continue;
        for (const id of heldBy(option.engine.id) ?? []) standardized.add(id);
      }
      for (const option of options) {
        const own = heldBy(option.engine.id);
        if (!own) continue;
        const reach = [...own].filter((id) => !standardized.has(id)).length;
        assert.equal(option.reach, reach, `${entry.id}/${option.engine.id}`);
        assert.equal(
          option.beatsBaseline,
          option.engine.group === 'specialized' && option.fits > 0 && reach > 0,
          `${entry.id}/${option.engine.id}`
        );
        if (option.beatsBaseline) reached += 1;
      }
    }
  // The highlight exists to mark a real win; a rule with no instance is a rule
  // nobody has seen work.
  assert.ok(reached > 0, 'no specialized runtime reaches a model alone');
});

test('a streamed layout prices only a machine that publishes its tier', () => {
  for (const model of models)
    for (const layout of model.layouts) {
      const engine = dataset.engines.find(
        (candidate) => candidate.id === layout.engineId
      )!;
      for (const entry of dataset.hardware) {
        // A runtime the guide never documents on this platform is not a choice.
        if (!engineSupports(engine, entry.family)) continue;
        const selection: Selection = {
          hardwareId: entry.id,
          engineId: layout.engineId,
          contextTokens: CONTEXT_STOPS[0],
          conversations: 1,
        };
        const row = resolveRows(selection).find(
          (candidate) => candidate.model.id === model.id
        );
        assert.ok(row, `${entry.id}/${model.id}/${layout.engineId}`);
        const option = row.runtimes.find(
          (candidate) =>
            candidate.engineId === layout.engineId &&
            candidate.source === 'layout' &&
            candidate.label === layout.label
        );
        assert.ok(option, `${entry.id}/${model.id}/${layout.engineId}`);
        const tier = entry.unified ? defaultBudget(entry) : entry.hostGib;
        // No published tier means no claim: the layout stays a cited option
        // and never borrows the checkpoint's resident figure.
        if (tier === null)
          assert.ok(
            option.state === 'unsized' || option.state === 'devices',
            `${entry.id}/${model.id}/${layout.engineId}`
          );
        else
          assert.notEqual(
            option.state,
            'unsized',
            `${entry.id}/${model.id}/${layout.engineId}`
          );
      }
    }
});

test('a streamed figure is the floor plus the checkpoint’s own cache cost', () => {
  const entry = hardwareById('apple-m3-ultra-512')!;
  for (const model of models)
    for (const layout of model.layouts) {
      const engine = dataset.engines.find(
        (candidate) => candidate.id === layout.engineId
      )!;
      if (!engineSupports(engine, entry.family)) continue;
      for (const contextTokens of CONTEXT_STOPS) {
        const row = resolveRows({
          hardwareId: entry.id,
          engineId: layout.engineId,
          contextTokens,
          conversations: 1,
        }).find((candidate) => candidate.model.id === model.id);
        const slope = requestCachePerToken(model) ?? 0;
        const grown =
          (slope * Math.max(0, contextTokens - (layout.testedTokens ?? 0))) /
          (1024 * 1024);
        assert.ok(row);
        const option = row.runtimes.find(
          (candidate) =>
            candidate.engineId === layout.engineId &&
            candidate.source === 'layout' &&
            candidate.label === layout.label
        );
        assert.ok(option, `${model.id}@${contextTokens}`);
        assert.ok(
          Math.abs((option.requiredGib as number) - (layout.gib + grown)) <
            1e-9,
          `${model.id}@${contextTokens}`
        );
        // A shorter context earns no credit: the source's figure is a floor.
        if (layout.testedTokens !== null && contextTokens < layout.testedTokens)
          assert.equal(option.requiredGib, layout.gib, `${model.id}`);
      }
    }
});

test('a streamed row prints its mark and never the resident size', () => {
  const entry = hardwareById('apple-m3-ultra-512')!;
  for (const model of models)
    for (const layout of model.layouts) {
      const engine = dataset.engines.find(
        (candidate) => candidate.id === layout.engineId
      )!;
      if (!engineSupports(engine, entry.family)) continue;
      const row = resolveRows({
        hardwareId: entry.id,
        engineId: layout.engineId,
        contextTokens: CONTEXT_STOPS[0],
        conversations: 1,
      }).find((candidate) => candidate.model.id === model.id)!;
      const option = row.runtimes.find(
        (candidate) =>
          candidate.engineId === layout.engineId &&
          candidate.source === 'layout' &&
          candidate.label === layout.label
      )!;
      assert.ok(option);
      if (row.chosenRuntime === option) {
        assert.equal(row.kind, 'streamed');
        assert.ok(memoryFigure(row).startsWith('⇢'), model.id);
        assert.equal(row.chosenRuntime.sourceUrl, layout.sourceUrl);
      }
      // A floor stated at a shorter context is always below the resident figure;
      // a floor stated at a longer one is the recipe's, and can be above it.
      if (
        layout.testedTokens !== null &&
        layout.testedTokens <= CONTEXT_STOPS[0]
      )
        assert.ok(
          (option.requiredGib as number) <
            needAt(model, CONTEXT_STOPS[0], 1).gib,
          `${model.id} streams more than it would hold resident`
        );
      // The option's path names the layout, so two runtimes cannot collide.
      assert.match(`${option.engineLabel} · ${option.label}`, / · /);
      assert.equal(option.sourceUrl, layout.sourceUrl);
    }
});

test('a streamed row prints what it streams from, beside what it holds', () => {
  const entry = hardwareById('apple-m3-ultra-512')!;
  for (const model of models)
    for (const layout of model.layouts) {
      const engine = dataset.engines.find(
        (candidate) => candidate.id === layout.engineId
      )!;
      if (!engineSupports(engine, entry.family)) continue;
      const row = resolveRows({
        hardwareId: entry.id,
        engineId: layout.engineId,
        contextTokens: CONTEXT_STOPS[0],
        conversations: 1,
      }).find((candidate) => candidate.model.id === model.id)!;
      const option = row.runtimes.find(
        (candidate) =>
          candidate.engineId === layout.engineId &&
          candidate.source === 'layout' &&
          candidate.label === layout.label
      )!;
      assert.ok(option);
      if (row.chosenRuntime === option) {
        assert.equal(row.kind, 'streamed');
        // The cell names the storage side at the artifact's own size, so a
        // held figure never reads as the checkpoint's whole footprint.
        if (layout.diskGib === null) assert.equal(rowDiskLine(row), null);
        else
          assert.equal(
            rowDiskLine(row),
            `from ${formatGib(layout.diskGib)} GiB`,
            model.id
          );
      }
    }
  // Resident rows carry no second figure: one number is the full footprint.
  for (const row of fittingRows(
    resolveRows({
      hardwareId: 'h200-8',
      engineId: 'vllm',
      contextTokens: 65_536,
      conversations: 1,
    })
  ))
    assert.equal(rowDiskLine(row), null, row.model.name);
});

test('the track’s floor is the lightest row, streamed or resident', () => {
  const entry = hardwareById('apple-m3-ultra-512')!;
  const selection: Selection = {
    hardwareId: entry.id,
    engineId: 'warp',
    contextTokens: CONTEXT_STOPS[0],
    conversations: 1,
  };
  const bounds = budgetBounds(entry, selection);
  const lightest = Math.min(
    ...resolveRows(selection)
      .filter((row) => row.model.nativeTokens >= selection.contextTokens)
      .map((row) => row.requiredGib)
  );
  assert.equal(bounds.floorGib, lightest);
  assert.equal(
    bounds.weightsGib,
    lightest -
      (resolveRows(selection).find((row) => row.requiredGib === lightest)
        ?.cacheGib ?? 0) *
        selection.conversations
  );
});

test('a streamed row answers the tier question with its own limit', () => {
  const entry = hardwareById('apple-m3-ultra-512')!;
  const selection: Selection = {
    hardwareId: entry.id,
    engineId: 'warp',
    contextTokens: CONTEXT_STOPS[0],
    conversations: 1,
  };
  const row = resolveRows(selection).find(
    (candidate) => candidate.model.id === 'kimi-k3'
  )!;
  assert.match(modelAnswerLine(row, selection), /streamed, not resident/);
});

test('a context stop is reachable exactly when a checkpoint reaches it', () => {
  for (const entry of screened.slice(0, 6)) {
    for (const engineId of ['all', 'llamacpp', 'ollama']) {
      const selection = {
        hardwareId: entry.id,
        engineId,
        contextTokens: CONTEXT_STOPS[0],
        conversations: 1,
      };
      const reachable = reachableStops(engineId);
      for (const option of contextOptions(selection)) {
        assert.equal(option.reachable, reachable.includes(option.tokens));
        const rows = resolveRows({
          ...selection,
          contextTokens: option.tokens,
        });
        if (option.reachable) {
          // Reachable means some checkpoint still sits inside its own cap.
          assert.ok(
            rows.some((row) => !row.beyondNativeCap),
            `${entry.id}/${engineId}/${option.tokens} reachable but all beyond cap`
          );
        } else {
          // Unreachable means no checkpoint can carry a number at this length.
          for (const row of rows) {
            assert.equal(row.beyondNativeCap, true, `${entry.id}/${engineId}`);
          }
        }
      }
    }
  }
  // Ollama sizes nothing on this hardware, so its own stop list stays the same
  // but no row may carry a number.
  assert.ok(
    engineOptions({
      hardwareId: 'h200',
      engineId: 'all',
      contextTokens: CONTEXT_STOPS[0],
      conversations: 1,
    }).some((option) => option.engine.id === 'ollama')
  );
});

test('a carried-over selection is always legal', () => {
  for (const engineId of [
    'all',
    ...dataset.engines.map((engine) => engine.id),
  ]) {
    for (const contextTokens of CONTEXT_STOPS) {
      for (const entry of dataset.hardware) {
        const clamped = clampedSelection({
          hardwareId: entry.id,
          engineId,
          contextTokens,
          conversations: 1,
        });
        const engine = dataset.engines.find(
          (candidate) => candidate.id === clamped.engineId
        );
        assert.ok(
          clamped.engineId === 'all' ||
            (engine &&
              engineSupports(engine, entry.family) &&
              models.some((model) => servesEngine(model, engine.id))),
          `${entry.id} kept ${clamped.engineId}`
        );
        assert.ok(
          resolveRows(clamped).length > 0,
          `${entry.id} clamped to an empty table`
        );
        assert.ok(
          reachableStops(clamped.engineId).includes(clamped.contextTokens),
          `${entry.id} kept ${clamped.contextTokens}`
        );
      }
    }
  }
});

test('the rail always offers a chip that fits', () => {
  const empties = [
    {
      hardwareId: 'rtx4090',
      engineId: 'all',
      contextTokens: 1_048_576,
      conversations: 1,
    },
    {
      hardwareId: 'rtx4090',
      engineId: 'vllm',
      contextTokens: 1_048_576,
      conversations: 1,
    },
  ];
  for (const raw of empties) {
    const selection = clampedSelection(raw);
    assert.equal(
      outcomeOf(resolveRows(selection)).fitting,
      0,
      JSON.stringify(raw)
    );
    const rail = railOptions(selection);
    const escape = [
      ...rail.families,
      ...rail.devices,
      ...rail.deviceCounts,
    ].some((option) => option.fits > 0);
    assert.ok(escape || rail.anyEngineFits > 0, JSON.stringify(raw));
  }
});

test('a rail chip counts what its own click leaves', () => {
  const selection = clampedSelection({
    hardwareId: 'rtx4090',
    engineId: 'all',
    contextTokens: 131_072,
    conversations: 1,
  });
  const rail = railOptions(selection);
  const { fitting, total } = outcomeOf(resolveRows(selection));
  // A pressed chip is a click that changes nothing, so it repeats the count.
  assert.equal(
    rail.families.find((option) => option.family.id === 'workstation')?.fits,
    fitting
  );
  assert.equal(
    rail.devices.find((option) => option.target.id === 'rtx4090')?.fits,
    fitting
  );
  assert.equal(rail.anyEngineFits, fitting);
  for (const option of [
    ...rail.families,
    ...rail.devices,
    ...rail.deviceCounts,
  ]) {
    assert.ok(Number.isInteger(option.fits), JSON.stringify(option));
    assert.ok(option.fits >= 0 && option.fits <= total, JSON.stringify(option));
  }
});

test('a chip serves the new machine its own budget, not the reader\u2019s', () => {
  const narrowed = clampedSelection({
    hardwareId: 'rtx4090',
    engineId: 'all',
    contextTokens: 65_536,
    conversations: 1,
    budgetGib: 12,
  });
  const chip = railOptions(narrowed).devices.find(
    (option) => option.target.id === 'rtx5090'
  );
  const defaulted = outcomeOf(
    resolveRows({
      hardwareId: 'rtx5090',
      engineId: 'all',
      contextTokens: 65_536,
      conversations: 1,
    })
  ).fitting;
  assert.equal(chip?.fits, defaulted);
});

test('a chip counts a runtime the new box cannot run as any runtime', () => {
  const selection = clampedSelection({
    hardwareId: 'rtx4090',
    engineId: 'gr8',
    contextTokens: 65_536,
    conversations: 1,
  });
  // The premise: gr8 runs here, so the reader can hold it across the click.
  assert.equal(selection.engineId, 'gr8');
  const sku = defaultSkuOfFamily('apple');
  assert.ok(sku);
  const chip = railOptions(selection).families.find(
    (option) => option.family.id === 'apple'
  );
  // Apple Silicon cannot run gr8, so the click lands on any runtime, and the
  // chip must count that click, not an inert empty set.
  const landed = outcomeOf(
    resolveRows({
      hardwareId: sku.id,
      engineId: 'all',
      contextTokens: selection.contextTokens,
      conversations: 1,
    })
  ).fitting;
  assert.equal(chip?.fits, landed);
});

test('the tier overview counts only published budgets and widens with memory', () => {
  const tiers = tierSummary();
  assert.ok(tiers.length >= 6, `tiers ${tiers.length}`);
  let previous = 0;
  for (const tier of tiers) {
    assert.ok(tier.screenGib > 0, `${tier.label} budget`);
    assert.ok(tier.label.length > 0, `${tier.hardwareId} label`);
    // A cap is longer than 64K, so its anchor can never hold more models.
    assert.ok(tier.atNative <= tier.at64k, `${tier.label} native vs 64K`);
    assert.ok(tier.at64k <= models.length, `${tier.label} at 64K`);
    assert.ok(tier.at64k >= previous, `${tier.label} below a smaller tier`);
    assert.ok(tier.heaviest.length <= 2, `${tier.label} examples`);
    previous = tier.at64k;
  }
  // The largest tier is the map's ceiling: it holds the whole set at 64K.
  assert.equal(tiers[tiers.length - 1].at64k, models.length);
});

const qwen = models.find((model) => model.id === 'qwen3-8-27b');
const oneUser = (overrides: Partial<Selection> = {}): Selection => ({
  hardwareId: 'rtx4090',
  engineId: 'all',
  contextTokens: 65_536,
  conversations: 1,
  ...overrides,
});

test('one conversation reproduces the two published anchors exactly', () => {
  for (const model of models) {
    assert.equal(
      needAt(model, 65_536, 1).gib,
      model.need64k.gib,
      `${model.name} at 64K`
    );
    assert.equal(
      needAt(model, model.nativeTokens, 1).gib,
      model.needNative.gib,
      `${model.name} at its cap`
    );
  }
});

test('the drafter toggle moves only a sized resident component', () => {
  const base = oneUser({ hardwareId: 'b300-8', contextTokens: 65_536 });
  const rows = (mtpEnabled: boolean) => resolveRows({ ...base, mtpEnabled });
  const on = rows(true);
  const off = rows(false);
  const ripple = (rows: typeof on) =>
    rows.find((row) => row.model.name === 'Ripple-65B-Preview')!;
  assert.equal(ripple(on).requiredGib, 65.1);
  assert.equal(ripple(on).requiredGib! - ripple(off).requiredGib!, 7.5);
  assert.match(needBreakdown(ripple(off), 1) ?? '', /drafter off/);
  assert.equal(mtpLine(ripple(off)), 'drafter · 7.5 GiB · off');
});

test('Hy3 counts embedded MTP without inventing memory savings', () => {
  const base = oneUser({ hardwareId: 'b300-8', contextTokens: 65_536 });
  for (const mtpEnabled of [true, false]) {
    const row = resolveRows({ ...base, mtpEnabled }).find(
      (row) => row.model.name === 'Hunyuan Hy3'
    )!;
    assert.equal(row.requiredGib, 345.2);
    assert.match(mtpLine(row), /part of the weights/);
  }
});

test('the Qwen3.8 4090 GGUF estimate excludes the separate MTP draft', () => {
  const base = oneUser({ hardwareId: 'rtx4090', contextTokens: 65_536 });
  const row = resolveRows(base).find((row) => row.model.id === 'qwen3-8-27b')!;
  assert.equal(row.requiredGib, 20.6);
  assert.equal(mtpLine(row), 'MTP · not in the estimate');
});

test('the drafter toggle survives selection resolution', () => {
  // The control prints the resolved selection, so a clamp that dropped the flag
  // would show the default forever and the lever could not switch off.
  const raw: Selection = {
    hardwareId: 'rtx4090',
    engineId: 'all',
    contextTokens: 65_536,
    conversations: 1,
    mtpEnabled: false,
  };
  assert.equal(clampedSelection(raw).mtpEnabled, false);
  assert.equal(
    clampedSelection({ ...raw, mtpEnabled: undefined }).mtpEnabled,
    true,
    'an absent flag defaults on'
  );
  // A machine the catalog does not carry still keeps the flag.
  assert.equal(
    clampedSelection({ ...raw, hardwareId: 'no-such-box' }).mtpEnabled,
    false
  );
});

test('only the priced path carries the drafter toggle', () => {
  for (const stop of CONTEXT_STOPS) {
    const rows = resolveRows({
      hardwareId: 'b300-8',
      engineId: 'all',
      contextTokens: stop,
      conversations: 1,
    });
    for (const row of rows) {
      if (row.chosenRuntime?.source !== 'priced')
        assert.equal(row.mtpDelta, 0, row.model.name);
    }
  }
});

test('a tier prices the drafter the row above it prices', () => {
  // The page states one memory answer per workload from both ends: the table
  // row and the tier row. They split once already, when the tier read the
  // published anchor while the row loaded the component.
  const stops = [65_536, 1_048_576];
  for (const target of dataset.hardware) {
    for (const stop of stops) {
      for (const conversations of [1, 16]) {
        for (const mtpEnabled of [true, false]) {
          const selection: Selection = {
            hardwareId: target.id,
            engineId: 'all',
            contextTokens: stop,
            conversations,
            mtpEnabled,
          };
          for (const row of resolveRows(selection)) {
            // Only the resident path is priced from anchors plus the component;
            // a layout or a cited configuration states its own figure.
            if (row.chosenRuntime?.source !== 'priced') continue;
            // A context past the model's own cap is a different limit, not a
            // memory comparison: the row calls it over, the tier prices a
            // footprint the model would never read.
            if (stop > row.model.nativeTokens) continue;
            const tier = modelTierRows(row.model.id, selection).find(
              (entry) => entry.isYours
            );
            assert.ok(tier, `${row.model.name} on ${target.id}`);
            // One price, printed twice: the number itself is the contract.
            assert.equal(
              tier.needGib,
              row.requiredGib,
              `${row.model.name} on ${target.id} · ${stop} · ${conversations} · mtp=${mtpEnabled}`
            );
            // Placement and runtime support are a different axis than memory;
            // where the tier speaks about memory, it must agree with the row.
            if (tier.verdict !== 'fits' && tier.verdict !== 'over') continue;
            assert.equal(
              fitsWorkload(row),
              tier.verdict === 'fits',
              `${row.model.name} on ${target.id} · ${stop} · ${conversations} · mtp=${mtpEnabled}`
            );
          }
        }
      }
    }
  }
});

test('the overview counts the drafter the explorer loads by default', () => {
  // A count that ignored the component would understate the models the default
  // view charges for, so the basis is a contract, not a detail.
  for (const summary of tierSummary()) {
    const fits = models.filter(
      (model) => model.need64k.gib + mtpDelta(model, true) <= summary.screenGib
    ).length;
    assert.equal(summary.at64k, fits, `${summary.label} at 64K`);
  }
});

test('the drafter chips print the fits their own click leaves', () => {
  // The chip's number and the click's outcome are one promise, the same rule
  // the rail chips keep.
  for (const target of dataset.hardware) {
    for (const stop of [65_536, 262_144]) {
      for (const conversations of [1, 16]) {
        const selection: Selection = {
          hardwareId: target.id,
          engineId: 'all',
          contextTokens: stop,
          conversations,
        };
        const state = mtpOptions(selection);
        for (const enabled of [true, false]) {
          const clicked = clampedSelection({
            ...selection,
            mtpEnabled: enabled,
          });
          const expected = outcomeOf(resolveRows(clicked)).fitting;
          assert.equal(
            enabled ? state.on : state.off,
            expected,
            `${target.id} · ${stop} · ${conversations} · mtp=${enabled}`
          );
        }
      }
    }
  }
});

test('switching the drafter off never removes a fit', () => {
  for (const target of dataset.hardware) {
    for (const stop of CONTEXT_STOPS) {
      for (const conversations of CONVERSATION_STOPS) {
        const state = mtpOptions({
          hardwareId: target.id,
          engineId: 'all',
          contextTokens: stop,
          conversations,
        });
        assert.ok(
          state.off >= state.on,
          `${target.id} · ${stop} · ${conversations}: ${state.on} → ${state.off}`
        );
        assert.ok(
          state.sized >= 0 && state.sized <= modelCount,
          `${target.id}: ${state.sized} sized of ${modelCount}`
        );
      }
    }
  }
});

test('the lever states its scope in counts, never in sizes', () => {
  // The control plane is set-level: it can say how many checkpoints the switch
  // moves, never which one, and never how large the term is. A size belongs to
  // the row that carries it, where the reader can see the model's name.
  const all = mtpOptions({
    hardwareId: 'h200',
    engineId: 'all',
    contextTokens: 1_048_576,
    conversations: 1,
  });
  assert.equal(all.sized, 3, 'three sized components in view');
  assert.equal(
    drafterInventory(all.sized, modelCount),
    `Changes the memory of 3 of ${modelCount} models.`
  );
  // Both states read the same scope; only the counts move.
  const off = mtpOptions({
    hardwareId: 'h200',
    engineId: 'all',
    contextTokens: 1_048_576,
    conversations: 1,
    mtpEnabled: false,
  });
  assert.equal(off.sized, all.sized);
});

test('the lever states its absence when no sized component is in view', () => {
  const llama = mtpOptions({
    hardwareId: 'rtx4090',
    engineId: 'llamacpp',
    contextTokens: 65_536,
    conversations: 1,
  });
  assert.equal(llama.sized, 0);
  assert.equal(
    drafterInventory(llama.sized, modelCount),
    'No sized drafter on these runtimes.'
  );
});

test('every memory bar shares the reader’s budget as its scale', () => {
  const bounds = budgetBounds(hardwareById('rtx4090')!, {
    hardwareId: 'rtx4090',
    engineId: 'all',
    contextTokens: 65_536,
    conversations: 1,
  });
  // Unset follows the machine's ceiling; a value never leaves the reserved ends,
  // so no row is ever drawn against a budget the page would not test.
  assert.equal(readerBudget(bounds), bounds.maxGib);
  assert.equal(readerBudget(bounds, bounds.minGib - 100), bounds.minGib);
  assert.equal(readerBudget(bounds, bounds.maxGib + 100), bounds.maxGib);
});

test('the known borderline case flips, and the tier agrees', () => {
  const selection: Selection = {
    hardwareId: 'h200',
    engineId: 'all',
    contextTokens: 1_048_576,
    conversations: 1,
  };
  const ripple = 'ripple-65b-preview';
  const on = resolveRows({ ...selection, mtpEnabled: true }).find(
    (row) => row.model.id === ripple
  )!;
  const off = resolveRows({ ...selection, mtpEnabled: false }).find(
    (row) => row.model.id === ripple
  )!;
  assert.equal(fitsWorkload(on), false, 'Ripple over with the drafter loaded');
  assert.equal(fitsWorkload(off), true, 'Ripple fits with it off');
  assert.equal(
    modelTierRows(ripple, { ...selection, mtpEnabled: false }).find(
      (row) => row.isYours
    )?.verdict,
    'fits',
    'the tier row follows the toggle'
  );
  assert.ok(
    modelTierRows(ripple, { ...selection, mtpEnabled: true }).find(
      (row) => row.isYours
    )?.verdict === 'over',
    'the tier row is over with it loaded'
  );
});

test('the cache is linear in tokens and in conversations', () => {
  assert.ok(qwen);
  const perToken = requestCachePerToken(qwen);
  assert.ok(perToken !== null && perToken > 0);
  const at64k = conversationCacheGib(qwen, 65_536);
  const at128k = conversationCacheGib(qwen, 131_072);
  assert.ok(at64k !== null && at128k !== null);
  assert.ok(Math.abs(at128k - 2 * at64k) < 1e-9, 'cache doubles with tokens');
  const one = needAt(qwen, 65_536, 1).gib;
  const four = needAt(qwen, 65_536, 4).gib;
  assert.ok(Math.abs(four - (one + 3 * at64k)) < 1e-9, 'one cache per request');
});

test('a pool-sized row publishes no per-token cache, so nothing multiplies', () => {
  const mistral = models.find((model) => model.name.startsWith('Mistral'));
  assert.ok(mistral);
  assert.equal(requestCachePerToken(mistral), null);
  assert.equal(needAt(mistral, 65_536, 16).gib, mistral.need64k.gib);
  assert.equal(concurrentConversations(mistral, 96, 65_536), null);
});

test('the tier holds exactly the requests the arithmetic allows', () => {
  assert.ok(qwen);
  assert.equal(concurrentConversations(qwen, 22, 65_536), 2);
  assert.equal(concurrentConversations(qwen, 22, 262_144), 0);
  for (const screenGib of [22, 30, 94, 107, 500]) {
    for (const tokens of [65_536, 262_144]) {
      const count = concurrentConversations(qwen, screenGib, tokens);
      assert.ok(count !== null);
      const cache = conversationCacheGib(qwen, tokens) as number;
      const base = needAt(qwen, tokens, 1).gib - cache;
      assert.ok(
        base + count * cache <= screenGib + 1e-9,
        `${screenGib} GiB claims ${count} at ${tokens}`
      );
      assert.ok(
        base + (count + 1) * cache > screenGib,
        `${screenGib} GiB could hold one more at ${tokens}`
      );
    }
  }
});

test('the inverse table ascends and marks exactly one smallest fit', () => {
  for (const model of models) {
    for (const contextTokens of [65_536, 262_144]) {
      for (const conversations of [1, 16]) {
        const rows = modelTierRows(
          model.id,
          oneUser({ contextTokens, conversations })
        );
        assert.ok(rows.length >= 6, `${model.name} rows`);
        const budgets = rows.map(
          (row) => row.screenGib ?? Number.POSITIVE_INFINITY
        );
        for (let index = 1; index < budgets.length; index += 1)
          assert.ok(
            budgets[index] >= budgets[index - 1],
            `${model.name} order`
          );
        const marked = rows.filter((row) => row.isSmallest);
        assert.equal(
          marked.length,
          rows.some((row) => row.verdict === 'fits') ? 1 : 0,
          model.name
        );
        if (marked.length)
          assert.equal(
            rows.indexOf(marked[0]),
            rows.findIndex((row) => row.verdict === 'fits')
          );
        // Memory only ever helps: past a fit, no larger tier reports an overrun.
        const firstFit = rows.findIndex((row) => row.verdict === 'fits');
        if (firstFit >= 0)
          for (const row of rows.slice(firstFit))
            assert.notEqual(row.verdict, 'over', `${model.name} ${row.label}`);
      }
    }
  }
});

test('a pinned model always answers, and shows the cost of its workload', () => {
  assert.ok(qwen);
  for (const conversations of [1, 8, 64]) {
    const selection = oneUser({ conversations, contextTokens: 65_536 });
    const row = resolveRows(selection).find(
      (entry) => entry.model.id === qwen.id
    );
    assert.ok(row && Number.isFinite(row.requiredGib));
    const line = modelAnswerLine(row, selection);
    assert.match(line, /GiB/);
    if (conversations > 1)
      assert.ok(row.cacheGib !== null && row.baseGib !== null);
  }
});

test('the speed table derives one side and keeps the measured direction', () => {
  const rows = batchingRows();
  assert.equal(rows.length, dataset.batching.length);
  for (const row of rows) {
    assert.ok(row.perUserOut > 0 && row.aggregateOut > 0, row.key);
    assert.ok(row.aggregateOut >= row.perUserOut - 1e-9, row.key);
  }
  const muse = rows.filter((row) => row.modelName === 'Muse Spark Open');
  assert.equal(muse.length, 2);
  assert.ok(muse[1].perUserOut < muse[0].perUserOut, 'per-user falls');
  assert.ok(muse[1].aggregateOut > muse[0].aggregateOut, 'aggregate rises');
});

test('a narrow runtime is compared on the machine that can host it', () => {
  const deepseek = (hardwareId: string, contextTokens = 65_536) =>
    resolveRows({
      hardwareId,
      engineId: 'all',
      contextTokens,
      conversations: 1,
    }).find((row) => row.model.id === 'deepseek-v4-1-flash-1017')!;

  // Two Sparks can host the published Q2 layout; one cannot.
  const pair = deepseek('spark-2');
  assert.equal(pair.chosenRuntime?.engineId, 'dwarfstar');
  assert.equal(pair.chosenRuntime?.devices, 2);
  assert.equal(pair.chosenRuntime?.state, 'fits');
  assert.ok(fitsWorkload(pair));

  const single = deepseek('spark');
  assert.ok(!fitsWorkload(single));
  const layout = single.runtimes.find(
    (option) => option.engineId === 'dwarfstar' && option.source === 'layout'
  )!;
  assert.equal(layout.devices, 2);
  assert.equal(layout.state, 'devices');
});

test('a configuration cap and a budget both end a fit', () => {
  const rows = resolveRows({
    hardwareId: 'b300-8',
    engineId: 'gr8',
    contextTokens: 1_048_576,
    conversations: 1,
  });
  const capped = rows.find((row) => row.model.id === 'glm-5-3-flash')!;
  assert.ok(
    capped.runtimes.some(
      (option) =>
        option.engineId === 'gr8' &&
        option.capTokens !== null &&
        option.state === 'over'
    ),
    'a cap past the slider reads as over'
  );
});

test('the comparison carries every cited configuration and no placeholder', () => {
  const selection: Selection = {
    hardwareId: 'b300-8',
    engineId: 'all',
    contextTokens: 65_536,
    conversations: 1,
  };
  const hardwareTarget = hardwareById(selection.hardwareId)!;
  for (const model of models) {
    const row = resolveRows(selection).find(
      (candidate) => candidate.model.id === model.id
    )!;
    // Every option the reader can pick is evidence: a name, a figure, a cap, a
    // disk footprint, or a measured rate. A documented runtime with none of
    // them is not a choice and must not take a line.
    for (const option of row.runtimes)
      assert.ok(
        hasEvidence(option),
        `${model.id}/${option.engineId} offers nothing to compare`
      );
    for (const cited of [...model.layouts, ...model.configs]) {
      const engine = dataset.engines.find(
        (entry) => entry.id === cited.engineId
      )!;
      if (!engineSupports(engine, hardwareTarget.family)) continue;
      assert.ok(
        row.runtimes.some(
          (option) =>
            option.engineId === cited.engineId && option.label === cited.label
        ),
        `${model.id} drops ${cited.engineId}/${cited.label}`
      );
    }
  }
});
