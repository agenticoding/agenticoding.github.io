import type { ReactNode } from 'react';
import clsx from 'clsx';

import styles from './DiagramFrame.module.css';
import type { DiagramTone } from './diagramTileLayout';

export type DiagramFrameSize = 'narrow' | 'standard' | 'wide' | 'full';

export type DiagramLegendItem = {
  label: string;
  tone: DiagramTone;
  description?: string;
};

type DiagramFrameProps = {
  children: ReactNode;
  title: string;
  kicker?: string;
  caption?: ReactNode;
  legend?: DiagramLegendItem[];
  size?: DiagramFrameSize;
  className?: string;
  /** Audio-only spoken explanation of the figure; never rendered (see scripts/audiobook/DIALOGUE_GUIDE.md). */
  narration?: string;
};

export default function DiagramFrame({
  children,
  title,
  kicker,
  caption,
  legend,
  size = 'standard',
  className,
  narration: _narration,
}: DiagramFrameProps) {
  return (
    // data-audio-figure marks the DOM order the player uses to map figure anchors;
    // it must stay on the figure element itself.
    <figure
      className={clsx(styles.frame, styles[size], className)}
      data-audio-figure=""
    >
      <header className={styles.header}>
        {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
        {/* Title is a figure caption, not a document heading: Docusaurus's doc.toc
            reads the markdown AST only, so a heading here would be invisible to it. */}
        <p className={styles.title}>{title}</p>
      </header>
      <div className={styles.body}>{children}</div>
      {legend?.length ? <DiagramLegend items={legend} /> : null}
      {caption ? (
        <figcaption className={styles.caption}>{caption}</figcaption>
      ) : null}
    </figure>
  );
}

function DiagramLegend({ items }: { items: DiagramLegendItem[] }) {
  return (
    <ul className={styles.legend} aria-label="Diagram legend">
      {items.map((item) => (
        <li key={`${item.tone}-${item.label}`} className={styles.legendItem}>
          <span
            className={clsx(styles.legendKey, styles[item.tone])}
            aria-hidden="true"
          />
          <span className={styles.legendText}>
            <span>{item.label}</span>
            {item.description ? <small>{item.description}</small> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
