import React from 'react';
import { useMounted } from '../../hooks/useMounted';
import { TokenUnit } from './TokenUnit';
import {
  BAND_Y0,
  BAND_Y1,
  COLLAPSE_MS,
  COMPACTION_CYCLE_MS,
  DELETE_SLIDE_MS,
  DELETE_SLIDE_START_MS,
  DELETE_START_MS,
  EJECT_FADE_MS,
  EJECT_STAGGER_MS,
  EJECT_TRAVEL_MS,
  HEADROOM_FADE_MS,
  HEADROOM_H,
  HEADROOM_LABEL,
  HEADROOM_NOTE,
  HEADROOM_PULSE_END_MS,
  PAIR_START_MS,
  RESTORE_LABEL_IN_MS,
  RESTORE_MS,
  RESTORE_SHAPE_IN_MS,
  RESTORE_START_MS,
  RESTORE_SUMMARY_OUT_MS,
  RESTORE_TOKENS_IN_MS,
  RESULT_ON_MS,
  SHRINK_LEAD_MS,
  SHRINK_MS,
  STACK_BANDS,
  STACK_EVENTS,
  STACK_W,
  STACK_X,
  STATIC_LEDGER,
  SUMMARY_FADE_MS,
  SUMMARY_H,
  SUMMARY_LEAD_MS,
  SUMMARY_PAIRS,
  SURVIVOR_TRAVEL_MS,
  bandTop,
  finalTop,
  pairEjectSpecs,
  pairTokens,
  summaryBand,
  survivorRisePx,
} from './compactionLineModel';
import type { CompactionBand } from './compactionLineModel';
import { ContextBandLabel, ContextBandShape } from './ContextBand';
import styles from './CompactionLineDiagram.module.css';

// Compaction Line — one context window, compacted in place, told as a
// three-act idle loop (schedule lives in compactionLineModel):
//   1. Stale tool-pair bands collapse; the stack below slides up to close
//      ranks — deletion.
//   2. Each thread tile ejects the majority of its tokens in one unified
//      rise out of the window, while a compressed minority rises into the
//      short summary tile cross-fading in — visible lossy summarization,
//      one by one. The stack slides up behind each shrink.
//   3. The freed space collects at the bottom of the same window, labeled
//      for the next request. Then every band restores before the loop wraps.
// Deletion and summarization are distinguished by mechanism: a deleted band
// vanishes; a summarized band keeps only a compressed minority and
// compresses. With motion
// disabled a static scene shows the compacted stack plus a ledger of what was
// freed (module CSS guard).

const VW = 420;
const VH = 285;

const MONO_KEYWORD = 'var(--font-mono-keyword)';

const TOKEN_SIZE = 14;
const TOKEN_GAP = 5;

// Keyframes are injected globally; inline names bypass CSS Modules renaming.
const KF = {
  collapse: 'compactionLineCollapse',
  slideDelete: 'compactionLineSlideDelete',
  slideShrink: SUMMARY_PAIRS.map((_, k) => `compactionLineSlideShrink${k}`),
  eject: SUMMARY_PAIRS.map((_, k) => `compactionLineEject${k}`),
  survivor: SUMMARY_PAIRS.map((_, k) => `compactionLineSurvivor${k}`),
  shrink: SUMMARY_PAIRS.map((_, k) => `compactionLineShrink${k}`),
  threadLabel: SUMMARY_PAIRS.map((_, k) => `compactionLineThreadLabel${k}`),
  summary: SUMMARY_PAIRS.map((_, k) => `compactionLineSummary${k}`),
  headroom: 'compactionLineHeadroom',
  legendDeleted: 'compactionLineLegendDeleted',
  legendSummary: 'compactionLineLegendSummary',
};

type StoryStyle = React.CSSProperties & {
  '--delay'?: string;
  '--slide'?: string;
  '--sy'?: number;
  '--ex'?: string;
  '--ey'?: string;
};

type RootStyle = React.CSSProperties & { '--cycle-ms': string };

function pct(ms: number) {
  return `${((ms / COMPACTION_CYCLE_MS) * 100).toFixed(2)}%`;
}

// Pair keyframes are per-pair (not --delay-shared) because the restore beat is
// absolute in the cycle, not relative to each pair's start. Within a pair the
// discarded tokens share the eject keyframe and stagger via --delay; survivors
// share the survivor keyframe (rise into the summary slot, fade out across the
// summary cross-fade, restore with the flock).
function pairKeyframes() {
  return SUMMARY_PAIRS.map((_, k) => {
    const start = PAIR_START_MS[k];
    const shrinkStart = start + SHRINK_LEAD_MS;
    const shrinkEnd = shrinkStart + SHRINK_MS;
    const summaryStart = shrinkEnd - SUMMARY_LEAD_MS;
    const summaryEnd = summaryStart + SUMMARY_FADE_MS;
    return `
      @keyframes ${KF.eject[k]} {
        0%, ${pct(start)} { opacity: 1; transform: none; }
        ${pct(start + EJECT_TRAVEL_MS)} { opacity: 0.9; }
        ${pct(start + EJECT_TRAVEL_MS + EJECT_FADE_MS)}, ${pct(RESTORE_START_MS)} { opacity: 0; transform: translate(var(--ex), var(--ey)); }
        ${pct(RESTORE_START_MS + 20)}, ${pct(RESTORE_START_MS + RESTORE_LABEL_IN_MS)} { opacity: 0; transform: none; }
        ${pct(RESTORE_START_MS + RESTORE_TOKENS_IN_MS)}, 100% { opacity: 1; transform: none; }
      }
      @keyframes ${KF.survivor[k]} {
        0%, ${pct(start + SHRINK_LEAD_MS)} { opacity: 1; transform: none; }
        ${pct(start + SHRINK_LEAD_MS + SURVIVOR_TRAVEL_MS)}, ${pct(summaryStart)} { opacity: 1; transform: translateY(calc(-1 * var(--ey))); }
        ${pct(summaryEnd)}, ${pct(RESTORE_START_MS)} { opacity: 0; transform: translateY(calc(-1 * var(--ey))); }
        ${pct(RESTORE_START_MS + 20)}, ${pct(RESTORE_START_MS + RESTORE_LABEL_IN_MS)} { opacity: 0; transform: none; }
        ${pct(RESTORE_START_MS + RESTORE_TOKENS_IN_MS)}, 100% { opacity: 1; transform: none; }
      }
      @keyframes ${KF.shrink[k]} {
        0%, ${pct(shrinkStart)} { transform: scaleY(1); opacity: 1; }
        ${pct(shrinkStart + 500)} { transform: scaleY(var(--sy)); opacity: 0.25; }
        ${pct(shrinkEnd)}, ${pct(RESTORE_START_MS + RESTORE_SHAPE_IN_MS)} { transform: scaleY(var(--sy)); opacity: 0; }
        ${pct(RESTORE_START_MS + RESTORE_MS)}, 100% { transform: scaleY(1); opacity: 1; }
      }
      @keyframes ${KF.threadLabel[k]} {
        0%, ${pct(start + 80)} { opacity: 1; }
        ${pct(start + 300)}, ${pct(RESTORE_START_MS + RESTORE_LABEL_IN_MS)} { opacity: 0; }
        ${pct(RESTORE_START_MS + RESTORE_MS)}, 100% { opacity: 1; }
      }
      @keyframes ${KF.summary[k]} {
        0%, ${pct(summaryStart)} { opacity: 0; }
        ${pct(summaryEnd)}, ${pct(RESTORE_START_MS)} { opacity: 1; }
        ${pct(RESTORE_START_MS + RESTORE_SUMMARY_OUT_MS)}, 100% { opacity: 0; }
      }
      @keyframes ${KF.slideShrink[k]} {
        0%, ${pct(shrinkStart)} { transform: translateY(0); }
        ${pct(shrinkEnd)}, ${pct(RESTORE_START_MS)} { transform: translateY(calc(-1 * var(--slide))); }
        ${pct(RESTORE_START_MS + RESTORE_MS)}, 100% { transform: translateY(0); }
      }`;
  }).join('\n');
}

function TimingStyles() {
  return (
    <style>
      {`
        @keyframes ${KF.collapse} {
          0%, ${pct(DELETE_START_MS)} { transform: scaleY(1); opacity: 1; }
          ${pct(DELETE_START_MS + COLLAPSE_MS)}, ${pct(RESTORE_START_MS)} { transform: scaleY(0); opacity: 0; }
          ${pct(RESTORE_START_MS + RESTORE_MS)}, 100% { transform: scaleY(1); opacity: 1; }
        }

        @keyframes ${KF.slideDelete} {
          0%, ${pct(DELETE_SLIDE_START_MS)} { transform: translateY(0); }
          ${pct(DELETE_SLIDE_START_MS + DELETE_SLIDE_MS)}, ${pct(RESTORE_START_MS)} { transform: translateY(calc(-1 * var(--slide))); }
          ${pct(RESTORE_START_MS + RESTORE_MS)}, 100% { transform: translateY(0); }
        }

        ${pairKeyframes()}

        @keyframes ${KF.headroom} {
          0%, ${pct(RESULT_ON_MS)} { opacity: 0; }
          ${pct(RESULT_ON_MS + HEADROOM_FADE_MS)} { opacity: 1; }
          ${pct(RESULT_ON_MS + 900)} { opacity: 0.45; }
          ${pct(RESULT_ON_MS + 1400)} { opacity: 1; }
          ${pct(RESULT_ON_MS + 1900)} { opacity: 0.45; }
          ${pct(HEADROOM_PULSE_END_MS)}, ${pct(RESTORE_START_MS)} { opacity: 1; }
          ${pct(RESTORE_START_MS + RESTORE_MS)}, 100% { opacity: 0; }
        }

        @keyframes ${KF.legendDeleted} {
          0%, ${pct(DELETE_START_MS - 100)} { opacity: 0.55; }
          ${pct(DELETE_START_MS + 200)}, ${pct(DELETE_SLIDE_START_MS + DELETE_SLIDE_MS + 900)} { opacity: 1; }
          ${pct(DELETE_SLIDE_START_MS + DELETE_SLIDE_MS + 1300)}, 100% { opacity: 0.55; }
        }

        @keyframes ${KF.legendSummary} {
          0%, ${pct(PAIR_START_MS[0] - 50)} { opacity: 0.55; }
          ${pct(PAIR_START_MS[0] + 200)}, ${pct(PAIR_START_MS[2] + 900)} { opacity: 1; }
          ${pct(PAIR_START_MS[2] + 1300)}, 100% { opacity: 0.55; }
        }
      `}
    </style>
  );
}

// Deletion: the stale pair collapses in place (scaleY); bands below close
// ranks via the slide wrapper in renderStackFrom.
function DeleteBand({ band, y }: { band: CompactionBand; y: number }) {
  return (
    <g className={styles.collapse} style={{ animationName: KF.collapse }}>
      <ContextBandShape x={STACK_X} y={y} w={STACK_W} spec={band} />
      <ContextBandLabel x={STACK_X} y={y} w={STACK_W} spec={band} />
    </g>
  );
}

// Summarization: the majority of the tile's tokens ejects out of the window,
// the surviving minority rises into the summary slot, the rect shrinks toward
// the top edge, the label fades, and the short summary tile cross-fades in —
// all layers stacked at the same slot.
function ThreadBand({ band, y, pairIndex }: { band: CompactionBand; y: number; pairIndex: number }) {
  const tokens = pairTokens(pairIndex);
  const specs = pairEjectSpecs(pairIndex);
  const survivors = SUMMARY_PAIRS[pairIndex].survivors;
  const discarded = tokens.length - survivors;
  const rowW = tokens.length * TOKEN_SIZE + (tokens.length - 1) * TOKEN_GAP;
  const rowX = STACK_X + STACK_W - 10 - rowW;
  const tokenY = y + band.h / 2 - TOKEN_SIZE / 2;
  const shrinkStyle: StoryStyle = { '--sy': SUMMARY_H / band.h, animationName: KF.shrink[pairIndex] };
  const summary = summaryBand(pairIndex);
  // Synthetic remainder lands at the survivors' exact positions: both rows are
  // right-aligned, so summaryRowX = rowX + discarded tokens' width and the
  // cross-fade swap reads as transformation, not literal preservation.
  const summaryRowX = rowX + discarded * (TOKEN_SIZE + TOKEN_GAP);
  const summaryTokenY = y + SUMMARY_H / 2 - TOKEN_SIZE / 2;
  return (
    <>
      <g className={styles.shrink} style={shrinkStyle}>
        <ContextBandShape x={STACK_X} y={y} w={STACK_W} spec={band} />
      </g>
      <g className={styles.threadLabel} style={{ animationName: KF.threadLabel[pairIndex] }}>
        <ContextBandLabel x={STACK_X} y={y} w={STACK_W} spec={band} />
      </g>
      {tokens.map((token, j) => {
        const unit = (
          <TokenUnit x={rowX + j * (TOKEN_SIZE + TOKEN_GAP)} y={tokenY} width={TOKEN_SIZE} height={TOKEN_SIZE} tone="indigo" modality={token.modality} signal={token.signal} />
        );
        if (j < discarded) {
          const spec = specs[j];
          const ejectStyle: StoryStyle = {
            '--delay': `${j * EJECT_STAGGER_MS}ms`,
            '--ex': `${spec.dx}px`,
            '--ey': `${spec.dy}px`,
            animationName: KF.eject[pairIndex],
          };
          return (
            <g key={`${token.modality}-${j}`} className={styles.eject} style={ejectStyle}>
              {unit}
            </g>
          );
        }
        const survivorStyle: StoryStyle = {
          '--ey': `${survivorRisePx(pairIndex)}px`,
          animationName: KF.survivor[pairIndex],
        };
        return (
          <g key={`${token.modality}-${j}`} className={styles.survivor} style={survivorStyle}>
            {unit}
          </g>
        );
      })}
      <g className={styles.summary} style={{ animationName: KF.summary[pairIndex] }}>
        <ContextBandShape x={STACK_X} y={y} w={STACK_W} spec={summary} />
        <ContextBandLabel x={STACK_X} y={y} w={STACK_W} spec={summary} />
        {Array.from({ length: survivors }, (_, i) => (
          <TokenUnit
            key={i}
            x={summaryRowX + i * (TOKEN_SIZE + TOKEN_GAP)}
            y={summaryTokenY}
            width={TOKEN_SIZE}
            height={TOKEN_SIZE}
            tone="violet"
            modality="text"
            signal="compressed"
          />
        ))}
      </g>
    </>
  );
}

// The stack renders recursively: every reduction event wraps the bands below
// it in a slide group, so translateY offsets compose cumulatively as each
// event frees space.
function renderStackFrom(index: number): React.ReactNode {
  if (index >= STACK_BANDS.length) return null;
  const band = STACK_BANDS[index];
  const y = BAND_Y0 + bandTop(index);
  const event = STACK_EVENTS.find((e) => e.band === index);
  if (!event) {
    return (
      <g key={band.label}>
        <ContextBandShape x={STACK_X} y={y} w={STACK_W} spec={band} />
        <ContextBandLabel x={STACK_X} y={y} w={STACK_W} spec={band} />
        {renderStackFrom(index + 1)}
      </g>
    );
  }
  const pairIndex = SUMMARY_PAIRS.findIndex((p) => p.thread === index);
  const slideStyle: StoryStyle = {
    '--slide': `${event.freed}px`,
    animationName: event.kind === 'delete' ? KF.slideDelete : KF.slideShrink[pairIndex],
  };
  return (
    <g key={band.label}>
      {event.kind === 'delete' ? (
        <DeleteBand band={band} y={y} />
      ) : (
        <ThreadBand band={band} y={y} pairIndex={pairIndex} />
      )}
      <g className={styles.slide} style={slideStyle}>
        {renderStackFrom(index + 1)}
      </g>
    </g>
  );
}

// Freed space collects at the bottom of the same window, labeled by its
// purpose; the band fades in for the result hold and breathes.
function Headroom() {
  const y = BAND_Y1 - HEADROOM_H;
  const band: CompactionBand = {
    label: HEADROOM_LABEL,
    h: HEADROOM_H,
    dashed: true,
    note: HEADROOM_NOTE,
    labelFill: 'var(--text-heading)',
  };
  return (
    <g className={styles.headroom} style={{ animationName: KF.headroom }}>
      <ContextBandShape x={STACK_X} y={y} w={STACK_W} spec={band} />
      <ContextBandLabel x={STACK_X} y={y} w={STACK_W} spec={band} />
    </g>
  );
}

// Static fallback (reduced motion): the compacted stack, with the freed space
// restacked as faint outlines of what used to occupy it — deletion on disk,
// threads folded into their summary tiles.
function StaticScene() {
  let ledgerY = BAND_Y1 - HEADROOM_H;
  return (
    <g className={styles.staticScene}>
      <ContextBandShape x={STACK_X} y={finalTop(0)} w={STACK_W} spec={STACK_BANDS[0]} />
      <ContextBandLabel x={STACK_X} y={finalTop(0)} w={STACK_W} spec={STACK_BANDS[0]} />
      {SUMMARY_PAIRS.map((pair, k) => {
        const summary = summaryBand(k);
        const summaryRowX = STACK_X + STACK_W - 10 - (pair.survivors * TOKEN_SIZE + (pair.survivors - 1) * TOKEN_GAP);
        return (
          <g key={pair.label}>
            <ContextBandShape x={STACK_X} y={finalTop(pair.thread)} w={STACK_W} spec={summary} />
            <ContextBandLabel x={STACK_X} y={finalTop(pair.thread)} w={STACK_W} spec={summary} />
            {Array.from({ length: pair.survivors }, (_, i) => (
              <TokenUnit
                key={i}
                x={summaryRowX + i * (TOKEN_SIZE + TOKEN_GAP)}
                y={finalTop(pair.thread) + SUMMARY_H / 2 - TOKEN_SIZE / 2}
                width={TOKEN_SIZE}
                height={TOKEN_SIZE}
                tone="violet"
                modality="text"
                signal="compressed"
              />
            ))}
          </g>
        );
      })}
      <ContextBandShape x={STACK_X} y={finalTop(STACK_BANDS.length - 1)} w={STACK_W} spec={STACK_BANDS[STACK_BANDS.length - 1]} />
      <ContextBandLabel x={STACK_X} y={finalTop(STACK_BANDS.length - 1)} w={STACK_W} spec={STACK_BANDS[STACK_BANDS.length - 1]} />
      {STATIC_LEDGER.map((entry) => {
        const ly = ledgerY;
        ledgerY += entry.h;
        const spec: CompactionBand = { label: entry.label, h: entry.h, dashed: true, labelAlign: 'left' };
        return (
          <g key={entry.label} opacity={0.45}>
            <ContextBandShape x={STACK_X} y={ly} w={STACK_W} spec={spec} />
            <ContextBandLabel x={STACK_X} y={ly} w={STACK_W} spec={spec} />
          </g>
        );
      })}
    </g>
  );
}

// Legend doubles as the archive story: deleted traces persist outside the
// call. Split into two halves so each joins its act's spotlight.
function Legend() {
  return (
    <>
      <text className={styles.legend} style={{ animationName: KF.legendDeleted }} x={VW / 2 - 10} y={272} textAnchor="end" fontSize={9.5} fontFamily={MONO_KEYWORD} fill="var(--text-muted)">
        deleted pairs stay on disk ·
      </text>
      <text className={styles.legend} style={{ animationName: KF.legendSummary }} x={VW / 2 + 10} y={272} textAnchor="start" fontSize={9.5} fontFamily={MONO_KEYWORD} fill="var(--text-muted)">
        summaries are lossy — one by one
      </text>
    </>
  );
}

const ARIA_LABEL =
  'One context window compacted in place. Two stale tool call and result pairs collapse and vanish — kept on disk, never sent. The decision thread, debug thread, and next-step state are summarized one by one: most of each thread\u2019s tokens eject from the window while a compressed minority survives inside a short synthetic summary — summarization is lossy. The stable prefix and recent tail stay verbatim. The freed space collects at the bottom of the window, free for the next request; new context enters there.';

export default function CompactionLineDiagram() {
  const mounted = useMounted();
  if (!mounted) return <div style={{ minHeight: 280 }} />;

  const rootStyle: RootStyle = {
    display: 'block',
    maxWidth: `${VW}px`,
    margin: '0 auto',
    '--cycle-ms': `${COMPACTION_CYCLE_MS}ms`,
  };

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      role="img"
      aria-label={ARIA_LABEL}
      xmlns="http://www.w3.org/2000/svg"
      style={rootStyle}
    >
      <TimingStyles />
      <text x={STACK_X} y={24} fontSize={10} fontFamily={MONO_KEYWORD} fill="var(--text-muted)" letterSpacing="0.06em">
        CONTEXT WINDOW
      </text>
      <rect x={52} y={32} width={316} height={226} rx={0} fill="none" stroke="var(--border-default)" strokeWidth={1} />
      <g className={styles.animatedScene}>
        {renderStackFrom(0)}
        <Headroom />
      </g>
      <StaticScene />
      <Legend />
    </svg>
  );
}
