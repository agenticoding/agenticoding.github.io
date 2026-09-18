import assert from 'node:assert/strict';
import test from 'node:test';
import { AUDIO_DOC_IDS, chapterMeta } from './docs.ts';

test('every document extracts without unclassified nodes or markup leakage', () => {
  const problems = AUDIO_DOC_IDS.flatMap((id) => chapterMeta(id).violations);
  assert.deepEqual(problems, []);
});

test('every document declares a title', () => {
  const missing = AUDIO_DOC_IDS.filter((id) => !chapterMeta(id).title);
  assert.deepEqual(missing, []);
});

test('figure and code anchors are unique and code blocks resolve their heading', () => {
  const bad: string[] = [];
  for (const id of AUDIO_DOC_IDS) {
    const { blocks, headings } = chapterMeta(id);
    const figures = blocks.flatMap((block) =>
      block.kind === 'figure' && block.anchor.kind === 'figure'
        ? [block.anchor.index]
        : []
    );
    const codes = blocks.flatMap((block) =>
      block.kind === 'code' && block.anchor.kind === 'code'
        ? [block.anchor.index]
        : []
    );
    if (new Set(figures).size !== figures.length)
      bad.push(`${id}: duplicate figure anchors`);
    if (new Set(codes).size !== codes.length)
      bad.push(`${id}: duplicate code anchors`);
    const headingIds = new Set(headings.map((heading) => heading.id));
    for (const block of blocks) {
      if (
        block.kind === 'code' &&
        block.anchor.kind === 'code' &&
        block.anchor.headingId &&
        !headingIds.has(block.anchor.headingId)
      ) {
        bad.push(
          `${id}: code block ${block.anchor.index} points at unknown heading`
        );
      }
    }
  }
  assert.deepEqual(bad, []);
});
