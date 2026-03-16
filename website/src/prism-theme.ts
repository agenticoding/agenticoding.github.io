/**
 * Custom Prism themes — Design System aligned
 *
 * Every color answers: "what does this hue mean here?" per DESIGN_SYSTEM.md.
 *
 * Semantic mapping:
 *   comment        → Neutral (human/informal voice, muted)
 *   string/data    → Indigo  H:250° (knowledge, data references)
 *   keyword/tag    → Cyan    H:195° (system, code structure)
 *   function/type  → Violet  H:285° (AI transformation, type-level ops)
 *   regex          → Magenta H:320° (creative pattern matching)
 *   inserted       → Success H:155° (validated, added)
 *   deleted        → Error   H:25°  (danger, removed)
 *   operator/punct → Neutral          (structural glue, no semantic weight)
 *
 * Background: --code-bg (neutral-50 light / neutral-950 dark) — achromatic.
 * Chroma cap: C≤0.13 for all categorical hues (equal standing per spec).
 * No tinted neutrals. No high-chroma Dracula-style fills.
 *
 * NOTE: hex values below are hardcoded (prism-react-renderer requires JS objects,
 * not CSS custom properties). If design tokens change in custom.css, update here too.
 */
import type { PrismTheme } from 'prism-react-renderer';

// ---------------------------------------------------------------------------
// Light theme — --surface-raised (#f5f5f5) background
// ---------------------------------------------------------------------------
export const lightTheme: PrismTheme = {
  plain: {
    color: '#505050',        // --text-body (neutral-700)
    backgroundColor: '#f5f5f5', // --code-bg-light (neutral-50)
  },
  styles: [
    // Neutral: human/informal — comments are developer voice, muted
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: '#808080', fontStyle: 'italic' }, // neutral-500
    },
    // Neutral: structural glue — punctuation carries no semantic weight
    {
      types: ['punctuation', 'operator', 'entity', 'url'],
      style: { color: '#666666' }, // neutral-600
    },
    // Neutral: namespace prefixes
    {
      types: ['namespace'],
      style: { color: '#808080' }, // neutral-500
    },
    // Cyan H:195° — system/code: keywords are structural code vocabulary
    {
      types: ['keyword', 'control-flow', 'atrule', 'rule'],
      style: { color: '#008485' }, // --visual-cyan (gamut-clipped C=0.095)
    },
    // Cyan H:195° — system/code: tags are markup system components
    {
      types: ['tag', 'selector'],
      style: { color: '#008485' }, // --visual-cyan
    },
    // Indigo H:250° — knowledge/data: strings are content, data references
    {
      types: ['string', 'attr-value', 'char', 'template-string'],
      style: { color: '#307ac0' }, // --visual-indigo C=0.13
    },
    // Magenta H:320° — creative pattern matching: regex literals
    {
      types: ['regex'],
      style: { color: '#9d5fab' }, // --visual-magenta OKLCH(0.583 0.13 320°)
    },
    // Indigo H:250° — knowledge/data: numbers and booleans are data literals
    {
      types: ['number', 'boolean', 'null', 'undefined'],
      style: { color: '#307ac0' }, // --visual-indigo
    },
    // Violet H:285° — AI transformation: functions are transformation operations
    {
      types: ['function', 'function-variable'],
      style: { color: '#736cc3' }, // --visual-violet C=0.13
    },
    // Violet H:285° — AI transformation: class/type names are structural abstractions
    {
      types: ['class-name', 'maybe-class-name', 'builtin'],
      style: { color: '#736cc3' }, // --visual-violet
    },
    // Cyan H:195° — system/code: attribute names are structural identifiers
    {
      types: ['attr-name', 'property'],
      style: { color: '#008485' }, // --visual-cyan
    },
    // Indigo H:250° — knowledge/data: constants and symbols are named data
    {
      types: ['constant', 'symbol', 'variable'],
      style: { color: '#307ac0' }, // --visual-indigo
    },
    // Success H:155° — validated/complete: inserted lines (diffs)
    {
      types: ['inserted'],
      style: { color: '#00894d' }, // --visual-success
    },
    // Error H:25° — danger/critical: deleted lines (diffs)
    {
      types: ['deleted'],
      style: { color: '#ee0028' }, // --visual-error
    },
    // Formatting — preserve italic/bold without color change
    {
      types: ['italic'],
      style: { fontStyle: 'italic' },
    },
    {
      types: ['bold', 'important'],
      style: { fontWeight: 'bold' },
    },
  ],
};

// ---------------------------------------------------------------------------
// Dark theme — neutral-950 (#222222) background
// ---------------------------------------------------------------------------
export const darkTheme: PrismTheme = {
  plain: {
    color: '#d4d4d4',        // --text-body dark (neutral-200)
    backgroundColor: '#222222', // --neutral-950 (achromatic, not Dracula purple)
  },
  styles: [
    // Neutral: human/informal — comments muted
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: '#666666', fontStyle: 'italic' }, // neutral-600
    },
    // Neutral: structural glue
    {
      types: ['punctuation', 'operator', 'entity', 'url'],
      style: { color: '#9b9b9b' }, // neutral-400
    },
    // Neutral: namespace prefixes
    {
      types: ['namespace'],
      style: { color: '#808080' }, // neutral-500
    },
    // Cyan H:195° — system/code (shade-400 for dark mode)
    {
      types: ['keyword', 'control-flow', 'atrule', 'rule'],
      style: { color: '#00b2b2' }, // cyan-400
    },
    // Cyan H:195° — system/code
    {
      types: ['tag', 'selector'],
      style: { color: '#00b2b2' }, // cyan-400
    },
    // Indigo H:250° — knowledge/data (shade-400 for dark mode)
    {
      types: ['string', 'attr-value', 'char', 'template-string'],
      style: { color: '#53a0ec' }, // indigo-400
    },
    // Magenta H:320° — creative pattern matching: regex literals
    {
      types: ['regex'],
      style: { color: '#c07ecf' }, // --visual-magenta dark (Magenta-400)
    },
    // Indigo H:250° — knowledge/data literals
    {
      types: ['number', 'boolean', 'null', 'undefined'],
      style: { color: '#53a0ec' }, // indigo-400
    },
    // Violet H:285° — AI transformation (shade-400 for dark mode)
    {
      types: ['function', 'function-variable'],
      style: { color: '#938eeb' }, // violet-400
    },
    // Violet H:285° — AI transformation
    {
      types: ['class-name', 'maybe-class-name', 'builtin'],
      style: { color: '#938eeb' }, // violet-400
    },
    // Cyan H:195° — system/code
    {
      types: ['attr-name', 'property'],
      style: { color: '#00b2b2' }, // cyan-400
    },
    // Indigo H:250° — knowledge/data
    {
      types: ['constant', 'symbol', 'variable'],
      style: { color: '#53a0ec' }, // indigo-400
    },
    // Success H:155° — validated (shade-400 for dark mode)
    {
      types: ['inserted'],
      style: { color: '#48b475' }, // success-400
    },
    // Error H:25° — danger (shade-400 for dark mode)
    {
      types: ['deleted'],
      style: { color: '#ec7069' }, // error-400
    },
    // Formatting
    {
      types: ['italic'],
      style: { fontStyle: 'italic' },
    },
    {
      types: ['bold', 'important'],
      style: { fontWeight: 'bold' },
    },
  ],
};
