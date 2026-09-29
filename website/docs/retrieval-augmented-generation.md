---
title: 'Retrieval-Augmented Generation'
---

import SemanticSearchDiagram from '@site/src/components/VisualElements/SemanticSearchDiagram';
import EmbeddingIndexDiagram from '@site/src/components/VisualElements/EmbeddingIndexDiagram';
import DeepResearchSynthesisDiagram from '@site/src/components/VisualElements/DeepResearchSynthesisDiagram';
import VectorGlyphIllustration from '@site/src/components/VisualElements/VectorGlyphIllustration';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Delegate the Finding

Asking a model to read your entire repository is like asking a senior architect to photocopy the plans. It works, but it burns the judgment you hired.

So delegate the looking. You have already met this move as [sub-agent delegation](./sub-agent-delegation.md): the finding happens in another window, and only a synthesis comes back. Finding is two jobs, and neither needs a frontier model:

- **Agentic search** — fan out and follow the trail: web search, repository search, or a walk across a linked graph, until the evidence is in hand.[^agentic-search]
- **Summarization** — compress what came back into the few facts that matter, dropping the rest.[^slm-summary]

:::tip[Search is often a graph walk in disguise]

Code and knowledge bases look like plain lists of text, but they are graphs wearing a flat costume.
Modules import modules, functions call functions, types inherit types: the repository is a network, and
finding your way through it is a traversal. A knowledge base is usually the same story — one fact wired
to the next. The GraphWalk benchmark is built to probe exactly that walk: whether a model can move
through a graph step by step, following the edges, wherever the structure leads.[^graphwalk]
:::

Both are standard in agentic models, so a small one can run the loop and hand the frontier model a short, distilled brief.[^cascade] You pay the cheap model for breadth and the frontier model for judgment. The payoff is not the search; it is everything the frontier model never has to do: scan the corpus, rank candidates, hold the noise. **It never reads the library; it reads the page you hand it.**

## RAG: The Same Delegation, Scaled

Delegation is the opening move. **Retrieval-augmented generation (RAG) is that same move, scaled.** A language model already contains the layers that turn text into numbers; strip away everything else and what remains is a small encoder you can run on its own. Marry that encoder to the database's old trick of pre-indexing, and you get a system that finds the relevant pieces of information across a very large knowledge base without reading all of it. Delegation scales by trading a less capable worker for work done ahead of time.

## Embeddings: Meaning Becomes Distance

To search by meaning, meaning has to become a number. An **embedding model** maps text to a dense vector — a coordinate where distance is relatedness. Related text lands close: `cat` scores 0.91 against `feline` and 0.06 against `rocket`. Meaning becomes geometry, and relatedness becomes arithmetic.

<VectorGlyphIllustration narration="An embedding model reads a context — the tokens around a word as much as the word itself — and returns one vector: a long list of computed numbers, hundreds of them, that stand in for what the text was about rather than spelling it out. Context in, one vector out. Wherever this marker appears next, read it as one of those vectors: numbers the model calculated, never the strings you typed." />

Finding related things is now a proximity problem — one the field solved years ago, with the same machinery behind "find similar images," the "you might also like" row, and grouping photos by face. Retrieval borrows it: once items are coordinates, closeness is a lookup.

<DiagramFrame kicker="Reliability levers" title="Meaning becomes distance, then gets indexed" size="wide" narration="The trick is to compute similarity ahead of time. Once every item has a position, the machine never has to weigh text against text again — it just measures. That is what an index buys: a library reduced to numbers, searchable by calculation instead of reading." caption={<>
Text is split into chunks, each chunk is turned into a vector by a small
embedding model, and related meanings land close together. Those vectors are
stored once in one index — a proximity graph where nearness is meaning and a
lookup is a nearest-neighbour walk.
</>}>
<EmbeddingIndexDiagram />
</DiagramFrame>

The model doing this is small enough not to be the bottleneck, and cheap enough not to show up on the bill. Embedding is a commodity: Google's `EmbeddingGemma` fits a competitive model in under 200MB of RAM, Qwen's `Qwen3-Embedding-8B` ships as open weights you can run for free, and Voyage's hosted `voyage-4-lite` bills \$0.02 per million tokens. Generation is a different economy: a frontier model like Claude Opus 5 charges \$5 per million tokens to read the same text and \$25 to write it. Embedding the whole corpus is a rounding error, and you pay it once.[^embedding-cost]

That price is possible because questions and documents are encoded **independently** by the same model, so document vectors can be computed ahead of time.[^bi-encoder] Indexing is the rest of the setup: slice the corpus into passages, encode each one, and keep the results in a structure made for quick lookup — in practice an HNSW graph.[^hnsw]

## Semantic Search: Finding the Nearest Few

Now the read side — the payoff of the scaled delegation. The costly preparation is behind you, so asking costs almost nothing. At query time you embed the question **with the same model that built the index** — vectors from different models live in different spaces, so mixing them is meaningless. The question is one context, so it becomes one vector, and that is the only new embedding the whole query costs. Then you ask the index one question: which stored vectors sit nearest to this one? That is a similarity search, and geometrically it is just finding the query vector's nearest neighbours. The chunks behind those neighbours are the candidates.

This is what "search by meaning" buys: `doctor pay` retrieves `physician salary` even though the two share no words.

At toy scale the index can compare the query against every vector and take the closest. At corpus scale that linear scan is too slow, so the index is built for **approximate nearest-neighbour (ANN) search**: it returns the nearest few it can find quickly rather than the exact nearest few. That is the trade being made — **recall for latency** — and the recall/latency dial is most of what "approximate top-k" means in practice.

<DiagramFrame kicker="Reliability levers" title="One question in, the nearest few passages out" size="wide" narration="Answering is nearly free, because the hard part is already finished. What is left is the one thing nobody has worked out yet: the question. Encode that alone, compare it against the prepared points, and the passages sitting closest come back. A task that once meant searching a shelf is now a single comparison — which is why a retrieval step can afford to sit inside every agent loop." caption={<>
The query goes through the same model that indexed the corpus. At query time
the index is only read: the query vector is matched against the stored vectors,
its nearest neighbours light up, and everything below the threshold stays dark.
</>}>
<SemanticSearchDiagram />
</DiagramFrame>

The economics are the ones a database taught long ago: build the organizing structure up front, then each read is a short hop instead of a full sweep. That is what earns retrieval its place — a small model fetches a handful of passages,[^dpr] and the reader spends attention on those rather than on the entire library. Weighted against pouring everything into a long context, this is the leaner, more focused option; it is not automatically the truer one.[^rag-efficiency]

## Deep Research: The Same Delegation, Iterated

Answering a narrow question against what you already prepared is one hop. Deep research takes on questions whose clues are scattered across sources nobody has gathered, where the path is not known in advance. Strip away the branding and the shape is constant: **exploration** gathers the candidate pieces of reality, and **synthesis** turns them into an answer.

**Exploration gathers candidate reality.** It runs on two retrieval arms: semantic search for meaning, and plain literal search — keyword and structural lookups — for the exact identifier, the rare name, and the thing whose meaning you cannot paraphrase. The two miss different things, so real systems run both. An LLM usually drives the loop: it reads what came back, reasons about what is still unanswered, and issues the next query. So exploration is rarely one shot — each fact reveals the next question, and retrieval and reasoning alternate instead of firing one fixed query. On multi-hop questions that alternation beats any single query.[^ircot]

**Synthesis decides what earns context.** Its binding constraint is attention, not window size: past a point more evidence lowers quality instead of raising it ([the attention curve](./context-engineering.mdx#the-attention-curve-why-placement-matters)).[^context-rot][^attention-budget] The work is choosing: rerank, dedupe, order, and compress so the strongest evidence sits where the model actually reads, summarizing in parallel and merging the summaries when it still overflows one pass. Provenance has to survive the journey — every claim should trace to the passage that supports it, because even the best systems fail to fully support their citations about half the time.[^alce]

<DiagramFrame kicker="Reliability levers" title="Two phases: explore, then synthesize" size="wide" narration="The two phases pull in opposite directions, and that asymmetry is the design. Exploration is allowed to be greedy — it would rather bring back a piece it never uses than miss one it needs — because synthesis is where the cut happens. That is why the second phase can be precise: the answer is only ever as good as what the gather phase was generous enough to include." caption={<>
Exploration picks the candidate subset out of the whole corpus; synthesis compresses
that subset accurately into the answer the question needs. The two phases optimise
opposite things: exploration for recall — wide, cheap, tolerant of noise; synthesis
for precision — narrow, ordered, answer-shaped.
</>}>
<DeepResearchSynthesisDiagram />
</DiagramFrame>

Most chat interfaces already ship it: flip on deep research, ask the sprawling question, and wait. What comes back is written, cited, and compact. Underneath, it is the [grounding phase](./workflow-grounding.md#phase-1-grounding) run as a [workflow agent](./workflow-agents.mdx): code owns the loop and the stop condition, the model is called to judge what is missing and to write. The orchestrator receives the conclusion; the raw pile never reaches it.

Those products aim it at the web, where the retrieval tools already exist. The technique is the part that travels: the same loop runs over a codebase, a ticket archive, or a shelf of documents, reading symbols and line ranges, or sections and links, instead of search results. The reading changes; the loop does not. Length bends the same way — the same run sizes its evidence to the page, so it returns a paragraph or a long report. [ChunkHound](https://chunkhound.ai) — a sister project of this book — runs that same loop over code, git history, and the web, locally on the developer's laptop, so nothing leaves the machine.

A run is a different order of cost: minutes rather than milliseconds, and hundreds of documents rather than a handful.[^deep-research] When a question is self-contained, an ordinary lookup settles it in one round trip — deep research is for the answer you cannot reach in one step.

## Dedicate an Agent to Retrieval

These aren't alternatives you pick once — they're stages, and a workflow climbs them as it grows. Each stage answers the limit the one before it hit, and the direction never changes: more of the finding happens before the thinking window, and less guesswork reaches it.

The strongest form wraps all three in one [grounding agent](./workflow-grounding.md#phase-1-grounding): the same delegation, aimed at a single task instead of a general one. It is a [workflow agent](./workflow-agents.mdx) whose only job is retrieval for this task. It knows what is being asked, runs both arms, and delivers a compact, cited selection to the main agent, so the search is never billed to the thinking. A generic retriever guesses at relevance; a task-scoped one is aimed at it.

What decides which stage you're on is how far the work has grown. An agent that outgrows a single window delegates the finding — the searching moves out of the window, the thinking stays. When the material outgrows one pass, the next stage precomputes the search: vectors stored once, every question answered by proximity. When the question itself escapes what you prepared, the whole arrangement gives way to a dedicated deep research workflow agent, one whose only job is to ground the main agent that does the actual task. Grounding is the constant underneath: every claim traces to a source actually retrieved.

[^attention-budget]: Anthropic (2025), [_Effective context engineering for AI agents_](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — every token depletes a finite attention budget, so the goal is the smallest set of high-signal tokens.

[^agentic-search]: Huang et al. (2025), [_Deep Research Agents: A Systematic Examination And Roadmap_](https://arxiv.org/abs/2506.18096) — grounding runs as an iterative search loop with multi-hop retrieval and tool use, not a single query.

[^graphwalk]: Ghandi, Mahyar & Klaiman (2026), [_GraphWalk: Enabling Reasoning in Large Language Models through Tool-Based Graph Navigation_](https://arxiv.org/abs/2604.01610) — off-the-shelf models navigate a graph step by step with a minimal set of graph-navigation tools, holding up as the structure grows far past what fits in context.

[^slm-summary]: Xu et al. (2025), [_Evaluating Small Language Models for News Summarization_](https://arxiv.org/abs/2502.00641) — small models match 70B summarization quality on relevance, coherence, and factual consistency.

[^cascade]: Chen, Zaharia & Zou (2023), [_FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance_](https://arxiv.org/abs/2305.05176) — up to 98% cost reduction while matching GPT-4; Ong et al. (2024), [_RouteLLM: Learning to Route LLMs with Preference Data_](https://arxiv.org/abs/2406.18665) — over 2× cost reduction without quality loss.

[^embedding-cost]: Google, [_EmbeddingGemma_](https://ai.google.dev/gemma/docs/embeddinggemma) — 308M parameters in under 200MB of RAM; Qwen, [_Qwen3-Embedding-8B_](https://huggingface.co/Qwen/Qwen3-Embedding-8B) — open weights; Voyage AI, [_Pricing_](https://docs.voyageai.com/docs/pricing) — \$0.02 per million tokens for `voyage-4-lite`; Anthropic, [_Pricing_](https://www.anthropic.com/pricing) — Claude Opus 5 at \$5 and \$25 per million input and output tokens.

[^bi-encoder]: Reimers & Gurevych (2019), [_Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks_](https://arxiv.org/abs/1908.10084) — a bi-encoder embeds queries and documents independently, which is what makes document vectors precomputable.

[^hnsw]: Malkov & Yashunin (2018), [_Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs_](https://arxiv.org/abs/1603.09320).

[^dpr]: Karpukhin et al. (2020), [_Dense Passage Retrieval for Open-Domain Question Answering_](https://arxiv.org/abs/2004.04906) — retrieval framed as a cheap retriever feeding an LLM reader.

[^context-rot]: Chroma Research (2025), [_Context Rot_](https://www.trychroma.com/research/context-rot).

[^rag-efficiency]: Li et al. (2024), [_Retrieval Augmented Generation or Long-Context LLMs? A Comprehensive Study and Hybrid Approach_](https://arxiv.org/abs/2407.16833).

[^ircot]: Trivedi et al. (2023), [_Interleaving Retrieval with Chain-of-Thought Reasoning for Knowledge-Intensive Multi-Step Questions_](https://arxiv.org/abs/2212.10509).

[^deep-research]: OpenAI, [_Introducing deep research_](https://openai.com/index/introducing-deep-research/) — multi-step research over hundreds of sources, reported at 5–30 minutes per task.

[^alce]: Gao et al. (2023), [_Enabling Large Language Models to Generate Text with Citations_](https://arxiv.org/abs/2305.14627).

[disclosure]: /about 'Disclosure: the author created ChunkHound'
