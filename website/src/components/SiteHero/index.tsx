import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import { type ReactNode } from 'react';

import GitHubSocialProof from '../GitHubSocialProof';
import InlineEmojiImage from '../VisualElements/InlineEmojiImage';
import { EMOJI, type EmojiAsset } from '../VisualElements/emojiAssets';
import styles from './index.module.css';

interface HeroActionProps {
  className: string;
  href: string;
  label: string;
  icon: EmojiAsset;
}

function HeroAction({ className, href, label, icon }: HeroActionProps) {
  return (
    <Link className={className} to={href}>
      {label}{' '}
      <InlineEmojiImage asset={icon} size={16} className={styles.actionIcon} />
    </Link>
  );
}

function HeroCopy() {
  return (
    <>
      <p className={styles.eyebrow}>
        An advanced reference for production work
      </p>
      <Heading as="h1" className={styles.title}>
        AI agents write code. You still ship software.{' '}
        <GitHubSocialProof
          repo="agenticoding/agenticoding.github.io"
          fallbackStars={102}
          variant="hero"
        />
      </Heading>
      <p className={styles.lead}>
        An advanced reference book for operating coding agents in production –
        without outsourcing judgment.
      </p>
    </>
  );
}

function HeroActions() {
  return (
    <div className={styles.actions}>
      <HeroAction
        className={styles.primaryAction}
        href="/how-llms-work"
        label="Read Chapter 1: LLMs Demystified"
        icon={EMOJI.rightArrow}
      />
    </div>
  );
}

export default function SiteHero(): ReactNode {
  return (
    <div className={styles.hero}>
      <HeroCopy />
      <HeroActions />
    </div>
  );
}
