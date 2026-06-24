import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function StraightRulerEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.straightRuler} size={size} className="idle-ruler-tick" />;
}
