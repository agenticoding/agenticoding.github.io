---
title: CLI Coding Agents
sidebar_position: 1
---

import ToolMark from '@site/src/components/VisualElements/ToolMark';

# CLI Coding Agents

**CLI coding agents are the orchestration layer for agentic development.** [How agents work](/how-agents-work) explains the harness loop behind that orchestration. CLI agents read and change files, run commands, and work naturally with terminals, SSH, worktrees, and scripts. They are distinct from IDE-bound assistants — today led by GitHub Copilot's agent mode in VS Code and Zed's agent panel, alongside Cursor and Windsurf — though the boundary keeps blurring: Copilot and Cursor ship their own CLIs, and Zed hosts CLI agents like Claude Code via ACP and terminal threads.

This is an opinionated shortlist for serious engineering work, ordered by recommendation. The practical differences are model choice, subscription economics, and how much of the workflow the tool imposes on you.

## The harness vs. the task

Every harness spends a finite budget — tokens, context, attention — on operating itself: system prompts, tool definitions, MCP servers, permission flows, and feature surface. **The more a harness invests in polish, features, and DX, the less of that budget is left for the work itself.** The leaner the harness, the more of the model's capacity goes to your task — but the less it steers the model.

That steering is the other side of the axis. A harness that controls the model heavily shields you from its raw behavior; a lean one exposes it. That is not a defect: LLMs do not reason linearly, and a model can appear to "think wrong" — wander, hedge, revisit — while still converging on the right solution, because its reasoning is probability imitating logic rather than logic itself ([how LLMs work](/how-llms-work#probability-is-not-logic)). The more you let the harness go, the more of that behavior you see.

## <span className="rank-numeral">01</span> <ToolMark src="/img/cli-agent-logos/pi.svg" /> pi {#pi}

<p className="tool-verdict">The naked foundation you build on — vendor-independent, extension-first.</p>

[**pi**](https://pi.dev) is the best choice for serious engineering work and vendor independence. It is the CLI-agent equivalent of the original VS Code or Atom: a deliberately naked foundation that you customize for the task instead of a sealed product that dictates the workflow.

**On the axis:** the efficiency extreme — the least steering, so you see the model's raw behavior: it can appear to "think wrong" while still landing on the right answer. Nearly the whole budget goes to the task.

**Why:**

- **Start with primitives:** pi deliberately ships without built-in MCP, subagents, planning, or permission workflows. Build only the capabilities your task needs instead of carrying someone else's product decisions.
- **Token-efficient:** A ~1k-token core — system prompt plus four tools, loaded on demand — spends almost nothing on the harness, so per-turn cost sits far below the sealed harnesses and nearly the whole attention budget goes to the task.
- **Extension-first architecture:** TypeScript extensions, skills, prompt templates, themes, and packages let you compose a task-specific agent without forking its core.
- **Provider independence:** Use frontier, gateway, subscription-backed, or local models without rebuilding your workflow around one vendor. `/login` offers built-in OAuth for ChatGPT Plus/Pro (Codex), Claude Pro/Max, and GitHub Copilot subscriptions.
- **Agent foundation:** Its SDK, JSON, and RPC modes make pi a base for other agents as well as a terminal tool. [OpenClaw](https://open-claw.bot/docs/platforms/pi/) is a high-profile example that embeds pi's SDK directly.

**Best suited for:** Engineers and teams who want their agent architecture to outlive any model vendor or subscription. Expect to design and assemble the workflow you need rather than accept a product's fixed conventions.

**Pricing:** Free and open source. Pay for the model provider, subscription, or local inference you choose.

**Installation:**

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

## <span className="rank-numeral">02</span> <ToolMark src="/img/cli-agent-logos/opencode.svg" darkSrc="/img/cli-agent-logos/opencode-dark.svg" mode="image" /> OpenCode {#opencode}

<p className="tool-verdict">The best batteries-included agent — a sealed product with fixed conventions.</p>

[**OpenCode**](https://opencode.ai) is the most polished, best-integrated coding agent on the market — and it is not a service: an open-source, local-first CLI with token-aware design. Out of the box it works better in practice than Claude Code or Codex, even on the same GPT or Claude models, because the harness, not the model, carries the work. You will not reach this DX level by assembling pi; the trade-off is that OpenCode is a sealed product.

**On the axis:** the polished extreme among local harnesses — token-aware design with a rich feature set; features are easy to use, but each still costs.

**Why:**

- **Batteries included:** LSP diagnostics, subagents, planning, MCP, session sharing, and the most polished terminal interface in the category all work immediately, configured by default.
- **Token-aware:** On the same GPT or Claude models it spends fewer tokens per task than Codex or Claude Code, though nowhere near pi's efficiency. Its high-level features are easy to take advantage of, but each one still costs context.
- **No assembly required:** You get a capable default workflow without carrying early architecture decisions.
- **Provider support:** Connect your own providers or local models, including OpenCode Go for low-cost access to a curated open-model lineup.
- **Sealed by design:** Plugins and config reach the same customization level as Codex's or Claude Code's — genuine extension, but nothing exposes internals the way pi does. The workflow is fixed; you cannot reshape it for your domain.

**Best suited for:** Developers who want the best working agent out of the box and are content with its fixed conventions. If you want to grow with your agent and optimize it for your domain, prefer pi — though pi cannot be assembled to this level of polish.

**Pricing:** OpenCode is free and open source. OpenCode Go is $5 for the first month, then $10/month, with usage limits and optional top-ups. OpenCode Zen sells model access at cost — credit card fees are passed along at 4.4% + $0.30 per transaction, and nothing is charged beyond that.

**Installation:**

```bash
curl -fsSL https://opencode.ai/install | bash
```

## <span className="rank-numeral">03</span> <ToolMark src="/img/cli-agent-logos/codex.svg" /> Codex {#codex}

<p className="tool-verdict">The integrated OpenAI experience — and the ChatGPT subscription travels to other harnesses.</p>

[**Codex**](https://developers.openai.com/codex/cli/) is OpenAI's own CLI for its coding models — the right choice when you want the integrated OpenAI experience. It is not the only way to spend a ChatGPT subscription: unlike Claude subscriptions, the ChatGPT login that powers Codex is portable to other harnesses.

**On the axis:** mid-weight — a lean local harness carrying service-side weight; the unused service tools still tax attention.

**Why:**

- **Portable subscription:** The same ChatGPT OAuth login works in pi (`/login` → ChatGPT Plus/Pro (Codex)) and opencode (`/connect` → OpenAI → ChatGPT Plus/Pro) with zero setup, so a ChatGPT plan buys agent capacity in any of these harnesses — not just OpenAI's own client. opencode's docs highlight the contrast: ChatGPT Plus works "with zero setup" while Claude Pro/Max usage is "explicitly prohibited."
- **Mid-weight, with service-side bloat:** The CLI harness is lean — sandboxing, permissions, MCP, and scripted workflows through `codex exec`. The weight sits in the service package around it: cloud tasks, IDE extension, desktop app. Most engineers use only the CLI, yet you pay for the full package — and the service surface you don't use still carries an attention tax.
- **Open-source client:** Inspect and extend the CLI while using OpenAI's coding models.
- **API escape hatch:** Use an API key for automation or usage patterns that do not fit subscription limits.

**Best suited for:** Developers who want the strongest value from a ChatGPT subscription and prefer OpenAI's models — in the Codex CLI or in another harness. Choose the CLI itself when you want the full OpenAI experience: cloud tasks, first-party updates, and ChatGPT-app parity. Do not choose it for multi-provider independence.

**Pricing:** Included with eligible ChatGPT plans, or billed through the OpenAI API when using an API key. Check the [official pricing page](https://developers.openai.com/codex/pricing) for current plan limits.

**Installation:**

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

## <span className="rank-numeral">04</span> <ToolMark src="/img/cli-agent-logos/claude-code.svg" /> Claude Code {#claude-code}

<p className="tool-verdict">The mindshare leader — the strongest models and richest surface, now carrying real costs.</p>

[**Claude Code**](https://claude.com/product/claude-code) made agentic coding mainstream — "ask Claude to do it" is still the industry's phrase for it, roughly 4% of GitHub commits carry its attribution, and enterprises procure it by name. It has genuine strengths: the strongest coding models in the business and the most feature-complete surface of any CLI agent. By mid-2026 those strengths carried real costs — feature bloat, rationed subscriptions, and a trust record serious engineers weigh — which is why it now sits fourth.

**Why:**

- **The models are the real strength:** Opus-class models genuinely lead the coding benchmarks, and they are why Claude Code's headline results are strong. The lead belongs to the model, not the harness — the same models run in pi, OpenCode, or the raw API, and the benchmark itself is soft: SWE-bench is contaminated, and minimal agents score close to full harnesses on it.
- **The most feature-rich surface of any CLI agent:** planning, subagents, hooks, slash commands, permissions, MCP, agent teams, editor and cloud integrations — nothing else ships this much. The richness has a cost, because attention and context are finite engineering resources: every tool definition, MCP server, and system-prompt rule spends them on operating the harness instead of the task, and the more the model spends running the tool, the less is left for the work. Sessions carry a large fixed overhead from the start and degrade as the window fills — [the context pressure problem](/context-engineering#the-context-pressure-problem). Databricks' harness benchmark found a minimal agent (pi) achieved the highest pass rate at the lowest cost — by sending far less context per turn.
- **The subscription that made it a workhorse is now rationed:** the flat-rate plan that defined its value proposition now enforces tight usage limits, and daily serious use sits in the top-tier Max plans. Anthropic-only models mean no BYOK and no provider escape hatch.
- **A lock-in and trust record worth weighing:** In January 2026 Anthropic restricted Max subscriptions from third-party and open-source agents (OpenCode was the public flashpoint). In spring 2026 three compounding changes degraded coding quality for a month, and the initial response read as dismissive; the postmortem fixed the code, but the community's deeper complaints — sycophancy, spec non-adherence, false completion claims — cannot be fixed by configuration.
- **The source leak exposed the engineering cost:** in March 2026 an accidental npm packaging error (a source map shipped in v2.1.88) published the full ~512K-line TypeScript codebase — 44 hidden feature flags, 20+ fully built but unshipped features, an unreleased background agent, and internal notes showing its next model's false-claim rate had nearly doubled. It was the second time the same packaging bug leaked source, and it contrasts with Codex, whose client is open source and publicly reviewable: Claude Code's engineering stays closed until it leaks.

**Best suited for:** Teams already standardized on Anthropic subscriptions and `CLAUDE.md` conventions who accept Max-tier economics. If you want Opus-class output, the same models run with lower overhead in pi, OpenCode, or the raw API. For serious engineering work, prefer [pi](#pi), [OpenCode](#opencode), or [Codex](#codex) first.

**Pricing:** Bundled with Claude plans — Pro at $20/month (too rate-limited for primary-agent use), Max at $100–200/month (the realistic floor for daily serious use) — or metered through the Anthropic API. Check [Claude Code plans](https://claude.com/product/claude-code) for current usage limits and pricing.

**Installation:**

```bash
npm install -g @anthropic-ai/claude-code
```

## <span className="rank-numeral">05</span> <ToolMark src="/img/cli-agent-logos/antigravity.svg" /> Antigravity CLI {#antigravity-cli}

<p className="tool-verdict">The only genuinely free option — trails the field on agentic coding.</p>

[**Antigravity CLI**](https://antigravity.google/product/antigravity-cli) is Google's terminal agent and the successor to Gemini CLI, which stopped serving unpaid users in June 2026. It is free for everyone — no subscription, no API bill — which is its one real advantage. Do not choose it over the tools above: its agent experience trails the field, and the Gemini model family underperforms on agentic coding workloads.

**On the axis:** off-axis — ranked on free access and model family, not harness design.

**Why:**

- **Free for everyone:** The only genuinely no-cost option in this list — sign in with a Google account, no subscription or API bill. Fine for occasional or budget-constrained work; not the tool to reach for when the result matters.
- **Google-native access:** It is an easy fit only when your work already depends on Gemini, Google Cloud, or Google Workspace.
- **Large-context analysis:** Gemini's model family can be useful for broad repository or document analysis.

**Trade-offs:** Its agent experience trails pi, OpenCode, Codex, and Claude Code, and the same holds for the underlying models: on SWE-bench Verified, Gemini 3.1 Pro sits at ~81% against Claude Opus's ~96%, and it trails on Terminal-Bench, the benchmark closest to this workload. Gemini models win on cost per token and long context, but not on autonomous coding. The free allowance is also small — roughly 20 agent requests/day (community-measured; Google publishes no exact figure) — with a weekly ceiling and no overflow: exhaustion means waiting, and the limits have been tightened repeatedly. For paid, autonomous coding work, prefer pi, OpenCode, or Codex.

**Pricing:** Free for everyone with a Google account; paid Google AI plans raise limits. Quotas change frequently and are not officially published — check current limits before planning a workflow around it.

**Coming from Gemini CLI?** `agy plugin import gemini` converts extensions to plugins; `GEMINI.md`/`AGENTS.md` rules carry over unchanged, and workspace skills move to `.agents/skills/`. See the [migration guide](https://antigravity.google/docs/cli/gcli-migration).

**Installation:**

```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash
```

## <span className="rank-numeral">06</span> <ToolMark src="/img/cli-agent-logos/github-copilot-cli.svg" /> GitHub Copilot CLI {#github-copilot-cli}

<p className="tool-verdict">Worth using only when your employer already pays for Copilot.</p>

[**GitHub Copilot CLI**](https://github.com/features/copilot/cli) is only worth using when your employer already pays for Copilot. There is no other compelling reason to choose it over the tools above.

**On the axis:** off-axis — ranked on procurement and policy, not harness design.

**Why:**

- **Existing procurement:** It may require no new vendor review, budget, or account when your organization has enabled Copilot CLI.
- **GitHub-centric access:** It fits teams already standardized on GitHub repositories, issues, pull requests, and Copilot administration.
- **Policy control:** Organizations can explicitly enable or disable CLI access for managed Copilot seats.

**Trade-offs:** Its agent experience and economics are tied to the broader Copilot plan and GitHub AI credits. If you are paying personally, use the money on pi, OpenCode Go, or Codex instead.

**Installation:**

```bash
npm install -g @github/copilot
```
