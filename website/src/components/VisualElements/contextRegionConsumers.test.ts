import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import audit from '../../../../scripts/audit-context-region-consumers.cjs';

// Exercises the audit's pure checks directly: a consumer override is decided by
// specificity and value, never by bundle order, so the allow/deny contract can
// be pinned without touching the real stylesheets.
const {
  FOUNDATION_FILE,
  collectRules,
  foundationCss,
  overrideFailures,
  propertiesOf,
  seamFailures,
} = audit;

const owned = (css: string, foundationClass: string) =>
  propertiesOf(collectRules(css), foundationClass);

const foundation = `.scene { position: relative; }`;

test('a higher-specificity override is allowed', () => {
  const consumer = collectRules(`.frame .mine { position: absolute; }`);
  assert.deepEqual(
    overrideFailures(
      'Demo',
      'className',
      'mine',
      consumer,
      owned(foundation, 'scene')
    ),
    []
  );
});

test('an identical value at equal specificity is allowed', () => {
  const consumer = collectRules(`.mine { position: relative; }`);
  assert.deepEqual(
    overrideFailures(
      'Demo',
      'className',
      'mine',
      consumer,
      owned(foundation, 'scene')
    ),
    []
  );
});

test('a conflicting value at equal specificity is forbidden', () => {
  const consumer = collectRules(`.mine { position: absolute; }`);
  const failures = overrideFailures(
    'Demo',
    'className',
    'mine',
    consumer,
    owned(foundation, 'scene')
  );
  assert.equal(failures.length, 1);
  assert.match(failures[0], /Demo.*position/);
});

test('the stack seam requires an inset', () => {
  const bare = collectRules(`.mine { --context-stack-position: absolute; }`);
  assert.equal(seamFailures('Demo', 'mine', bare).length, 1);
  const placed = collectRules(
    `.mine { --context-stack-position: absolute; inset: 0; }`
  );
  assert.deepEqual(seamFailures('Demo', 'mine', placed), []);
});

// The audit reads the foundation by name, and a wrong-case name still resolves
// on macOS but not on the case-sensitive CI disk. Pin the exact on-disk case.
test('the foundation filename matches its on-disk case', () => {
  const entries = readdirSync(new URL('.', import.meta.url));
  assert.ok(
    entries.includes(FOUNDATION_FILE),
    `${FOUNDATION_FILE} is not the exact on-disk filename`
  );
});

test('the real fanout consumer clears the audit over the real stylesheets', () => {
  // The same pure checks as above, but over the actual files on disk: the
  // foundation plus the SubAgentFanoutDiagram consumer with the exact role
  // classes its <ContextRegionScene> usage hands over (className,
  // stackClassName, companionClassName). Zero failures, or the audit CLI
  // would fail the same way.
  const foundation = collectRules(foundationCss);
  const consumer = collectRules(
    readFileSync(
      new URL('./SubAgentFanoutDiagram.module.css', import.meta.url),
      'utf8'
    )
  );
  const roles: Array<[string, string, string]> = [
    ['className', 'scene', 'stackClip'],
    ['stackClassName', 'regionStack', 'rootStack'],
    ['companionClassName', 'sceneCompanion', 'fanoutOverlay'],
  ];
  for (const [role, foundationClass, className] of roles) {
    // Non-vacuous: the consumer stylesheet must actually declare the class.
    assert.ok(
      consumer.some((rule) =>
        rule.selectors.some((selector) =>
          new RegExp(`\\.${className}(?![\\w-])`).test(selector)
        )
      ),
      `consumer never declares .${className}`
    );
    assert.deepEqual(
      overrideFailures(
        'SubAgentFanoutDiagram',
        role,
        className,
        consumer,
        propertiesOf(foundation, foundationClass)
      ),
      []
    );
  }
  assert.deepEqual(
    seamFailures('SubAgentFanoutDiagram', 'rootStack', consumer),
    []
  );
});
