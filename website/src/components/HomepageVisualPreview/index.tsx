import React from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import WorkflowCircle from '../VisualElements/WorkflowCircle';
import CompoundQualityVisualization from '../VisualElements/CompoundQualityVisualization';
import ThreeContextWorkflow from '../VisualElements/ThreeContextWorkflow';
import styles from './index.module.css';

interface PreviewTileProps {
  title: string;
  caption: string;
  chapterLink: string;
  chapterNumber: number;
  children: React.ReactNode;
}

function PreviewTile({
  title,
  caption,
  chapterLink,
  chapterNumber,
  children,
}: PreviewTileProps) {
  return (
    <Link to={chapterLink} className={styles.previewTile}>
      <div className={styles.visualWrapper}>{children}</div>
      <div className={styles.tileContent}>
        <span className={styles.chapterBadge}>Chapter {chapterNumber}</span>
        <Heading as="h3" className={styles.tileTitle}>
          {title}
        </Heading>
        <p className={styles.tileCaption}>{caption}</p>
      </div>
    </Link>
  );
}

export default function CourseVisualsShowcase() {
  return (
    <section className={styles.showcaseSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Interactive Course Content
        </Heading>
        <p className={styles.sectionSubtitle}>
          Diagrams and visualizations from the chapters
        </p>

        <div className={styles.previewGrid}>
          <PreviewTile
            title="Iterative AI Workflows"
            caption="Grounding, Plan, Execute, Validate - systematic AI-assisted development"
            chapterLink="/high-level-methodology"
            chapterNumber={4}
          >
            <WorkflowCircle />
          </PreviewTile>

          <PreviewTile
            title="Context Isolation"
            caption="Separate contexts prevent bias between code, tests, and triage"
            chapterLink="/tests-as-guardrails"
            chapterNumber={9}
          >
            <ThreeContextWorkflow vertical />
          </PreviewTile>

          <PreviewTile
            title="Code Pattern Compounding"
            caption="Good patterns amplify quality, bad patterns compound technical debt"
            chapterLink="/agent-friendly-code"
            chapterNumber={12}
          >
            <CompoundQualityVisualization homepageMode />
          </PreviewTile>
        </div>
      </div>
    </section>
  );
}
