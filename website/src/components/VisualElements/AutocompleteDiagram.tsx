import React from 'react';
import styles from './AutocompleteDiagram.module.css';

// ── Data ──────────────────────────────────────────────────────────────────────
const CHIPS = ['The', 'cat', 'sat', 'on', 'the'] as const;
const CANDIDATES = [
  { pct: 42, label: 'mat',   selected: true  },
  { pct: 23, label: 'floor', selected: false },
  { pct: 14, label: 'rug',   selected: false },
  { pct:  8, label: 'sofa',  selected: false },
] as const;

// ── Layout (8px grid, viewBox 560×240) ───────────────────────────────────────
const VW = 560;
const VH = 240;

// Token ribbon
const RIBBON_X  = 20;
const CHIP_W    = 42;
const CHIP_H    = 28;
const CHIP_RX   = 4;
const CHIP_GAP  = 4;
const CHIP_STRIDE = CHIP_W + CHIP_GAP; // 46
const RIBBON_Y  = 52;

// Cursor — 3px-wide rect right of last chip
const CURSOR_W  = 3;
const CURSOR_H  = 20;
const CURSOR_X  = RIBBON_X + CHIPS.length * CHIP_STRIDE; // 296
const CURSOR_Y  = RIBBON_Y + (CHIP_H - CURSOR_H) / 2;   // 56

// Connector — dashed vertical from cursor bottom to dropdown
const CONN_X    = CURSOR_X + CURSOR_W / 2;               // 297.5
const CONN_Y1   = RIBBON_Y + CHIP_H + 2;                 // 82
const CONN_Y2   = 108;

// Probability dropdown
const DROP_Y    = 112;
const ROW_H     = 22;
const ROW_GAP   = 6;
const ROW_STRIDE = ROW_H + ROW_GAP;    // 28
const MAX_PCT   = 42;                  // scale bars to top candidate
const PCT_RIGHT_X = 280;
const BAR_X     = 286;
const MAX_BAR_W = 104;
const BAR_H     = 14;
const BAR_RX    = 2;
const BAR_Y_OFF = (ROW_H - BAR_H) / 2; // 4
const TOKEN_X   = BAR_X + MAX_BAR_W + 8; // 398

// Label positions
const RIBBON_LABEL_X = RIBBON_X + (CHIPS.length * CHIP_STRIDE - CHIP_GAP) / 2; // 156
const DROP_LABEL_X   = (BAR_X + TOKEN_X) / 2;                                  // 342
const DROP_LABEL_Y   = DROP_Y - 6;

export default function AutocompleteDiagram() {
  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      role="img"
      aria-label="LLM as token autocomplete: five context tokens lead to a probability distribution over full-word next-token candidates"
      className={styles.diagram}
    >
      {/* ── Labels ────────────────────────────────────────────────────────── */}
      <text
        x={RIBBON_LABEL_X}
        y={RIBBON_Y - 10}
        textAnchor="middle"
        fontFamily="var(--font-mono-spec)"
        fontSize="9"
        fill="var(--text-muted)"
        letterSpacing="0.3"
      >
        context window
      </text>
      <text
        x={DROP_LABEL_X}
        y={DROP_LABEL_Y}
        textAnchor="middle"
        fontFamily="var(--font-mono-spec)"
        fontSize="9"
        fill="var(--visual-violet)"
        letterSpacing="0.3"
      >
        next token
      </text>

      {/* ── Token ribbon ─────────────────────────────────────────────────── */}
      {CHIPS.map((token, i) => {
        const cx = RIBBON_X + i * CHIP_STRIDE;
        return (
          <g key={i}>
            <rect
              x={cx}
              y={RIBBON_Y}
              width={CHIP_W}
              height={CHIP_H}
              rx={CHIP_RX}
              fill="var(--surface-raised)"
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
            <text
              x={cx + CHIP_W / 2}
              y={RIBBON_Y + CHIP_H / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-mono)"
              fontSize="12"
              fill="var(--text-base)"
            >
              {token}
            </text>
          </g>
        );
      })}

      {/* ── Cursor ───────────────────────────────────────────────────────── */}
      <rect
        x={CURSOR_X}
        y={CURSOR_Y}
        width={CURSOR_W}
        height={CURSOR_H}
        fill="var(--visual-violet)"
        className="idle-cursor-blink"
      />

      {/* ── Connector ────────────────────────────────────────────────────── */}
      <line
        x1={CONN_X}
        y1={CONN_Y1}
        x2={CONN_X}
        y2={CONN_Y2}
        stroke="var(--border-subtle)"
        strokeWidth="1"
        strokeDasharray="4 2"
      />

      {/* ── Probability rows ─────────────────────────────────────────────── */}
      {CANDIDATES.map(({ pct, label, selected }, i) => {
        const ry  = DROP_Y + i * ROW_STRIDE;
        const bw  = Math.round((pct / MAX_PCT) * MAX_BAR_W);
        const barFill   = selected ? 'var(--visual-bg-violet)' : 'var(--visual-bg-neutral)';
        const barStroke = selected ? 'var(--visual-violet)'    : 'var(--border-subtle)';
        const txtFill   = selected ? 'var(--visual-violet)'    : 'var(--text-muted)';
        const tokenFont = selected ? 'var(--font-mono-ai)'     : 'var(--font-mono)';
        return (
          <g key={i}>
            {/* Percentage */}
            <text
              x={PCT_RIGHT_X}
              y={ry + ROW_H / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontFamily="var(--font-mono-keyword)"
              fontSize="11"
              fill={txtFill}
            >
              {pct}%
            </text>

            {/* Bar */}
            <rect
              x={BAR_X}
              y={ry + BAR_Y_OFF}
              width={bw}
              height={BAR_H}
              rx={BAR_RX}
              fill={barFill}
              stroke={barStroke}
              strokeWidth="1"
            />

            {/* Candidate token */}
            <text
              x={TOKEN_X}
              y={ry + ROW_H / 2}
              dominantBaseline="middle"
              fontFamily={tokenFont}
              fontSize="12"
              fontWeight={selected ? '600' : '400'}
              fill={txtFill}
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* ── Ellipsis ─────────────────────────────────────────────────────── */}
      <text
        x={BAR_X + MAX_BAR_W / 2}
        y={DROP_Y + CANDIDATES.length * ROW_STRIDE + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-mono-keyword)"
        fontSize="11"
        fill="var(--text-muted)"
      >
        ···
      </text>
    </svg>
  );
}
