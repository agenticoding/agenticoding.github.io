# Classifier Source Catalog — November 2026

Sources checked through **2026-11-26**. This catalog covers non-generating decision models.

- **Protocol:** how many questions one call answers. `joint` sends the state once and reads one
  probability per option from a schema head; `per-question` sends the state again for every question
  and generates no output tokens.
- **Weights @ precision:** on-disk publisher checkpoint weights, not runtime memory. File totals
  use published byte counts divided by 2³⁰ and rounded to two decimal places in GiB. Alternative
  artifacts are listed separately; the figure does not select weights by runtime.
- **Max input:** `reference` is the publisher's local reference default; `config` is a token limit
  in the checkpoint or tokenizer config. Neither is a tested serving cap. Hosted windows and shared
  runtime settings are separate below.
- **Origin:** the publisher's country, when published. Hosted prices are not self-hosting costs.
- **Modality:** input channels → `label`, including option probabilities or correctness scores. No
  output tokens are generated.
- `?` means the primary source does not publish the field.

---

## Classifiers

| Lab         | Model           | Base                                   | Protocol     | Params     | Weights @ precision | Max input      | Origin        | Files                                                                   | License    | Engines                        | Modality                       | Card                                                   |
| ----------- | --------------- | -------------------------------------- | ------------ | ---------- | ------------------- | -------------- | ------------- | ----------------------------------------------------------------------- | ---------- | ------------------------------ | ------------------------------ | ------------------------------------------------------ |
| Cloudflare  | Clef 27B        | Qwen3.8-27B        | joint        | 27B dense  | 51.19 GiB BF16      | [16,384 reference][clef-local]  | United States | [sharded safetensors + joint_head.safetensors][clef-files]  | Apache-2.0 | sglang, llamacpp, transformers | text+image+video → label       | [card](https://huggingface.co/Cloudflare/clef)         |
| Cloudflare  | Clef Flash      | Qwen3.5-9B         | joint        | 9B dense   | 17.75 GiB BF16      | [16,384 reference][flash-local] | United States | [sharded safetensors + joint_head.safetensors][flash-files] | Apache-2.0 | vllm, sglang, llamacpp, transformers | text+image+video → label       | [card](https://huggingface.co/Cloudflare/clef-flash)   |
| Cloudflare  | Clef Omni       | Qwen3-Omni-30B-A3B-Instruct | joint        | 30B/3B     | 65.88 GiB BF16      | [64,000 reference][omni-local]  | United States | [sharded safetensors + joint_head.safetensors][omni-files]  | Apache-2.0 | vllm, transformers, mlx        | text+image+audio+video → label | [card](https://huggingface.co/Cloudflare/clef-omni)    |
| akhilaaa3   | Jev-Omni 12B    | Gemma-4-12B-it    | per-question | 12B dense  | 22.28 GiB BF16 backbone + FP32 head | [262,144 config][jev-config] | ?             | [model.safetensors + head.pt][jev-files]        | Apache-2.0 | transformers                   | text+image+audio+video → label | [card](https://huggingface.co/akhilaaa3/Jev-Omni)      |
| OpenBMB     | MiniCPM-OCR-Jev | Qwen3.5-2B        | per-question | 2B dense   | 4.12 GiB BF16       | [262,144 config][ocr-config] | China         | [model.safetensors][ocr-files]                  | Apache-2.0 | vllm, sglang, llamacpp, ollama  | image+text → label             | [card](https://huggingface.co/openbmb/MiniCPM-OCR-Jev) |

---

## Notes

### Clef inputs

| Model | Checkpoint text positions | Workers AI hosted window |
| --- | --- | --- |
| Clef 27B | [262,144][clef-config] | [65,536][clef-hosted] |
| Clef Flash | [262,144][flash-config] | [24,576][flash-hosted] |
| Clef Omni | [65,536 (thinker)][omni-config] | [64,000][omni-hosted] |

The catalog uses Cloudflare's local reference `max_length`: it bounds the encoded record, not the
state in isolation. The hosted window includes media and questions; Workers AI truncates text to fit
when those components leave room. Matching local and hosted numbers for Omni do not make the
limits interchangeable.

### Clef artifacts and runtimes

- **Publisher BF16:** Cloudflare's safetensors totals include the joint head. The [Omni card][omni-model]
  says its shards also contain speech-output weights that the reference loader does not load. The
  head scores each allowed label in the supplied schema, not a fixed set of labels stored in the
  checkpoint. The card's [“about 64 GB” figure][omni-memory] describes backbone GPU memory, not the
  shard total.
- **ggml-org BF16 GGUF conversions:** [Clef][clef-gguf] is **50.35 GiB** plus **0.87 GiB** for the BF16
  multimodal projector (**51.22 GiB** total). [Flash][flash-gguf] is **16.92 GiB** plus **0.86 GiB**
  for the projector (**17.78 GiB** total). These are separate llama.cpp packages, not Cloudflare's
  safetensors; both also offer quantized backbone variants.
- **Omni alternatives:** The [community MLX 4-bit][omni-mlx4] and [8-bit][omni-mlx8] packages list
  **19.8 GB** and **35.0 GB** downloads, drop the unused speech-output weights, and require their
  decision loader. The [community GGUF files][omni-gguf-sizes] are **18.63 GB Q4_K_M** or
  **32.60 GB Q8_0**. Both require the **2.39 GB BF16 projector** and the [llama.cpp port
  branch][omni-gguf]. This is not mainline support.
- **Runtime registration:** The [vLLM main branch][clef-vllm] registers Flash and Omni for token
  classification. The [publisher card][omni-sglang] lists Omni SGLang support as forthcoming.
  Clef and Flash have published SGLang recipes in their cards.

### Other assessors

- **Jev-Omni** is independently published by `akhilaaa3`, [not by TypeSafe AI][jev-attribution].
  The card's **about 50 GB** is an FP32 scenario, not the download size. The [reference
  loader][jev-loader] uses custom Transformers/CUDA code. The [llama.cpp adapter][jev-gguf] and [MLX conversion][jev-mlx] are
  independent packages with their own weights and validation, not runtime support for the row's
  checkpoint. The [published 83 ms][jev-speed] is the warm H200 median over 20 optimized-backend
  requests for roughly 2,000 text tokens, excluding preprocessing and network time. It is not a
  multimodal, end-to-end, or general Transformers latency. The card's [cost comparison][jev-cost]
  uses another model's hosted rate as a proxy, not a Jev-Omni price.
- **DepGuard Jev-style 1.5B** is [tagged `text-generation`][depguard-card]; it is not part of this
  non-generating catalog.
- **MiniCPM-OCR-Jev** scores a region's candidate OCR text using the original crop and an image
  rendered from the candidate. Its binary head returns a correctness score from **0 to 1**; the
  [model card][ocr-score] does not publish a rate. The [llama.cpp SDK recipe][ocr-recipe] uses one
  forward pass per candidate, with no generated tokens. The score service can batch already rendered
  items; the render+score service can also batch best-of-N selections across regions. The default
  **64 items or candidates** is an API guard, not a recommended batch size ([score][ocr-batch],
  [render+score][ocr-best-batch]). The same recipe sets **32,768 context tokens shared across
  parallel slots**, not a per-request limit. The row gives the checkpoint setting instead. For
  llama.cpp and [Ollama][ocr-ollama], use the [OpenBMB GGUF][ocr-gguf] and its separate vision
  projector. Ollama needs a runner build that supports this decision model.

### What the memory screen cannot establish

- A weight download is not live device allocation. The listed runtime names do not guarantee that a
  runtime uses the row's artifact, supports all modalities, or fits a workload.
- Cloudflare's [Clef][clef-forward], [Flash][flash-forward] and [Omni][omni-forward] forwards and the
  [Jev-Omni reference][jev-forward] disable generation caching. A fixed cache-per-token multiplier is
  an illustration, not a measured memory requirement or a proxy for peak forward-pass memory.
- The memory verdict is separate from the input warning. A memory fit does not establish that the
  encoded request fits a reference default, a checkpoint setting, or a runtime's effective window.

[clef-files]: https://huggingface.co/Cloudflare/clef/tree/main
[flash-files]: https://huggingface.co/Cloudflare/clef-flash/tree/main
[omni-files]: https://huggingface.co/Cloudflare/clef-omni/tree/main
[jev-files]: https://huggingface.co/akhilaaa3/Jev-Omni/tree/main
[ocr-files]: https://huggingface.co/openbmb/MiniCPM-OCR-Jev/blob/main/model.safetensors
[clef-local]: https://huggingface.co/Cloudflare/clef/blob/main/README.md#L183
[flash-local]: https://huggingface.co/Cloudflare/clef-flash/blob/main/README.md#L183
[omni-local]: https://huggingface.co/Cloudflare/clef-omni/blob/main/README.md#L170
[clef-config]: https://huggingface.co/Cloudflare/clef/blob/main/config.json#L94
[flash-config]: https://huggingface.co/Cloudflare/clef-flash/blob/main/config.json#L61
[omni-config]: https://huggingface.co/Cloudflare/clef-omni/blob/main/config.json#L330
[jev-config]: https://huggingface.co/akhilaaa3/Jev-Omni/blob/main/config.json#L109
[ocr-config]: https://huggingface.co/openbmb/MiniCPM-OCR-Jev/blob/main/config.json#L57
[clef-hosted]: https://developers.cloudflare.com/workers-ai/models/clef/
[flash-hosted]: https://developers.cloudflare.com/workers-ai/models/clef-flash/
[omni-hosted]: https://developers.cloudflare.com/workers-ai/models/clef-omni/
[clef-gguf]: https://huggingface.co/ggml-org/Clef-GGUF/tree/main
[flash-gguf]: https://huggingface.co/ggml-org/Clef-Flash-GGUF/tree/main
[omni-model]: https://huggingface.co/Cloudflare/clef-omni/blob/main/README.md#L27-L47
[omni-memory]: https://huggingface.co/Cloudflare/clef-omni/blob/main/README.md#L61-L62
[clef-vllm]: https://github.com/vllm-project/vllm/blob/main/vllm/model_executor/models/registry.py#L284-L287
[omni-sglang]: https://huggingface.co/Cloudflare/clef-omni/blob/main/README.md#L148-L150
[omni-mlx4]: https://huggingface.co/mlx-community/clef-omni-4bit#variants
[omni-mlx8]: https://huggingface.co/mlx-community/clef-omni-8bit#variants
[omni-gguf]: https://huggingface.co/gecBurton/clef-omni-gguf/blob/main/README.md#L15-L35
[omni-gguf-sizes]: https://huggingface.co/api/models/gecBurton/clef-omni-gguf?blobs=true
[jev-attribution]: https://huggingface.co/akhilaaa3/Jev-Omni/blob/main/README.md#L92
[jev-loader]: https://huggingface.co/akhilaaa3/Jev-Omni/blob/main/jev_omni.py#L111-L145
[jev-speed]: https://huggingface.co/akhilaaa3/Jev-Omni/blob/main/README.md#L72-L74
[jev-cost]: https://huggingface.co/akhilaaa3/Jev-Omni/blob/main/README.md#L37-L39
[jev-gguf]: https://huggingface.co/Reza2kn/Jev-Omni-Q4_K_M-GGUF#download-and-run
[jev-mlx]: https://huggingface.co/Ruiruiz30/Jev-Omni-MLX-4bit
[depguard-card]: https://huggingface.co/api/models/JackKozmo29/depguard-jev-style-1.5b
[ocr-score]: https://huggingface.co/openbmb/MiniCPM-OCR-Jev/blob/main/README.md#L41-L54
[ocr-recipe]: https://github.com/OpenBMB/MiniCPM-OCR/blob/main/docs/llamacpp_deploy_jev_en.md#L105-L124
[ocr-batch]: https://github.com/OpenBMB/MiniCPM-OCR/blob/main/docs/llamacpp_deploy_jev_en.md#L170-L193
[ocr-best-batch]: https://github.com/OpenBMB/MiniCPM-OCR/blob/main/docs/llamacpp_deploy_jev_en.md#L240-L273
[ocr-gguf]: https://huggingface.co/openbmb/MiniCPM-OCR-Jev-gguf
[ocr-ollama]: https://github.com/OpenBMB/MiniCPM-OCR/blob/main/docs/ollama_deploy_jev_en.md#L68-L91
[clef-forward]: https://huggingface.co/Cloudflare/clef/blob/main/joint_schema_model.py#L481
[flash-forward]: https://huggingface.co/Cloudflare/clef-flash/blob/main/joint_schema_model.py#L481
[omni-forward]: https://huggingface.co/Cloudflare/clef-omni/blob/main/joint_schema_model.py#L601
[jev-forward]: https://huggingface.co/akhilaaa3/Jev-Omni/blob/main/jev_omni.py#L103
