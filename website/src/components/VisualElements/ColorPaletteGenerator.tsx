import React, { useState } from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './ColorPaletteGenerator.module.css';

interface ColorPaletteGeneratorProps extends PresentationAwareProps {}

type HarmonyMode = 'monochromatic' | 'analogous' | 'complementary' | 'triadic';

const SHADE_NAMES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

// Non-linear lightness curve: L values for each shade stop
const LIGHTNESS_STOPS = [0.97, 0.93, 0.87, 0.78, 0.69, 0.60, 0.51, 0.43, 0.36, 0.29, 0.25];

const PEAK_CHROMA = 0.15;

const HARMONY_OFFSETS: Record<HarmonyMode, number[]> = {
  monochromatic: [0],
  analogous: [0, 30, -30],
  complementary: [0, 180],
  triadic: [0, 120, 240],
};

const HARMONY_LABELS: Record<HarmonyMode, string> = {
  monochromatic: 'Monochromatic',
  analogous: 'Analogous',
  complementary: 'Complementary',
  triadic: 'Triadic',
};

// --- Color math utilities ---

/** Compute chroma from lightness using a parabolic curve */
function computeChroma(L: number): number {
  const raw = PEAK_CHROMA * (1 - ((L - 0.6) / 0.5) ** 2);
  return Math.max(0, Math.min(PEAK_CHROMA, raw));
}

/** OKLCH -> OKLab */
function oklchToOklab(L: number, C: number, H: number): [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  return [L, C * Math.cos(hRad), C * Math.sin(hRad)];
}

/** OKLab -> linear sRGB via LMS intermediate */
function oklabToLinearSrgb(L: number, a: number, b: number): [number, number, number] {
  // OKLab -> LMS (cube root space)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  // Cube to get LMS
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS -> linear sRGB
  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return [r, g, blue];
}

/** Linear sRGB component -> sRGB gamma-corrected component */
function linearToGamma(x: number): number {
  if (x <= 0.0031308) return 12.92 * x;
  return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

/** Clamp a number to [0, 1] */
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** Convert a [0,1] float to 2-digit hex */
function toHex2(x: number): string {
  const val = Math.round(clamp01(x) * 255);
  return val.toString(16).padStart(2, '0');
}

/** Full OKLCH -> hex conversion */
function oklchToHex(L: number, C: number, H: number): string {
  const [labL, labA, labB] = oklchToOklab(L, C, H);
  const [lr, lg, lb] = oklabToLinearSrgb(labL, labA, labB);
  const r = linearToGamma(clamp01(lr));
  const g = linearToGamma(clamp01(lg));
  const b = linearToGamma(clamp01(lb));
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}

/** Compute relative luminance from OKLCH (using linear RGB) */
function relativeLuminance(L: number, C: number, H: number): number {
  const [labL, labA, labB] = oklchToOklab(L, C, H);
  const [lr, lg, lb] = oklabToLinearSrgb(labL, labA, labB);
  return 0.2126 * clamp01(lr) + 0.7152 * clamp01(lg) + 0.0722 * clamp01(lb);
}

/** WCAG contrast ratio between two relative luminance values */
function contrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Determine whether white or black text has higher contrast on the given background */
function bestTextColor(bgLum: number): 'white' | 'black' {
  const whiteContrast = contrastRatio(1.0, bgLum);
  const blackContrast = contrastRatio(bgLum, 0.0);
  return whiteContrast >= blackContrast ? 'white' : 'black';
}

/** Best contrast ratio (white or black) against a background luminance */
function bestContrast(bgLum: number): number {
  return Math.max(contrastRatio(1.0, bgLum), contrastRatio(bgLum, 0.0));
}

// --- Component ---

export default function ColorPaletteGenerator({
  compact = false,
}: ColorPaletteGeneratorProps) {
  const [hue, setHue] = useState(250);
  const [harmony, setHarmony] = useState<HarmonyMode>('monochromatic');
  const [darkMode, setDarkMode] = useState(false);

  const containerClassName = compact
    ? `${styles.container} ${styles.compact}`
    : styles.container;

  /** Get lightness for a shade index, respecting dark mode inversion */
  function getLightness(index: number): number {
    if (darkMode) {
      // Invert: shade 50 gets lightness of 950 and vice versa
      return LIGHTNESS_STOPS[LIGHTNESS_STOPS.length - 1 - index];
    }
    return LIGHTNESS_STOPS[index];
  }

  /** Build swatch data for a given hue */
  function buildShadeScale(h: number) {
    return SHADE_NAMES.map((shade, i) => {
      const L = getLightness(i);
      const C = computeChroma(L);
      const effectiveHue = ((h % 360) + 360) % 360;
      const hex = oklchToHex(L, C, effectiveHue);
      const lum = relativeLuminance(L, C, effectiveHue);
      const textColor = bestTextColor(lum);
      const ratio = bestContrast(lum);
      const passAA = ratio >= 4.5;
      return { shade, L, C, H: effectiveHue, hex, textColor, ratio, passAA };
    });
  }

  const shadeScale = buildShadeScale(hue);

  // Shade 500 lightness for harmony swatches (index 5)
  const shade500L = getLightness(5);
  const shade500C = computeChroma(shade500L);

  const harmonyOffsets = HARMONY_OFFSETS[harmony];
  const harmonySwatches = harmonyOffsets.map((offset) => {
    const h = ((hue + offset) % 360 + 360) % 360;
    const hex = oklchToHex(shade500L, shade500C, h);
    const lum = relativeLuminance(shade500L, shade500C, h);
    const textColor = bestTextColor(lum);
    return { hue: h, offset, hex, textColor };
  });

  const currentOklch = `oklch(${shade500L.toFixed(2)} ${shade500C.toFixed(3)} ${hue})`;

  return (
    <div className={containerClassName}>
      <div className={styles.header}>
        <h4 className={styles.title}>Color Palette Generator</h4>
        <p className={styles.subtitle}>{currentOklch}</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.sliderGroup}>
          <span className={styles.sliderLabel}>Hue</span>
          <input
            type="range"
            min={0}
            max={360}
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            className={styles.hueSlider}
          />
          <span className={styles.hueValue}>{hue}</span>
        </div>

        <div className={styles.buttonGroup}>
          {(Object.keys(HARMONY_LABELS) as HarmonyMode[]).map((mode) => (
            <button
              key={mode}
              className={`${styles.harmonyButton} ${harmony === mode ? styles.harmonyButtonActive : ''}`}
              onClick={() => setHarmony(mode)}
            >
              {HARMONY_LABELS[mode]}
            </button>
          ))}
        </div>

        <button
          className={`${styles.toggleButton} ${darkMode ? styles.toggleButtonActive : ''}`}
          onClick={() => setDarkMode((prev) => !prev)}
        >
          {darkMode ? 'Dark On' : 'Dark Off'}
        </button>
      </div>

      <div className={styles.sectionLabel}>
        Shade Scale {darkMode ? '(inverted)' : ''}
      </div>
      <div className={styles.swatchRow}>
        {shadeScale.map(({ shade, hex, textColor, ratio, passAA }) => (
          <div
            key={shade}
            className={styles.swatch}
            style={{ backgroundColor: hex, color: textColor }}
          >
            <span className={styles.swatchShade}>{shade}</span>
            <span className={styles.swatchHex}>{hex}</span>
            <span className={styles.swatchContrast}>
              {ratio.toFixed(1)}:1{' '}
              <span className={`${styles.badge} ${passAA ? styles.badgePass : styles.badgeFail}`}>
                {passAA ? 'AA' : 'Fail'}
              </span>
            </span>
          </div>
        ))}
      </div>

      {harmony !== 'monochromatic' && (
        <>
          <div className={styles.sectionLabel}>
            {HARMONY_LABELS[harmony]} Harmony
          </div>
          <div className={styles.harmonyRow}>
            {harmonySwatches.map(({ hue: h, offset, hex, textColor }) => (
              <div
                key={offset}
                className={styles.harmonySwatch}
                style={{ backgroundColor: hex, color: textColor }}
              >
                <span className={styles.harmonyLabel}>{h}°</span>
                <span className={styles.harmonyDegree}>
                  {offset === 0 ? 'Base' : `+${offset}°`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
