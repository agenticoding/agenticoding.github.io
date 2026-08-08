import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BAND_Y0,
  BAND_Y1,
  COLLAPSE_MS,
  COMPACTION_CYCLE_MS,
  DELETE_SLIDE_MS,
  DELETE_SLIDE_START_MS,
  DELETE_START_MS,
  EJECT_STAGGER_MS,
  HEADROOM_FADE_MS,
  HEADROOM_H,
  HEADROOM_LABEL,
  HEADROOM_NOTE,
  HEADROOM_PULSE_END_MS,
  ORIENT_MS,
  PAIR_START_MS,
  PAIR_WINDOW_MS,
  RESTORE_LABEL_IN_MS,
  RESTORE_MS,
  RESTORE_SHAPE_IN_MS,
  RESTORE_START_MS,
  RESTORE_SUMMARY_OUT_MS,
  RESTORE_TOKENS_IN_MS,
  RESULT_ON_MS,
  SHRINK_LEAD_MS,
  SHRINK_MS,
  STACK_BANDS,
  STACK_EVENTS,
  STACK_H,
  STATIC_LEDGER,
  SUMMARY_H,
  SUMMARY_LEAD_MS,
  SUMMARY_PAIRS,
  SURVIVOR_TRAVEL_MS,
  finalHeight,
  finalTop,
  pairContentEndMs,
  pairEjectSpecs,
  pairTokens,
  slideDistanceBefore,
  summaryBand,
  survivorRisePx,
} from './compactionLineModel.ts';

test('the single stack fills the window exactly', () => {
  const sum = STACK_BANDS.reduce((px, b) => px + b.h, 0);
  assert.equal(sum, STACK_H);
  assert.equal(BAND_Y1 - BAND_Y0, STACK_H);
});

test('events are stack-ordered: 3 thread shrinks and 2 stale-pair deletions', () => {
  let last = -1;
  let shrinks = 0;
  let deletes = 0;
  for (const e of STACK_EVENTS) {
    assert.ok(e.band > last);
    last = e.band;
    if (e.kind === 'delete') {
      deletes += 1;
    } else {
      shrinks += 1;
      assert.equal(e.freed, STACK_BANDS[e.band].h - SUMMARY_H);
    }
  }
  assert.equal(deletes, 2);
  assert.equal(shrinks, 3);
});

test('chapter tone grammar: conversation data is indigo, AI synthesis is violet', () => {
  for (const e of STACK_EVENTS) {
    assert.equal(STACK_BANDS[e.band].tone, 'indigo'); // deleted pairs and summarized threads alike
  }
  for (let k = 0; k < SUMMARY_PAIRS.length; k += 1) {
    assert.equal(summaryBand(k).tone, 'violet');
  }
});

test('freed space: 48 deleted + 74 summarized = 122 headroom', () => {
  const deleted = STACK_EVENTS.filter((e) => e.kind === 'delete').reduce((px, e) => px + e.freed, 0);
  const shrunk = STACK_EVENTS.filter((e) => e.kind === 'shrink').reduce((px, e) => px + e.freed, 0);
  assert.equal(deleted, 48);
  assert.equal(shrunk, 74);
  assert.equal(HEADROOM_H, 122);
});

test('slide distances accumulate freed height above each band', () => {
  assert.deepEqual(
    STACK_BANDS.map((_, i) => slideDistanceBefore(i)),
    [0, 0, 28, 52, 80, 104, 122]
  );
});

test('final stack is contiguous and leaves exactly HEADROOM_H at the bottom', () => {
  const kept = STACK_BANDS.map((_, i) => i).filter((i) => finalHeight(i) > 0);
  let expectedTop = BAND_Y0;
  for (const i of kept) {
    assert.equal(finalTop(i), expectedTop);
    expectedTop += finalHeight(i);
  }
  assert.equal(expectedTop, BAND_Y1 - HEADROOM_H);
});

test('static ledger restacks the freed space exactly, fates labeled', () => {
  assert.equal(STATIC_LEDGER.reduce((px, e) => px + e.h, 0), HEADROOM_H);
  assert.equal(STATIC_LEDGER.filter((e) => e.onDisk).length, 2);
  for (const e of STATIC_LEDGER) {
    assert.ok(e.onDisk ? e.label.includes('on disk') : e.label.includes('→ summary'));
  }
});

test('schedule preserves orient, delete, summarize, result, restore order', () => {
  const collapseDone = DELETE_START_MS + COLLAPSE_MS;
  const slideDone = DELETE_SLIDE_START_MS + DELETE_SLIDE_MS;
  assert.ok(ORIENT_MS < DELETE_START_MS); // orient beat shows the complete stack first
  assert.ok(collapseDone <= slideDone); // ranks close as the pairs finish collapsing
  assert.ok(slideDone < PAIR_START_MS[0]); // act 1 completes before act 2
  assert.ok(RESULT_ON_MS < HEADROOM_PULSE_END_MS);
  assert.ok(HEADROOM_PULSE_END_MS <= RESTORE_START_MS);
  assert.equal(RESTORE_START_MS + RESTORE_MS, COMPACTION_CYCLE_MS);
});

test('restore is staged: summaries leave before threads, labels, and tokens return', () => {
  assert.ok(RESTORE_SHAPE_IN_MS < RESTORE_SUMMARY_OUT_MS); // thread shape starts back as the summary finishes
  assert.ok(RESTORE_SUMMARY_OUT_MS <= RESTORE_LABEL_IN_MS); // no label cross-fade overlap
  assert.ok(RESTORE_LABEL_IN_MS <= RESTORE_TOKENS_IN_MS);
  assert.ok(RESTORE_TOKENS_IN_MS < RESTORE_MS); // everything back before the loop wraps
});

test('summary pairs compact one by one inside act 2 without overlap', () => {
  for (let k = 1; k < PAIR_START_MS.length; k += 1) {
    assert.ok(PAIR_START_MS[k] >= PAIR_START_MS[k - 1] + PAIR_WINDOW_MS); // one by one, stack order
    assert.ok(PAIR_START_MS[k] >= pairContentEndMs(k - 1)); // previous pair fully landed
  }
  assert.ok(pairContentEndMs(PAIR_START_MS.length - 1) <= RESULT_ON_MS); // act 2 assembled before the hold
  for (let k = 0; k < SUMMARY_PAIRS.length; k += 1) {
    assert.ok(pairContentEndMs(k) <= PAIR_START_MS[k] + PAIR_WINDOW_MS);
  }
});

test('every shrink is visibly lossy (summary tiles lose at least 30% of their thread)', () => {
  for (const pair of SUMMARY_PAIRS) {
    assert.ok(SUMMARY_H / STACK_BANDS[pair.thread].h <= 0.7);
  }
});

test('the discarded majority ejects as one unified rise, seeded and deterministic', () => {
  for (let k = 0; k < SUMMARY_PAIRS.length; k += 1) {
    const tokens = pairTokens(k);
    assert.equal(tokens.length, SUMMARY_PAIRS[k].tokenCount);
    assert.deepEqual(pairTokens(k), tokens);

    const specs = pairEjectSpecs(k);
    assert.deepEqual(pairEjectSpecs(k), specs);
    assert.equal(specs.length, tokens.length - SUMMARY_PAIRS[k].survivors);
    for (const { dx, dy } of specs) {
      assert.ok(dy <= -60 && dy >= -110); // strong rise: the one consistent direction
      assert.ok(Math.abs(dx) >= 10 && Math.abs(dx) <= 30); // lateral spread stays secondary
    }
    const lastTokenMs = (specs.length - 1) * EJECT_STAGGER_MS;
    assert.ok(lastTokenMs < PAIR_WINDOW_MS); // stagger fits the pair window
  }
});

test('summarization discards the majority and keeps a compressed minority', () => {
  for (const pair of SUMMARY_PAIRS) {
    assert.ok(pair.survivors >= 1); // something visibly survives into the summary
    assert.ok(pair.tokenCount - pair.survivors > pair.survivors); // lossy: majority ejected
  }
});

test('survivors rise into the summary tile before its cross-fade begins', () => {
  for (let k = 0; k < SUMMARY_PAIRS.length; k += 1) {
    assert.ok(survivorRisePx(k) > 0); // the tile is shorter than its thread
    const landed = SHRINK_LEAD_MS + SURVIVOR_TRAVEL_MS;
    const crossfadeStart = SHRINK_LEAD_MS + SHRINK_MS - SUMMARY_LEAD_MS;
    assert.ok(landed <= crossfadeStart); // in place before the synthetic tokens fade in
  }
});

test('the freed space is clearly labeled for the next request', () => {
  assert.ok(HEADROOM_LABEL.includes('next request'));
  assert.ok(HEADROOM_NOTE.includes('new context'));
  assert.ok(RESULT_ON_MS > HEADROOM_FADE_MS); // the headroom stays visible during the result hold
});
