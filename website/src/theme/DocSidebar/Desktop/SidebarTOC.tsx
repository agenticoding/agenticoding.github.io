import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { useTreeifiedTOC, type TOCTreeNode } from '@docusaurus/theme-common/internal';
import { useSidebarTOC } from '../../tocStore';
import styles from './styles.module.css';

const STORAGE_KEY = 'sidebar-toc-open';

function getInitialOpen(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return stored === null ? false : stored === 'true';
}

function useScrollspy(ids: string[]): string {
  const [activeId, setActiveId] = React.useState('');

  React.useEffect(() => {
    if (ids.length === 0) { setActiveId(''); return; }

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '0px 0px -80% 0px' },
    );

    const elements = ids.flatMap(id => {
      const el = document.getElementById(id);
      return el ? [el] : [];
    });

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);

  return activeId;
}

function flatIds(nodes: readonly TOCTreeNode[]): string[] {
  return nodes.flatMap(h2 => [h2.id, ...h2.children.map(h3 => h3.id)]);
}

export default function SidebarTOC(): ReactNode {
  const flatToc = useSidebarTOC();
  const toc = useTreeifiedTOC(flatToc as Parameters<typeof useTreeifiedTOC>[0]);
  const [open, setOpen] = React.useState(false);

  // Hydrate from sessionStorage after mount (avoids SSR mismatch)
  React.useEffect(() => {
    setOpen(getInitialOpen());
  }, []);

  const allIds = React.useMemo(() => flatIds(toc), [toc]);
  const activeId = useScrollspy(allIds);

  if (toc.length === 0) return null;

  const activeH2 = toc.find(
    h2 => h2.id === activeId || h2.children.some(h3 => h3.id === activeId),
  );

  function handleToggle() {
    const next = !open;
    setOpen(next);
    sessionStorage.setItem(STORAGE_KEY, String(next));
  }

  return (
    <div className={styles.tocZone}>
      <button
        type="button"
        className={styles.tocToggle}
        onClick={handleToggle}
        aria-expanded={open}
      >
        <span className={styles.tocToggleRow}>
          <span className={styles.tocLabel}>Contents</span>
          {!open && activeH2 && (
            <span
              className={styles.tocActiveLabel}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: activeH2.value }}
            />
          )}
        </span>
        <svg
          className={clsx(styles.tocChevron, open && styles.tocChevronOpen)}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="2,4 6,8 10,4" />
        </svg>
      </button>
      <div className={clsx(styles.tocContent, open && styles.tocContentOpen)}>
        <div className={clsx(styles.tocContentInner, open && styles.tocContentInnerOpen)}>
          {toc.map(h2 => (
            <React.Fragment key={h2.id}>
              <a
                href={`#${h2.id}`}
                className={clsx(
                  styles.tocLink,
                  activeId === h2.id && styles.tocLinkActive,
                )}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: h2.value }}
              />
              {h2 === activeH2 &&
                h2.children.map(h3 => (
                  <a
                    key={h3.id}
                    href={`#${h3.id}`}
                    className={clsx(
                      styles.tocSublink,
                      activeId === h3.id && styles.tocLinkActive,
                    )}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: h3.value }}
                  />
                ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
