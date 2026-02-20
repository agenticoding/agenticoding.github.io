/** Compute a closed superellipse SVG path via Lamé's formula. */
export function superellipsePath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n: number,
  segments = 64
): string {
  const pts: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * 2 * Math.PI;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = cx + rx * Math.sign(c) * Math.abs(c) ** (2 / n);
    const y = cy + ry * Math.sign(s) * Math.abs(s) ** (2 / n);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ') + 'Z';
}
