import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function AirplaneEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.airplane} size={size} className="idle-air-stripe" />;
}
