import { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './ContextSqueezeDiagram.module.css';
import {
  ContextRegionScene,
  ContextZoneStrip,
  type RegionTile,
  // Explicit .tsx: on case-insensitive filesystems './ContextRegions' would
  // resolve to the sibling model file contextRegions.ts.
} from './ContextRegions.tsx';
import {
  BIG_FILE_WEIGHT,
  LOOP_TICKS,
  SMALL_FILE_WEIGHT,
  TURN_COUNT,
  TURN_INTERVAL_MS,
  squeezeRows,
  turnsAtTick,
  windowFill,
  type SqueezeContextRow,
} from './contextSqueezeModel';

// Context Squeeze — where the user prompt LANDS as conversation context
// builds after it, as a function of context-file size (user directive). Two
// panels play one shared conversation timeline in sync; only the startup
// file differs. The prompt starts at the recency edge in both. As turns
// append below it, the prompt travels up the stack: with a small file the
// turns outweigh the prefix and the prompt settles at the primacy edge;
// with a big file the fat prefix pins it in the dead middle — the valley.
//
// Built on the ContextRegions foundation (the MCP figure idiom): each tick
// is a discrete row-state change on an interval and the foundation's flex
// transitions animate the pushing/resizing; the measured zone backdrop
// tracks the content extent automatically. Tiles stay NEUTRAL — the colored
// zone bands carry the attention story (fillRatio shades them via the shared
// attention model); only the accent encodes type. The prompt keeps a
// persistent outline so it stays findable while traveling.
//
// Idle loop, no interaction: startup hold → append TURN_COUNT turns → hold
// the outcome (verdict lines fade in) → reset. Reduced motion renders the
// complete end-state statically: the initial tick IS the end of the loop
// and no interval ever starts.

const STACK_HEIGHT = 440;

// Accent-only type grammar (tiles themselves neutral): cyan = harness
// payload (system/tools/file), emphasis = the human prompt, indigo = turn
// data appended by the conversation.
function accentFor(row: SqueezeContextRow): string | undefined {
  if (row.spacer) return undefined;
  if (row.id === 'prompt') return 'var(--border-emphasis)';
  if (row.id.startsWith('turn-')) return 'var(--visual-indigo)';
  return 'var(--visual-cyan)';
}

function toTile(row: SqueezeContextRow): RegionTile {
  return {
    ...row,
    accent: accentFor(row),
    // The prompt travels the whole stack — the outline keeps it findable.
    outlineColor: row.id === 'prompt' ? 'var(--border-emphasis)' : undefined,
    labelFontFamily: 'var(--font-mono-spec)',
  };
}

type PanelSpec = {
  id: string;
  title: string;
  fileWeight: number;
  verdict: string;
  tone: 'success' | 'error';
};

const PANELS: readonly PanelSpec[] = [
  {
    id: 'small',
    title: 'SMALL FILE — AGENTS.md · 2K',
    fileWeight: SMALL_FILE_WEIGHT,
    verdict: 'prompt keeps the primacy edge',
    tone: 'success',
  },
  {
    id: 'big',
    title: 'BIG FILE — AGENTS.md · 20K',
    fileWeight: BIG_FILE_WEIGHT,
    verdict: 'prompt buried in the dead middle',
    tone: 'error',
  },
];

// One loop clock for both panels — the turns append in sync by construction.
// Starts at the END of the loop: SSR and reduced-motion render the complete
// end-state (all turns present, verdicts visible); the effect rewinds to
// startup only when motion is allowed.
function useSqueezeTick(): number {
  const [tick, setTick] = useState(LOOP_TICKS - 1);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setTick(0);
    const interval = window.setInterval(
      () => setTick((current) => (current + 1) % LOOP_TICKS),
      TURN_INTERVAL_MS
    );
    return () => window.clearInterval(interval);
  }, []);
  return tick;
}

function SqueezePanel({ spec, turns }: { spec: PanelSpec; turns: number }) {
  const rows = squeezeRows(spec.fileWeight, turns);
  const fill = windowFill(rows);
  const outcome = turns === TURN_COUNT;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>{spec.title}</div>
      <ContextRegionScene
        rows={rows.map(toTile)}
        fallbackHeight={STACK_HEIGHT}
        fillRatio={fill}
        className={styles.stackClip}
        companionClassName={styles.zoneStrip}
        renderCompanion={(frame) => (
          <ContextZoneStrip
            fillRatio={fill}
            frame={frame}
            ariaLabel={`Attention zones for the ${spec.title} context`}
          />
        )}
      />
      <div
        className={clsx(
          styles.verdict,
          spec.tone === 'success' ? styles.verdictSuccess : styles.verdictError,
          outcome && styles.verdictVisible
        )}
      >
        {spec.verdict}
      </div>
    </section>
  );
}

export default function ContextSqueezeDiagram() {
  const tick = useSqueezeTick();
  const turns = turnsAtTick(tick);

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        {PANELS.map((spec) => (
          <SqueezePanel key={spec.id} spec={spec} turns={turns} />
        ))}
      </div>
      <p className={styles.liveRegion} aria-live="polite">
        Both panels start identically: system prompt, tools, a context file, and
        the user prompt at the recency edge. The same eight turns then append
        below the prompt. With the small file the prompt travels up to the
        primacy edge and keeps strong attention; with the big file it stays
        pinned in the middle zone, where attention collapses.
      </p>
    </div>
  );
}
