import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function CrossEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.cross} size={size} />;
}
