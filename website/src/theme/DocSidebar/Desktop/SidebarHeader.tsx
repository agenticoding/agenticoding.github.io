import {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import ChannelSwitcher from '../../shared/ChannelSwitcher';
import styles from './styles.module.css';
import SidebarSearch from './SidebarSearch';

export default function SidebarHeader(): ReactNode {
  return (
    <div className={styles.sidebarHeader}>
      <div className={styles.brandRow}>
        <Link to="/" className={styles.brandLink}>
          <span className={styles.brandTitle}>Agentic Coding</span>
        </Link>
        <SidebarSearch />
      </div>
      <div className={styles.channelArea}>
        <ChannelSwitcher />
      </div>
    </div>
  );
}
