import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import { type ComponentType, type ReactNode } from 'react';
import { getChapterById, type ChapterId } from '../../../chapters';
import styles from './index.module.css';

interface VisualNode {
  label: string;
  x: number;
}

interface Preview {
  title: string;
  caption: string;
  chapterId: ChapterId;
  Visual: ComponentType;
}

interface FutureBranchProps {
  path: string;
  label: string;
  labelY: number;
  flowClass: string;
  labelClass: string;
}

interface VisualFrameProps {
  markerId: string;
  label: string;
  children: ReactNode;
}

const PHASES: readonly VisualNode[] = [
  { label: 'GROUND', x: 8 },
  { label: 'PLAN', x: 86 },
  { label: 'EXECUTE', x: 164 },
  { label: 'VALIDATE', x: 242 },
];

const CONTEXTS: readonly VisualNode[] = [
  { label: 'IMPLEMENT', x: 8 },
  { label: 'TEST', x: 125 },
  { label: 'REVIEW', x: 242 },
];

const PHASE_CONNECTIONS = ['M78 68H84', 'M156 68H162', 'M234 68H240'];
const CONTEXT_CONNECTIONS = ['M78 68H122', 'M195 68H239'];

function ArrowDefs({ id }: { id: string }) {
  return (
    <defs>
      <marker
        id={id}
        markerWidth="7"
        markerHeight="7"
        refX="7"
        refY="3"
        orient="auto"
      >
        <path d="M0 0 7 3 0 6Z" className={styles.arrowHead} />
      </marker>
    </defs>
  );
}

function VisualFrame(props: VisualFrameProps) {
  const { markerId, label, children } = props;
  return (
    <svg
      className={styles.previewVisual}
      viewBox="0 0 320 160"
      role="img"
      aria-label={label}
    >
      <ArrowDefs id={markerId} />
      {children}
    </svg>
  );
}

function NodeRow({
  nodes,
  className,
}: {
  nodes: readonly VisualNode[];
  className: string;
}) {
  return nodes.map(({ label, x }) => (
    <g key={label}>
      <rect x={x} y="48" width="70" height="40" className={className} />
      <text x={x + 35} y="72" className={styles.nodeLabel}>
        {label}
      </text>
    </g>
  ));
}

function SequenceArrows({
  paths,
  className,
  markerId,
}: {
  paths: readonly string[];
  className: string;
  markerId: string;
}) {
  return paths.map((path) => (
    <path
      key={path}
      d={path}
      className={className}
      markerEnd={`url(#${markerId})`}
    />
  ));
}

function FeedbackRoute() {
  return (
    <>
      <path
        d="M277 90V126H43V92"
        className={styles.feedbackFlow}
        markerEnd="url(#phase-preview-arrow)"
      />
      <text x="160" y="145" className={styles.visualNote}>
        FAILURE RETURNS TO ITS CAUSE
      </text>
    </>
  );
}

function PhaseRouteVisual() {
  return (
    <VisualFrame
      markerId="phase-preview-arrow"
      label="Ground, plan, execute, and validate sequence with failures returning to their cause"
    >
      <NodeRow nodes={PHASES} className={styles.systemNode} />
      <SequenceArrows
        paths={PHASE_CONNECTIONS}
        className={styles.systemFlow}
        markerId="phase-preview-arrow"
      />
      <FeedbackRoute />
    </VisualFrame>
  );
}

function ContextIsolationVisual() {
  return (
    <VisualFrame
      markerId="context-preview-arrow"
      label="Implementation, testing, and review separated by fresh-context boundaries"
    >
      <NodeRow nodes={CONTEXTS} className={styles.agentNode} />
      <SequenceArrows
        paths={CONTEXT_CONNECTIONS}
        className={styles.agentFlow}
        markerId="context-preview-arrow"
      />
      <path d="M106 34V104M223 34V104" className={styles.contextBarrier} />
      <text x="160" y="130" className={styles.visualNote}>
        FRESH CONTEXT AT EACH BOUNDARY
      </text>
    </VisualFrame>
  );
}

function AcceptedCodeNode() {
  return (
    <>
      <rect x="8" y="60" width="88" height="40" className={styles.systemNode} />
      <text x="52" y="84" className={styles.nodeLabel}>
        ACCEPTED CODE
      </text>
    </>
  );
}

function FutureBranch(props: FutureBranchProps) {
  const { path, label, labelY, flowClass, labelClass } = props;
  return (
    <>
      <path
        d={path}
        className={flowClass}
        markerEnd="url(#future-preview-arrow)"
      />
      <text x="242" y={labelY} className={labelClass}>
        {label}
      </text>
    </>
  );
}

function FutureContextBranches() {
  return (
    <>
      <FutureBranch
        path="M98 76Q160 76 236 36"
        label="GUIDES QUALITY"
        labelY={32}
        flowClass={styles.qualityFlow}
        labelClass={styles.qualityLabel}
      />
      <FutureBranch
        path="M98 84Q160 84 236 124"
        label="COMPOUNDS DEBT"
        labelY={140}
        flowClass={styles.debtFlow}
        labelClass={styles.debtLabel}
      />
    </>
  );
}

function FutureContextVisual() {
  return (
    <VisualFrame
      markerId="future-preview-arrow"
      label="Accepted code guiding future agents toward quality or compounding debt"
    >
      <AcceptedCodeNode />
      <FutureContextBranches />
    </VisualFrame>
  );
}

const PREVIEWS: readonly Preview[] = [
  {
    title: 'Route work through the right phase',
    caption:
      'Ground, plan, execute, and validate—then send failures back to the phase that caused them.',
    chapterId: 'high-level-methodology',
    Visual: PhaseRouteVisual,
  },
  {
    title: 'Separate implementation from judgment',
    caption:
      'Fresh contexts keep one plausible framing from carrying directly into implementation, tests, and review.',
    chapterId: 'validation',
    Visual: ContextIsolationVisual,
  },
  {
    title: 'Treat accepted code as future context',
    caption:
      'Good patterns guide later agents toward quality; weak patterns compound into recurring debt.',
    chapterId: 'agent-friendly-code',
    Visual: FutureContextVisual,
  },
];

function getChapterMetadata(chapterId: ChapterId) {
  const chapter = getChapterById(chapterId);
  if (!chapter) throw new Error(`Unknown homepage chapter: ${chapterId}`);
  return chapter;
}

function PreviewCaption({
  title,
  caption,
  chapterNumber,
}: Pick<Preview, 'title' | 'caption'> & { chapterNumber: number }) {
  return (
    <figcaption className={styles.tileContent}>
      <span className={styles.chapterBadge}>Chapter {chapterNumber}</span>
      <Heading as="h3" className={styles.tileTitle}>
        {title}
      </Heading>
      <p className={styles.tileCaption}>{caption}</p>
    </figcaption>
  );
}

function PreviewFigure(props: Preview & { chapterNumber: number }) {
  const { title, caption, chapterNumber, Visual } = props;
  return (
    <figure className={styles.previewFigure}>
      <div className={styles.visualWrapper}>
        <Visual />
      </div>
      <PreviewCaption
        title={title}
        caption={caption}
        chapterNumber={chapterNumber}
      />
    </figure>
  );
}

function PreviewTile(preview: Preview) {
  const { title, caption, chapterId } = preview;
  const chapter = getChapterMetadata(chapterId);
  return (
    <Link
      to={`/${chapterId}`}
      className={styles.previewTile}
      aria-label={`Chapter ${chapter.sectionNumber}: ${title}. ${caption}`}
    >
      <PreviewFigure {...preview} chapterNumber={chapter.sectionNumber} />
    </Link>
  );
}

function PreviewHeader() {
  return (
    <>
      <Heading id="inside-the-book" as="h2" className={styles.sectionTitle}>
        How to operate coding agents accountably
      </Heading>
      <p className={styles.sectionSubtitle}>
        Three production decisions that turn model output into work you can
        inspect, validate, and accept.
      </p>
    </>
  );
}

export default function HomepageVisualPreview() {
  return (
    <section
      className={styles.showcaseSection}
      aria-labelledby="inside-the-book"
    >
      <PreviewHeader />
      <div className={styles.previewGrid}>
        {PREVIEWS.map((preview) => (
          <PreviewTile key={preview.chapterId} {...preview} />
        ))}
      </div>
    </section>
  );
}
