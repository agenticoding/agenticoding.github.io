---
source: methodology/lesson-5-grounding.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-08T14:21:41.583Z
model: claude-haiku-4.5
tokenCount: 3280
---

Alex: Let's start with a concrete nightmare. You assign your agent to fix an authentication bug. It confidently generates a solution using JWT verification patterns. You merge it. Then your tests fail. Turns out your entire system uses sessions, not JWTs. The agent just hallucinated a plausible implementation based on whatever was in its training data.

Sam: Right, and that happens because the agent has zero context about your actual codebase.

Alex: Exactly. Here's the fundamental problem: the agent doesn't know your codebase exists. It doesn't know your architecture, your patterns, or your constraints. The context window is the agent's entire world. Without explicitly feeding it information about your real system, it's going to generate statistically plausible solutions that are completely wrong for your environment.

Sam: So grounding is about injecting that reality?

Alex: Yes. Grounding is how you anchor agents in your actual system instead of hypothetical ones. You retrieve relevant information—your codebase patterns, current documentation, best practices—and feed it into the context before the agent generates anything. We'll walk through the engineering techniques that make this work at different scales.

Sam: Because I imagine a two-person team operating differently than a team working on a million-line monolith.

Alex: Exactly. Let's start with discovery. When you assign "Fix the authentication bug," the agent starts with zero codebase knowledge. It doesn't know where the auth code lives, what libraries you're using, or how it's structured. How does the agent figure this out?

Sam: It searches.

Alex: Right. Agentic search. The agent calls tools on its own—Glob finds files matching patterns, Grep searches for keywords, Read examines code. The agent decides what to search, interprets the results, and determines the next steps autonomously. It's not you feeding information in; it's the agent discovering your codebase.

Sam: And that works?

Alex: Beautifully, at small scale. In codebases under 10,000 lines, two or three searches return 5 to 10 files totaling about 15,000 tokens. The agent reads them, builds a mental model, and solves the problem. The context stays clean throughout.

Sam: But "small scale" doesn't stay small.

Alex: Exactly. Scale breaks agentic search. Search "authentication" in a 100,000-line project and you get 80 plus files. Reading them consumes 60,000 tokens or more before the agent even finishes discovery. That's half your effective context window, gone. Your original constraints that you carefully wrote at the beginning? They're buried in the middle now, being skimmed or ignored entirely.

Sam: This is the context window illusion you mentioned?

Alex: Yes. Claude Sonnet 4.5 advertises 200,000 tokens. The reality? Reliable attention spans 60,000 to 120,000 tokens—30 to 60 percent of advertised. That's not marketing hyperbole; that's transformer architecture under realistic constraints. It's called U-shaped attention. The beginning and end of your context get strong attention. The middle gets skimmed or missed entirely.

Sam: So if you fill your context, you lose control of what the model actually reads.

Alex: Precisely. Your critical constraints get pushed into the ignored middle. Agentic search amplifies this problem. Three Grep searches return 18,000 tokens. Reading five files adds another 22,000 tokens. You're at 40,000 tokens and the agent hasn't finished discovery yet. Now where are your original constraints and requirements? Buried. Being ignored.

Sam: What's the solution at that scale?

Alex: Solution one: semantic search. Instead of searching by keywords, you query by meaning. Ask for "authentication middleware that validates user credentials" and you get relevant code even if it never mentions those exact terms.

Sam: How does that work?

Alex: Your code gets converted to high-dimensional vectors—768 to 1536 dimensions—that capture semantic meaning. Similar concepts cluster together in vector space. "Auth middleware," "login verification," and "JWT validation" map to nearby vectors because the model understands they're semantically related even though they use different words. Then cosine similarity finds the relevant chunks. Vector databases like ChromaDB, pgvector, or Qdrant handle the infrastructure with approximate nearest neighbor algorithms to keep search fast.

Sam: That's a lot more sophisticated than keyword matching.

Alex: It is. And availability depends on your tool. IDE-based assistants like Cursor, Windsurf, or Cline typically include semantic search out-of-the-box. The editor handles indexing and vector search automatically. CLI agents need MCP servers to add it. The Model Context Protocol lets you extend CLI agents with tools like semantic search, web research, database access.

Sam: So if I'm using Claude Code or Copilot CLI, I need to set up an MCP server.

Alex: Right. Three main options: Claude Context—RAG-based semantic search. Serena—LSP-based bridge, lighter weight but limited to language server symbol scope. ChunkHound—structured pipeline with hybrid search. Once you have semantic search, your agent combines it with Grep for hybrid discovery. Conceptual search to find the right area, precise keyword matching to locate exact implementations.

Sam: That extends your scale?

Alex: To 100,000 plus lines of code. You find relevant code faster with fewer false positives. But here's the catch: semantic search still fills your orchestrator context. Ten semantic chunks at 15,000 tokens, reading files at 25,000 tokens, exploring related patterns at 10,000 tokens—you're at 50,000 tokens before the agent starts reasoning about the actual task. You've solved the discovery problem but not the context pollution problem.

Sam: So you need something else.

Alex: Solution two: sub-agents. A sub-agent is an agent invoked by another agent. It's like a function call, but for agents. Your orchestrator writes a prompt describing the research task: "Find all JWT authentication code and explain the current implementation." The sub-agent executes in its own isolated context, running searches and reading files independently. When complete, it returns a concise synthesis: "JWT implementation found at src/auth/jwt.ts using Passport.js." That synthesis loads into the orchestrator's context—typically 2,000 to 5,000 tokens instead of the 50,000 to 150,000 tokens the sub-agent processed internally.

Sam: You're paying more in total tokens but the orchestrator stays clean.

Alex: Exactly. You pay to process tokens in both contexts—that's more expensive—but your orchestrator maintains a clean context throughout. First-iteration accuracy improves, which typically saves tokens compared to multiple correction cycles from a polluted context.

Sam: Two different sub-agent architectures?

Alex: Right. Autonomous architecture: you give the sub-agent tools—Grep, Read, Glob—and a system prompt defining its research strategy. The agent autonomously decides what to search, what to read, how to synthesize. Claude Code's Explore agent is the canonical example. Simpler to build, cheaper to run, flexible across different research tasks.

Sam: And structured?

Alex: Structured architecture: you build a deterministic control plane that defines the exact search algorithm. Breadth-first traversal, hybrid semantic plus symbol search. The LLM makes tactical decisions within your structure. "Should I expand this symbol?" "Is this chunk relevant?" ChunkHound is the example here. More complex to build, higher cost, but maintains consistency at extreme scale.

Sam: And the trade-off is?

Alex: Autonomous agents work well but degrade in large codebases where they make suboptimal exploration choices. Structured agents scale reliably but cost more to build and run. Availability: Claude Code includes Explore built-in. Other CLI agents—Copilot CLI, Aider, etc.—don't have built-in sub-agent functionality. ChunkHound via MCP is currently the only option to add sub-agent-based code research for those platforms. IDE assistants typically don't expose sub-agent architectures directly, though some may have internal code research.

Sam: So how do I choose? I'm working on a 50,000-line codebase.

Alex: This is the decision matrix. Under 10,000 lines of code, agentic search works reliably. Grep and Read are sufficient. 10,000 to 100,000 lines: add semantic search or use the Explore agent. This is your inflection point. Over 100,000 lines: use structured code research—ChunkHound. Essential at 1 million plus lines. It's the only approach with progressive aggregation across truly massive codebases.

Sam: Why does ChunkHound matter at 100,000 lines when semantic search already helps?

Alex: Semantic search solves discovery but not architectural understanding. ChunkHound's multi-hop BFS traversal through semantic relationships, combined with hybrid semantic plus symbol search, lets the agent build a connected mental model of your architecture. It does map-reduce synthesis across modules with file:line citations. Autonomous agents start showing incomplete findings at 100,000 lines—they miss connections across the codebase. ChunkHound doesn't.

Sam: And for your 50,000-line codebase?

Alex: You're in the transition zone. Explore agent is cheaper. If you're repeatedly connecting components across the codebase, ChunkHound becomes valuable. But you're not forced into it.

Sam: Now what about information outside your codebase?

Alex: Web grounding follows the same progression. You need current ecosystem knowledge—API docs, best practices, security advisories, recent research. Simple web search works initially, then hits the same context pollution problem. Each search consumes 8,000 to 15,000 tokens. Each page you fetch adds 3,000 to 10,000 tokens. Fill your context with search results and your original constraints disappear.

Sam: Synthesis tools?

Alex: Perplexity and similar tools search, fetch, and synthesize before returning results. The improvement: raw fetching costs 15,000 to 30,000 tokens; synthesis compresses it to 3,000 to 8,000 tokens per query. But limitations: Perplexity uses custom indexes instead of Google, so search quality suffers. You hit context limits after 3 to 5 queries. No state management—follow-up questions force re-explanation instead of building on previous research.

Sam: Better but not perfect.

Alex: Right. ArguSeek is a web research sub-agent with isolated context and semantic state management. The scale advantage: ArguSeek processes 12 to 30 sources per call. You can make tens of calls per task, scanning 100 plus sources total while keeping your orchestrator context clean.

Sam: How?

Alex: Google Search API provides search quality. Query decomposition runs 3 concurrent query variations—official docs, community discussions, security advisories. Semantic subtraction means follow-up queries skip already-covered content and advance research instead of repeating basics. You run a sequence of research calls, each building on the previous without polluting your main context.

Sam: So web grounding scales the same way code grounding does?

Alex: Exactly the same pattern. Built-in search for simple queries. Synthesis tools to compress results. Sub-agents to maintain state across 100 plus sources while keeping your context clean.

Sam: How do you combine them?

Alex: Multi-source grounding. In production, you ground in both your codebase and current web sources. Code grounding prevents hallucinations and ensures your solutions match your architecture. Web grounding ensures you're using current best practices and not implementing outdated patterns.

Sam: That prevents two failure modes.

Alex: Yes. Code-only grounding prevents hallucinations but risks outdated patterns. Web-only grounding gives you current best practices but doesn't fit your architecture. Combining both gives you solutions that work for your specific system using current standards.

Sam: So the core lesson: the agent's entire world is the context window.

Alex: That's it. Without grounding, agents hallucinate plausible solutions based on training data. Grounding injects reality—your codebase, your documentation, current research. The tools and techniques scale with your codebase size. At 10,000 lines, agentic search and basic web search work. At 100,000 lines, add semantic search for code and ArguSeek for web. At a million lines, you need structured approaches like ChunkHound. The U-shaped attention curve means fill your context and you lose control of what's actually read. Put critical constraints at the beginning and end. Supporting information goes in the middle where it's skippable but available.

Sam: And this is why the methodology module mattered—Plan, Execute, Validate—because you're not just prompting blindly.

Alex: Right. You're building a system. You plan what context you need, you execute searches and synthesis, you validate that the agent has the right information before it generates anything. Grounding is how you take control of the agent's world instead of leaving it to hallucinate.
