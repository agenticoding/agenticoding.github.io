import {type ReactNode} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useNavbarSecondaryMenu} from '@docusaurus/theme-common/internal';
import ChannelSwitcher from '../../../shared/ChannelSwitcher';
import styles from '../styles.module.css';

type Props = {
  header: ReactNode;
  primaryMenu: ReactNode;
  secondaryMenu: ReactNode;
};

export default function NavbarMobileSidebarLayout({header, primaryMenu}: Props): ReactNode {
  const {content} = useNavbarSecondaryMenu();

  return (
    <div className={clsx(ThemeClassNames.layout.navbar.mobileSidebar.container, 'navbar-sidebar')}>
      {header}
      <div className={styles.channelArea}>
        <ChannelSwitcher />
      </div>
      <div className={clsx(ThemeClassNames.layout.navbar.mobileSidebar.panel, 'navbar-sidebar__item menu')}>
        {content ?? primaryMenu}
      </div>
    </div>
  );
}
