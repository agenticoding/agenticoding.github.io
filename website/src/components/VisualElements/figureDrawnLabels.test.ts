import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { figureDrawnLabels } from './figureDrawnLabels.ts';

/**
 * Anti-drift guard for the drawn-label audio check (`src/audiobook/drawnLabels.ts`).
 *
 * One direction only: every label declared in the map must still be painted by its
 * component — a label the component no longer paints would keep failing honest
 * narration. The reverse (painted but undeclared) cannot be detected from here; map
 * completeness stays the author's discipline.
 * Reading the real component source (no fixtures) is the point: the assertion is only
 * worth having because it cannot be satisfied by editing this file.
 */
const drawnTextOf = (component: string): string =>
  readFileSync(new URL(`./${component}.tsx`, import.meta.url), 'utf8');

test('every covered component declares at least one drawn label', () => {
  const emptied = Object.entries(figureDrawnLabels)
    .filter(([, labels]) => labels.length === 0)
    .map(([component]) => component);
  assert.deepEqual(emptied, []);
});

test('every declared drawn label is text the component really contains', () => {
  const components = Object.keys(figureDrawnLabels);
  assert.ok(
    components.length > 0,
    'no drawn labels declared: guard is vacuous'
  );
  const drift = components.flatMap((component) => {
    const source = drawnTextOf(component).toLowerCase();
    return (figureDrawnLabels[component] ?? [])
      .filter((label) => !source.includes(label.toLowerCase()))
      .map((label) => `${component}: "${label}" is not drawn by the component`);
  });
  assert.deepEqual(drift, []);
});
