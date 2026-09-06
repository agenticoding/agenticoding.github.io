---
title: 'Grounding'
---

import GroundingDistillationDiagram from '@site/src/components/VisualElements/GroundingDistillationDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Phase 1: Grounding {#phase-1-grounding}

The main agent — the orchestrator — has a limited context window. Every token of raw source material — a codebase grep, a web search result, a git log — competes for space with the planning, execution, and verification work it still needs to do. The more raw research you dump in, the less room it has to operate effectively.

The solution is not to make the orchestrator do its own research. It is to delegate research to a dedicated sub-agent: a grounding agent that searches the raw sources, filters what matters, and returns only a compact distilled answer. The grounding agent explores broadly in its own context. The orchestrator gets the relevant facts, not the noise.

<DiagramFrame kicker="Methodology" title="Grounding distills research into usable context" size="wide" caption="The grounding agent absorbs noisy sources, distills usable working context, and leaves the root orchestrator to ask targeted follow-ups only when pieces are missing.">

  <GroundingDistillationDiagram />

</DiagramFrame>

The grounding agent searches whatever sources encode relevant knowledge for the task. Two cover most needs:

- **Code grounding** — how your system works: module responsibilities, integration points, naming conventions, error handling patterns, test contracts, and established invariants.
- **Web grounding** — how the external world works: current framework docs, API references, migration guides, security advisories, and production patterns. The model's training data is stale for fast-moving ecosystems.

A third source, **git history**, comes up in specific tasks — prior migrations, reverted approaches, bug fixes that encode hidden constraints, and architectural decisions captured in commits. Beyond these, any artifact qualifies: specs, Jira tickets, emails, presentations, Slack threads, transcripts, design docs.

Not every harness has built-in sub-agent support. Claude Code spawns Explore sub-agents for this. [ChunkHound](https://chunkhound.github.io/) [disclosure] is built for this pattern. When your setup doesn't support sub-agents, the same pattern works across context boundaries: run grounding in one session, save a research artifact — a markdown file with the distilled findings — then load it into a fresh session and continue to planning. The mechanism changes — sub-agent vs. artifact handoff — but the principle is identical: the orchestrator receives compact context, not raw exploration.

:::tip
[ChunkHound](https://chunkhound.github.io/) [disclosure] implements the grounding agent pattern — it researches code, web, and git history, then returns synthesized findings to the orchestrator. Other tools follow the same general architecture.
:::

The operator's job during grounding is to choose which sources the grounding agent should search, review the distilled output for completeness, send targeted follow-ups when facts are missing, and decide when grounding is sufficient to proceed to planning. A grounding session is complete when the compact context that reaches the orchestrator covers the architecture, conventions, constraints, and evidence the task needs — and you know which gaps remain.

If you don't provide context explicitly, the agent will gather it on its own — a capability called agentic search. Models are benchmarked on this ability; [SWE-bench](https://www.swebench.com), the standard benchmark for coding agents, measures how well agents navigate unfamiliar codebases autonomously. But agentic search happens inside the orchestrator's context. Every line of grepped output, every fetched page, every failed hypothesis competes for the same limited space the agent needs for planning and execution. Explicit grounding with a dedicated sub-agent avoids this cost by isolating the exploration in its own context and returning only the answer.

There is a deeper reason to ground explicitly. The agent doesn't know what it doesn't know. It will assume it has everything at hand while missing critical knowledge — the naming convention that isn't documented, the constraint from a reverted PR, the integration point in a different service. Worse, the big picture often isn't fully encoded anywhere: why this product choice was made, what alternatives were considered and ruled out, which business constraints shape the solution space, what the team already tried and abandoned. When you ground explicitly, you're filling both kinds of gaps — the ones scattered across the codebase and the ones buried in Slack threads, emails, presentations, and support tickets.

---

**Next:** [Planning](./workflow-planning.md)
