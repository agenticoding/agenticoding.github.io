# Model Lab Logos

Official lab marks for the two figure tables that carry them: the self-hosting
map (`open-weight-models-nov-2026.md` dataset) and the decision models
(`open-weight-classifiers-nov-2026.md` dataset). `ToolMark` renders transparent
silhouettes as monochrome CSS masks (`background: var(--text-heading)`) —
the page carries no brand colour. Each file holds the emblem alone: marks are
painted at 18 px, where a lockup's wordmark adds only illegible fuzz. Compound
artwork whose internal geometry lives in colour relationships (Z.ai, Tencent)
is rendered directly with one image element and the shared achromatic filters
instead. A lab with no official vector is not listed here and has no file: the
tables draw its initial in a neutral tile (`FigureMark`), so the mark column
never shows a hole and never shows an unofficial redraw.

| File                | Lab            | Source (official)                                                                                                           | Adaptation                                                                                                                                                                                       |
| ------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `google.svg`        | Google         | https://www.gstatic.com/marketing-cms/assets/images/f5/d3/a7f9db7045429cb6dc6be56bdcbe/google-logo-about.svg (about.google) | Emblem only: wordmark paths removed, viewBox cropped to the G; geometry verbatim, colours flattened to one silhouette by the mask                                                                |
| `meta.svg`          | Meta           | https://static.xx.fbcdn.net/rsrc.php/yf/r/-7pQO6hUGK_.svg (asset served from https://about.meta.com/brand/resources/)       | Geometry verbatim; gradient infinity ribbon flattened to one silhouette by the mask                                                                                                              |
| `nvidia.svg`        | NVIDIA         | https://www.nvidia.com/en-us/ (footer `global-footer__logo` inline SVG)                                                     | Emblem only: wordmark and registered mark removed, viewBox cropped to the eye; geometry verbatim, rendered as a mask                                                                             |
| `alibaba.svg`       | Alibaba (Qwen) | https://assets.alicdn.com/g/qwenweb/qwen-chat-fe/0.3.49/static/images/qwen-logo.svg (Qwen chat, Alibaba CDN)                | Emblem only: wordmark removed, viewBox cropped to the Qwen glyph; geometry verbatim, colours flattened to one silhouette by the mask                                                             |
| `tencent.svg`       | Tencent        | https://hunyuan-blog-web-prod-1258344703.cos.ap-guangzhou.myqcloud.com/logo.svg (Tencent Hunyuan site)                      | Geometry verbatim; direct grayscale image preserves the layered Hunyuan disc, which a mask would merge into a blob                                                                               |
| `z-ai.svg`          | Z.ai           | https://z-cdn.chatglm.cn/z-ai/static/logo.svg (same file as `zai-org/GLM-4.5` `resources/logo.svg`)                         | Geometry verbatim; direct grayscale image preserves the dark tile + white Z; dark theme lifts mid-tones                                                                                          |
| `mistral.svg`       | Mistral        | https://docs.mistral.ai/assets/logos/m-white.svg                                                                            | Geometry verbatim; viewBox cropped from the 162 pt canvas to the pixel-M; white mosaic M rendered as a mask                                                                                      |
| `moonshot.svg`      | Moonshot       | https://statics.kimi.ai/moonshot-ai/assets/static/moonshot-ai-wordmark.DeMGOuiG.svg (moonshot.ai)                           | Emblem only: wordmark removed, viewBox cropped to the striped orb; geometry verbatim, white artwork rendered as a mask                                                                           |
| `poolside.svg`      | Poolside       | https://poolside.ai (nav inline SVG, `aria-label="poolside logo"`)                                                          | Emblem only: wordmark paths removed, viewBox cropped to the beach-ball glyph; geometry verbatim, `var()` presentation fills normalized to black, gradient shading kept                           |
| `reflection-ai.svg` | Reflection AI  | https://reflection.ai (nav inline SVG lockup)                                                                               | Emblem only: wordmark removed, viewBox cropped to the circle pair; geometry verbatim, rendered as a mask                                                                                         |
| `ricursive.svg`     | Ricursive      | https://www.ricursive.com (Framer inline SVG lockup)                                                                        | Emblem only: wordmark removed, viewBox cropped to the circular-arrow glyph; root width/height dropped so the viewBox drives scaling; geometry verbatim                                           |
| `nous.svg`          | Nous Research  | https://nousresearch.com (header `data-nous-badge` inline SVG)                                                              | Emblem kept whole (badge frame + portrait); path data compressed with SVGO float precision 3 for a sane file size; root normalized to viewBox + `currentColor`; rendered as a mask               |
| `cloudflare.svg`    | Cloudflare     | https://www.cloudflare.com (nav logo, `#nav-logo-icon` inline SVG)                                                          | Emblem only (the site draws the wordmark as a separate element); viewBox kept at the site's own 341×156 cloud; geometry verbatim, the two official fills flattened to one silhouette by the mask |
| `openbmb.svg`       | OpenBMB        | https://www.openbmb.cn/images/logo.svg (site logo; same emblem as `/favicon.svg`)                                           | Emblem only: the OpenBMB wordmark paths removed, viewBox cropped to the 28×28 dot grid; geometry verbatim, the blue/cyan pair flattened to one silhouette by the mask                            |

Already sourced earlier: `anthropic.svg`, `deepseek.svg`, `openai.svg` (root
`width`/`height` dropped so each viewBox drives the mask scale).

Marks requested but **not shipped** — no official vector published; each lab
keeps no mark rather than an unofficial redraw: MiniMax (official assets are
PNG only, incl. `MiniMax-AI/MiniMax-M2` figures and the hailuoai.video CDN
share logo), Xiaomi (SVG assets exist on `appmifile.com`/`mi-img.com` CDNs but
return 403 off-site; only the app icon raster is public), Thinking Machines
(site ships PNG favicons only, no GitHub vector), inclusionAI (Ant's Ling
team publishes PNG repo images only), Shanghai Innovation Institute /
Nex-AGI (no brand site; Hugging Face org avatar is a raster), Jev and
JackKozmo29 (individual Hugging Face card authors; Jev's card author publishes
only a generated gradient avatar, no mark of any kind). Both rows draw a `J`
tile. The other labs above draw theirs too.

Logos are trademarks of their respective owners (Google LLC, Meta Platforms,
Inc., NVIDIA Corporation, Alibaba Group / Qwen, Cloudflare, Inc., OpenBMB,
Tencent Holdings / Hunyuan, Z.ai (Zhipu), Mistral AI, Moonshot AI, Poolside
Inc., Reflection AI, Ricursive Intelligence). Underlying project licences where
known: Gemma terms (Google),
Qwen Apache-2.0, Hunyuan community licences, GLM model licence (Z.ai),
Mistral Apache-2.0, Kimi Open Source / Modified-MIT (Moonshot K2), Poolside
proprietary, Reflection proprietary, Ricursive proprietary. Fetched 2026-11-20.
