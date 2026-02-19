export const channels = [
  {label: 'Reference', path: '/docs', match: '/docs'},
  {label: 'Prompts', path: '/prompts', match: '/prompts'},
  {label: 'Toolbox', path: '/developer-tools/cli-coding-agents', match: '/developer-tools'},
] as const;

export function getActiveIndex(pathname: string): number {
  const idx = channels.findIndex(c => pathname.startsWith(c.match));
  return idx >= 0 ? idx : 0;
}
