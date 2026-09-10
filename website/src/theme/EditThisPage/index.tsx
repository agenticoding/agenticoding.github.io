import { type ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import { ThemeClassNames } from '@docusaurus/theme-common';
import type { Props } from '@theme/EditThisPage';
import styles from './styles.module.css';

// Design-system UI icon: 24×24 canvas, outline stroke (currentColor).
function PencilIcon(): ReactNode {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

/**
 * Swizzled to the design-system "ghost" pattern: achromatic dark text, underline
 * for interactivity, --icon-sm outline pencil. Replaces Docusaurus's filled 20px
 * icon (off the --icon-* scale) and 16px body text so the footer metadata row
 * reads as one balanced line.
 */
export default function EditThisPage({ editUrl }: Props): ReactNode {
  return (
    <Link
      to={editUrl}
      className={clsx(ThemeClassNames.common.editThisPage, styles.editLink)}
    >
      <PencilIcon />
      <Translate
        id="theme.common.editThisPage"
        description="The link label to edit the current page"
      >
        Edit this page
      </Translate>
    </Link>
  );
}
