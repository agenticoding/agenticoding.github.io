import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function RulerEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.triangularRuler} size={size} className="idle-ruler-tick" />;
}
