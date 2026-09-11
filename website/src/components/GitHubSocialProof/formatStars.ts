// Compact star counts: exact under 1k, one decimal for thousands (dropped at
// 10k+), so a header-scale number stays scannable. Shared with the browser
// contract test, which asserts the value is baked into the no-JavaScript HTML.
export function formatStars(stars: number): string {
  if (stars < 1_000) return String(stars);
  return `${(stars / 1_000).toFixed(stars < 10_000 ? 1 : 0).replace('.0', '')}k`;
}
