import { useState, useEffect } from 'react';

/** Returns true after the component has mounted on the client. SSR-safe. */
export function useMounted(): boolean {
  const [mounted, set] = useState(false);
  useEffect(() => { set(true); }, []);
  return mounted;
}
