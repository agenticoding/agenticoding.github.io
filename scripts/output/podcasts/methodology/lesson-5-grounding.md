---
source: methodology/lesson-5-grounding.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-08T12:32:23.747Z
model: claude-haiku-4.5
tokenCount: 2658
---

Alex: Let's talk about something fundamental that trips up most engineers when they start working with AI agents: the agent doesn't actually know your codebase. It knows its training data and whatever you put in the context window. That's it.

Sam: Right, so when you ask it to fix an authentication bug, it's starting from zero. It doesn't know where the auth code lives, what libraries you're using, none of that.

Alex: Exactly. Without that knowledge, it generates plausible-sounding solutions based on statistical patterns—not your actual architecture, your specific constraints, or the real root cause. This is what we call the grounding problem.

Sam: So grounding is basically anchoring the agent in reality—in your actual codebase, your docs, your constraints?

Alex: That's right. We retrieve relevant external information and inject it into context before the agent generates anything. It's the difference between working blind versus having the relevant facts in front of you.

Sam: What does that look like in practice? Like, when you assign a task to an agent?

Alex: Let's use your authentication bug scenario. The agent needs to find auth code, understand how it's structured, see what libraries you're using, understand the flow. That discovery process is called agentic search.

Sam: Walk me through how that works.

Alex: The agent starts with zero codebase knowledge. Instead of you telling it exactly where to look, it autonomously decides: First, glob for files matching auth patterns. Then grep for authentication keywords in those files. Then read the relevant code. The agent decides the strategy, interprets results, and determines next steps. It's a search loop that continues until it has enough context to reason about the problem.

Sam: That sounds efficient. What's the downside?

Alex: It works beautifully for small codebases—roughly 10,000 lines of code or less. A few search queries return manageable results, context stays clean, the agent finds what it needs. But at scale, it falls apart. Search "authentication" in a 100K line project and you get 50-plus files. Reading those fills your context window before discovery even completes. Worse, critical constraints get buried in the middle of all that context.

Sam: Why the middle? That's an odd place for information to get lost.

Alex: This is where transformer architecture meets reality. Claude Sonnet 4.5 advertises 200K tokens of context, but reliable attention actually spans about 60 to 120K tokens—that's 30 to 60 percent of the advertised window. It's what we call the context window illusion.

Sam: So you're saying the beginning and end of the context get strong attention, but the middle gets skimmed?

Alex: Exactly. It's called U-shaped attention, and it's not a bug—it's how transformers behave under realistic computational constraints. The first tokens get full attention because they set up the problem. The last tokens get full attention because that's where the generation begins. Everything in between? It gets degraded attention.

Sam: And that becomes a real problem when you're doing agentic search at scale.

Alex: It becomes catastrophic. You run a few grep searches returning maybe 20K tokens. You read some files—another 15K tokens. Before the agent finishes discovery, you've hit 35K tokens of context. You've pushed the initial constraints—the thing that actually matters—into the middle of a giant ignored zone. The agent's working with incomplete information even though you have all the context loaded.

Sam: So that's where semantic search comes in?

Alex: That's the first solution, yes. Instead of keyword matching, you search by meaning. When you ask for "authentication middleware that validates user credentials," the system finds relevant code even if it doesn't use those exact words. It might find code labeled "JWT validation" or "login verification"—semantically related concepts that keyword search would miss.

Sam: How does that actually work at the technical level?

Alex: Embeddings. Code gets converted into high-dimensional vectors—typically 768 to 1536 dimensions—where each vector captures semantic meaning. Similar concepts cluster in vector space. So "auth middleware," "login verification," and "JWT validation" all map to nearby vectors. The model understands they're related even though they use different words.

Sam: And then you search those vectors?

Alex: Right. Cosine similarity finds relevant chunks quickly. You use vector databases like ChromaDB, pgvector, or Qdrant with approximate nearest neighbor algorithms for fast search. Rerankers refine the results. As a user, you just call code_research and get semantically relevant results back.

Sam: The infrastructure is abstracted away?

Alex: It should be. For IDE-based assistants like Cursor, Windsurf, or Cline, semantic search is typically built in—integrated indexing and vector search right in the editor. For CLI agents like Claude Code or the Copilot CLI, you need to add it via MCP servers.

Sam: MCP—that's Model Context Protocol?

Alex: Yes. It lets you extend CLI agents with tools that aren't built in—semantic search, web research, database access, whatever you need. Tools like Claude Context provide RAG-based semantic search. Serena is LSP-based and lighter weight but limited to LSP symbol scope. ChunkHound provides structured pipeline with hybrid search combining semantic and keyword approaches.

Sam: So once you have semantic search available, the agent can be smarter about discovery?

Alex: Much smarter. It combines semantic search with grep—conceptual discovery plus precise matching. You can extend the approach to codebases around 100K lines or larger. It finds relevant code faster with fewer false positives. But there's still a limitation.

Sam: What limitation?

Alex: You're still filling the orchestrator's context. Ten chunks at 15K tokens, plus reading related files at 25K tokens, plus exploring related patterns at 10K tokens—you've hit context half-full before you even start reasoning about the actual problem. The discovery information crowds out space for solution reasoning.

Sam: So semantic search helps but doesn't fully solve the scale problem?

Alex: Right. That's where the second solution comes in: sub-agents. You run research in isolated contexts. The orchestrator delegates the discovery task to a sub-agent. The sub-agent searches and reasons in its own context, then returns a concise synthesis. The orchestrator gets back a focused result instead of 40K tokens of raw discovery.

Sam: What's the cost of that?

Alex: About 3x token usage because you're processing both the sub-agent context and the orchestrator context. But here's why it's worth it: clean context means first-iteration accuracy. You get better solutions faster, which reduces total usage over multiple correction cycles. A few extra tokens up front saves many correction loops later.

Sam: Are there different ways to build sub-agents?

Alex: Two main architectures. Autonomous agents use system prompts and tools—the agent decides its strategy. Claude Code's Explore agent is a good example. It receives a research question, autonomously picks between Grep, Read, and Glob, synthesizes results, and returns findings. It's simpler and cheaper because it's flexible and requires less coordination overhead.

Sam: And the other approach?

Alex: Structured sub-agents use a deterministic control plane with strategic LLM calls. The system defines an algorithm—maybe breadth-first search through dependencies or a hybrid search pattern. The LLM makes tactical choices within that framework, like "should we expand this symbol?" ChunkHound does this. It's more complex to build but maintains consistency at scale. It degrades less gracefully under pressure.

Sam: So autonomous is simpler but might miss connections in large codebases, and structured is more reliable but requires more engineering?

Alex: That's the essential trade-off. Autonomous works great for small to medium projects. Structured scales better but costs more in development and token usage.

Sam: How do you decide which approach to use in your own projects?

Alex: The decision matrix is driven by codebase size. Under 10,000 lines, agentic search with Grep and Read works fine. You get a few search results, read the relevant code, and you're done in one or two queries. No special infrastructure needed.

Sam: And the next tier?

Alex: Between 10,000 and 100,000 lines, switch to semantic search. Tools like ChunkHound or Claude Context via MCP servers. You're trading some setup complexity for much faster discovery of relevant code and fewer false positives. The semantic approach finds meaningful connections that keyword search misses.

Sam: What happens above 100,000 lines?

Alex: You need structured search with ChunkHound's multi-hop traversal. At that scale, autonomous agents start missing connections because they're making discovery decisions in degraded context. Structured pipelines maintain consistency because the algorithm is fixed—the LLM ranks relevance and synthesizes, but the search strategy is deterministic and proven.

Sam: So it's not just about handling more code, it's about handling the increasing number of connections and dependencies?

Alex: Exactly. In a small codebase, finding an authentication function and reading it gives you 90 percent of context. In a large codebase, that function might depend on validators defined in five different files, middleware from three others, and shared utilities from somewhere else. You need a search strategy that can traverse those dependencies reliably. Semantic search plus structured traversal gives you that.

Sam: This seems like a decision that should happen before you even start building the agent system.

Alex: It absolutely should. If you're building against a massive legacy codebase, you architect for semantic search from day one. If you're working on a smaller project, keeping it simpler is the right call. The worst mistake is bolting on semantic search infrastructure later when you've already built an autonomous search system that's hitting its limits.

Sam: So the lesson here is: understand your codebase size, understand the attention curve problem, and choose your search strategy accordingly before you start?

Alex: That's it. Grounding isn't optional—your agent needs to understand your codebase. The question is how you architect that discovery process given your specific constraints. Get that decision right, and your agents become reliable. Get it wrong, and you're fighting context management issues for your entire project.
