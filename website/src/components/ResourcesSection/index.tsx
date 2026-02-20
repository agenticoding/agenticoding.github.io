import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import promptsSidebars from '../../../sidebarsPrompts';
import { superellipsePath } from '@site/src/utils/svgMath';
import styles from './index.module.css';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

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

const PROMPT_COUNT = countPrompts();

// ---------------------------------------------------------------------------
// Illustrations
// ---------------------------------------------------------------------------

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
// Section
// ---------------------------------------------------------------------------

export default function ResourcesSection() {
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
