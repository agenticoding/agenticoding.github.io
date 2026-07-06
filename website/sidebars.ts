import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';
import { chapters, ORDERED_IDS } from './chapters';

const sidebars: SidebarsConfig = {
  tutorialSidebar: ORDERED_IDS.map((id, index) => ({
    type: 'doc' as const,
    id,
    customProps: {
      sectionNumber: index,
      chapterKind: chapters[index].kind,
    },
  })),
};

export default sidebars;
