import { useMounted } from '../../hooks/useMounted';

// ── Layout — ViewBox 620×295 ─────────────────────────────────────────────────
// Three panels of width 155, separated by 40px arrow zones.
// Panel A (Before):         x=16,  width=155
// Arrow A→B label:          x=188, (center of 171–203 gap)
// Panel B (After /compact): x=204, width=155
// Arrow B→C label:          x=376, (center of 359–391 gap)
// Panel C (After /clear):   x=392, width=155
//
// Vertical bands: y=32 (title baseline) → y=35 (bands start) → y=248 (bands end)
// Total band height: 213px
// Bottom annotation: y=270

const VW  = 620;
const VH  = 295;
const PW  = 155; // panel width

// Panel left edges
const PA_X = 16;
const PB_X = 204;
const PC_X = 392;

// Arrow centers
const AB_CX = 188; // midpoint of 171–204 gap
const BC_CX = 376; // midpoint of 359–392 gap

// Band area
const BAND_Y0  = 35;  // first band top
const BAND_Y1  = 248; // last band bottom

// ── Band definitions ─────────────────────────────────────────────────────────
// Heights are proportional; must sum to BAND_TOT.
// "headroom" bands use a dashed stroke pattern.

interface Band {
  label:    string;
  h:        number;
  color:    string;
  bg:       string;
  dashed?:  boolean;
  note?:    string;  // small annotation below band
}

// Panel A — Before (total 213px)
const BANDS_A: Band[] = [
  { label: 'System Prompt', h: 22,  color: 'var(--visual-neutral)', bg: 'var(--visual-bg-neutral)' },
  { label: 'Context Files', h: 38,  color: 'var(--visual-cyan)',    bg: 'var(--visual-bg-cyan)' },
  { label: 'Tool Defs',     h: 32,  color: 'var(--visual-indigo)',  bg: 'var(--visual-bg-indigo)' },
  { label: 'Turn 1',        h: 22,  color: 'var(--visual-neutral)', bg: 'var(--visual-bg-neutral)' },
  { label: 'Turn 2',        h: 22,  color: 'var(--visual-neutral)', bg: 'var(--visual-bg-neutral)' },
  { label: 'Turn 3',        h: 22,  color: 'var(--visual-neutral)', bg: 'var(--visual-bg-neutral)' },
  { label: 'Turn 4',        h: 22,  color: 'var(--visual-neutral)', bg: 'var(--visual-bg-neutral)' },
  { label: 'User Task',     h: 20,  color: 'var(--border-emphasis)', bg: 'transparent' },
  { label: 'headroom',      h: 13,  color: 'var(--border-default)', bg: 'transparent', dashed: true },
];
// Sum: 22+38+32+22+22+22+22+20+13 = 213 ✓

// Panel B — After /compact (total 213px)
const BANDS_B: Band[] = [
  { label: 'System Prompt', h: 22,  color: 'var(--visual-neutral)',  bg: 'var(--visual-bg-neutral)' },
  { label: 'Context Files', h: 38,  color: 'var(--visual-cyan)',     bg: 'var(--visual-bg-cyan)' },
  { label: 'Tool Defs',     h: 32,  color: 'var(--visual-indigo)',   bg: 'var(--visual-bg-indigo)' },
  { label: 'Summary',       h: 52,  color: 'var(--visual-magenta)',  bg: 'var(--visual-bg-magenta)',
    note: 'summary at primacy' },
  { label: 'User Task',     h: 20,  color: 'var(--border-emphasis)', bg: 'transparent' },
  { label: 'headroom',      h: 49,  color: 'var(--border-default)',  bg: 'transparent', dashed: true },
];
// Sum: 22+38+32+52+20+49 = 213 ✓

// Panel C — After /clear (total 213px)
const BANDS_C: Band[] = [
  { label: 'System Prompt', h: 22,  color: 'var(--visual-neutral)', bg: 'var(--visual-bg-neutral)' },
  { label: 'empty',         h: 191, color: 'var(--border-default)', bg: 'transparent', dashed: true },
];
// Sum: 22+191 = 213 ✓

// ── Band renderer ─────────────────────────────────────────────────────────────
function renderBands(bands: Band[], px: number, startY: number): React.ReactNode[] {
  let cy = startY;
  const nodes: React.ReactNode[] = [];

  for (const band of bands) {
    const y = cy;
    const h = band.h;
    cy += h;

    if (band.dashed) {
      // Dashed empty rect — no fill rect, just a stroked rect with dasharray
      nodes.push(
        <rect
          key={`${px}-${y}-dash`}
          x={px}
          y={y}
          width={PW}
          height={h}
          rx={0}
          fill="transparent"
          stroke={band.color}
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      );
      // Label centered
      nodes.push(
        <text
          key={`${px}-${y}-lbl`}
          x={px + PW / 2}
          y={y + h / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fontFamily="var(--font-mono)"
          fill="var(--text-muted)"
        >
          {band.label}
        </text>
      );
    } else {
      // Solid band with left accent strip
      nodes.push(
        <rect
          key={`${px}-${y}-bg`}
          x={px}
          y={y}
          width={PW}
          height={h}
          rx={0}
          fill={band.bg}
          stroke={band.color}
          strokeWidth={1}
        />
      );
      nodes.push(
        <rect
          key={`${px}-${y}-accent`}
          x={px}
          y={y}
          width={3}
          height={h}
          rx={0}
          fill={band.color}
        />
      );
      // When a note is present, shift label up by 6px so the pair is visually centered
      const lblYOffset = band.note ? -6 : 0;
      nodes.push(
        <text
          key={`${px}-${y}-lbl`}
          x={px + 8}
          y={y + h / 2 + lblYOffset}
          dominantBaseline="middle"
          fontSize={10}
          fontFamily="var(--font-mono)"
          fill={band.color}
        >
          {band.label}
        </text>
      );
      // Optional note — second line inside the band (band must be tall enough)
      if (band.note) {
        nodes.push(
          <text
            key={`${px}-${y}-note`}
            x={px + 8}
            y={y + h / 2 + 13}
            dominantBaseline="middle"
            fontSize={9}
            fontFamily="var(--font-mono-keyword)"
            fill={band.color}
            fontStyle="italic"
          >
            {band.note}
          </text>
        );
      }
    }
  }

  return nodes;
}

export default function CompactClearDiagram() {
  const mounted = useMounted();
  if (!mounted) return <div style={{ minHeight: 280 }} />;

  const titleY = 22;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      role="img"
      aria-label="Three context window states: Before (full conversation history), After /compact (conversation replaced by a summary), After /clear (empty window). Both commands reduce token pressure — /compact maintains continuity, /clear resets completely."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: `${VW}px`, margin: '0 auto' }}
    >
      {/* ── Panel titles ─────────────────────────────────────────────────────── */}
      <text
        x={PA_X + PW / 2} y={titleY}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-mono-keyword)"
        fill="var(--text-muted)"
        letterSpacing="0.06em"
      >
        BEFORE
      </text>
      <text
        x={PB_X + PW / 2} y={titleY}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-mono-keyword)"
        fill="var(--text-muted)"
        letterSpacing="0.06em"
      >
        AFTER /compact
      </text>
      <text
        x={PC_X + PW / 2} y={titleY}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-mono-keyword)"
        fill="var(--text-muted)"
        letterSpacing="0.06em"
      >
        AFTER /clear
      </text>

      {/* ── Panel A bands ────────────────────────────────────────────────────── */}
      {renderBands(BANDS_A, PA_X, BAND_Y0)}

      {/* ── Arrow A→B ────────────────────────────────────────────────────────── */}
      <text
        x={AB_CX} y={(BAND_Y0 + BAND_Y1) / 2 - 6}
        textAnchor="middle"
        fontSize={12}
        fill="var(--visual-violet)"
        fontFamily="var(--font-mono-keyword)"
        fontWeight={700}
      >
        →
      </text>
      <text
        x={AB_CX} y={(BAND_Y0 + BAND_Y1) / 2 + 8}
        textAnchor="middle"
        fontSize={9}
        fontFamily="var(--font-mono-keyword)"
        fill="var(--visual-violet)"
        fontWeight={700}
      >
        /compact
      </text>

      {/* ── Panel B bands ────────────────────────────────────────────────────── */}
      {renderBands(BANDS_B, PB_X, BAND_Y0)}

      {/* ── "60-80% reduction" label on Panel B ─────────────────────────────── */}
      <text
        x={PB_X + PW / 2}
        y={BAND_Y1 + 12}
        textAnchor="middle"
        fontSize={9}
        fontFamily="var(--font-mono-keyword)"
        fill="var(--visual-magenta)"
        fontWeight={600}
      >
        60–80% reduction
      </text>

      {/* ── Arrow B→C ────────────────────────────────────────────────────────── */}
      <text
        x={BC_CX} y={(BAND_Y0 + BAND_Y1) / 2 - 6}
        textAnchor="middle"
        fontSize={12}
        fill="var(--visual-error)"
        fontFamily="var(--font-mono-keyword)"
        fontWeight={700}
      >
        →
      </text>
      <text
        x={BC_CX} y={(BAND_Y0 + BAND_Y1) / 2 + 8}
        textAnchor="middle"
        fontSize={9}
        fontFamily="var(--font-mono-keyword)"
        fill="var(--visual-error)"
        fontWeight={700}
      >
        /clear
      </text>

      {/* ── Panel C bands ────────────────────────────────────────────────────── */}
      {renderBands(BANDS_C, PC_X, BAND_Y0)}

      {/* ── Bottom annotation ────────────────────────────────────────────────── */}
      <text
        x={VW / 2} y={270}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-mono)"
        fill="var(--text-muted)"
      >
        Both commands reduce token pressure —
      </text>
      <text
        x={VW / 2} y={283}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-mono)"
        fill="var(--text-muted)"
      >
        /compact maintains continuity, /clear resets completely
      </text>
    </svg>
  );
}
