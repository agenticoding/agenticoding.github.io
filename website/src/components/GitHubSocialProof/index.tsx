import { Fragment, useEffect, useState, type ReactNode } from 'react';

import starsSnapshot from '@site/src/generated/github-stars.json';

import { formatStars } from './formatStars';
import styles from './index.module.css';

interface StarProject {
  name: string;
  repo: string;
  stars: number;
}

const starCountRequests = new Map<string, Promise<number | null>>();

function fetchStarCount(repo: string): Promise<number | null> {
  const cachedRequest = starCountRequests.get(repo);
  if (cachedRequest) return cachedRequest;

  const request = fetch(`https://api.github.com/repos/${repo}`)
    .then(async (response) => {
      if (!response.ok) return null;
      const repository = (await response.json()) as {
        stargazers_count: number;
      };
      return Number.isSafeInteger(repository.stargazers_count)
        ? repository.stargazers_count
        : null;
    })
    .catch(() => null);
  starCountRequests.set(repo, request);
  return request;
}

// The generated snapshot is the build-time baseline: the count is correct in
// the static HTML (no JavaScript, no network) and the live fetch below can only
// make it fresher. A slug absent from the snapshot means intro.mdx references a
// repo the fetcher doesn't know — fail loudly rather than render nothing.
function requireProject(repo: string): StarProject {
  const project = starsSnapshot.projects.find((entry) => entry.repo === repo);
  if (!project) {
    throw new Error(
      `No star snapshot for "${repo}"; run npm run stars:refresh`
    );
  }
  return project;
}

// Seeded with the build-time value so SSR is accurate; the live fetch only
// overwrites it when it returns a valid count. The polite live region stays
// because the number can still change after hydration.
function useGitHubStars(repo: string, baselineStars: number): number {
  const [stars, setStars] = useState(baselineStars);

  useEffect(() => {
    let active = true;
    fetchStarCount(repo).then((count) => {
      if (active && count !== null) setStars(count);
    });
    return () => {
      active = false;
    };
  }, [repo]);

  return stars;
}

function StarIcon(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  );
}

function StarCount({ stars }: { stars: number }): ReactNode {
  return (
    <span className={styles.starCount} aria-live="polite">
      <span className={styles.count}>{formatStars(stars)}</span>
      <span className={styles.label}>stars</span>
    </span>
  );
}

// Break opportunities after each `/` so long repo paths wrap at segment
// boundaries on narrow screens instead of overflowing their list item.
function RepoPath({ repo }: { repo: string }): ReactNode {
  const segments = `github.com/${repo}`.split('/');
  return segments.map((segment, index) => (
    <Fragment key={segment}>
      {segment}
      {index < segments.length - 1 ? (
        <>
          /<wbr />
        </>
      ) : null}
    </Fragment>
  ));
}

/**
 * One open-source project in the trust band: name, linked repo path, and its
 * star count. Projects are always listed together — the grouped count is what
 * makes each number readable as "a real project", never a lone badge. Data
 * comes from the build-time snapshot keyed by `repo`; the live fetch refreshes
 * it after hydration.
 */
export function GitHubProjectSource({ repo }: { repo: string }): ReactNode {
  const { name, stars: baselineStars } = requireProject(repo);
  const stars = useGitHubStars(repo, baselineStars);

  return (
    <span className={styles.projectSource}>
      <strong className={styles.projectSourceName}>{name}</strong>{' '}
      <span className={styles.projectSourceDetails}>
        <a
          className={styles.projectSourceLink}
          href={`https://github.com/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <RepoPath repo={repo} />
        </a>{' '}
        <span className={styles.projectSourceStars}>
          <span className={styles.project}>
            <StarIcon />
            <StarCount stars={stars} />
          </span>
        </span>
      </span>
    </span>
  );
}
