import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function CheckEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.check} size={size} className="idle-check-breathe" />;
}
