import React, { useState } from 'react';
import { useMounted } from '@site/src/hooks/useMounted';
import styles from './ContextPressureDiagram.module.css';
import regionStyles from './contextRegions.module.css';
import {
  ContextRegionScene,
  ContextZoneStrip,
  type RegionTile,
  type TileRenderProps,
  // Explicit .tsx: on case-insensitive filesystems './ContextRegions' would
  // resolve to the sibling model file contextRegions.ts.
} from './ContextRegions.tsx';
import {
  CONTEXT_PRESSURE,
  allocateTurns,
  contextTotal,
  drainToFit,
  effectiveFill,
  effectiveWindow,
  toolDefinitionTokens,
  taskSeverity,
  type DrainKey,
  type VariableTokens,
} from './contextPressureModel';

const {
  compactionBuffer: COMPACTION_BUFFER,
  tokensPerSkillTurn: TOKENS_PER_SKILL_TURN,
  tokensPerTurn: TOKENS_PER_TURN,
  systemPromptTokens: SYSTEM_PROMPT_TOKENS,
  skillsMetaTokens: SKILLS_META_TOKENS,
  userTaskTokens: USER_TASK_TOKENS,
} = CONTEXT_PRESSURE;

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

interface RangeControlProps {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  drained?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function RangeControl({
  label,
  value,
  display,
  min,
  max,
  step,
  drained,
  onChange,
}: RangeControlProps) {
  return (
    <div className={styles.sliderRow}>
      <span className={styles.sliderLabel}>{label}</span>
      <input
        className={styles.slider}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        aria-label={label}
      />
      <span
        className={`${styles.sliderValue} ${drained ? styles.sliderValueDrained : ''}`}
      >
        {display}
      </span>
    </div>
  );
}

interface ConfigControlsProps {
  showCompaction: boolean;
  contextFiles: number;
  installedTools: number;
  toolSearchEnabled: boolean;
  turnCount: number;
  skillTurns: number;
  ctxDisplay: string;
  toolDisplay: string;
  convDisplay: string;
  skillDisplay: string;
  drained: Record<DrainKey, number>;
  onCompactionToggle: () => void;
  onContextFiles: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onInstalledTools: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToolSearchToggle: () => void;
  onTurnCount: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSkillTurns: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function ConfigControls(props: ConfigControlsProps) {
  return (
    <div className={styles.sliders}>
      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={props.showCompaction}
          onChange={props.onCompactionToggle}
        />
        <span>Compaction buffer (165K)</span>
      </label>
      <RangeControl
        label="Context Files"
        min={0}
        max={250000}
        step={1000}
        value={props.contextFiles}
        display={props.ctxDisplay}
        drained={props.drained.contextFiles > 0}
        onChange={props.onContextFiles}
      />
      <div className={styles.controlWithToggle}>
        <RangeControl
          label="Installed Tools"
          min={45}
          max={500}
          step={5}
          value={props.installedTools}
          display={props.toolDisplay}
          drained={props.drained.toolDefs > 0}
          onChange={props.onInstalledTools}
        />
        <label className={styles.inlineCheck}>
          <input
            type="checkbox"
            checked={props.toolSearchEnabled}
            onChange={props.onToolSearchToggle}
          />
          <span>ToolSearch</span>
        </label>
      </div>
      <RangeControl
        label="Conv. Turns"
        min={0}
        max={120}
        step={1}
        value={props.turnCount}
        display={props.convDisplay}
        drained={props.drained.conversation > 0}
        onChange={props.onTurnCount}
      />
      <RangeControl
        label="Skill Turns"
        min={0}
        max={10}
        step={1}
        value={props.skillTurns}
        display={props.skillDisplay}
        onChange={props.onSkillTurns}
      />
    </div>
  );
}

const PRESETS: Preset[] = [
  {
    label: 'Fresh Session',
    contextFiles: 1_500,
    installedTools: 45,
    turnCount: 0,
    skillTurns: 0,
    toolSearchEnabled: false,
  },
  {
    label: 'Normal Session',
    contextFiles: 1_500,
    installedTools: 45,
    turnCount: 20,
    skillTurns: 0,
    toolSearchEnabled: false,
  },
  {
    label: 'Heavy MCP (eager)',
    contextFiles: 40_000,
    installedTools: 500,
    turnCount: 75,
    skillTurns: 0,
    toolSearchEnabled: false,
  },
  {
    label: 'Heavy MCP (deferred)',
    contextFiles: 40_000,
    installedTools: 500,
    turnCount: 75,
    skillTurns: 0,
    toolSearchEnabled: true,
  },
  {
    label: 'Deep Conversation',
    contextFiles: 20_000,
    installedTools: 90,
    turnCount: 120,
    skillTurns: 0,
    toolSearchEnabled: false,
  },
  {
    label: 'Skill-Heavy',
    contextFiles: 20_000,
    installedTools: 120,
    turnCount: 70,
    skillTurns: 8,
    toolSearchEnabled: false,
  },
  {
    label: 'Near Compaction',
    contextFiles: 100_000,
    installedTools: 300,
    turnCount: 105,
    skillTurns: 0,
    toolSearchEnabled: false,
  },
  {
    label: 'Overloaded',
    contextFiles: 200_000,
    installedTools: 500,
    turnCount: 120,
    skillTurns: 5,
    toolSearchEnabled: false,
  },
];

const MOBILE_PRESET_LABELS: Record<string, string> = {
  'Fresh Session': 'Fresh',
  'Normal Session': 'Normal',
  'Heavy MCP (eager)': 'MCP eager',
  'Heavy MCP (deferred)': 'MCP deferred',
  'Deep Conversation': 'Deep convo',
  'Skill-Heavy': 'Skill-heavy',
  'Near Compaction': 'Near limit',
  Overloaded: 'Overloaded',
};

const SCENARIO_DESCRIPTIONS: Record<string, string> = {
  'Fresh Session':
    'Built-in tools only, no conversation history. Task sits in recency — full attention.',
  'Normal Session':
    'Built-in tools only after a few turns. Comfortable headroom, middle-zone attention.',
  'Heavy MCP (eager)':
    '500 eager tools consume ~335K in schemas. After 75 turns the effective budget reaches 90% — task sits in the weak middle.',
  'Heavy MCP (deferred)':
    'Same catalog, ToolSearch keeps startup schemas near 40K. The task remains clear of the overloaded middle.',
  'Deep Conversation':
    '90 tools plus 120 turns of history consume about 80% of the effective budget. The task crosses into the weak middle.',
  'Skill-Heavy':
    'Each skill expansion costs +4K extra tokens, compounding pressure on the middle zone.',
  'Near Compaction':
    '100K of files, 300 tools, and 105 turns reach the 835K effective budget reserved for a lossy handoff.',
  Overloaded:
    '500 tools + 200K of files + 120 turns overflow the effective budget. Older conversation is compacted first.',
};

/* ── Attention math: shared model (attentionModel.ts) ───────────── */

const VOICE_FONT: Record<Layer['voice'], string> = {
  system: 'var(--font-mono-spec)',
  agent: 'var(--font-mono-ai)',
  human: 'var(--font-mono-human)',
  data: 'var(--font-mono-keyword)',
};

function formatK(tokens: number): string {
  return tokens >= 1000 ? `${Math.round(tokens / 1000)}K` : `${tokens}`;
}

/* ── Accent color ─────────────────────────────────────────────────── */
function accentColor(
  layer: Layer,
  isDrained: boolean,
  taskZone: string
): string {
  if (layer.id === 'userTask') {
    if (taskZone === 'critical') return 'var(--visual-error)';
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
    if (taskZone === 'critical') return 'var(--visual-bg-error)';
    if (taskZone === 'middle') return 'var(--visual-bg-warning)';
    if (taskZone === 'middle_safe') return 'var(--visual-bg-success)';
    return 'transparent';
  }
  if (layer.isSkillTurn) return 'var(--visual-bg-violet)';
  if (isDrained) return 'var(--visual-bg-warning)';
  return 'transparent';
}

/* ── Task row outline per attention zone ──────────────────────────── */
const TASK_OUTLINE: Record<string, string> = {
  primacy: 'var(--border-emphasis)',
  recency: 'var(--border-emphasis)',
  middle_safe: 'var(--visual-success)',
  middle: 'var(--visual-warning)',
  critical: 'var(--visual-error)',
};

/* Standard layer tile. Mirrors the foundation's DefaultTile (not exported);
   local because compacted turns dim to 0.55 — a state DefaultTile's
   weight-based opacity cannot express. */
function StandardTile({
  row,
  layout,
  dimmed,
}: {
  row: RegionTile;
  layout: import('./ContextRegions.tsx').RegionLayout;
  dimmed: boolean;
}) {
  const collapsed = layout.collapsed;
  return (
    <div
      className={`${regionStyles.regionRow} ${collapsed ? regionStyles.rowCollapsed : ''}`}
      style={{
        height: layout.height,
        minHeight: 0,
        background: row.background,
        outlineColor: row.outlineColor,
        opacity: dimmed ? 0.55 : row.weight > 0 ? 1 : 0,
      }}
    >
      <div
        className={regionStyles.rowAccent}
        style={{ background: row.accent }}
      />
      <span
        className={regionStyles.rowLabel}
        style={{ fontFamily: row.labelFontFamily }}
      >
        {row.label}
      </span>
      {row.badges && (
        <span className={regionStyles.badgeGroup}>
          {row.badges.map((badge) => (
            <span
              key={badge.id}
              className={`${regionStyles.badge} ${badge.visible ? regionStyles.badgeVisible : ''}`}
              style={{ color: badge.color }}
            >
              {badge.label}
            </span>
          ))}
        </span>
      )}
      {row.meta && <span className={regionStyles.rowMeta}>{row.meta}</span>}
    </div>
  );
}

/* Centered-label tile for the non-voice rows (headroom, compaction buffer,
   middle-turns group): no accent or meta slots. Collapse animates via the
   flexGrow share like every other tile. */
function CenteredTile({
  row,
  layout,
  className,
  labelClassName,
  style,
}: {
  row: RegionTile;
  layout: import('./ContextRegions.tsx').RegionLayout;
  className: string;
  labelClassName: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        height: layout.height,
        minHeight: 0,
        ...style,
      }}
    >
      <span className={labelClassName}>{row.label}</span>
    </div>
  );
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
  const effectiveBudget = effectiveWindow(showCompaction);

  /* ── Requested values ────────────────────────────────────────── */
  const clampedSkillTurns = Math.min(skillTurns, turnCount);
  const requestedToolDefs = toolDefinitionTokens(
    installedTools,
    toolSearchEnabled
  );
  const requestedConversation =
    turnCount * TOKENS_PER_TURN + clampedSkillTurns * TOKENS_PER_SKILL_TURN;

  const requested: VariableTokens = {
    toolDefs: requestedToolDefs,
    contextFiles,
    skillsMeta: SKILLS_META_TOKENS,
    conversation: requestedConversation,
  };

  /* ── Drain solver ────────────────────────────────────────────── */
  const { actual, headroom, drained, compactionTriggered } = drainToFit(
    requested,
    effectiveBudget
  );

  /* ── Turn layers ─────────────────────────────────────────────── */
  const turns = allocateTurns(
    turnCount,
    clampedSkillTurns,
    actual.conversation
  );
  const MAX_INDIVIDUAL = 6;
  const turnLayers: Layer[] = turns.map((turn, index) => ({
    id: `turn-${index}`,
    label: `Turn ${index + 1}`,
    shortLabel: turn.isSkill ? `S${index + 1}` : `T${index + 1}`,
    voice: 'data',
    tokens: turn.tokens,
    fixed: false,
    isSkillTurn: turn.isSkill,
    isCompacted: turn.compacted,
  }));

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

  const totalTokens = contextTotal(actual);
  const fillRatio = effectiveFill(actual, effectiveBudget);

  /* ── Readable floor for the compaction buffer tile ───────────── */
  const MIN_COMPACTION_HEIGHT = 32;

  /* ── Task attention position ─────────────────────────────────── */
  const tokensBeforeTask =
    SYSTEM_PROMPT_TOKENS +
    actual.toolDefs +
    actual.contextFiles +
    actual.skillsMeta;
  const taskMidTokens = tokensBeforeTask + USER_TASK_TOKENS / 2;
  const taskFrac =
    totalTokens > 0 ? Math.min(taskMidTokens / totalTokens, 1) : 0.5;
  const taskZone = taskSeverity(taskFrac, fillRatio);

  /* ── Region rows: layers, middle-turns group, headroom, buffer ── */
  const visibleTurnCount = turnLayers.length;
  const groupStart = 2;
  const groupEnd = visibleTurnCount - 3; // exclusive
  const grouped = turnCount > MAX_INDIVIDUAL && groupEnd > groupStart;

  const drainedFor = (layer: Layer): boolean =>
    layer.id === 'toolDefs'
      ? drained.toolDefs > 0
      : layer.id === 'contextFiles'
        ? drained.contextFiles > 0
        : layer.id === 'skillsMeta'
          ? drained.skillsMeta > 0
          : false;

  const rows: RegionTile[] = [];
  for (const layer of layers) {
    const turnIdx = layer.id.startsWith('turn-')
      ? parseInt(layer.id.slice('turn-'.length), 10)
      : -1;
    if (grouped && turnIdx >= groupStart && turnIdx < groupEnd) {
      if (turnIdx === groupStart) {
        rows.push({
          id: 'turn-group',
          weight: turnLayers
            .slice(groupStart, groupEnd)
            .reduce((sum, l) => sum + l.tokens, 0),
          label: `Turns 3–${groupEnd}`,
        });
      }
      continue;
    }
    const isDrained = drainedFor(layer);
    rows.push({
      id: layer.id,
      weight: layer.tokens,
      label: layer.label,
      accent: accentColor(layer, isDrained, taskZone),
      background: rowBg(layer, isDrained, taskZone),
      outlineColor:
        layer.id === 'userTask' ? TASK_OUTLINE[taskZone] : undefined,
      labelFontFamily: VOICE_FONT[layer.voice],
      badges: [
        {
          id: 'compacted',
          label: 'compacted',
          color: 'var(--visual-warning)',
          visible: !!layer.isCompacted,
        },
        {
          id: 'skill',
          label: 'skill',
          color: 'var(--visual-violet)',
          visible: !!layer.isSkillTurn && !layer.isCompacted,
        },
        {
          id: 'drained',
          label: 'drained',
          color: 'var(--visual-warning)',
          visible: isDrained,
        },
      ],
      meta: formatK(layer.tokens),
      collapsed: turnIdx >= turnCount && turnIdx >= 0,
    });
  }
  rows.push({
    id: 'headroom',
    weight: headroom >= 6000 ? headroom : 0,
    label: `${formatK(headroom)} headroom`,
    collapsed: headroom < 6000,
    // Empty window, not context: excluded from the zone scale, which spans
    // only filled context (first content tile -> last content tile).
    spacer: true,
  });
  rows.push({
    id: 'compaction',
    weight: showCompaction ? COMPACTION_BUFFER : 0,
    minHeight: MIN_COMPACTION_HEIGHT,
    label: 'Buffer 165K',
    collapsed: !showCompaction,
    // Reserved capacity, not a context element — it gets no attention, so it
    // stays outside the zone bands (user directive).
    spacer: true,
  });

  /* ── Tile renderer: special rows keep their bespoke anatomy ──── */
  const renderRow = (
    row: RegionTile,
    { layout }: TileRenderProps
  ): React.ReactNode => {
    if (row.id === 'headroom') {
      return (
        <CenteredTile
          row={row}
          layout={layout}
          className={`${styles.headroomRow} ${row.collapsed ? '' : styles.headroomRowActive}`}
          labelClassName={styles.headroomLabel}
        />
      );
    }
    if (row.id === 'compaction') {
      return (
        <CenteredTile
          row={row}
          layout={layout}
          className={`${styles.compactionRow} ${row.collapsed ? '' : styles.compactionRowActive}`}
          labelClassName={styles.compactionLabel}
        />
      );
    }
    if (row.id === 'turn-group') {
      return (
        <CenteredTile
          row={row}
          layout={layout}
          className={regionStyles.regionRow}
          labelClassName={styles.turnGroupLabel}
          style={{ justifyContent: 'center' }}
        />
      );
    }
    const layer = layers.find((l) => l.id === row.id);
    return (
      <StandardTile row={row} layout={layout} dimmed={!!layer?.isCompacted} />
    );
  };

  /* ── Budget bar ──────────────────────────────────────────────── */
  const effectiveFillRatio = fillRatio;
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
      : taskZone === 'middle'
        ? 'WARNING — task in lower-attention zone'
        : compactionTriggered
          ? `Conversation compacted by ${Math.round((drained.conversation / requestedConversation) * 100)}%`
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
                <span className={styles.chipLabel}>{p.label}</span>
                <span className={styles.chipMobileLabel} aria-hidden="true">
                  {MOBILE_PRESET_LABELS[p.label]}
                </span>
              </button>
            ))}
          </div>

          <p
            className={`${styles.scenarioDesc} ${SCENARIO_DESCRIPTIONS[activePreset] ? styles.descVisible : ''}`}
          >
            {SCENARIO_DESCRIPTIONS[activePreset] || '\u00A0'}
          </p>

          <div className={styles.desktopControls}>
            <ConfigControls
              showCompaction={showCompaction}
              contextFiles={contextFiles}
              installedTools={installedTools}
              toolSearchEnabled={toolSearchEnabled}
              turnCount={turnCount}
              skillTurns={skillTurns}
              ctxDisplay={ctxDisplay}
              toolDisplay={toolDisplay}
              convDisplay={convDisplay}
              skillDisplay={skillDisplay}
              drained={drained}
              onCompactionToggle={handleCompactionToggle}
              onContextFiles={handleContextFiles}
              onInstalledTools={handleInstalledTools}
              onToolSearchToggle={handleToolSearchToggle}
              onTurnCount={handleTurnCount}
              onSkillTurns={handleSkillTurns}
            />
          </div>

          <details className={styles.mobileControls}>
            <summary>Fine-tune this scenario</summary>
            <ConfigControls
              showCompaction={showCompaction}
              contextFiles={contextFiles}
              installedTools={installedTools}
              toolSearchEnabled={toolSearchEnabled}
              turnCount={turnCount}
              skillTurns={skillTurns}
              ctxDisplay={ctxDisplay}
              toolDisplay={toolDisplay}
              convDisplay={convDisplay}
              skillDisplay={skillDisplay}
              drained={drained}
              onCompactionToggle={handleCompactionToggle}
              onContextFiles={handleContextFiles}
              onInstalledTools={handleInstalledTools}
              onToolSearchToggle={handleToolSearchToggle}
              onTurnCount={handleTurnCount}
              onSkillTurns={handleSkillTurns}
            />
          </details>
        </div>

        {/* ── Arrow 1 ──────────────────────────────────────────── */}
        <div className={styles.arrow} aria-hidden="true">
          <span className={styles.arrowGlyph}>→</span>
          <span className={styles.arrowLabel}>produces</span>
        </div>

        {/* ── Panel 2: Context Window ───────────────────────────── */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>Context Window</div>

          <ContextRegionScene
            rows={rows}
            fallbackHeight={400}
            renderRow={renderRow}
            fillRatio={fillRatio}
            className={styles.contextScene}
            companionClassName={styles.attentionCompanion}
            renderCompanion={(frame) => (
              <ContextZoneStrip
                fillRatio={fillRatio}
                frame={frame}
                ariaLabel="Context attention zones"
              />
            )}
          />

          <div className={`${styles.verdict} ${styles[`verdict_${taskZone}`]}`}>
            {verdictText}
          </div>

          {/* Budget bar */}
          <div className={styles.budgetBar}>
            <div
              className={styles.budgetFill}
              style={{
                width: `${effectiveFillRatio * 100}%`,
                background: budgetColor,
              }}
            />
          </div>
          <div className={styles.budgetLabel}>
            {formatK(totalTokens)} / {formatK(effectiveBudget)}
          </div>
        </div>
      </div>

      <div className={styles.statusRegion} aria-live="polite">
        {statusText}
      </div>
    </div>
  );
}
