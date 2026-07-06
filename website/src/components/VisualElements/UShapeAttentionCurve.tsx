import React, { useState, useEffect, useRef } from 'react';
import styles from './UShapeAttentionCurve.module.css';

interface UShapeAttentionCurveProps {
  initialContextFill?: number; // 0-100, default 30
}

const PLOT_LEFT = 60;
const PLOT_RIGHT = 760;
const PLOT_TOP = 30;
const PLOT_BOT = 260;
const PLOT_W = PLOT_RIGHT - PLOT_LEFT; // 700
const PLOT_H = PLOT_BOT - PLOT_TOP;   // 230
const DOT_COUNT = 9;
const DOT_SIZE = 10;

// Returns { danger, cyanOpacity } so dots can be rendered as layered rects
// matching the background zone fade approach exactly.
function getDotLayers(frac: number, deadCenterStart: number, deadCenterEnd: number, jCurveStrength: number): { danger: boolean; cyanOpacity: number } {
  if (frac >= deadCenterStart && frac <= deadCenterEnd) return { danger: true, cyanOpacity: 0 };
  if (frac >= 0.80) return { danger: false, cyanOpacity: 1 };
  if (frac <= 0.20) return { danger: false, cyanOpacity: 1 - jCurveStrength };
  return { danger: false, cyanOpacity: 0 };
}

function getSeverity(contextFill: number): { tier: string; desc: string; color: string } {
  if (contextFill <= 20) {
    return { tier: 'MANAGEABLE', desc: 'middle receives moderate attention', color: 'var(--visual-success)' };
  }
  if (contextFill <= 50) {
    return { tier: 'SIGNIFICANT', desc: 'middle content often missed on inferential tasks', color: 'var(--visual-warning)' };
  }
  return { tier: 'SEVERE', desc: 'middle invisible — only recency remains reliable', color: 'var(--visual-error)' };
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return prefersReducedMotion;
}

export default function UShapeAttentionCurve({
  initialContextFill = 30,
}: UShapeAttentionCurveProps) {
  const [contextFill, setContextFill] = useState(Math.max(0, Math.min(100, initialContextFill)));

  const fillRatio = contextFill / 100;

  // Zone boundary math
  const deadCenterHalf = fillRatio * 0.15;
  const deadCenterStart = 0.5 - deadCenterHalf;
  const deadCenterEnd = 0.5 + deadCenterHalf;

  // Fixed zone boundaries
  const primacyEnd = PLOT_LEFT + 0.20 * PLOT_W;       // x=200
  const recencyStart = PLOT_LEFT + 0.80 * PLOT_W;     // x=620
  const deadStart = PLOT_LEFT + deadCenterStart * PLOT_W;
  const deadEnd = PLOT_LEFT + deadCenterEnd * PLOT_W;

  // J-curve strength (extracted for use in both zone backgrounds and dot colors)
  const jCurveStrength = Math.max(0, fillRatio - 0.5) * 2; // 0 at ≤50%, 1 at 100%

  // Dot positions
  const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
    const frac = i / (DOT_COUNT - 1);
    const dotX = PLOT_LEFT + frac * PLOT_W;

    const maxDrop = fillRatio * 0.85;

    // Base symmetric U-shape
    const distFromCenter = 1 - Math.abs(frac - 0.5) * 2; // 0 at edges, 1 at center
    let drop = distFromCenter ** 2 * maxDrop;

    // J-curve: primacy decays at high fill (left edge droops, right stays high)
    const primacyDecay = (1 - frac) * jCurveStrength * 0.3;  // max at start, zero at end
    drop = Math.min(drop + primacyDecay, 0.95);

    const dotY = PLOT_TOP + drop * PLOT_H;
    const layers = getDotLayers(frac, deadCenterStart, deadCenterEnd, jCurveStrength);
    return { dotX, dotY, ...layers };
  });

  const polylinePoints = dots
    .map(d => `${d.dotX},${d.dotY}`)
    .join(' ');

  const severity = getSeverity(contextFill);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Crossfade state: keep outgoing tier alive for the design-system moderate duration.
  type Severity = ReturnType<typeof getSeverity>;
  const [displayed, setDisplayed] = useState<Severity>(severity);
  const [outgoing, setOutgoing] = useState<Severity | null>(null);
  const displayedRef = useRef(displayed);
  displayedRef.current = displayed;

  useEffect(() => {
    if (severity.tier === displayedRef.current.tier) return;
    if (prefersReducedMotion) {
      setOutgoing(null);
      setDisplayed(severity);
      return;
    }
    const prev = displayedRef.current;
    setOutgoing(prev);
    setDisplayed(severity);
    const t = setTimeout(() => setOutgoing(null), 240);
    return () => clearTimeout(t);
  }, [severity.tier, prefersReducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Zone visibility fade: animate entrance and leave when zone crosses the 60px threshold
  const zoneWidth = deadEnd - deadStart;
  const isWide = zoneWidth >= 60;
  const [zoneShown, setZoneShown] = useState(isWide);
  const [zoneFade, setZoneFade] = useState<'in' | 'out' | null>(null);
  const prevIsWideRef = useRef(isWide);

  useEffect(() => {
    if (isWide === prevIsWideRef.current) return;
    prevIsWideRef.current = isWide;
    if (prefersReducedMotion) {
      setZoneShown(isWide);
      setZoneFade(null);
      return;
    }
    if (isWide) {
      setZoneShown(true);
      setZoneFade('in');
      const t = setTimeout(() => setZoneFade(null), 240);
      return () => clearTimeout(t);
    }
    setZoneFade('out');
    const t = setTimeout(() => { setZoneShown(false); setZoneFade(null); }, 240);
    return () => clearTimeout(t);
  }, [isWide, prefersReducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Desc visibility fade: animate entrance and leave when zone crosses the 120px threshold
  const isDescWide = zoneWidth >= 120;
  const [descShown, setDescShown] = useState(isDescWide);
  const [descFade, setDescFade] = useState<'in' | 'out' | null>(null);
  const prevIsDescWideRef = useRef(isDescWide);

  useEffect(() => {
    if (isDescWide === prevIsDescWideRef.current) return;
    prevIsDescWideRef.current = isDescWide;
    if (prefersReducedMotion) {
      setDescShown(isDescWide);
      setDescFade(null);
      return;
    }
    if (isDescWide) {
      setDescShown(true);
      setDescFade('in');
      const t = setTimeout(() => setDescFade(null), 240);
      return () => clearTimeout(t);
    }
    setDescFade('out');
    const t = setTimeout(() => { setDescShown(false); setDescFade(null); }, 240);
    return () => clearTimeout(t);
  }, [isDescWide, prefersReducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.container}>
      <svg
        className={styles.svg}
        viewBox="0 0 800 320"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Attention curve showing how attention distributes across context window"
      >
        {/* Zone backgrounds */}
        {/* Primacy: neutral base + cyan overlay fading with jCurveStrength */}
        <rect x={PLOT_LEFT} y={PLOT_TOP} width={primacyEnd - PLOT_LEFT} height={PLOT_H} fill="var(--surface-muted)" />
        <rect x={PLOT_LEFT} y={PLOT_TOP} width={primacyEnd - PLOT_LEFT} height={PLOT_H} fill="var(--visual-bg-cyan)" opacity={1 - jCurveStrength} />
        {/* Middle-left */}
        <rect x={primacyEnd} y={PLOT_TOP} width={Math.max(0, deadStart - primacyEnd)} height={PLOT_H} fill="var(--surface-muted)" />
        {/* Dead center */}
        <rect x={deadStart} y={PLOT_TOP} width={Math.max(0, deadEnd - deadStart)} height={PLOT_H} fill="var(--visual-bg-error)" />
        {/* Middle-right */}
        <rect x={deadEnd} y={PLOT_TOP} width={Math.max(0, recencyStart - deadEnd)} height={PLOT_H} fill="var(--surface-muted)" />
        {/* Recency: always cyan */}
        <rect x={recencyStart} y={PLOT_TOP} width={PLOT_RIGHT - recencyStart} height={PLOT_H} fill="var(--visual-bg-cyan)" />

        {/* Y-axis */}
        <line
          x1={PLOT_LEFT} y1={PLOT_TOP}
          x2={PLOT_LEFT} y2={PLOT_BOT}
          stroke="var(--border-subtle)"
          strokeWidth={1}
        />

        {/* Polyline connecting dot centers */}
        <polyline
          points={polylinePoints}
          stroke="var(--border-emphasis)"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots: neutral base + cyan overlay (mirrors zone background layering) */}
        {dots.map((dot, i) => (
          <g key={i}>
            <rect
              x={dot.dotX - DOT_SIZE / 2}
              y={dot.dotY - DOT_SIZE / 2}
              width={DOT_SIZE}
              height={DOT_SIZE}
              rx={0}
              className={dot.danger ? styles.dotDanger : styles.dot}
            />
            {!dot.danger && dot.cyanOpacity > 0 && (
              <rect
                x={dot.dotX - DOT_SIZE / 2}
                y={dot.dotY - DOT_SIZE / 2}
                width={DOT_SIZE}
                height={DOT_SIZE}
                rx={0}
                className={styles.dotCyan}
                opacity={dot.cyanOpacity}
              />
            )}
          </g>
        ))}

        {/* Y-axis labels */}
        <text x={PLOT_LEFT - 8} y={PLOT_TOP + 4} textAnchor="end" className={styles.axisLabel}>High</text>
        <text x={PLOT_LEFT - 8} y={PLOT_BOT}     textAnchor="end" className={styles.axisLabel}>Low</text>

        {/* X-axis zone labels */}
        <text
          x={(PLOT_LEFT + primacyEnd) / 2}
          y={PLOT_BOT + 22}
          textAnchor="middle"
          className={styles.axisLabel}
        >
          PRIMACY
        </text>
        <text
          x={(primacyEnd + recencyStart) / 2}
          y={PLOT_BOT + 22}
          textAnchor="middle"
          className={styles.zoneLabelError}
        >
          LOST IN MIDDLE
        </text>
        <text
          x={(recencyStart + PLOT_RIGHT) / 2}
          y={PLOT_BOT + 22}
          textAnchor="middle"
          className={styles.axisLabel}
        >
          RECENCY
        </text>

        {/* Inline zone annotation — fades in/out as zone crosses 60px threshold */}
        {zoneShown && (() => {
          const cx = (deadStart + deadEnd) / 2;
          const zoneCls = !prefersReducedMotion && zoneFade === 'in' ? styles.zoneAnnotationIn : !prefersReducedMotion && zoneFade === 'out' ? styles.zoneAnnotationOut : '';
          const descCls = `${styles.zoneAnnotationDesc} ${!prefersReducedMotion && descFade === 'in' ? styles.zoneAnnotationIn : !prefersReducedMotion && descFade === 'out' ? styles.zoneAnnotationOut : ''}`;
          const renderText = (s: ReturnType<typeof getSeverity>, cls: string, key: string) => (
            <text key={key} x={cx} y={PLOT_TOP + 16} textAnchor="middle" className={cls}>
              <tspan fill={s.color} className={styles.zoneAnnotationTier}>{s.tier}</tspan>
              {descShown && (
                <tspan x={cx} dy="14" className={descCls}>{s.desc}</tspan>
              )}
            </text>
          );
          return (
            <g className={zoneCls}>
              {outgoing && renderText(outgoing, `${styles.zoneAnnotation} ${styles.zoneAnnotationOut}`, 'out')}
              {renderText(displayed, `${styles.zoneAnnotation} ${outgoing ? styles.zoneAnnotationIn : ''}`, displayed.tier)}
            </g>
          );
        })()}
      </svg>

      {/* Slider row */}
      <div className={styles.sliderRow}>
        <span className={styles.sliderLabel}>Context Fill</span>
        <input
          type="range"
          min={0}
          max={100}
          value={contextFill}
          onChange={e => setContextFill(Number(e.target.value))}
          className={styles.slider}
          aria-label="Context fill percentage"
          aria-valuetext={`${contextFill}%, ${severity.tier}: ${severity.desc}`}
        />
        <span className={styles.sliderValue}>{contextFill}%</span>
      </div>

    </div>
  );
}
