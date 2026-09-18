/**
 * Single source of truth for book structure, ordering, and sidebar groups.
 *
 * Groups provide orientation in navigation without affecting numbering;
 * section number is the dense count of numbered chapters (1-indexed).
 */
export const standaloneChapters = {
  beforeGroups: [
    {
      id: 'intro',
      kind: 'frontmatter' as const,
      numbered: false,
      collapsesCategories: true,
    },
  ],
  afterGroups: [
    {
      id: 'about',
      kind: 'reference' as const,
      numbered: false,
      collapsesCategories: true,
    },
  ],
} as const;

export const toolboxEntries = [
  {
    id: 'developer-tools/cli-coding-agents',
    kind: 'reference' as const,
    numbered: false,
  },
  {
    id: 'developer-tools/terminals',
    kind: 'reference' as const,
    numbered: false,
  },
  {
    id: 'developer-tools/cli-tools',
    kind: 'reference' as const,
    numbered: false,
  },
  {
    id: 'developer-tools/mcp-servers',
    kind: 'reference' as const,
    numbered: false,
  },
] as const;

export const chapterGroups = [
  {
    label: 'Foundations',
    chapters: [
      {
        id: 'how-llms-work',
        kind: 'chapter' as const,
      },
      {
        id: 'llm-training-and-post-training',
        kind: 'chapter' as const,
      },
      {
        id: 'llm-reliability-limits',
        kind: 'chapter' as const,
      },
      {
        id: 'effective-context',
        kind: 'chapter' as const,
      },
      {
        id: 'selecting-production-llms',
        kind: 'chapter' as const,
      },
      {
        id: 'how-agents-work',
        kind: 'chapter' as const,
      },
      {
        id: 'agent-context-state',
        kind: 'chapter' as const,
      },
      {
        id: 'agent-roles-tools-contract',
        kind: 'chapter' as const,
      },
      {
        id: 'harness-agents',
        kind: 'chapter' as const,
      },
      {
        id: 'workflow-agents',
        kind: 'chapter' as const,
      },
    ],
  },
  {
    label: 'Directing Agent Work',
    chapters: [
      { id: 'prompting-101', kind: 'chapter' as const },
      {
        id: 'prompt-contracts',
        kind: 'chapter' as const,
      },
      {
        id: 'prompting-by-example',
        kind: 'chapter' as const,
      },
      {
        id: 'steering-retrieval-and-multistep-work',
        kind: 'chapter' as const,
      },
      {
        id: 'grounded-safe-instructions',
        kind: 'chapter' as const,
      },
      {
        id: 'prompting-executable-validation',
        kind: 'chapter' as const,
      },
      {
        id: 'high-level-methodology',
        kind: 'chapter' as const,
      },
      {
        id: 'workflow-grounding',
        kind: 'chapter' as const,
      },
      { id: 'workflow-planning', kind: 'chapter' as const },
      {
        id: 'workflow-execution',
        kind: 'chapter' as const,
      },
      {
        id: 'workflow-validation-feedback',
        kind: 'chapter' as const,
      },
    ],
  },
  {
    label: 'Reliable Agent Systems',
    chapters: [
      {
        id: 'context-engineering',
        kind: 'chapter' as const,
      },
      { id: 'context-files', kind: 'chapter' as const },
      {
        id: 'mcp-tool-schema-budgets',
        kind: 'chapter' as const,
      },
      {
        id: 'skills-and-procedures',
        kind: 'chapter' as const,
      },
      {
        id: 'sub-agent-delegation',
        kind: 'chapter' as const,
      },
      {
        id: 'context-compaction',
        kind: 'chapter' as const,
      },
      {
        id: 'reliability-levers',
        kind: 'chapter' as const,
      },
      {
        id: 'reliability-context-quality',
        kind: 'chapter' as const,
      },
      {
        id: 'reliability-orchestration',
        kind: 'chapter' as const,
      },
      {
        id: 'reliability-independent-retries',
        kind: 'chapter' as const,
      },
      {
        id: 'reliability-hitl-checkpoints',
        kind: 'chapter' as const,
      },
      {
        id: 'selecting-reliability-controls',
        kind: 'chapter' as const,
      },
    ],
  },
  {
    label: 'Shipping Agent Work',
    chapters: [
      {
        id: 'spec-driven-development',
        kind: 'chapter' as const,
      },
      {
        id: 'spec-review-cost',
        kind: 'chapter' as const,
      },
      {
        id: 'spec-drafting-approval',
        kind: 'chapter' as const,
      },
      {
        id: 'spec-execution',
        kind: 'chapter' as const,
      },
      {
        id: 'spec-lifecycle',
        kind: 'chapter' as const,
      },
      { id: 'validation', kind: 'chapter' as const },
      {
        id: 'validation-evidence-portfolios',
        kind: 'chapter' as const,
      },
      { id: 'llm-judges', kind: 'chapter' as const },
      {
        id: 'human-acceptance-discovery',
        kind: 'chapter' as const,
      },
      {
        id: 'continuous-validation',
        kind: 'chapter' as const,
      },
      {
        id: 'agent-friendly-code',
        kind: 'chapter' as const,
      },
      {
        id: 'agent-code-constraints',
        kind: 'chapter' as const,
      },
      {
        id: 'agent-code-guardrails',
        kind: 'chapter' as const,
      },
      {
        id: 'agent-knowledge-cache',
        kind: 'chapter' as const,
      },
    ],
  },
] as const;

const groupedChapters = chapterGroups.flatMap((group) => [...group.chapters]);

export const chapters = [
  ...standaloneChapters.beforeGroups,
  ...groupedChapters,
  ...standaloneChapters.afterGroups,
];

export type ChapterId = (typeof chapters)[number]['id'];
export type Chapter = (typeof chapters)[number];
export type ToolboxEntry = (typeof toolboxEntries)[number];

/** Shape injected into sidebar doc items via customProps. Single source of
    truth consumed by both sidebars.ts (producer) and swizzled components (consumer). */
export interface SidebarCustomProps {
  sectionNumber: number | undefined;
  collapsesCategories: boolean;
}

/** Only chapters and toolbox entries with explicit `numbered: false` are
    unnumbered; narrowing with this guard removes exactly those members. */
export function isNumbered(
  item: Chapter | ToolboxEntry
): item is Exclude<Chapter | ToolboxEntry, { numbered: false }> {
  return !('numbered' in item && item.numbered === false);
}

/** Ordered document IDs, used by navigation and cross-reference resolution. */
export const ORDERED_IDS = chapters.map(
  (chapter) => chapter.id
) as readonly string[];

export function getChapterById(id: string): Chapter | undefined {
  return chapters.find((chapter) => chapter.id === id);
}

/** Sidebar group that owns a chapter; undefined for standalone pages. */
export function getChapterGroup(id: string) {
  return chapterGroups.find((group) =>
    group.chapters.some((chapter) => chapter.id === id)
  );
}

/** Section number is the dense 1-indexed count of numbered chapters;
    unnumbered items (e.g. intro/about) have no section number. */
export function getSectionNumber(id: string): number | undefined {
  const idx = chapters.findIndex((chapter) => chapter.id === id);
  if (idx === -1 || !isNumbered(chapters[idx])) return undefined;
  return chapters.slice(0, idx).filter(isNumbered).length + 1;
}

/** 1-indexed: n=1 returns the first numbered chapter, matching display numbers. */
export function getChapterByNumber(n: number): Chapter | undefined {
  const numbered = chapters.filter(isNumbered);
  return numbered[n - 1];
}
