import React, { useRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './ContextBiasDiagram.module.css';
import { NotoEmoji } from './ActorNodes';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import { useStrokeDraw } from '../../hooks/useStrokeDraw';
import { CONNECTOR_STYLE, GHOST_STYLE, ARROWHEAD_POINTS_SM, arrowOpacity } from './diagramConstants';

// ── Layout ───────────────────────────────────────────────────────────────────
// ViewBox 640×484
// Left column center x=160, right column center x=480, divider x=320
// Both stacks bottom-align at y=312
//   Left stack:  top y=32,  height 280px (9 entries × 28px + code 24px + 8 gaps × 4px)
//   Right stack: top y=168, height 144px (2×28 + code 80px + 2 gaps × 4px)
// Agent row:   y=336, emoji size 40 → bottom y=376
// Verdict row: y=400, emoji size 40 → bottom y=440
// Verdict text: y=456, y=472

const SX_L = 26;       // left stack x
const SX_R = 346;      // right stack x
const SW   = 268;      // stack width
const CX_L = 160;      // left column center x
const CX_R = 480;      // right column center x
const STACK_BOT  = 312;
const AGENT_Y    = 336;
const VERDICT_Y  = 400;
const EMOJI_SIZE = 40;

// ── Role config ───────────────────────────────────────────────────────────────
// StackEntryRole is distinct from the shared Role type in contextStreamData.ts:
// 'tool' here represents a tool-call entry in the visual stack (not 'tool_result'),
// and 'code' is a special display role for inline code blocks.
type StackEntryRole = 'system' | 'user' | 'agent' | 'tool' | 'code';

const ROLE_COLOR: Record<StackEntryRole, string> = {
  system: 'var(--visual-cyan)',
  user:   'var(--visual-neutral)',
  agent:  'var(--visual-magenta)',
  tool:   'var(--visual-indigo)',
  code:   'var(--visual-cyan)',
};

const ROLE_BG: Record<StackEntryRole, string> = {
  system: 'var(--visual-bg-cyan)',
  user:   'var(--visual-bg-neutral)',
  agent:  'var(--visual-bg-magenta)',
  tool:   'var(--visual-bg-indigo)',
  code:   'var(--visual-bg-cyan)',
};

const ROLE_LABEL: Record<StackEntryRole, string> = {
  system: 'SYS',
  user:   'USR',
  agent:  'AGT',
  tool:   'TOOL',
  code:   'CODE',
};

// ── Stack entry data ───────────────────────────────────────────────────────────
interface StackEntry { role: StackEntryRole; y: number; h: number; threshold: number; preview?: string; lines?: string[]; }

// 9 entries, 280px total: 8×28 + 1×24 + 8 gaps×4 = 280
// Left entries span 0.04–0.648 (interval 0.076 = 69% wider than before)
const LEFT_ENTRIES: StackEntry[] = [
  { role: 'system', preview: 'You are a code reviewer...',  y:  32, h: 28, threshold: 0.040 },
  { role: 'user',   preview: 'Review the auth module',      y:  64, h: 28, threshold: 0.116 },
  { role: 'agent',  preview: "I'll analyze the code...",    y:  96, h: 28, threshold: 0.192 },
  { role: 'tool',   preview: 'read_file(auth.ts)',           y: 128, h: 28, threshold: 0.268 },
  { role: 'tool',   preview: '{ status: 200, ... }',         y: 160, h: 28, threshold: 0.344 },
  { role: 'agent',  preview: 'The implementation...',        y: 192, h: 28, threshold: 0.420 },
  { role: 'user',   preview: 'Any security concerns?',       y: 224, h: 28, threshold: 0.496 },
  { role: 'agent',  preview: 'Looking at the...',            y: 256, h: 28, threshold: 0.572 },
  // Left: code is buried — tiny 24px row with truncated preview (the point of the diagram)
  { role: 'code',   preview: 'localStorage.setItem(...',     y: 288, h: 24, threshold: 0.648 },
];

// 3 entries, 144px total: 2×28 + 1×80 + 2 gaps×4 = 144
const RIGHT_ENTRIES: StackEntry[] = [
  { role: 'system', preview: 'You are a code reviewer...',  y: 168, h:  28, threshold: 0.040 },
  { role: 'user',   preview: 'Review this code:',            y: 200, h:  28, threshold: 0.344 },
  // Right: code is prominent — 80px block with full multi-line view (intentional asymmetry)
  { role: 'code',   y: 232, h:  80, threshold: 0.648, lines: ["localStorage.setItem(", "  'authToken', token", ");"] },
];

// Derived from the CODE entry in each stack (last entry by convention)
const LEFT_CODE  = LEFT_ENTRIES[LEFT_ENTRIES.length - 1];
const RIGHT_CODE = RIGHT_ENTRIES[RIGHT_ENTRIES.length - 1];
const CODE_CY_L  = LEFT_CODE.y + LEFT_CODE.h / 2;   // 300
const CODE_CY_R  = RIGHT_CODE.y + RIGHT_CODE.h / 2;  // 272

// Direct phase comparisons (not useActs) — phases overlap and fan out from
// shared thresholds, which doesn't fit useActs' sequential act model.
// DRAW stores [start, end] draw windows for useStrokeDraw; PHASE derives from them.
const DRAW = {
  leftConn1:  [0.68, 0.73] as const,
  leftConn2:  [0.74, 0.78] as const,
  rightConn1: [0.70, 0.75] as const,
  rightConn2: [0.76, 0.80] as const,
} as const;

const PHASE = {
  headers:      0.01,
  leftConn1:    DRAW.leftConn1[0],
  leftAgent:    DRAW.leftConn2[0],
  leftVerdict:  DRAW.leftConn2[1],
  rightConn1:   DRAW.rightConn1[0],
  rightAgent:   DRAW.rightConn2[0],
  rightVerdict: DRAW.rightConn2[1],
  sameCode:     DRAW.leftConn1[0],
} as const;

export default function ContextBiasDiagram() {
  const phase = useAnimationPhase();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const headersVisible      = mounted && phase >= PHASE.headers;
  const leftConnL1Visible   = mounted && phase >= PHASE.leftConn1;
  const leftAgentVisible    = mounted && phase >= PHASE.leftAgent;
  const leftConnL2Visible   = mounted && phase >= PHASE.leftAgent;
  const leftVerdictVisible  = mounted && phase >= PHASE.leftVerdict;
  const rightConnR1Visible  = mounted && phase >= PHASE.rightConn1;
  const rightAgentVisible   = mounted && phase >= PHASE.rightAgent;
  const rightConnR2Visible  = mounted && phase >= PHASE.rightAgent;
  const rightVerdictVisible = mounted && phase >= PHASE.rightVerdict;
  const sameCodeVisible     = mounted && phase >= PHASE.sameCode;

  const connL1Ref = useRef<SVGLineElement>(null);
  const connL2Ref = useRef<SVGLineElement>(null);
  const connR1Ref = useRef<SVGLineElement>(null);
  const connR2Ref = useRef<SVGLineElement>(null);

  const tL1 = useStrokeDraw(connL1Ref, phase, ...DRAW.leftConn1);
  const tL2 = useStrokeDraw(connL2Ref, phase, ...DRAW.leftConn2);
  const tR1 = useStrokeDraw(connR1Ref, phase, ...DRAW.rightConn1);
  const tR2 = useStrokeDraw(connR2Ref, phase, ...DRAW.rightConn2);

  function renderGhosts(entries: StackEntry[], sx: number, prefix: string) {
    return entries.map((entry, i) => {
      const entryVisible = mounted && phase >= entry.threshold;
      const ghostVisible = mounted && !entryVisible;
      return (
        <rect key={`${prefix}${i}`} x={sx} y={entry.y} width={SW} height={entry.h} rx={2}
          fill={ROLE_BG[entry.role]} stroke={ROLE_COLOR[entry.role]}
          {...GHOST_STYLE}
          className={clsx(
            styles.entryGhost,
            ghostVisible && styles.entryGhostShown,
            entryVisible && styles.entryGhostHidden,
          )}
        />
      );
    });
  }

  return (
    <svg
      viewBox="0 0 640 484"
      width="100%"
      height="auto"
      role="img"
      aria-label="Two context windows: accumulated (9 entries, code buried at 8%) vs fresh (3 entries, code prominent at 55%). Same code, different context, different verdict."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '640px', margin: '0 auto' }}
    >
      {/* ── Divider ──────────────────────────────────────────────────────────── */}
      <line x1={320} y1={8} x2={320} y2={318} stroke="var(--border-default)" strokeWidth={1} />

      {/* ── Headers ──────────────────────────────────────────────────────────── */}
      <rect x={SX_L} y={8} width={SW} height={20} rx={3}
        fill="var(--visual-bg-warning)" stroke="var(--visual-warning)" strokeWidth={1.5}
        className={clsx(styles.node, headersVisible && styles.nodeIn)}
      />
      <text x={CX_L} y={23} textAnchor="middle" fontSize={10} fontWeight={600}
        fill="var(--visual-warning)" fontFamily="var(--font-mono-spec)"
        className={clsx(styles.label, headersVisible && styles.labelIn)}
      >accumulated context</text>

      <rect x={SX_R} y={8} width={SW} height={20} rx={3}
        fill="var(--visual-bg-cyan)" stroke="var(--visual-cyan)" strokeWidth={1.5}
        className={clsx(styles.node, headersVisible && styles.nodeIn)}
      />
      <text x={CX_R} y={23} textAnchor="middle" fontSize={10} fontWeight={600}
        fill="var(--visual-cyan)" fontFamily="var(--font-mono-spec)"
        className={clsx(styles.label, headersVisible && styles.labelIn)}
      >fresh context</text>

      {/* ── Left entry ghosts ────────────────────────────────────────────────── */}
      {renderGhosts(LEFT_ENTRIES, SX_L, 'lg')}

      {/* ── Left stack entries ───────────────────────────────────────────────── */}
      {LEFT_ENTRIES.map((entry, i) => {
        const color = ROLE_COLOR[entry.role];
        const textY = entry.y + Math.round(entry.h / 2) + 4;
        const vis   = mounted && phase >= entry.threshold;
        return (
          <g key={`left-${i}`} className={clsx(styles.entry, vis && styles.entryIn)}>
            <rect x={SX_L} y={entry.y} width={SW} height={entry.h} rx={2}
              fill={ROLE_BG[entry.role]}
            />
            <rect x={SX_L} y={entry.y} width={2} height={entry.h} fill={color} />
            <text x={SX_L + 8} y={textY} fontSize={9} fontWeight={700}
              fill={color} fontFamily="var(--font-mono-spec)"
            >{ROLE_LABEL[entry.role]}</text>
            <text x={SX_L + 38} y={textY} fontSize={9}
              fill="var(--text-muted)" fontFamily="var(--font-mono-spec)"
            >{entry.preview}</text>
          </g>
        );
      })}

      {/* ── Right entry ghosts ───────────────────────────────────────────────── */}
      {renderGhosts(RIGHT_ENTRIES, SX_R, 'rg')}

      {/* ── Right stack entries ──────────────────────────────────────────────── */}
      {RIGHT_ENTRIES.map((entry, i) => {
        const color   = ROLE_COLOR[entry.role];
        const isLarge = entry.role === 'code';
        const vis     = mounted && phase >= entry.threshold;
        return (
          <g key={`right-${i}`} className={clsx(styles.entry, vis && styles.entryIn)}>
            <rect x={SX_R} y={entry.y} width={SW} height={entry.h} rx={2}
              fill={ROLE_BG[entry.role]}
            />
            <rect x={SX_R} y={entry.y} width={2} height={entry.h} fill={color} />
            <text x={SX_R + 8} y={entry.y + Math.round(entry.h / 2) + 4} fontSize={9} fontWeight={700}
              fill={color} fontFamily="var(--font-mono-spec)"
            >{ROLE_LABEL[entry.role]}</text>
            {isLarge ? (
              <>
                {(entry.lines ?? []).map((line, k) => (
                  <text key={k} x={SX_R + 8} y={entry.y + 28 + k * 12} fontSize={9}
                    fill="var(--text-muted)" fontFamily="var(--font-mono-spec)"
                  >{line}</text>
                ))}
              </>
            ) : (
              <text x={SX_R + 38} y={entry.y + Math.round(entry.h / 2) + 4} fontSize={9}
                fill="var(--text-muted)" fontFamily="var(--font-mono-spec)"
              >{entry.preview}</text>
            )}
          </g>
        );
      })}

      {/* ── "Same code" bezier connector ─────────────────────────────────────── */}
      {/* Left CODE entry: right edge x=SX_L+SW, center-y=CODE_CY_L */}
      {/* Right CODE entry: left edge x=SX_R, center-y=CODE_CY_R */}
      <path
        d={`M ${SX_L + SW},${CODE_CY_L} C 320,${CODE_CY_L} 320,${CODE_CY_R} ${SX_R},${CODE_CY_R}`}
        stroke="var(--visual-cyan)" strokeWidth={1.5} strokeDasharray="4 3" fill="none"
        className={clsx(styles.sameCodeLink, sameCodeVisible && styles.sameCodeLinkIn)}
      />
      <text x={320} y={261} textAnchor="middle" fontSize={8}
        fill="var(--visual-cyan)" fontFamily="var(--font-mono-spec)"
        className={clsx(styles.sameCodeLink, sameCodeVisible && styles.sameCodeLinkIn)}
      >same code</text>

      {/* ── Left verdict section ─────────────────────────────────────────────── */}

      {/* Ghost agent */}
      <rect x={CX_L - 20} y={AGENT_Y} width={40} height={40} rx={8}
        fill="var(--visual-bg-magenta)" stroke="var(--visual-magenta)"
        {...GHOST_STYLE}
        className={clsx(
          styles.ghost,
          mounted && !leftAgentVisible && styles.ghostShown,
          leftAgentVisible && styles.ghostHidden,
        )}
      />

      {/* Connector L1: stack bottom → agent */}
      {/* Arrowhead 5×5 (vs 8×8 in other diagrams) — compact layout, shorter connector */}
      <line ref={connL1Ref} x1={CX_L} y1={STACK_BOT} x2={CX_L} y2={AGENT_Y}
        {...CONNECTOR_STYLE}
        className={clsx(styles.connector, leftConnL1Visible && styles.connectorDrawing)}
      />
      <g transform={`translate(${CX_L},${AGENT_Y}) rotate(90)`} style={{ opacity: arrowOpacity(tL1) }}>
        <polygon points={ARROWHEAD_POINTS_SM} fill="var(--text-muted)" />
      </g>

      {/* Left agent */}
      <g className={clsx(styles.node, leftAgentVisible && styles.nodeIn)}>
        <NotoEmoji codepoint="1f916" x={CX_L - 20} y={AGENT_Y} size={EMOJI_SIZE} />
      </g>

      {/* Ghost verdict */}
      <rect x={CX_L - 20} y={VERDICT_Y} width={40} height={40} rx={8}
        fill="var(--visual-bg-warning)" stroke="var(--visual-warning)"
        {...GHOST_STYLE}
        className={clsx(
          styles.ghost,
          mounted && !leftVerdictVisible && styles.ghostShown,
          leftVerdictVisible && styles.ghostHidden,
        )}
      />

      {/* Connector L2: agent bottom → verdict */}
      <line ref={connL2Ref} x1={CX_L} y1={AGENT_Y + EMOJI_SIZE} x2={CX_L} y2={VERDICT_Y}
        {...CONNECTOR_STYLE}
        className={clsx(styles.connector, leftConnL2Visible && styles.connectorDrawing)}
      />
      <g transform={`translate(${CX_L},${VERDICT_Y}) rotate(90)`} style={{ opacity: arrowOpacity(tL2) }}>
        <polygon points={ARROWHEAD_POINTS_SM} fill="var(--text-muted)" />
      </g>

      {/* Left verdict: ⚠️ */}
      <g className={clsx(styles.node, leftVerdictVisible && styles.nodeIn)}>
        <NotoEmoji codepoint="26a0" x={CX_L - 20} y={VERDICT_Y} size={EMOJI_SIZE} />
      </g>
      <text x={CX_L} y={456} textAnchor="middle" fontSize={10} fontWeight={600}
        fill="var(--visual-warning)" fontFamily="var(--font-mono-spec)"
        className={clsx(styles.verdictText, leftVerdictVisible && styles.verdictTextIn)}
      >looks sound overall</text>

      {/* ── Right verdict section ─────────────────────────────────────────────── */}

      {/* Ghost agent */}
      <rect x={CX_R - 20} y={AGENT_Y} width={40} height={40} rx={8}
        fill="var(--visual-bg-magenta)" stroke="var(--visual-magenta)"
        {...GHOST_STYLE}
        className={clsx(
          styles.ghost,
          mounted && !rightAgentVisible && styles.ghostShown,
          rightAgentVisible && styles.ghostHidden,
        )}
      />

      {/* Connector R1: stack bottom → agent */}
      <line ref={connR1Ref} x1={CX_R} y1={STACK_BOT} x2={CX_R} y2={AGENT_Y}
        {...CONNECTOR_STYLE}
        className={clsx(styles.connector, rightConnR1Visible && styles.connectorDrawing)}
      />
      <g transform={`translate(${CX_R},${AGENT_Y}) rotate(90)`} style={{ opacity: arrowOpacity(tR1) }}>
        <polygon points={ARROWHEAD_POINTS_SM} fill="var(--text-muted)" />
      </g>

      {/* Right agent */}
      <g className={clsx(styles.node, rightAgentVisible && styles.nodeIn)}>
        <NotoEmoji codepoint="1f916" x={CX_R - 20} y={AGENT_Y} size={EMOJI_SIZE} />
      </g>

      {/* Ghost verdict */}
      <rect x={CX_R - 20} y={VERDICT_Y} width={40} height={40} rx={8}
        fill="var(--visual-bg-error)" stroke="var(--visual-error)"
        {...GHOST_STYLE}
        className={clsx(
          styles.ghost,
          mounted && !rightVerdictVisible && styles.ghostShown,
          rightVerdictVisible && styles.ghostHidden,
        )}
      />

      {/* Connector R2: agent bottom → verdict */}
      <line ref={connR2Ref} x1={CX_R} y1={AGENT_Y + EMOJI_SIZE} x2={CX_R} y2={VERDICT_Y}
        {...CONNECTOR_STYLE}
        className={clsx(styles.connector, rightConnR2Visible && styles.connectorDrawing)}
      />
      <g transform={`translate(${CX_R},${VERDICT_Y}) rotate(90)`} style={{ opacity: arrowOpacity(tR2) }}>
        <polygon points={ARROWHEAD_POINTS_SM} fill="var(--text-muted)" />
      </g>

      {/* Right verdict: 🚨 */}
      <g className={clsx(styles.node, rightVerdictVisible && styles.nodeIn)}>
        <NotoEmoji codepoint="1f6a8" x={CX_R - 20} y={VERDICT_Y} size={EMOJI_SIZE} />
      </g>
      <text x={CX_R} y={456} textAnchor="middle" fontSize={10} fontWeight={600}
        fill="var(--visual-error)" fontFamily="var(--font-mono-spec)"
        className={clsx(styles.verdictText, rightVerdictVisible && styles.verdictTextIn)}
      >Critical: XSS via</text>
      <text x={CX_R} y={472} textAnchor="middle" fontSize={10} fontWeight={600}
        fill="var(--visual-error)" fontFamily="var(--font-mono-spec)"
        className={clsx(styles.verdictText, rightVerdictVisible && styles.verdictTextIn)}
      >localStorage</text>

    </svg>
  );
}
