/** Compute a sharp rectangle path centered at `cx`,`cy`. */
export function rectanglePath(cx: number, cy: number, halfWidth: number, halfHeight: number): string {
  const left = (cx - halfWidth).toFixed(1);
  const right = (cx + halfWidth).toFixed(1);
  const top = (cy - halfHeight).toFixed(1);
  const bottom = (cy + halfHeight).toFixed(1);
  return `M${left},${top} L${right},${top} L${right},${bottom} L${left},${bottom} Z`;
}
