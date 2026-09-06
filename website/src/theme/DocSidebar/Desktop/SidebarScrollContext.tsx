import React from 'react';

// No-op default exists for the mobile navbar drawer, which renders the swizzled
// DocSidebarItem components without a provider: expanding a group in the
// drawer simply skips the (desktop-only) active-chapter scroll.

const SidebarScrollContext = React.createContext<() => void>(() => undefined);

export const SidebarScrollProvider = SidebarScrollContext.Provider;

export function useActiveChapterScroll(): () => void {
  return React.useContext(SidebarScrollContext);
}
