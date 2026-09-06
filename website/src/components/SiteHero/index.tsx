import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import { type ReactNode } from 'react';
import { chapters, getSectionNumber, isNumbered } from '../../../chapters';

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

// Hero CTA targets the first numbered chapter. Number, route, and title all
// derive from chapters.ts so reordering never stales the CTA.
const firstChapter = chapters.find(isNumbered);
const firstChapterNumber = firstChapter
  ? getSectionNumber(firstChapter.id)
  : undefined;
// Title is optional on the Chapter type (toolbox/standalone have none); assert
// for the numbered first chapter so a missing title fails fast in CI/tests.
const firstChapterTitle =
  firstChapter && 'title' in firstChapter
    ? (firstChapter as { title: string }).title
    : undefined;

function HeroActions() {
  if (!firstChapter || firstChapterNumber === undefined || !firstChapterTitle)
    throw new Error('SiteHero requires a numbered first chapter with title');
  return (
    <div className={styles.actions}>
      <HeroAction
        className={styles.primaryAction}
        href={`/${firstChapter.id}`}
        label={`Read Chapter ${firstChapterNumber}: ${firstChapterTitle}`}
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
