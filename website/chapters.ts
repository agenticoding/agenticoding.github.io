/**
 * Single source of truth for chapter identity and ordering.
 *
 * Array position = section number (0-indexed).
 * To add/remove/reorder chapters: edit this array only.
 * All numbering, sidebar ordering, and cross-reference resolution derives from here.
 */
export const chapters = [
  { id: 'intro',                    kind: 'frontmatter' as const },
  { id: 'how-llms-work',            kind: 'chapter' as const },
  { id: 'how-agents-work',          kind: 'chapter' as const },
  { id: 'prompting-101',            kind: 'chapter' as const },
  { id: 'high-level-methodology',   kind: 'chapter' as const },
  { id: 'context-engineering',      kind: 'chapter' as const },
  { id: 'reliability-levers',       kind: 'chapter' as const },
  { id: 'spec-driven-development',  kind: 'chapter' as const },
  { id: 'validation',      kind: 'chapter' as const },
  { id: 'agent-friendly-code',      kind: 'chapter' as const },
  { id: 'about',                    kind: 'reference' as const },
] as const;

export type ChapterKind = (typeof chapters)[number]['kind'];
export type ChapterId = (typeof chapters)[number]['id'];
export type Chapter = { id: ChapterId; kind: ChapterKind };

/** Ordered doc IDs for sidebar configuration. */
export const ORDERED_IDS = chapters.map((c) => c.id) as readonly string[];

/** Lookup chapter by ID. Returns undefined if not found. */
export function getChapterById(id: string): (Chapter & { sectionNumber: number }) | undefined {
  const index = chapters.findIndex((c) => c.id === id);
  if (index === -1) return undefined;
  return { ...chapters[index], sectionNumber: index };
}

/** Lookup chapter by section number. Returns undefined if out of bounds. */
export function getChapterByNumber(n: number): Chapter | undefined {
  return chapters[n];
}
