import React, { useState, useEffect, useRef } from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './UShapeAttentionCurve.module.css';

interface UShapeAttentionCurveProps extends PresentationAwareProps {
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

export default function UShapeAttentionCurve({
  initialContextFill = 30,
  compact = false,
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

  // Crossfade state: keep outgoing tier alive for 250ms during transition
  type Severity = ReturnType<typeof getSeverity>;
  const [displayed, setDisplayed] = useState<Severity>(severity);
  const [outgoing, setOutgoing] = useState<Severity | null>(null);
  const displayedRef = useRef(displayed);
  displayedRef.current = displayed;

  useEffect(() => {
    if (severity.tier === displayedRef.current.tier) return;
    const prev = displayedRef.current;
    setOutgoing(prev);
    setDisplayed(severity);
    const t = setTimeout(() => setOutgoing(null), 250);
    return () => clearTimeout(t);
  }, [severity.tier]); // eslint-disable-line react-hooks/exhaustive-deps

  // Zone visibility fade: animate entrance and leave when zone crosses the 60px threshold
  const zoneWidth = deadEnd - deadStart;
  const isWide = zoneWidth >= 60;
  const [zoneShown, setZoneShown] = useState(isWide);
  const [zoneFade, setZoneFade] = useState<'in' | 'out' | null>(null);
  const prevIsWideRef = useRef(isWide);

  useEffect(() => {
    if (isWide === prevIsWideRef.current) return;
    prevIsWideRef.current = isWide;
    if (isWide) {
      setZoneShown(true);
      setZoneFade('in');
      const t = setTimeout(() => setZoneFade(null), 250);
      return () => clearTimeout(t);
    } else {
      setZoneFade('out');
      const t = setTimeout(() => { setZoneShown(false); setZoneFade(null); }, 250);
      return () => clearTimeout(t);
    }
  }, [isWide]); // eslint-disable-line react-hooks/exhaustive-deps

  // Desc visibility fade: animate entrance and leave when zone crosses the 120px threshold
  const isDescWide = zoneWidth >= 120;
  const [descShown, setDescShown] = useState(isDescWide);
  const [descFade, setDescFade] = useState<'in' | 'out' | null>(null);
  const prevIsDescWideRef = useRef(isDescWide);

  useEffect(() => {
    if (isDescWide === prevIsDescWideRef.current) return;
    prevIsDescWideRef.current = isDescWide;
    if (isDescWide) {
      setDescShown(true);
      setDescFade('in');
      const t = setTimeout(() => setDescFade(null), 250);
      return () => clearTimeout(t);
    } else {
      setDescFade('out');
      const t = setTimeout(() => { setDescShown(false); setDescFade(null); }, 250);
      return () => clearTimeout(t);
    }
  }, [isDescWide]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
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
          const zoneCls = zoneFade === 'in' ? styles.zoneAnnotationIn : zoneFade === 'out' ? styles.zoneAnnotationOut : '';
          const descCls = `${styles.zoneAnnotationDesc} ${descFade === 'in' ? styles.zoneAnnotationIn : descFade === 'out' ? styles.zoneAnnotationOut : ''}`;
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

      {/* Explanation cards */}
      {!compact && (
        <div className={styles.cards}>
          <div className={`${styles.card} ${styles.cardPrimacy}`}>
            <div className={styles.cardTitle}>PRIMACY EFFECT</div>
            <div className={styles.cardBody}>
              Content at the beginning receives strong attention at low-to-moderate fill.
              At high fill, primacy also degrades — put system instructions at the top,
              but reinforce critical constraints near the end too.
            </div>
          </div>
          <div className={`${styles.card} ${styles.cardLost}`}>
            <div className={`${styles.cardTitle} ${styles.cardTitleError}`}>LOST IN MIDDLE</div>
            <div className={styles.cardBody}>
              Content in the middle is frequently skipped. Simple retrieval may still
              work, but inferential tasks — following multi-step constraints, connecting
              facts — fail catastrophically. As fill increases, this dead zone expands.
            </div>
          </div>
          <div className={`${styles.card} ${styles.cardRecency}`}>
            <div className={styles.cardTitle}>RECENCY EFFECT</div>
            <div className={styles.cardBody}>
              Content at the end receives the strongest and most stable attention at any
              fill level. Place your final task instructions, output format requirements,
              and critical constraints here — recency is the most reliable position.
            </div>
          </div>
          <div className={`${styles.card} ${styles.cardTrap}`}>
            <div className={`${styles.cardTitle} ${styles.cardTitleWarning}`}>
              WHY A BIGGER WINDOW WON&apos;T HELP
            </div>
            <div className={styles.cardBody}>
              At 128K tokens, all frontier models score ~84% on MRCR v2 — regardless of
              advertised window size. The divergence only appears past 60–70% fill:
              Sonnet (200K window) at 128K scores 84.9%, while Gemini (10M window)
              stuffed to 1M scores 26.3%. For agentic coding, context management that
              keeps you in the effective zone beats a bigger window every time.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
