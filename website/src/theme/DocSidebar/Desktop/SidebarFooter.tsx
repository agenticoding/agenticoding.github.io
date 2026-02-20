import {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useLocation, useHistory} from '@docusaurus/router';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import clsx from 'clsx';
import styles from './styles.module.css';

// Module-level: persists across renders, resets to '/' on full page load
let prevNonFaqPath = '/';

export default function SidebarFooter(): ReactNode {
  const {pathname} = useLocation();
  const history = useHistory();
  const isFaqActive = pathname === '/faq';

  // Track the last non-FAQ path for the exit destination
  if (!isFaqActive) {
    prevNonFaqPath = pathname;
  }

  function handleFaqClick(e: React.MouseEvent) {
    if (isFaqActive) {
      e.preventDefault();
      history.push(prevNonFaqPath);
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
      <NavbarColorModeToggle />
    </div>
  );
}
