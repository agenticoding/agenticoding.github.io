import {type ReactNode} from 'react';
import Desktop from '@theme-original/DocSidebar/Desktop';
import type DesktopType from '@theme/DocSidebar/Desktop';
import type {WrapperProps} from '@docusaurus/types';
import {useLocation} from '@docusaurus/router';
import SidebarHeader from './SidebarHeader';
import SidebarFooter from './SidebarFooter';
import {getActiveIndex} from './channels';
import styles from './styles.module.css';

type Props = WrapperProps<typeof DesktopType>;

export default function DesktopWrapper(props: Props): ReactNode {
  const activeIndex = getActiveIndex(useLocation().pathname);

  return (
    <div className={styles.sidebarContainer}>
      <SidebarHeader />
      <div key={activeIndex} className={styles.sidebarScrollable}>
        <Desktop {...props} />
      </div>
      <SidebarFooter />
    </div>
  );
}
