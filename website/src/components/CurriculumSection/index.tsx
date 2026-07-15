import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import { getChapterById, type ChapterId } from '../../../chapters';
import styles from './index.module.css';

type Accent = 'indigo' | 'violet' | 'success';

interface BookPart {
  number: number;
  title: string;
  chapterIds: readonly ChapterId[];
  topics: readonly string[];
  accent: Accent;
}

const BOOK_PARTS: readonly BookPart[] = [
  {
    number: 1,
    title: 'Understand the machine',
    chapterIds: ['how-llms-work', 'how-agents-work', 'prompting-101'],
    topics: [
      'Model mechanics and failure modes',
      'Agent harnesses and autonomy',
      'Prompts as execution contracts',
    ],
    accent: 'indigo',
  },
  {
    number: 2,
    title: 'Operate the work',
    chapterIds: [
      'high-level-methodology',
      'context-engineering',
      'reliability-levers',
      'spec-driven-development',
    ],
    topics: [
      'Phase-based orchestration',
      'Context selection and compression',
      'Reliability and executable specs',
    ],
    accent: 'violet',
  },
  {
    number: 3,
    title: 'Verify and evolve the system',
    chapterIds: [
      'validation',
      'agent-friendly-code',
    ],
    topics: [
      'Independent validation',
      'Agent-friendly code',
    ],
    accent: 'success',
  },
];

const CHAPTER_COUNT = BOOK_PARTS.reduce(
  (total, part) => total + part.chapterIds.length,
  0
);

function getFirstChapter(part: BookPart) {
  const chapterId = part.chapterIds[0];
  const chapter = getChapterById(chapterId);
  if (!chapter) throw new Error(`Unknown curriculum chapter: ${chapterId}`);
  return chapter;
}

function TopicList({ topics }: Pick<BookPart, 'topics'>) {
  return (
    <ul className={styles.partTopics}>
      {topics.map((topic) => (
        <li key={topic}>{topic}</li>
      ))}
    </ul>
  );
}

function PartCard(part: BookPart) {
  const { number, title, chapterIds, topics, accent } = part;
  const chapter = getFirstChapter(part);
  const className = `${styles.partCard} ${styles[`accent-${accent}`]}`;
  return (
    <Link to={`/${chapter.id}`} className={className}>
      <span className={styles.partLabel}>Part {number}</span>
      <Heading as="h3" className={styles.partTitle}>
        {title}
      </Heading>
      <span className={styles.partMeta}>
        {chapterIds.length} chapters · starts at Chapter {chapter.sectionNumber}
      </span>
      <TopicList topics={topics} />
    </Link>
  );
}

function CurriculumHeader() {
  return (
    <>
      <Heading id="learning-path" as="h2" className={styles.sectionTitle}>
        A {CHAPTER_COUNT}-chapter learning path
      </Heading>
      <p className={styles.sectionSubtitle}>
        {CHAPTER_COUNT} chapters in three parts, from model mechanics to
        production systems.
      </p>
    </>
  );
}

export default function CurriculumSection() {
  return (
    <section className={styles.curriculum} aria-labelledby="learning-path">
      <CurriculumHeader />
      <div className={styles.partGrid}>
        {BOOK_PARTS.map((part) => (
          <PartCard key={part.number} {...part} />
        ))}
      </div>
    </section>
  );
}
