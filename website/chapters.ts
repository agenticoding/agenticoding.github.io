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
        title: 'LLMs Demystified',
      },
      {
        id: 'llm-training-and-post-training',
        kind: 'chapter' as const,
        title: 'Training and Post-Training',
      },
      {
        id: 'llm-reliability-limits',
        kind: 'chapter' as const,
        title: 'Why LLMs Fail',
      },
      {
        id: 'effective-context',
        kind: 'chapter' as const,
        title: 'Effective Context',
      },
      {
        id: 'selecting-production-llms',
        kind: 'chapter' as const,
        title: 'Choosing a Production Model',
      },
      {
        id: 'how-agents-work',
        kind: 'chapter' as const,
        title: 'Agents Demystified',
      },
      {
        id: 'agent-context-state',
        kind: 'chapter' as const,
        title: 'Context and Memory',
      },
      {
        id: 'agent-roles-tools-contract',
        kind: 'chapter' as const,
        title: 'Roles and Tool Contracts',
      },
      {
        id: 'interactive-harness-agents',
        kind: 'chapter' as const,
        title: 'Interactive Harness Agents',
      },
      {
        id: 'structured-control-plane-agents',
        kind: 'chapter' as const,
        title: 'Structured Control-Plane Agents',
      },
    ],
  },
  {
    label: 'Directing Agent Work',
    chapters: [
      { id: 'prompting-101', kind: 'chapter' as const, title: 'Prompting 101' },
      {
        id: 'prompt-contracts',
        kind: 'chapter' as const,
        title: 'Prompt Contracts',
      },
      {
        id: 'prompting-by-example',
        kind: 'chapter' as const,
        title: 'Prompting by Example',
      },
      {
        id: 'steering-retrieval-and-multistep-work',
        kind: 'chapter' as const,
        title: 'Steering Retrieval and Multistep Work',
      },
      {
        id: 'grounded-safe-instructions',
        kind: 'chapter' as const,
        title: 'Grounded, Safe Instructions',
      },
      {
        id: 'prompting-executable-validation',
        kind: 'chapter' as const,
        title: 'Executable Validation',
      },
      {
        id: 'high-level-methodology',
        kind: 'chapter' as const,
        title: 'Four-Phase Workflow',
      },
      {
        id: 'workflow-grounding',
        kind: 'chapter' as const,
        title: 'Grounding',
      },
      { id: 'workflow-planning', kind: 'chapter' as const, title: 'Planning' },
      {
        id: 'workflow-execution',
        kind: 'chapter' as const,
        title: 'Execution',
      },
      {
        id: 'workflow-validation-feedback',
        kind: 'chapter' as const,
        title: 'Validation & Feedback',
      },
    ],
  },
  {
    label: 'Reliable Agent Systems',
    chapters: [
      {
        id: 'context-engineering',
        kind: 'chapter' as const,
        title: 'Context Engineering',
      },
      { id: 'context-files', kind: 'chapter' as const, title: 'Context Files' },
      {
        id: 'mcp-tool-schema-budgets',
        kind: 'chapter' as const,
        title: 'MCP Tool Schemas and Budgets',
      },
      {
        id: 'skills-and-procedures',
        kind: 'chapter' as const,
        title: 'Skills and Procedures',
      },
      {
        id: 'sub-agent-delegation',
        kind: 'chapter' as const,
        title: 'Sub-Agent Delegation',
      },
      {
        id: 'context-compaction',
        kind: 'chapter' as const,
        title: 'Context Compaction',
      },
      {
        id: 'retrieval-context-injection',
        kind: 'chapter' as const,
        title: 'Retrieval and Context Injection',
      },
      {
        id: 'reliability-levers',
        kind: 'chapter' as const,
        title: 'Reliability Levers',
      },
      {
        id: 'reliability-context-quality',
        kind: 'chapter' as const,
        title: 'Reliability: Context Quality',
      },
      {
        id: 'reliability-orchestration',
        kind: 'chapter' as const,
        title: 'Reliability: Orchestration',
      },
      {
        id: 'reliability-independent-retries',
        kind: 'chapter' as const,
        title: 'Reliability: Independent Retries',
      },
      {
        id: 'reliability-hitl-checkpoints',
        kind: 'chapter' as const,
        title: 'Reliability: HITL Checkpoints',
      },
      {
        id: 'selecting-reliability-controls',
        kind: 'chapter' as const,
        title: 'Selecting Reliability Controls',
      },
    ],
  },
  {
    label: 'Shipping Agent Work',
    chapters: [
      {
        id: 'spec-driven-development',
        kind: 'chapter' as const,
        title: 'Spec-Driven Development',
      },
      {
        id: 'spec-review-cost',
        kind: 'chapter' as const,
        title: 'Spec Review Cost',
      },
      {
        id: 'spec-drafting-approval',
        kind: 'chapter' as const,
        title: 'Spec Drafting and Approval',
      },
      {
        id: 'spec-execution',
        kind: 'chapter' as const,
        title: 'Spec Execution',
      },
      {
        id: 'spec-lifecycle',
        kind: 'chapter' as const,
        title: 'Spec Lifecycle',
      },
      { id: 'validation', kind: 'chapter' as const, title: 'Validation' },
      {
        id: 'validation-evidence-portfolios',
        kind: 'chapter' as const,
        title: 'Validation Evidence Portfolios',
      },
      { id: 'llm-judges', kind: 'chapter' as const, title: 'LLM Judges' },
      {
        id: 'human-acceptance-discovery',
        kind: 'chapter' as const,
        title: 'Human Acceptance and Discovery',
      },
      {
        id: 'continuous-validation',
        kind: 'chapter' as const,
        title: 'Continuous Validation',
      },
      {
        id: 'agent-friendly-code',
        kind: 'chapter' as const,
        title: 'Writing Agent-Friendly Code',
      },
      {
        id: 'agent-code-constraints',
        kind: 'chapter' as const,
        title: 'Agent Code Constraints',
      },
      {
        id: 'agent-code-guardrails',
        kind: 'chapter' as const,
        title: 'Agent Code Guardrails',
      },
      {
        id: 'agent-knowledge-cache',
        kind: 'chapter' as const,
        title: 'Knowledge Cache',
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
