#!/usr/bin/env node
/**
 * Single entry point for the local-only audio stages.
 *
 * Every chapter is a two-speaker dialogue: its only source is the committed
 * `audio/dialogue/<id>.json`. One arg parser and one code path serves one chapter
 * or all of them; `--all` isolates failures per chapter so a single bad document
 * cannot stop the run. Everything here is human-triggered: `--list`, `--lint` and
 * `--source` need no credentials, TTS/verify require GEMINI_API_KEY (D7).
 */
import { AUDIO_CONFIG, assertRenderConfig } from '../../website/src/audiobook/config.ts';
import { AUDIO_DOC_IDS, chapterMeta } from '../../website/src/audiobook/docs.ts';
import {
  chunkTurns,
  dialogueBloatWarnings,
  hardViolations,
  isDialogueChapter,
  isDriftViolation,
  loadDialogue,
  loadDialogueFile,
  narrationOverlapWarnings,
} from '../../website/src/audiobook/dialogue.ts';
import { criticalTerms } from '../../website/src/audiobook/wer.ts';
import { dialogueStream, chunkState, discardChunk, printDialoguePlan } from './dialogue.mjs';
import { encodeChapter } from './encode.mjs';
import { masterStream } from './master.mjs';
import { CACHE_DIR, chapterMp3, exists, log, MANIFEST_FILE, readJsonIfExists, requireApiKey, seconds, table, warn } from './report.mjs';
import { printVerification, verifyChapter, verifyProblems } from './verify.mjs';

const COMMANDS = { '--build': 'build', '--verify': 'verify', '--list': 'list', '--lint': 'lint', '--source': 'source' };

const USAGE = `usage:
  audio:list   [--chapter <id> | --all]
  audio:build  (--chapter <id> | --all) [--dry-run] [--force]
  audio:verify (--chapter <id> | --all)
  audio:lint   (--chapter <id> | --all)
  audio:source --chapter <id>`;

function parseArgs(argv) {
  const options = { command: null, ids: [], all: false, force: false, dryRun: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--chapter') {
      const id = argv[(index += 1)];
      if (id === undefined) throw new Error('missing value for --chapter');
      options.ids.push(id);
    } else if (arg in COMMANDS) options.command = COMMANDS[arg];
    else if (arg === '--all') options.all = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`unknown argument "${arg}"`);
  }
  return options;
}

/** `--force` and `--dry-run` only describe a build; elsewhere they would be silently ignored. */
function checkFlags(options) {
  if (options.dryRun && options.command !== 'build') throw new Error('--dry-run applies to --build only');
  if (options.force && options.command !== 'build') throw new Error('--force applies to --build only');
}

/** Validates the chapter ids once, for every command, so no stage re-checks them. */
function scopeOf(options) {
  if (!options.command) throw new Error('no command given');
  const unknown = options.ids.filter((id) => !AUDIO_DOC_IDS.includes(id));
  if (unknown.length) throw new Error(`unknown chapter(s): ${unknown.join(', ')}`);
  if (options.all) return [...AUDIO_DOC_IDS];
  if (options.ids.length) return options.ids;
  if (options.command === 'list') return [...AUDIO_DOC_IDS];
  throw new Error(`--${options.command} needs --chapter <id> or --all`);
}

/** A committed `audio/dialogue/<id>.json` is the only source of a chapter's audio. */
function loadChapter(id) {
  if (!isDialogueChapter(id)) throw new Error(`no dialogue script for ${id} — author website/audio/dialogue/${id}.json`);
  return loadDialogue(id);
}

const renderedState = (audio, id) => (audio && exists(chapterMp3(id)) ? 'yes' : '-');
const drifted = (loaded) => loaded.violations.some(isDriftViolation);

/** Staleness is reported, never repaired: audio legitimately lags the text. */
function listRow(id, audio, script, drift) {
  const stale = drift ? 'DRIFT' : audio ? (audio.narrationHash === script.contentHash ? 'ok' : 'STALE') : '-';
  return [id, script.segments.length, script.contentHash.slice(0, 8), renderedState(audio, id), stale, audio ? seconds(audio.durationMs) : '-', audio ? audio.marks.length : '-'];
}

/** An unauthored chapter has no script: list it as UNAUTHORED instead of crashing. */
function listChapters(ids) {
  const chapters = readJsonIfExists(MANIFEST_FILE)?.chapters ?? {};
  const violations = [];
  const rows = ids.map((id) => {
    try {
      const loaded = loadChapter(id);
      violations.push(...loaded.violations);
      return listRow(id, chapters[id], loaded.script, drifted(loaded));
    } catch {
      return [id, '-', '-', '-', 'UNAUTHORED', '-', '-'];
    }
  });
  console.log(table(['chapter', 'segs', 'hash', 'rendered', 'stale', 'duration', 'marks'], rows));
  const written = Object.keys(chapters).length;
  log('list', `${ids.length} chapters, ${written} published, cache ${exists(CACHE_DIR) ? 'present' : 'empty'}`);
  violations.forEach((violation) => warn('list', violation));
}

/**
 * Render attempts per chapter. Gemini TTS has no seed, so a take can
 * non-deterministically mispronounce a word and fail the WER gate; re-rolling a
 * failed unit replaces the determinism the old provider's seed used to provide.
 */
const MAX_RENDER_ATTEMPTS = 3;

/** Unit ids the latest verification failed (dialogue chunk ids `cN`). */
const failingUnitIds = (report) =>
  new Set(report.segments.filter((segment) => segment.problems.length).map((segment) => segment.segmentId));

/** Drops the cached takes of failed chunks so the next attempt re-renders only them. */
function discardUnits(script, ids) {
  chunkTurns(script.segments, AUDIO_CONFIG.dialogue.maxChunkChars).forEach((turns, index) => {
    if (ids.has(`c${index + 1}`)) discardChunk(turns);
  });
}

/** Stream → master → verify, with the verification table printed: the one pass both build and verify run. */
async function verifyMastered(script, options) {
  const stream = await dialogueStream(script, options);
  const mastered = masterStream(stream);
  const report = await verifyChapter(script, mastered);
  printVerification(script, report);
  return { mastered, report, problems: verifyProblems(report).map((problem) => `${script.chapterId}#${problem}`) };
}

/** One render → master → verify pass; encodes on success, else reports the gate failures. */
async function renderAttempt(script, options) {
  const { mastered, report, problems } = await verifyMastered(script, options);
  if (problems.length) return { report, failures: problems };
  const entry = encodeChapter(script, report, mastered);
  log('encode', `${script.chapterId}: ${seconds(entry.durationMs)}, ${entry.marks.length} marks → ${entry.file}`);
  return { failures: [] };
}

/** Build: render → master → verify → encode. No gate failure may be encoded. */
async function build(script, options) {
  for (let attempt = 1; ; attempt += 1) {
    const result = await renderAttempt(script, options);
    if (!result.failures?.length) return [];
    const failed = failingUnitIds(result.report);
    if (!failed.size || attempt >= MAX_RENDER_ATTEMPTS) {
      return result.failures.map((problem) => `${script.chapterId}#${problem} (not encoded)`);
    }
    warn('build', `${script.chapterId}: gate failed, re-rolling ${failed.size} unit(s) (attempt ${attempt + 1}/${MAX_RENDER_ATTEMPTS})`);
    discardUnits(script, failed);
  }
}

/**
 * A cache miss here is a paid TTS render — verification must never be free to
 * accidentally spend money, so every miss is announced before it happens.
 */
function announcePaidRenders(script) {
  const chunks = chunkTurns(script.segments, AUDIO_CONFIG.dialogue.maxChunkChars);
  const misses = chunks.filter((turns) => !chunkState(turns).hit).length;
  if (misses) log('verify', `${script.chapterId}: ${misses} cache miss(es) → ${misses} paid TTS render(s)`);
}

async function verifyOnly(script) {
  announcePaidRenders(script);
  const { problems } = await verifyMastered(script);
  return problems;
}

/** Chunks over the API cap are a hard failure: an over-long request is malformed. */
function chunkProblems(chunks) {
  return chunks.flatMap((turns, index) => {
    const chars = turns.reduce((sum, turn) => sum + turn.text.length, 0);
    return chars > AUDIO_CONFIG.dialogue.maxChunkChars ? [`chunk c${index + 1}: ${chars} chars over the ${AUDIO_CONFIG.dialogue.maxChunkChars} cap`] : [];
  });
}

/** The dialogue library prefixes its violations with the chapter id; stage-local problems need it added. */
const withId = (id, problem) => (problem.startsWith(`${id}:`) ? problem : `${id}: ${problem}`);

/**
 * Dialogue lint: extraction + structural/term coverage + drift + chunk cap are
 * hard failures (they mean the script is not the source); section bloat is a
 * WARN line that does not fail.
 */
function lintDialogue(id, loaded) {
  const chunks = chunkTurns(loaded.script.segments, AUDIO_CONFIG.dialogue.maxChunkChars);
  const problems = [...loaded.violations, ...chunkProblems(chunks)];
  dialogueBloatWarnings(chapterMeta(id), loadDialogueFile(id)).forEach((warning) => warn('lint', `WARN  ${warning}`));
  log('lint', `${id}: ${problems.length} problem(s) across ${loaded.script.segments.length} turns in ${chunks.length} chunk(s)`);
  // Problems are not echoed here: `main` prints every chapter problem once as `FAIL` lines.
  return problems.map((problem) => withId(id, problem));
}

/** Canonical authoring source: the exact blocks and terms lint will enforce. */
function printSource(id) {
  const meta = chapterMeta(id);
  console.log(`chapter ${id}: ${meta.title}`);
  meta.headings.forEach((heading) => console.log(`  heading ${heading.id} → ${heading.title}`));
  meta.blocks.forEach((block, index) => console.log(`  block ${index} ${block.kind} ${JSON.stringify(block.anchor)} ${block.text}`));
  console.log(`  criticalTerms ${[...new Set(criticalTerms(meta.blocks.map((block) => block.text).join(' ')))].join(', ')}`);
  narrationOverlapWarnings(meta).forEach((warning) => warn('source', `WARN  ${warning}`));
}

async function runChapter(id, options) {
  const loaded = loadChapter(id);
  if (options.command === 'lint') return lintDialogue(id, loaded);
  loaded.violations.forEach((violation) => warn('dialogue', violation));
  // A hard violation means the script is not the source: never spend a render on it.
  const hard = hardViolations(loaded.violations);
  if (hard.length) return hard.map((violation) => `${withId(id, violation)} (not rendered)`);
  if (options.command === 'verify') return verifyOnly(loaded.script);
  if (options.dryRun) {
    printDialoguePlan(loaded.script, options);
    return [];
  }
  return build(loaded.script, options);
}

/** Per-chapter isolation: one failing document never stops the rest (design). */
async function runAll(ids, options) {
  const problems = [];
  for (const id of ids) {
    try {
      problems.push(...(await runChapter(id, options)));
    } catch (error) {
      problems.push(`${id}: ${error.message}`);
    }
  }
  return problems;
}

/** Fail once with one clear message, instead of once per chapter. */
function preflight(options) {
  if (options.dryRun || options.command === 'lint') return; // the plan and lint need no key
  requireApiKey();
  if (options.command === 'build') assertRenderConfig();
}

const fail = (message, code) => {
  console.error(message);
  process.exitCode = code;
};

function resolve(argv) {
  const options = parseArgs(argv);
  if (options.help) return { options, ids: [] };
  checkFlags(options);
  return { options, ids: scopeOf(options) };
}

/** `--help` and usage errors are not failures: help exits 0, a bad invocation exits 2. */
function resolveOrExit(argv) {
  try {
    return resolve(argv);
  } catch (error) {
    fail(`${USAGE}\n\n${error.message}`, 2);
    return undefined;
  }
}

function preflightOrExit(options) {
  try {
    preflight(options);
    return true;
  } catch (error) {
    fail(error.message, 1);
    return false;
  }
}

/**
 * `--all` build/verify skips chapters without a committed dialogue script instead
 * of failing them one by one: audio legitimately lags the text, so an unauthored
 * chapter is not an error. An explicitly named unauthored chapter still fails loudly
 * in `loadChapter`. The skip is announced, never silent.
 */
function authoredScope(run) {
  if (run.options.command !== 'build' && run.options.command !== 'verify') return run.ids;
  const authored = run.ids.filter(isDialogueChapter);
  const skipped = run.ids.length - authored.length;
  if (skipped) log(run.options.command, `skipping ${skipped} unauthored chapter(s)`);
  return authored;
}

async function main() {
  const run = resolveOrExit(process.argv.slice(2));
  if (!run) return;
  if (run.options.help) {
    console.log(USAGE);
    return;
  }
  if (run.options.command === 'list') return listChapters(run.ids);
  if (run.options.command === 'source') return run.ids.forEach(printSource);
  if (!preflightOrExit(run.options)) return;
  const problems = await runAll(authoredScope(run), run.options);
  problems.forEach((problem) => console.error(`FAIL  ${problem}`));
  if (problems.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
