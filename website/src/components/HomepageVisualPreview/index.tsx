import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import {
  getChapterGroup,
  getSectionNumber,
  type ChapterId,
} from '../../../chapters';
import styles from './index.module.css';

import { EmojiImage } from '../VisualElements/ActorNodes';
import { EMOJI, type EmojiAsset } from '../VisualElements/emojiAssets';

type Tone = 'indigo' | 'violet' | 'warning';

// One storyboard beat = an actor emoji plus the line it speaks or produces.
type Beat = {
  emoji: EmojiAsset;
  label: string;
  text: string;
};

// Each discipline links to the first chapter of the group that answers it — the
// group entry point, not a deep chapter. `chapterId` is asserted to be that
// group's first chapter at render time.
type Discipline = {
  title: string;
  caption: string;
  chapterId: ChapterId;
  tone: Tone;
  beats: readonly Beat[];
};

// Storyboard geometry, shared by every card so the three visuals align.
const BEAT_TOP = 20;
const BEAT_STEP = 52;
const BEAT_EMOJI_SIZE = 30;
const BEAT_EMOJI_X = 22;
const BEAT_TEXT_X = 64;
const BEAT_RULE_END_X = 298;

// Ordered by book order: Directing → Reliable → Shipping.
const DISCIPLINES: readonly Discipline[] = [
  {
    title: 'Make the agent build what you meant.',
    caption:
      'Hand over the goals, boundaries, and trade-offs it can’t guess — and keep a long job on course.',
    chapterId: 'prompting-101',
    tone: 'indigo',
    beats: [
      {
        emoji: EMOJI.documentTabs,
        label: 'DIFF',
        text: 'One unfamiliar file changed',
      },
      { emoji: EMOJI.agent, label: 'AGENT', text: 'It seemed relevant' },
      { emoji: EMOJI.operator, label: 'HUMAN', text: 'Based on what reality?' },
    ],
  },
  {
    title: 'Trust results you can verify.',
    caption:
      'See what the agent sees, catch the drift, and check the work with something other than the agent itself.',
    chapterId: 'context-engineering',
    tone: 'warning',
    beats: [
      { emoji: EMOJI.check, label: 'CI', text: 'All checks passed' },
      { emoji: EMOJI.agent, label: 'CHANGE', text: 'Looks complete' },
      { emoji: EMOJI.operator, label: 'HUMAN', text: 'Is that enough?' },
    ],
  },
  {
    title: 'Own what ships.',
    caption:
      'Set the bar before the code does, prove the work cleared it, and keep the final call yours.',
    chapterId: 'spec-driven-development',
    tone: 'violet',
    beats: [
      { emoji: EMOJI.chat, label: 'REQUEST', text: 'Add SSO' },
      {
        emoji: EMOJI.agent,
        label: 'AGENT',
        text: 'Done — 37 files changed',
      },
      { emoji: EMOJI.operator, label: 'HUMAN', text: 'What did we decide?' },
    ],
  },
];

// On-ramp for newcomers: the Foundations group entry, so a reader first meets
// the model and the system around it before directing either.
const FOUNDATION = {
  chapterId: 'how-llms-work' as ChapterId,
  title: 'Know what you’re actually running.',
  caption:
    'See what the model can and can’t do, and the pieces you assemble around it. The rest of the book builds on this.',
};

function getChapterNumber(chapterId: ChapterId): number {
  const chapterNumber = getSectionNumber(chapterId);
  if (chapterNumber === undefined)
    throw new Error(`Homepage preview chapter is not numbered: ${chapterId}`);
  return chapterNumber;
}

// Homepage entries route readers into a group at its beginning. The assertion
// keeps that contract honest if a group's first chapter ever changes.
function resolveGroupEntry(chapterId: ChapterId) {
  const group = getChapterGroup(chapterId);
  const entry = group?.chapters[0];
  if (!group || !entry || entry.id !== chapterId)
    throw new Error(
      `Homepage preview must link to a group's first chapter, got: ${chapterId}`
    );
  return {
    groupLabel: group.label,
    chapterNumber: getChapterNumber(chapterId),
  };
}

function ChapterBadge({
  groupLabel,
  chapterNumber,
}: {
  groupLabel: string;
  chapterNumber: number;
}) {
  // Group label + chapter on two lines: the destination is always the group's
  // first chapter, so the badge reads as "enter here" rather than a deep link.
  return (
    <span className={styles.chapterBadge}>
      <span>{groupLabel}</span>
      <span>Chapter {chapterNumber}</span>
    </span>
  );
}

// One beat = an actor emoji, its label, its line, and the rule that opens the next beat.
// Static by design: every tile on this board is a link, and interactive elements must not
// carry autoplay motion (DESIGN_SYSTEM.md, Storytelling Idle Animation Grammar).
function BeatVisual({
  beat,
  index,
  isLast,
}: {
  beat: Beat;
  index: number;
  isLast: boolean;
}) {
  const top = BEAT_TOP + index * BEAT_STEP;
  return (
    <>
      <EmojiImage
        asset={beat.emoji}
        x={BEAT_EMOJI_X}
        y={top}
        size={BEAT_EMOJI_SIZE}
      />
      <text className={styles.beatLabel} x={BEAT_TEXT_X} y={top + 12}>
        {beat.label}
      </text>
      <text className={styles.beatText} x={BEAT_TEXT_X} y={top + 30}>
        {beat.text}
      </text>
      {isLast ? null : (
        <path
          className={styles.beatRule}
          d={`M${BEAT_EMOJI_X} ${top + 46}H${BEAT_RULE_END_X}`}
        />
      )}
    </>
  );
}

function DisciplineVisual({ discipline }: { discipline: Discipline }) {
  return (
    <svg
      className={styles.previewVisual}
      data-tone={discipline.tone}
      viewBox="0 0 320 184"
      role="img"
      aria-label={discipline.title}
    >
      <rect
        className={styles.visualFrame}
        x="8"
        y="8"
        width="304"
        height="168"
      />
      {discipline.beats.map((beat, index) => (
        <BeatVisual
          key={beat.label}
          beat={beat}
          index={index}
          isLast={index === discipline.beats.length - 1}
        />
      ))}
    </svg>
  );
}

// Model → agent: the distinction the Foundations entry teaches. Static by design: the whole
// tile is a link, and interactive elements must not carry autoplay motion (DESIGN_SYSTEM.md,
// Storytelling Idle Animation Grammar).
function FoundationVisual() {
  return (
    <svg
      className={styles.foundationVisual}
      viewBox="0 0 240 120"
      role="img"
      aria-label="A model predicts the next token; an agent runs that prediction in a loop."
    >
      <EmojiImage asset={EMOJI.brain} x={22} y={16} size={44} />
      <path className={styles.storyArrow} d="M78 44H108" />
      <path className={styles.storyArrowHead} d="M108 44l-8-5v10z" />
      <EmojiImage asset={EMOJI.agent} x={122} y={16} size={44} />
      <text
        className={styles.foundationLabel}
        x={44}
        y={84}
        textAnchor="middle"
      >
        THE MODEL
      </text>
      <text
        className={styles.foundationValue}
        x={44}
        y={102}
        textAnchor="middle"
      >
        predicts
      </text>
      <text
        className={styles.foundationLabel}
        x={144}
        y={84}
        textAnchor="middle"
      >
        THE AGENT
      </text>
      <text
        className={styles.foundationValue}
        x={144}
        y={102}
        textAnchor="middle"
      >
        acts in a loop
      </text>
    </svg>
  );
}

function PreviewCaption({
  discipline,
  groupLabel,
  chapterNumber,
}: {
  discipline: Discipline;
  groupLabel: string;
  chapterNumber: number;
}) {
  return (
    <figcaption className={styles.tileContent}>
      <ChapterBadge groupLabel={groupLabel} chapterNumber={chapterNumber} />
      <Heading as="h3" className={styles.tileTitle}>
        {discipline.title}
      </Heading>
      <p className={styles.tileCaption}>{discipline.caption}</p>
    </figcaption>
  );
}

function PreviewTile({ discipline }: { discipline: Discipline }) {
  const { groupLabel, chapterNumber } = resolveGroupEntry(discipline.chapterId);
  return (
    <Link
      to={`/${discipline.chapterId}`}
      className={styles.previewTile}
      aria-label={`${groupLabel}, Chapter ${chapterNumber}: ${discipline.title}`}
    >
      <figure className={styles.previewFigure}>
        <div className={styles.visualWrapper}>
          <DisciplineVisual discipline={discipline} />
        </div>
        <PreviewCaption
          discipline={discipline}
          groupLabel={groupLabel}
          chapterNumber={chapterNumber}
        />
      </figure>
    </Link>
  );
}

function EntryTile() {
  const { groupLabel, chapterNumber } = resolveGroupEntry(FOUNDATION.chapterId);
  return (
    <Link
      to={`/${FOUNDATION.chapterId}`}
      className={styles.entryTile}
      aria-label={`Start here — ${groupLabel}, Chapter ${chapterNumber}: ${FOUNDATION.title}`}
    >
      <div className={styles.entryVisualPanel}>
        <FoundationVisual />
      </div>
      <div className={styles.entryContent}>
        <ChapterBadge groupLabel={groupLabel} chapterNumber={chapterNumber} />
        <Heading as="h3" className={styles.entryTitle}>
          {FOUNDATION.title}
        </Heading>
        <p className={styles.entryCaption}>{FOUNDATION.caption}</p>
      </div>
    </Link>
  );
}

function PreviewHeader() {
  return (
    <>
      <Heading id="operator-work" as="h2" className={styles.sectionTitle}>
        The operator’s job.
      </Heading>
      <p className={styles.sectionSubtitle}>
        Where the machine leaves the decision to you.
      </p>
    </>
  );
}

export default function HomepageVisualPreview() {
  return (
    <section className={styles.showcaseSection} aria-labelledby="operator-work">
      <PreviewHeader />
      <div className={styles.previewBoard}>
        <EntryTile />
        <div className={styles.previewGrid}>
          {DISCIPLINES.map((discipline) => (
            <PreviewTile key={discipline.chapterId} discipline={discipline} />
          ))}
        </div>
      </div>
    </section>
  );
}
