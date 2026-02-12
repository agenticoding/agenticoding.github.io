import { type ReactNode, useState, useEffect } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import sidebars from '../../sidebars';
import promptsSidebars from '../../sidebarsPrompts';

import styles from './index.module.css';

// Count lessons from sidebar config (filter for lesson-* items)
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

// Count prompts from sidebar config (exclude index)
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
  // Skip first item (index/overview)
  traverse(sidebar.slice(1));
  return count;
}

const LESSON_COUNT = countLessons();
const PROMPT_COUNT = countPrompts();

// Terminal window for developer aesthetic
function TerminalWindow() {
  return (
    <div className={styles.terminal}>
      <div className={styles.terminalHeader}>
        <span className={styles.terminalDot} data-color="red" />
        <span className={styles.terminalDot} data-color="yellow" />
        <span className={styles.terminalDot} data-color="green" />
        <span className={styles.terminalTitle}>methodology.md</span>
      </div>
      <div className={styles.terminalBody}>
        <pre className={styles.terminalCode}>
          <span className={styles.terminalKeyword}>INVESTIGATE</span>
          {': Trace the code path\n'}
          <span className={styles.terminalKeyword}>ANALYZE</span>
          {': Compare expected vs actual\n'}
          <span className={styles.terminalKeyword}>EXPLAIN</span>
          {': File paths, line numbers, root cause'}
        </pre>
        <Link to="/prompts" className={styles.terminalLink}>
          From the Prompt Library →
        </Link>
      </div>
    </div>
  );
}

function HomepageHeader() {
  const stars = useGitHubStars('agenticoding/agenticoding.github.io');

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <a
              href="https://github.com/agenticoding/agenticoding.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroBadge}
            >
              <GitHubIcon />
              <span>Open Source</span>
              <span className={styles.badgeSeparator}>·</span>
              <span>MIT</span>
              {stars !== null && (
                <>
                  <span className={styles.badgeSeparator}>·</span>
                  <StarIcon />
                  <span>{stars}</span>
                </>
              )}
            </a>
            <Heading as="h1" className="hero__title">
              Master Agentic Coding
            </Heading>
            <p className="hero__subtitle">
              Structured methodology proven on enterprise mono-repos with
              millions of lines of code
            </p>
            <div className={styles.buttons}>
              <Link className="button button--secondary button--lg" to="/docs">
                Start Learning
              </Link>
              <Link
                className={clsx('button button--lg', styles.buttonOutline)}
                to="/prompts"
              >
                Browse Prompts
              </Link>
            </div>
            <div className={styles.heroStats}>
              <Link
                to="/docs/faq"
                className={styles.heroStatLink}
              >
                FAQ
              </Link>
              <span className={styles.statsSeparator}>|</span>
              <Link to="/docs" className={styles.heroStatLink}>
                {LESSON_COUNT} Lessons
              </Link>
              <span className={styles.statsSeparator}>|</span>
              <Link to="/prompts" className={styles.heroStatLink}>
                {PROMPT_COUNT} Production Prompts
              </Link>
            </div>
          </div>
          <TerminalWindow />
        </div>
      </div>
    </header>
  );
}

// GitHub icon (official Invertocat mark)
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

function HeadphonesIcon() {
  return (
    <svg
      className={styles.formatIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function PresentationIcon() {
  return (
    <svg
      className={styles.formatIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      className={styles.formatIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ToolboxIcon() {
  return (
    <svg
      className={styles.pillarIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <line x1="2" y1="11" x2="22" y2="11" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      className={styles.externalIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// Star icon for GitHub stars
function StarIcon() {
  return (
    <svg className={styles.starIcon} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" />
    </svg>
  );
}

function formatStarCount(count: number): string {
  if (count < 1000) return count.toString();
  const formatted = (count / 1000).toFixed(1);
  return formatted.replace(/\.0$/, '') + 'k';
}

// Hook to fetch GitHub stars with caching
function useGitHubStars(repo: string): number | null {
  const [stars, setStars] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(`gh-stars-${repo}`);
    if (cached) {
      const { stars, timestamp } = JSON.parse(cached);
      // Cache valid for 1 hour
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
      .catch(() => {
        // Silently fail, stars will show as null
      });
  }, [repo, stars]);

  return stars;
}

// Social Proof Bar with GitHub stars and testimonial
function SocialProofBar() {
  const courseStars = useGitHubStars('agenticoding/agenticoding.github.io');
  const chunkHoundStars = useGitHubStars('chunkhound/chunkhound');
  const arguSeekStars = useGitHubStars('ArguSeek/arguseek');

  const hasStars =
    courseStars !== null || chunkHoundStars !== null || arguSeekStars !== null;

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
    <section className={styles.socialProofBar}>
      <div className="container">
        <div className={styles.socialProofContent}>
          {hasStars && (
            <div className={styles.starsRow}>
              <a
                href="https://github.com/agenticoding/agenticoding.github.io"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.repoLink}
              >
                <GitHubIcon /> Agentic Coding
                {courseStars !== null && (
                  <>
                    {' '}
                    <StarIcon /> {formatStarCount(courseStars)}
                  </>
                )}
              </a>
              <span className={styles.starsSeparator}>·</span>
              <a
                href="https://github.com/chunkhound/chunkhound"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.repoLink}
              >
                <GitHubIcon /> ChunkHound
                {chunkHoundStars !== null && (
                  <>
                    {' '}
                    <StarIcon /> {formatStarCount(chunkHoundStars)}
                  </>
                )}
              </a>
              <span className={styles.starsSeparator}>·</span>
              <a
                href="https://github.com/ArguSeek/arguseek"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.repoLink}
              >
                <GitHubIcon /> ArguSeek
                {arguSeekStars !== null && (
                  <>
                    {' '}
                    <StarIcon /> {formatStarCount(arguSeekStars)}
                  </>
                )}
              </a>
            </div>
          )}
          <div className={styles.testimonial}>
            <span className={styles.testimonialText}>
              {testimonials[testimonialIndex]}
            </span>
            <span className={styles.testimonialSource}>— Reddit</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ChunkHound wordmark with theme support
function ChunkHoundWordmark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hound logo */}
      <g
        transform="translate(5, 37) scale(0.01, -0.01)"
        className={styles.chunkHoundAccent}
      >
        <path
          d="M1755 3604 c-84 -16 -209 -77 -287 -139 -127 -100 -200 -212 -404
        -615 l-129 -254 0 -101 c0 -92 3 -105 33 -170 l33 -71 -41 -89 c-57 -125 -198
        -358 -341 -563 -135 -194 -147 -225 -106 -266 34 -34 95 -36 124 -4 22 25 126
        182 265 403 49 77 121 203 160 280 39 77 71 141 73 142 1 2 53 -20 116 -48
        141 -62 223 -83 309 -76 143 10 260 84 320 201 l35 69 3 403 3 404 -25 25
        c-31 31 -84 33 -117 6 l-24 -19 0 -389 c0 -384 0 -388 -23 -430 -51 -96 -170
        -128 -309 -83 -95 31 -242 105 -280 142 -61 59 -69 148 -21 243 160 316 282
        544 321 598 54 75 144 155 216 192 101 51 149 56 460 53 l286 -3 46 -27 c61
        -36 94 -75 153 -181 34 -61 70 -107 117 -151 92 -88 146 -108 306 -114 l122
        -4 17 -56 c20 -72 73 -126 137 -144 26 -6 48 -17 51 -24 7 -18 -12 -142 -30
        -196 -37 -113 -139 -227 -251 -280 -79 -38 -151 -48 -345 -48 -132 0 -166 -3
        -210 -20 -71 -26 -123 -71 -156 -134 l-27 -51 -3 -548 -3 -547 26 -26 c23 -23
        33 -26 68 -21 23 3 47 14 54 23 10 14 13 130 13 538 0 669 -25 613 280 620
        133 3 214 10 255 20 178 47 333 174 418 341 54 107 69 180 75 346 7 228 -14
        300 -103 351 -37 22 -54 23 -260 29 -212 5 -222 6 -271 32 -63 32 -98 71 -153
        172 -78 141 -178 224 -316 260 -79 20 -555 20 -660 -1z"
        />
        <path
          d="M2334 3071 c-39 -24 -58 -70 -51 -122 18 -139 219 -136 234 3 12 107
        -92 174 -183 119z"
        />
      </g>
      {/* Text */}
      <g
        fontFamily="'Inter', system-ui, -apple-system, sans-serif"
        fontWeight="600"
      >
        <text x="42" y="26" fontSize="18" className={styles.chunkHoundText}>
          Chunk
        </text>
        <text x="98" y="26" fontSize="18" className={styles.chunkHoundAccent}>
          Hound
        </text>
      </g>
    </svg>
  );
}

// ArguSeek wordmark with magnifying glass icon
function ArguSeekWordmark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 185 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="arguseek-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      {/* Magnifying glass icon scaled to match text */}
      <g transform="translate(0, 4)">
        <circle
          cx="14"
          cy="14"
          r="12"
          fill="url(#arguseek-gradient)"
          opacity="0.1"
        />
        <path
          d="M 20 20 L 26 26"
          stroke="url(#arguseek-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          cx="14"
          cy="14"
          r="8"
          stroke="url(#arguseek-gradient)"
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx="11" cy="12.5" r="1" fill="#14B8A6" />
        <circle cx="14" cy="14" r="1" fill="#14B8A6" />
        <circle cx="17" cy="15.5" r="1" fill="#14B8A6" />
      </g>
      {/* Wordmark text */}
      <text
        x="34"
        y="29"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="24"
      >
        <tspan fill="#10B981">Argu</tspan>
        <tspan fill="#14B8A6">Seek</tspan>
      </text>
    </svg>
  );
}

// Ecosystem Tools Section
function EcosystemTools() {
  return (
    <section id="ecosystem" className={styles.companionSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Open Source Ecosystem
        </Heading>
        <p className={styles.sectionSubtitle}>
          Production-ready tools that apply course methodology
        </p>
        <div className={styles.ecosystemGrid}>
          <a
            href="https://chunkhound.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.projectCard}
          >
            <div className={styles.projectHeader}>
              <ChunkHoundWordmark className={styles.projectWordmark} />
              <ExternalLinkIcon />
            </div>
            <p className={styles.projectTagline}>
              Don&apos;t search your code. Research it.
            </p>
            <span className={styles.projectScale}>10K–1M+ LOC</span>
          </a>

          <a
            href="https://github.com/ArguSeek/arguseek"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.projectCard}
          >
            <div className={styles.projectHeader}>
              <ArguSeekWordmark className={styles.projectWordmark} />
              <ExternalLinkIcon />
            </div>
            <p className={styles.projectTagline}>
              Wide research, not deep reports
            </p>
            <span className={styles.projectScale}>
              12–100+ sources per query
            </span>
          </a>

          <Link
            to="/developer-tools/cli-coding-agents"
            className={styles.projectCard}
          >
            <div className={styles.projectHeader}>
              <div className={styles.toolboxTitle}>
                <ToolboxIcon />
                <span>Curated Toolbox</span>
              </div>
            </div>
            <p className={styles.projectTagline}>
              Modern CLI tools for AI-first development
            </p>
            <span className={styles.projectScale}>
              ripgrep, fzf, lazygit...
            </span>
          </Link>
        </div>
        <p className={styles.integrationNote}>
          The research layer that anchors your agents in reality
        </p>
        <p className={styles.disclosureNote}>
          <em>ChunkHound and ArguSeek are created by the course author.</em>
        </p>
      </div>
    </section>
  );
}

interface ModuleCardProps {
  number: number;
  title: string;
  topics: string[];
  link: string;
}

function ModuleCard({ number, title, topics, link }: ModuleCardProps) {
  return (
    <Link to={link} className={styles.moduleCard}>
      <div className={styles.moduleHeader}>
        <div className={styles.moduleNumber}>Module {number}</div>
        <div className={styles.formatBadges}>
          <span className={styles.formatBadge} title="Podcast available">
            <HeadphonesIcon />
          </span>
          <span className={styles.formatBadge} title="Slides available">
            <PresentationIcon />
          </span>
        </div>
      </div>
      <Heading as="h3" className={styles.moduleTitle}>
        {title}
      </Heading>
      <ul className={styles.moduleTopics}>
        {topics.map((topic, index) => (
          <li key={index}>{topic}</li>
        ))}
      </ul>
    </Link>
  );
}

function CourseModules() {
  const modules = [
    {
      number: 1,
      title: 'Fundamentals',
      topics: [
        'LLM internals: context, attention, token limits',
        'What breaks: hallucinations, code drift, refactoring',
        'Context management and RAG integration',
      ],
      link: '/docs/fundamentals/lesson-1-how-llms-work',
    },
    {
      number: 2,
      title: 'Methodology',
      topics: [
        'Prompt structure: constraints, examples, chain-of-thought',
        'Grounding: embedding context that persists',
        'Iteration patterns: plan, execute, verify',
      ],
      link: '/docs/methodology/lesson-3-high-level-methodology',
    },
    {
      number: 3,
      title: 'Practical Techniques',
      topics: [
        'CI integration and automated review patterns',
        'Test generation and coverage strategies',
        'Debugging sessions: when AI makes it worse',
      ],
      link: '/docs/practical-techniques/lesson-6-project-onboarding',
    },
  ];

  return (
    <section className={styles.modulesSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          What You&apos;ll Learn
        </Heading>
        <p className={styles.sectionSubtitle}>
          {LESSON_COUNT} lessons covering research, planning, execution, and
          validation patterns
        </p>
        <div className={styles.modulesGrid}>
          {modules.map((module) => (
            <ModuleCard key={module.number} {...module} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Learning Formats - Three ways to consume each lesson
function LearningFormats() {
  return (
    <section className={styles.formatsSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Learn Your Way
        </Heading>
        <p className={styles.sectionSubtitle}>Every lesson, three formats</p>
        <div className={styles.formatsGrid}>
          <div className={styles.formatCard}>
            <BookmarkIcon />
            <Heading as="h3" className={styles.formatTitle}>
              Reference Docs
            </Heading>
            <p className={styles.formatDescription}>
              Bookmark it. Jump back in when you need it.
            </p>
          </div>
          <div className={styles.formatCard}>
            <HeadphonesIcon />
            <Heading as="h3" className={styles.formatTitle}>
              Podcasts
            </Heading>
            <p className={styles.formatDescription}>
              Commute, gym, walking the dog.
            </p>
          </div>
          <div className={styles.formatCard}>
            <PresentationIcon />
            <Heading as="h3" className={styles.formatTitle}>
              Presentations
            </Heading>
            <p className={styles.formatDescription}>Share with your team.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Master Agentic Coding"
      description="Master agentic coding with a structured methodology proven on enterprise mono-repos. Free, MIT licensed, with podcasts, slides, and production-ready prompts."
    >
      <HomepageHeader />
      <main>
        <SocialProofBar />
        <CourseModules />
        <LearningFormats />
        <EcosystemTools />
      </main>
    </Layout>
  );
}
