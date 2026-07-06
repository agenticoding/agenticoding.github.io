import { useRef } from 'react';
import clsx from 'clsx';
import styles from './SubAgentDiagram.module.css';
import shared from './diagram.module.css';
import { useStaticAnimationPhase } from '../../hooks/useStaticAnimationPhase';
import { useActs } from '../../hooks/useActs';
import { useStrokeDraw } from '../../hooks/useStrokeDraw';
import { useMounted } from '../../hooks/useMounted';
import { AgentNode } from './ActorNodes';
import { ARROWHEAD_POINTS_STD, arrowOpacity, CONNECTOR_STYLE } from './diagramConstants';
import { Ghost } from './Ghost';
import { ContextLensZoneBackdrop } from './ContextLensWindow';

// ViewBox 600x300 — two sharp containers side by side.
//
// Left (orchestrator):  container x=32  w=200  center=132  blocks x=48  w=168
// Right (sub-agent):    container x=360 w=200  center=460  blocks x=376 w=168
//
// Delegate arrow curves above (orchestrator → sub-agent).
// Return arrow curves below (sub-agent → orchestrator).

const ORCH_ICON = 40;                       // orchestrator = 40×40
const ORCH_HALF = ORCH_ICON / 2;
const WORKER_ICON = 32;                     // worker/delegate = 32×32
const WORKER_HALF = WORKER_ICON / 2;

// --- Column geometry (8px grid) ---
const L_BX = 48;                            // left block x
const R_BX = 376;                           // right block x
const BW = 168;                             // block width
const BH = 32;                              // block height
const L_CX = L_BX + BW / 2;                // 132 — left column center-x
const R_CX = R_BX + BW / 2;                // 460 — right column center-x

const ACTS = [
  { id: 'containers', threshold: 0.00 },
  { id: 'actors',     threshold: 0.10 },
  { id: 'delegate',   threshold: 0.20 },
  { id: 'search',     threshold: 0.38 },
  { id: 'reads',      threshold: 0.52 },
  { id: 'reasons',    threshold: 0.66 },
  { id: 'synthesize', threshold: 0.80 },
  { id: 'totals',     threshold: 0.92 },
] as const;

// Delegate: quadratic bézier arching above between containers.
// Endpoints at container edges (x=232, x=360), control point at midpoint x=296.
// Tangent at tip: (360−296, 72−48) = (64, 24) → angle ≈ 20.6°
const DELEGATE_D = 'M 232 72 Q 296 48 360 72';
const DELEGATE_TIP_ANGLE = 20.6;

// Return: quadratic bézier arching below between containers.
// Tangent at tip: (232−296, 216−248) = (−64, −32) → angle ≈ 206.6°
const RETURN_D = 'M 360 216 Q 296 248 232 216';
const RETURN_TIP_ANGLE = 206.6;

const DELAY_80 = { transitionDelay: '80ms' } as const;

export default function SubAgentDiagram() {
  const phase = useStaticAnimationPhase();
  const mounted = useMounted();
  const { wasReached } = useActs(ACTS, phase);

  const delegateRef = useRef<SVGPathElement>(null);
  const tDelegate = useStrokeDraw(delegateRef, phase, 0.20, 0.36);
  const returnRef = useRef<SVGPathElement>(null);
  const tReturn = useStrokeDraw(returnRef, phase, 0.80, 0.90);

  const containers = mounted && wasReached('containers');
  const actors     = mounted && wasReached('actors');
  const delegate   = mounted && wasReached('delegate');
  const search     = mounted && wasReached('search');
  const reads      = mounted && wasReached('reads');
  const reasons    = mounted && wasReached('reasons');
  const synthesize = mounted && wasReached('synthesize');
  const totals     = mounted && wasReached('totals');

  return (
    <svg
      viewBox="0 0 600 300"
      width="100%"
      role="img"
      aria-label="Sub-agent context isolation: orchestrator delegates research, sub-agent processes 50,000 tokens, returns 2,000 token synthesis."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '600px', margin: '0 auto' }}
    >
      {/* Context windows render before outlines so the container border remains crisp. */}
      <g className={clsx(styles.container, containers && styles.containerIn)}>
        <ContextLensZoneBackdrop x={32} y={40} width={200} height={224} />
      </g>
      <g className={clsx(styles.container, containers && styles.containerIn)} style={containers ? DELAY_80 : undefined}>
        <ContextLensZoneBackdrop x={360} y={40} width={200} height={224} />
      </g>
      <rect
        x={32} y={40} width={200} height={224} rx={0}
        fill="none" stroke="var(--visual-neutral)" strokeWidth={2.5}
        className={clsx(styles.container, containers && styles.containerIn)}
      />
      <rect
        x={360} y={40} width={200} height={224} rx={0}
        fill="none" stroke="var(--visual-neutral)" strokeWidth={2.5}
        className={clsx(styles.container, containers && styles.containerIn)}
        style={containers ? DELAY_80 : undefined}
      />

      {/* Headers — y=32 (8px grid) */}
      <text
        x={L_CX} y={32}
        className={clsx(styles.header, containers && styles.headerIn)}
        fill="var(--text-muted)" textAnchor="middle" fontSize={11} fontWeight={500}
      >
        ORCHESTRATOR
      </text>
      <text
        x={R_CX} y={32}
        className={clsx(styles.header, containers && styles.headerIn)}
        fill="var(--text-muted)" textAnchor="middle" fontSize={11} fontWeight={500}
        style={containers ? DELAY_80 : undefined}
      >
        SUB-AGENT
      </text>

      {/* Ghost placeholders — actor positions */}
      <Ghost
        x={L_CX - ORCH_HALF} y={56} width={ORCH_ICON} height={ORCH_ICON}
        fill="var(--visual-bg-neutral)" stroke="var(--visual-neutral)"
        mounted={mounted} reached={actors}
      />
      <Ghost
        x={R_CX - WORKER_HALF} y={56} width={WORKER_ICON} height={WORKER_ICON}
        fill="var(--visual-bg-neutral)" stroke="var(--visual-neutral)"
        mounted={mounted} reached={actors}
      />

      {/* Ghost placeholders — left blocks */}
      <Ghost
        x={L_BX} y={112} width={BW} height={BH} rx={0}
        fill="var(--visual-bg-neutral)" stroke="var(--visual-neutral)"
        mounted={mounted} reached={delegate}
      />
      <Ghost
        x={L_BX} y={200} width={BW} height={BH} rx={0}
        fill="var(--visual-bg-magenta)" stroke="var(--visual-magenta)"
        mounted={mounted} reached={synthesize}
      />

      {/* Ghost placeholders — right blocks */}
      <Ghost
        x={R_BX} y={112} width={BW} height={BH} rx={0}
        fill="var(--visual-bg-cyan)" stroke="var(--visual-cyan)"
        mounted={mounted} reached={search}
      />
      <Ghost
        x={R_BX} y={152} width={BW} height={BH} rx={0}
        fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)"
        mounted={mounted} reached={reads}
      />
      <Ghost
        x={R_BX} y={192} width={BW} height={BH} rx={0}
        fill="var(--visual-bg-violet)" stroke="var(--visual-violet)"
        mounted={mounted} reached={reasons}
      />

      {/* Delegate arrow + arrowhead + label */}
      <path
        ref={delegateRef}
        className={clsx(shared.connector, delegate && shared.connectorDrawing)}
        d={DELEGATE_D}
        {...CONNECTOR_STYLE}
      />
      <g transform={`translate(360,72) rotate(${DELEGATE_TIP_ANGLE})`} style={{ opacity: arrowOpacity(tDelegate) }}>
        <polygon points={ARROWHEAD_POINTS_STD} fill="var(--text-muted)" />
      </g>
      <text
        x={296} y={40}
        className={clsx(shared.label, delegate && shared.labelIn)}
        fill="var(--text-muted)" textAnchor="middle" fontSize={11} fontWeight={500}
        fontFamily="var(--font-mono)" fontStyle="italic"
      >
        delegate
      </text>

      {/* Return arrow + arrowhead + label */}
      <path
        ref={returnRef}
        className={clsx(shared.connector, synthesize && shared.connectorDrawing)}
        d={RETURN_D}
        {...CONNECTOR_STYLE}
      />
      <g transform={`translate(232,216) rotate(${RETURN_TIP_ANGLE})`} style={{ opacity: arrowOpacity(tReturn) }}>
        <polygon points={ARROWHEAD_POINTS_STD} fill="var(--text-muted)" />
      </g>
      <text
        x={296} y={264}
        className={clsx(shared.label, synthesize && shared.labelIn)}
        fill="var(--text-muted)" textAnchor="middle" fontSize={11} fontWeight={500}
        fontFamily="var(--font-mono)" fontStyle="italic"
      >
        synthesize
      </text>

      {/* Emoji actors — orchestrator 40×40, worker 32×32 */}
      <g className={clsx(styles.actor, actors && styles.actorIn)}>
        <AgentNode x={L_CX - ORCH_HALF} y={56} size={ORCH_ICON} />
      </g>
      <g className={clsx(styles.actor, actors && styles.actorIn)} style={actors ? DELAY_80 : undefined}>
        <AgentNode x={R_CX - WORKER_HALF} y={56} size={WORKER_ICON} />
      </g>

      {/* Orchestrator — task card (appears with delegate) */}
      <g className={clsx(styles.block, delegate && styles.blockIn)}>
        <rect x={L_BX} y={112} width={BW} height={BH} rx={0}
          fill="var(--visual-bg-neutral)" stroke="var(--visual-neutral)" strokeWidth={1} />
        <text x={L_CX} y={132} textAnchor="middle" fontSize={11} fill="var(--text-muted)"
          fontFamily="var(--font-mono)">
          research JWT auth
        </text>
      </g>

      {/* Sub-agent — staggered research blocks */}
      <g className={clsx(styles.block, search && styles.blockIn)}>
        <rect x={R_BX} y={112} width={BW} height={BH} rx={0}
          fill="var(--visual-bg-cyan)" stroke="var(--visual-cyan)" strokeWidth={1} />
        <text x={R_CX} y={132} textAnchor="middle" fontSize={11} fill="var(--visual-cyan)"
          fontFamily="var(--font-mono)" fontWeight={500}>
          search 15K
        </text>
      </g>
      <g className={clsx(styles.block, reads && styles.blockIn)}>
        <rect x={R_BX} y={152} width={BW} height={BH} rx={0}
          fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)" strokeWidth={1} />
        <text x={R_CX} y={172} textAnchor="middle" fontSize={11} fill="var(--visual-indigo)"
          fontFamily="var(--font-mono)" fontWeight={500}>
          reads 20K
        </text>
      </g>
      <g className={clsx(styles.block, reasons && styles.blockIn)}>
        <rect x={R_BX} y={192} width={BW} height={BH} rx={0}
          fill="var(--visual-bg-violet)" stroke="var(--visual-violet)" strokeWidth={1} />
        <text x={R_CX} y={212} textAnchor="middle" fontSize={11} fill="var(--visual-violet)"
          fontFamily="var(--font-mono)" fontWeight={500}>
          reasons 15K
        </text>
      </g>

      {/* Orchestrator — synthesis result (appears with return arrow) */}
      <g className={clsx(styles.block, synthesize && styles.blockIn)}>
        <rect x={L_BX} y={200} width={BW} height={BH} rx={0}
          fill="var(--visual-bg-magenta)" stroke="var(--visual-magenta)" strokeWidth={1} />
        <text x={L_CX} y={220} textAnchor="middle" fontSize={11} fill="var(--visual-magenta)"
          fontFamily="var(--font-mono)" fontWeight={500}>
          synthesis 2K
        </text>
      </g>

      {/* Token count labels */}
      <text
        x={L_CX} y={280}
        className={clsx(styles.tokenLabel, totals && styles.tokenLabelIn)}
        fill="var(--text-muted)" textAnchor="middle" fontSize={13} fontWeight={600}
      >
        2,000 tokens
      </text>
      <text
        x={R_CX} y={280}
        className={clsx(styles.tokenLabel, totals && styles.tokenLabelIn)}
        fill="var(--text-muted)" textAnchor="middle" fontSize={13} fontWeight={600}
        style={totals ? DELAY_80 : undefined}
      >
        50,000 tokens
      </text>
    </svg>
  );
}
