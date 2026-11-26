# Retrieval Source Catalog — November 2026

Sources checked through **2026-11-26**. The fit calculators estimate embedders and pairwise
rerankers. Both load weights once and keep no token state between requests.

- **Weights @ precision:** on-disk size of the named checkpoint files at their stored precision.
  For split checkpoints, the size is the sum of their published file sizes. This is not a
  measurement of peak memory or a parameter-count conversion. Alternate formats are not priced.
- **Max input:** `served` is a limit from serving documentation; `config` is a token limit in the
  checkpoint or tokenizer config; `card` is the model publisher's advertised input length;
  `blog` is a length the publisher states in its release post; `default` is the truncation limit in
  the publisher's standard inference path. Check that your chosen runtime can serve the listed
  length. The limits count all input tokens, including prompts.
- **Dims:** native vector width; MRL names the widths the publisher supports for truncation.
  `fixed` means the card publishes no supported truncation widths.
- **Score:** benchmark and run. Compare scores only within the same metric, protocol, and, for
  rerankers, candidate pool. `?` means the field has no cited value.
- **Modality:** text produces a `vector` for an embedder or a `score` for a reranker.

## Embedders

| Lab                   | Model                | Base                                    | Params      | Weights @ precision | Max input   | Dims                         | Score                                                               | Origin        | Files                                                                                                                                                                                                | License     | Engines                                           | Modality      | Card                                                                  |
| --------------------- | -------------------- | --------------------------------------- | ----------- | ------------------- | ----------- | ---------------------------- | ------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------- | ------------- | --------------------------------------------------------------------- |
| Alibaba               | Qwen3-Embedding 8B   | Qwen3-8B-Base                           | 7.57B dense | [15.13 GB BF16][qwen8-weights]       | 32,768 card | 4,096 (MRL 32–4,096)         | 70.58 MMTEB v2 (mean task)                                          | China         | [sharded safetensors](https://huggingface.co/Qwen/Qwen3-Embedding-8B/tree/main); [Q4_K_M GGUF](https://huggingface.co/Qwen/Qwen3-Embedding-8B-GGUF/tree/main)                                        | Apache-2.0  | transformers, tei, vllm, sglang, ollama, llamacpp | text → vector | [card](https://huggingface.co/Qwen/Qwen3-Embedding-8B)                |
| Alibaba               | Qwen3-Embedding 4B   | Qwen3-4B-Base                           | 4.02B dense | 8.04 GB BF16        | 32,768 card | 2,560 (MRL 32–2,560)         | 69.45 MMTEB v2 (mean task)                                          | China         | [sharded safetensors](https://huggingface.co/Qwen/Qwen3-Embedding-4B/tree/main); [Q4_K_M GGUF](https://huggingface.co/Qwen/Qwen3-Embedding-4B-GGUF/tree/main)                                        | Apache-2.0  | transformers, tei, vllm, sglang, ollama, llamacpp | text → vector | [card](https://huggingface.co/Qwen/Qwen3-Embedding-4B)                |
| Alibaba               | Qwen3-Embedding 0.6B | Qwen3-0.6B-Base                         | 596M dense  | 1.19 GB BF16        | 32,768 card | 1,024 (MRL 32–1,024)         | 64.33 MMTEB v2 (mean task)                                          | China         | [safetensors](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B/blob/main/model.safetensors); [Q8_0 GGUF](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/tree/main)                            | Apache-2.0  | transformers, tei, vllm, sglang, ollama, llamacpp | text → vector | [card](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B)              |
| BAAI                  | BGE-M3               | BGE-M3-unsupervised (XLM-RoBERTa-large) | 568M dense  | 2.27 GB FP32        | 8,192 card  | 1,024                        | [59.56 MMTEB v2 (mean task; leaderboard snapshot)][qwen-embed-eval] | China         | [PyTorch backbone and separate sparse/ColBERT heads](https://huggingface.co/BAAI/bge-m3/tree/main); [dense ONNX](https://huggingface.co/BAAI/bge-m3/tree/main/onnx)                                  | MIT         | transformers, tei, onnx, vllm                     | text → vector | [card](https://huggingface.co/BAAI/bge-m3)                            |
| Microsoft             | Harrier OSS v1 27B   | Gemma 3 architecture                    | 27B dense   | 54.02 GB BF16       | 32,768 card | 5,376 (fixed)                | 74.3 MMTEB v2 (mean task)                                           | United States | [sharded safetensors](https://huggingface.co/microsoft/Harrier-OSS-v1-27B/tree/main)                                                                                                                 | MIT         | transformers, vllm, sglang                        | text → vector | [card](https://huggingface.co/microsoft/Harrier-OSS-v1-27B)           |
| Microsoft             | Harrier OSS v1 0.6B  | Qwen3 architecture                      | 0.6B dense  | 1.19 GB BF16        | 32,768 card | 1,024 (fixed)                | 69.0 MMTEB v2 (mean task)                                           | United States | [safetensors](https://huggingface.co/microsoft/Harrier-OSS-v1-0.6B/blob/main/model.safetensors)                                                                                                      | MIT         | transformers, tei, vllm, sglang                   | text → vector | [card](https://huggingface.co/microsoft/Harrier-OSS-v1-0.6B)          |
| Google                | EmbeddingGemma 300M  | Gemma 3 (T5Gemma initialization)        | 308M dense  | 1.23 GB FP32        | 2,048 card  | 768 (MRL 128, 256, 512, 768) | [61.15 MMTEB v2 (mean task; FP32, 768d)][gemma-eval]                | United States | [backbone and two dense safetensors modules](https://huggingface.co/google/embeddinggemma-300m/tree/main)                                                                                            | Gemma Terms | transformers, tei, vllm, sglang, ollama, mlx, llamacpp | text → vector | [card](https://huggingface.co/google/embeddinggemma-300m)             |
| sentence-transformers | all-MiniLM-L6-v2     | MiniLM-L6-H384-uncased                  | 22.7M dense | 90.9 MB FP32        | 256 default | 384                          | ?                                                                   | ?             | [model.safetensors](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/blob/main/model.safetensors); [ONNX](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/tree/main/onnx) | Apache-2.0  | transformers, onnx, tei                           | text → vector | [card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) |

## Rerankers

| Lab           | Model                 | Base                           | Params      | Weights @ precision | Max input    | Dims | Score                                                       | Origin | Files                                                                                                                                                                                          | License    | Engines                    | Modality     | Card                                                               |
| ------------- | --------------------- | ------------------------------ | ----------- | ------------------- | ------------ | ---- | ----------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------- | ------------ | ------------------------------------------------------------------ |
| Alibaba       | Qwen3-Reranker 8B     | Qwen3-8B-Base                  | 8.19B dense | 16.38 GB BF16       | 32,768 card  | ?    | [69.02 MTEB-R (English v2; Qwen top 100)][qwen-rerank-eval] | China  | [sharded safetensors](https://huggingface.co/Qwen/Qwen3-Reranker-8B/tree/main)                                                                                                                 | Apache-2.0 | transformers, vllm, sglang | text → score | [card](https://huggingface.co/Qwen/Qwen3-Reranker-8B)              |
| Alibaba       | Qwen3-Reranker 4B     | Qwen3-4B-Base                  | 4.02B dense | 8.04 GB BF16        | 32,768 card  | ?    | [69.76 MTEB-R (English v2; Qwen top 100)][qwen-rerank-eval] | China  | [sharded safetensors](https://huggingface.co/Qwen/Qwen3-Reranker-4B/tree/main)                                                                                                                 | Apache-2.0 | transformers, vllm, sglang | text → score | [card](https://huggingface.co/Qwen/Qwen3-Reranker-4B)              |
| Alibaba       | Qwen3-Reranker 0.6B   | Qwen3-0.6B-Base                | 596M dense  | 1.19 GB BF16        | 32,768 card  | ?    | [65.80 MTEB-R (English v2; Qwen top 100)][qwen-rerank-eval] | China  | [safetensors](https://huggingface.co/Qwen/Qwen3-Reranker-0.6B/blob/main/model.safetensors)                                                                                                     | Apache-2.0 | transformers, vllm, sglang | text → score | [card](https://huggingface.co/Qwen/Qwen3-Reranker-0.6B)            |
| BAAI          | BGE-reranker-v2-m3    | BGE-M3                         | 568M dense  | 2.27 GB FP32        | [8,192 config][bge-rerank-tokenizer] | ?    | [57.03 MTEB-R (English v2; Qwen top 100)][qwen-rerank-eval] | China  | [model.safetensors](https://huggingface.co/BAAI/bge-reranker-v2-m3/blob/main/model.safetensors)                                                                                                | Apache-2.0 | transformers, tei, vllm, sglang | text → score | [card](https://huggingface.co/BAAI/bge-reranker-v2-m3)             |
| mixedbread    | mxbai-rerank-large-v2 | [Qwen2.5 1.5B][mxbai-release]   | 1.5B dense  | 3.09 GB FP16        | 8,192 blog   | ?    | [57.49 BEIR nDCG@10 (Mixedbread run)][mxbai-release]        | ?      | [model.safetensors](https://huggingface.co/mixedbread-ai/mxbai-rerank-large-v2/blob/main/model.safetensors)                                                                                    | Apache-2.0 | transformers               | text → score | [card](https://huggingface.co/mixedbread-ai/mxbai-rerank-large-v2) |
| cross-encoder | ms-marco-MiniLM-L6-v2 | ms-marco-MiniLM-L12-v2         | 22.7M dense | 90.9 MB FP32        | 512 config   | ?    | 74.30 TREC DL 19 nDCG@10                                    | ?      | [model.safetensors](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2/blob/main/model.safetensors); [ONNX](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2/tree/main/onnx) | Apache-2.0 | transformers, onnx, tei    | text → score | [card](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2) |

## Listwise rerankers — not estimated

| Lab     | Model              | Base       | Params     | Weights @ precision | Packed context                  | Score                                          | Origin  | Files                                                                                                                                                                                                                   | License      | Card                                                     |
| ------- | ------------------ | ---------- | ---------- | ------------------- | ------------------------------- | ---------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------- |
| Jina AI | Jina Reranker v3.5 | Qwen3-0.6B | 0.6B dense | 1.19 GB BF16        | 131,072 tokens per packed block | [63.20 BEIR nDCG@10 (Jina top 100)][jina-eval] | Germany | [safetensors](https://huggingface.co/jinaai/jina-reranker-v3.5/blob/main/model.safetensors); [GGUF](https://huggingface.co/jinaai/jina-reranker-v3.5-GGUF); [MLX](https://huggingface.co/jinaai/jina-reranker-v3.5-mlx) | CC-BY-NC-4.0 | [card](https://huggingface.co/jinaai/jina-reranker-v3.5) |

[Jina's local `rerank` implementation][jina-packing] truncates the query at 1,024 tokens and each
candidate at 8,192. It packs candidates into blocks of up to 125 documents, subject to the shared
context budget. The 131,072-token window is not a per-document limit, and 125 is a local packing
threshold, not a universal candidate limit. The pairwise calculator does not price these blocks.
Commercial use requires a separate license from Jina.

## Notes

- **Memory.** Each priced pass reads one text or one query–passage pair. The figure assumes
  **32 KiB per token in flight** for the working set. Runtime precision, padding, and attention
  kernels can change the actual requirement.
- **Context.** [all-MiniLM-L6-v2 defaults to 256 tokens][minilm-default] despite its
  [512-position model config][minilm-config]. Both BGE checkpoints have 8,194 position slots;
  the model card or [reranker tokenizer][bge-rerank-tokenizer] lists 8,192 input tokens. Qwen
  advertises 32,768 tokens; some configs allow 40,960 positions and the examples use 8,192.
  The [Mixedbread launch][mxbai-release] advertises 8,192 tokens with 32K compatibility.
  [Harrier's 27B config][harrier27-config] allows 131,072 positions, but Microsoft advertises
  32,768. These are not guarantees about a deployed endpoint.
- **Checkpoints.** BGE-M3's listed size is the dense PyTorch backbone. Its sparse and ColBERT
  heads are separate files; do not assume a dense runtime exposes them. EmbeddingGemma's FP32
  size includes both dense projection files. [Qwen3-Embedding 8B's shards][qwen8-weights]
  total 15,134,634,568 bytes. [Mixedbread stores FP16 weights][mxbai-weights] even though its
  config names BF16.
  Harrier's model configs identify its architectures, not exact parent checkpoints.
- **Runtimes.** For Qwen3-Embedding 4B, the publisher's [llama.cpp instructions][qwen4-llamacpp]
  cover its GGUF conversion with last-token pooling, not the BF16 safetensors. EmbeddingGemma
  has exact-checkpoint support in [vLLM][gemma-vllm] and [SGLang][gemma-sglang]. SGLang
  documents [BGE-reranker-v2-m3][bge-rerank-sglang] with its cross-encoder embedding runner.
- **TEI.** [TEI documents the Qwen embedders and EmbeddingGemma][tei-models], but its
  [Qwen3 backend rejects classifier mode][tei-qwen3]. Loading a Qwen reranker as an embedder does
  not serve reranking. The original Mixedbread causal-LM reranker is not a TEI reranking checkpoint.

[qwen-embed-eval]: https://huggingface.co/Qwen/Qwen3-Embedding-8B#mteb-multilingual
[qwen8-weights]: https://huggingface.co/api/models/Qwen/Qwen3-Embedding-8B?blobs=true
[qwen4-llamacpp]: https://huggingface.co/Qwen/Qwen3-Embedding-4B-GGUF/blob/main/README.md#L56-L68
[qwen-rerank-eval]: https://huggingface.co/Qwen/Qwen3-Reranker-8B#evaluation
[gemma-eval]: https://ai.google.dev/gemma/docs/embeddinggemma/model_card#full-precision-checkpoint
[gemma-vllm]: https://docs.vllm.ai/en/latest/models/pooling_models/embed.html#supported-models
[gemma-sglang]: https://docs.sglang.io/cookbook/autoregressive/Google/EmbeddingGemma
[bge-rerank-tokenizer]: https://huggingface.co/BAAI/bge-reranker-v2-m3/blob/main/tokenizer_config.json#L49
[bge-rerank-sglang]: https://docs.sglang.io/docs/supported-models/rerank_models#cross-encoder-rerank-embedding-runner
[harrier27-config]: https://huggingface.co/microsoft/Harrier-OSS-v1-27B/blob/main/config.json#L82
[mxbai-release]: https://www.mixedbread.com/blog/mxbai-rerank-v2
[mxbai-weights]: https://huggingface.co/api/models/mixedbread-ai/mxbai-rerank-large-v2?blobs=true
[jina-eval]: https://huggingface.co/jinaai/jina-reranker-v3.5#jina-reranker-v35-domain-ready-listwise-document-reranker
[jina-packing]: https://huggingface.co/jinaai/jina-reranker-v3.5/blob/main/modeling.py#L219-L253
[minilm-default]: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/blob/main/sentence_bert_config.json
[minilm-config]: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/blob/main/config.json
[tei-models]: https://github.com/huggingface/text-embeddings-inference#supported-models
[tei-qwen3]: https://github.com/huggingface/text-embeddings-inference/blob/main/backends/candle/src/models/qwen3.rs#L408-L414
