import React from 'react';
import type { TOCItem } from '@docusaurus/mdx-loader';

type Listener = (toc: readonly TOCItem[]) => void;

let _toc: readonly TOCItem[] = [];
const _listeners = new Set<Listener>();

export function publishTOC(toc: readonly TOCItem[]): void {
  _toc = toc;
  _listeners.forEach(fn => fn(toc));
}

export function useSidebarTOC(): readonly TOCItem[] {
  // useState + useEffect — NOT useState(initializer) to avoid SSR mismatch
  const [toc, setToc] = React.useState<readonly TOCItem[]>([]);
  React.useEffect(() => {
    setToc(_toc);           // sync on mount (catches in-flight nav)
    _listeners.add(setToc);
    return () => { _listeners.delete(setToc); };
  }, []);
  return toc;
}
