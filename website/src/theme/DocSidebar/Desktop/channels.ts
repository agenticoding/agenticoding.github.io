export const channels = [
  {label: 'Reference', path: '/', match: '/'},
  {label: 'Prompts', path: '/prompts', match: '/prompts'},
  {label: 'Toolbox', path: '/developer-tools/cli-coding-agents', match: '/developer-tools'},
] as const;

export function getActiveIndex(pathname: string): number {
  // Find the most specific (longest matching prefix) channel
  let bestIdx = 0;
  let bestLen = 0;
  channels.forEach((c, idx) => {
    if (pathname.startsWith(c.match) && c.match.length > bestLen) {
      bestIdx = idx;
      bestLen = c.match.length;
    }
  });
  return bestIdx;
}
