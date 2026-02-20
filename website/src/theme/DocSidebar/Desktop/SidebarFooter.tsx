import {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useLocation, useHistory} from '@docusaurus/router';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import clsx from 'clsx';
import styles from './styles.module.css';

// Module-level: persists across renders, resets to '/' on full page load
let prevNonFaqPath = '/';
let prevNonAboutPath = '/';

export default function SidebarFooter(): ReactNode {
  const {pathname} = useLocation();
  const history = useHistory();
  const isFaqActive = pathname === '/faq';
  const isAboutActive = pathname === '/about';

  // Track the last non-FAQ path for the exit destination
  if (!isFaqActive) {
    prevNonFaqPath = pathname;
  }
  // Track the last non-About path for the exit destination
  if (!isAboutActive) {
    prevNonAboutPath = pathname;
  }

  function handleFaqClick(e: React.MouseEvent) {
    if (isFaqActive) {
      e.preventDefault();
      history.push(prevNonFaqPath);
    }
  }

  function handleAboutClick(e: React.MouseEvent) {
    if (isAboutActive) {
      e.preventDefault();
      history.push(prevNonAboutPath);
    }
  }

  return (
    <div className={styles.sidebarFooter}>
      <div className={styles.footerLinks}>
        <Link
          to="/faq"
          className={clsx(styles.footerLink, isFaqActive && styles.footerLinkActive)}
          onClick={handleFaqClick}
        >
          FAQ
        </Link>
        <a
          href="https://github.com/agenticoding/agenticoding.github.io"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          GitHub ↗
        </a>
      </div>
      <div className={styles.footerIconGroup}>
        <Link
          to="/about"
          className={clsx(styles.footerIconLink, isAboutActive && styles.footerIconLinkActive)}
          onClick={handleAboutClick}
          aria-label="About"
          title="About"
        >
          <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </Link>
        <NavbarColorModeToggle />
      </div>
    </div>
  );
}
