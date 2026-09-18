# Dialogue guide — authoring a two-speaker chapter

Single source of truth for how a book chapter becomes a two-speaker conversation.
The committed script is `website/audio/dialogue/<id>.json`; the audio lags it.

## Roles (fixed for the whole book)

The two hosts are the book's historic podcast personas.

| Role | Persona | Voice | Job |
| --- | --- | --- | --- |
| `alex` | Kore — instructor | `Kore` (`config.speakers.alex`) | Clear, measured, pedagogical: guides the listener, explains what to do and why, and turns each figure or code block into the idea it carries. |
| `sam` | Charon — senior engineer | `Charon` (`config.speakers.sam`) | Thoughtful: asks the clarifying question peers would ask, connects to production, challenges over-claims, **restates each beat's takeaway in their own words**. |

Roles are epistemic, not a naive-questioner act: Sam never fakes ignorance.
Voices are bound to roles in `config.ts`, never in the script, so a script is voice-agnostic.

## Authoring voice

Calibrated against the historic podcast reference: argument-driven, storytelling and analogies,
real-world trade-offs, natural flow, deep on fewer points rather than broad and shallow, professional
composure — engaging but measured. Use contractions. Preserve exact numbers, tool names and decision
criteria.

Avoid: enthusiasm and exclamations, laundry lists, dumbing down, marketing hype, circular transitions.

Delivery is *not* authored into the text. The model performs the turns with its natural, energetic
delivery — an added "measured/unhurried" directive reads as sluggish, so none is used; the WER gate
guards against any instruction leaking into the audio.

## Why two speakers (evidence, not vibes)

Holding information equal, dialogue alone does not improve comprehension — **reformulation and
challenging do**. Sam must rephrase and pressure-test, not "yes-and". Fun must be *about the
topic*: off-topic banter impairs retention (seductive-details effect). See notebook
`research-two-speaker-format`.

## Turn rules

- **Length:** setup/question turns ~5–15 s; answer turns ~20–45 s. Vary them; occasional 2-word
  reactions ("And then?", "Why?") are correct and wanted.
- **Never strict A/B/A/B monotony** across a long run: let one speaker hold the floor for 2–3 turns.
- **Restate:** every beat ends with Sam summarising the takeaway in their own words.
- **Overlap / interruption:** signalled in punctuation inside a chunk — `-` for an interruption,
  `…` for trailing off. Keep overlap short (a few hundred ms) and keep both turns in the same chunk.
- **Separate turns are separate `turns[]` entries.** Do not put two speakers in one turn's text.

## Content rules

- Write for the ear: short clauses, no visual deixis ("this diagram", "below"); contractions per
  "Authoring voice".
- Preserve precision: repeat exact identifiers and numbers; never paraphrase a critical term away.
- **Coverage is enforced (hard fail).** `audio:dialogue:lint`, `audio:build` and `audio:verify` all
  refuse a chapter whose turns leave any source prose section, figure or code block uncovered, or any
  critical term unsaid. Author from `audio:dialogue:source` output, not from memory.
- **Every figure and code block carries its own narration.** A `DiagramFrame` or `narrate` component
  (including `PromptComparison`/`PromptAnatomy`) needs a plain-string `narration="..."` prop, and a code
  fence needs `narration="..."` in its meta line. Without it the extractor emits a violation and no
  render starts — the content would otherwise be invisible to extraction, coverage and the audio.
  `PromptExample` stays silent: it is a prompt body whose meaning the surrounding prose carries.
- **Narration carries the idea, not the picture.** `narration` is audio-only; it is never rendered (the
  figure is already on the page, and accessibility lives in the component's `aria-label`). Never describe
  layout, color or position — "a gear labelled LLM", "a violet box", "a row of chips", "three panels in
  a row". A listener cannot see it, and it reads as a diagram walkthrough. Translate the figure into the
  one idea it exists to fix, in the intuitive, story language a listener can hold: why it matters and what
  it changes. The same rule governs `alex`'s figure-anchored turns.
- **Narration adds, never echoes.** A figure or code narration must carry something the prose beside it does
  not already say; restating the neighbour's definition or list makes the audio say the same thing twice.
  Paraphrase is fine — `sam` restating `alex` in different words is the format — but the wording must change,
  not only the sentence order. Lint fails any two turns in the chapter that share a ≥20-character run of content
  words (function words ignored) — a repeat is a defect wherever it sits, so a closing recap must paraphrase too —
  and `audio:dialogue:source` warns when a figure/code narration's content words are largely
  the adjacent prose's.
- Define a term on first use. Recap at the end of a section.
- Keep the chapter's own structure: opener = the stakes; each heading = one beat; recap = Sam's
  restatement. Anchor every turn to the heading it explains so the player can highlight it.

## Structure mapping

| Source | Turns |
| --- | --- |
| chapter title | one `alex` turn opening the episode |
| `opener` | `alex` states the stakes / the question |
| heading section | `alex` delivers; `sam` challenges + restates |
| figure / code | `alex` delivers the meaning the figure carries; `sam` asks what it looks like in practice |
| `recap` | `sam` restates the whole takeaway |

Heading rows exist only for markdown headings: `doc.toc` and the extractor read the markdown AST,
so a component-rendered `<h1..6>` is invisible to both. Never render heading tags from components —
see `README.md` "Sources of truth".

## Format

```jsonc
{
  "chapterId": "<doc id>",
  "sourceHash": "<sha256 of the doc source this was authored from>",
  "turns": [
    { "id": "t1", "speaker": "alex", "anchor": { "kind": "heading", "id": null }, "text": "..." }
  ]
}
```

- `speaker` is `alex` | `sam`. `id` is sequential `t1..tn`. `anchor` uses the anchor kinds
  (`heading`/`figure`/`code`) and must point at the section the turn explains.
- Audio tags (`[curious]`, `[pause]`, …) are allowed inside `text` and are stripped before WER.
- At render, the TTS text is a one-line conversation opener followed by the turns verbatim: `Alex:`/`Sam:`
  labels (from `roleLabel`) joined by a blank line — the historic podcast format, nothing else added.

## Drift guard

`sourceHash` is the hash of the chapter content the script was authored from. The build recomputes it
from the current document and **warns** (and marks the chapter `DRIFT` in `audio:list`) when they
differ — the book moved on, so re-author before publishing. Drift is a **warning** for
`audio:build`/`audio:verify` (the audio legitimately lags the text). Every other violation — missing
narration, uncovered section/figure/code, missing critical term, bad turn ids — is **fatal** to
`audio:build` and `audio:verify`; `audio:dialogue:lint` treats drift as fatal too, so it stays the
strict pre-publish gate.

## Chunking (why turns are grouped during render)

Gemini TTS has no request stitching, and the alignment ASR takes inline audio (~20 MB), so a chunk is
capped at **≤3500 chars** (`AUDIO_CONFIG.dialogue.maxChunkChars`). Turns are packed into chunks under
that cap, never splitting a turn. One request per chunk keeps cross-turn prosody; the chapter is
stitched from chunks. Verification runs per chunk (the render unit); per-turn
marks come from the chunk's ASR word timestamps and are for highlighting only.

## Workflow

```
npm run audio:dialogue:source -- --chapter <id>   # canonical blocks + critical terms to author from
npm run audio:dialogue:lint   -- --chapter <id>   # coverage + drift + chunk cap (hard fail)
npm run audio:build           -- --chapter <id> --dry-run
npm run audio:build           -- --chapter <id>   # render → master → verify → encode
```

`audio:dialogue:source` prints the extractor's canonical block list (index, kind, anchor, text) and the
`criticalTerms` over it. Author turns against that output, never from memory: structural and term
coverage are enforced, so an invented or omitted beat fails lint before any audio is rendered. Lint also
prints non-fatal `WARN` lines when a section's turns greatly exceed its source text (bloat).

Human review is the git diff on `dialogue/<id>.json` (decision: LLM draft, human approval, committed).
