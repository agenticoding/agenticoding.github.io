import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveActiveHeading, type HeadingSnapshot } from './scrollspy.ts';

function heading(id: string, top: number, bottom = top + 32): HeadingSnapshot {
  return { id, top, bottom };
}

test('resolveActiveHeading selects the last heading above the reading line', () => {
  const headings = [heading('intro', -200), heading('setup', 80), heading('api', 360)];

  assert.equal(resolveActiveHeading({ headings, viewportHeight: 1000, atPageBottom: false }), 'setup');
});

test('resolveActiveHeading selects the first visible heading before any heading crosses the reading line', () => {
  const headings = [heading('intro', 260), heading('setup', 540)];

  assert.equal(resolveActiveHeading({ headings, viewportHeight: 1000, atPageBottom: false }), 'intro');
});

test('resolveActiveHeading selects the last heading at document bottom', () => {
  const headings = [heading('intro', -1200), heading('final', 760)];

  assert.equal(resolveActiveHeading({ headings, viewportHeight: 1000, atPageBottom: true }), 'final');
});

test('resolveActiveHeading has an explicit empty state for pages without headings', () => {
  assert.equal(resolveActiveHeading({ headings: [], viewportHeight: 1000, atPageBottom: false }), '');
});
