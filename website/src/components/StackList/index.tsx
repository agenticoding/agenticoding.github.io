import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import ToolMark from '@site/src/components/VisualElements/ToolMark';
import styles from './index.module.css';

type StackListProps = {
  children: ReactNode;
  /** Audio-only spoken setup walk-through; never rendered (see scripts/audiobook/DIALOGUE_GUIDE.md). */
  narration?: string;
};

/** Ordered group of stack entries. Composition lives in the entries so the
    group itself stays a plain, semantic list. */
export function StackList({ children, narration: _narration }: StackListProps) {
  // data-audio-figure marks the DOM order the player maps figure anchors to; a
  // narrated block needs its own anchor or every later figure in the page shifts.
  return (
    <ul className={styles.list} data-audio-figure="">
      {children}
    </ul>
  );
}

type StackEntryProps = {
  // Site-relative path to the tool mark, rendered by ToolMark.
  mark: string;
  name: string;
  href: string;
  setupHref: string;
  // Why the tool is in the stack — the prose stays in the doc, not the component.
  children: ReactNode;
};

// One stack entry: mark, name, rationale, then the ghost "Setup" action. The
// action is a structural element with its own hit area and position
// (design-system tertiary action), never a link trailing the sentence.
export function StackEntry({
  mark,
  name,
  href,
  setupHref,
  children,
}: StackEntryProps) {
  return (
    <li className={styles.entry}>
      <ToolMark src={mark} />
      <div className={styles.body}>
        <Link className={styles.name} href={href}>
          {name}
        </Link>
        <p className={styles.desc}>{children}</p>
        <Link className={styles.setup} href={setupHref}>
          Setup
          <span aria-hidden="true" className={styles.arrow}>
            &rarr;
          </span>
        </Link>
      </div>
    </li>
  );
}
