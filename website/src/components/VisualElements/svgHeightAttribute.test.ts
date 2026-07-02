import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const componentsDir = dirname(dirname(fileURLToPath(import.meta.url)));
const invalidSvgHeightAttribute = /<svg\b[\s\S]*?\bheight\s*=\s*["']auto["'][\s\S]*?>/;
const invalidSvgHeightStyle = /<svg\b[\s\S]*?\bstyle\s*=\s*\{\{[\s\S]*?\bheight\s*:\s*["']auto["'][\s\S]*?\}\}[\s\S]*?>/;

function collectTsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return collectTsxFiles(path);
    return path.endsWith('.tsx') ? [path] : [];
  });
}

test('svg elements do not use invalid auto height values', () => {
  const violations = collectTsxFiles(componentsDir).filter((path) => {
    const source = readFileSync(path, 'utf8');
    return invalidSvgHeightAttribute.test(source) || invalidSvgHeightStyle.test(source);
  });

  assert.deepEqual(violations, []);
});
