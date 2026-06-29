import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

type ChapterKind = 'frontmatter' | 'lesson' | 'reference';

function chapter(id: string, sectionNumber: number, chapterKind: ChapterKind = 'lesson') {
  return {
    type: 'doc' as const,
    id,
    customProps: { sectionNumber, chapterKind },
  };
}

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    chapter('intro', 0, 'frontmatter'),
    chapter('fundamentals/lesson-1-how-llms-work', 1),
    chapter('fundamentals/lesson-2-how-agents-work', 2),
    chapter('methodology/lesson-3-prompting-101', 3),
    chapter('methodology/lesson-4-high-level-methodology', 4),
    chapter('methodology/lesson-5-grounding', 5),
    chapter('practical-techniques/lesson-6-context-management', 6),
    chapter('practical-techniques/lesson-7-reliability-levers', 7),
    chapter('practical-techniques/lesson-8-spec-driven-development', 8),
    chapter('practical-techniques/lesson-9-tests-as-guardrails', 9),
    chapter('practical-techniques/lesson-10-reviewing-code', 10),
    chapter('practical-techniques/lesson-11-debugging', 11),
    chapter('practical-techniques/lesson-12-agent-friendly-code', 12),
    chapter('practical-techniques/lesson-13-systems-thinking-specs', 13),
    chapter('experience-engineering/lesson-14-design-tokens', 14),
    chapter('experience-engineering/lesson-15-ui-specs', 15),
    chapter('experience-engineering/lesson-16-accessibility-i18n', 16),
    chapter('experience-engineering/lesson-17-verification', 17),
    chapter('faq', 18, 'reference'),
    chapter('about', 19, 'reference'),
  ],
};

export default sidebars;
