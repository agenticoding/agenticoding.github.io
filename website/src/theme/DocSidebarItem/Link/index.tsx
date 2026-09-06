import React, { type ReactNode, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import {
  isActiveSidebarItem,
  useDocSidebarItemsExpandedState,
} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import type { Props } from '@theme/DocSidebarItem/Link';
import type { SidebarCustomProps } from '../../../../chapters';
import SidebarTOC from '../../DocSidebar/Desktop/SidebarTOC';
import AnimatedDisclosure from '../../shared/AnimatedDisclosure';

import styles from './styles.module.css';

// Sentinel that never matches a valid category index (0..n). Triggers
// every open category's accordion guard `expandedItem !== index`. null
// would be ignored (disables accordion), so -1 is the honest collapse-all.
// Scope note: -1 collapses one expanded-state level. The standalone docs
// (Intro/About) are top-level siblings of the groups, so this reaches every
// group — but a collapsesCategories doc nested inside a category would only
// collapse that category's children.
const COLLAPSE_ALL_SENTINEL = -1 as const;

function ChapterNumber({ sectionNumber }: { sectionNumber: number }) {
  return (
    <span className={styles.chapterNumber} aria-hidden="true">
      {String(sectionNumber).padStart(2, '0')}
    </span>
  );
}

function LinkLabel({
  label,
  sectionNumber,
}: {
  label: string;
  sectionNumber?: number;
}) {
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
      onShowCommitted={handleShowCommitted}
    >
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
  const { href, label, className, autoAddBaseUrl, customProps } = item;
  const { sectionNumber, collapsesCategories } =
    (customProps as unknown as SidebarCustomProps | undefined) ?? {};
  const { setExpandedItem } = useDocSidebarItemsExpandedState();
  const collapseAllCategories = useCallback(
    () => setExpandedItem(COLLAPSE_ALL_SENTINEL),
    [setExpandedItem]
  );
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);
  const showInlineTOC = isActive && isInternalLink;
  const handleNavigate = () => {
    onItemClick?.(item);
  };

  useEffect(() => {
    if (collapsesCategories && isActive) collapseAllCategories();
  }, [collapsesCategories, isActive, collapseAllCategories]);
  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className,
        styles.chapterItem
      )}
      key={label}
    >
      <Link
        className={clsx(
          'menu__link',
          !isInternalLink && styles.menuExternalLink,
          {
            'menu__link--active': isActive,
          }
        )}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        {...(isInternalLink && {
          onClick: handleNavigate,
        })}
        {...props}
      >
        <LinkLabel label={label} sectionNumber={sectionNumber} />
        {!isInternalLink && <IconExternalLink />}
      </Link>
      <TocDisclosure
        show={showInlineTOC}
        activePath={activePath}
        onNavigate={handleNavigate}
      />
    </li>
  );
}
