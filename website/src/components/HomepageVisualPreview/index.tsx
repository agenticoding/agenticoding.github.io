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
  lessonLink: string;
  lessonNumber: number;
  children: React.ReactNode;
}

function PreviewTile({
  title,
  caption,
  lessonLink,
  lessonNumber,
  children,
}: PreviewTileProps) {
  return (
    <Link to={lessonLink} className={styles.previewTile}>
      <div className={styles.visualWrapper}>{children}</div>
      <div className={styles.tileContent}>
        <span className={styles.lessonBadge}>Lesson {lessonNumber}</span>
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
          Diagrams and visualizations from the lessons
        </p>

        <div className={styles.previewGrid}>
          <PreviewTile
            title="Iterative AI Workflows"
            caption="Research, Plan, Execute, Validate - systematic AI-assisted development"
            lessonLink="/methodology/lesson-3-high-level-methodology"
            lessonNumber={3}
          >
            <WorkflowCircle compact />
          </PreviewTile>

          <PreviewTile
            title="Context Isolation"
            caption="Separate contexts prevent bias between code, tests, and triage"
            lessonLink="/practical-techniques/lesson-8-tests-as-guardrails"
            lessonNumber={8}
          >
            <ThreeContextWorkflow compact vertical />
          </PreviewTile>

          <PreviewTile
            title="Code Pattern Compounding"
            caption="Good patterns amplify quality, bad patterns compound technical debt"
            lessonLink="/practical-techniques/lesson-11-agent-friendly-code"
            lessonNumber={11}
          >
            <CompoundQualityVisualization compact homepageMode />
          </PreviewTile>
        </div>
      </div>
    </section>
  );
}
