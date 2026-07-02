---
title: Plans & Model Comparison
sidebar_position: 2
---

# Coding Plans & Model Comparison

**The coding agent market in 2026 has four paths to inference: all-in-one subscriptions (Claude Max, ChatGPT Pro, Kimi), open-model gateways (OpenCode Go/Zen, DeepSeek API), enterprise SaaS (GitHub Copilot, Mistral), and local inference (ds4 + DeepSeek V4 Flash on consumer hardware).** Each makes different trade-offs in capability, cost, flexibility, lock-in, and privacy. This page compares the major plans and the latest models optimized for coding.

---

## Subscription Plans

### Consumer Plans (Individual Developers)

| Plan | Monthly Cost | Models Included | Codex / Agent Access | Key Differentiator |
|------|-------------|----------------|---------------------|-------------------|
| **ChatGPT Plus** | $20/mo | GPT-5.5, GPT-5.3-Codex | ✓ Expanded Codex | Best value all-in-one; Codex included |
| **ChatGPT Pro 5x** | $100/mo | GPT-5.5 Pro, GPT-5.3-Codex-Spark | ✓ 5x Plus usage | High-volume coding + GPT-5.5 Pro reasoning |
| **ChatGPT Pro 20x** | $200/mo | GPT-5.5 Pro, all Codex models | ✓ 20x Plus usage | Maximum OpenAI throughput |
| **Claude Pro** | $20/mo | Sonnet 4.6, Haiku 4.5, Opus 4.7 | ✓ Claude Code included | Claude agent ecosystem (hooks, MCP, sub-agents) |
| **Claude Max 5x** | $100/mo | Same + priority access | ✓ Claude Code included | 5x Pro usage for Claude users |
| **Claude Max 20x** | $200/mo | Same + highest priority | ✓ Claude Code included | Maximum Claude throughput |
| **Kimi Moderato** | $15/mo | K2.6, K2.5 | ✓ Kimi Code (basic) | Entry-level open-model subscription |
| **Kimi Allegretto** | $31/mo | K2.6, K2.5 | ✓ Kimi Code (5x credits), Agent Swarm | Mid-tier with multi-agent |
| **Kimi Allegro** | $79/mo | K2.6, K2.5 | ✓ Kimi Code (15x credits), Agent Swarm (120 uses) | Heavy Kimi usage |
| **Kimi Vivace** | $159/mo | K2.6, K2.5 | ✓ Kimi Code (30x credits), Agent Swarm (240 uses) | Maximum Kimi throughput |
| **OpenCode Go** | $10/mo | GLM-5.1, Kimi K2.6, DeepSeek V4 Pro/Flash, MiniMax M2.7, Qwen 3.6 Plus, MiMo, MiniMax M2.5 + free tier models | ✓ Via OpenCode agent | Cheapest access to 12 curated open models |
| **OpenCode Zen** | PAYG (+$20 balance) | 35+ models (OpenAI, Anthropic, Google, open models) | ✓ Via OpenCode agent | Zero monthly fee, per-token pricing, any provider |
| **Mistral Le Chat Pro** | $15/mo | Mistral Medium 3.5, Large 3, Devstral 2, Codestral | ✓ Mistral Vibe | EU-hosted, most open model family |
| **GitHub Copilot Pro** | $10/mo | Multi-model (OpenAI, Anthropic, Google) | ✓ Limited agentic | Lowest-friction if org already uses GitHub |
| **GitHub Copilot Pro+** | $39/mo | Same + higher limits | ✓ Expanded agentic | More usage for Copilot users |

**Sources:** [ChatGPT Pricing](https://chatgpt.com/pricing), [ChatGPT Pro Plans](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-plans), [Codex Pricing](https://developers.openai.com/codex/pricing), [Anthropic Pricing](https://claude.com/pricing), [Anthropic Max Plans](https://claude.com/pricing/max), [OpenCode Go](https://opencode.ai/go), [OpenCode Zen](https://opencode.ai/zen), [Kimi Pricing](https://kimi.com), [Mistral Pricing](https://mistral.ai/pricing), [GitHub Copilot Pricing](https://github.com/features/copilot/plans)

---

### Team & Enterprise Plans

| Plan | Per-Seat Cost | Min Users | Key Features |
|------|--------------|-----------|-------------|
| **ChatGPT Business** | $25-30/user/mo | 2 | SAML SSO, no training on data, Business Codex |
| **ChatGPT Enterprise** | Custom | — | SCIM, EKM, data residency (10 regions), SLAs |
| **Claude Team Standard** | $25/seat/mo | 5 | SSO, Claude Code included |
| **Claude Team Premium** | $125/seat/mo | 5 | 5x usage, priority access |
| **Claude Enterprise** | $20/seat + usage | — | SCIM, audit logs, HIPAA |
| **Kimi (team plans)** | Via platform | — | Team workspaces, usage pooling |
| **Aliyun Token Plan** | ¥198-1,398/seat/mo | — | Access to Qwen 3.6, GLM 5.1, MiniMax, Kimi, DeepSeek |
| **GitHub Copilot Business** | $19/user/mo | — | $30/user pooled AI credits, SAML SSO |
| **GitHub Copilot Enterprise** | $39/user/mo | — | $70/user pooled credits, SCIM, compliance |
| **Mistral Team** | $25/user/mo | — | Domain verification, data export |

**Sources:** [ChatGPT Plans](https://chatgpt.com/pricing), [Anthropic Pricing](https://claude.com/pricing), [Aliyun Model Studio](https://help.aliyun.com/zh/model-studio/token-plan-overview), [Mistral Pricing](https://mistral.ai/pricing)

---

## Model Capabilities for Coding

### Frontier Coding Models (May 2026)

| Model | Developer | Context | Max Output | SWE-Bench Pro | SWE-Bench Verified | Terminal-Bench 2.0 | Open? | Input $/1M tok | Output $/1M tok |
|-------|-----------|---------|------------|:---:|:---:|:---:|:---:|:---:|:---:|
| **GLM 5.1** | Zhipu AI | 200K | 128K | **58.4** | 77.8 (GLM-5) | 56.2 (GLM-5) | GLM-5 open | See pricing | See pricing |
| **Kimi K2.6** | Moonshot AI | 256K | 98K | **58.6** | **80.2** | 66.7 | ✓ Apache 2.0 | ~$0.90 | ~$3.74 |
| **Claude Opus 4.7** | Anthropic | 1M | 128K | ~64%* | ~72% | 69.4 | ✗ | $5.00 | $25.00 |
| **GPT-5.5** | OpenAI | 400K | — | **58.6** | — | **82.7** | ✗ | See ChatGPT plan | See ChatGPT plan |
| **GPT-5.3-Codex** | OpenAI | 400K | — | 56.8 | — | **77.3** | ✗ | See ChatGPT plan | See ChatGPT plan |
| **Gemini 3.1 Pro** | Google | 1M | — | 54.2 | 80.6 | 68.5 | ✗ | See plan | See plan |
| **DeepSeek V4 Pro** | DeepSeek | **1M** | **384K** | TBD (tech report) | TBD | TBD | ✓ MIT | $0.44 | $3.48 (75% off: $0.87) |
| **DeepSeek V4 Flash** | DeepSeek | **1M** | **384K** | TBD | TBD | TBD | ✓ MIT | **$0.14** | **$0.28** |
| **Qwen 3.6 Plus** | Alibaba | **1M** | 64K | — | Strong (unpub) | — | Likely Apache | Token plan or PAYG | Token plan or PAYG |
| **Qwen 3.6 Max** | Alibaba | 256K | 64K | — | Strong (unpub) | — | Likely Apache | Highest tier | Highest tier |
| **MiniMax M2.7** | MiniMax | 192K | — | 56.2 | Strong (M2.5: 80.2) | 57.0 | M2.5 open | $0.30 | $2.40 (100 TPS) |
| **MiniMax M2.5** | MiniMax | 192K | — | — | **80.2** | — | ✓ Open weights | $0.30 | $2.40 (100 TPS) |
| **Mistral Medium 3.5** | Mistral AI | 256K | — | — | — | — | ✓ Modified MIT | $1.50 | $7.50 |
| **Mistral Large 3** | Mistral AI | 256K | — | — | — | — | ✓ Open weights | $0.50 | $1.50 |
| **Devstral 2** | Mistral AI | 256K | — | — | — | — | ✓ Open weights | $0.40 | $2.00 |

\* Anthropic notes [evidence of memorization](https://www.anthropic.com/news/claude-opus-4-7) on SWE-Bench Pro — scores may overstate real capability.

**DeepSeek V4 Flash architectural advantage:** Beyond pricing, Flash's compressed KV cache is a unique architectural feature — it allows entire agent sessions to be serialized to disk and resumed without re-prefixing. This makes it the only frontier-class model practically runnable on consumer hardware (128GB+ Mac) with full session persistence, a capability antirez calls the "KV cache as a first-class disk citizen" ([ds4 README](https://github.com/antirez/ds4)). Combined with proportional thinking (thinking length scales with problem complexity, unlike other models), it's uniquely suited for local agentic coding.

**Sources:** [GLM 5.1 docs](https://docs.bigmodel.cn), [Kimi K2.6 report](https://kimi.com/blog/kimi-k2-6), [Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7), [GPT-5.5](https://openai.com/index/introducing-gpt-5-5/), [GPT-5.3-Codex](https://openai.com/index/introducing-gpt-5-3-codex/), [DeepSeek V4](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro), [Aliyun docs](https://help.aliyun.com/zh/model-studio), [MiniMax M2.7](https://www.minimaxi.com/news/minimax-m27-zh), [Mistral docs](https://docs.mistral.ai/models/), [ds4 by antirez](https://github.com/antirez/ds4)

---

### Open Source License Comparison

| Model | License | Open Weights | Can Fine-Tune | Can Modify | Commercial Use |
|-------|---------|:---:|:---:|:---:|:---:|
| **DeepSeek V4 Pro/Flash** | MIT | ✓ | ✓ | ✓ | ✓ |
| **Kimi K2.6** | Apache 2.0 | ✓ | ✓ | ✓ | ✓ |
| **GLM-5** (base, not 5.1) | Open weights | ✓ | ✓ | ✓ | ✓ (verify terms) |
| **GLM 5.1** | API only | ✗ | ✗ | ✗ | Via API |
| **Qwen 3** series | Apache 2.0 | ✓ | ✓ | ✓ | ✓ |
| **Qwen 3.6** | API (open? TBC) | TBC | TBC | TBC | Via API |
| **MiniMax M2.5** | Open weights | ✓ | ✓ | ✓ | ✓ |
| **MiniMax M2.7** | API only | ✗ | ✗ | ✗ | Via API |
| **Mistral Medium 3.5** | Modified MIT | ✓ | ✓ | ✓ | ✓ |
| **Mistral Large 3** | Open weights | ✓ | ✓ | ✓ | ✓ |
| **Devstral 2** | Open weights | ✓ | ✓ | ✓ | ✓ |
| **Codestral** | Premier (proprietary) | ✗ | ✗ | ✗ | Via API |
| **Claude models** | Proprietary | ✗ | ✗ | ✗ | Via API/subscription |
| **GPT models** | Proprietary | ✗ | ✗ | ✗ | Via API/subscription |

---

## Value Analysis

### Effective Cost per Month (Individual Developer, Moderate Use)

| Plan | Monthly Cost | Frontier Models Available | Effective Value |
|------|:---:|------|:---:|
| **DeepSeek V4 Flash API** (PAYG) | ~$5-15 | DeepSeek V4 Flash | ★★★★★ Best raw cost |
| **OpenCode Go + Flash API** | ~$15-25 | 12 open models + Flash | ★★★★★ Best combo |
| **OpenCode Zen** (PAYG) | ~$10-50 | 35+ models, all providers | ★★★★☆ Most flexible |
| **ChatGPT Plus** | $20 | GPT-5.5, GPT-5.3-Codex | ★★★★☆ Best integrated |
| **Claude Pro** | $20 | Opus 4.7, Sonnet 4.6 | ★★★★☆ Best agent ecosystem |
| **Kimi Moderato** | $15 | K2.6 | ★★★☆☆ |
| **GitHub Copilot Pro** | $10 | Multi-model | ★★★☆☆ Low friction |
| **Mistral Le Chat Pro** | $15 | Medium 3.5, Large 3 | ★★★☆☆ Most open |
| **ChatGPT Pro 5x** | $100 | GPT-5.5 Pro, Codex-Spark | ★★★★☆ Heavy OpenAI |
| **Claude Max 5x** | $100 | Opus 4.7, all models | ★★★★☆ Heavy Claude |
| **Kimi Vivace** | $159 | K2.6, Agent Swarm | ★★★☆☆ |

### Best for Each Use Case

| Use Case | Recommendation | Why |
|----------|---------------|-----|
| **Best overall value** | **OpenCode Go ($10/mo) + DeepSeek V4 Flash** | Access to 12 curated open models + Flash at $0.28/M output — covers 90% of coding tasks at 5% of frontier cost |
| **Maximum capability (complex refactors)** | **Claude Max 5x ($100/mo) or ChatGPT Pro 5x ($100/mo)** | Claude for multi-agent orchestration, GPT for throughput. Paid plans remove usage anxiety on hard problems |
| **Maximum flexibility (no lock-in)** | **OpenCode Zen (PAYG)** | 35+ providers from one gateway — switch models per task, zero monthly fee |
| **Best open models** | **Mistral Medium 3.5 ($1.50/M output)** | Modified MIT license, EU-hosted, 256K context — deploy on your own infra |
| **Best SWE-Bench score** | **GLM 5.1 (via API) or Kimi K2.6** | 58.4% and 58.6% on SWE-Bench Pro respectively — tied for best published scores |
| **Large codebase analysis** | **DeepSeek V4 Pro or Qwen 3.6 Plus** | 1M context windows — analyze entire repositories in a single session |
| **Speed-critical coding** | **MiniMax M2.5 (100 TPS at $2.40/M output)** | 2x typical inference speed — fastest throughput for iterative coding |
| **Enterprise / EU data sovereignty** | **Mistral Le Chat Pro ($15/mo) or Mistral API** | Most open model family, EU-hosted, Modified MIT license |
| **Budget &lt;$20/mo** | **OpenCode Go ($10/mo) + free tier models** | Free tier includes MiniMax M2.5 Free, Big Pickle, Nemotron 3 Super Free — zero-cost entry |
| **Privacy / self-hosting** | **ds4 + DeepSeek V4 Flash on Mac Studio** | Run a quasi-frontier model on your own hardware — zero data leaves your machine, $0 inference cost, 25-37 tok/s on M3 Max/Ultra with 128GB+ RAM |
| **Zero-cost agentic coding** | **ds4 local server + OpenCode** | Full agentic coding with no API bills — ds4 serves OpenAI/Anthropic-compatible endpoints that any agent tool can consume |

---

## Local Inference: The Fourth Path

**DeepSeek V4 Flash has an architectural property no other frontier model shares: its KV cache is compressed aggressively enough to treat disk as a first-class citizen.** This makes local inference viable for agentic coding in a way that was previously impossible. The [ds4 project](https://github.com/antirez/ds4) by Salvatore Sanfilippo (antirez, creator of Redis) is a purpose-built Metal inference engine that exploits this.

### Why DeepSeek V4 Flash Is Different

| Property | DeepSeek V4 Flash | Other Open Models | Why It Matters |
|----------|------------------|-------------------|----------------|
| **Total params** | 284B | 7B-72B typical | Far more knowledge at the edge — feels quasi-frontier |
| **Active params** | 13B | 7B-72B | Fast inference despite large total size |
| **KV cache** | Heavily compressed, disk-friendly | Standard, RAM-only | Sessions persist to SSD — resume later, zero re-prefix |
| **Thinking** | Proportional to complexity | Fixed length, often excessive | Usable with thinking enabled on local hardware |
| **Quantization** | 2-bit viable (asymmetric: IQ2_XXS up/gate, Q2_K down) | Degrades badly below 4-bit | Runs on 128GB Macs at usable speeds |
| **Context window** | 1M tokens | 32K-256K typical | Full codebase analysis on local hardware |

**Source:** [ds4 README](https://github.com/antirez/ds4) — antirez enumerates 8 specific reasons for choosing DeepSeek V4 Flash over other models.

### The ds4 Ecosystem

[ds4](https://github.com/antirez/ds4) is a from-scratch, single-model inference engine for DeepSeek V4 Flash written in C + Metal (MIT license, 5.6K+ GitHub stars). Key design decisions:

- **Not a llama.cpp wrapper** — purpose-built Metal graph executor, designed specifically for this model's architecture
- **Disk KV cache** — sessions checkpointed to SSD at cold start, continuation, eviction, and shutdown. Cache key is SHA1 of exact token IDs. Switch between projects instantly without losing context.
- **DSML tool call replay** — remembers exact sampled DSML blocks by tool ID for exact prefix matching across turns, critical for reliable agent tool use
- **OpenAI + Anthropic compatible server** — serves `/v1/chat/completions` and `/v1/messages` endpoints. Any agent tool (opencode, Pi, Claude Code) can point at `http://localhost:8080` and work without modification.
- **Performance:** M3 Ultra 512GB → ~37 tok/s (q2), ~36 tok/s (q4). M3 Max 128GB → ~27 tok/s (q2). These are usable speeds for interactive agentic coding.

**Agent integrations** (from ds4 README):
- **OpenCode:** Set `OPENCODE_PROVIDER=openai-compatible` and `OPENCODE_BASE_URL=http://localhost:8080/v1`
- **Pi:** Use the `/model` command to switch to the local ds4 endpoint
- **Claude Code:** Set `ANTHROPIC_BASE_URL=http://localhost:8080` — Claude Code runs against local DeepSeek V4 Flash with full tool support

### The Strategic Argument

antirez is pragmatic about local vs. cloud — he uses Gemini 2.5 Pro and Claude Opus 4 for his own coding work ([news/154](https://antirez.com/news/154)). His concern is not that cloud models are bad, but that **centralization of this technology is dangerous**:

> "This technology is far too important to be in the hands of a few companies... the open models, especially the ones produced in China, continue to compete (even if they are behind) with frontier models of closed labs. There is a sufficient democratization of AI, so far, even if imperfect. But: it is absolutely not obvious that it will be like that forever. I'm scared about the centralization." — [antirez, news/158](https://antirez.com/news/158)

ds4 is his answer: **local inference that's credible enough to matter.** Not a replacement for cloud models, but an insurance policy against lock-in, price gouging, and centralized control.

This aligns with the course author's philosophy — the course is intentionally model-agnostic. The four-phase workflow (Grounding → Plan → Execute → Validate) works regardless of inference backend. Local models add a fourth dimension: **zero marginal cost, zero data leakage, zero dependency on a single provider.**

### Practical Considerations

| Factor | Local (ds4 + Flash) | Cloud API (Flash) | Frontier Subscription |
|--------|---------------------|-------------------|----------------------|
| **Cost** | Hardware cost only (Mac Studio ~$3-7K one-time) | ~$5-15/mo usage | $20-200/mo |
| **Speed** | 25-37 tok/s | 100+ tok/s (API) | 100+ tok/s |
| **Privacy** | Complete — zero data leaves machine | Provider sees prompts | Provider sees prompts |
| **Context** | 1M tokens, persisted to disk | 1M tokens, session-only | 200K-1M tokens |
| **Session persistence** | Disk — resume weeks later | None — lost on disconnect | None — lost on disconnect |
| **Model updates** | Manual (download new weights) | Automatic (provider upgrades) | Automatic |
| **Setup complexity** | High (install ds4, quantize, configure) | None (API key only) | None (install CLI, auth) |

The hardware barrier (128GB+ Mac) is real but falling. As Apple Silicon expands and quantization techniques improve, the entry point will drop. For now, local inference is a **pragmatic addition to your toolkit, not a replacement** — use cloud for complex multi-file refactors, use local for routine work, private codebases, and offline scenarios.

**Sources:** [ds4 GitHub](https://github.com/antirez/ds4), [antirez blog](https://antirez.com/news/158), [ds4 HuggingFace GGUF](https://huggingface.co/antirez/deepseek-v4-gguf)

---

## Key Takeaways

1. **The cost gap between open and closed models has widened.** DeepSeek V4 Flash at $0.28/M output is ~90x cheaper than Claude Opus 4.7 at $25/M output. For routine coding tasks, open models now rival frontier quality at a fraction of the cost.

2. **The best plan isn't a single plan.** Heavy users combine a subscription (ChatGPT Plus or Claude Pro for hard problems) with an open-model gateway (OpenCode Go or Zen for routine work). This hybrid approach optimizes for both capability and cost.

3. **Open-weight models are now competitive at the frontier.** GLM 5.1 (58.4% SWE-Pro), Kimi K2.6 (58.6% SWE-Pro, 80.2% SWE-Verified), and MiniMax M2.5 (80.2% SWE-Verified) match or exceed closed-source alternatives on key benchmarks. The distinction between "open" and "frontier" is rapidly disappearing.

4. **Context windows have standardized at 1M tokens** for the latest generation (DeepSeek V4, Qwen 3.6 Plus/Flash, Claude Opus 4.7, Gemini 3.1 Pro). Kimi K2.6's 256K and GLM 5.1's 200K trail on this dimension.

5. **Subscription lock-in still matters for advanced agent features.** Claude Code's hooks, sub-agents, and planning mode aren't available through third-party gateways. If you need these, a Claude subscription is unavoidable regardless of model choice.

6. **Local inference is now a viable fourth path.** DeepSeek V4 Flash's compressed KV cache (exploited by the ds4 project) makes local agentic coding practical on high-end Macs. This is not about replacing cloud models — it's about having a credible alternative for privacy-sensitive work, offline scenarios, and as a hedge against centralization. As antirez puts it: local inference that's "credible on high end personal machines" changes the negotiation. You're no longer captive to API pricing or provider policies.
