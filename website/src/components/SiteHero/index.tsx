import Heading from '@theme/Heading';
import { type ReactNode } from 'react';

import styles from './index.module.css';

function HeroCopy() {
  return (
    <div className={styles.copy}>
      <p className={styles.eyebrow}>For people responsible for what ships</p>
      <Heading as="h1" className={styles.title}>
        It looks done. That’s when the real work starts.
      </Heading>
      <p className={styles.lead}>
        An agent can turn a request into a convincing change before you have
        time to understand its consequences. Keep the speed—and know what you
        are shipping.
      </p>
    </div>
  );
}

export default function SiteHero(): ReactNode {
  return (
    <section className={styles.hero}>
      <HeroCopy />
    </section>
  );
}
