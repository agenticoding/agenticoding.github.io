#!/usr/bin/env node
// Refreshes the committed star snapshot the site renders as its build-time
// baseline (see github-stars.js). Properties a deploy depends on:
//   - merge is PER REPO: a repo that fails keeps its previous value, so a
//     rate-limited or offline runner still ships usable numbers;
//   - the process always exits 0 and only warns on failure, so GitHub being
//     unreachable can never fail a build;
//   - an unchanged snapshot is not rewritten, so a no-op refresh leaves the
//     working tree clean.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROJECTS, parseStars } from './github-stars.js';

const SNAPSHOT_PATH = fileURLToPath(
  new URL('../website/src/generated/github-stars.json', import.meta.url)
);

async function readSnapshot() {
  try {
    return JSON.parse(await readFile(SNAPSHOT_PATH, 'utf8'));
  } catch {
    return { projects: [] };
  }
}

async function fetchStars(repo) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { repo, stars: null, reason: `HTTP ${response.status}` };
    const stars = parseStars(await response.json());
    return stars === null
      ? { repo, stars: null, reason: 'unexpected payload' }
      : { repo, stars };
  } catch (error) {
    return { repo, stars: null, reason: error.message };
  }
}

// Per-repo merge: a failed repo keeps its previous entry — including its own
// fetchedAt — so a timestamp always describes the number it sits next to. An
// unchanged count is also left as-is, so a no-op refresh dirties nothing.
function mergeProjects(previous, results) {
  const previousByRepo = new Map(previous.map((project) => [project.repo, project]));
  return results.flatMap(({ repo, stars }) => {
    const prior = previousByRepo.get(repo);
    if (stars === null) return prior ? [prior] : [];
    if (prior && prior.stars === stars) return [prior];
    const { name } = PROJECTS.find((project) => project.repo === repo);
    return [{ name, repo, stars, fetchedAt: new Date().toISOString() }];
  });
}

// Two-space JSON with a trailing newline is exactly prettier's output, so the
// generated file passes `format:check` without an ignore entry.
function serialize(projects) {
  return `${JSON.stringify({ projects }, null, 2)}\n`;
}

async function main() {
  const { projects: previous = [] } = await readSnapshot();
  const results = await Promise.all(PROJECTS.map(({ repo }) => fetchStars(repo)));
  for (const { repo, reason } of results.filter(({ stars }) => stars === null)) {
    console.warn(`[stars] ${repo}: ${reason} — keeping last known value`);
  }

  const next = serialize(mergeProjects(previous, results));
  if (next === serialize(previous)) {
    console.log('[stars] snapshot unchanged');
    return;
  }
  await mkdir(dirname(SNAPSHOT_PATH), { recursive: true });
  await writeFile(SNAPSHOT_PATH, next, 'utf8');
  console.log(`[stars] wrote ${SNAPSHOT_PATH}`);
}

main().catch((error) => {
  console.warn(`[stars] refresh failed: ${error.message} — keeping committed snapshot`);
});
