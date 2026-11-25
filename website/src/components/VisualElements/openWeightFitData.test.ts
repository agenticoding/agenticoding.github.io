import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

import { dataset } from './openWeightFitData.ts';
import { classifiers } from './classifierData.ts';
import { MODEL_MODALITIES } from './modalityProfile.ts';
import { LAB_MARKS } from './figureMarks.ts';
import { formatNumber } from './figureCatalog.ts';

const VENDORS = ['nvidia', 'amd', 'apple'];
const FAMILIES = ['workstation', 'spark', 'datacenter', 'amd', 'apple'];

const isHttps = (value: string | null) =>
  typeof value === 'string' && value.startsWith('https://');

test('the dataset states where its facts come from', () => {
  const { meta } = dataset;
  assert.match(meta.guide, /\.md$/);
  assert.ok(isHttps(meta.sourceUrl), meta.sourceUrl);
  assert.match(meta.checkedThrough, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(meta.contextStops.length >= 2, 'context stops');
  for (let index = 1; index < meta.contextStops.length; index += 1) {
    assert.ok(
      meta.contextStops[index] > meta.contextStops[index - 1],
      'context stops ascend'
    );
  }
});

test('families own their vendor, and every hardware target names a family', () => {
  const ids = new Set(dataset.families.map((family) => family.id));
  assert.equal(ids.size, dataset.families.length, 'family ids are unique');
  for (const family of dataset.families) {
    assert.ok(FAMILIES.includes(family.id), family.id);
    assert.ok(VENDORS.includes(family.vendor), `${family.id} vendor`);
    assert.ok(family.label.length > 0, family.id);
  }
  for (const entry of dataset.hardware) {
    assert.ok(ids.has(entry.family), `${entry.id} family`);
  }
});

test('every engine publishes a supported platform', () => {
  const ids = new Set<string>();
  for (const engine of dataset.engines) {
    assert.ok(!ids.has(engine.id), `duplicate engine ${engine.id}`);
    ids.add(engine.id);
    assert.ok(engine.label.length > 0, engine.id);
    assert.ok(
      engine.group === 'general' || engine.group === 'specialized',
      `${engine.id} group`
    );
    assert.ok(engine.platforms.length > 0, `${engine.id} platforms`);
    for (const platform of engine.platforms) {
      assert.ok(VENDORS.includes(platform), `${engine.id} ${platform}`);
    }
  }
});

test('checkpoints reference engines and devices that exist', () => {
  const engineIds = new Set(dataset.engines.map((engine) => engine.id));
  const deviceIds = new Set(
    dataset.hardware.map((entry) =>
      entry.devices > 1 ? entry.id.replace(/-\d+$/, '') : entry.id
    )
  );
  for (const model of dataset.models) {
    assert.ok(model.name.length > 0, 'model name');
    assert.ok(model.lab.length > 0, `${model.name} lab`);
    assert.ok(engineIds.has(model.pathEngineId), `${model.name} path engine`);
    assert.ok(
      model.engineIds.includes(model.pathEngineId),
      `${model.name} lists its own path engine`
    );
    for (const engineId of model.engineIds) {
      assert.ok(engineIds.has(engineId), `${model.name} ${engineId}`);
    }
    for (const engineId of model.specializedIds) {
      assert.ok(engineIds.has(engineId), `${model.name} ${engineId}`);
    }
    assert.deepEqual(
      model.specializedIds.filter((id) => model.engineIds.includes(id)),
      [],
      `${model.name} names a runtime twice`
    );
    assert.ok(model.candidates.length > 0, `${model.name} candidates`);
    for (const step of model.candidates) {
      assert.ok(deviceIds.has(step.deviceId), `${model.name} ${step.deviceId}`);
      assert.ok(step.devices >= 1, `${model.name} ${step.devices} devices`);
    }
    assert.ok(model.need64k.gib > 0, `${model.name} 64K budget`);
    assert.ok(
      model.needNative.gib >= model.need64k.gib,
      `${model.name} native budget`
    );
    assert.ok(
      model.nativeTokens >= dataset.meta.contextStops[0],
      `${model.name} reaches the first stop`
    );
  }
});

test('every checkpoint states the channels it takes and emits', () => {
  // The UI's own vocabulary, so an extractor that invents a channel fails here
  // instead of drawing a shape the book never defined. Order is the contract:
  // the extractor sorts a hand-written guide row into it.
  const vocabulary: readonly string[] = MODEL_MODALITIES;
  for (const model of dataset.models) {
    const { input, output } = model.modalities;
    assert.ok(input.length > 0, `${model.name} input`);
    assert.ok(output.length > 0, `${model.name} output`);
    for (const modality of [...input, ...output]) {
      assert.ok(vocabulary.includes(modality), `${model.name} ${modality}`);
    }
    assert.deepEqual(
      input,
      MODEL_MODALITIES.filter((modality) => input.includes(modality)),
      `${model.name} input order`
    );
    assert.deepEqual(
      output,
      MODEL_MODALITIES.filter((modality) => output.includes(modality)),
      `${model.name} output order`
    );
    // Every checkpoint in this catalog reads and writes text.
    assert.ok(input.includes('text'), `${model.name} reads text`);
    assert.ok(output.includes('text'), `${model.name} writes text`);
  }
});

test('the specialized table reaches the runtimes it names', () => {
  // The guide's narrow-coverage table is the only source that links these
  // runtimes to checkpoints; a runtime the guide names must not be left with an
  // empty chip. Colibri is the exception: its row names GLM-5.2, which this
  // dataset does not carry.
  const covered = new Set(
    dataset.models.flatMap((model) => model.specializedIds)
  );
  const silent = dataset.engines.filter(
    (engine) =>
      engine.group === 'specialized' &&
      engine.id !== 'colibri' &&
      !covered.has(engine.id)
  );
  assert.deepEqual(
    silent.map((engine) => engine.id),
    [],
    'specialized runtimes with no checkpoint'
  );
});

test('measured runs and platform paths point at real rows', () => {
  const modelIds = new Set(dataset.models.map((model) => model.id));
  const hardwareIds = new Set(dataset.hardware.map((entry) => entry.id));
  for (const run of dataset.throughput) {
    assert.ok(modelIds.has(run.modelId), run.modelId);
    assert.ok(hardwareIds.has(run.hardwareId), run.hardwareId);
    assert.ok(run.text.length > 0, run.modelId);
  }
  for (const item of dataset.platformNotes) {
    assert.ok(modelIds.has(item.modelId), item.modelId);
    assert.ok(item.family === 'amd' || item.family === 'apple', item.family);
    assert.ok(isHttps(item.sourceUrl), item.sourceUrl);
    assert.ok(item.text.length > 0, item.modelId);
  }
  for (const model of dataset.models) {
    assert.ok(model.sourceUrl === null || isHttps(model.sourceUrl), model.name);
  }
});

test('the context axis never outruns the longest checkpoint', () => {
  const longest = Math.max(
    ...dataset.models.map((model) => model.nativeTokens)
  );
  for (const stop of dataset.meta.contextStops) {
    assert.ok(stop <= longest, `${stop} beyond ${longest}`);
  }
});

test('every batching point restates the measured run it came from', () => {
  for (const point of dataset.batching) {
    const run = dataset.throughput.find(
      (entry) =>
        entry.modelId === point.modelId && entry.hardwareId === point.hardwareId
    );
    assert.ok(run, `${point.modelId} on ${point.hardwareId} names no run`);
    assert.ok(point.concurrency >= 1, `${point.modelId} concurrency`);
    assert.ok(
      point.perUserOut !== null || point.aggregateOut !== null,
      `${point.modelId} publishes neither side`
    );
    for (const value of [point.perUserOut, point.aggregateOut]) {
      if (value === null) continue;
      assert.ok(
        run.text.includes(formatNumber(value)),
        `${point.modelId}: ${formatNumber(value)} is not in "${run.text}"`
      );
    }
  }
  // A single run cannot state the same point twice.
  const keys = dataset.batching.map(
    (point) => `${point.modelId}-${point.hardwareId}-${point.concurrency}`
  );
  assert.equal(new Set(keys).size, keys.length);
});

test('a caveat speaks only where the track cannot', () => {
  // The track prints capacity, reserve, and the unified flag, so a screened
  // single device that is caveated would repeat it. An unscreened target and a
  // multi-device layout carry the one fact the track cannot state.
  for (const entry of dataset.hardware) {
    if (entry.devices > 1)
      assert.match(entry.caveat ?? '', /aggregate/, entry.id);
    else if (entry.screenGib === null)
      assert.match(entry.caveat ?? '', /no memory figure/, entry.id);
    else assert.equal(entry.caveat, null, entry.id);
  }
});

test('a published capacity never undercuts the screen budget', () => {
  for (const entry of dataset.hardware) {
    if (entry.screenGib === null) continue;
    assert.ok(
      entry.nominalGib >= entry.screenGib,
      `${entry.id}: ${entry.nominalGib} < ${entry.screenGib}`
    );
    // The reserve is exactly what the guide's own screen figure gives up, so a
    // regenerated catalog cannot quietly widen the machine's budget. The figures
    // publish to a tenth, so the identity is checked at that precision.
    assert.ok(
      Math.abs(entry.reserveGib - (entry.nominalGib - entry.screenGib)) < 0.05,
      `${entry.id} reserve`
    );
  }
});

test('every target states the memory it has and the reserve it keeps', () => {
  for (const entry of dataset.hardware) {
    assert.ok(entry.nominalGib > 0, `${entry.id} capacity`);
    assert.ok(entry.reserveGib > 0, `${entry.id} reserve`);
    assert.ok(entry.reserveGib < entry.nominalGib, `${entry.id} reserve`);
  }
});

// A machine that shares its memory with the OS cannot lend the whole pool to a
// model: the guide keeps 8 GiB for macOS up to a 64 GB pool and a tenth above.
// A smaller reserve would print a budget the reader cannot reach.
test('a unified pool keeps a system reserve', () => {
  for (const entry of dataset.hardware.filter((target) => target.unified))
    assert.ok(entry.reserveGib >= 8, `${entry.id} reserve ${entry.reserveGib}`);
});

test('a label that prints a capacity restates nominalGib', () => {
  for (const entry of dataset.hardware) {
    // RTX 3090 publishes its 24 GB in prose only, so a label without a capacity
    // constrains nothing.
    const printed = /(\d+)\s*GB(?!\d)/.exec(entry.label);
    if (!printed) continue;
    assert.equal(
      entry.nominalGib,
      Number(printed[1]) * entry.devices,
      `${entry.id}: label "${entry.label}"`
    );
  }
});

test('bandwidth and interconnect are either well formed or absent', () => {
  for (const entry of dataset.hardware) {
    const bandwidth = entry.bandwidthGBs;
    assert.ok(
      bandwidth === null || (Number.isInteger(bandwidth) && bandwidth > 0),
      `${entry.id} bandwidth`
    );
    assert.ok(
      entry.interconnect === null || entry.interconnect.length > 0,
      `${entry.id} interconnect`
    );
  }
});

test('the spec fields are populated, not silently all empty', () => {
  assert.ok(
    dataset.hardware.some((entry) => entry.bandwidthGBs !== null),
    'no target publishes bandwidth'
  );
  assert.ok(
    dataset.hardware.some((entry) => entry.unified),
    'no target shares memory with the OS'
  );
  assert.ok(
    dataset.hardware.some((entry) => entry.hostGib !== null),
    'no target publishes system memory, so no streamed layout can be tested'
  );
});

// A streamed layout is a second path for one checkpoint: its engine must be one
// the model is already served by, its source must exist, and its figure must be
// a memory figure the machine can hold. Anything else is a claim without a home.
test('every streamed layout joins a served model and cites its source', () => {
  const pairs = new Set<string>();
  for (const model of dataset.models)
    for (const layout of model.layouts) {
      const key = `${model.id}/${layout.engineId}`;
      assert.ok(!pairs.has(key), `two streamed layouts for ${key}`);
      pairs.add(key);
      assert.ok(
        dataset.engines.some((engine) => engine.id === layout.engineId),
        `${key} names an unknown engine`
      );
      assert.ok(
        model.engineIds.includes(layout.engineId) ||
          model.specializedIds.includes(layout.engineId),
        `${key}: the guide does not serve this model on this runtime`
      );
      assert.match(layout.sourceUrl, /^https?:\/\//, `${key} source`);
      assert.ok(layout.label.length > 0, `${key} label`);
      assert.ok(layout.gib > 0, `${key} floor`);
      assert.ok(
        layout.devices >= 1 && Number.isInteger(layout.devices),
        `${key} devices`
      );
      assert.ok(
        layout.testedTokens === null || layout.testedTokens > 0,
        `${key} tested context`
      );
      assert.ok(
        layout.capTokens === null || layout.capTokens > 0,
        `${key} cap`
      );
      assert.ok(
        layout.diskGib === null || layout.diskGib > 0,
        `${key} storage`
      );
      assert.ok(
        layout.speed === null || layout.speed.length > 0,
        `${key} speed`
      );
      // A floor is stated at a context the checkpoint can actually read.
      assert.ok(
        layout.testedTokens === null ||
          layout.testedTokens <= model.nativeTokens,
        `${key}: floor measured past the checkpoint's cap`
      );
    }
  assert.ok(pairs.size > 0, 'the guide publishes no streamed layout');
});

test('every configuration joins a served model and states a number', () => {
  const seen = new Set<string>();
  for (const model of dataset.models)
    for (const config of model.configs) {
      const key = `${model.id}/${config.engineId}/${config.label}`;
      assert.ok(!seen.has(key), `duplicate configuration ${key}`);
      seen.add(key);
      assert.ok(
        dataset.engines.some((engine) => engine.id === config.engineId),
        `${key} names an unknown engine`
      );
      assert.ok(
        model.engineIds.includes(config.engineId) ||
          model.specializedIds.includes(config.engineId),
        `${key}: the guide does not serve this model on this runtime`
      );
      assert.match(config.sourceUrl, /^https?:\/\//, `${key} source`);
      assert.ok(config.label.length > 0, `${key} label`);
      assert.ok(
        config.devices >= 1 && Number.isInteger(config.devices),
        `${key} devices`
      );
      // A configuration exists to add a fact the layout already priced.
      assert.ok(
        config.gib !== null ||
          config.capTokens !== null ||
          (config.speed !== null && /\d/.test(config.speed)),
        `${key} states no number`
      );
      assert.ok(config.gib === null || config.gib > 0, `${key} held`);
      assert.ok(
        config.capTokens === null || config.capTokens > 0,
        `${key} cap`
      );
    }
  assert.ok(seen.size > 0, 'the guide publishes no configuration');
});

test('a machine publishes system memory only as a real figure', () => {
  for (const entry of dataset.hardware)
    assert.ok(
      entry.hostGib === null || entry.hostGib > 0,
      `${entry.id} system memory`
    );
});

test('every MTP row names a real model and is well formed', () => {
  const withMtp = dataset.models.filter((model) => model.mtp);
  assert.ok(withMtp.length >= 3, 'no MTP rows');
  for (const model of withMtp) {
    const mtp = model.mtp!;
    assert.ok(
      ['mtp', 'drafter', 'engram'].includes(mtp.kind),
      `${model.name} kind`
    );
    assert.ok(
      mtp.params === null || mtp.params.length > 0,
      `${model.name} params`
    );
    assert.ok(mtp.gib === null || mtp.gib > 0, `${model.name} size`);
    assert.equal(typeof mtp.estimate, 'boolean', `${model.name} estimate`);
    assert.equal(typeof mtp.includedInFit, 'boolean', `${model.name} included`);
    assert.equal(typeof mtp.resident, 'boolean', `${model.name} resident`);
    assert.ok(isHttps(mtp.sourceUrl), `${model.name} source`);
    // A component that does not sit in accelerator memory can never move a
    // number; anything else would let the toggle edit a host-RAM figure.
    if (!mtp.resident)
      assert.equal(mtp.gib, null, `${model.name} host-resident`);
    // A sized component must be smaller than the model it ships in.
    if (mtp.gib !== null)
      assert.ok(
        mtp.gib < model.needNative.gib,
        `${model.name} draft exceeds model`
      );
  }
});

test("the guide's fit figures count drafts where the tables say so", () => {
  const byName = (name: string) =>
    dataset.models.find((model) => model.name === name)!;
  const ripple = byName('Ripple-65B-Preview');
  assert.equal(ripple.mtp?.kind, 'drafter');
  assert.equal(ripple.mtp?.includedInFit, true);
  const hy3 = byName('Hunyuan Hy3');
  assert.equal(hy3.mtp?.kind, 'mtp');
  assert.equal(hy3.mtp?.includedInFit, false);
  assert.equal(hy3.mtp?.estimate, true);
  const qwen = byName('Qwen3.8-27B');
  assert.equal(qwen.mtp?.includedInFit, true);
  assert.equal(qwen.mtp?.gib, null);
});

// The table reserves a column for each lab's mark. A mark that points at a file
// nobody shipped is a broken image on a production page, so the pairing between
// the datasets' lab names and the files on disk is a contract, not a convention.
// Both figures' tables render marks, so both datasets name the labs a mark may
// carry; one registry serves them, so the guard reads them together.
const staticDir = new URL('../../../static/', import.meta.url);
const labNames = new Set(
  [...dataset.models, ...classifiers.models].map((model) => model.lab)
);

test('every lab mark names a shipped file and a lab a dataset publishes', () => {
  const labs = new Set<string>();
  const srcs = new Set<string>();
  for (const [lab, mark] of LAB_MARKS) {
    assert.ok(labNames.has(lab), `mark for unknown lab "${lab}"`);
    assert.ok(!labs.has(lab), `duplicate mark for "${lab}"`);
    assert.ok(!srcs.has(mark.src), `duplicate mark file "${mark.src}"`);
    labs.add(lab);
    srcs.add(mark.src);
    assert.ok(
      existsSync(new URL(mark.src.slice(1), staticDir)),
      `${lab} points at a missing file: ${mark.src}`
    );
    // Image-mode flags describe a rendered image; on a mask they would be dead
    // settings that look like they do something.
    if (mark.mode !== 'image')
      assert.ok(
        !mark.imageTone && !mark.darkImageTone,
        `${lab} carries an image flag without image rendering`
      );
  }
  // The fallback path is real: some labs publish no official vector.
  assert.ok(
    dataset.models.some((model) => !labs.has(model.lab)),
    'every lab has a mark, so the no-mark path is untested'
  );
});
