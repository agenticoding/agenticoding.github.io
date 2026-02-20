import {type ReactNode} from 'react';
import Mobile from '@theme-original/DocSidebar/Mobile';
import type MobileType from '@theme/DocSidebar/Mobile';
import type {WrapperProps} from '@docusaurus/types';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import SearchBar from '@theme/SearchBar';
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
        <Link to="/faq" className={styles.footerLink}>
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
    </>
  );
}
