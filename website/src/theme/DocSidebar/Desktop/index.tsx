import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import Desktop from '@theme-original/DocSidebar/Desktop';
import type DesktopType from '@theme/DocSidebar/Desktop';
import type { WrapperProps } from '@docusaurus/types';
import { useLocation } from '@docusaurus/router';
import SidebarHeader from './SidebarHeader';
import SidebarFooter from './SidebarFooter';
import { SidebarScrollProvider } from './SidebarScrollContext';
import styles from './styles.module.css';

type Props = WrapperProps<typeof DesktopType>;

const CHAPTER_SCROLL_DELAY_MS = 250;
const ACTIVE_CHAPTER_SELECTOR = '.menu__link--active[aria-current="page"]';
// Selector for the scrollable sidebar nav — keep in sync with
// scripts/test-responsive-diagrams.cjs SIDEBAR_NAV and the theme DOM
// (nav[aria-label="Docs sidebar"] > .sidebarScrollable > nav.menu).
const SIDEBAR_NAV_SELECTOR = 'nav.menu';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Scroller is .sidebarScrollable's child nav.menu; see
// website/src/theme/DocSidebar/Desktop/styles.module.css (.sidebarScrollable)
// and scripts/test-responsive-diagrams.cjs (SIDEBAR_NAV).
function getSidebarScroller(container: HTMLDivElement): HTMLElement {
  return (
    container.querySelector<HTMLElement>(SIDEBAR_NAV_SELECTOR) ?? container
  );
}

function getLinkPath(link: HTMLAnchorElement): string {
  try {
    return new URL(link.href).pathname;
  } catch {
    return link.getAttribute('href')?.split('#')[0] ?? '';
  }
}

function getActiveChapterLink(
  scroller: HTMLElement,
  pathname: string
): HTMLElement | undefined {
  const activeLink = scroller.querySelector<HTMLAnchorElement>(
    ACTIVE_CHAPTER_SELECTOR
  );
  if (activeLink && getLinkPath(activeLink) === pathname) return activeLink;

  return Array.from(
    scroller.querySelectorAll<HTMLAnchorElement>('a.menu__link')
  ).find((link) => getLinkPath(link) === pathname);
}

function scrollActiveChapterToTop(
  container: HTMLDivElement,
  pathname: string
): void {
  const scroller = getSidebarScroller(container);
  const activeLink = getActiveChapterLink(scroller, pathname);
  if (!activeLink) return;

  // Keep the selected chapter readable before its inline TOC expands below it.
  const top =
    scroller.scrollTop +
    activeLink.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top;
  scroller.scrollTo({
    top,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

export default function DesktopWrapper(props: Props): ReactNode {
  const { pathname } = useLocation();
  const scrollableRef = useRef<HTMLDivElement>(null);
  const scrollActiveChapter = useCallback(() => {
    if (scrollableRef.current)
      scrollActiveChapterToTop(scrollableRef.current, pathname);
  }, [pathname]);

  useEffect(() => {
    const timeout = window.setTimeout(
      scrollActiveChapter,
      CHAPTER_SCROLL_DELAY_MS
    );
    return () => window.clearTimeout(timeout);
  }, [scrollActiveChapter]);

  return (
    <div className={styles.sidebarContainer}>
      <SidebarHeader />
      <SidebarScrollProvider value={scrollActiveChapter}>
        <div ref={scrollableRef} className={styles.sidebarScrollable}>
          <Desktop {...props} />
        </div>
      </SidebarScrollProvider>
      <SidebarFooter />
    </div>
  );
}
