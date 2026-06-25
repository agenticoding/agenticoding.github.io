import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { useTreeifiedTOC, type TOCTreeNode } from '@docusaurus/theme-common/internal';
import { useSidebarTOC } from '../../tocStore';
import styles from './styles.module.css';

function useScrollspy(ids: string[]): string {
  const [activeId, setActiveId] = React.useState('');

  React.useEffect(() => {
    if (ids.length === 0) {
      setActiveId('');
      return;
    }

    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => entry.isIntersecting && setActiveId(entry.target.id)),
      { rootMargin: '0px 0px -80% 0px' },
    );
    const elements = ids.flatMap(id => document.getElementById(id) ?? []);

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);

  return activeId;
}

function flatIds(nodes: readonly TOCTreeNode[]): string[] {
  return nodes.flatMap(h2 => [h2.id, ...h2.children.map(h3 => h3.id)]);
}

function isNodeActive(node: TOCTreeNode, activeId: string): boolean {
  return node.id === activeId || node.children.some(child => child.id === activeId);
}

function TocLink({node, active, sublink = false}: {node: TOCTreeNode; active: boolean; sublink?: boolean}) {
  return (
    <a
      href={`#${node.id}`}
      className={clsx(sublink ? styles.tocSublink : styles.tocLink, active && styles.tocLinkActive)}
      // Docusaurus TOC values contain trusted heading markup.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: node.value }}
    />
  );
}

export default function SidebarTOC(): ReactNode {
  const flatToc = useSidebarTOC();
  const toc = useTreeifiedTOC(flatToc as Parameters<typeof useTreeifiedTOC>[0]);
  const allIds = React.useMemo(() => flatIds(toc), [toc]);
  const activeId = useScrollspy(allIds);

  if (toc.length === 0) return null;

  const activeH2 = toc.find(h2 => isNodeActive(h2, activeId));

  return (
    <nav className={styles.tocInline} aria-label="Current chapter contents">
      {toc.map(h2 => (
        <React.Fragment key={h2.id}>
          <TocLink node={h2} active={activeId === h2.id} />
          {h2 === activeH2 && h2.children.map(h3 => (
            <TocLink key={h3.id} node={h3} active={activeId === h3.id} sublink />
          ))}
        </React.Fragment>
      ))}
    </nav>
  );
}
