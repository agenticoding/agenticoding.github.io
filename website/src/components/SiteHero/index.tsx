import Heading from '@theme/Heading';
import { type ReactNode } from 'react';

import styles from './index.module.css';

/* Orientation first: the H1 states both what this is (a field guide) and its
   payoff (agents whose output you can stand behind). The recognition hook lives
   in the lead, one layer down.

   Copy note: no adversarial/security metaphors and none of the words other
   sections own (operator, machine, run, ships, trust, verify, decision, final
   call, discipline). */
function HeroCopy() {
  return (
    <div className={styles.copy}>
      <p className={styles.eyebrow}>For people taking back control</p>
      <Heading as="h1" className={styles.title}>
        A field guide to AI agents you can stand behind.
      </Heading>
      <p className={styles.lead}>
        An agent can turn a request into a convincing change before you have
        time to understand its consequences. This book is how you keep that
        speed—and stay accountable.
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
