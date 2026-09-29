import { AUDIO_CONFIG } from './config.ts';
import type { ChapterMeta } from './docs.ts';
import type { Block } from './extract.ts';
import type { DialogueFile } from './dialogueTypes.ts';
import { criticalTerms, missingCriticalTerms, normalizeForWer } from './wer.ts';

export function validateDialogue(id: string, data: DialogueFile): string[] {
  const problems: string[] = [];
  const roles = new Set<string>(Object.keys(AUDIO_CONFIG.speakers));
  if (data.chapterId !== id)
    problems.push(`chapterId "${data.chapterId}" does not match "${id}"`);
  if (!data.turns.length) problems.push('no turns');
  data.turns.forEach((turn, index) => {
    const where = `${id}#${turn.id ?? index + 1}`;
    if (turn.id !== `t${index + 1}`)
      problems.push(`${where}: id must be sequential (t1..tn)`);
    if (!turn.text?.trim()) problems.push(`${where}: empty text`);
    if (!roles.has(turn.speaker))
      problems.push(`${where}: unknown speaker "${turn.speaker}"`);
  });
  return problems;
}

/** Prose blocks grouped by the heading they sit under (null = before any heading). */
function proseGroups(meta: ChapterMeta): Map<string | null, Block[]> {
  const groups = new Map<string | null, Block[]>();
  for (const block of meta.blocks) {
    if (block.kind !== 'prose' || block.anchor.kind !== 'heading') continue;
    groups.set(block.anchor.id, [
      ...(groups.get(block.anchor.id) ?? []),
      block,
    ]);
  }
  return groups;
}

/** Shared with `dialogueLexical.ts`: the human label a redundancy line reports. */
export const sectionTitle = (
  meta: ChapterMeta,
  anchorId: string | null
): string =>
  meta.headings.find((heading) => heading.id === anchorId)?.title ??
  String(anchorId);

const headingTurnIds = (data: DialogueFile): Set<string | null> =>
  new Set(
    data.turns.flatMap((turn) =>
      turn.anchor.kind === 'heading' ? [turn.anchor.id] : []
    )
  );

const headingTurnChars = (
  anchorId: string | null,
  data: DialogueFile
): number =>
  data.turns
    .filter(
      (turn) => turn.anchor.kind === 'heading' && turn.anchor.id === anchorId
    )
    .reduce((sum, turn) => sum + turn.text.length, 0);

const blockFigureIndexes = (meta: ChapterMeta): number[] =>
  meta.blocks.flatMap((block) =>
    block.kind === 'figure' && block.anchor.kind === 'figure'
      ? [block.anchor.index]
      : []
  );

const blockCodeIndexes = (meta: ChapterMeta): number[] =>
  meta.blocks.flatMap((block) =>
    block.kind === 'code' && block.anchor.kind === 'code'
      ? [block.anchor.index]
      : []
  );

const turnFigureIndexes = (data: DialogueFile): number[] =>
  data.turns.flatMap((turn) =>
    turn.anchor.kind === 'figure' ? [turn.anchor.index] : []
  );

const turnCodeIndexes = (data: DialogueFile): number[] =>
  data.turns.flatMap((turn) =>
    turn.anchor.kind === 'code' ? [turn.anchor.index] : []
  );

function uncovered(
  source: number[],
  covered: number[],
  report: (index: number) => string
): string[] {
  const seen = new Set(covered);
  return source.filter((index) => !seen.has(index)).map(report);
}

function coverageProblems(
  id: string,
  meta: ChapterMeta,
  data: DialogueFile
): string[] {
  const covered = headingTurnIds(data);
  const prose = [...proseGroups(meta)]
    .filter(([anchorId]) => !covered.has(anchorId))
    .map(
      ([anchorId, blocks]) =>
        `${id}: source section "${sectionTitle(meta, anchorId)}" (${blocks.length} prose block(s)) has no covering turn`
    );
  return [
    ...prose,
    ...uncovered(
      blockFigureIndexes(meta),
      turnFigureIndexes(data),
      (index) => `${id}: source figure ${index} has no covering turn`
    ),
    ...uncovered(
      blockCodeIndexes(meta),
      turnCodeIndexes(data),
      (index) => `${id}: source code block ${index} has no covering turn`
    ),
  ];
}

/**
 * Declared literals the voice may describe instead of speak. Fatal validation:
 * each entry must name an actual critical term of the chapter source and carry
 * a non-empty reason — otherwise an author could hide a semantic
 * number/identifier/flag from the voice. Returns the exempted terms plus violations.
 */
function describedExemption(
  id: string,
  sourceTerms: Set<string>,
  data: DialogueFile
): { exempt: Set<string>; problems: string[] } {
  const exempt = new Set<string>();
  const problems: string[] = [];
  for (const entry of data.describedLiterals ?? []) {
    if (!entry.reason?.trim()) {
      problems.push(
        `${id}: describedLiterals "${entry.term}" needs a non-empty reason`
      );
      continue;
    }
    if (!sourceTerms.has(entry.term)) {
      problems.push(
        `${id}: describedLiterals "${entry.term}" is not a critical term of the chapter source`
      );
      continue;
    }
    exempt.add(entry.term);
  }
  return { exempt, problems };
}

/**
 * Author-declared terms the pattern classifier cannot see (plain words, quoted
 * examples). Fatal: each must be a genuine addition — present in the source, with
 * a reason, and not already auto-critical. Otherwise the declaration is stale or
 * restates a rule that already exists.
 */
function declaredTermProblems(
  id: string,
  source: string,
  autoTerms: Set<string>,
  data: DialogueFile
): { term: string; message: string }[] {
  const sourcePhrase = ` ${normalizeForWer(source)} `;
  const auto = new Set([...autoTerms].map(normalizeForWer));
  return (data.declaredCriticalTerms ?? []).flatMap((entry) => {
    const term = normalizeForWer(entry.term);
    if (!entry.reason?.trim())
      return [
        {
          term: entry.term,
          message: `${id}: declaredCriticalTerms "${entry.term}" needs a non-empty reason`,
        },
      ];
    if (!term || !sourcePhrase.includes(` ${term} `))
      return [
        {
          term: entry.term,
          message: `${id}: declaredCriticalTerms "${entry.term}" is not a word of the chapter source`,
        },
      ];
    if (auto.has(term))
      return [
        {
          term: entry.term,
          message: `${id}: declaredCriticalTerms "${entry.term}" is already an auto-classified critical term`,
        },
      ];
    return [];
  });
}

function termProblems(
  id: string,
  meta: ChapterMeta,
  data: DialogueFile
): string[] {
  const source = meta.blocks.map((block) => block.text).join(' ');
  const spoken = data.turns.map((turn) => turn.text).join(' ');
  const auto = new Set(criticalTerms(source));
  const { exempt, problems } = describedExemption(id, auto, data);
  const declared = data.declaredCriticalTerms ?? [];
  const declaredProblems = declaredTermProblems(id, source, auto, data);
  // Terms already flagged invalid don't also produce a spurious
  // "missing from dialogue turns" error.
  const invalidDeclaredTerms = new Set(declaredProblems.map((p) => p.term));
  const validDeclaredTerms = declared
    .filter((entry) => !invalidDeclaredTerms.has(entry.term))
    .map((entry) => entry.term);
  return [
    ...problems,
    ...declaredProblems.map((p) => p.message),
    ...missingCriticalTerms(source, spoken, validDeclaredTerms)
      .filter((term) => !exempt.has(term))
      .map(
        (term) => `${id}: critical term "${term}" missing from dialogue turns`
      ),
  ];
}

/** Hard coverage: every source section, figure and code block must be spoken, and
    every critical term must survive. This is what catches authored invention. */
export const dialogueCoverageProblems = (
  id: string,
  meta: ChapterMeta,
  data: DialogueFile
): string[] => [
  ...coverageProblems(id, meta, data),
  ...termProblems(id, meta, data),
];

/** Non-fatal: a section whose turns balloon far past its source text reads as invented. */
export function dialogueBloatWarnings(
  meta: ChapterMeta,
  data: DialogueFile
): string[] {
  return [...proseGroups(meta)].flatMap(([anchorId, blocks]) => {
    const sourceChars = Math.max(
      1,
      blocks.reduce((sum, block) => sum + block.text.length, 0)
    );
    const spokenChars = headingTurnChars(anchorId, data);
    const cap = Math.max(1200, 3 * sourceChars);
    return spokenChars > cap
      ? [
          `section "${sectionTitle(meta, anchorId)}": ${spokenChars} spoken chars vs ${sourceChars} source chars (cap ${cap})`,
        ]
      : [];
  });
}
