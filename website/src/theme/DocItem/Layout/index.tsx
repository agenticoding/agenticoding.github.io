import React, { type ReactNode } from 'react';
import { publishTOC } from '../../tocStore';
import clsx from 'clsx';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import DocItemPaginator from '@theme/DocItem/Paginator';
import DocVersionBanner from '@theme/DocVersionBanner';
import DocVersionBadge from '@theme/DocVersionBadge';
import DocItemFooter from '@theme/DocItem/Footer';
import DocItemTOCMobile from '@theme/DocItem/TOC/Mobile';
import DocItemContent from '@theme/DocItem/Content';
import DocBreadcrumbs from '@theme/DocBreadcrumbs';
import ContentVisibility from '@theme/ContentVisibility';
import type { Props } from '@theme/DocItem/Layout';

import { useActiveHeadingPublisher } from '../../useActiveHeading';
import AudioDock from '../../audio/AudioDock';
import AudioEngine from '../../audio/AudioEngine';
import styles from './styles.module.css';

/**
 * Decide if the toc should be rendered, and publish it to the sidebar TOC store.
 */
function useDocTOC() {
  const { frontMatter, toc } = useDoc();

  const hidden = frontMatter.hide_table_of_contents;
  const canRender = !hidden && toc.length > 0;

  React.useEffect(() => {
    publishTOC(hidden ? [] : toc);
  }, [toc, hidden]);

  return {
    hidden,
    mobile: canRender ? <DocItemTOCMobile /> : undefined,
  };
}

export default function DocItemLayout({ children }: Props): ReactNode {
  const docTOC = useDocTOC();
  const { metadata } = useDoc();
  // The one scrollspy for this page: both TOC instances read the store it publishes to.
  useActiveHeadingPublisher(metadata.id);

  return (
    <div className="row">
      <div className={clsx('col', !docTOC.hidden && styles.docItemCol)}>
        <ContentVisibility metadata={metadata} />
        <DocVersionBanner />
        <div key={metadata.id} className={styles.docItemContainer}>
          <article>
            <div className={styles.docHeader}>
              <DocBreadcrumbs />
            </div>
            <DocVersionBadge />
            {docTOC.mobile}
            <DocItemContent>{children}</DocItemContent>
            <DocItemFooter />
          </article>
          {/* Sibling of <article>: the artifact test asserts DOM contracts on article p. */}
          <AudioEngine chapterId={metadata.id} title={metadata.title} />
          <DocItemPaginator />
          <AudioDock />
        </div>
      </div>
    </div>
  );
}
