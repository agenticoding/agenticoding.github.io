import { type ReactNode, useState, useEffect } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import sidebars from '../../sidebars';
import promptsSidebars from '../../sidebarsPrompts';

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

function countPrompts(): number {
  let count = 0;
  const traverse = (items: unknown[]) => {
    for (const item of items) {
      if (typeof item === 'string') {
        count++;
      } else if (item && typeof item === 'object' && 'type' in item) {
        const obj = item as { type: string; items?: unknown[] };
        if (obj.type === 'category' && obj.items) {
          count += obj.items.length;
        }
      }
    }
  };
  const sidebar = promptsSidebars.promptsSidebar as unknown[];
  traverse(sidebar.slice(1));
  return count;
}

const LESSON_COUNT = countLessons();
const PROMPT_COUNT = countPrompts();

function formatStarCount(count: number): string {
  if (count < 1000) return count.toString();
  const formatted = (count / 1000).toFixed(1);
  return formatted.replace(/\.0$/, '') + 'k';
}

function useGitHubStars(repo: string): number | null {
  const [stars, setStars] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(`gh-stars-${repo}`);
    if (cached) {
      const { stars, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 3600000) return stars;
    }
    return null;
  });

  useEffect(() => {
    if (stars !== null) return;
    fetch(`https://api.github.com/repos/${repo}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
          localStorage.setItem(
            `gh-stars-${repo}`,
            JSON.stringify({
              stars: data.stargazers_count,
              timestamp: Date.now(),
            })
          );
        }
      })
      .catch(() => {});
  }, [repo, stars]);

  return stars;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function GitHubIcon() {
  return (
    <svg
      className={styles.githubIcon}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      className={styles.starIcon}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Parametric shapes
// ---------------------------------------------------------------------------

/** Compute a closed superellipse SVG path via Lamé's formula. */
function superellipsePath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n: number,
  segments = 64
): string {
  const pts: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * 2 * Math.PI;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = cx + rx * Math.sign(c) * Math.abs(c) ** (2 / n);
    const y = cy + ry * Math.sign(s) * Math.abs(s) ** (2 / n);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ') + 'Z';
}

/**
 * Cascading squircle "cards" — Smooth Circuit family (n=3.5).
 * Three overlapping squircle outlines fan rightward, front card has
 * abstract text lines inside. Magenta accent on the front shape.
 */
function PromptIllustration() {
  const n = 3.5;
  const rx = 34,
    ry = 24;
  return (
    <svg
      viewBox="0 0 160 80"
      role="img"
      aria-label="Stacked prompt cards"
      className={styles.resourceIllustration}
    >
      <path
        d={superellipsePath(68, 44, rx, ry, n)}
        fill="var(--surface-raised)"
        stroke="var(--border-subtle)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={superellipsePath(78, 42, rx, ry, n)}
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={superellipsePath(88, 40, rx, ry, n)}
        fill="var(--surface-raised)"
        stroke="var(--visual-magenta)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Abstract text lines inside front card */}
      <line
        x1="72"
        y1="34"
        x2="104"
        y2="34"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="72"
        y1="40"
        x2="108"
        y2="40"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="72"
        y1="46"
        x2="96"
        y2="46"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Terminal window — Terminal Geometry family.
 * Sharp-cornered frame with title-bar dots, chevron prompt,
 * cursor line, and abstract output. Cyan accent on frame stroke.
 */
function ToolboxIllustration() {
  return (
    <svg
      viewBox="0 0 160 80"
      role="img"
      aria-label="Terminal toolbox"
      className={styles.resourceIllustration}
    >
      <rect
        x="32"
        y="10"
        width="96"
        height="60"
        rx="2"
        fill="var(--surface-raised)"
        stroke="var(--visual-cyan)"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <line
        x1="33"
        y1="24"
        x2="127"
        y2="24"
        stroke="var(--border-default)"
        strokeWidth="1"
      />
      <circle cx="42" cy="17" r="2" fill="var(--border-default)" />
      <circle cx="50" cy="17" r="2" fill="var(--border-default)" />
      <circle cx="58" cy="17" r="2" fill="var(--border-default)" />
      {/* Chevron prompt */}
      <polyline
        points="44,36 52,42 44,48"
        fill="none"
        stroke="var(--visual-cyan)"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <line
        x1="56"
        y1="48"
        x2="68"
        y2="48"
        stroke="var(--text-muted)"
        strokeWidth="2"
        strokeLinecap="square"
      />
      {/* Abstract output */}
      <line
        x1="44"
        y1="56"
        x2="80"
        y2="56"
        stroke="var(--border-default)"
        strokeWidth="1"
        strokeLinecap="square"
      />
      <line
        x1="44"
        y1="62"
        x2="72"
        y2="62"
        stroke="var(--border-subtle)"
        strokeWidth="1"
        strokeLinecap="square"
      />
    </svg>
  );
}

/**
 * Code research — Smooth Circuit family.
 * Layered code blocks with match highlights, dashed connectors
 * leading to a magnifying glass. Indigo accent.
 */
function ChunkHoundIllustration() {
  const n = 3.5;
  return (
    <svg
      viewBox="0 0 160 80"
      role="img"
      aria-label="Code search with match highlighting"
      className={styles.resourceIllustration}
    >
      <path
        d={superellipsePath(48, 42, 28, 22, n)}
        fill="var(--surface-raised)"
        stroke="var(--border-subtle)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={superellipsePath(56, 40, 28, 22, n)}
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Abstract text lines */}
      <line
        x1="38"
        y1="33"
        x2="70"
        y2="33"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="38"
        y1="40"
        x2="74"
        y2="40"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="38"
        y1="47"
        x2="62"
        y2="47"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Match highlights */}
      <circle
        cx="72"
        cy="33"
        r="3"
        fill="var(--visual-bg-indigo)"
        stroke="var(--visual-indigo)"
        strokeWidth="1.5"
      />
      <circle
        cx="64"
        cy="47"
        r="3"
        fill="var(--visual-bg-indigo)"
        stroke="var(--visual-indigo)"
        strokeWidth="1.5"
      />
      {/* Dashed connectors to magnifying glass */}
      <path
        d="M75,33 C90,33 100,34 108,36"
        fill="none"
        stroke="var(--visual-indigo)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
      <path
        d="M67,47 C85,47 100,44 108,40"
        fill="none"
        stroke="var(--visual-indigo)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
      {/* Magnifying glass */}
      <circle
        cx="124"
        cy="36"
        r="16"
        fill="var(--visual-bg-indigo)"
        stroke="var(--visual-indigo)"
        strokeWidth="2"
      />
      <line
        x1="136"
        y1="48"
        x2="146"
        y2="58"
        stroke="var(--visual-indigo)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Abstract text inside lens */}
      <line
        x1="116"
        y1="33"
        x2="132"
        y2="33"
        stroke="var(--visual-indigo)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <line
        x1="116"
        y1="39"
        x2="128"
        y2="39"
        stroke="var(--visual-indigo)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

/**
 * Converging research — Smooth Circuit family.
 * Scattered source nodes with Bezier curves converging to a
 * synthesis circle, then output arrow. Success accent.
 */
function ArguSeekIllustration() {
  return (
    <svg
      viewBox="0 0 160 80"
      role="img"
      aria-label="Research from multiple sources converging to synthesis"
      className={styles.resourceIllustration}
    >
      {/* Search wave arcs */}
      <path
        d="M72,20 A30,30 0 0,1 72,60"
        fill="none"
        stroke="var(--border-subtle)"
        strokeWidth="1"
      />
      <path
        d="M66,16 A36,36 0 0,1 66,64"
        fill="none"
        stroke="var(--border-subtle)"
        strokeWidth="1"
      />
      {/* Source node circles */}
      <circle
        cx="20"
        cy="20"
        r="6"
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
        strokeWidth="1.5"
      />
      <circle
        cx="16"
        cy="48"
        r="6"
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
        strokeWidth="1.5"
      />
      <circle
        cx="32"
        cy="66"
        r="6"
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
        strokeWidth="1.5"
      />
      <circle
        cx="40"
        cy="14"
        r="6"
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
        strokeWidth="1.5"
      />
      <circle
        cx="28"
        cy="38"
        r="6"
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
        strokeWidth="1.5"
      />
      {/* Bezier curves to synthesis */}
      <path
        d="M26,20 C50,22 65,30 77,36"
        fill="none"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M22,48 C45,46 65,42 76,40"
        fill="none"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M38,66 C55,60 70,50 77,44"
        fill="none"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M46,14 C58,18 70,28 77,36"
        fill="none"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M34,38 C50,38 65,38 76,40"
        fill="none"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Central synthesis circle */}
      <circle
        cx="90"
        cy="40"
        r="14"
        fill="var(--visual-bg-success)"
        stroke="var(--visual-success)"
        strokeWidth="2"
      />
      {/* Abstract text inside synthesis */}
      <line
        x1="82"
        y1="37"
        x2="98"
        y2="37"
        stroke="var(--visual-success)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <line
        x1="82"
        y1="43"
        x2="94"
        y2="43"
        stroke="var(--visual-success)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Output arrow */}
      <line
        x1="104"
        y1="40"
        x2="142"
        y2="40"
        stroke="var(--visual-success)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <polygon points="142,40 136,36 136,44" fill="var(--visual-success)" />
      {/* Result lines */}
      <line
        x1="148"
        y1="36"
        x2="156"
        y2="36"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="148"
        y1="40"
        x2="156"
        y2="40"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="148"
        y1="44"
        x2="156"
        y2="44"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Section 1: Hero
// ---------------------------------------------------------------------------

function Hero() {
  const courseStars = useGitHubStars('agenticoding/agenticoding.github.io');
  const chunkHoundStars = useGitHubStars('chunkhound/chunkhound');
  const arguSeekStars = useGitHubStars('ArguSeek/arguseek');

  const testimonials = [
    '"I just finished studying this. Very useful and well organized"',
    '"No CTO/startup-dev/tech-advisor chat has taken place in the past month without mentioning it"',
    '"Thank you for not making another video course series"',
    '"I was looking for something like a course or some sort of guidelines"',
    '"Great work, this is amazing"',
  ];
  const [testimonialIndex] = useState(() =>
    Math.floor(Math.random() * testimonials.length)
  );

  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroInner}>
          <Heading as="h1" className={styles.heroTitle}>
            Master Agentic Coding
          </Heading>
          <p className={styles.heroSubtitle}>
            Structured methodology proven on enterprise mono-repos with millions
            of lines of code
          </p>
          <div className={styles.heroCtas}>
            <Link className={styles.buttonPrimary} to="/docs">
              Start Learning
            </Link>
          </div>

          <hr className={styles.heroDivider} />

          <div className={styles.heroProof}>
            <a
              href="https://github.com/agenticoding/agenticoding.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.repoBadge}
            >
              <GitHubIcon />
              <span>Open Source</span>
              <span className={styles.badgeSep}>&middot;</span>
              <span>MIT</span>
              {courseStars !== null && (
                <>
                  <span className={styles.badgeSep}>&middot;</span>
                  <StarIcon />
                  <span>{formatStarCount(courseStars)}</span>
                </>
              )}
            </a>

            <div className={styles.testimonial}>
              <span className={styles.testimonialText}>
                {testimonials[testimonialIndex]}
              </span>
              <span className={styles.testimonialSource}>&mdash; Reddit</span>
            </div>

            <div className={styles.repoLinks}>
              {chunkHoundStars !== null && (
                <a
                  href="https://github.com/chunkhound/chunkhound"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.repoLink}
                >
                  ChunkHound <StarIcon /> {formatStarCount(chunkHoundStars)}
                </a>
              )}
              {chunkHoundStars !== null && arguSeekStars !== null && (
                <span className={styles.badgeSep}>&middot;</span>
              )}
              {arguSeekStars !== null && (
                <a
                  href="https://github.com/ArguSeek/arguseek"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.repoLink}
                >
                  ArguSeek <StarIcon /> {formatStarCount(arguSeekStars)}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Curriculum
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

function Curriculum() {
  const modules: ModuleCardProps[] = [
    {
      number: 1,
      title: 'Fundamentals',
      lessonCount: 2,
      hue: 'indigo',
      topics: ['LLM internals', 'How agents work'],
      link: '/docs/fundamentals/lesson-1-how-llms-work',
    },
    {
      number: 2,
      title: 'Methodology',
      lessonCount: 3,
      hue: 'violet',
      topics: ['Prompt structure', 'Grounding', 'Iteration patterns'],
      link: '/docs/methodology/lesson-3-high-level-methodology',
    },
    {
      number: 3,
      title: 'Practical Techniques',
      lessonCount: 8,
      hue: 'magenta',
      topics: ['CI integration', 'Test generation', 'Spec-driven development'],
      link: '/docs/practical-techniques/lesson-6-project-onboarding',
    },
    {
      number: 4,
      title: 'Experience Engineering',
      lessonCount: 4,
      hue: 'rose',
      topics: ['Design tokens', 'UI specs', 'Accessibility'],
      link: '/docs/experience-engineering/lesson-14-design-tokens',
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

// ---------------------------------------------------------------------------
// Section 3: Resources
// ---------------------------------------------------------------------------

function Resources() {
  return (
    <section className={styles.resources}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Resources
        </Heading>
        <p className={styles.sectionSubtitle}>
          {PROMPT_COUNT} prompts + tools + open source projects
        </p>
        <div className={styles.resourceGrid}>
          <Link
            to="/prompts"
            className={clsx(styles.resourceCard, styles['resource-magenta'])}
          >
            <PromptIllustration />
            <Heading as="h3" className={styles.resourceTitle}>
              Prompt Library
            </Heading>
            <p className={styles.resourceDesc}>
              Production-ready prompts for testing, debugging, code review, and
              specifications
            </p>
            <div className={styles.resourceFooter}>
              <span className={styles.resourceCount}>
                {PROMPT_COUNT} prompts
              </span>
              <span className={styles.ghostLink}>Browse Prompts &rarr;</span>
            </div>
          </Link>

          <Link
            to="/developer-tools/cli-coding-agents"
            className={clsx(styles.resourceCard, styles['resource-cyan'])}
          >
            <ToolboxIllustration />
            <Heading as="h3" className={styles.resourceTitle}>
              Developer Toolbox
            </Heading>
            <p className={styles.resourceDesc}>
              Curated CLI tools, coding agents, terminals, and MCP servers for
              AI-first development
            </p>
            <div className={styles.resourceFooter}>
              <span className={styles.resourceCount}>4 guides</span>
              <span className={styles.ghostLink}>Explore Tools &rarr;</span>
            </div>
          </Link>

          <a
            href="https://chunkhound.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(styles.resourceCard, styles['resource-indigo'])}
          >
            <ChunkHoundIllustration />
            <Heading as="h3" className={styles.resourceTitle}>
              ChunkHound
            </Heading>
            <p className={styles.resourceDesc}>
              Semantic code research for large codebases. Don&apos;t search your
              code&nbsp;&mdash; research it.
            </p>
            <div className={styles.resourceFooter}>
              <span className={styles.resourceCount}>10K&ndash;1M+ LOC</span>
              <span className={styles.ghostLink}>Visit Site &#8599;</span>
            </div>
          </a>

          <a
            href="https://github.com/ArguSeek/arguseek"
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(styles.resourceCard, styles['resource-success'])}
          >
            <ArguSeekIllustration />
            <Heading as="h3" className={styles.resourceTitle}>
              ArguSeek
            </Heading>
            <p className={styles.resourceDesc}>
              Wide iterative research using search and LLM synthesis. Multiple
              sources per query.
            </p>
            <div className={styles.resourceFooter}>
              <span className={styles.resourceCount}>
                12&ndash;100+ sources
              </span>
              <span className={styles.ghostLink}>View Project &#8599;</span>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Closing CTA
// ---------------------------------------------------------------------------

function ClosingCta() {
  return (
    <section className={styles.closingCta}>
      <div className="container">
        <p className={styles.closingText}>
          {LESSON_COUNT} lessons. {PROMPT_COUNT} prompts. Free and open source.
        </p>
        <Link className={styles.buttonPrimary} to="/docs">
          Start Learning
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home(): ReactNode {
  return (
    <Layout
      title="Master Agentic Coding"
      description="Master agentic coding with a structured methodology proven on enterprise mono-repos. Free, MIT licensed, with podcasts, slides, and production-ready prompts."
    >
      <Hero />
      <main>
        <Curriculum />
        <Resources />
        <ClosingCta />
      </main>
    </Layout>
  );
}
