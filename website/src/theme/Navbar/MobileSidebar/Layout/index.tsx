import React, {type ReactNode, version} from 'react';
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

type PanelProps = {
  children: ReactNode;
  inert: boolean;
};

function getInertProps(inert: boolean): {inert?: '' | boolean} {
  return parseInt(version.split('.')[0], 10) < 19
    ? {inert: inert ? '' : undefined}
    : {inert};
}

function SidebarPanel({children, inert}: PanelProps): ReactNode {
  return (
    <div
      className={clsx(ThemeClassNames.layout.navbar.mobileSidebar.panel, 'navbar-sidebar__item menu')}
      {...getInertProps(inert)}
    >
      {children}
    </div>
  );
}

export default function NavbarMobileSidebarLayout({header, primaryMenu, secondaryMenu}: Props): ReactNode {
  const {shown: secondaryMenuShown} = useNavbarSecondaryMenu();

  return (
    <div className={clsx(ThemeClassNames.layout.navbar.mobileSidebar.container, 'navbar-sidebar')}>
      {header}
      <div className={styles.channelArea}>
        <ChannelSwitcher />
      </div>
      <div className={clsx('navbar-sidebar__items', {'navbar-sidebar__items--show-secondary': secondaryMenuShown})}>
        <SidebarPanel inert={secondaryMenuShown}>{primaryMenu}</SidebarPanel>
        <SidebarPanel inert={!secondaryMenuShown}>{secondaryMenu}</SidebarPanel>
      </div>
    </div>
  );
}
