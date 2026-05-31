import {type ReactNode} from 'react';
import Mobile from '@theme-original/DocSidebar/Mobile';
import type MobileType from '@theme/DocSidebar/Mobile';
import type {WrapperProps} from '@docusaurus/types';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import SearchBar from '@theme/SearchBar';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import clsx from 'clsx';
import styles from '../Desktop/styles.module.css';
import {channels, getActiveIndex} from '../Desktop/channels';

type Props = WrapperProps<typeof MobileType>;

export default function MobileWrapper(props: Props): ReactNode {
  const location = useLocation();
  const activeIndex = getActiveIndex(location.pathname);

  return (
    <>
      <div className={styles.mobileChannelArea}>
        <div
          className={styles.channelSwitcher}
          style={{'--active-index': activeIndex, '--channel-count': channels.length} as React.CSSProperties}
        >
          {channels.map(({label, path, match}) => (
            <Link
              key={match}
              to={path}
              className={clsx(
                styles.channelTab,
                location.pathname.startsWith(match) && styles.channelTabActive,
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className={styles.searchArea}>
        <SearchBar />
      </div>
      <Mobile {...props} />
      <div className={styles.mobileFooterLinks}>
        <NavbarColorModeToggle />
        <a
          href="https://github.com/agenticoding/agenticoding.github.io"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
          aria-label="GitHub repository"
        >
          <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={12} r={10} />
            <g transform="translate(1.25 1)">
              <path d="M14.5 17c0-1 .5-4-1.5-4 2.5 0 4-1.5 4-3.5 0-1-.5-2-1-2.5.5-1.5 0-2.5 0-2.5s-1 0-2.5 1c-1.5-.5-4-.5-5.5 0C6.5 4 5.5 4 5.5 4s-.5 1 0 2.5c-.5.5-1 1.5-1 2.5 0 2 1.5 3.5 4 3.5-1 0-1.5 1-1.5 2v3" />
              <path d="M9 18c-1.5.5-3 0-4-1" />
            </g>
          </svg>
        </a>
      </div>
    </>
  );
}
