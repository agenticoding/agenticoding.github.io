import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function CompassEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.compass} size={size} className="idle-compass-needle" />;
}
