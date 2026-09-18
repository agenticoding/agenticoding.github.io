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

const INTRO_MDX_PATH = fileURLToPath(
  new URL('../website/docs/intro.mdx', import.meta.url)
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

// Per-repo merge. Two independent concerns:
//   - stars/fetchedAt are fetched data: a failed fetch keeps the prior pair, so
//     a timestamp always describes the number it sits next to;
//   - name is not fetched — it comes from PROJECTS — so a rename applies even
//     when the network is down.
// A fully unchanged entry is returned as-is, so a no-op refresh dirties nothing.
function mergeProjects(previous, results) {
  const previousByRepo = new Map(previous.map((project) => [project.repo, project]));
  return results.flatMap(({ repo, stars }) => {
    const prior = previousByRepo.get(repo);
    const { name } = PROJECTS.find((project) => project.repo === repo);
    if (stars === null) return prior ? [{ ...prior, name }] : [];
    if (prior && prior.stars === stars && prior.name === name) return [prior];
    const fetchedAt =
      prior && prior.stars === stars ? prior.fetchedAt : new Date().toISOString();
    return [{ name, repo, stars, fetchedAt }];
  });
}

// Two-space JSON with a trailing newline is exactly prettier's output, so the
// generated file passes `format:check` without an ignore entry.
function serialize(projects) {
  return `${JSON.stringify({ projects }, null, 2)}\n`;
}

// PROJECTS is the fetcher's source of truth, but the homepage renders its own
// list from intro.mdx. A slug the page references but the snapshot lacks throws
// at render time, so name it here instead of reporting a misleading "unchanged".
async function warnMissingIntroRepos(projects) {
  const known = new Set(projects.map((project) => project.repo));
  for (const [, repo] of (await readFile(INTRO_MDX_PATH, 'utf8')).matchAll(
    /repo="([^"]+)"/g
  )) {
    if (!known.has(repo))
      console.warn(
        `[stars] ${repo}: referenced in intro.mdx but absent from PROJECTS (scripts/github-stars.js)`
      );
  }
}

async function main() {
  const { projects: previous = [] } = await readSnapshot();
  const results = await Promise.all(PROJECTS.map(({ repo }) => fetchStars(repo)));
  for (const { repo, reason } of results.filter(({ stars }) => stars === null)) {
    console.warn(`[stars] ${repo}: ${reason} — keeping last known value`);
  }

  const merged = mergeProjects(previous, results);
  await warnMissingIntroRepos(merged);

  const next = serialize(merged);
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
