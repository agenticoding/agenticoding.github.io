// Guards the build-time star snapshot contract: the committed snapshot the site
// renders must stay valid, and the homepage's rendered project list must not
// diverge from the list the fetcher refreshes (scripts/github-stars.js).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { PROJECTS } from '../../../../scripts/github-stars.js';

// Read rather than import: the site bundles the snapshot via webpack, but Node's
// ESM loader requires a JSON import attribute, so the test parses it directly.
const snapshot = JSON.parse(
  readFileSync(
    new URL('../../generated/github-stars.json', import.meta.url),
    'utf8'
  )
);

const introMdx = readFileSync(
  new URL('../../../docs/intro.mdx', import.meta.url),
  'utf8'
);

const renderedRepos = [...introMdx.matchAll(/repo="([^"]+)"/g)]
  .map((match) => match[1])
  .sort();
const snapshotRepos = snapshot.projects.map((project) => project.repo).sort();

test('committed star snapshot holds a valid count and timestamp per project', () => {
  assert.ok(snapshot.projects.length > 0, 'snapshot has no projects');
  for (const { name, repo, stars, fetchedAt } of snapshot.projects) {
    assert.ok(name, `snapshot entry ${repo} is missing a display name`);
    assert.ok(repo, 'snapshot entry is missing a repo slug');
    assert.ok(
      Number.isSafeInteger(stars) && stars >= 0,
      `${repo} has an invalid star count: ${stars}`
    );
    assert.ok(
      !Number.isNaN(Date.parse(fetchedAt)),
      `${repo} has an invalid fetchedAt: ${fetchedAt}`
    );
  }
});

test('snapshot contains exactly the repos the fetcher refreshes', () => {
  assert.deepEqual(snapshotRepos, PROJECTS.map((p) => p.repo).sort());
});

test('homepage renders exactly the snapshot projects', () => {
  assert.deepEqual(renderedRepos, snapshotRepos);
});
