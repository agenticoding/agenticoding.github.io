import React from 'react';
import clsx from 'clsx';
import { GearNode } from './GearNode';
import { TokenUnit, type TokenUnitSignal } from './TokenUnit';
import styles from './TokenPredictionDiagram.module.css';

const CONTEXT_TOKENS = [
  { label: 'The', signal: 'ordinary' },
  { label: 'cat', signal: 'salient' },
  { label: 'sat', signal: 'ordinary' },
  { label: 'on', signal: 'compressed' },
  { label: 'the', signal: 'ordinary' },
] as const satisfies readonly { label: string; signal: TokenUnitSignal }[];
const PREDICTED_TOKEN = '"mat"';
const PREDICTED_TOKEN_UNIT_SIZE = 24;
const ARIA_LABEL = `Token prediction: the LLM uses all ${CONTEXT_TOKENS.length} context tokens to predict the next token`;

// ── Desktop layout (8px grid, viewBox 440×240) ────────────────────────────
const VW = 440;
const VH = 240;
const PILL_X = 24;
const PILL_W = 112;
const PILL_H = 32;
const PILL_YS = [24, 64, 104, 144, 184] as const;
const PILL_CYS = [40, 80, 120, 160, 200] as const;
const PILL_RIGHT = PILL_X + PILL_W;
const TOKEN_CHIP_X = PILL_X + 12;
const TOKEN_TEXT_X = PILL_X + 74;
const MERGE_X = 164;
const GEAR_X = 200;
const GEAR_Y = 96;
const GEAR_SIZE = 48;
const GEAR_CX = GEAR_X + GEAR_SIZE / 2;
const GEAR_CY = GEAR_Y + GEAR_SIZE / 2;
const OUT_X = 288;
const OUT_Y = 96;
const OUT_W = 80;
const OUT_H = 48;
const OUT_CX = OUT_X + OUT_W / 2;
const OUT_CY = OUT_Y + OUT_H / 2;
const ARROW_HEAD_W = 12;
const ARROW_HEAD_HALF_H = 6;
const ARROW_TARGET_GAP = 4;
const GEAR_ARROW_TIP_X = GEAR_X - ARROW_TARGET_GAP;
const OUT_ARROW_TIP_X = OUT_X - ARROW_TARGET_GAP;

// ── Mobile layout: same story, vertical topology when horizontal text shrinks. ─
const MVW = 320;
const MVH = 408;
const MOBILE_CHIP_W = 80;
const MOBILE_CHIP_H = 34;
const MOBILE_CHIP_GAP = 8;
const MOBILE_GRID_Y = 54;
const MOBILE_GEAR_X = 136;
const MOBILE_GEAR_Y = 202;
const MOBILE_GEAR_SIZE = 48;
const MOBILE_OUT_X = 116;
const MOBILE_OUT_Y = 318;
const MOBILE_OUT_W = 88;
const MOBILE_OUT_H = 50;
const MOBILE_OUT_CX = MOBILE_OUT_X + MOBILE_OUT_W / 2;
const MOBILE_OUT_CY = MOBILE_OUT_Y + MOBILE_OUT_H / 2;
const MOBILE_MERGE_Y = 162;

const arrowHeadPoints = (tipX: number, cy: number) =>
  `${tipX} ${cy}, ${tipX - ARROW_HEAD_W} ${cy - ARROW_HEAD_HALF_H}, ${tipX - ARROW_HEAD_W} ${cy + ARROW_HEAD_HALF_H}`;
const downArrowHeadPoints = (cx: number, tipY: number) =>
  `${cx} ${tipY}, ${cx - 6} ${tipY - 10}, ${cx + 6} ${tipY - 10}`;

function HorizontalArrow({
  startX,
  tipX,
  y,
}: {
  startX: number;
  tipX: number;
  y: number;
}) {
  const baseX = tipX - ARROW_HEAD_W;

  return (
    <>
      <line
        x1={startX}
        y1={y}
        x2={baseX}
        y2={y}
        stroke="var(--visual-violet)"
        strokeWidth="2"
        strokeLinecap="butt"
      />
      <polygon points={arrowHeadPoints(tipX, y)} fill="var(--visual-violet)" />
    </>
  );
}

function DownArrow({
  x,
  startY,
  tipY,
}: {
  x: number;
  startY: number;
  tipY: number;
}) {
  return (
    <>
      <line
        x1={x}
        y1={startY}
        x2={x}
        y2={tipY - 10}
        stroke="var(--visual-violet)"
        strokeWidth="2"
        strokeLinecap="butt"
      />
      <polygon
        points={downArrowHeadPoints(x, tipY)}
        fill="var(--visual-violet)"
      />
    </>
  );
}

function DesktopDiagram() {
  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      aria-hidden="true"
      className={clsx(styles.diagram, styles.desktopDiagram)}
    >
      <text
        x={PILL_X + PILL_W / 2}
        y={PILL_YS[0] - 8}
        textAnchor="middle"
        fontFamily="var(--font-mono-spec)"
        fontSize="11"
        fill="var(--text-muted)"
        letterSpacing="0.3"
      >
        context window
      </text>
      <text
        x={GEAR_CX}
        y={GEAR_Y - 8}
        textAnchor="middle"
        fontFamily="var(--font-mono-spec)"
        fontSize="11"
        fill="var(--visual-violet)"
      >
        LLM
      </text>
      <text
        x={OUT_CX}
        y={OUT_Y - 8}
        textAnchor="middle"
        fontFamily="var(--font-mono-keyword)"
        fontSize="11"
        fill="var(--visual-violet)"
      >
        predicted
      </text>

      {CONTEXT_TOKENS.map(({ label, signal }, i) => (
        <g
          key={label}
          className="inference-token-cycle idle-inference-cycle"
          style={{ animationDelay: `${i * 350}ms` }}
        >
          <rect
            x={PILL_X}
            y={PILL_YS[i]}
            width={PILL_W}
            height={PILL_H}
            rx={0}
            fill="var(--visual-bg-neutral)"
            stroke="var(--border-subtle)"
            strokeWidth="1"
          />
          <TokenUnit
            x={TOKEN_CHIP_X}
            y={PILL_CYS[i] - 12}
            width={24}
            height={24}
            modality="text"
            signal={signal}
          />
          <text
            x={TOKEN_TEXT_X}
            y={PILL_CYS[i]}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="var(--font-mono-keyword)"
            fontSize="11"
            fill="var(--text-muted)"
          >
            {label}
          </text>
        </g>
      ))}

      {PILL_CYS.map((cy, i) => (
        <path
          key={i}
          d={`M ${PILL_RIGHT} ${cy} C ${MERGE_X - 16} ${cy}, ${MERGE_X - 16} ${GEAR_CY}, ${MERGE_X} ${GEAR_CY}`}
          fill="none"
          stroke="var(--visual-violet)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      <HorizontalArrow startX={MERGE_X} tipX={GEAR_ARROW_TIP_X} y={GEAR_CY} />
      <GearNode
        x={GEAR_X}
        y={GEAR_Y}
        size={GEAR_SIZE}
        className={clsx(styles.gear, 'inference-llm-cycle idle-inference-cycle')}
      />
      <HorizontalArrow
        startX={GEAR_X + GEAR_SIZE}
        tipX={OUT_ARROW_TIP_X}
        y={OUT_CY}
      />
      <g className="inference-output-cycle idle-inference-cycle">
        <rect
          x={OUT_X}
          y={OUT_Y}
          width={OUT_W}
          height={OUT_H}
          rx={0}
          fill="var(--visual-bg-violet)"
          stroke="var(--visual-violet)"
          strokeWidth="1"
        />
        <TokenUnit
          x={OUT_CX - PREDICTED_TOKEN_UNIT_SIZE / 2}
          y={OUT_CY - 18}
          width={PREDICTED_TOKEN_UNIT_SIZE}
          height={PREDICTED_TOKEN_UNIT_SIZE}
          tone="violet"
          modality="text"
          signal="salient"
        />
        <text
          x={OUT_CX}
          y={OUT_CY + 16}
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

function MobileToken({
  label,
  signal,
  x,
  y,
  delay,
}: {
  label: string;
  signal: TokenUnitSignal;
  x: number;
  y: number;
  delay: string;
}) {
  return (
    <g
      className="inference-token-cycle idle-inference-cycle"
      style={{ animationDelay: delay }}
    >
      <rect
        x={x}
        y={y}
        width={MOBILE_CHIP_W}
        height={MOBILE_CHIP_H}
        rx={0}
        fill="var(--visual-bg-neutral)"
        stroke="var(--border-subtle)"
        strokeWidth="1"
      />
      <TokenUnit
        x={x + 8}
        y={y + 5}
        width={24}
        height={24}
        modality="text"
        signal={signal}
      />
      <text
        x={x + 57}
        y={y + MOBILE_CHIP_H / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-mono-keyword)"
        fontSize="12"
        fill="var(--text-muted)"
      >
        {label}
      </text>
    </g>
  );
}

function MobileDiagram() {
  return (
    <svg
      viewBox={`0 0 ${MVW} ${MVH}`}
      width="100%"
      aria-hidden="true"
      className={clsx(styles.diagram, styles.mobileDiagram)}
    >
      <text
        x={MVW / 2}
        y="26"
        textAnchor="middle"
        fontFamily="var(--font-mono-spec)"
        fontSize="12"
        fill="var(--text-muted)"
        letterSpacing="0.3"
      >
        context window
      </text>
      {CONTEXT_TOKENS.map(({ label, signal }, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const rowWidth =
          row === 0
            ? MOBILE_CHIP_W * 3 + MOBILE_CHIP_GAP * 2
            : MOBILE_CHIP_W * 2 + MOBILE_CHIP_GAP;
        const x =
          (MVW - rowWidth) / 2 + col * (MOBILE_CHIP_W + MOBILE_CHIP_GAP);
        const y = MOBILE_GRID_Y + row * (MOBILE_CHIP_H + MOBILE_CHIP_GAP);
        return (
          <MobileToken
            key={label}
            label={label}
            signal={signal}
            x={x}
            y={y}
            delay={`${i * 350}ms`}
          />
        );
      })}

      {[72, 116, 160, 204, 248].map((x, i) => (
        <path
          key={i}
          d={`M ${x} 130 C ${x} 148, ${MVW / 2} 148, ${MVW / 2} ${MOBILE_MERGE_Y}`}
          fill="none"
          stroke="var(--visual-violet)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      <DownArrow x={MVW / 2} startY={MOBILE_MERGE_Y} tipY={MOBILE_GEAR_Y - 4} />
      <text
        x={MVW / 2 + 28}
        y={MOBILE_GEAR_Y - 14}
        textAnchor="start"
        fontFamily="var(--font-mono-spec)"
        fontSize="12"
        fill="var(--visual-violet)"
      >
        LLM
      </text>
      <GearNode
        x={MOBILE_GEAR_X}
        y={MOBILE_GEAR_Y}
        size={MOBILE_GEAR_SIZE}
        className={clsx(styles.gear, 'inference-llm-cycle idle-inference-cycle')}
      />
      <DownArrow
        x={MVW / 2}
        startY={MOBILE_GEAR_Y + MOBILE_GEAR_SIZE + 8}
        tipY={MOBILE_OUT_Y - 6}
      />
      <text
        x={MVW / 2 + 28}
        y={MOBILE_OUT_Y - 18}
        textAnchor="start"
        fontFamily="var(--font-mono-keyword)"
        fontSize="12"
        fill="var(--visual-violet)"
      >
        predicted
      </text>
      <g className="inference-output-cycle idle-inference-cycle">
        <rect
          x={MOBILE_OUT_X}
          y={MOBILE_OUT_Y}
          width={MOBILE_OUT_W}
          height={MOBILE_OUT_H}
          rx={0}
          fill="var(--visual-bg-violet)"
          stroke="var(--visual-violet)"
          strokeWidth="1"
        />
        <TokenUnit
          x={MOBILE_OUT_CX - PREDICTED_TOKEN_UNIT_SIZE / 2}
          y={MOBILE_OUT_CY - 18}
          width={PREDICTED_TOKEN_UNIT_SIZE}
          height={PREDICTED_TOKEN_UNIT_SIZE}
          tone="violet"
          modality="text"
          signal="salient"
        />
        <text
          x={MOBILE_OUT_CX}
          y={MOBILE_OUT_CY + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-mono-keyword)"
          fontSize="12"
          fontWeight="600"
          fill="var(--visual-violet)"
        >
          {PREDICTED_TOKEN}
        </text>
      </g>
    </svg>
  );
}

export default function TokenPredictionDiagram() {
  return (
    <div className={styles.container} role="img" aria-label={ARIA_LABEL}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}
