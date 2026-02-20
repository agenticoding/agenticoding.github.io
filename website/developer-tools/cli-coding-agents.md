---
title: CLI Coding Agents
sidebar_position: 1
---

# CLI Coding Agents

**CLI coding agents are the orchestration layer for multi-agent development.** While [terminals](/developer-tools/terminals) provide the environment and [CLI tools](/developer-tools/cli-tools) enable efficient operations, coding agents are what actually write, edit, and refactor your code. They combine language model capabilities with file system access, shell execution, and codebase understanding.

This page covers agents that operate primarily from the command line—distinct from IDE-embedded assistants like Cursor or Windsurf. CLI agents offer advantages for senior engineers: scriptability, SSH compatibility, lower resource overhead, and seamless integration with multi-worktree workflows.

## Claude Code

[**Claude Code**](https://claude.com/product/claude-code) is Anthropic's official CLI agent, released February 2025. It powers the workflows throughout this course and represents a "tool use first" approach where the agent operates through explicit tool calls rather than autonomous code generation.

**Key differentiators:**

- **Hierarchical CLAUDE.md:** Multi-level context files (global → project → subdirectory) that [merge automatically based on working directory](/practical-techniques/lesson-6-project-onboarding)—define coding standards at project root, override per-module, and set personal preferences globally
- **Sub-agents via Task(...):** Spawn isolated agent instances for parallel research, code exploration, or specialized tasks without polluting main context
- **Planning mode:** Explicit plan-before-execute workflow for complex changes—align on approach before any files are modified
- **Hooks system:** Deterministic pre/post-execution rules for validation, formatting, or custom workflows triggered at specific points
- **MCP integration:** Extend capabilities through [Model Context Protocol servers](/developer-tools/mcp-servers) for code research, web grounding, and browser automation
- **Slash commands:** Custom shortcuts for frequent operations (`/commit`, `/pr`, `/test`) defined per-repository

**Best suited for:** Engineers building complex multi-agent workflows who need explicit control over agent behavior. Teams requiring reproducible agent configurations across developers via checked-in CLAUDE.md files. Developers working with large codebases (50k+ LOC) where sub-agent context isolation prevents confusion.

**Trade-offs:** Anthropic models only—no support for OpenAI, Google, or local models. Learning curve for advanced features (hooks, MCP, sub-agents).

**Pricing:** Max subscription at $100/month (5x Pro usage) or $200/month (20x Pro usage)—predictable costs without per-token billing. Alternative: usage-based via Anthropic API—Sonnet 4 at $3/$15 per MTok (input/output), Opus 4.5 at $5/$25 per MTok.

**Installation:**

```bash
# npm (recommended)
npm install -g @anthropic-ai/claude-code

# Requires Node.js 18+
# Authenticate via Claude Max subscription or set ANTHROPIC_API_KEY
```

### Status Line Tools

Claude Code's `statusLine` setting enables custom status bar displays via external commands. Community tools provide real-time cost tracking, git integration, and session monitoring.

**[CCometixLine (ccline)](https://github.com/Haleclipse/CCometixLine)** - Rust-based statusline with git integration, model display, usage tracking, and TUI configuration. Includes patches for disabling context warnings and enabling verbose mode. Install: `npm install -g @cometix/ccline`

**[ccusage](https://github.com/ryoppippi/ccusage)** - Token usage and cost monitoring displaying session cost, daily totals, 5-hour block tracking, and real-time burn rate. Install: `npx ccusage@latest statusline`

**Other options:** [claude-statusline](https://github.com/ersinkoc/claude-statusline) (Python, 100+ themes), [CCStatusLine](https://github.com/sirmalloc/ccstatusline) (multi-line token breakdown)

## OpenAI Codex CLI

[**Codex CLI**](https://developers.openai.com/codex/cli/) is OpenAI's official command-line agent, released April 2025. It provides native integration with OpenAI's model ecosystem including the GPT-5-Codex series optimized for agentic coding.

**Key differentiators:**

- **OpenAI ecosystem integration:** Native support for GPT-5-Codex models (default on macOS/Linux) with `/model` command to switch between GPT-5.1, GPT-5-Codex-Max, and reasoning models
- **Sandboxed execution:** Built-in code execution environment for testing generated code before applying changes
- **Multi-file context:** Understands project structure and maintains coherent edits across files
- **Natural language commands:** Convert plain English descriptions directly into shell commands and code changes

**Best suited for:** Teams already invested in OpenAI ecosystem (API keys, billing, familiarity). Developers wanting access to latest OpenAI models as they release. Engineers who prefer official vendor tooling with dedicated support channels.

**Trade-offs:** OpenAI models only—no Anthropic, Google, or local model support. Newer tool with smaller community compared to Aider. Less extensive documentation than more established alternatives. Requires OpenAI API access and associated costs.

**Pricing:** Included with ChatGPT Plus ($20/month), Pro, Team, and Enterprise subscriptions with tiered usage limits. Alternative: usage-based via OpenAI API key at standard rates.

**Installation:**

```bash
# npm
npm install -g @openai/codex

# Requires Node.js 18+
# Set OPENAI_API_KEY environment variable
```

## Gemini CLI

[**Gemini CLI**](https://geminicli.com/) is Google's command-line agent for the Gemini model family, released June 2025. It offers the largest context window (1M tokens) among CLI agents and access to Gemini 3 Pro.

**Key differentiators:**

- **Massive context window:** 1 million token context (2M coming soon)—analyze entire codebases in a single prompt
- **Gemini 3 Pro:** Access to Google's latest reasoning model with strong multimodal capabilities
- **Google Cloud integration:** Native compatibility with Vertex AI, Google Cloud services, and Google Workspace
- **MCP and extensions:** Extend capabilities via Model Context Protocol or bundled extensions; ground prompts with Google Search

**Best suited for:** Teams analyzing large codebases that exceed other agents' context limits. Developers already using Google Cloud infrastructure. Engineers who need multimodal capabilities (image, video, audio analysis alongside code).

**Trade-offs:** Tool calling and instruction-following less refined than Claude Code or Codex—better for analysis than autonomous multi-step coding. Free tier severely restricted (December 2025)—API limits reduced to near-zero for 2.5 Pro. Privacy considerations—Google's terms allow data collection (enterprise tiers offer protection).

**Pricing:** Google AI Pro/Ultra subscriptions for priority rate limits. Usage-based via Vertex AI—Gemini 3 Pro at $2/$12 per MTok (input/output). Free tier limited to light experimentation only.

**Installation:**

```bash
# npm
npm install -g @google/gemini-cli

# Requires Node.js 18+
# Set GOOGLE_API_KEY or configure Google Cloud credentials
```

## GitHub Copilot CLI

[**GitHub Copilot CLI**](https://github.com/features/copilot/cli) is GitHub's terminal-native coding agent, entering public preview September 2025. For teams with existing Copilot Business/Enterprise licenses, it's the lowest-friction entry point to agentic workflows—zero additional procurement, instant access.

**Key differentiators:**

- **Full agentic capabilities:** Read, write, and execute code autonomously—not just command suggestions
- **GitHub integration:** Native access to repositories, issues, and pull requests via natural language queries
- **MCP server support:** Extensible with custom tools and context sources via Model Context Protocol
- **Multi-model backend:** Leverages OpenAI, Anthropic, and Google models through GitHub's infrastructure

**Best suited for:** Corporate teams testing agentic workflows with existing Copilot licenses. Light-to-moderate usage patterns where request-based pricing stays economical. GitHub-centric workflows where native repo/issue/PR integration adds value.

**Trade-offs:** Request-based pricing creates an unusual cost curve—cheap to start ($10/month flat), but expensive at scale. At 300 premium requests/month (Pro tier), moderate daily usage exhausts the allowance quickly; overages at $0.04/request compound fast. Power users naturally migrate to token-based tools like [Claude Code](#claude-code) or [Codex CLI](#openai-codex-cli) where costs scale more linearly. Known terminal interaction bugs—agent can't reliably detect when commands complete, leading to stuck states and wasted requests.

**Pricing:** Request-based, included with Copilot subscriptions.

| Plan       | Cost           | Premium Requests | Overage       |
| ---------- | -------------- | ---------------- | ------------- |
| Pro        | $10/month      | 300/month        | $0.04/request |
| Pro+       | $39/month      | 1,500/month      | $0.04/request |
| Business   | $19/user/month | 300/user/month   | $0.04/request |
| Enterprise | $39/user/month | 1,000/user/month | $0.04/request |

Included models (GPT-5 mini, GPT-4.1, GPT-4o) don't consume premium requests. Advanced models have multipliers—Claude Opus 4.1 costs 10x per interaction.

**Installation:**

```bash
# npm (requires Node.js 18+)
npm install -g @github/copilot

# Requires active GitHub Copilot subscription (Pro/Business/Enterprise)
# For Business/Enterprise: admin must enable preview features
```

## Aider

[**Aider**](https://aider.chat) is an open-source CLI agent focused on git-native workflows and model flexibility. Released May 2023, it has matured into the most widely-used open-source coding agent with 38.9k GitHub stars, 3.9M PyPI downloads, and 15B tokens processed weekly.

**Key differentiators:**

- **Git-native workflow:** Automatic commits after each change with descriptive messages—clean, reviewable history without manual staging
- **Provider agnostic:** Supports OpenAI, Anthropic, Google, DeepSeek, Groq, and local models via Ollama or LiteLLM—balance quality against cost per task
- **Repository mapping:** Tree-sitter builds a dependency graph of symbols (classes, methods, signatures)—graph ranking algorithm selects relevant context without embeddings or semantic search
- **Multiple modes:** Code mode (direct edits), architect mode (planning and design), ask mode (queries without modifications)
- **Multimodal input:** Add images and web pages to chat for visual context, screenshots, or reference documentation
- **Voice-to-code:** `/voice` command for hands-free coding—speak requests for features, tests, or bug fixes
- **Polyglot benchmark:** Maintains [LLM leaderboard](https://aider.chat/docs/leaderboards) testing models on 225 Exercism exercises across C++, Go, Java, JavaScript, Python, and Rust
- **Cost monitoring:** Real-time display of tokens sent/received and message costs—identify cheaper models for your workflow
- **Self-improving:** ~70% of Aider's recent code was written by Aider itself

**Best suited for:** Developers who want model choice flexibility—use Claude for complex refactors, cheaper models for quick fixes, local models for sensitive code. Engineers prioritizing git hygiene with automatic commit discipline. Teams on budget constraints who can mix expensive and cheap models strategically. Enterprise deployments requiring fully self-hosted infrastructure with no vendor lock-in.

**Trade-offs:** Git auto-commits can create noisy history if not configured carefully. No built-in sub-agent architecture—single-threaded execution model. Browser UI is experimental and less polished than CLI. Some users report inconsistent results with local models.

**Pricing:** Free and open source. Pay only for API tokens to your chosen provider—no subscription layer.

**Installation:**

```bash
# pip (recommended)
pip install aider-chat

# Or with pipx for isolation
pipx install aider-chat

# Requires Python 3.9+
# Set API keys for your chosen provider (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
```

## OpenCode

[**OpenCode**](https://opencode.ai) is an open-source CLI agent with a TUI-first design, built in Go by neovim enthusiasts. With 38k+ GitHub stars and 375 contributors, it emphasizes LSP integration and privacy-first architecture for enterprise deployments.

**Key differentiators:**

- **LSP integration:** Auto-starts language servers for your project—AI receives real-time compiler diagnostics and type errors (full LSP capabilities like rename/go-to-definition not yet exposed)
- **Built-in agents:** `build` agent (full access for development), `plan` agent (read-only analysis requiring approval for bash commands), `general` subagent (complex multi-step searches via `@general`)
- **Client/server architecture:** Core agent runs on one machine while controlled remotely—TUI is one client option; enables mobile app control and headless operation
- **MCP support:** Model Context Protocol integration for external tools—connect to Playwright for browser automation, custom servers for specialized workflows
- **75+ providers:** OpenAI, Anthropic, Google, GitHub Copilot, AWS Bedrock, Groq, Azure OpenAI, OpenRouter, and local models via Ollama—or use OpenCode Zen for curated model recommendations
- **Privacy-first:** No code or context storage—suitable for sensitive codebases and enterprise compliance requirements
- **Multi-session:** Run multiple agents in parallel on the same project with session sharing via links
- **Custom commands:** Create reusable prompts using Markdown files with named arguments

**Best suited for:** Privacy-conscious teams requiring on-premise deployments. Neovim users who want TUI excellence. Developers wanting LSP-enhanced AI understanding of their codebase. Enterprise environments needing audit trails and data residency compliance.

**Trade-offs:** Originally archived project, now maintained by SST—verify long-term maintenance commitment. Smaller community than Aider.

**Pricing:** Free and open source. Pay only for LLM API tokens to your chosen provider.

**Installation:**

```bash
# Quick install
curl -fsSL https://opencode.ai/install | bash

# Or via npm
npm i -g opencode-ai@latest

# Or Homebrew (macOS/Linux)
brew install opencode

# Requires provider API keys or OpenCode Zen subscription
```

---

**Related:**

- [Developer Tools: Terminals](/developer-tools/terminals) - Terminal emulators optimized for multi-agent sessions
- [Developer Tools: Modern CLI Tools](/developer-tools/cli-tools) - Shell tools that complement agent workflows
- [Developer Tools: MCP Servers](/developer-tools/mcp-servers) - Extend CLI agents with code research and web grounding
