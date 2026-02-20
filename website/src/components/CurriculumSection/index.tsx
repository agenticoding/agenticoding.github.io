import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import sidebars from '../../../sidebars';
import styles from './index.module.css';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function countLessons(): number {
  let count = 0;
  const traverse = (items: unknown[]) => {
    for (const item of items) {
      if (typeof item === 'string' && item.includes('lesson-')) {
        count++;
      } else if (item && typeof item === 'object' && 'items' in item) {
        traverse((item as { items: unknown[] }).items);
      }
    }
  };
  traverse(sidebars.tutorialSidebar as unknown[]);
  return count;
}

const LESSON_COUNT = countLessons();

// ---------------------------------------------------------------------------
// Module card
// ---------------------------------------------------------------------------

interface ModuleCardProps {
  number: number;
  title: string;
  lessonCount: number;
  topics: string[];
  link: string;
  hue: 'indigo' | 'violet' | 'magenta' | 'rose';
}

function ModuleCard({
  number,
  title,
  lessonCount,
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
      <span className={styles.moduleMeta}>{lessonCount} lessons</span>
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
      lessonCount: 2,
      hue: 'indigo',
      topics: ['LLM internals', 'How agents work'],
      link: '/fundamentals/lesson-1-how-llms-work',
    },
    {
      number: 2,
      title: 'Methodology',
      lessonCount: 3,
      hue: 'violet',
      topics: ['Prompt structure', 'Grounding', 'Iteration patterns'],
      link: '/methodology/lesson-3-high-level-methodology',
    },
    {
      number: 3,
      title: 'Practical Techniques',
      lessonCount: 8,
      hue: 'magenta',
      topics: ['CI integration', 'Test generation', 'Spec-driven development'],
      link: '/practical-techniques/lesson-6-project-onboarding',
    },
    {
      number: 4,
      title: 'Experience Engineering',
      lessonCount: 4,
      hue: 'rose',
      topics: ['Design tokens', 'UI specs', 'Accessibility'],
      link: '/experience-engineering/lesson-14-design-tokens',
    },
  ];

  return (
    <section className={styles.curriculum}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          What You&apos;ll Learn
        </Heading>
        <p className={styles.sectionSubtitle}>
          {LESSON_COUNT} lessons &middot; Docs &middot; Podcasts &middot; Slides
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
