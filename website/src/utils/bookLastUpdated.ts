// Node-only build util — never import from client code (would bundle node:child_process).
import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * WHY: The homepage advertises the BOOK's freshness, not the homepage file's own
 * mtime — `intro.mdx` rarely changes while chapters and their components churn.
 * Git is the single source: the newest committer date across the prose (`docs`)
 * and the components that render it (`src`), so a component bug fix also counts.
 * Narrow on purpose: site shell (config, sidebars, CSS) does not bump the cover.
 * Widen this list if a shipped content path is missed.
 */
const BOOK_PATHS = ['docs', 'src'];

// Site root anchored to this file. Do NOT use the ESM meta-property here:
// docusaurus.config.ts imports this module, and Docusaurus loads that config
// through jiti in CJS mode, where the ESM meta-property is a parse-time
// SyntaxError. jiti supplies `__dirname` (CJS); the `typeof` guard covers the
// ESM test runner, which falls back to process.cwd().
const SITE_DIR = (() => {
  if (typeof __dirname === 'string') {
    return path.resolve(__dirname, '../..');
  }
  return process.cwd();
})();

const cache = new Map<string, number | undefined>();

/**
 * Newest committer timestamp (epoch ms) across the book content tree.
 * Memoized per cwd: `markdown.parseFrontMatter` calls this per markdown file.
 * Returns `undefined` when git is unavailable or yields no parsable date;
 * callers must degrade to the per-file date rather than render a fabricated one.
 */
export function getBookLastUpdatedAt(
  cwd: string = SITE_DIR
): number | undefined {
  const key = path.resolve(cwd);
  if (cache.has(key)) {
    return cache.get(key);
  }
  let at: number | undefined;
  try {
    const seconds = execFileSync(
      'git',
      [
        '-c',
        'log.showSignature=false',
        'log',
        '-1',
        '--format=%ct',
        '--',
        ...BOOK_PATHS,
      ],
      { cwd: key, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    ).trim();
    const ms = seconds ? Number(seconds) * 1000 : NaN;
    at = Number.isFinite(ms) ? ms : undefined;
  } catch (error) {
    console.warn(
      `[book-last-updated] git unavailable; homepage falls back to its own file date. ${String(error)}`
    );
    at = undefined;
  }
  cache.set(key, at);
  return at;
}

/**
 * The homepage source lives at `<docs root>/intro.mdx` (slug `/`).
 * This is the only doc whose date is overridden with the book-wide date.
 * Limit: matches only the default docs root — versioned (`versioned_docs/...`)
 * or i18n (`i18n/...`) copies do not match. Fine today: one locale, no versions.
 */
export function isHomepageDoc(filePath: string): boolean {
  const parts = filePath.split(/[\\/]/).filter(Boolean);
  return (
    parts.length >= 2 &&
    parts[parts.length - 1] === 'intro.mdx' &&
    parts[parts.length - 2] === 'docs'
  );
}

/**
 * Production + homepage gate. Pure so the delivery rule stays unit-testable
 * without loading the Docusaurus config. The caller still resolves `at` lazily:
 * check this before calling `getBookLastUpdatedAt()` to skip the git spawn for
 * every non-homepage file.
 */
export function shouldInjectBookDate(
  nodeEnv: string | undefined,
  filePath: string
): boolean {
  return nodeEnv === 'production' && isHomepageDoc(filePath);
}

/**
 * Writes the book-wide date onto the homepage's front matter only.
 * Pure: the caller resolves `at` and enforces production. Keeps the delivery
 * rule unit-testable without loading the Docusaurus config.
 */
export function applyBookLastUpdate(
  frontMatter: Record<string, unknown>,
  filePath: string,
  at: number | undefined
): void {
  if (at === undefined || !isHomepageDoc(filePath)) {
    return;
  }
  const kept =
    typeof frontMatter.last_update === 'object' &&
    frontMatter.last_update !== null
      ? (frontMatter.last_update as Record<string, unknown>)
      : {};
  frontMatter.last_update = { ...kept, date: new Date(at).toISOString() };
}
