---
title: 'Context Quality'
---

import SemanticSearchDiagram from '@site/src/components/VisualElements/SemanticSearchDiagram';
import EmbeddingIndexDiagram from '@site/src/components/VisualElements/EmbeddingIndexDiagram';
import DeepResearchSynthesisDiagram from '@site/src/components/VisualElements/DeepResearchSynthesisDiagram';
import VectorGlyphIllustration from '@site/src/components/VisualElements/VectorGlyphIllustration';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Give the Agent the Right Reality

An agent that can search usually grounds itself. Give it tools and it finds the file, reads the docs, follows the trail, and gets on with the work — and when that happens, the right move is to leave it alone. Context quality is not a tax you pay on every task.

You reach for it when the agent is wrong, or when it is too slow and expensive. Wrong looks like invented reality: an abstraction that doesn't exist, a generic default where the domain had a rule, a constraint it never saw. That is missing local knowledge, and it fails as confidently as it would if it were correct. Slow and expensive looks like the same fact fetched twice, a dozen files opened for one line, a search round trip for something you already knew.

Both failures have the same fix: hand the agent the reality the task depends on, and nothing else. Fixing a login bug needs the session code, the auth check, and the error users see — and nothing about the billing system. It is subtraction as much as addition, because noise doesn't sit quietly: it steers the model toward patterns you never asked for.

[Grounding](./workflow-grounding.md#phase-1-grounding) is phase one of the [four-phase workflow](./high-level-methodology.md) — what reality does the agent need before it acts — and context quality is the standard that decision is held to. Keeping it in the back of your mind is the point; [context engineering](./context-engineering.mdx) is how the facts then stay usable: placement, size, lifetime, isolation. Attention pools at the window's edges and fades in the middle, so a bigger window spreads the same focus thinner, not wider — see [the attention curve](./context-engineering.mdx#the-attention-curve-why-placement-matters) and [the recall curves](./effective-context.mdx#long-context-benchmarks-show-the-tradeoff).[^attention-budget]

## Let a Cheap Model Find, so the Expensive One Can Think

Asking an LLM to read your whole repository is like asking a senior architect to photocopy the building plans. It works, but it spends the expensive attention you hired for the design.

The first fix is delegation: hand the finding to a cheap model acting as a sub-agent, and let the expensive model only think. Finding is itself two jobs, and neither needs a frontier model:

- **Agentic search** — fan out and follow the trail: web search, repository search, or a walk across a linked graph, until the evidence is in hand.[^agentic-search]
- **Summarization** — compress what came back into the few facts that matter, dropping the rest.[^slm-summary]

Both are standard in agentic models, so a small one can run the loop and hand the frontier model a short, distilled brief. Most questions never need the expensive model at all, and quality holds.[^cascade] You pay the cheap model for breadth and the frontier model for judgment.

The payoff is not the search. It is everything the frontier model never has to do: scan the corpus, rank candidates, hold the noise. **It never reads the library; it reads the page you hand it.**

Delegation is only the first pattern. The same trick pushes further: embeddings are cheaper still — an LLM already contains embedding layers, so an embedding model is a slice of that machinery run on its own. Combine it with the old database trick of pre-indexing, and you get **Retrieval-augmented generation (RAG)**: a system that finds relevant pieces of information fast and cheaply across a very large knowledge base.

## Embeddings: Meaning Becomes Distance

To search by meaning, meaning has to become a number. An **embedding model** maps text to a dense vector — a coordinate where distance is relatedness. Related text lands close: `cat` scores 0.91 against `feline` and 0.06 against `rocket`. Text becomes geometry, and relatedness becomes arithmetic.

<VectorGlyphIllustration narration="A token is what the model reads; a vector is a long list of numbers the model computes from it, hundreds of them, standing in for meaning rather than spelling it out. That is what an embedding model produces from a word. Whenever this marker appears later, read it as one embedded vector — numbers the model computed, not words it read." />

Finding related things is now a nearest-neighbour search — a problem we solved years ago. The same machinery powers "find similar images," the "you might also like" row, and grouping photos by face. Text retrieval just borrows it: embed the query and the corpus, then ask the index for the closest vectors.

<DiagramFrame kicker="Reliability levers" title="Meaning becomes distance, then gets indexed" size="wide" narration="To search by meaning, meaning first has to become a number. Text is split into chunks, a small embedding model turns each chunk into a vector, and related meanings land close together: cat sits at 0.91 similarity to feline and only 0.06 to rocket. Near means related. Those vectors are stored once in an index built for fast lookup, so relatedness becomes arithmetic instead of string matching — the corpus is embedded once and queried forever." caption={<>
Text is split into chunks, each chunk is turned into a vector by a small
embedding model, and related meanings land close together. Those vectors are
stored once in one index — a proximity graph where nearness is meaning and a
lookup is a nearest-neighbour walk.
</>}>
<EmbeddingIndexDiagram />
</DiagramFrame>

The model doing this is small enough not to be the bottleneck, and cheap enough not to show up on the bill. Embedding is a commodity: Google's `EmbeddingGemma` fits a competitive model in under 200MB of RAM, Qwen's `Qwen3-Embedding-8B` ships as open weights you can run for free, and Voyage's hosted `voyage-4-lite` bills \$0.02 per million tokens. Generation is a different economy: a frontier model like Claude Opus 5 charges \$5 per million tokens to read the same text and \$25 to write it. Embedding the whole corpus is a rounding error, and you pay it once.[^embedding-cost]

That price is possible because the query and the document are encoded **independently** by the same model, so document vectors can be computed ahead of time and reused.[^bi-encoder] Embedding a corpus is a one-time cost; the same vectors answer every later question. Indexing is the rest of the setup: split the corpus into chunks, embed each chunk, and store the vectors in a structure built for fast lookup — in practice an approximate nearest-neighbour index such as HNSW.[^hnsw]

## Semantic Search: Finding the Nearest Few

At query time you embed the question **with the same model that built the index** — vectors from different models live in different spaces, so mixing them is meaningless. Then you ask the index one question: which stored vectors sit nearest to this one? That is a similarity search, and geometrically it is just finding the query vector's nearest neighbours. The chunks behind those neighbours are the candidates.

This is what "search by meaning" buys: `doctor pay` retrieves `physician salary` even though the two share no words.

At toy scale the index can compare the query against every vector and take the closest. At corpus scale that linear scan is too slow, so the index is built for **approximate nearest-neighbour (ANN) search**: it returns the nearest few it can find quickly rather than the exact nearest few. That is the trade being made — **recall for latency** — and the recall/latency dial is most of what "approximate top-k" means in practice.

<DiagramFrame kicker="Reliability levers" title="One question in, the nearest few passages out" size="wide" narration="A question only matches an index that shares its space, so it gets embedded by the same model that embedded the corpus. The index was built once; answering is just a read. The question's vector finds its nearest stored neighbours, and the passages behind them become the candidates — so doctor pay can retrieve physician salary even though the two share no words. What comes back is a short list of nearest passages, not a scan of the corpus." caption={<>
The query is embedded by the same model that indexed the corpus. The index was
built once; query time only reads it: the query vector is matched against the
stored vectors, its nearest neighbours light up, and everything below the
threshold stays dark.
</>}>
<SemanticSearchDiagram />
</DiagramFrame>

The index is built once and paid for once. Every query after that embeds only the question — a few tokens against a corpus that is already vectorized — so asking is nearly free. It is the same bargain as an index on a database table: pay once to organize the data, then read a short list instead of scanning the table. That is the economics that make retrieval worth the setup: a cheap retriever hands the LLM reader a handful of passages, and the reader spends its attention on those instead of the whole corpus.[^dpr] Measured against feeding everything into a long context, retrieval is the cheaper, more attention-efficient choice — not automatically the more correct one.[^rag-efficiency]

## Deep Research: Search, Learn, Iterate, Cite

A single semantic search answers a narrow question against a corpus you already indexed. Deep research answers a question whose answer is spread across sources nobody has read yet. Strip away the branding and every implementation is the same two phases: **exploration** gathers the candidate pieces of reality, and **synthesis** turns them into an answer.

**Exploration gathers candidate reality.** It runs on two retrieval arms: semantic search for meaning, and plain deterministic search — keyword and structural lookups — for the exact identifier, the rare name, and the thing whose meaning you cannot paraphrase. The two miss different things, so real systems run both. An LLM usually drives the loop: it reads what came back, reasons about what is still missing, and issues the next query. So exploration is rarely one shot — each fact reveals the next question, and retrieval and reasoning alternate instead of firing one fixed query. On multi-hop questions that alternation beats any single query.[^ircot]

**Synthesis decides what earns context.** Its binding constraint is attention, not window size. A long context does not attend evenly — it pools at the edges and fades in the middle — so past a point more evidence lowers quality instead of raising it ([the attention curve](./context-engineering.mdx#the-attention-curve-why-placement-matters)).[^context-rot] The work is choosing: rerank, dedupe, order, and compress so the strongest evidence sits where the model actually reads, summarizing in parallel and merging the summaries when it still overflows one pass. Provenance has to survive the trip — every claim should trace to the passage that supports it, because even the best systems fail to fully support their citations about half the time.[^alce]

<DiagramFrame kicker="Reliability levers" title="Two phases: explore, then synthesize" size="wide" narration="Deep research is two phases. Exploration chooses what to read: it casts wide across concepts and sources, trading precision for recall, and gathers the candidate subset out of a corpus far larger than any window. Synthesis then compresses that subset accurately into the answer the question needs, narrowing and ordering for precision. The two phases optimise opposite things — exploration for breadth, synthesis for the answer — and the second only works if the first brought back the right pieces." caption={<>
Exploration picks the candidate subset out of the whole corpus; synthesis compresses
that subset accurately into the answer the question needs. The two phases optimise
opposite things: exploration for recall — wide, cheap, tolerant of noise; synthesis
for precision — narrow, ordered, answer-shaped.
</>}>
<DeepResearchSynthesisDiagram />
</DiagramFrame>

Most chat interfaces already ship it: flip on deep research, ask the sprawling question, and wait. What comes back is written, cited, and compact. Underneath, it is the [grounding phase](./workflow-grounding.md#phase-1-grounding) of the [four-phase workflow](./high-level-methodology.md) — a sub-agent that explores, filters, and returns a distilled answer instead of the pile it read — and it is a [workflow agent](./workflow-agents.mdx): deterministic code owns the loop, the budget, and the stop condition, while the model is called at bounded junctions to judge what is missing and to write. The orchestrator receives the conclusion and asks the next question; the raw pile never reaches it.

Those products aim it at the web, where the retrieval tools already exist. The technique is the part that travels: the same two phases run over a codebase, a ticket archive, or a shelf of documents, reading symbols and line ranges, or sections and links, instead of search results. The reading changes; the loop does not. Length bends the same way — synthesis decides how much of what it gathered earns the page, so the same run returns a paragraph or a long report. [ChunkHound](https://chunkhound.github.io) — a sister project of this book — runs that same loop over code, git history, and the web, locally on the developer's laptop, so the corpus never leaves the machine.

A run is a different order of cost: minutes rather than milliseconds, and hundreds of sources rather than a handful.[^deep-research] For a narrow, self-contained question, plain semantic search finishes in one round trip — deep research is for the answer you cannot reach in one step.

## Dedicate an Agent to Retrieval

The three techniques in this chapter are context quality at three ranges: an index over a corpus you own, the nearest few passages for one question, and deep research into sources nobody has read yet. Each is a jump in the share of the window that is relevant reality — not a marginal gain.

The strongest form is a [grounding agent](./workflow-grounding.md#phase-1-grounding) — a [workflow agent](./workflow-agents.mdx) whose only job is retrieval for this specific task. It knows the question, explores both arms, filters and compresses what it finds, and hands the main agent a distilled, cited subset to act on; the main agent never pays for the search. A generic retriever guesses at relevance; a task-scoped one is aimed at it.

Grounding keeps the result honest — every claim traces to a source actually retrieved — but it raises the floor, not the ceiling. No retrieval strategy fixes a task that is too broad, a vague target, or a bad assumption already in motion.

**Next:** [Shaping the Work](./reliability-orchestration.md)

[^attention-budget]: Anthropic (2025), [_Effective context engineering for AI agents_](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — every token depletes a finite attention budget, so the goal is the smallest set of high-signal tokens.

[^agentic-search]: Huang et al. (2025), [_Deep Research Agents: A Systematic Examination And Roadmap_](https://arxiv.org/abs/2506.18096) — grounding runs as an iterative search loop with multi-hop retrieval and tool use, not a single query.

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
