import { type ComponentProps, useEffect } from 'react';
import { useCollapsible, usePrevious } from '@docusaurus/theme-common';
import { isSamePath } from '@docusaurus/theme-common/internal';
import {
  isActiveSidebarItem,
  useDocSidebarItemsExpandedState,
} from '@docusaurus/plugin-content-docs/client';
import type { Props } from '@theme/DocSidebarItem/Category';

export function useAutoExpandActiveCategory({
  isActive,
  collapsed,
  updateCollapsed,
  activePath,
}: {
  isActive: boolean;
  collapsed: boolean;
  updateCollapsed: (collapsed: boolean) => void;
  activePath: string;
}) {
  const wasActive = usePrevious(isActive);
  const previousActivePath = usePrevious(activePath);
  useEffect(() => {
    const justBecameActive = isActive && !wasActive;
    const stillActiveButPathChanged =
      isActive && wasActive && activePath !== previousActivePath;
    if ((justBecameActive || stillActiveButPathChanged) && collapsed)
      updateCollapsed(false);
  }, [
    isActive,
    wasActive,
    collapsed,
    updateCollapsed,
    activePath,
    previousActivePath,
  ]);
}

export type AccordionStateParams = Pick<Props, 'item' | 'index' | 'activePath'>;

export type ClickHandlerParams = Pick<Props, 'item' | 'onItemClick'> & {
  collapsible: boolean;
  href: Props['item']['href'];
  isCurrentPage: boolean;
  updateCollapsed: (toCollapsed?: boolean) => void;
};

/**
 * Own collapse state of a category, plus the sidebar-wide accordion sync.
 * Hook call order is load-bearing: the auto-expand effect must run before the
 * sibling-collapse effect so an expanded sibling wins over auto-expansion.
 */
export function useCategoryAccordionState({
  item,
  index,
  activePath,
}: AccordionStateParams) {
  const { collapsible, href } = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const isCurrentPage = isSamePath(href, activePath);
  const { collapsed, setCollapsed } = useCollapsible({
    initialState: () => (collapsible ? !isActive && item.collapsed : false),
  });
  const { expandedItem, setExpandedItem } = useDocSidebarItemsExpandedState();
  // Not memoized (matches upstream 3.9.2 verbatim). Memoizing is NOT required
  // for correctness: useAutoExpandActiveCategory re-fires on its own
  // isActive/collapsed/activePath deps regardless of updateCollapsed identity.
  const updateCollapsed = (toCollapsed = !collapsed) => {
    setExpandedItem(toCollapsed ? null : index);
    setCollapsed(toCollapsed);
  };
  useAutoExpandActiveCategory({
    isActive,
    collapsed,
    updateCollapsed,
    activePath,
  });
  // Accordion: a sibling opening collapses this one. Also handles the
  // collapse-all sentinel (-1) from standalone docs (Intro/About) — since
  // -1 never equals a valid index (0..n) it collapses every open group.
  // Deliberate divergence from upstream theme-classic: the sibling-collapse
  // effect omits upstream's autoCollapseCategories theme-config gate, so the
  // accordion is unconditional product behavior (asserted by the browser
  // contract tests, inspectSidebarNavigation in test-responsive-diagrams.cjs).
  // Re-adding the gate would silently break those contracts.
  useEffect(() => {
    if (collapsible && expandedItem != null && expandedItem !== index)
      setCollapsed(true);
  }, [collapsible, expandedItem, index, setCollapsed]);
  return { collapsed, isActive, isCurrentPage, updateCollapsed };
}

// Returns a click handler: collapsible categories toggle instead of navigating,
// except when they link elsewhere (then the first click just expands).
export function handleCategoryClick({
  item,
  onItemClick,
  collapsible,
  href,
  isCurrentPage,
  updateCollapsed,
}: ClickHandlerParams): ComponentProps<'a'>['onClick'] {
  return (event) => {
    onItemClick?.(item);
    if (!collapsible) return;
    if (href && !isCurrentPage) {
      updateCollapsed(false);
      return;
    }
    event.preventDefault();
    updateCollapsed();
  };
}
