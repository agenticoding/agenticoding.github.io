import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {isActiveSidebarItem} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import type {Props} from '@theme/DocSidebarItem/Link';
import SidebarTOC from '../../DocSidebar/Desktop/SidebarTOC';
import AnimatedDisclosure from '../../shared/AnimatedDisclosure';

import styles from './styles.module.css';

function ChapterNumber({sectionNumber}: {sectionNumber: number}) {
  return (
    <span className={styles.chapterNumber} aria-hidden="true">
      {String(sectionNumber).padStart(2, '0')}
    </span>
  );
}

function LinkLabel({label, sectionNumber}: {label: string; sectionNumber?: number}) {
  return (
    <>
      {sectionNumber != null && <ChapterNumber sectionNumber={sectionNumber} />}
      <span title={label} className={styles.linkLabel}>
        {label}
      </span>
    </>
  );
}

let lastTocActivePath: string | undefined;

function canRenderTocDisclosure(activePath: string) {
  return lastTocActivePath == null || lastTocActivePath === activePath;
}

function TocDisclosure({
  show,
  activePath,
  onNavigate,
}: {
  show: boolean;
  activePath: string;
  onNavigate?: () => void;
}) {
  const handleShowCommitted = React.useCallback(() => {
    lastTocActivePath = activePath;
  }, [activePath]);

  return (
    <AnimatedDisclosure
      show={show}
      initialRenderAllowed={canRenderTocDisclosure(activePath)}
      onShowCommitted={handleShowCommitted}>
      <SidebarTOC onNavigate={onNavigate} />
    </AnimatedDisclosure>
  );
}

export default function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  index: _index,
  ...props
}: Props): ReactNode {
  const {href, label, className, autoAddBaseUrl, customProps} = item;
  const sectionNumber = (customProps as {sectionNumber?: number} | undefined)?.sectionNumber;
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);
  const showInlineTOC = isActive && isInternalLink;
  const handleNavigate = onItemClick ? () => onItemClick(item) : undefined;
  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className,
        styles.chapterItem,
      )}
      key={label}>
      <Link
        className={clsx(
          'menu__link',
          !isInternalLink && styles.menuExternalLink,
          {
            'menu__link--active': isActive,
          },
        )}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        {...(isInternalLink && {
          onClick: handleNavigate,
        })}
        {...props}>
        <LinkLabel label={label} sectionNumber={sectionNumber} />
        {!isInternalLink && <IconExternalLink />}
      </Link>
      <TocDisclosure show={showInlineTOC} activePath={activePath} onNavigate={handleNavigate} />
    </li>
  );
}
