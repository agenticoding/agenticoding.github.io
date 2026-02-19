import {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';
import clsx from 'clsx';
import SidebarSearch from './SidebarSearch';
import {channels, getActiveIndex} from './channels';

export default function SidebarHeader(): ReactNode {
  const location = useLocation();
  const logoUrl = useBaseUrl('/img/logo.svg');
  const activeIndex = getActiveIndex(location.pathname);

  return (
    <div className={styles.sidebarHeader}>
      <div className={styles.brandRow}>
        <Link to="/" className={styles.brandLink}>
          <img src={logoUrl} alt="Agentic Coding Logo" className={styles.brandLogo} />
          <span className={styles.brandTitle}>Agentic Coding</span>
        </Link>
        <SidebarSearch />
      </div>
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
  );
}
