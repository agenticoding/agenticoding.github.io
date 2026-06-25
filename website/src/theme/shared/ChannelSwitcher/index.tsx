import {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import clsx from 'clsx';
import {channels, getActiveIndex} from '../../DocSidebar/Desktop/channels';
import styles from './styles.module.css';

export default function ChannelSwitcher(): ReactNode {
  const location = useLocation();
  const activeIndex = getActiveIndex(location.pathname);

  return (
    <div
      className={styles.channelSwitcher}
      style={{'--active-index': activeIndex, '--channel-count': channels.length} as React.CSSProperties}
    >
      {channels.map(({label, path, match}) => (
        <Link
          key={match}
          to={path}
          className={clsx(styles.channelTab, location.pathname.startsWith(match) && styles.channelTabActive)}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
