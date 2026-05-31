import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMounted } from '@site/src/hooks/useMounted';
import styles from './ContextPressureDiagram.module.css';

/* ── Token constants ──────────────────────────────────────────────── */
const TOTAL_WINDOW = 200_000;
const COMPACTION_BUFFER = 33_000;
const BUILTIN_TOOL_COUNT = 45;
const TOKENS_PER_BUILTIN = 365;
const TOKENS_PER_MCP_TOOL = 700;
const TOOLSEARCH_BASE = 200;
const TOKENS_PER_DEFERRED_GROUP = 500;
const TOKENS_PER_SKILL_TURN = 4000;
const TOKENS_PER_TURN = 5000;

const SYSTEM_PROMPT_TOKENS = 3100;
const SKILLS_META_TOKENS = 500;
const USER_TASK_TOKENS = 1500;
const FIXED_TOTAL = SYSTEM_PROMPT_TOKENS + USER_TASK_TOKENS;

/* ── Attention zone boundaries ────────────────────────────────────── */
const PRIMACY_END = 0.25;
const RECENCY_START = 0.75;

/* ── Layer definitions ────────────────────────────────────────────── */
interface Layer {
  id: string;
  label: string;
  shortLabel: string;
  voice: 'system' | 'agent' | 'human' | 'data';
  tokens: number;
  fixed: boolean;
  isSkillTurn?: boolean;
  isCompacted?: boolean;
}

interface Preset {
  label: string;
  contextFiles: number;
  installedTools: number;
  turnCount: number;
  skillTurns: number;
  toolSearchEnabled: boolean;
}

const PRESETS: Preset[] = [
  {
    label: 'Fresh Session',
    contextFiles: 1500,
    installedTools: 45,
    turnCount: 0,
    skillTurns: 0,
    toolSearchEnabled: false,
  },
  {
    label: 'Normal Session',
    contextFiles: 1500,
    installedTools: 45,
    turnCount: 5,
    skillTurns: 0,
    toolSearchEnabled: false,
  },
  {
    label: 'Heavy MCP (eager)',
    contextFiles: 10000,
    installedTools: 120,
    turnCount: 14,
    skillTurns: 0,
    toolSearchEnabled: false,
  },
  {
    label: 'Heavy MCP (deferred)',
    contextFiles: 10000,
    installedTools: 120,
    turnCount: 14,
    skillTurns: 0,
    toolSearchEnabled: true,
  },
  {
    label: 'Deep Conversation',
    contextFiles: 8000,
    installedTools: 90,
    turnCount: 20,
    skillTurns: 0,
    toolSearchEnabled: false,
  },
  {
    label: 'Skill-Heavy',
    contextFiles: 8000,
    installedTools: 55,
    turnCount: 10,
    skillTurns: 4,
    toolSearchEnabled: false,
  },
  {
    label: 'Near Compaction',
    contextFiles: 10000,
    installedTools: 80,
    turnCount: 20,
    skillTurns: 0,
    toolSearchEnabled: false,
  },
  {
    label: 'Overloaded',
    contextFiles: 14000,
    installedTools: 120,
    turnCount: 20,
    skillTurns: 3,
    toolSearchEnabled: false,
  },
];

const SCENARIO_DESCRIPTIONS: Record<string, string> = {
  'Fresh Session':
    'Built-in tools only, no conversation history. Task sits in recency — full attention.',
  'Normal Session':
    'Built-in tools only after a few turns. Comfortable headroom, middle-zone attention.',
  'Heavy MCP (eager)':
    '120 eager tools consume ~69K in schemas. After 14 turns the window hits 92% — task dead-center, critical attention loss.',
  'Heavy MCP (deferred)':
    'Same tools, ToolSearch defers 75 of them. ~48K saved — task stays in the safe recency zone.',
  'Deep Conversation':
    '90 tools plus 20 turns of history push the task toward primacy. Window at 96% — danger-zone attention.',
  'Skill-Heavy':
    'Each skill expansion costs +4K extra tokens, compounding pressure on the middle zone.',
  'Near Compaction':
    'Conversation reaches the effective window after reserving buffer space for a lossy handoff. Task is already in the danger zone.',
  Overloaded:
    '120 tools + 14K context file + 20 turns. Task dead-center at 92% fill — critical, near-zero attention.',
};

/* ── Attention math ───────────────────────────────────────────────── */
function computeAttention(frac: number, fillRatio: number): number {
  const maxDrop = fillRatio * 0.85;
  const distFromCenter = 1 - Math.abs(frac - 0.5) * 2;
  let drop = distFromCenter ** 2 * maxDrop;
  const jCurveStrength = Math.max(0, fillRatio - 0.5) * 2;
  const primacyDecay = (1 - frac) * jCurveStrength * 0.55;
  drop = Math.min(drop + primacyDecay, 0.95);
  return 1 - drop;
}

/* ── Attention curve SVG paths ────────────────────────────────────── */
function buildAttentionCurve(fillRatio: number): {
  curvePath: string;
  fillPath: string;
  mobileCurvePath: string;
  mobileFillPath: string;
  minAttention: number;
} {
  const samples = 100;
  let minAttention = 1;
  const pts: Array<{ att: number; frac: number }> = [];

  for (let i = 0; i <= samples; i++) {
    const frac = i / samples;
    const att = computeAttention(frac, fillRatio);
    minAttention = Math.min(minAttention, att);
    pts.push({ att, frac });
  }

  // Desktop: x = attention (right = strong), y = frac (top = start)
  const curvePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.att * 100).toFixed(1)},${(p.frac * 100).toFixed(1)}`)
    .join(' ');
  const fillPath = [
    'M 100,0',
    ...pts.map((p) => `L ${(p.att * 100).toFixed(1)},${(p.frac * 100).toFixed(1)}`),
    'L 100,100',
    'Z',
  ].join(' ');

  // Mobile: x = frac (left = start), y = 100 - attention*100 (top = strong)
  const mobileCurvePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.frac * 100).toFixed(1)},${(100 - p.att * 100).toFixed(1)}`)
    .join(' ');
  const mobileFillPath = [
    'M 0,0',
    ...pts.map((p) => `L ${(p.frac * 100).toFixed(1)},${(100 - p.att * 100).toFixed(1)}`),
    'L 100,0',
    'Z',
  ].join(' ');

  return { curvePath, fillPath, mobileCurvePath, mobileFillPath, minAttention };
}

/* ── Middle zone background by fill depth ─────────────────────────── */
function middleZoneBg(fillRatio: number): string {
  if (fillRatio < 0.35) return 'var(--surface-muted)';
  if (fillRatio < 0.65) return 'var(--visual-bg-warning)';
  return 'var(--visual-bg-error)';
}

const VOICE_FONT: Record<Layer['voice'], string> = {
  system: 'var(--font-mono-spec)',
  agent: 'var(--font-mono-ai)',
  human: 'var(--font-mono-human)',
  data: 'var(--font-mono-keyword)',
};

function formatK(tokens: number): string {
  return tokens >= 1000 ? `${Math.round(tokens / 1000)}K` : `${tokens}`;
}

/* ── Tool def token calculation ───────────────────────────────────── */
function computeToolDefs(tools: number, tsEnabled: boolean): number {
  const mcp = Math.max(0, tools - BUILTIN_TOOL_COUNT);
  return tsEnabled
    ? BUILTIN_TOOL_COUNT * TOKENS_PER_BUILTIN +
        TOOLSEARCH_BASE +
        Math.ceil(mcp / 10) * TOKENS_PER_DEFERRED_GROUP
    : BUILTIN_TOOL_COUNT * TOKENS_PER_BUILTIN + mcp * TOKENS_PER_MCP_TOOL;
}

/* ── Drain-to-fit solver ──────────────────────────────────────────── */
const DRAIN_ORDER = [
  'conversation',
  'contextFiles',
  'skillsMeta',
  'toolDefs',
] as const;
type DrainKey = (typeof DRAIN_ORDER)[number];

interface DrainInput {
  toolDefs: number;
  contextFiles: number;
  skillsMeta: number;
  conversation: number;
}

interface DrainResult {
  result: DrainInput;
  headroom: number;
  drained: Record<DrainKey, number>;
  compactionTriggered: boolean;
}

function drainToFit(
  requested: DrainInput,
  fixedTotal: number,
  effectiveWindow: number
): DrainResult {
  const result = { ...requested };
  const drained: Record<DrainKey, number> = {
    conversation: 0,
    contextFiles: 0,
    skillsMeta: 0,
    toolDefs: 0,
  };

  const totalRequested =
    result.toolDefs +
    result.contextFiles +
    result.skillsMeta +
    result.conversation;
  const available = Math.max(0, effectiveWindow - fixedTotal);
  let excess = totalRequested - available;

  if (excess <= 0) {
    return {
      result,
      headroom: available - totalRequested,
      drained,
      compactionTriggered: false,
    };
  }

  for (const key of DRAIN_ORDER) {
    if (excess <= 0) break;
    const canDrain = result[key];
    const drain = Math.min(canDrain, excess);
    result[key] -= drain;
    drained[key] = drain;
    excess -= drain;
  }

  return {
    result,
    headroom: 0,
    drained,
    compactionTriggered: drained.conversation > 0,
  };
}

/* ── Accent color ─────────────────────────────────────────────────── */
function accentColor(
  layer: Layer,
  isDrained: boolean,
  taskZone: string
): string {
  if (layer.id === 'userTask') {
    if (taskZone === 'critical' || taskZone === 'danger')
      return 'var(--visual-error)';
    if (taskZone === 'middle') return 'var(--visual-warning)';
    if (taskZone === 'middle_safe') return 'var(--visual-success)';
    return 'var(--border-emphasis)';
  }
  if (isDrained) return 'var(--visual-warning)';
  if (layer.isSkillTurn) return 'var(--visual-violet)';
  if (layer.voice === 'system') return 'var(--visual-cyan)';
  if (layer.voice === 'human') return 'var(--border-emphasis)';
  if (layer.voice === 'data') return 'var(--visual-indigo)';
  return 'var(--border-default)';
}

function rowBg(layer: Layer, isDrained: boolean, taskZone: string): string {
  if (layer.id === 'userTask') {
    if (taskZone === 'critical' || taskZone === 'danger')
      return 'var(--visual-bg-error)';
    if (taskZone === 'middle') return 'var(--visual-bg-warning)';
    if (taskZone === 'middle_safe') return 'var(--visual-bg-success)';
    return 'transparent';
  }
  if (layer.isSkillTurn) return 'var(--visual-bg-violet)';
  if (isDrained) return 'var(--visual-bg-warning)';
  return 'transparent';
}

/* ── Flex redistribution with minimum readable height ─────────────── */
function redistributeWithMinHeight(
  items: Array<{ id: string; tokens: number }>,
  totalTokens: number,
  containerHeight: number,
  minHeight: number
): Record<string, number> {
  const rawHeights = items.map((i) => (i.tokens / totalTokens) * containerHeight);
  const belowMin = rawHeights.map((h) => h < minHeight);

  if (!belowMin.some(Boolean)) {
    return Object.fromEntries(items.map((i) => [i.id, i.tokens]));
  }

  const belowMinCount = belowMin.filter(Boolean).length;
  const reservedHeight = belowMinCount * minHeight;
  const largeItems = items.filter((_, i) => !belowMin[i]);
  const largeTotalTokens = largeItems.reduce((s, i) => s + i.tokens, 0);
  const remainingHeight = Math.max(0, containerHeight - reservedHeight);

  const result: Record<string, number> = {};
  items.forEach((item, i) => {
    if (belowMin[i]) {
      result[item.id] = (minHeight / containerHeight) * totalTokens;
    } else {
      const h = (item.tokens / largeTotalTokens) * remainingHeight;
      result[item.id] = (h / containerHeight) * totalTokens;
    }
  });
  return result;
}

/* ── Component ────────────────────────────────────────────────────── */
export default function ContextPressureDiagram() {
  const mounted = useMounted();

  const [contextFiles, setContextFiles] = useState(1500);
  const [installedTools, setInstalledTools] = useState(45);
  const [toolSearchEnabled, setToolSearchEnabled] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [skillTurns, setSkillTurns] = useState(0);
  const [showCompaction, setShowCompaction] = useState(true);
  const [activePreset, setActivePreset] = useState<string>('Fresh Session');

  /* ── Effective window ────────────────────────────────────────── */
  const effectiveWindow = showCompaction
    ? TOTAL_WINDOW - COMPACTION_BUFFER
    : TOTAL_WINDOW;

  /* ── Requested values ────────────────────────────────────────── */
  const clampedSkillTurns = Math.min(skillTurns, turnCount);
  const requestedToolDefs = computeToolDefs(installedTools, toolSearchEnabled);
  const requestedConversation =
    turnCount * TOKENS_PER_TURN + clampedSkillTurns * TOKENS_PER_SKILL_TURN;

  const requested: DrainInput = {
    toolDefs: requestedToolDefs,
    contextFiles,
    skillsMeta: SKILLS_META_TOKENS,
    conversation: requestedConversation,
  };

  /* ── Drain solver ────────────────────────────────────────────── */
  const drain = drainToFit(requested, FIXED_TOTAL, effectiveWindow);
  const { result: actual, headroom, drained, compactionTriggered } = drain;

  /* ── Turn layers ─────────────────────────────────────────────── */
  const conversationScale =
    requestedConversation > 0 ? actual.conversation / requestedConversation : 1;

  const compactedTurnCount = compactionTriggered
    ? Math.max(0, Math.floor(turnCount * (1 - conversationScale)))
    : 0;

  interface TurnInfo {
    index: number;
    isSkill: boolean;
    tokens: number;
    compacted: boolean;
  }
  const turns: TurnInfo[] = [];
  for (let i = 0; i < turnCount; i++) {
    const isSkill = i >= turnCount - clampedSkillTurns;
    const baseTokens = TOKENS_PER_TURN + (isSkill ? TOKENS_PER_SKILL_TURN : 0);
    const compacted = i < compactedTurnCount;
    const tokens = compacted ? Math.round(baseTokens * 0.4) : baseTokens;
    turns.push({ index: i, isSkill, tokens, compacted });
  }

  const MAX_INDIVIDUAL = 6;
  const MAX_TURNS = 20; // match slider max
  const turnLayers: Layer[] = [];

  for (let i = 0; i < MAX_TURNS; i++) {
    const t = turns[i];
    const active = t !== undefined;
    turnLayers.push({
      id: `turn-${i}`,
      label: active ? `Turn ${t.index + 1}` : '',
      shortLabel: active ? (t.isSkill ? `S${t.index + 1}` : `T${t.index + 1}`) : '',
      voice: 'data',
      tokens: active ? Math.round(t.tokens * conversationScale) : 0,
      fixed: false,
      isSkillTurn: active ? t.isSkill : false,
      isCompacted: active ? t.compacted : false,
    });
  }

  /* ── Build layers ─────────────────────────────────────────────── */
  const layers: Layer[] = [
    {
      id: 'systemPrompt',
      label: 'System Prompt',
      shortLabel: 'Sys',
      voice: 'system',
      tokens: SYSTEM_PROMPT_TOKENS,
      fixed: true,
    },
    {
      id: 'toolDefs',
      label: 'Tool Definitions',
      shortLabel: 'Tools',
      voice: 'system',
      tokens: actual.toolDefs,
      fixed: false,
    },
    {
      id: 'contextFiles',
      label: 'Context Files (AGENTS.md)',
      shortLabel: 'Ctx',
      voice: 'data',
      tokens: actual.contextFiles,
      fixed: false,
    },
    {
      id: 'skillsMeta',
      label: 'Skills Metadata',
      shortLabel: 'Skills',
      voice: 'system',
      tokens: actual.skillsMeta,
      fixed: false,
    },
    {
      id: 'userTask',
      label: 'User Task',
      shortLabel: 'Task',
      voice: 'human',
      tokens: USER_TASK_TOKENS,
      fixed: true,
    },
    ...turnLayers,
  ];

  const totalTokens = layers.reduce((s, l) => s + l.tokens, 0);
  const fillRatio = Math.min(totalTokens / TOTAL_WINDOW, 1);

  /* ── Stack height measurement ────────────────────────────────── */
  const stackRef = useRef<HTMLDivElement>(null);
  const [stackHeight, setStackHeight] = useState(560);

  useEffect(() => {
    const el = stackRef.current;
    if (!el) return;
    const update = () => setStackHeight(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Redistribute flex space with readable minimum ───────────── */
  const MIN_ROW_HEIGHT = 16;

  const adjustedFlexProps = useMemo(() => {
    const middleTurnIds = new Set<string>();
    const visibleTurnCount = Math.min(turnCount, MAX_TURNS);
    for (let i = 2; i < visibleTurnCount - 3; i++) {
      middleTurnIds.add(`turn-${i}`);
    }

    const items = [
      ...layers.filter((l) => !middleTurnIds.has(l.id)).map((l) => ({ id: l.id, tokens: l.tokens })),
      { id: 'headroom', tokens: headroom >= 6000 ? headroom : 0 },
      { id: 'compaction', tokens: showCompaction ? COMPACTION_BUFFER : 0 },
    ].filter((i) => i.tokens > 0);

    const adjusted = redistributeWithMinHeight(items, TOTAL_WINDOW, stackHeight, MIN_ROW_HEIGHT);

    layers.filter((l) => middleTurnIds.has(l.id)).forEach((l) => {
      adjusted[l.id] = l.tokens;
    });

    return adjusted;
  }, [layers, headroom, showCompaction, stackHeight, turnCount]);

  /* ── Turn group overlay bounds (absolute, within collapsed space) ─ */
  const turnGroupTokens = React.useMemo(() => {
    if (turnCount <= MAX_INDIVIDUAL) return 0;
    const visibleTurnCount = Math.min(turnCount, MAX_TURNS);
    const collapsedStartIdx = 2;
    const collapsedEndIdx = visibleTurnCount - 3;
    if (collapsedEndIdx <= collapsedStartIdx) return 0;

    return turnLayers
      .slice(collapsedStartIdx, collapsedEndIdx)
      .reduce((s, l) => s + (adjustedFlexProps[l.id] ?? l.tokens), 0);
  }, [adjustedFlexProps, turnCount, turnLayers]);

  /* ── Task attention position ─────────────────────────────────── */
  const tokensBeforeTask =
    SYSTEM_PROMPT_TOKENS +
    actual.toolDefs +
    actual.contextFiles +
    actual.skillsMeta;
  const taskMidTokens = tokensBeforeTask + USER_TASK_TOKENS / 2;
  const taskFrac =
    totalTokens > 0 ? Math.min(taskMidTokens / totalTokens, 1) : 0.5;
  const taskAttention = computeAttention(taskFrac, fillRatio);

  /* ── Attention visualization data ────────────────────────────── */
  const { curvePath, fillPath, mobileCurvePath, mobileFillPath, minAttention } =
    buildAttentionCurve(fillRatio);
  const middleBg = middleZoneBg(fillRatio);
  const maxDropPct = Math.round((1 - minAttention) * 100);

  const taskZone =
    taskFrac < PRIMACY_END
      ? taskAttention >= 0.45
        ? 'primacy'
        : taskAttention >= 0.25
          ? 'danger'
          : 'critical'
      : taskFrac > RECENCY_START
        ? 'recency'
        : taskAttention >= 0.45
          ? fillRatio < 0.35
            ? 'middle_safe'
            : 'middle'
          : taskAttention >= 0.25
            ? 'danger'
            : 'critical';

  /* ── Budget bar ──────────────────────────────────────────────── */
  const effectiveFillRatio = effectiveWindow > 0 ? Math.min(totalTokens / effectiveWindow, 1) : 0;
  const budgetColor =
    effectiveFillRatio < 0.6
      ? 'var(--visual-success)'
      : effectiveFillRatio < 0.8
        ? 'var(--visual-warning)'
        : 'var(--visual-error)';

  /* ── Verdicts ────────────────────────────────────────────────── */
  const VERDICTS: Record<string, string> = {
    primacy: '✓ Task gets strong attention',
    recency: '✓ Task gets strong attention',
    middle_safe: '✓ Task in middle zone — decent attention with headroom',
    middle: '⚠ Attention reduced — task in lower-attention zone',
    danger: '⚠ Task in forgotten zone',
    critical: '✗ Task invisible to agent',
  };

  const verdictText =
    fillRatio < 0.15 && (taskZone === 'primacy' || taskZone === 'recency')
      ? '✓ Full attention — all zones strong'
      : VERDICTS[taskZone];

  /* ── Status text (aria-live) ─────────────────────────────────── */
  const statusText =
    taskZone === 'critical'
      ? 'CRITICAL — task invisible to agent'
      : taskZone === 'danger'
        ? 'WARNING — task in forgotten zone'
        : compactionTriggered
          ? `Conversation compacted by ${Math.round((1 - conversationScale) * 100)}%`
          : headroom > 0
            ? `Headroom: ${formatK(headroom)}`
            : 'Task receives adequate attention';

  /* ── Slider display helpers ──────────────────────────────────── */
  const ctxDisplay =
    drained.contextFiles > 0
      ? `${formatK(contextFiles)} → ${formatK(actual.contextFiles)}`
      : formatK(contextFiles);
  const toolDisplay =
    drained.toolDefs > 0
      ? `${installedTools} (~${formatK(requestedToolDefs)} → ${formatK(actual.toolDefs)})`
      : `${installedTools} (~${formatK(requestedToolDefs)})`;
  const convDisplay =
    drained.conversation > 0
      ? `${turnCount} turns (→ ${formatK(actual.conversation)})`
      : `${turnCount} turns (${formatK(requestedConversation)})`;
  const skillDisplay = `${clampedSkillTurns} × 4K = ${formatK(clampedSkillTurns * TOKENS_PER_SKILL_TURN)}`;

  /* ── Handlers ────────────────────────────────────────────────── */
  const markCustom = () => setActivePreset('Custom');
  const handleContextFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContextFiles(Number(e.target.value));
    markCustom();
  };
  const handleInstalledTools = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInstalledTools(Number(e.target.value));
    markCustom();
  };
  const handleTurnCount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTurnCount(Number(e.target.value));
    markCustom();
  };
  const handleSkillTurns = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillTurns(Number(e.target.value));
    markCustom();
  };
  const handleToolSearchToggle = () => {
    setToolSearchEnabled((v) => !v);
    markCustom();
  };
  const handleCompactionToggle = () => {
    setShowCompaction((v) => !v);
    markCustom();
  };

  const applyPreset = (p: Preset) => {
    setContextFiles(p.contextFiles);
    setInstalledTools(p.installedTools);
    setTurnCount(p.turnCount);
    setSkillTurns(p.skillTurns);
    setToolSearchEnabled(p.toolSearchEnabled);
    setActivePreset(p.label);
  };

  if (!mounted) {
    return <div className={styles.container} style={{ minHeight: 520 }} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.threePanel}>
        {/* ── Panel 1: Your Config ─────────────────────────────── */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>Your Config</div>

          <div className={styles.scenarioChips}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className={`${styles.chip} ${activePreset === p.label ? styles.chipActive : ''}`}
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <p className={`${styles.scenarioDesc} ${SCENARIO_DESCRIPTIONS[activePreset] ? styles.descVisible : ''}`}>
            {SCENARIO_DESCRIPTIONS[activePreset] || '\u00A0'}
          </p>

          <div className={styles.sliders}>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={showCompaction}
                onChange={handleCompactionToggle}
              />
              <span>Compaction buffer (33K)</span>
            </label>

            <div className={styles.sliderRow}>
              <span className={styles.sliderLabel}>Context Files</span>
              <input
                type="range"
                min={0}
                max={20000}
                step={1000}
                value={contextFiles}
                onChange={handleContextFiles}
                className={styles.slider}
                aria-label="Context files token count"
              />
              <span
                className={`${styles.sliderValue} ${drained.contextFiles > 0 ? styles.sliderValueDrained : ''}`}
              >
                {ctxDisplay}
              </span>
            </div>

            <div className={styles.sliderRow}>
              <span className={styles.sliderLabel}>Installed Tools</span>
              <input
                type="range"
                min={45}
                max={200}
                step={5}
                value={installedTools}
                onChange={handleInstalledTools}
                className={styles.slider}
                aria-label="Installed tools count"
              />
              <span
                className={`${styles.sliderValue} ${drained.toolDefs > 0 ? styles.sliderValueDrained : ''}`}
              >
                {toolDisplay}
              </span>
              <label className={styles.inlineCheck}>
                <input
                  type="checkbox"
                  checked={toolSearchEnabled}
                  onChange={handleToolSearchToggle}
                />
                <span>ToolSearch</span>
              </label>
            </div>

            <div className={styles.sliderRow}>
              <span className={styles.sliderLabel}>Conv. Turns</span>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={turnCount}
                onChange={handleTurnCount}
                className={styles.slider}
                aria-label="Conversation turn count"
              />
              <span
                className={`${styles.sliderValue} ${drained.conversation > 0 ? styles.sliderValueDrained : ''}`}
              >
                {convDisplay}
              </span>
            </div>

            <div className={styles.sliderRow}>
              <span className={styles.sliderLabel}>Skill Turns</span>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={skillTurns}
                onChange={handleSkillTurns}
                className={styles.slider}
                aria-label="Skill expansion turn count"
              />
              <span className={styles.sliderValue}>{skillDisplay}</span>
            </div>
          </div>
        </div>

        {/* ── Arrow 1 ──────────────────────────────────────────── */}
        <div className={styles.arrow} aria-hidden="true">
          <span className={styles.arrowGlyph}>→</span>
          <span className={styles.arrowLabel}>produces</span>
        </div>

        {/* ── Panel 2: Context Window ───────────────────────────── */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>Context Window</div>

          <div ref={stackRef} className={styles.stack}>
            {layers.map((layer) => {
              const isDrained =
                layer.id === 'toolDefs'
                  ? drained.toolDefs > 0
                  : layer.id === 'contextFiles'
                    ? drained.contextFiles > 0
                    : layer.id === 'skillsMeta'
                      ? drained.skillsMeta > 0
                      : false;
              const isTask = layer.id === 'userTask';
              const isTurn = layer.id.startsWith('turn-');
              const turnIdx = isTurn ? parseInt(layer.id.replace('turn-', ''), 10) : -1;
              const isMiddleTurn = isTurn && turnCount > MAX_INDIVIDUAL && turnIdx >= 2 && turnIdx < Math.min(turnCount, MAX_TURNS) - 3;
              const isInactiveTurn = isTurn && turnIdx >= turnCount;

              if (isMiddleTurn) {
                if (turnIdx === 2) {
                  return (
                    <div
                      key="turn-group"
                      className={`${styles.stackRow} ${styles.turnGroupItem}`}
                      style={{
                        flexGrow: turnGroupTokens,
                        flexBasis: 0,
                        flexShrink: 0,
                        minHeight: 0,
                      }}
                    >
                      <span className={styles.turnGroupLabel}>
                        {`Turns 3–${Math.min(turnCount, MAX_TURNS) - 3}`}
                      </span>
                    </div>
                  );
                }
                return null;
              }

              const row = (
                <div
                  key={layer.id}
                  className={`${styles.stackRow} ${isTask ? styles[`stackRowTask_${taskZone}`] : ''} ${isInactiveTurn ? styles.turnCollapsed : ''}`}
                  style={{
                    flexGrow: adjustedFlexProps[layer.id] ?? layer.tokens,
                    flexBasis: 0,
                    flexShrink: 0,
                    minHeight: 0,
                    background: rowBg(layer, isDrained, taskZone),
                    opacity: layer.isCompacted ? 0.55 : (layer.tokens > 0 ? 1 : 0),
                  }}
                >
                  <div
                    className={styles.accent}
                    style={{
                      background: accentColor(layer, isDrained, taskZone),
                    }}
                  />
                  <span
                    className={styles.rowLabel}
                    style={{ fontFamily: VOICE_FONT[layer.voice] }}
                  >
                    {layer.label}
                  </span>
                  <span className={styles.badgeGroup}>
                    <span className={`${styles.compactedBadge} ${layer.isCompacted ? styles.badgeVisible : ''}`}>compacted</span>
                    <span className={`${styles.skillBadge} ${layer.isSkillTurn && !layer.isCompacted ? styles.badgeVisible : ''}`}>skill</span>
                    <span className={`${styles.drainBadge} ${isDrained ? styles.badgeVisible : ''}`}>drained</span>
                  </span>
                  <span className={styles.rowTokens}>
                    {formatK(layer.tokens)}
                  </span>
                </div>
              );

              return row;
            })}

            <div
              className={`${styles.headroomRow} ${headroom >= 6000 ? styles.headroomRowActive : ''}`}
              style={{
                flexGrow: adjustedFlexProps['headroom'] ?? (headroom >= 6000 ? headroom : 0),
                flexBasis: 0,
                flexShrink: 0,
              }}
            >
              <span className={styles.headroomLabel}>
                {formatK(headroom)} headroom
              </span>
            </div>

            <div
              className={`${styles.compactionRow} ${showCompaction ? styles.compactionRowActive : ''}`}
              style={{
                flexGrow: adjustedFlexProps['compaction'] ?? (showCompaction ? COMPACTION_BUFFER : 0),
                flexBasis: 0,
                flexShrink: 0,
              }}
            >
              <span className={styles.compactionLabel}>Buffer 33K</span>
            </div>
          </div>

          {/* Budget bar */}
          <div className={styles.budgetBar}>
            <div
              className={styles.budgetFill}
              style={{ width: `${effectiveFillRatio * 100}%`, background: budgetColor }}
            />
          </div>
          <div className={styles.budgetLabel}>
            {formatK(totalTokens)} / {formatK(effectiveWindow)}
          </div>
        </div>

        {/* ── Arrow 2 ──────────────────────────────────────────── */}
        <div className={styles.arrow} aria-hidden="true">
          <span className={styles.arrowGlyph}>→</span>
          <span className={styles.arrowLabel}>model sees</span>
        </div>

        {/* ── Panel 3: Attention ───────────────────────────────── */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>Attention</div>

          <div
            className={styles.attentionStrip}
            style={
              {
                '--task-pos': `${taskFrac * 100}%`,
              } as React.CSSProperties
            }
            aria-label={`Task lands at ${Math.round(taskFrac * 100)}% of filled context. Max attention drop ${maxDropPct}%`}
          >
            <div
              className={styles.zonePrimacy}
              style={{ height: `${PRIMACY_END * 100}%` }}
            >
              <span className={styles.zoneLabel}>PRIMACY</span>
              <span className={styles.zoneDesc}>strong attention</span>
            </div>

            <div
              className={styles.zoneMiddle}
              style={{
                height: `${(RECENCY_START - PRIMACY_END) * 100}%`,
                background: middleBg,
              }}
            >
              <span className={styles.zoneLabel}>MIDDLE</span>
              <span className={styles.zoneDesc}>
                {fillRatio < 0.15
                  ? 'attention strong'
                  : fillRatio < 0.35
                    ? 'attention decent'
                    : fillRatio < 0.65
                      ? 'attention degraded'
                      : 'attention collapsed'}
              </span>
            </div>

            <div
              className={styles.zoneRecency}
              style={{ height: `${(1 - RECENCY_START) * 100}%` }}
            >
              <span className={styles.zoneLabel}>RECENCY</span>
              <span className={styles.zoneDesc}>strong attention</span>
            </div>

            {/* Desktop SVG: x = attention, y = frac */}
            <svg
              className={`${styles.attentionSVG} ${styles.attentionSVGDesktop}`}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                x1="100"
                y1="0"
                x2="100"
                y2="100"
                className={styles.attentionGrid}
              />
              <path d={fillPath} className={styles.attentionFill} />
              <path d={curvePath} className={styles.attentionCurve} />
            </svg>

            {/* Mobile SVG: x = frac, y = 100 - attention */}
            <svg
              className={`${styles.attentionSVG} ${styles.attentionSVGMobile}`}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d={mobileFillPath} className={styles.attentionFill} />
              <path d={mobileCurvePath} className={styles.attentionCurve} />
            </svg>

            <div
              className={`${styles.taskMarker} ${styles[`taskMarker_${taskZone}`]}`}
              style={{ top: `${taskFrac * 100}%` }}
            >
              <div className={styles.taskMarkerLine} />
              <span className={styles.taskMarkerLabel}>Your task</span>
              <span className={styles.taskMarkerDot} />
            </div>
          </div>

          <div className={`${styles.verdict} ${styles[`verdict_${taskZone}`]}`}>
            {verdictText}
          </div>
          <div className={styles.maxDrop}>
            {fillRatio > 0.15
              ? `Middle attention drops to ${Math.round(minAttention * 100)}% at ${Math.round(fillRatio * 100)}% fill`
              : 'Window nearly empty — full attention across all positions'}
          </div>
        </div>
      </div>

      <div className={styles.statusRegion} aria-live="polite">
        {statusText}
      </div>
    </div>
  );
}
