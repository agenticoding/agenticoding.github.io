---
title: CLI Coding Agents
sidebar_position: 1
---

# CLI Coding Agents

**CLI coding agents are the orchestration layer for multi-agent development.** While [terminals](/developer-tools/terminals) provide the environment and [CLI tools](/developer-tools/cli-tools) enable efficient operations, coding agents are what actually write, edit, and refactor your code. They combine language model capabilities with file system access, shell execution, and codebase understanding.

This page covers agents that operate primarily from the command line—distinct from IDE-embedded assistants like Cursor or Windsurf. CLI agents offer advantages for senior engineers: scriptability, SSH compatibility, lower resource overhead, and seamless integration with multi-worktree workflows.

The CLI coding agent landscape has matured rapidly. By early 2026, the conversation shifted from "Copilot vs. Cursor" to a diversified ecosystem where each tool makes different trade-offs in autonomy, model flexibility, pricing, and architecture. The tools below are ordered roughly by current market relevance, with Claude Code as the most widely adopted, followed by Codex CLI as the fastest-growing contender, and a strong open-source tier of OpenCode and pi.dev.

## Claude Code

[**Claude Code**](https://claude.com/product/claude-code) is Anthropic's official CLI agent, released February 2025. As of early 2026, it is the **most-used AI coding tool** among developers worldwide, surpassing both GitHub Copilot and Cursor according to the Pragmatic Engineer survey (February 2026). Among small companies (fewer than 100 employees), 75% of developers use it. It powers the workflows throughout this course.

**Key differentiators:**

- **Hierarchical CLAUDE.md:** Multi-level context files (global → project → subdirectory) that [merge automatically based on working directory](/practical-techniques/lesson-6-context-management)—define coding standards at project root, override per-module, and set personal preferences globally
- **Sub-agents via Task(...):** Spawn isolated agent instances for parallel research, code exploration, or specialized tasks without polluting main context
- **Planning mode:** Explicit plan-before-execute workflow for complex changes—align on approach before any files are modified
- **Hooks system:** Deterministic pre/post-execution rules for validation, formatting, or custom workflows triggered at specific points
- **MCP integration:** Extend capabilities through [Model Context Protocol servers](/developer-tools/mcp-servers) for code research, web grounding, and browser automation
- **Agent Teams:** Multi-agent coordination for complex, parallel workflows (shipped 2026)
- **Slash commands:** Custom shortcuts for frequent operations (`/commit`, `/pr`, `/test`) defined per-repository

**Performance:** Opus 4.5 scores 80.9% on SWE-bench Verified. Engineers report shipping code 30% faster on complex, multi-file tasks.

**Adoption:** 18% of developers worldwide use Claude Code at work (January 2026) — a 6x increase from April–June 2025. Director-level and above leadership shows an even higher affinity for Claude Code.

**Best suited for:** Engineers building complex multi-agent workflows who need explicit control over agent behavior. Teams requiring reproducible agent configurations across developers via checked-in CLAUDE.md files. Developers working with large codebases (50k+ LOC) where sub-agent context isolation prevents confusion.

**Trade-offs:** Anthropic models only—no support for OpenAI, Google, or local models. Heavy usage with Opus models can cost $150-200/month for individual developers. Learning curve for advanced features (hooks, MCP, sub-agents).

**Pricing:** Claude Max subscription at $100-200/month, or usage-based via Anthropic API—Sonnet 4 at $3/$15 per MTok (input/output), Opus 4.5 at $5/$25 per MTok.

**Installation:**

```bash
# npm (recommended)
npm install -g @anthropic-ai/claude-code

# Requires Node.js 18+
# Authenticate via Claude Max subscription or set ANTHROPIC_API_KEY
```

### Status Line Tools

Use the built-in `/statusline` command to generate a personalized status bar. Describe what you want in natural language and Claude Code creates the script automatically:

```
/statusline show model name and context percentage with a progress bar
```

The generated script is saved to `~/.claude/` and your settings are updated automatically. This replaces the need for third-party status line tools—describe your ideal display and let Claude Code handle the implementation.

**Examples you can try:**

```
/statusline show current git branch, model name, and token usage
/statusline display session cost and daily totals
/statusline minimal — just model name and context %
```

See the [official documentation](https://code.claude.com/docs/en/statusline) for details.

## OpenAI Codex CLI

[**Codex CLI**](https://developers.openai.com/codex/cli/) is OpenAI's official command-line agent, released April 2025. It has seen explosive growth—despite not existing during the previous Pragmatic Engineer survey, it already achieved 60% of Cursor's usage by February 2026. Its open-source CLI is paired with GPT-5-Codex models optimized for agentic coding.

**Key differentiators:**

- **Terminal-Bench 2.0 leader:** GPT-5.3 Codex scores 77.3% on Terminal-Bench with **240+ tokens/second** throughput—highest combined accuracy and speed among CLI agents
- **ChatGPT Plus inclusion:** CLI access is included with ChatGPT Plus ($20/month), Pro, Team, and Enterprise subscriptions—no separate billing for light users
- **Open-source CLI:** The CLI client itself is open source, with IDE extensions available for VS Code, Cursor, and Windsurf
- **Agents SDK:** Multi-agent orchestration for coordinated task execution across models and tools
- **Sandboxed execution:** Built-in code execution environment for testing generated code before applying changes
- **Model switching:** `/model` command to switch between GPT-5.1, GPT-5-Codex-Max, and reasoning models

**Best suited for:** Developers who value speed and throughput for high-volume work. Teams already in the OpenAI ecosystem (API keys, ChatGPT subscriptions). Engineers who want a lightweight, fast local agent that doesn't require a separate billing relationship.

**Trade-offs:** OpenAI models only—no Anthropic, Google, or local model support. Can struggle with subtle bugs or complex architectural decisions that require deeper reasoning. Less mature community and documentation than Claude Code.

**Pricing:** Included with ChatGPT Plus ($20/month), Pro ($200/month), Team, and Enterprise subscriptions with tiered usage limits. Alternative: usage-based via OpenAI API key at standard rates.

**Installation:**

```bash
# npm
npm install -g @openai/codex

# Requires Node.js 18+
# Set OPENAI_API_KEY environment variable
```

## OpenCode

[**OpenCode**](https://opencode.ai) is an open-source CLI agent with a TUI-first design, built in Go. With 95K+ GitHub stars, 2.5 million monthly active developers, and 375+ contributors, it's one of the fastest-growing open-source coding agents. It emphasizes provider flexibility, LSP integration, and privacy-first architecture for enterprise deployments.

**Key differentiators:**

- **75+ LLM providers:** OpenAI, Anthropic, Google, GitHub Copilot, AWS Bedrock, Groq, Azure OpenAI, OpenRouter, local models via Ollama—or use OpenCode Zen for curated model recommendations. Can reuse existing GitHub Copilot or ChatGPT Plus subscriptions.
- **LSP integration:** Auto-starts language servers for your project—AI receives real-time compiler diagnostics and type errors
- **Multi-session:** Run multiple agents in parallel on the same project with session sharing via links
- **Client/server architecture:** Core agent runs on one machine while controlled remotely—TUI is one client option; enables mobile app control and headless operation
- **Built-in agents:** `build` agent (full access for development), `plan` agent (read-only analysis requiring approval), `general` subagent (complex multi-step searches via `@general`)
- **MCP support:** Model Context Protocol integration for external tools—connect to Playwright for browser automation, custom servers for specialized workflows
- **Privacy-first:** No code or context storage—suitable for sensitive codebases and enterprise compliance requirements
- **Custom commands:** Create reusable prompts using Markdown files with named arguments

**Best suited for:** Privacy-conscious teams requiring on-premise deployments. Developers who want maximum provider flexibility—use one model for complex refactors and cheaper models for quick fixes. Teams needing parallel agent sessions on the same project.

**Trade-offs:** Originally archived project, now maintained by SST—verify long-term maintenance commitment. Some users report random bugs with session state and agents getting stuck. Smaller community than Aider.

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

## pi

[**pi**](https://pi.dev) is a minimal terminal coding harness that orchestrates models rather than running them directly. With 47.5K GitHub stars and active development (latest release v0.74.0, May 2026), it takes a "raw primitives" approach—adapt pi to your workflows rather than adapting to its conventions.

**Key differentiators:**

- **Model-agnostic harness:** Supports 15+ providers (Claude, GPT, Gemini, Groq, Ollama, and more). Switch models mid-session with `Ctrl+L`—use Sonnet for reasoning, GPT for speed, or any Ollama model for offline work.
- **TypeScript extensions:** Extend pi with TypeScript rather than forking internals. 50+ extension examples covering permission gates, SSH execution, sandboxing, and custom UI.
- **Skills system:** Load tools on-demand to maintain a lean context window—only add capabilities when the task requires them.
- **Tree-structured sessions:** Branch your work history similar to git—experiment in branches, merge or discard.
- **Four runtime modes:** Interactive (TUI), print/JSON (non-interactive), RPC (process integration), and SDK (embedding in your own apps).
- **Pi Packages:** Share extensions, skills, prompt templates, and themes via npm or git.
- **Prompt templates and themes:** Fully customizable prompts and terminal UI themes.

**Best suited for:** Engineers who want extensibility and control over their coding agent. Developers comfortable with TypeScript who want to build custom tooling on top of an agent harness. Teams that need a model-agnostic solution without vendor lock-in. Privacy-conscious users who want to run local models.

**Trade-offs:** Smaller community than OpenCode or Aider. Steeper learning curve for customization (extensions, skills). No built-in sub-agent architecture—built via extensions instead. Less polished out-of-box experience than Claude Code or Codex.

**Pricing:** Free and open source. Pay only for LLM API tokens to your chosen provider.

**Installation:**

```bash
# npm (recommended)
npm install -g @earendil-works/pi-coding-agent

# Requires Node.js 18+
# Set API key for your chosen provider (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
# Or use the /login command for OAuth-based providers
```

## Gemini CLI

[**Gemini CLI**](https://geminicli.com/) is Google's command-line agent for the Gemini model family, offering the largest context window (1M tokens) among CLI agents and access to Gemini models.

**Key differentiators:**

- **Massive context window:** 1 million token context—analyze entire codebases in a single prompt
- **Generous free tier:** 60 requests/minute, 1,000 requests/day—best free tier among major CLI agents for experimentation
- **Google Search grounding:** Built-in web grounding for prompts, keeping answers current without external MCP servers
- **Google Cloud integration:** Native compatibility with Vertex AI, Google Cloud services, and Google Workspace
- **MCP support:** Extend capabilities via Model Context Protocol or bundled extensions

**Best suited for:** Teams analyzing large codebases that exceed other agents' context limits. Developers already using Google Cloud infrastructure. Engineers who want the most generous free tier for experimentation.

**Trade-offs:** Tool calling and instruction-following less refined than Claude Code or Codex—better for analysis than autonomous multi-step coding. Privacy considerations—Google's terms allow data collection (enterprise tiers offer protection).

**Pricing:** Google AI Pro/Ultra subscriptions for priority rate limits. Usage-based via Vertex AI—Gemini models at competitive per-token rates. Free tier with 1,000 requests/day for light experimentation.

**Installation:**

```bash
# npm
npm install -g @google/gemini-cli

# Requires Node.js 18+
# Set GOOGLE_API_KEY or configure Google Cloud credentials
```

## GitHub Copilot CLI

[**GitHub Copilot CLI**](https://github.com/features/copilot/cli) is GitHub's terminal-native coding agent. For teams with existing Copilot Business/Enterprise licenses, it's the lowest-friction entry point to agentic workflows—zero additional procurement, instant access.

**Note:** Starting June 1, 2026, Copilot transitions from request-based to token-based billing, aligning with the rest of the industry. This section reflects the new model.

**Key differentiators:**

- **Full agentic capabilities:** Read, write, and execute code autonomously—not just command suggestions
- **GitHub integration:** Native access to repositories, issues, and pull requests via natural language queries
- **MCP server support:** Extensible with custom tools and context sources via Model Context Protocol
- **Multi-model backend:** Leverages OpenAI, Anthropic, and Google models through GitHub's infrastructure

**Best suited for:** Corporate teams testing agentic workflows with existing Copilot licenses. GitHub-centric workflows where native repo/issue/PR integration adds value. Large enterprises (10,000+ employees) where Copilot's bundling and enterprise sales make it the default choice.

**Trade-offs:** Token-based pricing means costs scale with usage intensity, just like other agents. Known terminal interaction bugs—agent can't reliably detect when commands complete, leading to stuck states and wasted tokens. Copilot's growth has stagnated (flat since 2025) while Claude Code and Codex have surged.

**Pricing (token-based, effective June 2026):**

| Plan               | Cost           | AI Credits (monthly) | Post-Promotion  |
| ------------------ | -------------- | -------------------- | --------------- |
| Pro                | $10/month      | TBD                  | TBD             |
| Pro+               | $39/month      | TBD                  | TBD             |
| Business           | $19/user/month | $30/user (pooled)    | $19/user        |
| Enterprise         | $39/user/month | $70/user (pooled)    | $39/user        |

During a promotional period (June–August 2026), Business customers receive $30 of pooled AI credits per user, Enterprise customers receive $70. After the promotion, credits match the subscription price ($19 and $39 respectively). Individual plan pricing details were not finalized at time of writing. Model-specific token rates apply based on the backend model used.

**Installation:**

```bash
# npm (requires Node.js 18+)
npm install -g @github/copilot

# Requires active GitHub Copilot subscription (Pro/Business/Enterprise)
# For Business/Enterprise: admin must enable preview features
```

## Aider

[**Aider**](https://aider.chat) is an open-source CLI agent focused on git-native workflows and model flexibility. Released May 2023, it has matured into a battle-tested tool with 38.9k GitHub stars, 4.1M+ installations, and 15B tokens processed weekly—the largest deployed user base of any open-source coding CLI.

**Key differentiators:**

- **Git-native workflow:** Automatic commits after each change with descriptive messages—clean, reviewable history without manual staging
- **Provider agnostic:** Supports OpenAI, Anthropic, Google, DeepSeek, Groq, and local models via Ollama or LiteLLM
- **Repository mapping:** Tree-sitter builds a dependency graph of symbols—graph ranking algorithm selects relevant context without embeddings
- **Multiple modes:** Code mode (direct edits), architect mode (planning and design), ask mode (queries without modifications)
- **Polyglot benchmark:** Maintains [LLM leaderboard](https://aider.chat/docs/leaderboards) testing models on 225 Exercism exercises across six languages
- **Cost monitoring:** Real-time display of tokens sent/received and message costs

**Architectural limitations:** Aider uses a chat-lock architecture—single-threaded execution with no built-in sub-agent support. Unlike Claude Code (Task(...)), Codex CLI (Agents SDK), or OpenCode (multi-session), Aider processes one request at a time without parallel or hierarchical agent orchestration. This makes it less suited for complex multi-file refactors that benefit from parallel exploration and specialized sub-agents. The git auto-commit pattern can also create noisy history if not configured carefully.

**Best suited for:** Developers who want maximum model choice flexibility with a proven, reliable tool. Engineers who prefer git-native workflows with automatic commit discipline. Budget-conscious teams who can mix expensive and cheap models strategically. This is a solid legacy option for structured refactors and pair programming in the terminal.

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

---

**Related:**

- [Developer Tools: Terminals](/developer-tools/terminals) - Terminal emulators optimized for multi-agent sessions
- [Developer Tools: Modern CLI Tools](/developer-tools/cli-tools) - Shell tools that complement agent workflows
- [Developer Tools: MCP Servers](/developer-tools/mcp-servers) - Extend CLI agents with code research and web grounding
