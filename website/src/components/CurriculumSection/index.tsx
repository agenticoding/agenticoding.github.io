import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import sidebars from '../../../sidebars';
import styles from './index.module.css';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function countChapters(): number {
  let count = 0;
  const traverse = (items: unknown[]) => {
    for (const item of items) {
      if (typeof item === 'string' && item.includes('chapter-')) {
        count++;
      } else if (item && typeof item === 'object' && 'items' in item) {
        traverse((item as { items: unknown[] }).items);
      }
    }
  };
  traverse(sidebars.tutorialSidebar as unknown[]);
  return count;
}

const CHAPTER_COUNT = countChapters();

// ---------------------------------------------------------------------------
// Module card
// ---------------------------------------------------------------------------

interface ModuleCardProps {
  number: number;
  title: string;
  chapterCount: number;
  topics: string[];
  link: string;
  hue: 'indigo' | 'violet' | 'magenta' | 'rose';
}

function ModuleCard({
  number,
  title,
  chapterCount,
  topics,
  link,
  hue,
}: ModuleCardProps) {
  return (
    <Link
      to={link}
      className={clsx(styles.moduleCard, styles[`module-${hue}`])}
    >
      <span className={styles.moduleLabel}>Module {number}</span>
      <Heading as="h3" className={styles.moduleTitle}>
        {title}
      </Heading>
      <span className={styles.moduleMeta}>{chapterCount} chapters</span>
      <div className={styles.moduleTopics}>
        {topics.map((t, i) => (
          <span key={i} className={styles.moduleTopic}>
            &rarr; {t}
          </span>
        ))}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export default function CurriculumSection() {
  const modules: ModuleCardProps[] = [
    {
      number: 1,
      title: 'Fundamentals',
      chapterCount: 2,
      hue: 'indigo',
      topics: ['LLM internals', 'How agents work'],
      link: '/chapter-1-how-llms-work',
    },
    {
      number: 2,
      title: 'Methodology',
      chapterCount: 3,
      hue: 'violet',
      topics: ['Prompt structure', 'Workflow', 'Grounding'],
      link: '/chapter-3-prompting-101',
    },
    {
      number: 3,
      title: 'Practical Techniques',
      chapterCount: 8,
      hue: 'magenta',
      topics: ['CI integration', 'Test generation', 'Spec-driven development'],
      link: '/chapter-6-context-management',
    },
  ];

  return (
    <section className={styles.curriculum}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          What You&apos;ll Learn
        </Heading>
        <p className={styles.sectionSubtitle}>
          {CHAPTER_COUNT} chapters &middot; Docs
        </p>
        <div className={styles.moduleGrid}>
          {modules.map((m) => (
            <ModuleCard key={m.number} {...m} />
          ))}
        </div>
      </div>
    </section>
  );
}
