export type EmojiAssetName = `${string}.svg`;

export interface EmojiVisualBounds {
  x: number;
  width: number;
}

export interface EmojiAsset {
  file: EmojiAssetName;
  label: string;
  visualBounds?: EmojiVisualBounds;
}

const asset = (
  file: EmojiAssetName,
  label: string,
  visualBounds?: EmojiVisualBounds
): EmojiAsset => ({
  file,
  label,
  visualBounds,
});

export const EMOJI = {
  accurate: asset('1F3AF.svg', 'accurate'),
  act: asset('1F9BE.svg', 'act'),
  agent: asset('1F916.svg', 'agent'),
  balloon: asset('1F388.svg', 'balloon'),
  brain: asset('1F9E0.svg', 'brain'),
  chat: asset('1F4AC.svg', 'chat', { x: 12, width: 48 }),
  check: asset('2705.svg', 'check'),
  cloud: asset('2601.svg', 'cloud'),
  compass: asset('1F9ED.svg', 'compass', { x: 12, width: 48 }),
  computer: asset('1F4BB.svg', 'computer'),
  crying: asset('1F62D.svg', 'crying'),
  database: asset('1F5C4.svg', 'database', { x: 17, width: 38 }),
  dice: asset('1F3B2.svg', 'dice'),
  documentTabs: asset('1F4D1.svg', 'document tabs'),
  factory: asset('1F3ED.svg', 'factory'),
  gear: asset('2699.svg', 'gear'),
  globe: asset('1F30D.svg', 'globe'),
  handTools: asset('1FA9A.svg', 'hand tools'),
  laptop: asset('1F4BB.svg', 'laptop', { x: 11.8, width: 51.9 }),
  lightBulb: asset('1F4A1.svg', 'idea'),
  map: asset('1F5FA.svg', 'map'),
  microscope: asset('1F52C.svg', 'microscope'),
  money: asset('1FA99.svg', 'money'),
  observe: asset('1F440.svg', 'observe'),
  operator: asset('1F913.svg', 'operator', { x: 13, width: 46 }),
  plug: asset('1F50C.svg', 'plug', { x: 19.4, width: 36.4 }),
  question: asset('2753.svg', 'question'),
  rightArrow: asset('27A1.svg', 'right arrow'),
  downArrow: asset('2B07.svg', 'down arrow'),
  ruler: asset('1F4CF.svg', 'ruler', { x: 13.5, width: 45.3 }),
  tools: asset('1F6E0.svg', 'tools', { x: 6.6, width: 55 }),
  warning: asset('26A0.svg', 'warning'),
  construction: asset('1F6A7.svg', 'under construction'),
  emergency: asset('1F6A8.svg', 'emergency'),
  writing: asset('270F.svg', 'writing'),
  receipt: asset('1F9FE.svg', 'receipt', { x: 23.7, width: 24.3 }),
  books: asset('1F4DA.svg', 'books', { x: 10.6, width: 51.3 }),
  airplane: asset('2708.svg', 'airplane'),
  bookmarkTabs: asset('1F4D1.svg', 'bookmark tabs'),
  brush: asset('1F58C.svg', 'brush'),
  bug: asset('1F41E.svg', 'bug'),
  cross: asset('274C.svg', 'cross'),
  magnify: asset('1F50D.svg', 'magnifying glass'),
  megaphone: asset('1F4E3.svg', 'megaphone'),
  straightRuler: asset('1F4CF.svg', 'straight ruler'),
  triangularRuler: asset('1F4D0.svg', 'triangular ruler'),
  stopwatch: asset('23F1.svg', 'stopwatch'),
  microphone: asset('1F399.svg', 'microphone'),
  video: asset('1F3A5.svg', 'video camera'),
  wavingAuthor: asset('1F64B-1F3FB-200D-2642-FE0F.svg', 'author waving hello'),
} as const satisfies Record<string, EmojiAsset>;

export const OPENMOJI_VIEWBOX_SIZE = 72;
export const OPENMOJI_VISUAL_SCALE = 1.12;

export function emojiDisplaySize(size: number): number {
  return size * OPENMOJI_VISUAL_SCALE;
}

export function centeredEmojiOffset(size: number): number {
  return (emojiDisplaySize(size) - size) / 2;
}

export function emojiSrc(emojiBase: string, asset: EmojiAsset): string {
  return `${emojiBase}/${asset.file}`;
}
