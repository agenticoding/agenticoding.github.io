// Guards the book's title contract: frontmatter `title` is the single source of
// truth for the page H1, sidebar, audio, and SEO. A body H1 or a divergent audio
// title would silently desync what readers see from what they hear.
import assert from 'node:assert/strict';
import test from 'node:test';
import { chapterMeta } from '../audiobook/docs.ts';
import {
  docIds,
  docSource,
  frontmatterTitle,
  hasBodyH1,
} from './docSources.ts';

test('every doc declares its title in frontmatter', () => {
  for (const id of docIds) {
    assert.ok(
      frontmatterTitle(docSource(id)),
      `${id} has no frontmatter title`
    );
  }
});

test('no doc has a body top-level H1', () => {
  for (const id of docIds) {
    assert.ok(
      !hasBodyH1(docSource(id)),
      `${id} has a body H1; move its text into the frontmatter title`
    );
  }
});

test('audio title resolves to the doc frontmatter title', () => {
  for (const id of docIds) {
    const expected = frontmatterTitle(docSource(id));
    assert.ok(expected, `${id} has no frontmatter title`);
    assert.equal(
      chapterMeta(id).title,
      expected,
      `${id}: audio title diverges from frontmatter`
    );
  }
});
