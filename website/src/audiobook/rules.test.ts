// Guards the extractor's component contract: a visual must be known (narrate),
// deliberately silent (skip with a reason), or the one frame primitive that owns
// its own narration. A new component without a rule fails extraction loudly; this
// test keeps rules.ts from rotting as visual components are added or removed.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { ruleFor, SKIP } from './rules.ts';

/** SKIP entries that are not files in VisualElements/ (prompt parts, chrome). */
const NON_VISUAL = new Set([
  'PromptExample',
  'ToolMark',
  'InlineEmojiImage',
  'SchemaMarkup',
  'GitHubProjectSource',
]);

const visualNames = (): string[] =>
  readdirSync(new URL('../components/VisualElements/', import.meta.url), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
    .map((entry) => entry.name.replace(/\.tsx$/, ''));

test('every visual component resolves to narrate, frame, or a reasoned skip', () => {
  const bad = visualNames().flatMap((name) => {
    const rule = ruleFor(name);
    if (rule?.kind === 'narrate' || rule?.kind === 'frame') return [];
    if (rule?.kind === 'skip' && rule.reason) return [];
    return [`${name}: ${rule ? JSON.stringify(rule) : 'unclassified'}`];
  });
  assert.deepEqual(bad, []);
});

test('every skip entry carries a non-empty reason', () => {
  const empty = Object.entries(SKIP)
    .filter(([, reason]) => !reason?.trim())
    .map(([name]) => name);
  assert.deepEqual(empty, []);
});

test('every skip key that looks like a visual names a real component', () => {
  const stale = Object.keys(SKIP).filter(
    (key) => !NON_VISUAL.has(key) && !visualNames().includes(key)
  );
  assert.deepEqual(stale, []);
});

/** Every `.tsx` under `components/`, so figure targets are found wherever they live. */
function tsxFiles(dir: URL): URL[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const child = new URL(
      `${entry.name}${entry.isDirectory() ? '/' : ''}`,
      dir
    );
    if (entry.isDirectory()) return tsxFiles(child);
    return entry.name.endsWith('.tsx') ? [child] : [];
  });
}

/** All component sources under `components/`, keyed by component name (index.tsx takes its directory name). */
function componentSources(): Map<string, string> {
  const sources = new Map<string, string>();
  for (const url of tsxFiles(new URL('../components/', import.meta.url))) {
    const parts = url.pathname.split('/');
    const file = parts.at(-1)!;
    sources.set(
      file === 'index.tsx' ? parts.at(-2)! : file.replace(/\.tsx$/, ''),
      readFileSync(url, 'utf8')
    );
  }
  return sources;
}

/** The component names that render a player figure target. */
function figureTargetComponents(): string[] {
  return [...componentSources()].flatMap(([name, source]) =>
    source.includes('data-audio-figure') ? [name] : []
  );
}

// A component that renders a figure target owns a spoken explanation: skipping it
// would drop it from the extractor and from coverage, which is the silent-under-narration bug.
test('every component that renders a figure target is narrate or frame, never skip', () => {
  const bad = figureTargetComponents().flatMap((name) => {
    const rule = ruleFor(name);
    if (rule?.kind === 'narrate' || rule?.kind === 'frame') return [];
    return [`${name}: ${rule ? JSON.stringify(rule) : 'unclassified'}`];
  });
  assert.deepEqual(bad, []);
});

/** Every `.md`/`.mdx` doc, recursively: narration usages are found wherever chapters live. */
function docFiles(dir: URL): URL[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const child = new URL(
      `${entry.name}${entry.isDirectory() ? '/' : ''}`,
      dir
    );
    if (entry.isDirectory()) return docFiles(child);
    return /\.mdx?$/.test(entry.name) ? [child] : [];
  });
}

/** Component names the docs hand a `narration` prop directly (one extractor figure block per use). */
function directlyNarratedComponents(): string[] {
  const names = new Set<string>();
  for (const url of docFiles(new URL('../../docs/', import.meta.url))) {
    const source = readFileSync(url, 'utf8');
    for (const match of source.matchAll(
      /<([A-Z][A-Za-z]*)((?:(?!>)[\s\S])*)\bnarration\s*=/g
    ))
      names.add(match[1]!);
  }
  return [...names];
}

// The reverse invariant: the extractor counts one figure block per directly narrated
// component, and the player maps figure anchors to `[data-audio-figure]` in DOM order —
// a narrated component that renders no figure shifts every later figure anchor in the chapter.
test('every component the docs narrate directly renders its own figure target', () => {
  const sources = componentSources();
  const bad = directlyNarratedComponents().flatMap((name) => {
    const rule = ruleFor(name);
    if (rule?.kind !== 'narrate' && rule?.kind !== 'frame') return [];
    return sources.get(name)?.includes('data-audio-figure')
      ? []
      : [`${name}: narrated in docs but renders no data-audio-figure`];
  });
  assert.deepEqual(bad, []);
});
