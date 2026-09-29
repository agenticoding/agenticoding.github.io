import assert from 'node:assert/strict';
import test from 'node:test';
import { spokenSourceHash } from './docs.ts';
import type { HeadingInfo } from './headings.ts';
import type { Block } from './extract.ts';

// `sourceHash` gates drift: it must track what the voice says, not what the page
// renders around it. These pin the external contract, so a guard-only field can
// never silently mark shipped audio stale.

const headings: HeadingInfo[] = [{ id: 'h', title: 'H' }];

const figure = (text: string, extra: Partial<Block> = {}): Block => ({
  kind: 'figure',
  text,
  label: 'Fig',
  anchor: { kind: 'figure', index: 0 },
  ...extra,
});

test('a page-only caption change never moves the spoken hash', () => {
  const spoken = figure('The loop repeats.');
  const captioned = figure('The loop repeats.', { caption: 'A labelled sketch.' });
  assert.equal(
    spokenSourceHash([spoken], headings),
    spokenSourceHash([captioned], headings)
  );
});

test('a narration text change moves the spoken hash', () => {
  assert.notEqual(
    spokenSourceHash([figure('The loop repeats.')], headings),
    spokenSourceHash([figure('The loop stops.')], headings)
  );
});

test('a figure reorder moves the spoken hash (playback anchors shift)', () => {
  const first = figure('Same words.', { anchor: { kind: 'figure', index: 0 } });
  const second = figure('Same words.', { anchor: { kind: 'figure', index: 1 } });
  assert.notEqual(
    spokenSourceHash([first], headings),
    spokenSourceHash([second], headings)
  );
});

test('a heading change moves the spoken hash', () => {
  assert.notEqual(
    spokenSourceHash([figure('Body.')], headings),
    spokenSourceHash([figure('Body.')], [{ id: 'h2', title: 'H' }])
  );
});
