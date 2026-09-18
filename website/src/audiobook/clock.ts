/** Formats a duration for the player's elapsed/total labels. */
export function formatClock(ms: number): string {
  const total = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
  const seconds = String(total % 60).padStart(2, '0');
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  const rest = `${hours > 0 ? String(minutes).padStart(2, '0') : minutes}:${seconds}`;
  return hours > 0 ? `${hours}:${rest}` : rest;
}
