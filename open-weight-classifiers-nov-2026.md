# Classifier Source Catalog — November 2026

Sources checked through **2026-11-23**. A published rate is never converted: its own unit and
basis travel with it.

- **Protocol:** how many questions one call answers. `joint` sends the state once and reads one
  probability per option from a schema head; `per-question` sends the state again for every question
  and generates no output tokens.
- **Weights @ precision:** the published on-disk figure and the precision it is published at. `?`
  means no source publishes a comparable figure. Conversions at another precision are not comparable
  and are not listed here.
- **Max input:** `served` is the limit the serving docs publish; `config` is the checkpoint's own
  position limit, which no document states as a served cap.
- **Origin:** the country the lab publishes. A classifier is self-hosted, so a hosted price would
  say nothing about the cost of running it, and no rate is listed. `?` means the card names no
  country.
- **Modality:** input channels → `label`, because the output is a decision, not generated text.
- `?` means the primary source does not publish the field. Nothing here is estimated.

---

## Classifiers

| Lab         | Model           | Base                                   | Protocol     | Params     | Weights @ precision | Max input      | Origin        | Files                                                                   | License    | Engines                        | Modality                       | Card                                                   |
| ----------- | --------------- | -------------------------------------- | ------------ | ---------- | ------------------- | -------------- | ------------- | ----------------------------------------------------------------------- | ---------- | ------------------------------ | ------------------------------ | ------------------------------------------------------ |
| Cloudflare  | Clef 27B        | Qwen3.8-27B        | joint        | 27B dense  | 50.35 GiB BF16      | 65,536 served  | United States | sharded safetensors + `joint_head.safetensors`; [BF16 GGUF][clef-gguf]  | Apache-2.0 | sglang, llamacpp, transformers | text+image+video → label       | [card](https://huggingface.co/Cloudflare/clef)         |
| Cloudflare  | Clef Flash      | Qwen3.5-9B         | joint        | 9B dense   | 16.92 GiB BF16      | 24,576 served  | United States | sharded safetensors + `joint_head.safetensors`; [BF16 GGUF][flash-gguf] | Apache-2.0 | sglang, llamacpp, transformers | text+image+video → label       | [card](https://huggingface.co/Cloudflare/clef-flash)   |
| Cloudflare  | Clef Omni       | Qwen3-Omni-30B-A3B | joint        | 30B/3B     | ?                   | 64,000 served  | United States | sharded safetensors + `joint_head.safetensors`                          | Apache-2.0 | transformers, mlx              | text+image+audio+video → label | [card](https://huggingface.co/Cloudflare/clef-omni)    |
| Jev         | Jev-Omni 12B    | Gemma-4-12B-it                         | per-question | 12B dense  | 50 GB FP32          | 262,144 config | ?           | `model.safetensors` + `head.pt`                                         | Apache-2.0 | transformers, llamacpp, mlx    | text+image+audio+video → label | [card](https://huggingface.co/akhilaaa3/Jev-Omni)      |
| JackKozmo29 | Jev-style 1.5B  | Qwen2.5-1.5B-Instruct                  | per-question | 1.5B dense | 5.75 GiB FP32       | 32,768 config  | ?           | single FP32 `model.safetensors`                                         | Apache-2.0 | transformers                   | text → label                   | [card][depguard-card]                                  |
| OpenBMB     | MiniCPM-OCR-Jev | Qwen3.5-2B                             | per-question | 2B dense   | 4.12 GiB BF16       | 262,144 config | China       | safetensors; [GGUF][ocr-gguf]                                           | Apache-2.0 | vllm, sglang, llamacpp, ollama | image+text → label             | [card](https://huggingface.co/openbmb/MiniCPM-OCR-Jev) |

---

## Notes

- **Weights.** No Clef card publishes a disk figure; the two BF16 sizes above are the publisher's own
  BF16 GGUF artifacts, not a conversion. Clef Omni publishes no BF16 artifact: the only conversion is
  4-bit, so its row carries `?`.
- **Jev-Omni.** The card states FP32 weights "use about 50 GB before runtime overhead"; the shipped
  checkpoint is BF16. The rate is a warm H200 median for a 2K-token state.
- **Jev-style 1.5B.** Four siblings share one shape; this row names the most downloaded. The card
  publishes a wall-clock latency and no $/token.
- **MiniCPM-OCR-Jev.** No rate is published at any unit. The model has no LM head: one forward pass
  per request, two images in, one score out.
- **Hosted prices** are billed per input token by the serving provider and are not self-host costs.

[clef-gguf]: https://huggingface.co/ggml-org/Clef-GGUF/tree/main
[flash-gguf]: https://huggingface.co/ggml-org/Clef-Flash-GGUF/tree/main
[depguard-card]: https://huggingface.co/JackKozmo29/depguard-jev-style-1.5b
[ocr-gguf]: https://huggingface.co/openbmb/MiniCPM-OCR-Jev-gguf
