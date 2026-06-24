import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function BrushEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.brush} size={size} className="idle-brush-arc" />;
}
