import {type ReactNode, useEffect, useRef} from 'react';
import Desktop from '@theme-original/DocSidebar/Desktop';
import type DesktopType from '@theme/DocSidebar/Desktop';
import type {WrapperProps} from '@docusaurus/types';
import {useLocation} from '@docusaurus/router';
import SidebarHeader from './SidebarHeader';
import SidebarFooter from './SidebarFooter';
import {getActiveIndex} from './channels';
import styles from './styles.module.css';

type Props = WrapperProps<typeof DesktopType>;

const CHAPTER_SCROLL_DELAY_MS = 250;
const ACTIVE_CHAPTER_SELECTOR = '.menu__link--active[aria-current="page"]';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getSidebarScroller(container: HTMLDivElement): HTMLElement {
  return container.querySelector<HTMLElement>('nav.menu') ?? container;
}

function getLinkPath(link: HTMLAnchorElement): string {
  return new URL(link.href).pathname;
}

function getActiveChapterLink(scroller: HTMLElement, pathname: string): HTMLElement | undefined {
  const activeLink = scroller.querySelector<HTMLAnchorElement>(ACTIVE_CHAPTER_SELECTOR);
  if (activeLink && getLinkPath(activeLink) === pathname) return activeLink;

  return [...scroller.querySelectorAll<HTMLAnchorElement>('a.menu__link')].find(link => getLinkPath(link) === pathname);
}

function scrollActiveChapterToTop(container: HTMLDivElement, pathname: string): void {
  const scroller = getSidebarScroller(container);
  const activeLink = getActiveChapterLink(scroller, pathname);
  if (!activeLink) return;

  // Keep the selected chapter readable before its inline TOC expands below it.
  const top = scroller.scrollTop + activeLink.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  scroller.scrollTo({
    top,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

export default function DesktopWrapper(props: Props): ReactNode {
  const {pathname} = useLocation();
  const activeIndex = getActiveIndex(pathname);
  const scrollableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (scrollableRef.current) scrollActiveChapterToTop(scrollableRef.current, pathname);
    }, CHAPTER_SCROLL_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [pathname]);

  return (
    <div className={styles.sidebarContainer}>
      <SidebarHeader />
      <div key={activeIndex} ref={scrollableRef} className={styles.sidebarScrollable}>
        <Desktop {...props} />
      </div>
      <SidebarFooter />
    </div>
  );
}
