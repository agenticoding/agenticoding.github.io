import React, { useRef } from 'react';
import clsx from 'clsx';
import styles from './ContextBiasDiagram.module.css';
import shared from './diagram.module.css';
import { EmojiImage } from './ActorNodes';
import { EMOJI } from './emojiAssets';
import { Ghost } from './Ghost';
import { useStaticAnimationPhase } from '../../hooks/useStaticAnimationPhase';
import { useStrokeDraw } from '../../hooks/useStrokeDraw';
import { useMounted } from '../../hooks/useMounted';
import {
  CONNECTOR_STYLE,
  ARROWHEAD_POINTS_SM,
  arrowOpacity,
} from './diagramConstants';

// ── Layout ───────────────────────────────────────────────────────────────────
// ViewBox 640×484
// Left column center x=160, right column center x=480, divider x=320
// Both stacks bottom-align at y=312
//   Left stack:  top y=32,  height 280px (9 entries × 28px + code 24px + 8 gaps × 4px)
//   Right stack: top y=168, height 144px (2×28 + code 80px + 2 gaps × 4px)
// Agent row:   y=336, emoji size 40 → bottom y=376
// Verdict row: y=400, emoji size 40 → bottom y=440
// Verdict text: y=456, y=472

const SX_L = 26; // left stack x
const SX_R = 346; // right stack x
const SW = 268; // stack width
const CX_L = 160; // left column center x
const CX_R = 480; // right column center x
const STACK_BOT = 312;
const AGENT_Y = 336;
const VERDICT_Y = 400;
const EMOJI_SIZE = 40;

// ── Entry layout (8px grid) ─────────────────────────────────────────────────
const ENTRY_H = 28; // standard row height
const ENTRY_H_SM = 24; // compact code row (left stack)
const ENTRY_H_LG = 80; // multi-line code block (right stack)
const LABEL_DY = 4; // baseline nudge below center
const LABEL_X = 8; // role label x inset from entry edge
const PREVIEW_X = 38; // preview text x inset from entry edge
const CODE_LINE_H = 12; // multi-line code line spacing
const FONT_SM = 9; // entry text size
const FONT_MD = 10; // header / verdict text size

// ── Role config ───────────────────────────────────────────────────────────────
// StackEntryRole is distinct from the shared Role type in contextStreamData.ts:
// 'tool' here represents a tool-call entry in the visual stack (not 'tool_result'),
// and 'code' is a special display role for inline code blocks.
type StackEntryRole = 'system' | 'user' | 'agent' | 'tool' | 'code';
type ElectricTone = 'warning' | 'error';

const ROLE_COLOR: Record<StackEntryRole, string> = {
  system: 'var(--visual-cyan)',
  user: 'var(--visual-neutral)',
  agent: 'var(--visual-magenta)',
  tool: 'var(--visual-indigo)',
  code: 'var(--visual-cyan)',
};

const ROLE_BG: Record<StackEntryRole, string> = {
  system: 'var(--visual-bg-cyan)',
  user: 'var(--visual-bg-neutral)',
  agent: 'var(--visual-bg-magenta)',
  tool: 'var(--visual-bg-indigo)',
  code: 'var(--visual-bg-cyan)',
};

const ROLE_LABEL: Record<StackEntryRole, string> = {
  system: 'SYS',
  user: 'USR',
  agent: 'AGT',
  tool: 'TOOL',
  code: 'CODE',
};

// ── Stack entry data ───────────────────────────────────────────────────────────
interface StackEntry {
  role: StackEntryRole;
  y: number;
  h: number;
  threshold: number;
  preview?: string;
  lines?: string[];
}

// 9 entries, 280px total: 8×ENTRY_H + 1×ENTRY_H_SM + 8 gaps×ENTRY_GAP = 280
// Left entries span 0.04–0.648 (interval 0.076 = 69% wider than before)
const LEFT_ENTRIES: StackEntry[] = [
  {
    role: 'system',
    preview: 'You are a code reviewer...',
    y: 32,
    h: ENTRY_H,
    threshold: 0.04,
  },
  {
    role: 'user',
    preview: 'Review the auth module',
    y: 64,
    h: ENTRY_H,
    threshold: 0.116,
  },
  {
    role: 'agent',
    preview: "I'll analyze the code...",
    y: 96,
    h: ENTRY_H,
    threshold: 0.192,
  },
  {
    role: 'tool',
    preview: 'read_file(auth.ts)',
    y: 128,
    h: ENTRY_H,
    threshold: 0.268,
  },
  {
    role: 'tool',
    preview: '{ status: 200, ... }',
    y: 160,
    h: ENTRY_H,
    threshold: 0.344,
  },
  {
    role: 'agent',
    preview: 'The implementation...',
    y: 192,
    h: ENTRY_H,
    threshold: 0.42,
  },
  {
    role: 'user',
    preview: 'Any security concerns?',
    y: 224,
    h: ENTRY_H,
    threshold: 0.496,
  },
  {
    role: 'agent',
    preview: 'Looking at the...',
    y: 256,
    h: ENTRY_H,
    threshold: 0.572,
  },
  // Left: code is buried — tiny row with truncated preview (the point of the diagram)
  {
    role: 'code',
    preview: 'localStorage.setItem(...',
    y: 288,
    h: ENTRY_H_SM,
    threshold: 0.648,
  },
];

// 3 entries, 144px total: 2×ENTRY_H + 1×ENTRY_H_LG + 2 gaps×ENTRY_GAP = 144
const RIGHT_ENTRIES: StackEntry[] = [
  {
    role: 'system',
    preview: 'You are a code reviewer...',
    y: 168,
    h: ENTRY_H,
    threshold: 0.04,
  },
  {
    role: 'user',
    preview: 'Review this code:',
    y: 200,
    h: ENTRY_H,
    threshold: 0.344,
  },
  // Right: code is prominent — multi-line block with full view (intentional asymmetry)
  {
    role: 'code',
    y: 232,
    h: ENTRY_H_LG,
    threshold: 0.648,
    lines: ['localStorage.setItem(', "  'authToken', token", ');'],
  },
];

// Derived from the CODE entry in each stack (last entry by convention)
const LEFT_CODE = LEFT_ENTRIES[LEFT_ENTRIES.length - 1];
const RIGHT_CODE = RIGHT_ENTRIES[RIGHT_ENTRIES.length - 1];
const CODE_CY_L = LEFT_CODE.y + LEFT_CODE.h / 2; // 300
const CODE_CY_R = RIGHT_CODE.y + RIGHT_CODE.h / 2; // 272

// Direct phase comparisons (not useActs) — phases overlap and fan out from
// shared thresholds, which doesn't fit useActs' sequential act model.
// DRAW stores [start, end] draw windows for useStrokeDraw; PHASE derives from them.
const DRAW = {
  leftConn1: [0.68, 0.73] as const,
  leftConn2: [0.74, 0.78] as const,
  rightConn1: [0.7, 0.75] as const,
  rightConn2: [0.76, 0.8] as const,
} as const;

const PHASE = {
  headers: 0.01,
  leftConn1: DRAW.leftConn1[0],
  leftAgent: DRAW.leftConn2[0],
  leftVerdict: DRAW.leftConn2[1],
  rightConn1: DRAW.rightConn1[0],
  rightAgent: DRAW.rightConn2[0],
  rightVerdict: DRAW.rightConn2[1],
  sameCode: DRAW.leftConn1[0],
} as const;

export default function ContextBiasDiagram() {
  const phase = useStaticAnimationPhase();
  const mounted = useMounted();

  const headersVisible = mounted && phase >= PHASE.headers;
  const leftConnL1Visible = mounted && phase >= PHASE.leftConn1;
  const leftAgentVisible = mounted && phase >= PHASE.leftAgent;
  const leftVerdictVisible = mounted && phase >= PHASE.leftVerdict;
  const rightConnR1Visible = mounted && phase >= PHASE.rightConn1;
  const rightAgentVisible = mounted && phase >= PHASE.rightAgent;
  const rightVerdictVisible = mounted && phase >= PHASE.rightVerdict;
  const sameCodeVisible = mounted && phase >= PHASE.sameCode;

  const connL1Ref = useRef<SVGLineElement>(null);
  const connL2Ref = useRef<SVGLineElement>(null);
  const connR1Ref = useRef<SVGLineElement>(null);
  const connR2Ref = useRef<SVGLineElement>(null);

  const tL1 = useStrokeDraw(connL1Ref, phase, ...DRAW.leftConn1);
  const tL2 = useStrokeDraw(connL2Ref, phase, ...DRAW.leftConn2);
  const tR1 = useStrokeDraw(connR1Ref, phase, ...DRAW.rightConn1);
  const tR2 = useStrokeDraw(connR2Ref, phase, ...DRAW.rightConn2);

  function electricClass(visible: boolean, tone: ElectricTone, delay: number) {
    const toneClass =
      styles[`electric${tone[0].toUpperCase()}${tone.slice(1)}`];
    const delayClass = styles[`electricDelay${delay}`];

    return {
      connector: clsx(
        shared.connector,
        visible && shared.connectorDrawing,
        styles.electricConnector,
        toneClass,
        visible && styles.electricConnectorIn
      ),
      spark: clsx(
        styles.electricSpark,
        toneClass,
        delayClass,
        visible && styles.electricSparkIn
      ),
    };
  }

  function renderGhosts(entries: StackEntry[], sx: number, prefix: string) {
    return entries.map((entry, i) => {
      const entryVisible = mounted && phase >= entry.threshold;
      return (
        <Ghost
          key={`${prefix}${i}`}
          x={sx}
          y={entry.y}
          width={SW}
          height={entry.h}
          rx={0}
          fill={ROLE_BG[entry.role]}
          stroke={ROLE_COLOR[entry.role]}
          mounted={mounted}
          reached={entryVisible}
        />
      );
    });
  }

  return (
    <svg
      viewBox="0 0 640 484"
      width="100%"
      role="img"
      aria-label="Two context windows: accumulated (9 entries, code buried at 8%) vs fresh (3 entries, code prominent at 55%). Same code, different context, different verdict."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '640px', margin: '0 auto' }}
    >
      {/* ── Divider ──────────────────────────────────────────────────────────── */}
      <line
        x1={320}
        y1={8}
        x2={320}
        y2={318}
        stroke="var(--border-default)"
        strokeWidth={1}
      />

      {/* ── Headers ──────────────────────────────────────────────────────────── */}
      <rect
        x={SX_L}
        y={8}
        width={SW}
        height={20}
        rx={0}
        fill="var(--visual-bg-warning)"
        stroke="var(--visual-warning)"
        strokeWidth={1.5}
        className={clsx(shared.node, headersVisible && shared.nodeIn)}
      />
      <text
        x={CX_L}
        y={23}
        textAnchor="middle"
        fontSize={FONT_MD}
        fontWeight={600}
        fill="var(--visual-warning)"
        fontFamily="var(--font-mono-spec)"
        className={clsx(shared.label, headersVisible && shared.labelIn)}
      >
        accumulated context
      </text>

      <rect
        x={SX_R}
        y={8}
        width={SW}
        height={20}
        rx={0}
        fill="var(--visual-bg-cyan)"
        stroke="var(--visual-cyan)"
        strokeWidth={1.5}
        className={clsx(shared.node, headersVisible && shared.nodeIn)}
      />
      <text
        x={CX_R}
        y={23}
        textAnchor="middle"
        fontSize={FONT_MD}
        fontWeight={600}
        fill="var(--visual-cyan)"
        fontFamily="var(--font-mono-spec)"
        className={clsx(shared.label, headersVisible && shared.labelIn)}
      >
        fresh context
      </text>

      {/* ── Left entry ghosts ────────────────────────────────────────────────── */}
      {renderGhosts(LEFT_ENTRIES, SX_L, 'lg')}

      {/* ── Left stack entries ───────────────────────────────────────────────── */}
      {LEFT_ENTRIES.map((entry, i) => {
        const color = ROLE_COLOR[entry.role];
        const textY = entry.y + Math.round(entry.h / 2) + LABEL_DY;
        const vis = mounted && phase >= entry.threshold;
        return (
          <g
            key={`left-${i}`}
            className={clsx(styles.entry, vis && styles.entryIn)}
          >
            <rect
              x={SX_L}
              y={entry.y}
              width={SW}
              height={entry.h}
              rx={0}
              fill={ROLE_BG[entry.role]}
            />
            <rect
              x={SX_L}
              y={entry.y}
              width={2}
              height={entry.h}
              fill={color}
            />
            <text
              x={SX_L + LABEL_X}
              y={textY}
              fontSize={FONT_SM}
              fontWeight={700}
              fill={color}
              fontFamily="var(--font-mono-spec)"
            >
              {ROLE_LABEL[entry.role]}
            </text>
            <text
              x={SX_L + PREVIEW_X}
              y={textY}
              fontSize={FONT_SM}
              fill="var(--text-muted)"
              fontFamily="var(--font-mono-spec)"
            >
              {entry.preview}
            </text>
          </g>
        );
      })}

      {/* ── Right entry ghosts ───────────────────────────────────────────────── */}
      {renderGhosts(RIGHT_ENTRIES, SX_R, 'rg')}

      {/* ── Right stack entries ──────────────────────────────────────────────── */}
      {RIGHT_ENTRIES.map((entry, i) => {
        const color = ROLE_COLOR[entry.role];
        const isLarge = !!entry.lines;
        const vis = mounted && phase >= entry.threshold;
        return (
          <g
            key={`right-${i}`}
            className={clsx(styles.entry, vis && styles.entryIn)}
          >
            <rect
              x={SX_R}
              y={entry.y}
              width={SW}
              height={entry.h}
              rx={0}
              fill={ROLE_BG[entry.role]}
            />
            <rect
              x={SX_R}
              y={entry.y}
              width={2}
              height={entry.h}
              fill={color}
            />
            <text
              x={SX_R + LABEL_X}
              y={entry.y + Math.round(entry.h / 2) + LABEL_DY}
              fontSize={FONT_SM}
              fontWeight={700}
              fill={color}
              fontFamily="var(--font-mono-spec)"
            >
              {ROLE_LABEL[entry.role]}
            </text>
            {isLarge ? (
              (entry.lines ?? []).map((line, k) => (
                <text
                  key={k}
                  x={SX_R + PREVIEW_X}
                  y={entry.y + 28 + k * CODE_LINE_H}
                  fontSize={FONT_SM}
                  fill="var(--text-muted)"
                  fontFamily="var(--font-mono-spec)"
                >
                  {line}
                </text>
              ))
            ) : (
              <text
                x={SX_R + PREVIEW_X}
                y={entry.y + Math.round(entry.h / 2) + LABEL_DY}
                fontSize={FONT_SM}
                fill="var(--text-muted)"
                fontFamily="var(--font-mono-spec)"
              >
                {entry.preview}
              </text>
            )}
          </g>
        );
      })}

      {/* ── "Same code" bezier connector ─────────────────────────────────────── */}
      {/* Left CODE entry: right edge x=SX_L+SW, center-y=CODE_CY_L */}
      {/* Right CODE entry: left edge x=SX_R, center-y=CODE_CY_R */}
      <path
        d={`M ${SX_L + SW},${CODE_CY_L} C 320,${CODE_CY_L} 320,${CODE_CY_R} ${SX_R},${CODE_CY_R}`}
        stroke="var(--visual-cyan)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        fill="none"
        className={clsx(
          styles.sameCodeLink,
          sameCodeVisible && styles.sameCodeLinkIn
        )}
      />
      <text
        x={320}
        y={261}
        textAnchor="middle"
        fontSize={8}
        fill="var(--visual-cyan)"
        fontFamily="var(--font-mono-spec)"
        className={clsx(
          styles.sameCodeLink,
          sameCodeVisible && styles.sameCodeLinkIn
        )}
      >
        same code
      </text>

      {/* ── Left verdict section ─────────────────────────────────────────────── */}

      {/* Ghost agent */}
      <Ghost
        x={CX_L - 20}
        y={AGENT_Y}
        width={40}
        height={40}
        rx={0}
        fill="var(--visual-bg-magenta)"
        stroke="var(--visual-magenta)"
        mounted={mounted}
        reached={leftAgentVisible}
      />

      {/* Connector L1: stack bottom → agent */}
      {/* Arrowhead 5×5 (vs 8×8 in other diagrams) — compact layout, shorter connector */}
      <line
        ref={connL1Ref}
        x1={CX_L}
        y1={STACK_BOT}
        x2={CX_L}
        y2={AGENT_Y}
        {...CONNECTOR_STYLE}
        className={electricClass(leftConnL1Visible, 'warning', 0).connector}
      />
      <polyline
        points={`${CX_L},${STACK_BOT + 2} ${CX_L - 3},${STACK_BOT + 7} ${CX_L + 3},${STACK_BOT + 12} ${CX_L - 2},${STACK_BOT + 18} ${CX_L},${AGENT_Y - 2}`}
        className={electricClass(leftAgentVisible, 'warning', 0).spark}
      />
      <g
        transform={`translate(${CX_L},${AGENT_Y}) rotate(90)`}
        style={{ opacity: arrowOpacity(tL1) }}
      >
        <polygon points={ARROWHEAD_POINTS_SM} fill="var(--text-muted)" />
      </g>

      {/* Left agent */}
      <g className={clsx(shared.node, leftAgentVisible && shared.nodeIn)}>
        <EmojiImage
          asset={EMOJI.agent}
          x={CX_L - 20}
          y={AGENT_Y}
          size={EMOJI_SIZE}
        />
      </g>

      {/* Ghost verdict */}
      <Ghost
        x={CX_L - 20}
        y={VERDICT_Y}
        width={40}
        height={40}
        rx={0}
        fill="var(--visual-bg-warning)"
        stroke="var(--visual-warning)"
        mounted={mounted}
        reached={leftVerdictVisible}
      />

      {/* Connector L2: agent bottom → verdict */}
      <line
        ref={connL2Ref}
        x1={CX_L}
        y1={AGENT_Y + EMOJI_SIZE}
        x2={CX_L}
        y2={VERDICT_Y}
        {...CONNECTOR_STYLE}
        className={electricClass(leftAgentVisible, 'warning', 1).connector}
      />
      <polyline
        points={`${CX_L},${AGENT_Y + EMOJI_SIZE + 2} ${CX_L + 3},${AGENT_Y + EMOJI_SIZE + 7} ${CX_L - 3},${AGENT_Y + EMOJI_SIZE + 12} ${CX_L + 2},${AGENT_Y + EMOJI_SIZE + 18} ${CX_L},${VERDICT_Y - 2}`}
        className={electricClass(leftVerdictVisible, 'warning', 1).spark}
      />
      <g
        transform={`translate(${CX_L},${VERDICT_Y}) rotate(90)`}
        style={{ opacity: arrowOpacity(tL2) }}
      >
        <polygon points={ARROWHEAD_POINTS_SM} fill="var(--text-muted)" />
      </g>

      {/* Left verdict: ⚠️ */}
      <g className={clsx(shared.node, leftVerdictVisible && shared.nodeIn)}>
        <EmojiImage
          asset={EMOJI.warning}
          x={CX_L - 20}
          y={VERDICT_Y}
          size={EMOJI_SIZE}
        />
      </g>
      <text
        x={CX_L}
        y={456}
        textAnchor="middle"
        fontSize={FONT_MD}
        fontWeight={600}
        fill="var(--visual-warning)"
        fontFamily="var(--font-mono-spec)"
        className={clsx(
          styles.verdictText,
          leftVerdictVisible && styles.verdictTextIn
        )}
      >
        looks sound overall
      </text>

      {/* ── Right verdict section ─────────────────────────────────────────────── */}

      {/* Ghost agent */}
      <Ghost
        x={CX_R - 20}
        y={AGENT_Y}
        width={40}
        height={40}
        rx={0}
        fill="var(--visual-bg-magenta)"
        stroke="var(--visual-magenta)"
        mounted={mounted}
        reached={rightAgentVisible}
      />

      {/* Connector R1: stack bottom → agent */}
      <line
        ref={connR1Ref}
        x1={CX_R}
        y1={STACK_BOT}
        x2={CX_R}
        y2={AGENT_Y}
        {...CONNECTOR_STYLE}
        className={electricClass(rightConnR1Visible, 'error', 2).connector}
      />
      <polyline
        points={`${CX_R},${STACK_BOT + 2} ${CX_R - 3},${STACK_BOT + 7} ${CX_R + 3},${STACK_BOT + 12} ${CX_R - 2},${STACK_BOT + 18} ${CX_R},${AGENT_Y - 2}`}
        className={electricClass(rightAgentVisible, 'error', 2).spark}
      />
      <g
        transform={`translate(${CX_R},${AGENT_Y}) rotate(90)`}
        style={{ opacity: arrowOpacity(tR1) }}
      >
        <polygon points={ARROWHEAD_POINTS_SM} fill="var(--text-muted)" />
      </g>

      {/* Right agent */}
      <g className={clsx(shared.node, rightAgentVisible && shared.nodeIn)}>
        <EmojiImage
          asset={EMOJI.agent}
          x={CX_R - 20}
          y={AGENT_Y}
          size={EMOJI_SIZE}
        />
      </g>

      {/* Ghost verdict */}
      <Ghost
        x={CX_R - 20}
        y={VERDICT_Y}
        width={40}
        height={40}
        rx={0}
        fill="var(--visual-bg-error)"
        stroke="var(--visual-error)"
        mounted={mounted}
        reached={rightVerdictVisible}
      />

      {/* Connector R2: agent bottom → verdict */}
      <line
        ref={connR2Ref}
        x1={CX_R}
        y1={AGENT_Y + EMOJI_SIZE}
        x2={CX_R}
        y2={VERDICT_Y}
        {...CONNECTOR_STYLE}
        className={electricClass(rightAgentVisible, 'error', 3).connector}
      />
      <polyline
        points={`${CX_R},${AGENT_Y + EMOJI_SIZE + 2} ${CX_R + 3},${AGENT_Y + EMOJI_SIZE + 7} ${CX_R - 3},${AGENT_Y + EMOJI_SIZE + 12} ${CX_R + 2},${AGENT_Y + EMOJI_SIZE + 18} ${CX_R},${VERDICT_Y - 2}`}
        className={electricClass(rightVerdictVisible, 'error', 3).spark}
      />
      <g
        transform={`translate(${CX_R},${VERDICT_Y}) rotate(90)`}
        style={{ opacity: arrowOpacity(tR2) }}
      >
        <polygon points={ARROWHEAD_POINTS_SM} fill="var(--text-muted)" />
      </g>

      {/* Right verdict: 🚨 */}
      <g className={clsx(shared.node, rightVerdictVisible && shared.nodeIn)}>
        <EmojiImage
          asset={EMOJI.emergency}
          x={CX_R - 20}
          y={VERDICT_Y}
          size={EMOJI_SIZE}
        />
      </g>
      <text
        x={CX_R}
        y={456}
        textAnchor="middle"
        fontSize={FONT_MD}
        fontWeight={600}
        fill="var(--visual-error)"
        fontFamily="var(--font-mono-spec)"
        className={clsx(
          styles.verdictText,
          rightVerdictVisible && styles.verdictTextIn
        )}
      >
        Critical: XSS via
      </text>
      <text
        x={CX_R}
        y={472}
        textAnchor="middle"
        fontSize={FONT_MD}
        fontWeight={600}
        fill="var(--visual-error)"
        fontFamily="var(--font-mono-spec)"
        className={clsx(
          styles.verdictText,
          rightVerdictVisible && styles.verdictTextIn
        )}
      >
        localStorage
      </text>
    </svg>
  );
}
