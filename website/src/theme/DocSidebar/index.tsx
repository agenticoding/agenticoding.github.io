import React, {type ReactNode, useEffect, useState} from 'react';
import DocSidebarDesktop from '@theme/DocSidebar/Desktop';
import DocSidebarMobile from '@theme/DocSidebar/Mobile';
import type {Props} from '@theme/DocSidebar';

const DESKTOP_MIN_WIDTH = 996;
const DESKTOP_MIN_ASPECT = 7 / 5;

type SidebarMode = 'desktop' | 'mobile' | 'ssr';

function getSidebarMode(): SidebarMode {
  if (typeof window === 'undefined') return 'ssr';

  const aspectRatio = window.innerWidth / Math.max(window.innerHeight, 1);
  return window.innerWidth > DESKTOP_MIN_WIDTH && aspectRatio >= DESKTOP_MIN_ASPECT
    ? 'desktop'
    : 'mobile';
}

function useSidebarMode(): SidebarMode {
  const [mode, setMode] = useState<SidebarMode>('ssr');

  useEffect(() => {
    const sync = () => setMode(getSidebarMode());
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  return mode;
}

export default function DocSidebar(props: Props): ReactNode {
  const mode = useSidebarMode();

  if (mode === 'desktop') {
    return <DocSidebarDesktop {...props} />;
  }

  if (mode === 'mobile') {
    return <DocSidebarMobile {...props} />;
  }

  return (
    <>
      <div className="doc-shell-desktop">
        <DocSidebarDesktop {...props} />
      </div>
      <div className="doc-shell-mobile">
        <DocSidebarMobile {...props} />
      </div>
    </>
  );
}
