import { DIAGRAM_STROKE } from './diagramScale.ts';
import { MODEL_CALL_FRAME_LAYOUT, TILE_GRID } from './diagramTileLayout.ts';

export type ModelCallFrameBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ModelCallFrameTabAlign = 'start' | 'center';

export type ModelCallFrameTabOptions = {
  tabAlign?: ModelCallFrameTabAlign;
  frameWidth?: number;
};

export const MODEL_CALL_FRAME_TAB_OVERHANG =
  MODEL_CALL_FRAME_LAYOUT.tabHeight / 2;
export const MODEL_CALL_FRAME_STROKE_OUTSET = DIAGRAM_STROKE.default / 2;
export const MODEL_CALL_FRAME_VISUAL_OUTSET = {
  top: MODEL_CALL_FRAME_TAB_OVERHANG + MODEL_CALL_FRAME_STROKE_OUTSET,
  right: MODEL_CALL_FRAME_STROKE_OUTSET,
  bottom: MODEL_CALL_FRAME_STROKE_OUTSET,
  left: MODEL_CALL_FRAME_STROKE_OUTSET,
} as const;

export function modelCallFrameTab(
  x: number,
  y: number,
  label: string,
  tabWidth?: number,
  options: ModelCallFrameTabOptions = {}
): ModelCallFrameBounds {
  const computedWidth = tabWidth ?? autoTabWidth(label);
  return {
    x: tabX(x, computedWidth, options),
    y: y - MODEL_CALL_FRAME_TAB_OVERHANG,
    width: computedWidth,
    height: MODEL_CALL_FRAME_LAYOUT.tabHeight,
  };
}

export function modelCallFrameVisualBounds(
  frame: ModelCallFrameBounds,
  tabLabel: string,
  tabWidth?: number,
  options: Pick<ModelCallFrameTabOptions, 'tabAlign'> = {}
): ModelCallFrameBounds {
  const tab = modelCallFrameTab(frame.x, frame.y, tabLabel, tabWidth, {
    ...options,
    frameWidth: frame.width,
  });
  return boxUnion(outsetBox(frame), outsetBox(tab));
}

function tabX(
  x: number,
  tabWidth: number,
  { tabAlign = 'start', frameWidth }: ModelCallFrameTabOptions
) {
  if (tabAlign === 'center') {
    if (frameWidth === undefined) {
      throw new Error('Centered model call frame tabs require frameWidth');
    }
    return x + (frameWidth - tabWidth) / 2;
  }
  return x + TILE_GRID * 3;
}

function autoTabWidth(label: string) {
  const { tabPaddingX, tabIconSize, tabGap, tabLabelCharWidth } =
    MODEL_CALL_FRAME_LAYOUT;
  return (
    tabPaddingX * 2 + tabIconSize + tabGap + label.length * tabLabelCharWidth
  );
}

function outsetBox(box: ModelCallFrameBounds) {
  return {
    x: box.x - MODEL_CALL_FRAME_STROKE_OUTSET,
    y: box.y - MODEL_CALL_FRAME_STROKE_OUTSET,
    width: box.width + MODEL_CALL_FRAME_STROKE_OUTSET * 2,
    height: box.height + MODEL_CALL_FRAME_STROKE_OUTSET * 2,
  };
}

function boxUnion(a: ModelCallFrameBounds, b: ModelCallFrameBounds) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(right(a), right(b)) - x,
    height: Math.max(bottom(a), bottom(b)) - y,
  };
}

function right(box: ModelCallFrameBounds) {
  return box.x + box.width;
}

function bottom(box: ModelCallFrameBounds) {
  return box.y + box.height;
}
