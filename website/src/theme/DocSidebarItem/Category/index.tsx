import React, { type ComponentProps, type ReactNode, useMemo } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import {
  findFirstSidebarItemLink,
  useVisibleSidebarItems,
} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import { translate } from '@docusaurus/Translate';
import useIsBrowser from '@docusaurus/useIsBrowser';
import DocSidebarItems from '@theme/DocSidebarItems';
import DocSidebarItemLink from '@theme/DocSidebarItem/Link';
import type { Props } from '@theme/DocSidebarItem/Category';
import type {
  PropSidebarItemCategory,
  PropSidebarItemLink,
} from '@docusaurus/plugin-content-docs';
import AnimatedDisclosure from '../../shared/AnimatedDisclosure';
import { useActiveChapterScroll } from '../../DocSidebar/Desktop/SidebarScrollContext';
import { handleCategoryClick, useCategoryAccordionState } from './hooks';

import styles from './styles.module.css';

function useCategoryHrefWithSSRFallback(
  item: Props['item']
): string | undefined {
  const isBrowser = useIsBrowser();
  return useMemo(() => {
    if (item.href && !item.linkUnlisted) return item.href;
    if (isBrowser || !item.collapsible) return undefined;
    return findFirstSidebarItemLink(item);
  }, [item, isBrowser]);
}

function CollapseButton({
  collapsed,
  categoryLabel,
  onClick,
}: {
  collapsed: boolean;
  categoryLabel: string;
  onClick: ComponentProps<'button'>['onClick'];
}) {
  return (
    <button
      aria-label={translate(
        collapsed
          ? {
              id: 'theme.DocSidebarItem.expandCategoryAriaLabel',
              message: "Expand sidebar category '{label}'",
              description: 'The ARIA label to expand the sidebar category',
            }
          : {
              id: 'theme.DocSidebarItem.collapseCategoryAriaLabel',
              message: "Collapse sidebar category '{label}'",
              description: 'The ARIA label to collapse the sidebar category',
            },
        { label: categoryLabel }
      )}
      aria-expanded={!collapsed}
      type="button"
      className="clean-btn menu__caret"
      onClick={onClick}
    />
  );
}

function CategoryLinkLabel({ label }: { label: string }) {
  return (
    <span title={label} className={styles.categoryLinkLabel}>
      {label}
    </span>
  );
}

function isCategoryWithHref(
  category: PropSidebarItemCategory
): category is PropSidebarItemCategory & { href: string } {
  return typeof category.href === 'string';
}

function EmptyCategory({ item, ...props }: Props): ReactNode {
  if (!isCategoryWithHref(item)) return null;
  const {
    type: _type,
    collapsed: _collapsed,
    collapsible: _collapsible,
    items: _items,
    linkUnlisted: _linkUnlisted,
    ...linkItem
  } = item;
  return (
    <DocSidebarItemLink
      item={{ type: 'link', ...linkItem } as PropSidebarItemLink}
      {...props}
    />
  );
}

function CategoryItems({
  activePath,
  collapsed,
  items,
  level,
  onItemClick,
}: Pick<Props, 'activePath' | 'level' | 'onItemClick'> & {
  collapsed: boolean;
  items: Props['item']['items'];
}) {
  const scrollActiveChapter = useActiveChapterScroll();
  return (
    <AnimatedDisclosure onShowCommitted={scrollActiveChapter} show={!collapsed}>
      <ul className="menu__list">
        <DocSidebarItems
          items={items}
          tabIndex={collapsed ? -1 : 0}
          onItemClick={onItemClick}
          activePath={activePath}
          level={level + 1}
        />
      </ul>
    </AnimatedDisclosure>
  );
}

function CollapsibleCategory({
  item,
  onItemClick,
  activePath,
  level,
  index,
  ...props
}: Props): ReactNode {
  const { items, label, collapsible, className, href } = item;
  const hrefWithSSRFallback = useCategoryHrefWithSSRFallback(item);
  const { collapsed, isActive, isCurrentPage, updateCollapsed } =
    useCategoryAccordionState({ item, index, activePath });
  const handleItemClick = handleCategoryClick({
    item,
    onItemClick,
    collapsible,
    href,
    isCurrentPage,
    updateCollapsed,
  });

  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemCategory,
        ThemeClassNames.docs.docSidebarItemCategoryLevel(level),
        'menu__list-item',
        { 'menu__list-item--collapsed': collapsed },
        className
      )}
    >
      <div
        className={clsx('menu__list-item-collapsible', {
          'menu__list-item-collapsible--active': isCurrentPage,
        })}
      >
        <Link
          className={clsx(styles.categoryLink, 'menu__link', {
            'menu__link--sublist': collapsible,
            'menu__link--sublist-caret': !href && collapsible,
            'menu__link--active': isActive,
          })}
          onClick={handleItemClick}
          aria-current={isCurrentPage ? 'page' : undefined}
          role={collapsible && !href ? 'button' : undefined}
          aria-expanded={collapsible && !href ? !collapsed : undefined}
          href={
            collapsible ? (hrefWithSSRFallback ?? '#') : hrefWithSSRFallback
          }
          {...props}
        >
          <CategoryLinkLabel label={label} />
        </Link>
        {href && collapsible && (
          <CollapseButton
            collapsed={collapsed}
            categoryLabel={label}
            onClick={(event) => {
              event.preventDefault();
              updateCollapsed();
            }}
          />
        )}
      </div>
      <CategoryItems
        activePath={activePath}
        collapsed={collapsed}
        items={items}
        level={level}
        onItemClick={onItemClick}
      />
    </li>
  );
}

export default function DocSidebarItemCategory(props: Props): ReactNode {
  const visibleChildren = useVisibleSidebarItems(
    props.item.items,
    props.activePath
  );
  if (!visibleChildren.length) return <EmptyCategory {...props} />;
  return <CollapsibleCategory {...props} />;
}
