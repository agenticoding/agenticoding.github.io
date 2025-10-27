import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p className={styles.heroAudience}>
          For senior engineers with 3+ years professional experience
        </p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs">
            Start Learning
          </Link>
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
        'How LLMs and agents work',
        'Capabilities and limitations',
        'Context windows and grounding',
      ],
      link: '/docs/understanding-the-tools',
    },
    {
      number: 2,
      title: 'Methodology',
      topics: [
        'Systematic prompting approaches',
        'Grounding techniques',
        'Workflow design patterns',
      ],
      link: '/docs/methodology',
    },
    {
      number: 3,
      title: 'Practical Techniques',
      topics: [
        'Production workflows',
        'Code review and testing',
        'Debugging and refactoring',
      ],
      link: '/docs/practical-techniques',
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

function WhyThisCourse() {
  const reasons = [
    {
      icon: '🏢',
      title: 'Enterprise Proven',
      description:
        'Battle-tested methodologies validated in production with million+ LOC codebases at scale',
    },
    {
      icon: '⚡',
      title: 'Production Scale',
      description:
        'Patterns proven on large-scale enterprise systems, not academic demos or toy examples',
    },
    {
      icon: '🎯',
      title: 'Architecture at Scale',
      description:
        'System design decisions, scalability patterns, security, and performance for real-world complexity',
    },
    {
      icon: '🤝',
      title: 'Team Ready',
      description:
        'Workflows that work for both solo developers and engineering teams in production environments',
    },
  ];

  return (
    <section className={styles.whySection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Why This Course
        </Heading>
        <div className={styles.reasonsGrid}>
          {reasons.map((reason, index) => (
            <div key={index} className={styles.reasonCard}>
              <div className={styles.reasonIcon}>{reason.icon}</div>
              <Heading as="h3" className={styles.reasonTitle}>
                {reason.title}
              </Heading>
              <p className={styles.reasonDescription}>{reason.description}</p>
            </div>
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
          <span className={styles.metaSeparator}>•</span>
          <Link to="/blog">Read the Blog</Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="AI Coding for Senior Engineers"
      description="Master AI-assisted software engineering - production-ready patterns, architecture, and workflows for experienced developers"
    >
      <HomepageHeader />
      <main>
        <CourseModules />
        <WhyThisCourse />
        <Prerequisites />
        <FinalCTA />
      </main>
    </Layout>
  );
}
