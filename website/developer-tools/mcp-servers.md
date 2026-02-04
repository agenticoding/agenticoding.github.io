---
title: MCP Servers
sidebar_position: 4
---

# MCP Servers

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io) extends CLI agents with specialized capabilities—code research, web grounding, browser automation. While IDE-based assistants (Cursor, Windsurf) often include these features built-in, CLI agents (Claude Code, Copilot CLI, Aider) rely on MCP servers to add functionality beyond basic file operations.

These MCP servers address the critical gaps in AI-assisted development workflows.

## Code Research

### ChunkHound

[ChunkHound](https://chunkhound.github.io) provides semantic code search and structured sub-agent research for large codebases.

**What it does:**

- Multi-hop semantic search through code relationships
- Hybrid semantic + symbol search (conceptual discovery, then exhaustive regex)
- Map-reduce synthesis with architectural relationships and `file:line` citations

**When to use it:**

- **10,000-100,000 LOC:** Valuable when repeatedly connecting components across the codebase
- **100,000+ LOC:** Highly valuable as autonomous agents show incomplete findings
- **1,000,000+ LOC:** Essential—only approach with progressive aggregation at extreme scale

**Key trade-off:** Higher token cost (1-2x) vs autonomous search, but maintains first-iteration accuracy through context isolation.

**Installation:**

```bash
uv tool install chunkhound
```

Requires Python 3.10+ and the uv package manager. See [ChunkHound on GitHub](https://github.com/chunkhound/chunkhound) for API key configuration and setup details.

**Learn more:** [Lesson 5: Grounding](/docs/methodology/lesson-5-grounding#deep-dive-chunkhound-architecture) covers ChunkHound's architecture, pipeline design, and scale guidance in detail.

## Web Research

### ArguSeek

[ArguSeek](https://github.com/ArguSeek/arguseek) is a web research sub-agent with isolated context and semantic state management.

**What it does:**

- Google Search API (quality vs Bing/proprietary alternatives)
- Query decomposition—3 concurrent variations per query (docs + community + security advisories)
- Semantic subtraction—follow-up queries skip covered content and advance research
- Bias detection—flags vendor marketing, triggers counter-research

**When to use it:**

- Researching best practices and competing approaches
- Finding security advisories and CVEs
- Learning new technologies with current (post-training) information
- Multi-source research (processes 12-30 sources per call, scales to 100+ sources per task)

**Key advantage:** Maintains state across queries—builds on previous research instead of re-explaining basics, keeping your orchestrator context clean.

**Installation:**

```bash
brew install arguseek
```

Requires Go 1.23+ and Google API credentials. See [ArguSeek on GitHub](https://github.com/ArguSeek/arguseek) for detailed setup instructions and configuration options.

**Learn more:** [Lesson 5: Grounding](/docs/methodology/lesson-5-grounding#deep-dive-arguseek-architecture) explains ArguSeek's architecture, semantic subtraction, and research patterns.

## Browser Automation

Browser automation for AI agents is handled by the **agent-browser CLI**—a purpose-built tool that delivers consistently better results than MCP-based alternatives.

See [agent-browser in CLI Tools](/developer-tools/cli-tools#agent-browser) for installation and usage.

**Why CLI over MCP for browser automation:**
- **Better results:** Ref-based accessibility tree produces deterministic, reliable element selection
- **Token efficient:** 500-2000 tokens per snapshot vs 5,000-15,000 for MCP DOM dumps
- **Simpler setup:** No MCP configuration, works with any shell-capable agent
- **Faster iteration:** Native Rust CLI with instant command parsing

:::note Deprecated: MCP Browser Servers
Previous recommendations included Playwright MCP and Chrome DevTools MCP. These are now deprecated for agentic workflows—agent-browser's ref-based approach delivers more reliable automation with lower token overhead. The MCP servers remain available for legacy integrations but are not recommended for new projects.
:::

---

**Related Course Content:**

- [Lesson 5: Grounding](/docs/methodology/lesson-5-grounding) - Detailed architecture and use cases for ChunkHound and ArguSeek
- [Lesson 7: Planning & Execution](/docs/practical-techniques/lesson-7-planning-execution) - Multi-agent workflows that leverage MCP capabilities
