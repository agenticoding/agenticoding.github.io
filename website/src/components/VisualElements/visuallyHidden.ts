import type { CSSProperties } from 'react';

/** Visually hidden but screen-reader reachable: the narration doubles as the
 * figure's caption (every figure needs one) without changing the layout. The
 * 1px clipped box also swallows no pointer events, so it never blocks
 * interactive content inside the figure. */
export const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
};
