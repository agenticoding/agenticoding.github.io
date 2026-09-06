---
title: 'Context Files'
---

import ContextSqueezeDiagram from '@site/src/components/VisualElements/ContextSqueezeDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Context Files

Context files are markdown documents injected between the system prompt and your input. They give agents project memory without repeated explanations: architecture, conventions, build commands, constraints.

**Context effect:** they load on every call into the fixed prefix. The tradeoff is **guaranteed delivery vs. pushing your task toward the valley**: every token inflates the prefix your task travels behind. Once the conversation starts building after your prompt, that prefix helps decide where the prompt ends up.

<DiagramFrame
  kicker="Context management"
  title="File size decides where your prompt lands"
  size="standard"
  caption={
    'Same conversation, two file sizes. As turns append after the prompt, the prompt drifts from the recency edge: a small file lets it settle near the primacy edge — still strong attention; a big file lands it in the dead middle, where attention collapses.'
  }
>
  <ContextSqueezeDiagram />
</DiagramFrame>

`AGENTS.md` is the vendor-neutral standard adopted by 60,000+ open-source projects (now governed by the Linux Foundation's Agentic AI Foundation), working across GitHub Copilot, Cursor, Zed, Windsurf, and most other AI coding tools (note: Claude Code does not support AGENTS.md — see tip below). Keep it minimal — your README should contain 90% of what AI needs; AGENTS.md adds only AI-specific operational context. That 10% is where the discipline lives — every token in AGENTS.md sits in the attention valley between the prefix and your actual task. Put project knowledge in your README where agents can read it on demand; AGENTS.md is for what changes _how_ the agent operates, not _what_ the project does. Reference external docs by link rather than inlining them — agents can fetch details when needed.

:::tip Claude Code: Using AGENTS.md with Claude Code
Claude Code uses `CLAUDE.md` instead of `AGENTS.md`. To maintain a single source of truth while supporting both ecosystems, use **@-linking** in your `CLAUDE.md`:

```markdown
# CLAUDE.md

@/AGENTS.md
```

This imports your AGENTS.md content into Claude's context. For details on Claude Code's hierarchical context system, see the [Claude Code documentation](/developer-tools/cli-coding-agents#claude-code).
:::

:::warning Hierarchical CLAUDE.md: Hidden Context Bloat
Unlike AGENTS.md (a single file with predictable token cost), Claude Code's hierarchical system merges `CLAUDE.md` files from multiple levels — project root, subdirectories, `.claude/rules/`, user config, and enterprise policy — all automatically loaded based on your working directory. Each additional file lands in the attention valley described in [Context Engineering](./context-engineering.mdx#the-attention-curve-why-placement-matters): every merged file adds more middle-zone content between the prefix and your task. The total context-file token cost becomes invisible unless you audit every level of the hierarchy. If you use Claude Code, keep a single root `CLAUDE.md` that `@`-imports `AGENTS.md` and avoid scattering files throughout subdirectories — the hierarchy multiplies the squeeze.
:::

:::warning Security Consideration
Context files are injected directly into system prompts. Security researchers have identified "Rules File Backdoor" attacks where malicious instructions are injected using Unicode characters or evasion techniques. Keep context files minimal, version-controlled, and code-reviewed like any other code.
:::

**Next:** [MCP Tool Schemas and Budgets](./mcp-tool-schema-budgets.md)
