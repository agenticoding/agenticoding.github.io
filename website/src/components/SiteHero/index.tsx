import { type ReactNode, useEffect, useState } from 'react';
import Heading from '@theme/Heading';
import styles from './index.module.css';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatStarCount(count: number): string {
  if (count < 1000) return count.toString();
  const formatted = (count / 1000).toFixed(1);
  return formatted.replace(/\.0$/, '') + 'k';
}

function useGitHubStars(repo: string): number | null {
  const [stars, setStars] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(`gh-stars-${repo}`);
    if (cached) {
      const { stars, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 3600000) return stars;
    }
    return null;
  });

  useEffect(() => {
    if (stars !== null) return;
    fetch(`https://api.github.com/repos/${repo}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
          localStorage.setItem(
            `gh-stars-${repo}`,
            JSON.stringify({
              stars: data.stargazers_count,
              timestamp: Date.now(),
            })
          );
        }
      })
      .catch(() => {});
  }, [repo, stars]);

  return stars;
}

// ---------------------------------------------------------------------------
// Icons — curved geometry style (fill: none, stroke: currentColor, round caps)
// ---------------------------------------------------------------------------

function GitHubIcon() {
  return (
    <svg
      className={styles.githubIcon}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

// Star uses fill (rating convention); color comes from --visual-warning via CSS
function StarIcon() {
  return (
    <svg
      className={styles.starIcon}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const testimonials = [
  '"I just finished studying this. Very useful and well organized"',
  '"No CTO/startup-dev/tech-advisor chat has taken place in the past month without mentioning it"',
  '"Thank you for not making another video course series"',
  '"I was looking for something like a course or some sort of guidelines"',
  '"Great work, this is amazing"',
];

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export default function SiteHero(): ReactNode {
  const courseStars = useGitHubStars('agenticoding/agenticoding.github.io');
  const chunkHoundStars = useGitHubStars('chunkhound/chunkhound');

  // Hydration-safe random pair: [0,1] on SSR, random distinct pair after mount
  const [pair, setPair] = useState<[number, number]>([0, 1]);
  useEffect(() => {
    const first = Math.floor(Math.random() * testimonials.length);
    let second = Math.floor(Math.random() * (testimonials.length - 1));
    if (second >= first) second++;
    setPair([first, second]);
  }, []);

  return (
    <div className={styles.heroInner}>
      <div className={styles.heroContent}>
        <Heading as="h1" className={styles.heroTitle}>
          Master Agentic Coding
        </Heading>
        <p className={styles.heroSubtitle}>
          A technical reference for engineers operating AI coding agents in
          production.
        </p>

        <p className={styles.heroMeta}>
          <GitHubIcon />
          <a
            href="https://github.com/agenticoding/agenticoding.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.heroMetaLink}
          >
            Open Source
          </a>
          <span className={styles.metaSep}>&middot;</span>
          <span>MIT</span>
          {courseStars !== null && (
            <>
              <span className={styles.metaSep}>&middot;</span>
              <StarIcon />
              <span>{formatStarCount(courseStars)}</span>
            </>
          )}
          {chunkHoundStars !== null && (
            <>
              <span className={styles.metaSep}>&middot;</span>
              <a
                href="https://github.com/chunkhound/chunkhound"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.heroMetaLink}
              >
                ChunkHound
              </a>
              <StarIcon />
              <span>{formatStarCount(chunkHoundStars)}</span>
            </>
          )}
        </p>
      </div>

      <aside className={styles.heroAside} aria-label="Reader testimonials">
        {pair.map((idx, i) => (
          <blockquote key={i} className={styles.testimonial}>
            <p className={styles.testimonialText}>{testimonials[idx]}</p>
            <footer className={styles.testimonialSource}>&mdash; Reddit</footer>
          </blockquote>
        ))}
      </aside>
    </div>
  );
}
