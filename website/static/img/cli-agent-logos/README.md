# CLI Agent Logos

Official logo marks for the six CLI coding agents covered in
`website/developer-tools/cli-coding-agents.md`. Rendered by
`website/src/components/VisualElements/ToolMark.tsx` as monochrome CSS masks
(`background: var(--text-heading)`). OpenCode is the exception: its two-tone
mark is rendered as an image because flattening its internal contrast makes the
logo unrecognizable.

| File                     | Product                 | Source (official)                                                                                                              | Adaptation                                                      |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `pi.svg`                 | pi                      | Inline `.pi-logo-mark` SVG from https://pi.dev                                                                                 | Geometry verbatim                                               |
| `opencode.svg`           | OpenCode                | https://github.com/anomalyco/opencode (`packages/console/app/src/asset/brand/opencode-logo-light-square.svg`, `dev` branch)    | Unwrapped mask/clip; two-tone fills preserved; rendered as image; `opencode-dark.svg` supplies dark-theme contrast |
| `codex.svg`              | Codex (OpenAI)          | Header logo SVG from https://developers.openai.com/codex                                                                       | Geometry verbatim                                               |
| `claude-code.svg`        | Claude Code (Anthropic) | https://claude.com/favicon.svg (Claude starburst mark)                                                                         | Fill flattened from `#D97757`                                   |
| `antigravity.svg`        | Antigravity CLI (Google) | https://antigravity.google/assets/image/antigravity-logo.png                                                                  | Official standalone gradient PNG traced to a solid silhouette and normalized to a square viewBox |
| `github-copilot-cli.svg` | GitHub Copilot CLI      | https://github.com/primer/octicons (`icons/copilot-24.svg`, `main` branch)                                                     | Geometry verbatim                                               |

Logos are trademarks of their respective owners; fetched 2026-08-12.
