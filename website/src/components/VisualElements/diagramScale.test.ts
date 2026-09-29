import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  DIAGRAM_GRID,
  DIAGRAM_ICON_SIZE,
  DIAGRAM_STROKE,
  DIAGRAM_TOKEN_SIZE,
  SPACE,
  TILE_TYPE,
} from './diagramScale.ts';

const css = readFileSync(
  new URL('../../css/custom.css', import.meta.url),
  'utf8'
);

function cssTokenValues(prefix: string): number[] {
  const re = new RegExp(`--${prefix}-[\\w]+:\\s*(\\d+)px`, 'g');
  return [...css.matchAll(re)].map((match) => Number(match[1]));
}

function cssTokenValue(suffix: string): number | undefined {
  const match = css.match(new RegExp(`--space-${suffix}:\\s*(\\d+)px`));
  return match ? Number(match[1]) : undefined;
}

test('SPACE mirrors the --space-* tokens in custom.css', () => {
  for (const suffix of Object.keys(SPACE)) {
    assert.equal(
      SPACE[suffix as keyof typeof SPACE],
      cssTokenValue(suffix),
      `SPACE["${suffix}"] drifted from --space-${suffix}`
    );
  }
});

test('diagram icon tiers use --icon-* token values only', () => {
  const allowed = new Set(cssTokenValues('icon'));
  for (const [tier, size] of Object.entries(DIAGRAM_ICON_SIZE)) {
    assert.ok(
      allowed.has(size),
      `${tier} icon (${size}px) is not an --icon-* token`
    );
  }
});

test('flow glyph tiers keep whole-pixel edges around the connector', () => {
  for (const [tier, size] of Object.entries(DIAGRAM_TOKEN_SIZE)) {
    assert.ok(
      size >= DIAGRAM_GRID,
      `token ${tier} (${size}px) is below the 8px minimum shape dimension`
    );
    assert.equal(
      size % DIAGRAM_STROKE.connector,
      0,
      `token ${tier} (${size}px) cannot centre on the ${DIAGRAM_STROKE.connector}px connector`
    );
  }
});

test('tile type ramp uses --text-* token values only', () => {
  const allowed = new Set(cssTokenValues('text'));
  for (const [role, size] of Object.entries(TILE_TYPE)) {
    assert.ok(
      allowed.has(size),
      `tile ${role} (${size}px) is not a --text-* token`
    );
  }
});
