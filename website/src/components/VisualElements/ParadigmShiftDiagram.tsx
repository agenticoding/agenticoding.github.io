import React, { useRef } from 'react';
import clsx from 'clsx';
import styles from './ParadigmShiftDiagram.module.css';
import shared from './diagram.module.css';
import { OperatorNode, AgentNode, NotoEmoji } from './ActorNodes';
import { Ghost } from './Ghost';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import { useActs } from '../../hooks/useActs';
import { useStrokeDraw } from '../../hooks/useStrokeDraw';
import { usePhaseProgress } from '../../hooks/usePhaseProgress';
import { useMounted } from '../../hooks/useMounted';
import { CONNECTOR_STYLE } from './diagramConstants';

// Layout — ViewBox 480×264
//
// Scene A: OperatorNode x=186 y=90 s=44 → center (208,112); handsaw x=248 y=98 s=36
// Scene B vertical hierarchy:
//   Tier 1: OperatorNode x=220 y=16 s=40 → center (240,36) bottom=56
//   Tier 2: AgentNodes s=32 at x=128/224/320 y=92 → centers (144/240/336,108) top=92 bottom=124
//   Tier 3: Factory emoji x=204 y=160 s=72 → center (240,196) top=160
//
// Fan connectors (operator → agents):
//   FAN_L: M 240 56 Q 192 72 144 92
//   FAN_C: M 240 56 L 240 92
//   FAN_R: M 240 56 Q 288 72 336 92
//
// Converge connectors (agents → factory):
//   CONV_L: M 144 124 Q 192 144 240 160
//   CONV_C: M 240 124 L 240 160
//   CONV_R: M 336 124 Q 288 144 240 160

const ACTS = [
  { id: 'transition', threshold: 0.25 },
  { id: 'dispatch',   threshold: 0.50 },
  { id: 'converge',   threshold: 0.70 },
] as const;

const AGENT_POSITIONS = [
  { x: 128, y: 92 },
  { x: 224, y: 92 },
  { x: 320, y: 92 },
] as const;

export default function ParadigmShiftDiagram() {
  const phase = useAnimationPhase();
  const { wasReached } = useActs(ACTS, phase);
  const mounted = useMounted();

  const transitioned    = mounted && wasReached('transition');
  const dispatched      = mounted && wasReached('dispatch');
  const converged       = mounted && wasReached('converge');
  const fanVisible      = mounted && phase >= 0.35;
  const convergeVisible = mounted && phase >= 0.55;

  // Operator moves from Scene A → Scene B position as the user scrolls.
  // Window [0.18, 0.35]: starts before the scene crossfade (0.25) and
  // settles just after, so the operator leads the transition visually.
  const moveT  = usePhaseProgress(phase, 0.18, 0.35);
  const opX    = 186 + (220 - 186) * moveT;  // 186 → 220
  const opY    = 90  + (16  - 90)  * moveT;  // 90  → 16
  const opSize = Math.round(44 + (40 - 44) * moveT);  // 44  → 40

  // 6 connector refs — fan (L/C/R) then converge (L/C/R)
  const fanLRef  = useRef<SVGGeometryElement>(null);
  const fanCRef  = useRef<SVGGeometryElement>(null);
  const fanRRef  = useRef<SVGGeometryElement>(null);
  const convLRef = useRef<SVGGeometryElement>(null);
  const convCRef = useRef<SVGGeometryElement>(null);
  const convRRef = useRef<SVGGeometryElement>(null);

  useStrokeDraw(fanLRef,  phase, 0.35, 0.50);
  useStrokeDraw(fanCRef,  phase, 0.35, 0.50);
  useStrokeDraw(fanRRef,  phase, 0.35, 0.50);
  useStrokeDraw(convLRef, phase, 0.55, 0.70);
  useStrokeDraw(convCRef, phase, 0.55, 0.70);
  useStrokeDraw(convRRef, phase, 0.55, 0.70);

  return (
    <svg
      viewBox="0 0 480 264"
      width="100%"
      height="auto"
      role="img"
      aria-label="Paradigm shift: the same operator moves from working with hand tools to directing three agents that collectively feed a factory below."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '480px', margin: '0 auto' }}
    >
      {/* Scene A — Craft Era */}
      <g
        className={clsx(styles.sceneA, transitioned && styles.sceneAOut)}
        style={{ transformOrigin: '240px 132px' }}
      >
        <NotoEmoji codepoint="1fa9a" x={248} y={98} size={36} />
        <text
          x={240} y={178}
          fill="var(--visual-neutral)"
          style={{ fontFamily: 'var(--font-mono-human)' }}
          fontSize={11} fontWeight={400} textAnchor="middle"
        >You + hand tools</text>
      </g>

      {/* Scene B — Agent Era */}
      <g
        className={clsx(styles.sceneB, transitioned && styles.sceneBIn)}
        style={{ transformOrigin: '240px 132px' }}
      >
        {/* Ghost agent placeholders — visual mass before dispatch */}
        {AGENT_POSITIONS.map((agent, i) => (
          <Ghost
            key={`ghost-${i}`}
            x={agent.x + 2} y={agent.y + 2}
            width={28} height={28} rx={6}
            fill="var(--visual-bg-violet)" stroke="var(--visual-violet)"
            mounted={mounted} reached={dispatched}
          />
        ))}

        {/* Fan connectors — operator bottom → agent tops */}
        <path
          ref={fanLRef}
          d="M 240 56 Q 192 72 144 92"
          {...CONNECTOR_STYLE}
          className={clsx(shared.connector, fanVisible && shared.connectorDrawing)}
        />
        <path
          ref={fanCRef}
          d="M 240 56 L 240 92"
          {...CONNECTOR_STYLE}
          className={clsx(shared.connector, fanVisible && shared.connectorDrawing)}
        />
        <path
          ref={fanRRef}
          d="M 240 56 Q 288 72 336 92"
          {...CONNECTOR_STYLE}
          className={clsx(shared.connector, fanVisible && shared.connectorDrawing)}
        />

        {/* Tier 2 — Agents */}
        {AGENT_POSITIONS.map((agent, i) => (
          <g key={`agent-${i}`} className={clsx(styles.agentNode, dispatched && styles.agentNodeIn)}>
            <AgentNode x={agent.x} y={agent.y} size={32} />
          </g>
        ))}

        {/* Converge connectors — agent bottoms → factory top */}
        <path
          ref={convLRef}
          d="M 144 124 Q 192 144 240 160"
          {...CONNECTOR_STYLE}
          className={clsx(shared.connector, convergeVisible && shared.connectorDrawing)}
        />
        <path
          ref={convCRef}
          d="M 240 124 L 240 160"
          {...CONNECTOR_STYLE}
          className={clsx(shared.connector, convergeVisible && shared.connectorDrawing)}
        />
        <path
          ref={convRRef}
          d="M 336 124 Q 288 144 240 160"
          {...CONNECTOR_STYLE}
          className={clsx(shared.connector, convergeVisible && shared.connectorDrawing)}
        />

        {/* Ghost factory placeholder — visual mass before converge */}
        <Ghost
          x={208} y={164}
          width={64} height={64} rx={10}
          fill="var(--visual-bg-violet)" stroke="var(--visual-violet)"
          mounted={mounted} reached={converged}
        />

        {/* Tier 3 — Factory */}
        <g className={clsx(styles.factoryNode, converged && styles.factoryNodeIn)}>
          <NotoEmoji codepoint="1f3ed" x={204} y={160} size={72} />
        </g>

        {/* Label */}
        <text
          x={240} y={248}
          fill="var(--visual-neutral)"
          style={{ fontFamily: 'var(--font-mono-ai)' }}
          fontSize={11} fontWeight={500} textAnchor="middle"
        >You + agent factory</text>
      </g>

      {/* Persistent operator — stays visible throughout, moves between scenes */}
      <OperatorNode x={opX} y={opY} size={opSize} />
    </svg>
  );
}
