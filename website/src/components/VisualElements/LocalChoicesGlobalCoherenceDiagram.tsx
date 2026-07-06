import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import { DiagramTile } from './DiagramTile';
import { EMOJI } from './emojiAssets';
import styles from './LocalChoicesGlobalCoherenceDiagram.module.css';

const ARIA_LABEL =
  'The same checkout prompt is extended one token at a time; each sampled token changes the next-token odds and produces a different outcome.';
const STEP_MS = 2200;
const CONTEXT = ['checkout', 'button', 'flow'] as const;
const STEPS = [
  {
    label: 'sample 1',
    candidates: [
      { token: 'pay', pct: 34 },
      { token: 'fees', pct: 33 },
      { token: 'maybe', pct: 33 },
    ],
  },
  {
    label: 'sample 2',
    candidates: [
      { token: 'added', pct: 35 },
      { token: 'now', pct: 33 },
      { token: 'try', pct: 32 },
    ],
  },
  {
    label: 'sample 3',
    candidates: [
      { token: 'later', pct: 34 },
      { token: 'late', pct: 33 },
      { token: 'securely', pct: 33 },
    ],
  },
] as const;
const HOLD_STEPS = 1;
const PLAYBACK_STEPS = STEPS.length + HOLD_STEPS;
const COMPOUND_MS = STEP_MS * PLAYBACK_STEPS;
const TIMING_STYLE = {
  '--step-cycle': `${STEP_MS}ms`,
  '--compound-cycle': `${COMPOUND_MS}ms`,
} as React.CSSProperties;
const RUNS = [
  { picks: [0, 1, 2], result: 'trust earned', tone: 'success' },
  { picks: [1, 0, 1], result: 'surprise fee', tone: 'warning' },
  { picks: [2, 2, 0], result: 'cart abandoned', tone: 'danger' },
] as const;
const CHIP = { w: 62, h: 28, gap: 6 } as const;
const PANEL = { w: 260, h: 108 } as const;
const ROW = {
  h: 22,
  gap: 6,
  tileW: 212,
  barW: 84,
  arrowX: 110,
  tokenX: 132,
} as const;
const RIBBON = { desktopX: 32, mobileX: 20, y: 56 } as const;

type Step = (typeof STEPS)[number];
type Run = (typeof RUNS)[number];
type Tone = Run['tone'];
type Layout = { x: number; y: number };

function usePlayback() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), STEP_MS);
    return () => window.clearInterval(id);
  }, []);
  const phaseStep = tick % PLAYBACK_STEPS;
  return {
    run: RUNS[Math.floor(tick / PLAYBACK_STEPS) % RUNS.length],
    activeStep: Math.min(phaseStep, STEPS.length - 1),
    outcomeVisible: phaseStep >= STEPS.length,
  };
}

function toneClass(tone: Tone) {
  return styles[
    `tone${tone[0].toUpperCase()}${tone.slice(1)}` as keyof typeof styles
  ];
}

function Label({
  x,
  y,
  children,
  anchor = 'middle',
}: Layout & {
  children: React.ReactNode;
  anchor?: 'start' | 'middle' | 'end';
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} className={styles.label}>
      {children}
    </text>
  );
}

function chipWidth(compact = false) {
  return compact ? 46 : CHIP.w;
}

function chipStride(compact = false) {
  return chipWidth(compact) + (compact ? 4 : CHIP.gap);
}

function TokenChip({
  x,
  y,
  token,
  selected = false,
  tone,
  current = false,
  compact = false,
}: Layout & {
  token: string;
  selected?: boolean;
  tone?: Tone;
  current?: boolean;
  compact?: boolean;
}) {
  const width = chipWidth(compact);
  return (
    <g
      className={clsx(
        styles.tokenChip,
        compact && styles.compactChip,
        selected && styles.selectedChip,
        current && styles.currentOutputToken,
        tone && toneClass(tone)
      )}
    >
      <rect x={x} y={y} width={width} height={CHIP.h} />
      <text
        x={x + width / 2}
        y={y + CHIP.h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {token}
      </text>
    </g>
  );
}

function SequenceRibbon({
  run,
  activeStep,
  x,
  y,
  compact = false,
  outcomeVisible,
}: Layout & {
  run: Run;
  activeStep: number;
  compact?: boolean;
  outcomeVisible: boolean;
}) {
  const sampled = run.picks
    .slice(0, activeStep + 1)
    .map((pick, index) => STEPS[index].candidates[pick].token);
  const tokens = [...CONTEXT, ...sampled];
  const stride = chipStride(compact);
  const sequenceEndX = x + tokens.length * stride;
  const outcomeWidth = compact ? 150 : 156;
  const outcomeX = compact
    ? sequenceEndX - outcomeWidth - 14
    : sequenceEndX + 34;
  const outcomeY = compact ? y + CHIP.h + 22 : y;
  return (
    <g>
      <Label x={x} y={y - 12} anchor="start">
        each sampled token changes the next odds
      </Label>
      {tokens.map((token, index) => (
        <SequenceToken
          key={`${token}-${index}`}
          token={token}
          index={index}
          x={x}
          y={y}
          run={run}
          current={!outcomeVisible && index === CONTEXT.length + activeStep}
          outcomeVisible={outcomeVisible}
          compact={compact}
        />
      ))}
      {outcomeVisible ? (
        <ResultArrow x={sequenceEndX} y={y} compact={compact} tone={run.tone} />
      ) : (
        <Cursor
          key={`cursor-${activeStep}`}
          x={x + (tokens.length - 1) * stride}
          y={y}
          advance={stride}
        />
      )}
      {outcomeVisible && (
        <OutcomeTile
          key={`outcome-${run.result}`}
          run={run}
          x={outcomeX}
          y={outcomeY}
          compact={compact}
        />
      )}
    </g>
  );
}

function SequenceToken({
  token,
  index,
  x,
  y,
  run,
  current,
  outcomeVisible,
  compact,
}: Layout & {
  token: string;
  index: number;
  run: Run;
  current: boolean;
  outcomeVisible: boolean;
  compact: boolean;
}) {
  const sampled = index >= CONTEXT.length;
  return (
    <g>
      <TokenChip
        x={x + index * chipStride(compact)}
        y={y}
        token={token}
        selected={sampled}
        current={current}
        tone={sampled && outcomeVisible ? run.tone : undefined}
        compact={compact}
      />
    </g>
  );
}

function Cursor({ x, y, advance }: Layout & { advance: number }) {
  return (
    <rect
      x={x}
      y={y + 4}
      width="3"
      height="20"
      className={clsx('idle-cursor-blink', styles.typingCursor)}
      style={{ '--cursor-advance': `${advance}px` } as React.CSSProperties}
    />
  );
}

function ResultArrow({
  x,
  y,
  compact,
  tone,
}: Layout & { compact: boolean; tone: Tone }) {
  return (
    <text
      x={compact ? x - 90 : x + 14}
      y={compact ? y + CHIP.h + 14 : y + CHIP.h / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      className={clsx(styles.resultArrow, toneClass(tone))}
    >
      {compact ? '↓' : '→'}
    </text>
  );
}

function OutcomeTile({
  run,
  x,
  y,
  compact,
}: Layout & { run: Run; compact: boolean }) {
  const width = compact ? 150 : 156;
  return (
    <DiagramTile
      x={x}
      y={y}
      width={width}
      height={CHIP.h}
      tone={outcomeTone(run.tone)}
      title={run.result}
      icon={outcomeIcon(run.tone)}
      variant="label"
      className={styles.outcomeTile}
      labelClassName={styles.outcomeLabel}
      labelAlign="center"
      labelIconSize={compact ? 18 : 16}
      titleVoice="keyword"
      weight={1.5}
    />
  );
}

function outcomeTone(tone: Tone) {
  if (tone === 'danger') return 'warning';
  return tone;
}

function outcomeIcon(tone: Tone) {
  if (tone === 'success') return EMOJI.check;
  if (tone === 'warning') return EMOJI.warning;
  if (tone === 'danger') return EMOJI.cross;
  return EMOJI.compass;
}

function SamplerPanel({
  step,
  selectedIndex,
  outcomeVisible,
  finalStep,
  sequenceKey,
  x,
  y,
}: Layout & {
  step: Step;
  selectedIndex: number;
  outcomeVisible: boolean;
  finalStep: boolean;
  sequenceKey: string;
}) {
  const splitX = x + 24 + ROW.arrowX;
  return (
    <g
      key={sequenceKey}
      className={clsx(
        styles.samplerShell,
        finalStep && !outcomeVisible && styles.samplerFinalStep,
        outcomeVisible && styles.samplerHidden
      )}
    >
      <Label x={x + (splitX - x) / 2} y={y - 10}>
        next-token odds
      </Label>
      <Label x={splitX + (x + PANEL.w - splitX) / 2} y={y - 10}>
        sampled token
      </Label>
      <rect
        x={x}
        y={y}
        width={PANEL.w}
        height={PANEL.h}
        className={styles.panel}
      />
      <CandidateListCrossfade
        key={`${sequenceKey}-${outcomeVisible ? 'outcome' : 'sampling'}`}
        step={step}
        selectedIndex={selectedIndex}
        outcomeVisible={outcomeVisible}
        x={x + 24}
        y={y + 14}
        ellipsisX={x + PANEL.w / 2}
        ellipsisY={y + PANEL.h - 10}
      />
    </g>
  );
}

type CandidateList = {
  key: string;
  step: Step;
  selectedIndex: number;
};

function CandidateListCrossfade({
  step,
  selectedIndex,
  outcomeVisible,
  x,
  y,
  ellipsisX,
  ellipsisY,
}: Layout & {
  step: Step;
  selectedIndex: number;
  outcomeVisible: boolean;
  ellipsisX: number;
  ellipsisY: number;
}) {
  const next = candidateListState(step, selectedIndex);
  const [current, setCurrent] = useState(next);
  const [outgoing, setOutgoing] = useState<CandidateList | null>(null);

  useEffect(() => {
    if (current.key === next.key) return undefined;
    setOutgoing(current);
    setCurrent(next);
    const id = window.setTimeout(() => setOutgoing(null), 420);
    return () => window.clearTimeout(id);
  }, [current, next]);

  const changing = current.key !== next.key;
  const visibleCurrent = changing ? next : current;
  const visibleOutgoing = changing ? current : outgoing;
  return (
    <g
      className={clsx(
        styles.samplerStep,
        outcomeVisible && styles.samplerPaused
      )}
    >
      {!outcomeVisible && visibleOutgoing && (
        <CandidateLayer
          list={visibleOutgoing}
          x={x}
          y={y}
          ellipsisX={ellipsisX}
          ellipsisY={ellipsisY}
          exiting
        />
      )}
      {!outcomeVisible && (
        <CandidateLayer
          key={visibleCurrent.key}
          list={visibleCurrent}
          x={x}
          y={y}
          ellipsisX={ellipsisX}
          ellipsisY={ellipsisY}
        />
      )}
    </g>
  );
}

function candidateListState(step: Step, selectedIndex: number): CandidateList {
  return { key: `${step.label}-${selectedIndex}`, step, selectedIndex };
}

function CandidateLayer({
  list,
  exiting = false,
  x,
  y,
  ellipsisX,
  ellipsisY,
}: Layout & {
  list: CandidateList;
  exiting?: boolean;
  ellipsisX: number;
  ellipsisY: number;
}) {
  return (
    <g
      className={clsx(
        styles.candidateLayer,
        exiting && styles.candidateLayerExit
      )}
    >
      {list.step.candidates.map((candidate, row) => (
        <CandidateRow
          key={candidate.token}
          candidate={candidate}
          selected={row === list.selectedIndex}
          x={x}
          y={y + row * (ROW.h + ROW.gap)}
        />
      ))}
      <text
        x={ellipsisX}
        y={ellipsisY}
        textAnchor="middle"
        dominantBaseline="middle"
        className={styles.ellipsis}
      >
        ···
      </text>
    </g>
  );
}

function CandidateRow({
  candidate,
  selected,
  x,
  y,
}: Layout & {
  candidate: Step['candidates'][number];
  selected: boolean;
}) {
  return (
    <g
      className={clsx(
        styles.candidateRow,
        selected && styles.selectedCandidate
      )}
    >
      <CandidateTile x={x} y={y} />
      <ProbabilityBar candidate={candidate} x={x + 8} y={y + 4} />
      <SelectionArrow selected={selected} x={x + ROW.arrowX} y={y} />
      <CandidateToken token={candidate.token} x={x + ROW.tokenX} y={y} />
    </g>
  );
}

function CandidateTile({ x, y }: Layout) {
  return (
    <rect
      x={x}
      y={y}
      width={ROW.tileW}
      height={ROW.h}
      className={styles.candidateTile}
    />
  );
}

function ProbabilityBar({
  candidate,
  x,
  y,
}: Layout & { candidate: Step['candidates'][number] }) {
  const barW = Math.round((candidate.pct / 35) * ROW.barW);
  return (
    <rect x={x} y={y} width={barW} height="14" className={styles.probBar} />
  );
}

function SelectionArrow({ selected, x, y }: Layout & { selected: boolean }) {
  if (!selected) return null;
  return (
    <text
      x={x}
      y={y + ROW.h / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      className={styles.choiceArrow}
    >
      →
    </text>
  );
}

function CandidateToken({ token, x, y }: Layout & { token: string }) {
  return (
    <text
      x={x}
      y={y + ROW.h / 2}
      dominantBaseline="middle"
      className={styles.candidateText}
    >
      {token}
    </text>
  );
}

function DesktopDiagram({
  run,
  activeStep,
  outcomeVisible,
}: {
  run: Run;
  activeStep: number;
  outcomeVisible: boolean;
}) {
  return (
    <svg
      viewBox="0 0 640 330"
      width="100%"
      aria-hidden="true"
      className={clsx(styles.diagram, styles.desktopDiagram)}
    >
      <SequenceRibbon
        key={`sequence-${run.result}`}
        run={run}
        activeStep={activeStep}
        outcomeVisible={outcomeVisible}
        x={RIBBON.desktopX}
        y={RIBBON.y}
      />
      <SamplerPanel
        step={STEPS[activeStep]}
        selectedIndex={run.picks[activeStep]}
        outcomeVisible={outcomeVisible}
        finalStep={activeStep === STEPS.length - 1}
        sequenceKey={run.result}
        x={190}
        y={126}
      />
    </svg>
  );
}

function MobileDiagram({
  run,
  activeStep,
  outcomeVisible,
}: {
  run: Run;
  activeStep: number;
  outcomeVisible: boolean;
}) {
  return (
    <svg
      viewBox="0 0 320 398"
      width="100%"
      aria-hidden="true"
      className={clsx(styles.diagram, styles.mobileDiagram)}
    >
      <SequenceRibbon
        key={`sequence-${run.result}`}
        run={run}
        activeStep={activeStep}
        outcomeVisible={outcomeVisible}
        x={RIBBON.mobileX}
        y={RIBBON.y}
        compact
      />
      <SamplerPanel
        step={STEPS[activeStep]}
        selectedIndex={run.picks[activeStep]}
        outcomeVisible={outcomeVisible}
        finalStep={activeStep === STEPS.length - 1}
        sequenceKey={run.result}
        x={30}
        y={138}
      />
    </svg>
  );
}

export default function LocalChoicesGlobalCoherenceDiagram() {
  const { run, activeStep, outcomeVisible } = usePlayback();
  return (
    <div
      className={styles.container}
      role="img"
      aria-label={ARIA_LABEL}
      style={TIMING_STYLE}
    >
      <DesktopDiagram
        run={run}
        activeStep={activeStep}
        outcomeVisible={outcomeVisible}
      />
      <MobileDiagram
        run={run}
        activeStep={activeStep}
        outcomeVisible={outcomeVisible}
      />
    </div>
  );
}
