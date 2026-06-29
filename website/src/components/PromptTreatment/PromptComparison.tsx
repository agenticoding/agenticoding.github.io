import React, { type ReactNode } from 'react';
import CheckEmoji from '@site/src/components/VisualElements/CheckEmoji';
import CrossEmoji from '@site/src/components/VisualElements/CrossEmoji';
import styles from './styles.module.css';

type ComparisonNote = {
  label: string;
  detail: ReactNode;
};

type PromptComparisonProps = {
  bad: ReactNode;
  good: ReactNode;
  badLabel?: string;
  goodLabel?: string;
  goodNotes?: ComparisonNote[];
};

function Panel({
  attachment,
  children,
  label,
  tone,
}: {
  attachment?: ReactNode;
  children: ReactNode;
  label: string;
  tone: 'bad' | 'good';
}) {
  const toneClass = tone === 'bad' ? styles.panelBad : styles.panelGood;
  const Emoji = tone === 'bad' ? CrossEmoji : CheckEmoji;

  return (
    <section className={`${styles.panel} ${toneClass}`}>
      <div className={styles.panelHeader}>
        <Emoji size={18} />
        <span>{label}</span>
      </div>
      <div className={styles.panelBody}>{children}</div>
      {attachment}
    </section>
  );
}

function ExplanationLens({ notes }: { notes: ComparisonNote[] }) {
  return (
    <aside className={styles.explanationLens} aria-label="Why the effective prompt works">
      {notes.map((note, index) => (
        <div className={styles.annotation} key={note.label}>
          <div className={styles.annotationHeader}>
            <span className={styles.marker}>{index + 1}</span>
            <span className={styles.annotationTitle}>{note.label}</span>
          </div>
          <p className={styles.annotationDetail}>{note.detail}</p>
        </div>
      ))}
    </aside>
  );
}

export default function PromptComparison({
  bad,
  good,
  badLabel = 'Ineffective',
  goodLabel = 'Effective',
  goodNotes,
}: PromptComparisonProps) {
  const comparisonClass = goodNotes ? `${styles.comparison} ${styles.comparisonWithNotes}` : styles.comparison;

  return (
    <div className={comparisonClass}>
      <Panel tone="bad" label={badLabel}>{bad}</Panel>
      <Panel
        tone="good"
        label={goodLabel}
        attachment={goodNotes && <ExplanationLens notes={goodNotes} />}
      >
        {good}
      </Panel>
    </div>
  );
}
