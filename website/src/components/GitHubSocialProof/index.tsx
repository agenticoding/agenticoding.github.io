import { useEffect, useState, type ReactNode } from 'react';

import styles from './index.module.css';

type GitHubSocialProofVariant = 'hero' | 'project';

interface GitHubSocialProofProps {
  repo: string;
  fallbackStars: number;
  variant: GitHubSocialProofVariant;
}

interface GitHubRepository {
  stargazers_count: number;
}

interface GitHubProjectSourceProps {
  name: string;
  repo: string;
  fallbackStars: number;
}

const starCountRequests = new Map<string, Promise<number | null>>();

function fetchStarCount(repo: string): Promise<number | null> {
  const cachedRequest = starCountRequests.get(repo);
  if (cachedRequest) return cachedRequest;

  const request = fetch(`https://api.github.com/repos/${repo}`)
    .then(async (response) => {
      if (!response.ok) return null;
      const repository = (await response.json()) as GitHubRepository;
      return Number.isSafeInteger(repository.stargazers_count)
        ? repository.stargazers_count
        : null;
    })
    .catch(() => null);
  starCountRequests.set(repo, request);
  return request;
}

function useGitHubStars(repo: string, fallbackStars: number): number {
  const [stars, setStars] = useState(fallbackStars);

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

function formatStars(stars: number): string {
  if (stars < 1_000) return String(stars);
  return `${(stars / 1_000).toFixed(stars < 10_000 ? 1 : 0).replace('.0', '')}k`;
}

function StarIcon(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  );
}

function StarCount({
  stars,
  label = 'stars',
}: {
  stars: number;
  label?: string;
}): ReactNode {
  return (
    <span className={styles.starCount} aria-live="polite">
      <span className={styles.count}>{formatStars(stars)}</span>
      <span className={styles.label}>{label}</span>
    </span>
  );
}

export function GitHubProjectSource({
  name,
  repo,
  fallbackStars,
}: GitHubProjectSourceProps): ReactNode {
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
          github.com/{repo}
        </a>{' '}
        <span className={styles.projectSourceStars}>
          <GitHubSocialProof
            repo={repo}
            fallbackStars={fallbackStars}
            variant="project"
          />
        </span>
      </span>
    </span>
  );
}

export default function GitHubSocialProof({
  repo,
  fallbackStars,
  variant,
}: GitHubSocialProofProps): ReactNode {
  const stars = useGitHubStars(repo, fallbackStars);
  const starCount = <StarCount stars={stars} />;

  if (variant === 'project') {
    return (
      <span className={styles.project}>
        <StarIcon />
        {starCount}
      </span>
    );
  }

  return (
    <a
      className={styles.hero}
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`GitHub repository: ${formatStars(stars)} stars`}
    >
      <StarIcon />
      <StarCount stars={stars} label="GitHub stars" />
    </a>
  );
}
