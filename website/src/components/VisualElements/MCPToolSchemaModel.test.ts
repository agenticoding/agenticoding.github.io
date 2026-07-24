import assert from 'node:assert/strict';
import test from 'node:test';
import { modelMCPToolSchema } from './MCPToolSchemaModel.ts';

test('grows relevant schemas in catalog order as the installed catalog expands', () => {
  const smallCatalog = modelMCPToolSchema(10);
  const largeCatalog = modelMCPToolSchema(31);

  assert.deepEqual(
    smallCatalog.lazySchemas.map(({ capability }) => capability),
    ['repository search']
  );
  assert.deepEqual(
    largeCatalog.lazySchemas.map(({ capability }) => capability),
    ['repository search', 'file editing', 'test runner', 'browser inspection']
  );
});

test('never loads more schemas than the installed catalog', () => {
  const layout = modelMCPToolSchema(2);

  assert.ok(layout.lazySchemas.length <= layout.catalogTools);
  assert.equal(layout.deferredSchemas, 1);
});
