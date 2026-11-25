/**
 * One official lab mark per lab, keyed by the dataset's own `lab` value.
 *
 * WHY decoration only: the table's hues must be its only colour, so a mark
 * arrives as a silhouette (`mode: 'mask'`, painted `--text-heading`) unless its
 * official artwork is compound. The model name stays the accessible name.
 *
 * WHY absence is allowed: a lab with no official vector is simply missing here,
 * and `FigureMark` draws that lab's initial in a neutral tile instead — the
 * column is reserved in every row, so a blank would read as a hole. Source,
 * licence, and adaptation for every file live in
 * website/static/img/model-logos/README.md — the single record.
 */
export type LabMark = {
  /** Site-relative path under static/img/model-logos. */
  src: string;
  /** Luminance mask, when a silhouette must keep internal geometry. */
  luminance?: boolean;
  /** Direct rendering, only for compound official artwork a mask would destroy. */
  mode?: 'image';
  imageTone?: 'foreground';
  darkImageTone?: 'lift';
};

const MARKS: Record<string, LabMark> = {
  Alibaba: { src: '/img/model-logos/alibaba.svg' },
  Cloudflare: { src: '/img/model-logos/cloudflare.svg' },
  DeepSeek: { src: '/img/model-logos/deepseek.svg' },
  Google: { src: '/img/model-logos/google.svg' },
  Meta: { src: '/img/model-logos/meta.svg' },
  Mistral: { src: '/img/model-logos/mistral.svg' },
  Moonshot: { src: '/img/model-logos/moonshot.svg' },
  'Nous Research': { src: '/img/model-logos/nous.svg' },
  NVIDIA: { src: '/img/model-logos/nvidia.svg' },
  OpenBMB: { src: '/img/model-logos/openbmb.svg' },
  OpenAI: { src: '/img/model-logos/openai.svg' },
  Poolside: { src: '/img/model-logos/poolside.svg' },
  'Reflection AI': { src: '/img/model-logos/reflection-ai.svg' },
  Ricursive: { src: '/img/model-logos/ricursive.svg' },
  Tencent: { src: '/img/model-logos/tencent.svg', mode: 'image' },
  'Z.ai': {
    src: '/img/model-logos/z-ai.svg',
    mode: 'image',
    darkImageTone: 'lift',
  },
};

/** Exported for the guard test: every entry must be a lab the dataset names. */
export const LAB_MARKS: readonly (readonly [string, LabMark])[] =
  Object.entries(MARKS);

export const markOf = (lab: string): LabMark | null => MARKS[lab] ?? null;
