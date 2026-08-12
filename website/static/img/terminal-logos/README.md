# Terminal Logos

Official marks for the eight terminals covered in
`website/developer-tools/terminals.md`. `ToolMark` renders transparent
silhouettes as monochrome CSS masks (`background: var(--text-heading)`). It
renders compound/app-icon artwork directly with one image element and shared
achromatic filters, so theme changes never change logo geometry. Kitty uses a
dark-theme brightness adjustment because its official artwork is dark. iTerm2
uses the same official raster in both themes; its colors are normalized by the
shared filter rather than by a second asset, and its raster edge is replaced by
a theme-colored CSS outline for a consistent border.

| File | Product | Source (official) | Adaptation |
| --- | --- | --- | --- |
| `ghostty.svg` | Ghostty | https://github.com/ghostty-org/website (`public/ghostty-logo.svg`, `main` branch) | Geometry verbatim; luminance mask preserves the light terminal face over the opaque colored ghost body |
| `kitty.svg` | Kitty | https://github.com/kovidgoyal/kitty (`logo/kitty.svg`, `master` branch) | Geometry verbatim; direct grayscale/contrast image preserves the cat and terminal composition; dark theme lifts mid-tones (`brightness(2.1) contrast(1.15)`) |
| `wezterm.svg` | WezTerm | https://github.com/wezterm/wezterm (`assets/icon/wezterm-icon.svg`, `main` branch) | Geometry verbatim; direct grayscale/contrast image preserves the dark terminal and `$W` foreground |
| `alacritty.svg` | Alacritty | https://github.com/alacritty/alacritty (`extra/logo/alacritty-term.svg`, `master` branch) | Geometry verbatim; direct grayscale/contrast image preserves the app-icon layer relationships |
| `iterm2.png` | iTerm2 | https://github.com/gnachman/iTerm2 (`images/AppIcon.png`, `master` branch) | One official raster rendered in both themes; shared achromatic filters change presentation colors without changing the `$|` geometry; `imageFrame` supplies the theme-colored border |
| `warp.svg` | Warp | https://github.com/warpdotdev/brand-assets (`Logos/Warp-Glyph-Black@2x.svg`, `main` branch) | Geometry verbatim |
| `windows-terminal.svg` | Windows Terminal | https://github.com/microsoft/terminal (`res/terminal/Terminal.svg`, `main` branch) | Geometry verbatim; direct grayscale/contrast image preserves the app-icon layer relationships |
| `wave-terminal.svg` | Wave Terminal | https://github.com/wavetermdev/waveterm (`assets/wave-logo_icon-solid.svg`, `main` branch) | Geometry verbatim |

Logos are trademarks of their respective owners (Ghostty, Kovid Goyal, Wez
Furlong, Alacritty contributors, George Nachman, Warp Technologies Inc.,
Microsoft Corporation, Wave Terminal). Underlying project licenses: Ghostty
MIT; Kitty GPL-3.0; WezTerm MIT; Alacritty Apache-2.0; iTerm2 GPL-2.0; Warp
proprietary brand assets; Windows Terminal MIT; Wave Terminal Apache-2.0.
Fetched 2026-08-11.
