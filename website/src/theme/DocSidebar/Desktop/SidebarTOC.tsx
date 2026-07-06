import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { useTreeifiedTOC, type TOCTreeNode } from '@docusaurus/theme-common/internal';
import { useSidebarTOC } from '../../tocStore';
import AnimatedDisclosure from '../../shared/AnimatedDisclosure';
import { resolveActiveHeading, type HeadingSnapshot } from './scrollspy';
import styles from './styles.module.css';

function useScrollspy(ids: string[]): {activeId: string; activateId: (id: string) => void} {
  const [activeId, setActiveId] = React.useState('');
  const idsKey = ids.join(',');

  React.useEffect(() => {
    if (ids.length === 0) {
      setActiveId('');
      return undefined;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      setActiveId(resolveCurrentHeading(ids));
    };
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    setActiveId('');
    schedule();
    const observer = createScrollspyObserver(ids, schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const activateId = React.useCallback((id: string) => {
    if (ids.includes(id)) setActiveId(id);
  }, [ids]);

  return {activeId, activateId};
}

function createScrollspyObserver(ids: readonly string[], schedule: () => void): IntersectionObserver {
  const observer = new IntersectionObserver(schedule, { threshold: 0 });
  ids.flatMap(id => document.getElementById(id) ?? []).forEach(el => observer.observe(el));
  return observer;
}

function resolveCurrentHeading(ids: readonly string[]): string {
  return resolveActiveHeading({
    headings: ids.flatMap(headingSnapshot),
    viewportHeight: window.innerHeight,
    atPageBottom: isAtPageBottom(),
  });
}

function headingSnapshot(id: string): HeadingSnapshot[] {
  const element = document.getElementById(id);
  if (element == null) return [];
  const rect = element.getBoundingClientRect();
  return [{id, top: rect.top, bottom: rect.bottom}];
}

function isAtPageBottom(): boolean {
  const scrollBottom = window.scrollY + window.innerHeight;
  return Math.ceil(scrollBottom) >= document.documentElement.scrollHeight - 1;
}

function scrollToHeading(id: string): void {
  const element = document.getElementById(id);
  if (element == null) return;
  window.history.pushState(null, '', `#${id}`);
  element.scrollIntoView({ behavior: scrollBehavior(), block: 'start', inline: 'nearest' });
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function shouldHandleTocClick(event: React.MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function flatIds(nodes: readonly TOCTreeNode[]): string[] {
  const seen = new Set<string>();
  return nodes.flatMap(h2 => [h2.id, ...h2.children.map(h3 => h3.id)]).filter(id => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function isNodeActive(node: TOCTreeNode, activeId: string): boolean {
  return node.id === activeId || node.children.some(child => child.id === activeId);
}

function TocLink({
  node,
  active,
  onActivate,
  onNavigate,
  sublink = false,
}: {
  node: TOCTreeNode;
  active: boolean;
  onActivate: (id: string) => void;
  onNavigate?: () => void;
  sublink?: boolean;
}) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!shouldHandleTocClick(event)) return;
    event.preventDefault();
    onActivate(node.id);
    scrollToHeading(node.id);
    onNavigate?.();
  };

  return (
    <a
      href={`#${node.id}`}
      className={clsx(sublink ? styles.tocSublink : styles.tocLink, active && styles.tocLinkActive)}
      onClick={handleClick}
      // Docusaurus TOC values contain trusted heading markup.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: node.value }}
    />
  );
}

function H3Disclosure({show, children}: {show: boolean; children: ReactNode}): ReactNode {
  return (
    <AnimatedDisclosure show={show} enterDelayMs={0} exitDelayMs={1}>
      {children}
    </AnimatedDisclosure>
  );
}

export default function SidebarTOC({onNavigate}: {onNavigate?: () => void}): ReactNode {
  const flatToc = useSidebarTOC();
  const toc = useTreeifiedTOC(flatToc as Parameters<typeof useTreeifiedTOC>[0]);
  const allIds = React.useMemo(() => flatIds(toc), [toc]);
  const {activeId, activateId} = useScrollspy(allIds);

  if (toc.length === 0) return null;

  const activeH2 = toc.find(h2 => isNodeActive(h2, activeId));
  const activeLinks = new Set<string>();
  const isActiveLink = (id: string) => {
    if (id !== activeId || activeLinks.has(id)) return false;
    activeLinks.add(id);
    return true;
  };

  return (
    <nav className={styles.tocInline} aria-label="Current chapter contents">
      {toc.map(h2 => (
        <React.Fragment key={h2.id}>
          <TocLink node={h2} active={isActiveLink(h2.id)} onActivate={activateId} onNavigate={onNavigate} />
          <H3Disclosure show={h2 === activeH2 && h2.children.length > 0}>
            {h2.children.map(h3 => (
              <TocLink
                key={h3.id}
                node={h3}
                active={isActiveLink(h3.id)}
                onActivate={activateId}
                onNavigate={onNavigate}
                sublink
              />
            ))}
          </H3Disclosure>
        </React.Fragment>
      ))}
    </nav>
  );
}
