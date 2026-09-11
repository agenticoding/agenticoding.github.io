// Guards navigation contracts the build cannot catch: every doc is reachable,
// book numbering remains stable, and Toolbox stays ahead of About.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import {
  chapterGroups,
  chapters,
  getChapterById,
  getChapterByNumber,
  getSectionNumber,
  isNumbered,
  ORDERED_IDS,
  standaloneChapters,
  toolboxEntries,
  type SidebarCustomProps,
} from '../../chapters.ts';
import sidebars from '../../sidebars.ts';
// SidebarCustomProps is the single source of truth for sidebar typing (see
// website/chapters.ts). website/tsconfig.json#include must cover "*.ts" at the
// website root so sidebars.ts + chapters.ts outside src/ still type-check and
// this test's SidebarDocItem stays in sync with the producer.

const docsDir = new URL('../../docs/', import.meta.url);

// Doc file lookup by ID (readdirSync lists names with extension) for reading
// frontmatter in the tests below.
const docFileById = new Map(
  readdirSync(docsDir, { recursive: true })
    .filter(
      (name): name is string => typeof name === 'string' && /\.mdx?$/.test(name)
    )
    .map((name) => [name.replace(/\.mdx?$/, ''), name])
);

const docIds = readdirSync(docsDir, { recursive: true })
  .filter((name): name is string => {
    if (typeof name !== 'string' || !/\.mdx?$/.test(name)) return false;
    // Mirror the docs plugin's exclude list (docusaurus.config.ts) so
    // build-excluded files can't false-fail the reachability contract.
    const segments = name.split(/[\\/]/);
    const basename = segments.at(-1)!;
    return (
      !basename.startsWith('_') && // **/_*.md(x)
      !segments.some((s) => s.startsWith('_') || s === '__tests__') &&
      basename !== 'CLAUDE.md'
    );
  })
  .map((name) => name.replace(/\.mdx?$/, ''));
const toolboxIds = toolboxEntries.map((entry) => entry.id);
const toolboxIdSet = new Set<string>(toolboxIds);

/** Frontmatter `title` of a doc — the sidebar displays this value, so
    chapters.ts titles must match it (single source of truth for display). */
function frontmatterTitle(docId: string): string {
  const file = docFileById.get(docId);
  assert.ok(file, `doc file for ${docId} not found in website/docs`);
  const content = readFileSync(
    new URL(`../../docs/${file}`, import.meta.url),
    'utf8'
  );
  const title = content
    .match(/^---\n[\s\S]*?\n---/)?.[0]
    ?.match(/^title:\s*(.+)$/m)?.[1];
  assert.ok(title, `${file} has no frontmatter title`);
  return title.trim().replace(/^['"]|['"]$/g, '');
}

type SidebarDocItem = {
  type: string;
  id?: string;
  label?: string;
  items?: readonly SidebarDocItem[];
  // Use the canonical SidebarCustomProps so producer (sidebars.ts) and
  // consumer (this test) stay in sync — sectionNumber is the asserted field.
  customProps?: SidebarCustomProps;
};

const flattenDocItems = (nodes: readonly SidebarDocItem[]): SidebarDocItem[] =>
  nodes.flatMap((node) =>
    node.type === 'doc' ? [node] : flattenDocItems(node.items ?? [])
  );

const topLevelItems =
  sidebars.tutorialSidebar as unknown as readonly SidebarDocItem[];
const sidebarDocs = flattenDocItems(topLevelItems);

test('exactly one beforeGroups entry occupies index 0 so section numbers stay stable', () => {
  // getSectionNumber is dense 1-indexed. If beforeGroups had 0 or 2+ entries,
  // intent is preserved by dense counting, but this guard documents the current
  // book shape so a second frontmatter addition is a conscious decision.
  assert.equal(
    standaloneChapters.beforeGroups.length,
    1,
    'beforeGroups must have exactly one entry (intro) at index 0'
  );
  assert.equal(standaloneChapters.beforeGroups[0]!.id, 'intro');
  assert.equal(
    isNumbered(standaloneChapters.beforeGroups[0]!),
    false,
    'the beforeGroups entry must be unnumbered'
  );
});

test('first numbered chapter is how-llms-work (intro Next link depends on this)', () => {
  // The intro page's "Next:" link points at the first numbered chapter. If the
  // first numbered chapter changes, that link must be updated with it.
  const firstNumbered = chapters.find(isNumbered);
  assert.equal(
    firstNumbered?.id,
    'how-llms-work',
    'intro.mdx Next link "LLMs Demystified" is coupled to this chapter ID'
  );
});

test('browser-contract deep-link chapters stay stable (test-responsive-diagrams.cjs depends on them)', () => {
  // scripts/test-responsive-diagrams.cjs inspectActiveChapterScroll deep-links
  // these chapters; a rename should fail here (fast unit suite) rather than in
  // the slow browser suite.
  const lastNumbered = chapters.at(-2); // -1 is About (afterGroups)
  assert.equal(lastNumbered?.id, 'agent-knowledge-cache');
  assert.equal(isNumbered(lastNumbered!), true);
  assert.equal(
    chapterGroups[0].chapters.at(-1)!.id,
    'structured-control-plane-agents'
  );
});

test('chapter IDs are unique and section numbers round-trip through both lookups', () => {
  assert.equal(new Set(ORDERED_IDS).size, chapters.length);
  chapters.forEach((chapter, n) => {
    assert.equal(getChapterById(chapter.id), chapter);
    // Dense 1-indexed section number: count of numbered chapters up to and including this one.
    const expected = isNumbered(chapter)
      ? chapters.slice(0, n).filter(isNumbered).length + 1
      : undefined;
    assert.equal(getSectionNumber(chapter.id), expected);
    if (expected !== undefined) {
      assert.equal(getChapterByNumber(expected)?.id, chapter.id);
    }
  });
});

test('every chapter in chapterGroups is numbered', () => {
  assert.ok(chapterGroups.flatMap((g) => [...g.chapters]).every(isNumbered));
});

test('every book and toolbox document is reachable from main navigation', () => {
  assert.deepEqual([...docIds].sort(), [...ORDERED_IDS, ...toolboxIds].sort());
});

test('Toolbox is the final category before About and has no chapter numbers', () => {
  const toolbox = topLevelItems.at(-2);
  assert.equal(toolbox?.type, 'category');
  assert.equal(toolbox?.label, 'Toolbox');
  assert.deepEqual(
    toolbox?.items?.map((item) => item.id),
    [...toolboxIds]
  );

  const expectedIds = [
    ...ORDERED_IDS.slice(0, -1),
    ...toolboxIds,
    ORDERED_IDS.at(-1),
  ];
  assert.deepEqual(
    sidebarDocs.map((item) => item.id),
    expectedIds
  );

  for (const item of sidebarDocs) {
    const { sectionNumber } = item.customProps ?? {};
    if (toolboxIdSet.has(item.id!)) {
      assert.equal(sectionNumber, undefined);
      continue;
    }

    const chapter = getChapterById(item.id!);
    assert.ok(chapter, `sidebar item ${item.id} is not a chapter`);
    assert.equal(sectionNumber !== undefined, isNumbered(chapter));
    // Sidebar numbers must equal the derived section number, not just exist.
    assert.equal(sectionNumber, getSectionNumber(item.id!));
  }
});

test('chapter titles match the frontmatter titles the sidebar displays', () => {
  // The sidebar label comes from each doc's frontmatter, while chapters.ts
  // titles are the declared single source of truth (chapters.ts header).
  // Drift here desyncs the two descriptions of the same chapter.
  for (const group of chapterGroups) {
    for (const chapter of group.chapters) {
      assert.equal(
        chapter.title,
        frontmatterTitle(chapter.id),
        `${chapter.id}: chapters.ts title diverges from frontmatter`
      );
    }
  }
});

test('browser-contract LABEL_* constants stay in sync with chapters.ts labels', () => {
  // scripts/test-responsive-diagrams.cjs duplicates these strings with only a
  // comment enforcing sync; a rename must fail here (fast unit suite) rather
  // than in the slow browser suite.
  const script = readFileSync(
    new URL('../../../scripts/test-responsive-diagrams.cjs', import.meta.url),
    'utf8'
  );
  const extractLabel = (name: string): string => {
    const value = script.match(new RegExp(`const ${name} = "([^"]+)"`))?.[1];
    assert.ok(value, `${name} not found in test-responsive-diagrams.cjs`);
    return value;
  };
  // Indices are pinned because inspectSidebarNavigation/inspectMobileDrawerSidebar
  // click these groups by position in the book shape.
  assert.equal(extractLabel('LABEL_FOUNDATIONS'), chapterGroups[0].label);
  assert.equal(extractLabel('LABEL_DIRECTING'), chapterGroups[1].label);
  assert.equal(extractLabel('LABEL_SHIPPING'), chapterGroups[3].label);
  // About's sidebar label is the standalone doc's frontmatter title.
  assert.equal(
    extractLabel('LABEL_ABOUT'),
    frontmatterTitle(standaloneChapters.afterGroups[0].id)
  );
});
