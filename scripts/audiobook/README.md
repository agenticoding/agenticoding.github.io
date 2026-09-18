# Audiobook audio pipeline — Gemini TTS runbook

Turns the book's Markdown/MDX into two-speaker narrated MP3s with per-segment timestamps, using
**Gemini TTS** (`gemini-2.5-pro-preview-tts`) and **Gemini ASR** (`gemini-3.5-transcribe`).
The shipped edition is dialogue-only: every chapter is a two-speaker conversation authored per
`DIALOGUE_GUIDE.md`.

```
dialogue/<id>.json ─→ render ─→ master ─→ verify ─→ encode ─→ manifest.json + <id>.mp3
```

Everything is local-only, human-triggered tooling. Nothing here runs in CI or ships with the
website build; it only writes files under `website/audio/` and `website/static/audio/`.

## Sources of truth

- `website/docs/*.mdx` plus `website/chapters.ts` (ordering) remain canonical; the audio
  legitimately lags the text.
- **Markdown headings only.** Docusaurus's `doc.toc` and the dialogue extractor both read the
  markdown AST, so a JSX-rendered heading is invisible to both. Components must never render
  `<h1..6>` or `<Heading as="hN">`; figure and card titles are captions (`<p>`/`<figcaption>`).
  Enforced by `website/src/navigation/docHeadingContract.test.ts`; see `DIALOGUE_GUIDE.md`
  "Structure mapping".
- Figures and code blocks each gain a required, audio-only `narration` — a plain-string prop on
  figure components, `narration="..."` in the fence meta for code. It is the long-form spoken
  explanation of what is shown and is never rendered.
- Figures backed by `*Model.ts` data derive their spoken sentences from that data, so spoken
  numbers cannot drift from drawn numbers.

## Requirements

- Node 24 (native `.ts` execution; the stages import `website/src/audiobook/*.ts` directly).
- `ffmpeg` / `ffprobe` on `PATH`.
- `GEMINI_API_KEY` in the environment for `--build` and `--verify`.
  - The exported `GOOGLE_API_KEY` is **not** a valid Gemini key (it is a Custom Search key) — do not use it.
  - Never commit the key, never add it to CI. `--list`, `--lint` and `--source` need no key.
- `@google/genai` is installed under `scripts/` (the pipeline runs from `scripts/`).

## Commands

Run from `website/`:

```
npm run audio:list            -- [--all | --chapter <id>] # status table, no network
npm run audio:dialogue:lint   -- --chapter <id>           # structure + drift + chunk cap
npm run audio:dialogue:source -- --chapter <id>           # canonical blocks + critical terms
npm run audio:build           -- (--chapter <id> | --all) [--dry-run] [--force]
npm run audio:verify          -- (--chapter <id> | --all)
```

`--dry-run` prints the cache plan (hits/misses, character count) without network or writes.
`--force` re-renders even cached chunks. `--all` skips chapters without a committed dialogue script
(audio lags the text) and isolates failures per chapter.

## Configuration (single source of truth)

`website/src/audiobook/config.ts` (`AUDIO_CONFIG`) holds every knob that changes rendered audio; the
cache key is derived from it, so changing one value re-renders affected audio instead of mixing takes.

- **Model** `gemini-2.5-pro-preview-tts`; **ASR** `gemini-3.5-transcribe`.
- **Dialogue voices** `alex: Kore` (instructor), `sam: Charon` (senior engineer) — the historic host
  personas (voice *names*, from the 30 Gemini prebuilt voices — `assertRenderConfig` rejects anything
  else).
- **Dialogue chunk cap** 3500 chars: the alignment ASR takes inline audio (~20 MB), so a chunk must fit.
- **Encode** 44.1 kHz mono 64 kbps MP3. Source PCM is raw 24 kHz/16-bit/mono.

### Gates (`AUDIO_CONFIG.gates`)

A chapter is only encoded when every gate passes; `--verify` re-checks cached audio without re-encoding.

| Gate | Value | Scope |
| --- | --- | --- |
| WER vs. ASR | ≤ `0.1` | per dialogue chunk |
| Critical terms (numbers, acronyms, identifiers, flags) | all present | per dialogue chunk |
| Integrated loudness | window `−25..−18` dB | chapter |
| True peak | ≤ `-3` dBFS | chunk and chapter |
| Segment RMS floor | ≥ `-45` dB | chunk (catches truncated/empty takes) |

Loudness is a **window with a ceiling**, not a ± target: a fixed target and the true-peak ceiling are
jointly unsatisfiable for this material, so the master holds a single scalar gain under both ceilings
(`lufsMinDb`/`lufsMaxDb` in `config.ts`). WER comes from a fresh `gemini-3.5-transcribe` transcript,
never forced alignment — alignment forces the known text onto the audio, so it can never reveal a
substitution.

## Stages

- **render**: one Gemini `generateContent` call per dialogue chunk, cached under the frozen key. Sends
  the raw `Alex:`/`Sam:` transcript — turns joined by a blank line, labels from `roleLabel` — with
  `multiSpeakerVoiceConfig`. There is no pace/delivery directive: the model's natural, energetic
  delivery is preferred (a "measured/unhurried" instruction reads as sluggish). Audio arrives as base64
  PCM in `inlineData`; `short`/`max_tokens` truncation is a hard error, never a cached "complete" take.
- **master**: raw TTS is hot (true peaks near 0 dBFS), so the chapter is normalized once — EBU R128
  measurement, then a single scalar `volume` gain held under both the true-peak ceiling and the book's
  loudness ceiling, each targeted half a dB under its gate. Chunk spans are byte offsets, so
  normalization must not change the length.
- **verify**: per chunk, `transcribe` (no word timestamps) → WER + critical terms, plus
  `ebur128`/`astats` loudness/peak/RMS; the chapter carries the integrated-loudness gate.
- **encode**: `libmp3lame` → `static/audio/<id>.mp3` with ID3v2.3 chapters per heading section, then the
  manifest entry (`marks` = one per segment; the player resolves each anchor at runtime).

Dialogue chapters additionally run `transcribe` **with** `wordTimestamp: true` during render, align the
ASR words back onto the turn texts (`align.ts`), and cache the resulting turn boundaries so the chunk can
be sliced into per-turn PCM for marks. Word timestamps degrade ASR accuracy, so the WER pass never asks
for them.

## Artifacts

```
website/audio/dialogue/<id>.json    committed two-speaker script
website/audio/.cache/<key>.pcm      gitignored raw PCM take
website/audio/.cache/<key>.json     gitignored request (+ ASR words/boundaries for dialogue)
website/audio/.cache/report-<id>.json  gitignored verification report
website/static/audio/<id>.mp3       published audio
website/static/audio/manifest.json  published model/voices/loudness/marks per chapter
```

PCM is written **last** so its presence marks the entry cached. A cache key covers the turns (speaker +
text) + TTS model + ASR model + voices; an unchanged take is never paid for twice.

## Dialogue scripts

Every chapter takes the dialogue path; a chapter without a committed
`website/audio/dialogue/<id>.json` cannot be rendered. The dialogue shape, roles, anchors and authoring
rules are in `DIALOGUE_GUIDE.md`.

## Cost

Gemini prices TTS audio output at 25 tokens/s of audio (≈90k tokens per audio-hour) and Pro has **no free
tier**: roughly **$1.80 per audio-hour** for TTS, plus ASR at ~$0.003/min. `--dry-run` reports the
not-cached character count before you spend anything. `--all` renders the whole book from scratch and
runs for hours — verify a chapter first, then launch it deliberately.

## Known limitations

- **TTS is non-deterministic** (no `seed`). The cache freezes one take; verification occasionally catches
  a real pronunciation flake (e.g. "coding" → "coating"). `--build` already re-rolls: a chunk that fails
  the gate has its cache entry dropped and is re-rendered, up to 3 attempts per chapter — a chapter that
  still fails is reported, never encoded. `--force` re-renders **every chunk of the chapter** (it is not
  per-segment); to redo a single take, delete its `.pcm`/`.json` cache entry and re-run `--build`.
- The transcribe inline-audio ceiling (~20 MB) is why dialogue chunks are capped; both the chunk cap and
  the TTS `finishReason` guard are enforced, not assumed.
