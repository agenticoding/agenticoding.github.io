import assert from 'node:assert/strict';
import test from 'node:test';

import { pinAfter } from './figureScenario.ts';

/** The rows a table lists, shaped as both figures' rows are: a model id. */
const listed = [{ model: { id: 'kept' } }, { model: { id: 'other' } }];
const idOf = (row: (typeof listed)[number]) => row.model.id;

test('a pin survives exactly while the list still holds its row', () => {
  assert.equal(pinAfter(listed, 'other', idOf), 'other');
  assert.equal(pinAfter(listed, 'gone', idOf), null);
  assert.equal(pinAfter([], 'kept', idOf), null);
  assert.equal(pinAfter(listed, null, idOf), null);
});
