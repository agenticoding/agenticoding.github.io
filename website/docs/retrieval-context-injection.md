---
title: 'Retrieval and Context Injection'
---

## Retrieval

The agents chapter showed that [memory is retrieval](./agent-context-state.mdx#memory-is-retrieval-not-recall) — the model does not remember your project conventions, previous sessions, or domain facts unless the harness retrieves them and feeds them into a later call. ChunkHound, OpenGrok, vector databases, BM25 indexes, web search, knowledge graphs, and memory systems are all retrieval flavors. They solve the same problem: choosing which facts deserve space in the next request.

Retrieval is a context engineering mechanism because it controls what evidence enters the context window and where it lands.

**Context effect:** harness-level RAG injects retrieved content before the user prompt, in the primacy zone. It is always visible but competes with context files for the fixed prefix. Tool-call retrieval — ChunkHound, grep, web search — appends results after the user prompt. Those results enter with recency advantage, then drift toward the middle as the conversation grows.

Each placement has different attention characteristics. Harness-level retrieval is always visible but always costs tokens. Tool-call retrieval loads on demand but competes with every other conversation turn for attention.

### The Token Cost of Discovery

Retrieval decisions are context engineering decisions because every retrieved chunk costs tokens. Three grep searches can return 18,000 tokens. Reading five files can add another 22,000. You are at 40,000 tokens before discovery is finished. Ten semantic chunks from a vector database can cost 15,000 tokens; reading related files adds 25,000; exploring patterns adds another 10,000. You are at 50,000 tokens before implementation starts.

That is why correct retrieval can still hurt reliability. A long search trail can push the actual task into the forgotten middle. A useful web page can arrive too early, sit too long, and compete with more relevant instructions later. Coherent distractor text is especially dangerous because it looks relevant while degrading reasoning more than obvious noise.[^context-rot]

### Retrieval Quality ≠ Context Quality

The failure mode most teams hit with retrieval is not "the retriever found irrelevant chunks." It is "the retriever found relevant chunks, but the model could not use them."[^context-injection]

Retrieval quality and context injection quality are separate problems. Finding the right facts is necessary but not sufficient. How those facts are structured, prioritized, and wrapped in the context determines whether the model can attend to them. A chunk that is relevant but arrives in the dead center of a 200K-token window may as well not exist.

This is why retrieval is a context engineering mechanism, not a precursor to it. The operator decides what to retrieve, where to place it, how much context budget to spend on it, and when to load it. Those are the same decisions that govern every other mechanism in the book's context modules.

:::warning The Agentic Coding Cost Trap

Most providers apply per-token surcharges past a context threshold:

- **Gemini 3.1 Pro:** 2× input pricing above 200K tokens
- **GPT-5.5 / GPT-5.4:** 2× input pricing above ~272K tokens
- **DeepSeek V4 Pro / Flash:** 1.5× pricing above 512K tokens
- **Claude 4.6/4.7 (Opus/Sonnet):** No surcharge — flat rate to 1M

For retrieval tasks (summarization, document review), the surcharge buys tokens in the model's strong accuracy zone. For agentic coding, you're paying a premium for tokens in the model's _worst_ accuracy zone — the middle, where your constraints and requirements go to die.
:::

---

[^context-rot]: Chroma Research (2025), [_Context Rot_](https://www.trychroma.com/research/context-rot).

[^context-injection]: ExplainX (2026), [_RAG Context Injection Pipeline Design_](https://www.explainx.ai/blog/rag-context-injection-pipeline-design-2026).

**Next:** [Reliability Levers](./reliability-levers.md)
