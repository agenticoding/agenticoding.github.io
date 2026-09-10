import { type ReactNode } from 'react';
import styles from './index.module.css';

interface HomepageProseProps {
  children: ReactNode;
}

/**
 * Homepage editorial prose band. Prose itself uses the content column's full
 * measure (the same as the rest of the book); this wrapper exists to scope the
 * achromatic pull-quote typography used inside the homepage thesis.
 */
export default function HomepageProse({
  children,
}: HomepageProseProps): ReactNode {
  return <div className={styles.prose}>{children}</div>;
}
