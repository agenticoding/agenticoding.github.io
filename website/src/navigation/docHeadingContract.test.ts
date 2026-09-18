// Contract guard: any file reachable from a doc must never render a heading tag.
// Docusaurus derives `doc.toc` from the markdown AST only, so a JSX <h1..6> (or
// <Heading as="hN">) is a real DOM heading that is invisible to both the sidebar
// TOC and the audiobook anchor extractor. Section titles must be markdown
// headings; figure/card titles are captions. See scripts/audiobook/README.md "Sources of truth".
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const websiteRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const docsDir = join(websiteRoot, 'docs');
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

const HEADING_TAG = /<h[1-6][\s>/]/;
const HEADING_COMPONENT =
  /<Heading\b[^>]*\bas=(?:["']h[1-6]["']|\{\s*["'`]h[1-6]["'`]\s*\})/;
const SPECIFIERS = [
  /\bfrom\s*['"]([^'"]+)['"]/g, // import/export ... from '...'
  /\bimport\s*\(\s*['"]([^'"]+)['"]/g, // dynamic import('...')
  /\bimport\s*['"]([^'"]+)['"]/g, // side-effect import '...'
];

const isFile = (path: string): boolean => {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

/** Resolve a bare file base to a real source file (extension or /index). */
function resolveFile(base: string): string | undefined {
  if (isFile(base) && EXTENSIONS.some((ext) => base.endsWith(ext))) return base;
  for (const ext of EXTENSIONS) if (isFile(base + ext)) return base + ext;
  for (const ext of EXTENSIONS) {
    const index = join(base, `index${ext}`);
    if (isFile(index)) return index;
  }
  return undefined;
}

/** Resolve repo-owned specifiers (`@site/...`, relative); ignore packages/aliases. */
function resolveModule(
  specifier: string,
  fromFile: string
): string | undefined {
  if (specifier.startsWith('@site/'))
    return resolveFile(join(websiteRoot, specifier.slice('@site/'.length)));
  if (specifier.startsWith('.'))
    return resolveFile(join(dirname(fromFile), specifier));
  return undefined;
}

function specifiersOf(source: string): string[] {
  return SPECIFIERS.flatMap((pattern) =>
    [...source.matchAll(pattern)].map((match) => match[1])
  );
}

type DocEntry = { file: string; source: string };

function docEntries(): DocEntry[] {
  return readdirSync(docsDir, { recursive: true })
    .filter(
      (name): name is string => typeof name === 'string' && /\.mdx?$/.test(name)
    )
    .map((name) => {
      const file = join(docsDir, name);
      return { file, source: readFileSync(file, 'utf8') };
    });
}

/** Files reachable from any doc via @site/... or relative imports, to a fixpoint. */
function reachableSources(): Map<string, string> {
  const sources = new Map<string, string>();
  const queue: string[] = [];
  for (const { file, source } of docEntries()) {
    sources.set(file, source);
    queue.push(file);
  }
  while (queue.length) {
    const file = queue.pop()!;
    for (const specifier of specifiersOf(sources.get(file)!)) {
      const resolved = resolveModule(specifier, file);
      if (resolved && !sources.has(resolved)) {
        sources.set(resolved, readFileSync(resolved, 'utf8'));
        queue.push(resolved);
      }
    }
  }
  return sources;
}

test('no doc-reachable file renders a heading tag', () => {
  const violations = [...reachableSources()]
    .filter(
      ([, source]) => HEADING_TAG.test(source) || HEADING_COMPONENT.test(source)
    )
    .map(([file]) => relative(websiteRoot, file))
    .sort();

  assert.deepEqual(
    violations,
    [],
    `Rendered heading markup found in doc-reachable files:\n  ${violations.join('\n  ')}\n` +
      'Author section titles as markdown headings; render figure/card titles as ' +
      'captions (<p>/<figcaption>). See scripts/audiobook/README.md "Sources of truth".'
  );
});
