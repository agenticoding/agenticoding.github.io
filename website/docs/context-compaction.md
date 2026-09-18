---
title: 'Context Compaction'
---

import CompactionLineDiagram from '@site/src/components/VisualElements/CompactionLineDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Context Compaction

**Context effect:** compaction replaces accumulated conversation with a smaller synthetic state, restoring working room while discarding detail. It is lossy summarization guided by your instruction, but it cannot guarantee what survives. Future relevance is unknowable at compaction time: a debugging trace that looks like noise now may be the clue the next step needed.

In practice, the harness usually performs two reductions, not one. First it removes or offloads stale tool traces that no longer need to be replayed. Then it summarizes the surviving sections while leaving the most recent turns intact. The raw transcript may remain available outside the model call, but only the compact working set reaches the next request.

<DiagramFrame kicker="Context management" title="Compaction deletes traces, then summarizes the survivors" size="full" narration="Compaction makes room in two moves, and they are not the same loss. First it deletes whole stale tool traces: a read call and its eight thousand token result, a grep and its twelve thousand token result, gone from the next request entirely, though they may survive on disk. Then it summarizes the surviving threads one at a time, shrinking each into a short compressed echo while the most recent turns stay verbatim. What you get back is a smaller working set you can keep going with, but the loss is lopsided: deletion drops whole traces, summarization keeps only a lossy echo of what is left." caption={'Stale tool-call/result pairs leave the next request entirely. Surviving sections are summarized one by one, while the recent tail remains verbatim. The raw transcript may persist externally, but only the compact working set reaches the model.'}>

<CompactionLineDiagram />

</DiagramFrame>

Deletion is selection; summarization is transformation. Both reduce the model's working set, but only summarization preserves a synthetic version of the source section.

The reliable alternative is **manual handoff with external checkpointing**. Before starting a new phase, write a brief state file with the current goal, changed files, decisions, unresolved errors, and next step. Files provide exact recall; a fresh context provides inference quality.

### The Buffer Tax

Compaction itself consumes working context. The system reserves a buffer to ensure it can still perform the handoff when the session nears capacity — capacity intentionally withheld from normal conversation. This is the compaction buffer: a tax on your effective window.

:::tip Disable auto-compaction
Auto-compaction trades usable context for a safety margin you don't need when you own handoffs explicitly. Both Claude Code (CLI settings) and [pi](https://pi.dev) let you disable it:

```json narration="A harness setting that turns automatic compaction off. With it disabled the session keeps its full working context and compacts only when you choose, at a phase boundary, after externalizing anything that must survive exactly."
{ "compaction": { "enabled": false } }
```

Reclaim the buffer for actual work. Compact only when you choose to — at phase boundaries — and always externalize anything that must survive exactly.
:::

**Next:** [Reliability Levers](./reliability-levers.md)
