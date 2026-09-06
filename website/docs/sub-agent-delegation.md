---
title: 'Sub-Agent Delegation'
---

import SubAgentFanoutDiagram from '@site/src/components/VisualElements/SubAgentFanoutDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Sub-Agents

Sub-agents are **delegated agents** — independent instances that run in separate context windows under the direction of an orchestrator. Each sub-agent operates on its own task slice, and the orchestrator consumes only the returned synthesis rather than inheriting the full working trace.

**Context effect:** the prompt forks work into separate windows; each sub-agent carries its own context lifecycle, and only its synthesis returns to the orchestrator. The parent pays for that synthesis, not the raw search trail, file reads, and partial interpretations. This isolation keeps the orchestrator clean while making the return boundary intentionally lossy.

Sub-agents are the agentic analogue of a function call: the dispatch prompt is the parameter ("Find all JWT authentication code and explain the current implementation") and the synthesis is the return value ("JWT implementation found at src/auth/jwt.ts using Passport.js..."). You pay to process tokens in all participating contexts, but the orchestrator receives compact results instead of inheriting every delegate's full journey.

What makes sub-agents a first-class orchestration primitive — beyond context isolation — is **per-agent optimization**. With the right harness, each delegate can run on the LLM best suited to its sub-task: [pi](https://pi.dev) + [pi-agenticoding](https://github.com/agenticoding/pi-agenticoding) lets you route each sub-agent to the model that matches its cost-accuracy profile. Similarly, Claude Code, Codex, and OpenCode let you customize the system prompt per sub-agent, so each delegate carries only the instructions it needs for its slice of work. Regardless of the mechanism, the payoff is the same: **orchestrating a single task via multiple specialized agents** instead of overloading one context.

<DiagramFrame
  kicker="Context management"
  title="Only the root orchestrates; syntheses cross back"
  size="wide"
  caption={
    'The root calls agent 1, then 2, then agents 3 and 4 concurrently. Every sub-agent is one level deep: its compact dispatch and synthesis are the only two parent-window landings.'
  }
>
  <SubAgentFanoutDiagram />
</DiagramFrame>

### Benefits and Costs

**Benefits:**
- **Proper delegation** — the orchestrator assigns each sub-task to an independent agent rather than doing all work in one overloaded context
- **LLM optimization per task** — pi + pi-agenticoding routes each delegate to the model best suited to its slice (e.g. high-throughput for research, precision-tuned for review)
- **System prompt customization per agent** — Claude Code, Codex, and OpenCode let you tailor the system prompt to each delegate's role
- **Parallel execution** — independent sub-tasks run concurrently instead of serially
- **Cleaner orchestrator** — only syntheses cross back, keeping the parent window focused on coordination

**Costs:**
- **No shared state** — each sub-agent starts fresh, so context-file loading cost is paid again per delegate
- **Synthesis can lose nuance** — the compact return omits details the orchestrator might have needed
- **Token cost multiplied** — every sub-agent is a separate API call with its own consumption
- **No nesting** — sub-agents cannot spawn sub-agents; the orchestrator is always the root
- **Concurrency cap** — Claude Code limits concurrent sub-agents to 10

These are token-cost tradeoffs in exchange for delegation and specialization — the right tradeoff when per-agent optimization improves outcome quality faster than the added token spend costs.

Sub-agents are ideal for delegating independent research, multi-file analysis, and exploratory tasks to the agent best suited for each slice, and for generating independent plans or implementations across specialized models when you want to compare options before applying one result.

**Next:** [Context Compaction](./context-compaction.md)
