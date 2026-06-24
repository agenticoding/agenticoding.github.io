import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function StopwatchEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.stopwatch} size={size} className="idle-stopwatch-hand" />;
}
