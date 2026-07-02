export type TokenBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const nonNegativeDimension = (value: number) => Math.max(0, value);

export const minDimension = ({ width, height }: TokenBox) =>
  Math.min(width, height);

export function insetBox(
  { x, y, width, height }: TokenBox,
  amount: number
): TokenBox {
  return {
    x: x + amount,
    y: y + amount,
    width: nonNegativeDimension(width - amount * 2),
    height: nonNegativeDimension(height - amount * 2),
  };
}

export const scaledInset = (box: TokenBox) =>
  clamp(minDimension(box) * 0.1, 0.5, 1);

export const tokenStrokeWidth = (box: TokenBox, width: number) =>
  Math.min(width, clamp(minDimension(box) * 0.16, 0.9, 1.8));

export const salientStrokeWidth = (box: TokenBox) =>
  Math.min(3, clamp(minDimension(box) * 0.22, 1.2, 3));

export const codeGlyphStrokeWidth = () => 1.6;

export const compressedOverlayInset = (box: TokenBox) =>
  clamp(minDimension(box) * 0.24, 1.2, 4);

export const supportsDashedOverlay = (box: TokenBox) => minDimension(box) >= 14;
