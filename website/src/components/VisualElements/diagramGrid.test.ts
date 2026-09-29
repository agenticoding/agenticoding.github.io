import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Guards the single-source scale: `diagramScale.ts` owns the base grid, the space
// tokens and the type/icon ramps. Any other module that re-declares one of those
// is the drift this test exists to catch.
const HERE = dirname(fileURLToPath(import.meta.url));
const OWNER = 'diagramScale.ts';

const FORBIDDEN = [
  {
    re: /\bconst\s+[A-Z_]*GRID[A-Z_]*\s*=\s*8\b/,
    why: 're-declares the 8px base grid',
  },
  {
    re: /\bexport\s+const\s+G\s*=\s*8\b/,
    why: 're-declares the 8px base grid',
  },
  { re: /\bconst\s+G\s*=\s*8\b/, why: 're-declares the 8px base grid' },
  { re: /\bconst\s+SPACE_\d+\s*=/, why: 're-declares --space-* tokens' },
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return sourceFiles(join(dir, entry.name));
    return /\.(ts|tsx)$/.test(entry.name) ? [join(dir, entry.name)] : [];
  });
}

test('only diagramScale.ts declares the base grid, space tokens or type ramps', () => {
  const violations: string[] = [];
  for (const file of sourceFiles(HERE)) {
    const name = file.slice(file.lastIndexOf('/') + 1);
    if (name === OWNER || name.endsWith('.test.ts')) continue;
    const source = readFileSync(file, 'utf8');
    for (const { re, why } of FORBIDDEN) {
      if (re.test(source)) violations.push(`${name} ${why} (${re})`);
    }
  }
  assert.deepEqual(
    violations,
    [],
    `spacing scale drift:\n${violations.join('\n')}`
  );
});
