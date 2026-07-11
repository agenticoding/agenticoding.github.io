import clsx from 'clsx';
import styles from './MCPToolSchemaDiagram.module.css';
import {
  ContextLensFrame,
  toneBg,
  toneColor,
  type ContextLensTone,
  type ContextLensZone,
} from './ContextLensWindow';
import { ArrowMarker, trimPathEnd } from './diagramGeometry';
import { DIAGRAM_STROKE } from './diagramScale';

const ARROW_COLOR = 'var(--visual-indigo)';
const DESKTOP = { w: 760, h: 482 } as const;
const MOBILE = { w: 340, h: 1090 } as const;
const STARTUP = { w: 214, h: 132 } as const;
const MOBILE_STARTUP = { w: 216, h: 132 } as const;

type Mode = 'eager' | 'deferred';
type Orientation = 'horizontal' | 'vertical';
type Step = { label: string; semantic?: boolean; delay: string; w?: number };
type StartupBlock = {
  label: string;
  zone: ContextLensZone;
  tone: ContextLensTone;
  offset?: number;
  width?: number;
  dashed?: boolean;
};

type TextProps = {
  x: number;
  y: number;
  children: React.ReactNode;
  className: string;
  anchor?: 'start' | 'middle' | 'end';
  fill?: string;
};

const EAGER_BLOCKS: readonly StartupBlock[] = [
  { label: 'schema A', zone: 'primacy', tone: 'indigo', offset: 0 },
  { label: 'schema B', zone: 'primacy', tone: 'indigo', offset: 22 },
  { label: 'schema C', zone: 'middle', tone: 'indigo', offset: -4 },
  { label: 'user task', zone: 'middle', tone: 'warning', offset: 20 },
];

const DEFERRED_BLOCKS: readonly StartupBlock[] = [
  { label: 'ToolSearch index', zone: 'primacy', tone: 'indigo', width: 150 },
  { label: 'user task', zone: 'primacy', tone: 'success', offset: 28 },
];

const EAGER_STEPS: readonly Step[] = [
  { label: 'Plan', delay: '900ms', w: 76 },
  { label: 'Call tool', semantic: true, delay: '1500ms', w: 104 },
];

const DEFERRED_STEPS: readonly Step[] = [
  { label: 'Search', semantic: true, delay: '900ms', w: 82 },
  { label: 'Load schema', semantic: true, delay: '1500ms', w: 112 },
  { label: 'Call tool', semantic: true, delay: '2100ms', w: 96 },
];

function Text({ x, y, children, className, anchor = 'start', fill = 'var(--text-body)' }: TextProps) {
  return <text x={x} y={y} textAnchor={anchor} className={className} fill={fill}>{children}</text>;
}

function FlowNode({ x, y, w, label, semantic = false, delay }: Step & { x: number; y: number; w: number }) {
  return (
    <g className={clsx(styles.flowNode, semantic && styles.semanticNode)} style={{ animationDelay: delay }} aria-hidden="true">
      <rect x={x} y={y} width={w} height={36} rx={0} fill={semantic ? 'var(--visual-bg-indigo)' : 'var(--surface-page)'} stroke={semantic ? 'var(--visual-indigo)' : 'var(--border-default)'} strokeWidth={1.5} />
      <Text x={x + w / 2} y={y + 23} anchor="middle" className={styles.flowLabel} fill={semantic ? 'var(--visual-indigo)' : 'var(--text-body)'}>{label}</Text>
    </g>
  );
}

function Arrow({ d, markerId, delay }: { d: string; markerId: string; delay: string }) {
  return (
    <path
      d={trimPathEnd(d)}
      fill="none"
      stroke={ARROW_COLOR}
      strokeWidth={DIAGRAM_STROKE.connector}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      markerEnd={`url(#${markerId})`}
      className={styles.flowArrow}
      style={{ animationDelay: delay }}
      aria-hidden="true"
    />
  );
}

function StartupContext({ x, y, width, height, mode }: { x: number; y: number; width: number; height: number; mode: Mode }) {
  const blocks = mode === 'eager' ? EAGER_BLOCKS : DEFERRED_BLOCKS;
  return (
    <g>
      <Text x={x} y={y - 10} className={styles.stageLabel} fill="var(--text-muted)">STARTUP REQUEST</Text>
      <ContextLensFrame x={x} y={y} width={width} height={height}>
        {blocks.map((block) => <StartupBlockShape key={block.label} block={block} x={x} y={y} width={width} height={height} />)}
      </ContextLensFrame>
      {mode === 'eager' ? <PressureMarker x={x + width - 80} y={y + 104} /> : null}
    </g>
  );
}

function StartupBlockShape({ block, x, y, width, height }: { block: StartupBlock; x: number; y: number; width: number; height: number }) {
  const zoneH = height / 3;
  const blockH = 18;
  const blockW = block.width ?? width - 28;
  const bx = x + 12;
  const by = y + zoneIndex(block.zone) * zoneH + 8 + (block.offset ?? 0);
  return (
    <g>
      <rect x={bx} y={by} width={blockW} height={blockH} rx={0} fill={toneBg(block.tone)} stroke={toneColor(block.tone)} strokeWidth={1.5} strokeDasharray={block.dashed ? '4 3' : undefined} />
      <Text x={bx + blockW / 2} y={by + 13} anchor="middle" className={styles.blockLabel} fill={toneColor(block.tone)}>{block.label}</Text>
    </g>
  );
}

function zoneIndex(zone: ContextLensZone) {
  return zone === 'primacy' ? 0 : zone === 'middle' ? 1 : 2;
}

function PressureMarker({ x, y }: { x: number; y: number }) {
  return (
    <g aria-hidden="true">
      <path className={styles.pressureArrow} d={`M ${x} ${y - 26} V ${y - 6} m -5 -5 l 5 5 5 -5`} />
      <Text x={x + 10} y={y - 8} className={styles.pressureText} fill="var(--visual-warning)">context tax</Text>
    </g>
  );
}

function Flow({ x, y, steps, markerId, orientation }: { x: number; y: number; steps: readonly Step[]; markerId: string; orientation: Orientation }) {
  if (orientation === 'vertical') return <VerticalFlow x={x} y={y} steps={steps} markerId={markerId} />;
  return <HorizontalFlow x={x} y={y} steps={steps} markerId={markerId} />;
}

function HorizontalFlow({ x, y, steps, markerId }: { x: number; y: number; steps: readonly Step[]; markerId: string }) {
  let cursor = x;
  return <g>{steps.map((step, index) => renderHorizontalStep(step, index, steps, cursor, y, markerId, (next) => { cursor = next; }))}</g>;
}

function renderHorizontalStep(step: Step, index: number, steps: readonly Step[], x: number, y: number, markerId: string, setNext: (x: number) => void) {
  const w = step.w ?? 92;
  const gap = 26;
  setNext(x + w + gap);
  return (
    <g key={step.label}>
      <FlowNode x={x} y={y} w={w} {...step} />
      {index < steps.length - 1 ? <Arrow d={`M ${x + w} ${y + 18} H ${x + w + gap}`} markerId={markerId} delay={steps[index + 1].delay} /> : null}
    </g>
  );
}

function VerticalFlow({ x, y, steps, markerId }: { x: number; y: number; steps: readonly Step[]; markerId: string }) {
  const nodeW = 136;
  const nodeH = 36;
  const gap = 30;
  return <g>{steps.map((step, index) => <VerticalStep key={step.label} {...{ step, index, steps, x, y, nodeW, nodeH, gap, markerId }} />)}</g>;
}

function VerticalStep({ step, index, steps, x, y, nodeW, nodeH, gap, markerId }: { step: Step; index: number; steps: readonly Step[]; x: number; y: number; nodeW: number; nodeH: number; gap: number; markerId: string }) {
  const nodeY = y + index * (nodeH + gap);
  return (
    <g>
      <FlowNode x={x} y={nodeY} w={nodeW} {...step} />
      {index < steps.length - 1 ? <Arrow d={`M ${x + nodeW / 2} ${nodeY + nodeH} V ${nodeY + nodeH + gap}`} markerId={markerId} delay={steps[index + 1].delay} /> : null}
    </g>
  );
}

function Lane({ mode, x, y, startupWidth, startupHeight, orientation, markerId }: {
  mode: Mode;
  x: number;
  y: number;
  startupWidth: number;
  startupHeight: number;
  orientation: Orientation;
  markerId: string;
}) {
  const eager = mode === 'eager';
  const steps = eager ? EAGER_STEPS : DEFERRED_STEPS;
  const flowX = orientation === 'horizontal' ? x + startupWidth + 54 : x + 40;
  const flowY = orientation === 'horizontal' ? y + 62 : y + startupHeight + 58;
  return (
    <g>
      <LaneHeader x={x} y={y} mode={mode} />
      <StartupContext x={x} y={y + 50} width={startupWidth} height={startupHeight} mode={mode} />
      <RuntimePath x={flowX} y={flowY + 16} mode={mode} steps={steps} markerId={markerId} orientation={orientation} />
      <Tradeoff x={tradeoffX(x, flowX, orientation)} y={tradeoffY(y, flowY + 16, steps.length, orientation)} mode={mode} anchor={orientation === 'horizontal' ? 'start' : 'middle'} />
    </g>
  );
}

function LaneHeader({ x, y, mode }: { x: number; y: number; mode: Mode }) {
  const title = mode === 'eager' ? 'Eager loading' : 'Deferred loading';
  const subtitle = mode === 'eager' ? 'pay context cost before planning' : 'pay lookup cost only when needed';
  return (
    <g>
      <Text x={x} y={y} className={styles.laneTitle} fill="var(--text-heading)">{title}</Text>
      <Text x={x} y={y + 18} className={styles.laneSubtitle} fill="var(--text-muted)">{subtitle}</Text>
    </g>
  );
}

function RuntimePath({ x, y, mode, steps, markerId, orientation }: { x: number; y: number; mode: Mode; steps: readonly Step[]; markerId: string; orientation: Orientation }) {
  return (
    <g>
      <Text x={x} y={y - 14} className={styles.stageLabel} fill="var(--text-muted)">RUNTIME CALL PATH</Text>
      <Flow x={x} y={y} steps={steps} markerId={markerId} orientation={orientation} />
      {mode === 'deferred' ? <RuntimeSchema x={schemaX(x, orientation)} y={schemaY(y, orientation)} /> : null}
    </g>
  );
}

function RuntimeSchema({ x, y }: { x: number; y: number }) {
  return (
    <g className={styles.runtimeSchema} aria-hidden="true">
      <rect x={x} y={y} width={96} height={26} rx={0} fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)" strokeWidth={1.5} strokeDasharray="4 3" />
      <Text x={x + 48} y={y + 18} anchor="middle" className={styles.blockLabel} fill="var(--visual-indigo)">schema now</Text>
    </g>
  );
}

function Tradeoff({ x, y, mode, anchor }: { x: number; y: number; mode: Mode; anchor: 'start' | 'middle' }) {
  const lines = mode === 'eager'
    ? [{ text: '+ direct call', fill: 'var(--visual-success)' }, { text: '− fixed context tax', fill: 'var(--visual-warning)' }]
    : [{ text: '+ compact startup', fill: 'var(--visual-success)' }, { text: '− runtime schema hop', fill: 'var(--visual-warning)' }];
  return <g>{lines.map((line, index) => <Text key={line.text} x={x} y={y + index * 18} anchor={anchor} className={styles.tradeoffText} fill={line.fill}>{line.text}</Text>)}</g>;
}

function tradeoffX(laneX: number, flowX: number, orientation: Orientation) {
  return orientation === 'horizontal' ? flowX : laneX + MOBILE_STARTUP.w / 2;
}

function tradeoffY(laneY: number, flowY: number, stepCount: number, orientation: Orientation) {
  if (orientation === 'horizontal') return flowY + 76;
  return flowY + stepCount * 66 + 12;
}

function schemaX(flowX: number, orientation: Orientation) {
  return orientation === 'horizontal' ? flowX + 108 : flowX + 20;
}

function schemaY(flowY: number, orientation: Orientation) {
  return orientation === 'horizontal' ? flowY + 50 : flowY + 176;
}

function DecisionFooter({ x, y, width }: { x: number; y: number; width: number }) {
  return (
    <g aria-hidden="true">
      <line x1={x} y1={y} x2={x + width} y2={y} stroke="var(--border-subtle)" />
      <Text x={x + width * 0.25} y={y + 28} anchor="middle" className={styles.ruleText} fill="var(--text-body)">few hot tools → eager</Text>
      <Text x={x + width * 0.75} y={y + 28} anchor="middle" className={styles.ruleText} fill="var(--text-body)">broad catalog → deferred</Text>
    </g>
  );
}

function DesktopDiagram() {
  const markerId = 'mcp-schema-desktop-arrow';
  return (
    <svg viewBox={`0 0 ${DESKTOP.w} ${DESKTOP.h}`} width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.desktopDiagram)} xmlns="http://www.w3.org/2000/svg">
      <defs><ArrowMarker id={markerId} fill={ARROW_COLOR} refX={0} /></defs>
      <Lane mode="eager" x={48} y={48} startupWidth={STARTUP.w} startupHeight={STARTUP.h} orientation="horizontal" markerId={markerId} />
      <Lane mode="deferred" x={48} y={256} startupWidth={STARTUP.w} startupHeight={STARTUP.h} orientation="horizontal" markerId={markerId} />
      <DecisionFooter x={88} y={448} width={584} />
    </svg>
  );
}

function MobileDiagram() {
  const markerId = 'mcp-schema-mobile-arrow';
  return (
    <svg viewBox={`0 0 ${MOBILE.w} ${MOBILE.h}`} width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.mobileDiagram)} xmlns="http://www.w3.org/2000/svg">
      <defs><ArrowMarker id={markerId} fill={ARROW_COLOR} refX={0} /></defs>
      <Lane mode="eager" x={62} y={44} startupWidth={MOBILE_STARTUP.w} startupHeight={MOBILE_STARTUP.h} orientation="vertical" markerId={markerId} />
      <Lane mode="deferred" x={62} y={526} startupWidth={MOBILE_STARTUP.w} startupHeight={MOBILE_STARTUP.h} orientation="vertical" markerId={markerId} />
      <DecisionFooter x={28} y={1048} width={284} />
    </svg>
  );
}

export default function MCPToolSchemaDiagram() {
  return (
    <div
      className={styles.container}
      role="img"
      aria-label="MCP schema loading comparison. Eager loading preloads schemas into the startup request, pushing the user task lower in context while keeping the runtime call direct. Deferred loading starts with a small ToolSearch index, keeps the task near primacy, then searches and loads the needed schema at runtime before calling. Few hot tools favor eager loading; broad catalogs favor deferred loading."
    >
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}
