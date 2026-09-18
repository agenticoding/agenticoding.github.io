import React from 'react';
import type { TOCItem } from '@docusaurus/mdx-loader';

import type { TocEntry } from '../audiobook/outline';

/**
 * One publish/subscribe cell for a piece of page state: a plain value that exactly one
 * producer owns and any number of consumers read. The TOC, the active heading and the
 * audio view all need that same contract, so the mechanics live once.
 *
 * `useValue` syncs inside an effect rather than in the state initializer, which keeps the
 * server's empty output identical to the first client render.
 */
export function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<(next: T) => void>();
  return {
    publish(next: T): void {
      value = next;
      listeners.forEach((notify) => notify(next));
    },
    useValue(): T {
      const [current, setCurrent] = React.useState<T>(initial);
      React.useEffect(() => {
        setCurrent(value); // sync on mount (catches a publish that landed before subscribe)
        listeners.add(setCurrent);
        return () => {
          listeners.delete(setCurrent);
        };
      }, []);
      return current;
    },
  };
}

const toc = createStore<readonly TOCItem[]>([]);
const activeHeading = createStore('');

export const publishTOC = toc.publish;
export const useSidebarTOC = toc.useValue;

/** Where the reader's eyes are. Written by the page's single heading publisher. */
export const publishActiveHeading = activeHeading.publish;
export const useActiveHeading = activeHeading.useValue;

/**
 * MDX serializes visual heading components as empty custom elements in the TOC.
 * Remove the absent mark and its adjacent whitespace so labels stay contiguous.
 * Matches both paired (<toolmark></toolmark>) and self-closing (<toolmark />)
 * serialization so a future MDX change cannot leak raw markup into a label.
 */
export function tocHeadingHtml(value: string): string {
  return value.replace(
    /\s*<toolmark\b[^>]*?\/?>(?:\s*<\/toolmark>)?\s*/gi,
    ' '
  );
}

/**
 * The chapter's headings in document order, in the exact id/title shape audio state
 * attaches to. Titles are plain text because the same string lands in button labels,
 * live-region announcements and the dock, where heading markup would be wrong.
 */
export function useTocEntries(): TocEntry[] {
  const toc = useSidebarTOC();
  return React.useMemo(
    () =>
      toc.flatMap((item) =>
        item.id ? [{ id: item.id, title: headingText(item.value) }] : []
      ),
    [toc]
  );
}

function headingText(value: string): string {
  return tocHeadingHtml(value)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
