import React, { type ReactNode } from 'react';
import styles from './styles.module.css';

type AnatomyItem = {
  label: string;
  detail: ReactNode;
};

type PromptAnatomyProps = {
  items: AnatomyItem[];
  prompt: ReactNode;
  sequenced?: boolean;
};

export default function PromptAnatomy({ items, prompt, sequenced = false }: PromptAnatomyProps) {
  const anatomyClass = sequenced ? `${styles.anatomy} ${styles.anatomySequenced}` : styles.anatomy;

  return (
    <div className={anatomyClass}>
      <div className={styles.anatomyPrompt}>{prompt}</div>
      <aside className={styles.annotations} aria-label="Prompt anatomy">
        {items.map((item, index) => (
          <div className={styles.annotation} key={item.label}>
            <div className={styles.annotationHeader}>
              <span className={styles.marker}>{index + 1}</span>
              <span className={styles.annotationTitle}>{item.label}</span>
            </div>
            <p className={styles.annotationDetail}>{item.detail}</p>
          </div>
        ))}
      </aside>
    </div>
  );
}
