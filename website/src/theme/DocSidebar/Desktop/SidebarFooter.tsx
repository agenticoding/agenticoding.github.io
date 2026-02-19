import {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import styles from './styles.module.css';

export default function SidebarFooter(): ReactNode {
  return (
    <div className={styles.sidebarFooter}>
      <div className={styles.footerLinks}>
        <Link to="/docs/faq" className={styles.footerLink}>
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
