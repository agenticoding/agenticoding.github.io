# Audiobook Publishing Design

> Human-in-the-loop design checkpoint for adding an optional audio edition to the existing book.

## Objective

Publish a useful audiobook without turning audio production into a release constraint for the written book. Text remains the canonical edition. Audio is a manually produced derivative that may be incomplete or temporarily lag behind the text.

## Scope

- **Initial pilot:** `prompting-101.mdx`.
- **Book release:** introduction, nine chapters, and About in the order defined by `website/chapters.ts`.
- **Deferred:** `website/developer-tools/` as optional appendices.
- **Narration:** one primary narrator using `gemini-2.5-pro-preview-tts`.
- **Delivery format:** MP3 files served with the GitHub Pages website.

## Decisions

1. `website/docs/*.{md,mdx}` remains the canonical book; `website/chapters.ts` remains its ordering authority.
2. Audio does not need to update in the same commit as text. Missing or stale audio is acceptable.
3. Gemini generation happens only in a human-operated environment. It can take time, costs tokens, and requires credentials that are unavailable to CI.
4. Long chapters may be generated in smaller working sections to limit model drift. The working files are assembled and encoded locally into the final MP3.
5. A human listens to the exact final MP3 before committing it. The commit is the acceptance record; there is no separate approval system.
6. Final MP3s are committed directly to the repository. WAV files, Git LFS, manifests, content hashes, and hash-addressed storage are unnecessary.
7. Files use stable, human-readable chapter paths, for example:

   ```text
   website/static/audio/introduction.mp3
   website/static/audio/how-llms-work.mp3
   website/static/audio/prompting-101.mp3
   ```

8. The existing website build bundles whichever MP3s are committed. CI does not generate audio, verify text/audio synchronization, or require a Gemini API key.
9. Audio cross-references use chapter titles rather than numbers because numbering currently differs between ordering metadata and prose.

## Repository impact

### Add

- Committed chapter MP3s under `website/static/audio/`.
- A small local generation workflow or script for Gemini calls, chapter assembly, and MP3 encoding.
- Versioned production guidance for the narrator, model, director prompt, pronunciations, and encoding settings.
- An optional audio-player association for each chapter that currently has an MP3.

### Change

- Adapt figures, interactives, tables, prompts, and substantial code into concise spoken explanations during audio production.
- Show audio controls only where a committed chapter file exists.
- Disclose that the audio edition may lag behind the written edition.

### Remove

- Nothing from the canonical book.
- From narration only: raw URLs, decorative visual detail, exhaustive reference data, and line-by-line code syntax. Essential meaning stays in the narration; full detail remains on the website.

## Production workflow

1. Choose a chapter whose current text is worth recording.
2. Prepare narration from the chapter, translating visual and reference-heavy material into spoken meaning.
3. Generate manageable sections with Gemini in a credentialed local environment.
4. Assemble the selected sections and encode the chapter as MP3 using the documented settings.
5. Listen to the exact final MP3 end to end, correcting generation, joins, pronunciation, pacing, or encoding issues as needed.
6. Save it at the chapter’s human-readable path and commit it with any related player metadata.
7. Regenerate it later when the value of updating it justifies the time and model cost.

Temporary generations and rejected candidates stay outside the repository. The committed MP3 is the durable result of the expensive generation and listening work.

## Website deployment

The ordinary Docusaurus/GitHub Pages pipeline handles audio as static content:

```text
committed website/static/audio/*.mp3
  -> existing website build
  -> GitHub Pages artifact
  -> browser audio player
```

The deployment performs no TTS generation and needs no Gemini credentials. A clean checkout already contains every audio byte it can publish. Chapters without committed audio remain fully usable as written content.

## Consistency model

Audio is eventually consistent with the book by design:

- a text-only commit is valid;
- an audio-only update is valid;
- an old MP3 may remain available after its chapter changes;
- a chapter may have no MP3;
- Git history records every published audio revision;
- the deployed commit identifies the exact MP3 bytes served by GitHub Pages.

This project favors low maintenance and incremental community contribution over continuous audiobook completeness.

## Pilot acceptance criteria

The `prompting-101.mdx` pilot is complete when:

- its visual, code, table, and prompt content has an understandable spoken treatment;
- the exact final MP3 has been listened to end to end;
- the MP3 is committed at `website/static/audio/prompting-101.mp3`;
- the chapter exposes a working browser audio player;
- the normal GitHub Pages build serves the MP3 without Gemini credentials;
- missing audio for every other chapter has no effect on the site build or reading experience.

## Open implementation decisions

- [ ] Choose the voice, director prompt, pronunciation guidance, and MP3 encoding settings.
- [ ] Choose the local generation and chapter-assembly tooling.
- [ ] Choose the chapter audio-player metadata and UI.
- [ ] Choose the wording and placement of the audio-edition freshness disclosure.

## Implementation checkpoint

- [ ] **Proceed with the `prompting-101.mdx` pilot using this design.**
