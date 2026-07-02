import { useRef } from 'react';
import clsx from 'clsx';
import styles from './ArchitectureDiagram.module.css';
import shared from './diagram.module.css';
import { useStaticAnimationPhase } from '../../hooks/useStaticAnimationPhase';
import { useActs } from '../../hooks/useActs';
import { useStrokeDraw } from '../../hooks/useStrokeDraw';
import { useMounted } from '../../hooks/useMounted';
import { EmojiImage } from './ActorNodes';
import { EMOJI } from './emojiAssets';
import { CONNECTOR_STYLE } from './diagramConstants';
import { Ghost } from './Ghost';

// ViewBox 600x300 — two squircle containers side by side, mirrored layout.
//
// Left (structured):  container x=32  w=200  pipe x=50   blocks x=62  w=154
// Right (autonomous): container x=368 w=200  pipe x=386  blocks x=398 w=154

// --- Column geometry (8px grid) ---
const L_PIPE_X = 50;                        // left connector x
const L_BX = 62;                            // left block x
const BW = 154;                             // block width (both columns)
const BH = 28;                              // block height
const BR = 8;                               // block corner radius
const L_CX = 132;                           // left column center-x (headers, emoji, labels)
const R_CX = 468;                           // right column center-x
const L_BLOCK_CX = 139;                     // left block text center-x (62 + 154/2)
const R_PIPE_X = 386;                       // right connector x (368 + 18)
const R_BX = 398;                           // right block x (368 + 30)
const R_BLOCK_CX = 475;                     // right block text center-x (398 + 154/2)

const EMOJI_SIZE = 44;

// Block Y positions — uniform 32px gaps
const BLOCK_YS = [108, 140, 172, 204, 236] as const;

const ACTS = [
  { id: 'containers', threshold: 0.00 },
  { id: 'actors',     threshold: 0.10 },
  { id: 'step1',      threshold: 0.20 },
  { id: 'step2',      threshold: 0.35 },
  { id: 'step3',      threshold: 0.50 },
  { id: 'step4',      threshold: 0.65 },
  { id: 'step5',      threshold: 0.80 },
  { id: 'labels',     threshold: 0.90 },
] as const;

// Left connector — straight vertical line
const PIPE_D = 'M 50,104 L 50,268';

// Right connector — gentle sinusoidal wobble (~6px amplitude around x=386)
const WOBBLE_D =
  'M 386,104 C 392,136 380,140 386,172 C 392,204 380,208 386,240 L 386,268';

// Waypoint x-positions on the wobble curve at each block center-y
// Computed from cubic Bézier evaluation at y=108,140,172,204,236
const WOBBLE_XS = [386.7, 385.7, 386, 386.3, 385.3] as const;

const LEFT_STEPS = ['index', 'search', 'rank', 'traverse', 'synthesize'] as const;
const RIGHT_STEPS = ['scan', 'analyze', 'pivot', 'refine', 'synthesize'] as const;

const DELAY_80 = { transitionDelay: '80ms' } as const;

export default function ArchitectureDiagram() {
  const phase = useStaticAnimationPhase();
  const mounted = useMounted();
  const { wasReached } = useActs(ACTS, phase);

  const pipeRef = useRef<SVGPathElement>(null);
  useStrokeDraw(pipeRef, phase, 0.20, 0.80);
  const wobbleRef = useRef<SVGPathElement>(null);
  useStrokeDraw(wobbleRef, phase, 0.20, 0.80);

  const containers = mounted && wasReached('containers');
  const actors     = mounted && wasReached('actors');
  const step1      = mounted && wasReached('step1');
  const step2      = mounted && wasReached('step2');
  const step3      = mounted && wasReached('step3');
  const step4      = mounted && wasReached('step4');
  const step5      = mounted && wasReached('step5');
  const labels     = mounted && wasReached('labels');

  const stepFlags = [step1, step2, step3, step4, step5];

  return (
    <svg
      viewBox="0 0 600 300"
      width="100%"
      role="img"
      aria-label="Structured vs autonomous sub-agent architectures: reliability-flexibility tradeoff."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '600px', margin: '0 auto' }}
    >
      {/* Container outlines */}
      <rect
        x={32} y={48} width={200} height={228} rx={14}
        fill="none" stroke="var(--visual-neutral)" strokeWidth={2.5}
        className={clsx(styles.container, containers && styles.containerIn)}
      />
      <rect
        x={368} y={48} width={200} height={228} rx={14}
        fill="none" stroke="var(--visual-neutral)" strokeWidth={2.5}
        className={clsx(styles.container, containers && styles.containerIn)}
        style={containers ? DELAY_80 : undefined}
      />

      {/* Headers */}
      <text
        x={L_CX} y={40}
        className={clsx(styles.header, containers && styles.headerIn)}
        fill="var(--text-muted)" textAnchor="middle" fontSize={11} fontWeight={500}
      >
        STRUCTURED
      </text>
      <text
        x={R_CX} y={40}
        className={clsx(styles.header, containers && styles.headerIn)}
        fill="var(--text-muted)" textAnchor="middle" fontSize={11} fontWeight={500}
        style={containers ? DELAY_80 : undefined}
      >
        AUTONOMOUS
      </text>

      {/* Ghost placeholders — emoji positions */}
      <Ghost
        x={L_CX - EMOJI_SIZE / 2} y={56} width={EMOJI_SIZE} height={EMOJI_SIZE} rx={8}
        fill="var(--visual-bg-neutral)" stroke="var(--visual-neutral)"
        mounted={mounted} reached={actors}
      />
      <Ghost
        x={R_CX - EMOJI_SIZE / 2} y={56} width={EMOJI_SIZE} height={EMOJI_SIZE} rx={8}
        fill="var(--visual-bg-neutral)" stroke="var(--visual-neutral)"
        mounted={mounted} reached={actors}
      />

      {/* Ghost placeholders — left blocks */}
      {BLOCK_YS.map((y, i) => (
        <Ghost key={`gl${i}`} x={L_BX} y={y} width={BW} height={BH} rx={BR}
          fill="var(--visual-bg-cyan)" stroke="var(--visual-cyan)"
          mounted={mounted} reached={stepFlags[i]} />
      ))}

      {/* Ghost placeholders — right blocks */}
      {BLOCK_YS.map((y, i) => (
        <Ghost key={`gr${i}`} x={R_BX} y={y} width={BW} height={BH} rx={BR}
          fill="var(--visual-bg-violet)" stroke="var(--visual-violet)"
          mounted={mounted} reached={stepFlags[i]} />
      ))}

      {/* Left connector — straight vertical with waypoint dots */}
      <path
        ref={pipeRef}
        className={clsx(shared.connector, step1 && shared.connectorDrawing)}
        d={PIPE_D}
        {...CONNECTOR_STYLE}
      />
      <circle cx={L_PIPE_X} cy={104} r={4}
        fill="var(--text-muted)"
        className={clsx(shared.connector, step1 && shared.connectorDrawing)}
      />
      {BLOCK_YS.slice(1).map((cy) => (
        <circle key={cy} cx={L_PIPE_X} cy={cy} r={3}
          fill="var(--text-muted)"
          className={clsx(shared.connector, step1 && shared.connectorDrawing)}
        />
      ))}
      <circle cx={L_PIPE_X} cy={268} r={4}
        fill="var(--text-muted)"
        className={clsx(shared.connector, step5 && shared.connectorDrawing)}
      />

      {/* Right connector — gentle wobble with waypoint dots */}
      <path
        ref={wobbleRef}
        className={clsx(shared.connector, step1 && shared.connectorDrawing)}
        d={WOBBLE_D}
        {...CONNECTOR_STYLE}
      />
      <circle cx={R_PIPE_X} cy={104} r={4}
        fill="var(--text-muted)"
        className={clsx(shared.connector, step1 && shared.connectorDrawing)}
      />
      {BLOCK_YS.slice(1).map((cy, i) => (
        <circle key={cy} cx={WOBBLE_XS[i + 1]} cy={cy} r={3}
          fill="var(--text-muted)"
          className={clsx(shared.connector, step1 && shared.connectorDrawing)}
        />
      ))}
      <circle cx={R_PIPE_X} cy={268} r={4}
        fill="var(--text-muted)"
        className={clsx(shared.connector, step5 && shared.connectorDrawing)}
      />

      {/* Emoji actors */}
      <g className={clsx(styles.emojiNode, actors && styles.emojiNodeIn)}>
        <EmojiImage asset={EMOJI.map} x={L_CX} y={56 + EMOJI_SIZE / 2} size={EMOJI_SIZE} />
      </g>
      <g className={clsx(styles.emojiNode, actors && styles.emojiNodeIn)} style={actors ? DELAY_80 : undefined}>
        <EmojiImage asset={EMOJI.compass} x={R_CX} y={56 + EMOJI_SIZE / 2} size={EMOJI_SIZE} />
      </g>

      {/* Left blocks — cyan */}
      {BLOCK_YS.map((y, i) => (
        <g key={`lb${i}`}
          className={clsx(styles.block, stepFlags[i] && styles.blockIn)}
          style={i > 0 && stepFlags[i] ? DELAY_80 : undefined}
        >
          <rect x={L_BX} y={y} width={BW} height={BH} rx={BR}
            fill="var(--visual-bg-cyan)" stroke="var(--visual-cyan)" strokeWidth={1} />
          <text x={L_BLOCK_CX} y={y + 18} textAnchor="middle" fontSize={11} fill="var(--visual-cyan)"
            fontFamily="var(--font-mono)" fontWeight={500}>{LEFT_STEPS[i]}</text>
        </g>
      ))}

      {/* Right blocks — violet */}
      {BLOCK_YS.map((y, i) => (
        <g key={`rb${i}`}
          className={clsx(styles.block, stepFlags[i] && styles.blockIn)}
          style={stepFlags[i] ? DELAY_80 : undefined}
        >
          <rect x={R_BX} y={y} width={BW} height={BH} rx={BR}
            fill="var(--visual-bg-violet)" stroke="var(--visual-violet)" strokeWidth={1} />
          <text x={R_BLOCK_CX} y={y + 18} textAnchor="middle" fontSize={11} fill="var(--visual-violet)"
            fontFamily="var(--font-mono)" fontWeight={500}>{RIGHT_STEPS[i]}</text>
        </g>
      ))}

      {/* Bottom summary labels */}
      <text
        x={L_CX} y={288}
        className={clsx(styles.summaryLabel, labels && styles.summaryLabelIn)}
        fill="var(--text-muted)" textAnchor="middle" fontSize={11} fontWeight={500}
      >
        Reliable · Scalable
      </text>
      <text
        x={R_CX} y={288}
        className={clsx(styles.summaryLabel, labels && styles.summaryLabelIn)}
        fill="var(--text-muted)" textAnchor="middle" fontSize={11} fontWeight={500}
        style={labels ? DELAY_80 : undefined}
      >
        Flexible · Dynamic
      </text>
    </svg>
  );
}
