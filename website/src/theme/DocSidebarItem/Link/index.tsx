import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {isActiveSidebarItem} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import type {Props} from '@theme/DocSidebarItem/Link';
import SidebarTOC from '../../DocSidebar/Desktop/SidebarTOC';

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

const TOC_EXIT_DELAY_MS = 110;

let lastTocActivePath: string | undefined;

function shouldRenderDisclosure(show: boolean, activePath: string) {
  return show && (lastTocActivePath == null || lastTocActivePath === activePath);
}

function getDisclosureDelay() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : TOC_EXIT_DELAY_MS;
}

function useDisclosureState(show: boolean, activePath: string) {
  const [render, setRender] = React.useState(() => shouldRenderDisclosure(show, activePath));
  const [closing, setClosing] = React.useState(false);

  React.useEffect(() => {
    if (show) {
      if (render) {
        lastTocActivePath = activePath;
        setClosing(false);
        return undefined;
      }
      const timeout = window.setTimeout(() => {
        lastTocActivePath = activePath;
        setClosing(false);
        setRender(true);
      }, getDisclosureDelay());
      return () => window.clearTimeout(timeout);
    }
    if (!render) return undefined;

    setClosing(true);
    const timeout = window.setTimeout(() => setRender(false), getDisclosureDelay());
    return () => window.clearTimeout(timeout);
  }, [show, render, activePath]);

  return {render, closing};
}

function TocDisclosure({show, activePath}: {show: boolean; activePath: string}) {
  const {render, closing} = useDisclosureState(show, activePath);
  if (!render) return null;

  return (
    <div className={clsx(styles.tocDisclosure, closing ? styles.tocDisclosureExit : styles.tocDisclosureEnter)}>
      <div className={styles.tocDisclosureInner}>
        <SidebarTOC />
      </div>
    </div>
  );
}

export default function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  index,
  ...props
}: Props): ReactNode {
  const {href, label, className, autoAddBaseUrl, customProps} = item;
  const sectionNumber = (customProps as {sectionNumber?: number} | undefined)?.sectionNumber;
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);
  const showInlineTOC = isActive && isInternalLink;
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
          onClick: onItemClick ? () => onItemClick(item) : undefined,
        })}
        {...props}>
        <LinkLabel label={label} sectionNumber={sectionNumber} />
        {!isInternalLink && <IconExternalLink />}
      </Link>
      <TocDisclosure show={showInlineTOC} activePath={activePath} />
    </li>
  );
}
