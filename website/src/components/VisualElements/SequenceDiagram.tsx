import React, { useEffect, useRef, useState } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './SequenceDiagram.module.css';
import { useAnimationContext } from '../animations/ScrollDrivenFigure';
import { useMounted } from '../../hooks/useMounted';
import { scrollElementRevealProgress } from '../../hooks/scrollElementReveal';
import { Ghost, ghostClass } from './Ghost';
import { CONNECTOR_STYLE, GHOST_CONNECTOR_STYLE, ARROWHEAD_POINTS, ARROWHEAD_POINTS_REV } from './diagramConstants';

// Fixed layout constants (all in SVG user units ≈ CSS px after ResizeObserver)
const HEADER_H   = 96;   // height of sticky HTML header zone (CSS px) — 80 content + 16 bottom pad (--space-2)
const ROW_STEP   = 48;
const NOTE_H_1   = 40;
const NOTE_H_2   = 56;
const NOTE_RX    = 6;
const COL_ICON_SIZE = 52;  // drives column spacing; no SVG node rect is rendered at this size
const EMOJI_SIZE = 36;
const PAD_H      = 16;
const PAD_V_TOP  = 24;  // ensures ≥16px gap between sticky header and first row
const PAD_V_BOT  = 20;
const GHOST_HANDOFF_PROGRESS = 0.12;

type VisualColor = 'cyan' | 'indigo' | 'violet' | 'magenta' | 'neutral' | 'warning' | 'success' | 'error' | 'rose' | 'lime';

export type Column = {
  id: string;
  label: string;
  emoji: string;        // NotoEmoji codepoint e.g. "1f916"
  color?: VisualColor;  // maps to var(--visual-{color})
};

export type Row =
  | { type: 'note';    on: string; text: string; subtext?: string }
  | { type: 'message'; from: string; to: string; label: string; sublabel?: string; dashed?: boolean };

interface Props {
  columns: Column[];
  rows: Row[];
  ariaLabel?: string;
}

export default function SequenceDiagram({ columns, rows, ariaLabel }: Props) {
  const emojiBase = useBaseUrl('/img/emoji');
  const { phase, phaseEnd, earlyStart } = useAnimationContext();
  const mounted = useMounted();

  // Measure container so viewBox width = container CSS width.
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewW, setViewW] = useState<number | null>(null);
  const [viewportSize, setViewportSize] = useState(() => ({
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
  }));
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = (w: number) => setViewW(Math.max(320, w));
    update(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => update(entry.contentRect.width));
    ro.observe(el);
    const onResize = () => setViewportSize({ height: window.innerHeight, width: window.innerWidth });
    window.addEventListener('resize', onResize, { passive: true });
    return () => { ro.disconnect(); window.removeEventListener('resize', onResize); };
  }, []);


  if (viewW === null) {
    return <div ref={containerRef} className={styles.wrapper} style={{ minHeight: 96 }} />;
  }

  const nc       = columns.length;
  const nodeHalf = COL_ICON_SIZE / 2;
  const NOTE_FRAC = 0.8;
  // Edge-safe spacing: pick the tighter of the default (respects PAD_H) and
  // the edge-safe formula that prevents notes on the outermost columns from
  // being clipped by the SVG viewBox.
  const colSpacing = nc > 1
    ? Math.min(
        (viewW - 2 * PAD_H - COL_ICON_SIZE) / (nc - 1),               // default
        (viewW - COL_ICON_SIZE) / (nc - 1 + NOTE_FRAC),                // edge-safe
      )
    : viewW - 2 * PAD_H;
  const padH = nc > 1
    ? (viewW - COL_ICON_SIZE - (nc - 1) * colSpacing) / 2
    : PAD_H;
  const colCenter = (i: number) =>
    nc === 1
      ? padH + (viewW - 2 * padH) / 2
      : padH + nodeHalf + i * colSpacing;

  const colX = (id: string) => {
    const i = columns.findIndex((c) => c.id === id);
    if (i < 0) { console.error(`SequenceDiagram: unknown column id "${id}"`); return 0; }
    return colCenter(i);
  };

  const noteW = Math.max(80, Math.min(colSpacing * NOTE_FRAC, 300));

  // SVG body only covers rows (no header zone)
  const bodyH = PAD_V_TOP + rows.length * ROW_STEP + PAD_V_BOT;
  const rowY  = (i: number) => PAD_V_TOP + i * ROW_STEP + ROW_STEP / 2;

  return (
    <div ref={containerRef} className={styles.wrapper}>
      {/* ── Sticky column headers (HTML, not SVG) ────────────────────────── */}
      <div className={styles.stickyHeader} style={{ height: HEADER_H }}>
        {columns.map((col, i) => {
          const cx    = colCenter(i);
          const color = col.color ?? 'neutral';
          return (
            <div
              key={col.id}
              className={styles.columnItem}
              style={{ left: cx, transform: 'translateX(-50%)' }}
            >
              {/* <img> not NotoEmoji: this is an HTML context, not SVG */}
              <img
                src={`${emojiBase}/u${col.emoji}.svg`}
                alt=""
                className={styles.columnEmoji}
                width={EMOJI_SIZE}
                height={EMOJI_SIZE}
              />
              <span
                className={styles.columnLabel}
                style={{ color: `var(--visual-${color})` }}
              >{col.label}</span>
            </div>
          );
        })}
      </div>

      {/* ── SVG body: lifelines + rows ───────────────────────────────────── */}
      <svg
        viewBox={`0 0 ${viewW} ${bodyH}`}
        width="100%"
        height="auto"
        style={{ display: 'block' }}
        role="img"
        aria-label={ariaLabel ?? 'Sequence diagram'}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Lifelines ─────────────────────────────────────────────────── */}
        {columns.map((col, i) => (
          <line
            key={`ll-${col.id}`}
            x1={colCenter(i)} y1={PAD_V_TOP}
            x2={colCenter(i)} y2={bodyH - PAD_V_BOT}
            stroke="var(--border-subtle)"
            strokeWidth={1}
            strokeDasharray="6 4"
          />
        ))}

        {/* ── Rows — scroll-animated with ghost placeholders ────────────── */}
        {rows.map((row, i) => {
          const y = rowY(i);
          const rowHeight = row.type === 'note'
            ? (row.subtext ? NOTE_H_2 : NOTE_H_1)
            : ROW_STEP;
          const { progress } = scrollElementRevealProgress({
            phase,
            phaseEnd,
            earlyStart,
            viewportHeight: viewportSize.height,
            figureHeight: HEADER_H + bodyH,
            elementTop: HEADER_H + y - rowHeight / 2,
            elementHeight: rowHeight,
            settleAtViewportFraction: viewportSize.width < 768 ? 0.6 : 0.5,
          });
          // Keep the placeholder around until the real row has enough opacity
          // to read as present; otherwise the handoff flickers through empty space.
          const visible = mounted && progress >= GHOST_HANDOFF_PROGRESS;
          const rowStyle: React.CSSProperties = { opacity: mounted ? progress : 0 };

          if (row.type === 'note') {
            const hasSubtext = Boolean(row.subtext);
            const noteH  = hasSubtext ? NOTE_H_2 : NOTE_H_1;
            const colIdx = columns.findIndex(c => c.id === row.on);
            if (colIdx < 0) { console.error(`SequenceDiagram: unknown column id "${row.on}"`); return null; }
            const cx    = colCenter(colIdx);
            const color = columns[colIdx].color ?? 'neutral';
            return (
              <React.Fragment key={`row-${i}`}>
                {/* Ghost placeholder */}
                <Ghost
                  x={cx - noteW / 2} y={y - noteH / 2}
                  width={noteW} height={noteH} rx={NOTE_RX}
                  fill={`var(--visual-bg-${color})`}
                  stroke={`var(--visual-${color})`}
                  mounted={mounted} reached={visible}
                />
                {/* Real row */}
                <g className={styles.row} style={rowStyle}>
                  <rect
                    x={cx - noteW / 2} y={y - noteH / 2}
                    width={noteW} height={noteH} rx={NOTE_RX}
                    fill={`var(--visual-bg-${color})`}
                    stroke={`var(--visual-${color})`}
                    strokeWidth={1}
                  />
                  <text
                    x={cx} y={hasSubtext ? y - 8 : y}
                    fill="var(--text-body)"
                    dominantBaseline="central"
                    style={{ fontFamily: 'var(--font-mono-spec)', fontSize: 'var(--text-base)' }}
                    fontWeight={500} textAnchor="middle"
                  >{row.text}</text>
                  {hasSubtext && (
                    <text
                      x={cx} y={y + 8}
                      fill="var(--text-body)"
                      dominantBaseline="central"
                      style={{ fontFamily: 'var(--font-mono-spec)', fontSize: 'var(--text-sm)' }}
                      textAnchor="middle"
                    >{row.subtext}</text>
                  )}
                </g>
              </React.Fragment>
            );
          }

          // message row
          const x1      = colX(row.from);
          const x2      = colX(row.to);
          if (x1 === x2) { console.error(`SequenceDiagram: self-message "${row.label}" (from === to: "${row.from}") is not supported`); return null; }
          const midX    = (x1 + x2) / 2;
          const goRight = x2 > x1;
          const tipX    = goRight ? x2 - 8 : x2 + 8;  // retract by polygon width so arrowhead tip aligns with lifeline

          return (
            <React.Fragment key={`row-${i}`}>
              {/* Ghost placeholder */}
              <line
                x1={x1} y1={y} x2={tipX} y2={y}
                className={ghostClass(mounted, visible)}
                {...GHOST_CONNECTOR_STYLE}
              />
              {/* Real row */}
              <g className={styles.row} style={rowStyle}>
                <line
                  x1={x1} y1={y} x2={tipX} y2={y}
                  {...CONNECTOR_STYLE}
                  strokeDasharray={row.dashed ? '4 3' : undefined}
                  className={styles.arrowLine}
                />
                <polygon
                  points={goRight ? ARROWHEAD_POINTS : ARROWHEAD_POINTS_REV}
                  transform={`translate(${x2},${y})`}
                  className={styles.arrowHead}
                />
                <text
                  x={midX} y={y - 8}
                  fill="var(--text-body)"
                  style={{ fontFamily: 'var(--font-mono-spec)', fontSize: 'var(--text-base)' }}
                  fontWeight={500} textAnchor="middle"
                >{row.label}</text>
                {row.sublabel && (
                  <text
                    x={midX} y={y + 16}
                    fill="var(--text-muted)"
                    style={{ fontFamily: 'var(--font-mono-spec)', fontSize: 'var(--text-sm)' }}
                    textAnchor="middle"
                  >{row.sublabel}</text>
                )}
              </g>
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
}
