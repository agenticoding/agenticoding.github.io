import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import { rectanglePath } from '@site/src/utils/svgMath';
import styles from './index.module.css';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Illustrations
// ---------------------------------------------------------------------------

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
        rx="0"
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
 * Code research — sharp rectangular documents with curved search geometry.
 * Layered code blocks with match highlights, dashed connectors
 * leading to a magnifying glass. Indigo accent.
 */
function ChunkHoundIllustration() {
  return (
    <svg
      viewBox="0 0 160 80"
      role="img"
      aria-label="Code search with match highlighting"
      className={styles.resourceIllustration}
    >
      <path
        d={rectanglePath(48, 42, 28, 22)}
        fill="var(--surface-raised)"
        stroke="var(--border-subtle)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={rectanglePath(56, 40, 28, 22)}
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
        <div className={styles.resourceGrid}>
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
        </div>
      </div>
    </section>
  );
}
