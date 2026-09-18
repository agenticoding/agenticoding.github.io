/**
 * The chapter's contents: the skeleton the reader navigates by.
 *
 * The eye channel is the list's own active link — weight plus the rail marker — and comes from
 * the page's single active-heading publisher. Nothing here seeks, and nothing here reports
 * playback: a contents row shows navigation position, and progress lives in the player alone.
 */
import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import {
  useTreeifiedTOC,
  type TOCTreeNode,
} from '@docusaurus/theme-common/internal';

import {
  publishActiveHeading,
  tocHeadingHtml,
  useActiveHeading,
  useSidebarTOC,
} from '../../tocStore';
import { scrollToHeading } from '../../useActiveHeading';
import AnimatedDisclosure from '../../shared/AnimatedDisclosure';
import styles from './styles.module.css';

function shouldHandleTocClick(
  event: React.MouseEvent<HTMLAnchorElement>
): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function isNodeActive(node: TOCTreeNode, activeId: string): boolean {
  return (
    node.id === activeId || node.children.some((child) => child.id === activeId)
  );
}

function TocLink({
  node,
  active,
  onNavigate,
  sublink = false,
}: {
  node: TOCTreeNode;
  active: boolean;
  onNavigate?: () => void;
  sublink?: boolean;
}): ReactNode {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!shouldHandleTocClick(event)) return;
    event.preventDefault();
    // Optimistic: the scroll listener reports the scroll, not the press, and the row must
    // not stay unhighlighted for the length of a smooth scroll.
    publishActiveHeading(node.id);
    scrollToHeading(node.id);
    onNavigate?.();
  };

  return (
    <a
      href={`#${node.id}`}
      className={clsx(
        sublink ? styles.tocSublink : styles.tocLink,
        active && styles.tocLinkActive
      )}
      onClick={handleClick}
    >
      {/* Docusaurus TOC values contain trusted heading markup. */}
      {/* eslint-disable-next-line react/no-danger */}
      <span dangerouslySetInnerHTML={{ __html: tocHeadingHtml(node.value) }} />
    </a>
  );
}

function H3Disclosure({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}): ReactNode {
  return (
    <AnimatedDisclosure show={show} enterDelayMs={0} exitDelayMs={1}>
      {children}
    </AnimatedDisclosure>
  );
}

/** One contents entry plus the sub-entries it owns, revealed only while it is being read. */
function TocGroup({
  h2,
  activeH2,
  isActiveLink,
  onNavigate,
}: {
  h2: TOCTreeNode;
  activeH2: TOCTreeNode | undefined;
  isActiveLink: (id: string) => boolean;
  onNavigate?: () => void;
}): ReactNode {
  return (
    <>
      <TocLink node={h2} active={isActiveLink(h2.id)} onNavigate={onNavigate} />
      <H3Disclosure show={h2 === activeH2 && h2.children.length > 0}>
        {h2.children.map((h3) => (
          <TocLink
            key={h3.id}
            node={h3}
            active={isActiveLink(h3.id)}
            onNavigate={onNavigate}
            sublink
          />
        ))}
      </H3Disclosure>
    </>
  );
}

/**
 * The whole list, wired to the active id: rows light up exactly once (the first
 * link may claim the highlight), and the h2 owning the active row is revealed.
 */
function TocNav({
  toc,
  activeId,
  onNavigate,
}: {
  toc: readonly TOCTreeNode[];
  activeId: string;
  onNavigate?: () => void;
}): ReactNode {
  const activeLinks = new Set<string>();
  const isActiveLink = (id: string) => {
    if (id !== activeId || activeLinks.has(id)) return false;
    activeLinks.add(id);
    return true;
  };
  const activeH2 = toc.find((h2) => isNodeActive(h2, activeId));
  return (
    <nav className={styles.tocInline} aria-label="Current chapter contents">
      {toc.map((h2) => (
        <TocGroup
          key={h2.id}
          h2={h2}
          activeH2={activeH2}
          isActiveLink={isActiveLink}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export default function SidebarTOC({
  onNavigate,
}: {
  onNavigate?: () => void;
}): ReactNode {
  const flatToc = useSidebarTOC();
  const activeId = useActiveHeading();
  const toc = useTreeifiedTOC(flatToc as Parameters<typeof useTreeifiedTOC>[0]);
  if (toc.length === 0) return null;
  return <TocNav toc={toc} activeId={activeId} onNavigate={onNavigate} />;
}
