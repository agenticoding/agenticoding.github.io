import assert from 'node:assert/strict';
import test from 'node:test';
import { trimPathEnd } from './diagramGeometryCore.ts';

test('trimPathEnd preserves terminal tangents on straight paths', () => {
  assert.equal(trimPathEnd('M 176 192 H 208'), 'M 176 192 H 196');
  assert.equal(trimPathEnd('M 180 140 V 164'), 'M 180 140 V 152');
  assert.equal(trimPathEnd('M 180 480 V 500'), 'M 180 480 V 490');
});

test('trimPathEnd does not collapse a cubic endpoint onto its control point', () => {
  assert.equal(
    trimPathEnd('M 180 140 C 180 146, 180 150, 180 156'),
    'M 180 140 C 180 146, 180 150, 180 153'
  );
});
