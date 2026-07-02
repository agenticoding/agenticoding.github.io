import { useId, type CSSProperties } from 'react';
import clsx from 'clsx';
import styles from './SkillsInvocationDiagram.module.css';
import { useStaticAnimationPhase } from '../../hooks/useStaticAnimationPhase';
import { useActs } from '../../hooks/useActs';

const GRID = 8;

const VW = 560;
const VH = 272;

const PANEL_X = GRID * 2;
const PANEL_GAP = GRID * 6;
const PANEL_W = GRID * 30;
const PANEL_B_X = PANEL_X + PANEL_W + PANEL_GAP;
const DIVIDER_X = PANEL_X + PANEL_W + PANEL_GAP / 2;
const DIVIDER_TOP = GRID * 2;
const DIVIDER_BOTTOM = VH - DIVIDER_TOP;

const TITLE_Y = GRID * 2;
const TITLE_TO_STACK_GAP = GRID * 2;
const BOX_INSET_X = GRID;
const BOX_W = PANEL_W - BOX_INSET_X * 2;
const BOX_H = GRID * 4;
const BOX_STEP_Y = BOX_H + GRID * 3;
const FIRST_BOX_Y = TITLE_Y + TITLE_TO_STACK_GAP;
const BOX_LABEL_X = GRID * 2;

const MARKER_W = 6;
const MARKER_H = 6;
const MARKER_REF_X = 5;
const MARKER_REF_Y = 3;
const CONNECTOR_STROKE_W = 1.5;
const CONNECTOR_START_PAD_Y = GRID / 2;
const CONNECTOR_END_PAD_Y = GRID / 2;
const MARKER_TIP_OVERHANG_Y = MARKER_W - MARKER_REF_X;

const NOTE_OFFSET_Y = GRID * 2;
const NOTE_STEP_Y = GRID * 2;

const A_BX = PANEL_X + BOX_INSET_X;
const B_BX = PANEL_B_X + BOX_INSET_X;
const A_CX = PANEL_X + PANEL_W / 2;
const B_CX = PANEL_B_X + PANEL_W / 2;

const A_Y = stackY(3);
const B_Y = stackY(4);

const ACTS = [
  { id: 'frameDivider', threshold: 0.04 },
  { id: 'frameTitles', threshold: 0.10 },
  { id: 'operatorBox0', threshold: 0.18 },
  { id: 'operatorConnector0', threshold: 0.26 },
  { id: 'operatorBox1', threshold: 0.34 },
  { id: 'operatorConnector1', threshold: 0.42 },
  { id: 'operatorBox2', threshold: 0.50 },
  { id: 'modelBox0', threshold: 0.56 },
  { id: 'modelConnector0', threshold: 0.62 },
  { id: 'modelBox1', threshold: 0.68 },
  { id: 'modelConnector1', threshold: 0.74 },
  { id: 'modelBox2', threshold: 0.80 },
  { id: 'modelConnector2', threshold: 0.86 },
  { id: 'modelBox3', threshold: 0.92 },
  { id: 'note0', threshold: 0.94 },
  { id: 'note1', threshold: 0.96 },
  { id: 'note2', threshold: 0.98 },
  { id: 'note3', threshold: 0.995 },
] as const;

type ActId = (typeof ACTS)[number]['id'];

function stackY(count: number): number[] {
  return Array.from({ length: count }, (_, index) => FIRST_BOX_Y + index * BOX_STEP_Y);
}

function Box({
  bx, by, color, bg, label, fontFamily = 'var(--font-mono)', className, style,
}: {
  bx: number; by: number; color: string; bg: string; label: string; fontFamily?: string; className?: string; style?: CSSProperties;
}) {
  return (
    <g className={className} style={style}>
      <rect
        x={bx}
        y={by}
        width={BOX_W}
        height={BOX_H}
        rx={0}
        fill={bg}
        stroke={color}
        strokeWidth={1}
      />
      <text
        x={bx + BOX_LABEL_X}
        y={by + BOX_H / 2}
        dominantBaseline="middle"
        fontSize={11}
        fontFamily={fontFamily}
        fill={color}
      >
        {label}
      </text>
    </g>
  );
}

function Connector({
  cx, fromY, toY, markerId, className, style,
}: {
  cx: number; fromY: number; toY: number; markerId: string; className?: string; style?: CSSProperties;
}) {
  return (
    <line
      className={className}
      style={style}
      x1={cx}
      y1={fromY + BOX_H + CONNECTOR_START_PAD_Y}
      x2={cx}
      y2={toY - CONNECTOR_END_PAD_Y - MARKER_TIP_OVERHANG_Y}
      stroke="var(--text-muted)"
      strokeWidth={CONNECTOR_STROKE_W}
      strokeLinecap="round"
      markerEnd={`url(#${markerId})`}
    />
  );
}

export default function SkillsInvocationDiagram() {
  const phase = useStaticAnimationPhase();
  const { wasReached } = useActs(ACTS, phase);
  const markerId = useId().replace(/:/g, '');

  const frameClass = (act: ActId) => clsx(styles.frame, wasReached(act) && styles.entered);
  const flowClass = (act: ActId) => clsx(styles.flowItem, wasReached(act) && styles.entered);
  const noteClass = (act: ActId) => clsx(styles.note, wasReached(act) && styles.entered);
  const stagger = (index: number): CSSProperties => ({ transitionDelay: `calc(var(--motion-stagger-sm) * ${index})` });

  return (
    <div style={{ maxWidth: `${VW}px`, margin: '0 auto' }}>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        role="img"
        aria-label="Two skill invocation paths: operator-triggered (you type /commit) versus model-invoked (agent auto-triggers based on task match)"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', maxWidth: `${VW}px`, margin: '0 auto' }}
      >
      <defs>
        <marker
          id={markerId}
          viewBox={`0 0 ${MARKER_W} ${MARKER_H}`}
          markerWidth={MARKER_W}
          markerHeight={MARKER_H}
          refX={MARKER_REF_X}
          refY={MARKER_REF_Y}
          orient="auto"
        >
          <polygon points={`0 0, ${MARKER_W} ${MARKER_H / 2}, 0 ${MARKER_H}`} fill="var(--text-muted)" />
        </marker>
      </defs>

      <line
        className={frameClass('frameDivider')}
        style={stagger(0)}
        x1={DIVIDER_X}
        y1={DIVIDER_TOP}
        x2={DIVIDER_X}
        y2={DIVIDER_BOTTOM}
        stroke="var(--border-default)"
        strokeWidth={1}
        strokeDasharray="4 3"
      />

      <text
        className={frameClass('frameTitles')}
        style={stagger(1)}
        x={A_CX}
        y={TITLE_Y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontFamily="var(--font-mono-keyword)"
        fill="var(--text-muted)"
        letterSpacing="0.06em"
      >
        OPERATOR-TRIGGERED
      </text>

      <Box
        bx={A_BX}
        by={A_Y[0]}
        color="var(--visual-neutral)"
        bg="var(--visual-bg-neutral)"
        label="Operator types /commit"
        fontFamily="var(--font-mono-human)"
        className={flowClass('operatorBox0')}
        style={stagger(0)}
      />
      <Connector
        cx={A_CX}
        fromY={A_Y[0]}
        toY={A_Y[1]}
        markerId={markerId}
        className={flowClass('operatorConnector0')}
        style={stagger(1)}
      />

      <Box
        bx={A_BX}
        by={A_Y[1]}
        color="var(--visual-violet)"
        bg="var(--visual-bg-violet)"
        label="Skill expands → context"
        fontFamily="var(--font-mono-ai)"
        className={flowClass('operatorBox1')}
        style={stagger(2)}
      />
      <Connector
        cx={A_CX}
        fromY={A_Y[1]}
        toY={A_Y[2]}
        markerId={markerId}
        className={flowClass('operatorConnector1')}
        style={stagger(3)}
      />

      <Box
        bx={A_BX}
        by={A_Y[2]}
        color="var(--visual-cyan)"
        bg="var(--visual-bg-cyan)"
        label="Agent executes"
        fontFamily="var(--font-mono-ai)"
        className={flowClass('operatorBox2')}
        style={stagger(4)}
      />

      <text
        className={noteClass('note0')}
        style={stagger(0)}
        x={A_CX}
        y={A_Y[2] + BOX_H + NOTE_OFFSET_Y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontFamily="var(--font-mono)"
        fill="var(--text-muted)"
        fontStyle="italic"
      >
        ✓ reliable — always works
      </text>
      <text
        className={noteClass('note1')}
        style={stagger(1)}
        x={A_CX}
        y={A_Y[2] + BOX_H + NOTE_OFFSET_Y + NOTE_STEP_Y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontFamily="var(--font-mono)"
        fill="var(--text-muted)"
        fontStyle="italic"
      >
        ✗ needs human to know it exists
      </text>

      <text
        className={frameClass('frameTitles')}
        style={stagger(1)}
        x={B_CX}
        y={TITLE_Y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontFamily="var(--font-mono-keyword)"
        fill="var(--text-muted)"
        letterSpacing="0.06em"
      >
        MODEL-INVOKED
      </text>

      <Box
        bx={B_BX}
        by={B_Y[0]}
        color="var(--visual-indigo)"
        bg="var(--visual-bg-indigo)"
        label="Agent reads skill metadata"
        fontFamily="var(--font-mono-ai)"
        className={flowClass('modelBox0')}
        style={stagger(0)}
      />
      <Connector
        cx={B_CX}
        fromY={B_Y[0]}
        toY={B_Y[1]}
        markerId={markerId}
        className={flowClass('modelConnector0')}
        style={stagger(1)}
      />

      <Box
        bx={B_BX}
        by={B_Y[1]}
        color="var(--visual-indigo)"
        bg="var(--visual-bg-indigo)"
        label="Recognizes task match"
        fontFamily="var(--font-mono-ai)"
        className={flowClass('modelBox1')}
        style={stagger(2)}
      />
      <Connector
        cx={B_CX}
        fromY={B_Y[1]}
        toY={B_Y[2]}
        markerId={markerId}
        className={flowClass('modelConnector1')}
        style={stagger(3)}
      />

      <Box
        bx={B_BX}
        by={B_Y[2]}
        color="var(--visual-violet)"
        bg="var(--visual-bg-violet)"
        label="Auto-triggers + expands"
        fontFamily="var(--font-mono-ai)"
        className={flowClass('modelBox2')}
        style={stagger(4)}
      />
      <Connector
        cx={B_CX}
        fromY={B_Y[2]}
        toY={B_Y[3]}
        markerId={markerId}
        className={flowClass('modelConnector2')}
        style={stagger(5)}
      />

      <Box
        bx={B_BX}
        by={B_Y[3]}
        color="var(--visual-cyan)"
        bg="var(--visual-bg-cyan)"
        label="Agent executes"
        fontFamily="var(--font-mono-ai)"
        className={flowClass('modelBox3')}
        style={stagger(6)}
      />

      <text
        className={noteClass('note2')}
        style={stagger(2)}
        x={B_CX}
        y={B_Y[3] + BOX_H + NOTE_OFFSET_Y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontFamily="var(--font-mono)"
        fill="var(--text-muted)"
        fontStyle="italic"
      >
        ✓ zero friction — auto-matches
      </text>
      <text
        className={noteClass('note3')}
        style={stagger(3)}
        x={B_CX}
        y={B_Y[3] + BOX_H + NOTE_OFFSET_Y + NOTE_STEP_Y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontFamily="var(--font-mono)"
        fill="var(--text-muted)"
        fontStyle="italic"
      >
        ✗ may pick wrong skill
      </text>
      </svg>
    </div>
  );
}
