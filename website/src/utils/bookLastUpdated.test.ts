/**
 * Guards the invariant the homepage promises: its "Book last updated" date is
 * never older than the newest commit in any shipped scope. A narrowed path list
 * or a wrong cwd would regress the cover to a stale date; this fails instead.
 * Live-repo checks run against the real repo — no stubs. Hermetic checks use a
 * throwaway git repo so results hold on any clone depth.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  applyBookLastUpdate,
  getBookLastUpdatedAt,
  isHomepageDoc,
  shouldInjectBookDate,
} from './bookLastUpdated.ts';

// Anchored to this file, not the cwd: `npm test` runs from website/, but a
// manual `node --test` from the repo root must yield the same site root.
const SITE_DIR = fileURLToPath(new URL('../../', import.meta.url));

function gitLastCommit(paths: string[]): number {
  const seconds = execFileSync(
    'git',
    [
      '-c',
      'log.showSignature=false',
      'log',
      '-1',
      '--format=%ct',
      '--',
      ...paths,
    ],
    { cwd: SITE_DIR, encoding: 'utf8' }
  ).trim();
  return Number(seconds) * 1000;
}

test('book date covers every shipped scope', () => {
  const book = getBookLastUpdatedAt(SITE_DIR);
  assert.ok(
    typeof book === 'number' && Number.isFinite(book),
    'git must yield a book date'
  );
  assert.ok(book >= gitLastCommit(['docs']), 'docs scope is included');
  assert.ok(book >= gitLastCommit(['src']), 'src scope is included');
});

test('only the docs-root intro.mdx is the homepage', () => {
  assert.equal(isHomepageDoc('/site/docs/intro.mdx'), true);
  assert.equal(isHomepageDoc('/site/docs/other.mdx'), false);
  assert.equal(isHomepageDoc('/site/docs/sub/intro.mdx'), false);
  assert.equal(isHomepageDoc('C:\\site\\docs\\intro.mdx'), true);
  assert.equal(isHomepageDoc('/site/versioned_docs/v1/intro.mdx'), false);
  assert.equal(
    isHomepageDoc(
      '/site/i18n/fr/docusaurus-plugin-content-docs/current/intro.mdx'
    ),
    false
  );
});

test('writes the book date to the homepage front matter', () => {
  const at = Date.UTC(2026, 9, 5, 12, 5, 15);
  const frontMatter: Record<string, unknown> = {};
  applyBookLastUpdate(frontMatter, '/site/docs/intro.mdx', at);
  assert.deepEqual(frontMatter.last_update, {
    date: '2026-10-05T12:05:15.000Z',
  });
});

test('keeps existing front-matter fields when writing the book date', () => {
  const at = Date.UTC(2026, 9, 5, 12, 5, 15);
  const frontMatter: Record<string, unknown> = {
    last_update: { author: 'someone' },
  };
  applyBookLastUpdate(frontMatter, '/site/docs/intro.mdx', at);
  assert.deepEqual(frontMatter.last_update, {
    author: 'someone',
    date: '2026-10-05T12:05:15.000Z',
  });
});

test('injects only for the homepage in production', () => {
  assert.equal(
    shouldInjectBookDate('production', '/site/docs/intro.mdx'),
    true
  );
  assert.equal(
    shouldInjectBookDate('production', '/site/docs/other.mdx'),
    false
  );
  assert.equal(
    shouldInjectBookDate('development', '/site/docs/intro.mdx'),
    false
  );
  assert.equal(shouldInjectBookDate(undefined, '/site/docs/intro.mdx'), false);
});

test('does not touch non-homepage front matter', () => {
  const frontMatter = { title: 'Chapter' };
  applyBookLastUpdate(
    frontMatter,
    '/site/docs/other.mdx',
    Date.UTC(2026, 9, 5, 12, 5, 15)
  );
  assert.deepEqual(frontMatter, { title: 'Chapter' });
});

test('does not touch front matter without a book date', () => {
  const frontMatter: Record<string, unknown> = {};
  applyBookLastUpdate(frontMatter, '/site/docs/intro.mdx', undefined);
  assert.deepEqual(frontMatter, {});
});

test('util is loadable by the CJS config loader (no ESM meta-property)', () => {
  const source = readFileSync(
    fileURLToPath(new URL('./bookLastUpdated.ts', import.meta.url)),
    'utf8'
  );
  // Ignore comment lines: prose may name the forbidden construct.
  const code = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  assert.doesNotMatch(code, /\bimport\.meta\b/);
});

test('missing git degrades to undefined instead of throwing', () => {
  const base = mkdtempSync(path.join(tmpdir(), 'no-git-'));
  const empty = path.join(base, 'nested');
  mkdirSync(empty);
  const warnings: string[] = [];
  const warn = console.warn;
  const ceiling = process.env.GIT_CEILING_DIRECTORIES;
  console.warn = (message?: unknown) => warnings.push(String(message));
  // Force git to stop above `base` so an enclosing repo cannot leak in.
  process.env.GIT_CEILING_DIRECTORIES = base;
  try {
    assert.equal(getBookLastUpdatedAt(empty), undefined);
    assert.equal(warnings.length, 1, 'git failure must warn once');
  } finally {
    console.warn = warn;
    if (ceiling === undefined) {
      delete process.env.GIT_CEILING_DIRECTORIES;
    } else {
      process.env.GIT_CEILING_DIRECTORIES = ceiling;
    }
  }
});

function fixtureCommit(dir: string, iso: string): void {
  execFileSync('git', ['add', '-A'], { cwd: dir });
  execFileSync('git', ['commit', '-m', 'x', `--date=${iso}`], {
    cwd: dir,
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: iso,
      GIT_COMMITTER_DATE: iso,
      GIT_AUTHOR_NAME: 't',
      GIT_AUTHOR_EMAIL: 't@t',
      GIT_COMMITTER_NAME: 't',
      GIT_COMMITTER_EMAIL: 't@t',
    },
    encoding: 'utf8',
  });
}

test('hermetic fixture: book date is the newest scope commit', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'book-date-'));
  execFileSync('git', ['init'], { cwd: dir });
  mkdirSync(path.join(dir, 'docs'), { recursive: true });
  mkdirSync(path.join(dir, 'src'), { recursive: true });
  writeFileSync(path.join(dir, 'docs', 'a.md'), 'a');
  fixtureCommit(dir, '2024-01-01T00:00:00Z');
  writeFileSync(path.join(dir, 'src', 'c.ts'), 'c');
  fixtureCommit(dir, '2025-06-01T00:00:00Z');
  assert.equal(
    getBookLastUpdatedAt(dir),
    new Date('2025-06-01T00:00:00Z').getTime()
  );
});

test('memoizes per directory: later commits do not move the cached date', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'book-date-cache-'));
  execFileSync('git', ['init'], { cwd: dir });
  mkdirSync(path.join(dir, 'docs'), { recursive: true });
  writeFileSync(path.join(dir, 'docs', 'a.md'), 'a');
  fixtureCommit(dir, '2024-01-01T00:00:00Z');
  const first = getBookLastUpdatedAt(dir);
  assert.equal(first, new Date('2024-01-01T00:00:00Z').getTime());
  writeFileSync(path.join(dir, 'docs', 'b.md'), 'b');
  fixtureCommit(dir, '2025-06-01T00:00:00Z');
  assert.equal(getBookLastUpdatedAt(dir), first);
});
