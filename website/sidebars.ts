import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';
import {
  chapterGroups,
  getSectionNumber,
  standaloneChapters,
  toolboxEntries,
  type Chapter,
  type SidebarCustomProps,
  type ToolboxEntry,
} from './chapters.ts';

const sidebarItem = (item: Chapter | ToolboxEntry) => ({
  type: 'doc' as const,
  id: item.id,
  customProps: {
    sectionNumber: getSectionNumber(item.id),
    collapsesCategories:
      'collapsesCategories' in item && item.collapsesCategories,
  } satisfies SidebarCustomProps,
});

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    ...standaloneChapters.beforeGroups.map(sidebarItem),
    ...chapterGroups.map((group) => ({
      type: 'category' as const,
      label: group.label,
      collapsed: true,
      items: group.chapters.map(sidebarItem),
    })),
    {
      type: 'category' as const,
      label: 'Toolbox',
      collapsed: true,
      items: toolboxEntries.map(sidebarItem),
    },
    ...standaloneChapters.afterGroups.map(sidebarItem),
  ],
};

export default sidebars;
