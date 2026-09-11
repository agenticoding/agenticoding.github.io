// Canonical inputs for the build-time star snapshot: the open-source projects
// shown in the homepage trust band. This list is the single source of truth for
// repo slugs and display names — scripts/fetch-github-stars.js writes it into
// website/src/generated/github-stars.json, which the site imports. Adding a
// project means adding it here and to website/docs/intro.mdx;
// GitHubSocialProof/stars.test.ts fails if those two lists diverge.

export const PROJECTS = [
  { name: 'Book source', repo: 'agenticoding/agenticoding.github.io' },
  { name: 'ChunkHound', repo: 'chunkhound/chunkhound' },
  { name: 'Pi agenticoding extension', repo: 'agenticoding/pi-agenticoding' },
];

// A star count is trustworthy only as a non-negative safe integer; the /repos
// payload carries unrelated fields that must not be smuggled into the snapshot.
export function parseStars(payload) {
  const stars = payload?.stargazers_count;
  return Number.isSafeInteger(stars) && stars >= 0 ? stars : null;
}
