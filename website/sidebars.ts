import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

type ChapterKind = 'frontmatter' | 'chapter' | 'reference';

function chapter(id: string, sectionNumber: number, chapterKind: ChapterKind = 'chapter') {
  return {
    type: 'doc' as const,
    id,
    customProps: { sectionNumber, chapterKind },
  };
}

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    chapter('intro', 0, 'frontmatter'),
    chapter('chapter-1-how-llms-work', 1),
    chapter('chapter-2-how-agents-work', 2),
    chapter('chapter-3-prompting-101', 3),
    chapter('chapter-4-high-level-methodology', 4),
    chapter('chapter-5-grounding', 5),
    chapter('chapter-6-context-management', 6),
    chapter('chapter-7-reliability-levers', 7),
    chapter('chapter-8-spec-driven-development', 8),
    chapter('chapter-9-tests-as-guardrails', 9),
    chapter('chapter-10-reviewing-code', 10),
    chapter('chapter-11-debugging', 11),
    chapter('chapter-12-agent-friendly-code', 12),
    chapter('chapter-13-systems-thinking-specs', 13),
    chapter('about', 14, 'reference'),
  ],
};

export default sidebars;
