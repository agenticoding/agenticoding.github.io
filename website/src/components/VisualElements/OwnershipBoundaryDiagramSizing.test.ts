import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'OwnershipBoundaryDiagram.module.css'), 'utf8');

function block(pattern: RegExp, name: string) {
  const match = css.match(pattern);
  assert.ok(match, `${name} rule exists`);
  return match[1];
}

function assertDeclaration(rule: string, declaration: string) {
  const flexibleDeclaration = declaration.replace(/ /g, '\\s*');
  assert.match(rule, new RegExp(`(^|\\n)\\s*${flexibleDeclaration}\\s*;`));
}

test('ownership boundary diagram keeps SVGs capped to their authored viewBox widths', () => {
  const sharedRule = block(/\.desktopDiagram,\n\.mobileDiagram \{([^}]+)\}/, 'shared SVG sizing');
  const desktopRule = block(/\n\n\.desktopDiagram \{([^}]+)\}/, 'desktop SVG sizing');
  const mobileRule = block(/\n\n\.mobileDiagram \{([^}]+)\}/, 'mobile SVG sizing');

  assertDeclaration(sharedRule, 'width: 100%');
  assertDeclaration(sharedRule, 'height: auto');
  assertDeclaration(sharedRule, 'margin-inline: auto');
  assertDeclaration(desktopRule, 'max-width: 720px');
  assertDeclaration(mobileRule, 'max-width: 360px');
});
