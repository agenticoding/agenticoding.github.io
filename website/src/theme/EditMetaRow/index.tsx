import { type ReactNode } from 'react';
import clsx from 'clsx';
import EditThisPage from '@theme/EditThisPage';
import LastUpdated from '@theme/LastUpdated';
import type { Props } from '@theme/EditMetaRow';
import styles from './styles.module.css';

/**
 * Swizzled to replace Docusaurus's Infima `.row`/`.col` split with one
 * design-system flex row: "Edit this page" (left) and the page's build-time
 * last-updated date (right).
 * WHY: freshness is the book's "living" signal. It belongs in the existing
 * footer metadata row, quiet and beside the edit affordance, never in content
 * and never competing with the page.
 */
export default function EditMetaRow({
  className,
  editUrl,
  lastUpdatedAt,
  lastUpdatedBy,
}: Props): ReactNode {
  return (
    <div className={clsx(className, styles.metaRow)}>
      {editUrl && <EditThisPage editUrl={editUrl} />}
      {(lastUpdatedAt || lastUpdatedBy) && (
        <LastUpdated
          lastUpdatedAt={lastUpdatedAt}
          lastUpdatedBy={lastUpdatedBy}
        />
      )}
    </div>
  );
}
