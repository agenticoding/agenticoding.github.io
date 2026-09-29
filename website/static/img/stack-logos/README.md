# Stack Logos

Product marks for the tools in the Tic-Tac-Toe exercise's recommended stack
(`website/docs/exercises/tic-tac-toe/overview.md`). Rendered by
`website/src/components/VisualElements/ToolMark.tsx` as monochrome CSS masks
(`background: var(--text-heading)`), so every mark stays achromatic per the
design system.

The pi mark is not duplicated here — it lives in `../cli-agent-logos/pi.svg`
and is used for the harness itself (`pi`).

| File                | Product       | Source (official)                                                                                       | Adaptation                                                                                                    |
| ------------------- | ------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `pi-schematic.svg`  | pi-schematic  | `pi-schematic-rebrand/assets/s-mono.svg` (pi-schematic brand assets)                                    | Verbatim                                                                                                      |
| `mcp.svg`           | MCP           | Model Context Protocol logo (`model-context-protocol-logo.svg`)                                         | MCP glyph (three stroked paths) extracted from the wordmark; tight viewBox                                    |
| `chunkhound.svg`    | ChunkHound    | `https://chunkhound.ai/logo.svg` (icon-only hound)                                                      | Added `fill="currentColor"`; geometry verbatim                                                                |
| `agent-browser.svg` | agent-browser | `https://agent-browser.dev/favicon.ico` (256px frame: filled circle with an upward triangular knockout) | Reconstructed as a single even-odd path so CSS masking yields the knockout; proportions traced from the frame |

Logos are trademarks of their respective owners; fetched 2026-08-13.
