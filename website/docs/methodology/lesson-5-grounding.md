---
sidebar_position: 3
sidebar_label: 'Grounding'
sidebar_custom_props:
  sectionNumber: 5
title: 'Grounding: Anchoring Agents in Reality'
---

import UShapeAttentionCurve from '@site/src/components/VisualElements/UShapeAttentionCurve';
import GroundingComparison from '@site/src/components/VisualElements/GroundingComparison';

You ask your agent to fix the authentication bug. It confidently generates a solution using JWT verification patterns... that don't exist in your codebase. You use sessions, not JWTs. The agent just hallucinated a plausible implementation based on common patterns from its training data.

Here's the fundamental issue: **The agent doesn't know your codebase exists.** It doesn't know your architecture, your patterns, or your constraints. As covered in [Lesson 2: Agents Demystified](/fundamentals/lesson-2-how-agents-work), the context window is the agent's entire world—everything else doesn't exist. Without explicit grounding in your actual code and current documentation, agents generate statistically plausible solutions that may be completely wrong for your system.

**Grounding is how you inject reality into the context window.** You retrieve relevant external information—your codebase patterns, current docs, best practices—and feed it to the agent before generation. This lesson covers the engineering techniques that anchor agents in your actual system instead of hypothetical ones.

<!-- doc-only-start -->
<GroundingComparison />
<!-- doc-only-end -->

<!-- presentation-only-start -->

**Without Grounding:**

- Works from generic training patterns frozen at Jan 2025
- Guesses your architecture and libraries
- Hallucinates plausible implementations that don't match your codebase
- Misses current security vulnerabilities and API changes
- Confidently wrong solutions built from statistical patterns

**With Grounding:**

- Works from your actual codebase (ChunkHound retrieves real code)
- Uses current documentation (ArguSeek fetches latest API docs)
- Aware of recent security advisories and breaking changes
- Follows your existing patterns and architecture
- Solutions that integrate cleanly with your system
<!-- presentation-only-end -->

:::info Full Disclosure
Both [ChunkHound](https://chunkhound.github.io/) and [ArguSeek](https://github.com/ArguSeek/arguseek) are open source projects built by the course author. They're featured throughout because they implement the exact patterns this course teaches—sub-agent isolation, semantic search, context management.

The principles apply universally. Alternatives exist and are documented. Use what fits your workflow; the methodology stays consistent regardless of tooling.
:::

## Grounding: Anchoring Agents in Reality

**Grounding is how you inject reality into the context window.** You retrieve relevant external information—your codebase patterns, current docs, best practices—and feed it to the agent before generation. This lesson covers the engineering techniques that anchor agents in your actual system instead of hypothetical ones.

## The Discovery Problem: Agentic Search

When you assign "Fix the authentication bug," the agent starts with zero codebase knowledge. It doesn't know where auth code lives, what libraries you use, or how it's structured.

**Agentic search is how the agent discovers your codebase autonomously.** The agent calls tools on its own—Glob finds files matching patterns, Grep searches for keywords, Read examines code. The agent decides what to search, interprets results, and determines next steps.

**Example flow:**

```
Task: "Fix JWT expiration validation"

Agent: I'll search for JWT-related code
→ Grep("JWT", "**/*.ts")

Tool result: Found in:
  - src/auth/jwt.ts:45: export function verifyToken(token: string)
  - src/middleware/auth.ts:12: import { verifyToken } from '../auth/jwt'
  - tests/auth.test.ts:8: describe('JWT verification')

Agent: Let me read the verification logic
→ Read("src/auth/jwt.ts")

Tool result: [verification logic shows expiration check missing]

Agent: Found it - the verifyToken function doesn't check exp claim
```

In small codebases (under 10,000 lines), this works beautifully. Two or three searches return 5-10 files totaling 15,000 tokens. The agent reads them, builds a mental model, and solves the problem. Context stays clean.

**At scale, agentic search breaks down.** Search "authentication" in a 100,000-line project and you get 80+ files. Reading them consumes 60,000+ tokens before the agent finishes discovery—half your effective context window gone. Critical information you provided up front gets pushed into the ignored middle as search results flood in.

## The Scale Problem: Context Window Limits

Claude Sonnet 4.5 advertises 200,000 tokens. The reality? Reliable attention spans 60,000-120,000 tokens (30-60% of advertised)—the **context window illusion**.

<UShapeAttentionCurve />

**U-shaped attention is how transformers actually work.** The beginning and end of your context get strong attention. The middle gets skimmed or missed entirely. This isn't a bug—it's transformer architecture under realistic constraints.

**Fill your context and you lose control.** Your critical constraints get pushed into the ignored middle where the agent never sees them.

**Agentic search amplifies this problem at scale.** Three Grep searches return 18,000 tokens. Reading five files adds another 22,000 tokens. You're at 40,000 tokens and the agent hasn't finished discovery yet. Where are your initial constraints and requirements? Buried in the middle, being ignored.

### Solution 1: Semantic Search

**Semantic search lets you query by meaning, not keywords.** Ask for "authentication middleware that validates user credentials" and you get relevant code even if it never mentions those exact terms.

:::tip How Semantic Search Works

**Vector embeddings:** Your code gets converted to high-dimensional vectors (768-1536 dimensions) that capture semantic meaning. Similar concepts cluster together in vector space.

**Similarity matching:** Cosine similarity finds relevant chunks. "auth middleware", "login verification", and "JWT validation" map to nearby vectors—the model understands they're semantically related even though they use different words.

**Infrastructure:** Vector databases (ChromaDB, pgvector, Qdrant) plus approximate nearest neighbor (ANN) algorithms enable fast search. Rerankers refine results. You call `code_research()`, not low-level APIs.

**Key difference:** Embedding models with vector similarity search by concept, not text. This is fundamentally different from keyword matching.
:::

**Availability depends on your tool:**

**IDE-based assistants** (Cursor, Windsurf, Cline) typically include semantic search out-of-the-box. The editor handles indexing and vector search automatically.

**CLI agents** (Claude Code, Copilot CLI, Codex) need MCP servers to add semantic search. The [Model Context Protocol (MCP)](https://modelcontextprotocol.io) lets you extend CLI agents with tools like semantic search, web research, and database access.

**MCP servers for semantic code search:**

- [Claude Context](https://github.com/zilliztech/claude-context) - RAG-based semantic search
- [Serena](https://github.com/oraios/serena) - LSP-based bridge (lighter weight, limited to LSP symbol scope)
- [ChunkHound](https://chunkhound.github.io) - Structured pipeline with hybrid search

Once you have semantic search (built-in or via MCP), your agent combines it with Grep for hybrid discovery: conceptual search to find the right area, precise keyword matching to locate exact implementations.

**Semantic search extends your scale to 100,000+ lines of code.** You find relevant code faster with fewer false positives.

**But there's still a limitation:** Semantic search still fills your orchestrator context. Ten semantic chunks (15,000 tokens) plus reading files (25,000 tokens) plus exploring related patterns (10,000 tokens) means you're at 50,000 tokens—half your effective context consumed before the agent starts reasoning about the actual task.

## Solution 2: Sub-Agents for Context Isolation

A **sub-agent** is an agent invoked by another agent—like a function call, but for agents. The orchestrator agent writes a prompt (the function parameters) describing the research task: "Find all JWT authentication code and explain the current implementation." The sub-agent executes in its own isolated context, running searches and reading files. When complete, it returns a concise synthesis (the return value): "JWT implementation found at src/auth/jwt.ts using Passport.js..." This synthesis loads into the orchestrator's context—typically 2,000-5,000 tokens instead of the 50,000-150,000 tokens the sub-agent processed internally.

**How it works in practice:**

```
Your orchestrator (clean context with your task and constraints):
  "I need to understand how JWT authentication is implemented.
   Delegate research to code sub-agent."

Code sub-agent spawns (fresh isolated context):
  - Runs semantic search: "JWT authentication patterns" → 12,000 tokens of results
  - Reads 3 files: src/auth/jwt.ts, middleware/auth.ts, config/jwt.ts → 18,000 tokens
  - Searches related patterns: "token validation" → 7,000 tokens
  - Total consumed in sub-agent context: 37,000 tokens

Sub-agent synthesizes and returns to orchestrator:
  "JWT authentication implementation found:
   - Location: src/auth/jwt.ts:45-67
   - Library: Passport.js with JWT strategy
   - Pattern: Express middleware → Passport strategy → token validation
   - Algorithm: RS256 with public key verification
   - Current issue: Missing expiration check in verifyToken()"

Your orchestrator receives: 180 tokens instead of 37,000
```

**The trade-off is token cost, not accuracy.** You pay to process tokens in both contexts, increasing total cost significantly, but your orchestrator maintains a clean context throughout. This means first-iteration accuracy, which typically saves tokens compared to multiple correction cycles from a polluted context.

**Without sub-agents, you can still manage.** Exploit the U-curve: Put critical constraints at the start, put tasks at the end. Supporting information goes in the middle where it's skimmable but available.

### Two Sub-Agent Architectures

**Autonomous architecture:** You give the sub-agent tools (Grep, Read, Glob) and a system prompt defining its research strategy. The agent autonomously decides what to search, what to read, and how to synthesize.

Example: Claude Code's Explore agent. You send it a research question, it autonomously picks tools and sequences, then synthesizes findings. Simpler to build, cheaper to run, flexible across different research tasks.

**Structured architecture:** You build a deterministic control plane that defines the exact search algorithm (breadth-first traversal, hybrid semantic + symbol search). The LLM makes tactical decisions within your structure ("Should I expand this symbol?" "Is this chunk relevant?").

Example: ChunkHound uses a fixed multi-hop pipeline where the system controls traversal strategy and the LLM ranks relevance at decision points. More complex to build, higher cost, but maintains consistency at extreme scale.

**The architectural trade-off:** Autonomous agents work well but degrade in large codebases where they make suboptimal exploration choices. Structured agents scale reliably but cost more to build and run.

<!-- presentation-only-start -->

**Sub-agent architecture comparison - both approaches are valid depending on codebase scale. Use neutral styling.**

| Approach A (Autonomous)                    | Approach B (Structured)                       |
| ------------------------------------------ | --------------------------------------------- |
| Agent decides search strategy autonomously | Deterministic control plane defines algorithm |
| Simpler to build and maintain              | Scales reliably to millions of LOC            |
| Works well for varied research tasks       | LLM makes tactical decisions within structure |
| Degrades on very large codebases           | Higher cost and complexity to build           |

<!-- presentation-only-end -->

### Sub-Agent Availability

**Availability depends on your agent platform:**

**Claude Code** includes the Explore agent built-in—an autonomous sub-agent for code research that works out-of-the-box.

**Other CLI agents** (Copilot CLI, Aider, etc.) and **most IDE assistants** don't have built-in sub-agent functionality for code research. For these platforms, [ChunkHound](https://chunkhound.github.io) via MCP is currently the only option to add sub-agent-based code research capabilities.

**IDE assistants** (Cursor, Windsurf, Cline) typically don't expose sub-agent architectures directly, though some may have internal code research capabilities. Check your IDE's documentation to see what's available.

## Code Grounding: Choosing Tools by Scale

Your codebase size determines which grounding approach works. Here's how to choose:

### Tool Selection Matrix

| Scale           | Recommended Tools                                                                                                                                             | Breaking Point                                                 | Why                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **< 10k LOC**   | Agentic search (Grep, Read, Glob)                                                                                                                             | N/A - works reliably at this scale                             | Fast, cheap, sufficient coverage. No indexing overhead.                                                                                                                 |
| **10-100K LOC** | **Claude Code:** Explore agent<br/>**Other CLI agents:** ChunkHound code research (MCP)<br/>**Alternative:** Semantic search (Claude Context, Serena via MCP) | Searches returning 50+ files start overwhelming context        | Sub-agents isolate research in separate contexts. Semantic search extends agentic search with meaning-based queries. ChunkHound is the only MCP-based sub-agent option. |
| **100K+ LOC**   | ChunkHound code research (structured sub-agent)                                                                                                               | Agentic search misses architectural connections across modules | Essential at 1M+ LOC. Only approach with progressive aggregation across large codebases.                                                                                |

:::tip Measuring LOC

Use [`cloc`](https://github.com/AlDanial/cloc) to measure your codebase: `cloc .` returns language-by-language breakdown. Focus on the "Code" column for accurate LOC counts.
:::

### Deep Dive: ChunkHound Architecture

[ChunkHound](https://chunkhound.github.io)—structured pipeline for code research at scale.

**Key positioning:** ChunkHound is currently the only MCP-based sub-agent for code research. For CLI agents other than Claude Code (which has Explore built-in), ChunkHound via MCP is the only way to add sub-agent functionality.

**Pipeline:**

1. **Multi-hop BFS traversal** through semantic relationships
2. **Hybrid semantic + symbol search**—conceptual discovery, then exhaustive regex for every symbol
3. **Map-reduce synthesis**—architectural relationships with `file:line` citations

**Scale guidance:**

- **Under 10,000 LOC:** Explore agent is cheaper (ChunkHound adds 1-2x cost and latency)
- **Around 10,000 LOC:** Inflection point—ChunkHound becomes valuable if you're repeatedly connecting components across the codebase
- **100,000+ LOC:** Highly valuable—autonomous agents start showing incomplete findings
- **1,000,000+ LOC:** Essential—only approach with progressive aggregation

**Usage:** `Research our authentication middleware architecture`

**Returns:** Component locations, architectural patterns, relationships across modules with citations.

**Use for:** Feature implementation prep, complex debugging, refactoring analysis, code archaeology, when Explore returns incomplete results.

**Alternatives:** [Claude Context](https://github.com/zilliztech/claude-context)—semantic search via RAG. [Serena](https://github.com/oraios/serena)—LSP bridge instead of full semantic search (faster, lighter, but limited to language server symbol scope). Neither implements structured multi-hop traversal.

## Web Grounding: Same Pattern, Different Sources

You need more than just your codebase. You need current ecosystem knowledge: API docs, best practices, security advisories, recent research.

**Web grounding follows the same progression as code grounding:** Simple tools work initially, then hit context limits, then need sophisticated solutions.

### Built-In Web Search

Most assistants (Claude Code, Copilot, Cursor) include basic web search. This works for simple queries.

**The limitation:** Same context pollution problem. Each search consumes 8,000-15,000 tokens. Each page you fetch adds 3,000-10,000 tokens. The U-curve still applies—fill your context with search results and your original constraints disappear into the ignored middle.

### Synthesis Tools (Perplexity)

Perplexity and similar tools search, fetch, and synthesize before returning results to you.

**The improvement:** Raw fetching would cost 15,000-30,000 tokens. Synthesis compresses this to 3,000-8,000 tokens per query.

**The limitations:**

- Uses custom indexes (Bing) instead of Google, so search quality suffers
- You hit context limits after 3-5 queries
- No state management—follow-up questions force the tool to re-explain basics instead of building on previous research

### ArguSeek: Isolated Context + State

[ArguSeek](https://github.com/ArguSeek/arguseek) is a web research sub-agent with isolated context and semantic state management.

**The scale advantage:** ArguSeek processes 12-30 sources per call. You can make tens of calls per task, scanning 100+ sources total while keeping your orchestrator context clean.

**How it works:**

1. **Google Search API** provides search quality instead of Bing/Brave alternatives
2. **Query decomposition** (via Gemini) runs 3 concurrent query variations: official docs + community discussions + security advisories
3. **Semantic subtraction** means follow-up queries skip already-covered content and advance your research instead of repeating basics

**Example research sequence:**

```
Q1: "Passport.js JWT authentication best practices?"
    → Processes 15 sources
    → Returns 2,800 tokens to your orchestrator

Q2: "Known security vulnerabilities in Passport JWT?" (builds on Q1 context)
    → Processes 20 sources, skipping duplicate content from Q1
    → Returns 3,600 tokens (no repeated basics)

Q3: "RS256 vs HS256 implementation trade-offs?" (builds on Q1+Q2 context)
    → Processes 18 sources, skipping already-covered territory
    → Returns 2,900 tokens (advances research)

Total research: 53 sources processed
Total cost to your orchestrator: 9,300 tokens instead of 42,000+ from raw fetching
```

### Deep Dive: ArguSeek Architecture

[ArguSeek](https://github.com/ArguSeek/arguseek)—structured pipeline for web research with semantic state management.

**Key Differentiators:**

1. **Google Search API**—quality vs Bing/proprietary
2. **Semantic subtraction**—stateless but context-aware. Follow-ups skip covered content, advance research vs re-explaining
3. **Query decomposition**—3 concurrent variations per query (docs + community + advisories)
4. **Bias detection**—flags vendor marketing, triggers counter-research
5. **PDF synthesis**—Gemini Vision extraction

**Tools:**

- `research_iteratively`—multi-source synthesis with citations
- `fetch_url`—targeted page extraction

**Use for:** Best practices research, competing approaches, security advisories, new tech learning, bias verification.

**Alternatives:** [Perplexity](https://perplexity.ai) (Bing), [OpenAI Deep Research](https://platform.openai.com/docs/guides/deep-research), [Consensus](https://consensus.app), [Elicit](https://elicit.com). Most lack Google API + semantic subtraction combo.

## Production Pattern: Multi-Source Grounding

In production, you combine code grounding with web grounding:

```
Task: "Implement OAuth2 client credentials flow for our API"

1. Code research: How does existing authentication work? (ChunkHound)
   → Returns: Current session-based auth architecture, middleware patterns,
              where auth config lives (3,200 tokens)

2. Web research: What are current OAuth2 best practices and known CVEs? (ArguSeek)
   → Returns: RFC 6749 implementation guidance, security considerations,
              recent vulnerabilities in popular libraries (4,800 tokens)

3. Implementation: Synthesize both sources
   → Follows your existing architecture patterns (code-grounded)
   → Uses 2025 security standards (web-grounded)
   → Avoids known vulnerabilities (web-grounded)
   → Integrates cleanly with your middleware (code-grounded)
```

This multi-source approach prevents two failure modes:

- Code-only grounding prevents hallucinations but risks outdated patterns
- Web-only grounding gives you current best practices but doesn't fit your architecture

Combining both gives you solutions that work for your specific system using current standards.

## Key Takeaways

**The agent only knows what's in the context window**
Without grounding, agents hallucinate plausible solutions based on training data patterns. You ground agents by injecting external information (your codebase, current docs, research) into the context before generation.

**Agentic search is autonomous tool-based discovery**
The agent calls Grep, Read, and Glob on its own to explore your codebase. This works beautifully for small projects (under 10,000 lines). At scale, search results flood the context window and push your constraints into the ignored middle.

**The context window illusion: advertised capacity ≠ effective attention**
Models advertise 200,000 tokens but reliably process 60,000-120,000 tokens (30-60%). The U-shaped attention curve means the beginning and end get strong attention while the middle gets skimmed or ignored. This is transformer architecture under realistic constraints, not a bug.

**Semantic search queries by meaning instead of keywords**
Vector embeddings let you search by concept: "authentication middleware" finds relevant code even without exact keyword matches. This extends your scale to 100,000+ lines of code.

**Sub-agents isolate research in separate contexts**
You delegate research to a sub-agent with its own context. It processes 50,000-150,000 tokens of search results and returns a 2,000-5,000 token synthesis. This costs more tokens but delivers first-iteration accuracy through clean orchestrator context.

**Two sub-agent architectures serve different scales**
Autonomous agents (Claude Code's Explore) decide their own strategy—simpler and flexible. Structured agents (ChunkHound) follow deterministic algorithms—more expensive but scale reliably to millions of lines.

**Choose grounding tools by codebase scale**
Under 10,000 LOC: Agentic search works reliably. 10,000-100,000 LOC: Add semantic search or Explore agent. Over 100,000 LOC: Use structured code research (ChunkHound). The tool you need depends on your scale.

**Web grounding follows the same progression**
Built-in search works for simple queries. Synthesis tools (Perplexity) compress results. Sub-agents (ArguSeek) maintain state across 100+ sources while keeping your context clean.

**Production systems combine code + web grounding**
Ground in your codebase to prevent hallucinations and match your architecture. Ground in current web sources to get best practices and avoid outdated patterns. Combining both prevents solutions that work in theory but don't fit your system.

---

**Next:** The methodology module is complete. You now have the fundamental workflows (Plan > Execute > Validate), communication patterns (Prompting 101), and context management strategies (Grounding) to operate AI agents effectively in production environments.
