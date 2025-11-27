import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CourseVisualsShowcase from '../components/HomepageVisualPreview';

import styles from './index.module.css';

const heroCodeExample = `Debug the failing test in UserService.test.ts:

INVESTIGATE:
1. Read the test file, identify which assertion fails
2. Trace code path through UserService
3. Examine error messages and stack traces

ANALYZE:
4. Compare expected vs actual behavior
5. Identify the root cause

Provide conclusions with evidence:
- File paths and line numbers (\`src/auth/jwt.ts:45-67\`)
- Actual values from code (\`timeout: 3000\`)
- Specific function names (\`validateToken()\`)`;

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className={clsx('container', styles.heroSplit)}>
        <div className={styles.heroContent}>
          <Heading as="h1" className="hero__title">
            {siteConfig.title}
          </Heading>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <p className={styles.heroAudience}>
            For experienced engineers with 3+ years professional experience
          </p>
          <div className={styles.buttons}>
            <Link className="button button--secondary button--lg" to="/docs">
              Start Learning
            </Link>
          </div>
        </div>
        <div className={styles.heroCodeWrapper}>
          <div className={styles.heroCodeHeader}>
            <span className={styles.codeHeaderDot} />
            <span className={styles.codeHeaderDot} />
            <span className={styles.codeHeaderDot} />
            <span className={styles.codeHeaderTitle}>prompt.md</span>
          </div>
          <pre className={styles.heroCodeBlock}>
            <code>{heroCodeExample}</code>
          </pre>
        </div>
      </div>
    </header>
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
      <div className={styles.moduleNumber}>Module {number}</div>
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
      title: 'Understanding the Tools',
      topics: [
        'LLM internals: context, attention, token limits',
        'What breaks: hallucinations, code drift, refactoring',
        'Context management and RAG integration',
      ],
      link: '/docs/understanding-the-tools/lesson-1-intro',
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
          Course Structure
        </Heading>
        <div className={styles.modulesGrid}>
          {modules.map((module) => (
            <ModuleCard key={module.number} {...module} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Prerequisites() {
  return (
    <section className={styles.prerequisitesSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Prerequisites
        </Heading>
        <div className={styles.prerequisitesContent}>
          <div className={styles.prerequisiteColumn}>
            <Heading as="h3" className={styles.prerequisiteSubtitle}>
              ✓ You should have
            </Heading>
            <ul className={styles.prerequisiteList}>
              <li>3+ years professional software engineering experience</li>
              <li>
                Access to a CLI coding agent (Claude Code, Aider, Cursor, or
                similar)
              </li>
              <li>
                Solid understanding of data structures and design patterns
              </li>
              <li>Experience with system design and architectural decisions</li>
            </ul>
          </div>
          <div className={styles.prerequisiteColumn}>
            <Heading as="h3" className={styles.prerequisiteSubtitle}>
              ✗ Not required
            </Heading>
            <ul className={styles.prerequisiteList}>
              <li>Prior AI or machine learning experience</li>
              <li>Deep knowledge of transformer architectures</li>
              <li>
                Specific programming language (examples use TypeScript, Python,
                etc.)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <Heading as="h2" className={styles.ctaTitle}>
          Get Started
        </Heading>
        <p className={styles.ctaDescription}>
          Begin with Understanding the Tools to learn how LLMs and coding agents
          work
        </p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs">
            Start Learning
          </Link>
        </div>
        <div className={styles.ctaLinks}>
          <Link to="https://github.com/ofriw/AI-Coding-Course">
            View on GitHub
          </Link>
          <span className={styles.metaSeparator}>•</span>
          <Link to="https://github.com/ofriw/AI-Coding-Course/discussions">
            Join Discussions
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="AI Coding for experienced Engineers"
      description="Master AI-assisted software engineering - production-ready patterns, architecture, and workflows for experienced developers"
    >
      <HomepageHeader />
      <main>
        <CourseVisualsShowcase />
        <CourseModules />
        <Prerequisites />
        <FinalCTA />
      </main>
    </Layout>
  );
}
