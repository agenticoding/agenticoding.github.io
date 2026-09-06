// Guards the "Next:" reading spine: each module's footer must point at the
// next document in book order, so group reorders or chapter insertions can't
// silently desync the hand-written footers from the chapters.ts-driven sidebar.
// The canonical footer format is part of the contract too: exactly one
// "**Next:** [label](target)" per module.
//
// Source-only complement: the rendered DOM contract (footer link is clickable
// in built HTML and drives SPA sidebar state) is covered by browser contracts
// — see scripts/test-responsive-diagrams.cjs: clickReadingSpineNext /
// inspectActiveChapterScroll. This file guards the authoring contract without
// requiring build artifacts. Full per-footer DOM coverage is optional future
// work (a cheap addition to the browser routes loop), not owed by this suite.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { getChapterById, isNumbered, ORDERED_IDS } from '../../chapters.ts';

const docsDir = new URL('../../docs/', import.meta.url);
const docFiles = readdirSync(docsDir, { recursive: true }).filter(
  (name): name is string => typeof name === 'string' && /\.mdx?$/.test(name)
);

const NEXT_FOOTER_PATTERN = /\*\*Next:\*\*\s*\[[^\]]*\]\(([^)]+)\)/g;

function normalizeTarget(target: string): string {
  // Footers use both relative (./x.md) and route (/x) forms.
  return target
    .replace(/^\.\/|^\//, '')
    .replace(/\.mdx?$/, '')
    .split('#')[0];
}

// Complements the browser contract (scripts/test-responsive-diagrams.cjs
// clickReadingSpineNext) which clicks the rendered `article p` "Next:" link
// and asserts sidebar expansion — this test guards the source authoring side.
test('every Next: footer points at the next document in book order', () => {
  for (const file of docFiles) {
    const id = file.replace(/\.mdx?$/, '');
    const index = ORDERED_IDS.indexOf(id);
    if (index === -1) continue; // standalone pages (Toolbox) have no spine role
    const nextId = ORDERED_IDS[index + 1];
    if (nextId === undefined) continue; // last ordered doc has nobody to hand off to

    const nextItem = getChapterById(nextId);
    if (!nextItem) continue; // unreachable while ORDERED_IDS mirrors chapters

    const content = readFileSync(
      new URL(`../../docs/${file}`, import.meta.url),
      'utf8'
    );
    const targets = [...content.matchAll(NEXT_FOOTER_PATTERN)].map(
      (match) => match[1]
    );
    // Chapters hand off to chapters. The one chapter whose next is a standalone
    // page (the last chapter, before the Toolbox/About section) is exempt from
    // carrying a footer — but a footer that exists must still point correctly.
    if (isNumbered(nextItem))
      assert.equal(
        targets.length,
        1,
        `${file}: expected exactly one Next: footer, found ${targets.length}`
      );
    for (const target of targets)
      assert.equal(
        normalizeTarget(target),
        nextId,
        `${file}: Next footer points at ${target}, expected ${nextId}`
      );
  }
});

test('Next: footers use relative form and resolve inside ORDERED_IDS', () => {
  // Docusaurus resolves both /foo and ./foo.md, but the authoring convention
  // is relative (./x.md or /x). This guards against bare IDs or absolute URLs
  // sneaking in, while the previous test guards the normalized mapping.
  const orderedSet = new Set(ORDERED_IDS);
  for (const file of docFiles) {
    if (!ORDERED_IDS.includes(file.replace(/\.mdx?$/, ''))) continue;
    const content = readFileSync(
      new URL(`../../docs/${file}`, import.meta.url),
      'utf8'
    );
    for (const match of content.matchAll(NEXT_FOOTER_PATTERN)) {
      const raw = match[1];
      assert.match(
        raw,
        /^(\.\/|\/)/,
        `${file}: Next footer target "${raw}" must use relative form (./x.md or /x)`
      );
      assert.equal(
        /https?:\/\//.test(raw),
        false,
        `${file}: Next footer must not use absolute URL: ${raw}`
      );
      assert.equal(
        orderedSet.has(normalizeTarget(raw)),
        true,
        `${file}: Next footer target "${raw}" does not resolve inside ORDERED_IDS`
      );
    }
  }
});
