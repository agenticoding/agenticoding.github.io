import React from 'react';
import clsx from 'clsx';
import { NotoEmoji } from './ActorNodes';
import styles from './TokenPredictionDiagram.module.css';

const CONTEXT_TOKENS = ['The', 'cat', 'sat', 'on', 'the'] as const;
const PREDICTED_TOKEN = '"mat"';

// ── Layout (8px grid, viewBox 440×200) ────────────────────────────────────
const VW = 440;
const VH = 200;

// Left column — context token pills
const PILL_X = 24;
const PILL_W = 96;
const PILL_H = 24;
const PILL_RX = 4;
const PILL_YS = [24, 56, 88, 120, 152] as const;
const PILL_CYS = [36, 68, 100, 132, 164] as const; // center y of each pill
const PILL_RIGHT = PILL_X + PILL_W; // 120

// Vertical spine
const SPINE_X = 136; // 16px stub gap from PILL_RIGHT

// LLM squircle node
const LLM_X = 184;
const LLM_Y = 68;
const LLM_SIZE = 64;
const LLM_RX = 12;
const LLM_CX = LLM_X + LLM_SIZE / 2; // 216
const LLM_CY = LLM_Y + LLM_SIZE / 2; // 100

// Output token pill (larger = emphasis)
const OUT_X = 344;
const OUT_Y = 76;
const OUT_W = 72;
const OUT_H = 48;
const OUT_RX = 8;
const OUT_CX = OUT_X + OUT_W / 2; // 380
const OUT_CY = OUT_Y + OUT_H / 2; // 100

export default function TokenPredictionDiagram() {
  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      role="img"
      aria-label={`Token prediction: the LLM uses all ${CONTEXT_TOKENS.length} context tokens to predict the next token`}
      className={styles.diagram}
    >
      <defs>
        <marker
          id="tpd-arr"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" fill="var(--visual-violet)" />
        </marker>
      </defs>

      {/* ── Labels ────────────────────────────────────────────────────────── */}
      <text
        x={PILL_X + PILL_W / 2}
        y={PILL_YS[0] - 8}
        textAnchor="middle"
        fontFamily="var(--font-mono-spec)"
        fontSize="9"
        fill="var(--text-muted)"
        letterSpacing="0.3"
      >
        context window
      </text>
      <text
        x={LLM_CX}
        y={LLM_Y - 8}
        textAnchor="middle"
        fontFamily="var(--font-mono-spec)"
        fontSize="9"
        fill="var(--visual-violet)"
      >
        LLM
      </text>
      <text
        x={OUT_CX}
        y={OUT_Y - 8}
        textAnchor="middle"
        fontFamily="var(--font-mono-keyword)"
        fontSize="9"
        fill="var(--visual-violet)"
      >
        predicted
      </text>

      {/* ── Context token pills ──────────────────────────────────────────── */}
      {CONTEXT_TOKENS.map((token, i) => (
        <g key={i}>
          <rect
            x={PILL_X}
            y={PILL_YS[i]}
            width={PILL_W}
            height={PILL_H}
            rx={PILL_RX}
            fill="var(--visual-bg-neutral)"
            stroke="var(--border-subtle)"
            strokeWidth="1"
          />
          <NotoEmoji codepoint="1fa99" x={PILL_X + 4} y={PILL_CYS[i] - 8} size={16} />
          <text
            x={PILL_X + PILL_W / 2 + 10}
            y={PILL_CYS[i]}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="var(--font-mono-keyword)"
            fontSize="9"
            fill="var(--text-muted)"
          >
            {token}
          </text>
        </g>
      ))}

      {/* ── Short stubs: pill right edge → spine ─────────────────────────── */}
      {PILL_CYS.map((cy, i) => (
        <line
          key={i}
          x1={PILL_RIGHT}
          y1={cy}
          x2={SPINE_X}
          y2={cy}
          stroke="var(--visual-violet)"
          strokeWidth="2"
        />
      ))}

      {/* ── Vertical spine ───────────────────────────────────────────────── */}
      <line
        x1={SPINE_X}
        y1={PILL_CYS[0]}
        x2={SPINE_X}
        y2={PILL_CYS[4]}
        stroke="var(--visual-violet)"
        strokeWidth="2"
      />

      {/* ── Arrow: spine → LLM ──────────────────────────────────────────── */}
      <line
        x1={SPINE_X}
        y1={LLM_CY}
        x2={LLM_X - 2}
        y2={LLM_CY}
        stroke="var(--visual-violet)"
        strokeWidth="2"
        markerEnd="url(#tpd-arr)"
      />

      {/* ── LLM node ─────────────────────────────────────────────────────── */}
      {/* idle-gear-spin is a global class (custom.css) so the keyframe lives once;
          styles.gear sets transform-origin for the correct pivot center. */}
      <g className={clsx(styles.gear, 'idle-gear-spin')}>
        <NotoEmoji codepoint="2699" x={LLM_X + 8} y={LLM_Y + 8} size={48} />
      </g>

      {/* ── Arrow: LLM → output ─────────────────────────────────────────── */}
      <line
        x1={LLM_X + LLM_SIZE + 2}
        y1={LLM_CY}
        x2={OUT_X - 2}
        y2={OUT_CY}
        stroke="var(--visual-violet)"
        strokeWidth="2"
        markerEnd="url(#tpd-arr)"
      />

      {/* ── Output token pill (large, emphasized) ───────────────────────── */}
      <g>
        <rect
          x={OUT_X}
          y={OUT_Y}
          width={OUT_W}
          height={OUT_H}
          rx={OUT_RX}
          fill="var(--visual-bg-violet)"
          stroke="var(--visual-violet)"
          strokeWidth="1"
        />
        <NotoEmoji codepoint="1fa99" x={OUT_CX - 10} y={OUT_CY - 18} size={20} />
        <text
          x={OUT_CX}
          y={OUT_CY + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-mono-keyword)"
          fontSize="11"
          fontWeight="600"
          fill="var(--visual-violet)"
        >
          {PREDICTED_TOKEN}
        </text>
      </g>
    </svg>
  );
}
