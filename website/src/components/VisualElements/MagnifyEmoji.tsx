import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function MagnifyEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.magnify} size={size} className="idle-magnify-search" />;
}
