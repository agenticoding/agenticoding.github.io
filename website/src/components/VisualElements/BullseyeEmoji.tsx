import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function BullseyeEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.accurate} size={size} className="idle-bullseye-ring" />;
}
