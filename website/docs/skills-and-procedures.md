---
title: 'Skills and Procedures'
---

import SkillsInvocationDiagram from '@site/src/components/VisualElements/SkillsInvocationDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Skills and Procedures

Skills are the **procedure-side analogue of deferred MCP tools**. The agent sees lightweight discovery metadata first, then loads the full workflow only when the task matches or you invoke it directly.

**Context effect:** the catalog creates a small fixed cost; activation adds the selected procedure near the active turn, where it initially benefits from recency but can drift as work continues. The critical tradeoff is who activates it: auto-discovery is friction-free but probabilistic, while manual invocation is reliable but requires the human to know the skill exists.

### Two Invocation Paths

<DiagramFrame
  kicker="Context management"
  title="Who picks the skill decides what stays in the valley"
  size="wide"
  caption={
    'Both paths pay the same discovery metadata. Manual invocation loads one procedure; a near match loads a second one it never uses — and never removes.'
  }
>
  <SkillsInvocationDiagram />
</DiagramFrame>

Drag the catalog control: it grows the discovery metadata carried by both prefixes, pushing the prompt deeper into the attention valley, while every procedure body stays out of the window until something activates it. The AUTO panel always shows a near match, because that is the only outcome worth drawing — a lucky direct match reproduces the manual trace exactly. The wrong procedure body and the false-start turn it produced load before the correct skill and then sit at the bottom of the valley for the rest of the run. Everything separating the two panels is the price of one bad pick, and manual invocation never pays it.

**Manual invocation**: The user explicitly selects a procedure — a slash command (`/commit`), skill picker, or sub-agent mention. The procedure loads because the human chose it. **Always reliable** — the model cannot misidentify the workflow — but the human must discover the skill and remember its name.

**Model invocation**: The agent sees the procedure catalog in context, matches your intent against the descriptions, and loads the relevant workflow automatically. **Zero friction** — the agent handles discovery — but the model may pick the wrong skill, miss the right one, or waste tokens evaluating irrelevant descriptions.

This tradeoff is configurable per skill, not just per project, so the invocation path can match each workflow's reliability requirement: critical workflows (deploy, commit, review) belong on the manual path, where nothing can mis-select them; exploration workflows (search code, explain errors) work well with auto-discovery, where a wrong guess costs a false start and little else.

:::tip Going full manual
Every major harness lets you take a skill off the matching path. Claude Code and [pi](https://pi.dev/docs/latest/skills) both read `disable-model-invocation: true` from a skill's `SKILL.md` frontmatter; in pi that also drops the skill's metadata from the system prompt, so a manual-only skill costs **zero standing context** and runs only via `/skill:name`. Codex gates the same behavior with `allow_implicit_invocation` in `agents/openai.yaml`.

Full manual removes near-match risk entirely — and, where metadata is dropped with it, the standing cost too. The price is the one this section keeps returning to: a human has to know the skill exists and remember its name.
:::

### Different Harnesses, Same Core Pattern

The format itself is standardized. `SKILL.md` — YAML frontmatter carrying a name and description, a Markdown body, optional bundled files — is defined by the [Agent Skills specification](https://agentskills.io/specification), with an [integration guide](https://agentskills.io/integrate-skills) for harness authors. Every implementation honors the same loading contract: metadata in the system prompt at startup, body only on activation. What differs is the invocation surface — how much window a harness spends advertising the catalog, and how long an activated skill stays resident.

[Claude Code](https://code.claude.com/docs/en/skills) caps the skill listing at 1% of the context window and truncates descriptions, least-used first, once the catalog exceeds it; an activated skill then stays in history until compaction. [Pi](https://pi.dev/docs/latest/skills) injects skill metadata as XML in the system prompt and has the model `read` the body on demand. [Codex](https://learn.chatgpt.com/docs/build-skills) places its catalog immediately after AGENTS.md, capped at roughly 2% of the window or 8,000 characters — skills past the cap are dropped with a warning — and [releases skill context once the task completes](https://openai.com/index/unrolling-the-codex-agent-loop/) instead of carrying it forward. OpenCode leans on reusable agents and `@`-invoked subagents and does not document its loading budget, but it reads the same standard format.

Those caps are the tell: the catalog listing is not free. Procedure metadata consumes context budget before any workflow runs, which is why harnesses bound it at 1–2% of the window. Exceeding the cap does not stop the matching — the model keeps matching against truncated or missing descriptions, which is exactly how the near match in the figure above happens. A broad catalog degrades the descriptions the model needs to pick correctly. This is the procedure-side analogue of MCP schema pressure: different payload, same design problem.

The practical framing: **AGENTS.md** holds what the agent should always know — architecture, conventions, constraints. **Skills** hold what the agent should know how to do — specific workflows loaded on demand, with the invocation path controlling who decides which one runs.

**Next:** [Sub-Agent Delegation](./sub-agent-delegation.md)
