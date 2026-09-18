/**
 * The player's accessible name, kept out of the React component so the browser-contract
 * test can import the same string. A second copy is how the button and its contract start
 * disagreeing about what pressing it offers.
 */
export function chapterAudioLabel(playing: boolean): string {
  return `${playing ? 'Pause' : 'Listen to'} chapter audio`;
}
