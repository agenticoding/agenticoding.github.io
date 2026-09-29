---
title: 'Context Files'
---

import ContextSqueezeDiagram from '@site/src/components/VisualElements/ContextSqueezeDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Context Files

Context files are markdown documents injected between the system prompt and your input. They give agents project memory without repeated explanations: architecture, conventions, build commands, constraints.

**Context effect:** on every call the loop rebuilds the window and re-injects the file ahead of your prompt. That is the promise — instructions in the fixed prefix are always in front of the model, so nothing has to be re-explained or fetched on demand. It is also the price: because the file sits _before_ your prompt, its size sets how far the task drifts as the loop appends turns behind it. A small file keeps your prompt near the primacy edge, where attention is strong; a large one pushes it into the dead center. The file always arrives — the tradeoff is where it leaves your task.

<DiagramFrame
kicker="Context management"
title="File size decides where your prompt lands"
size="standard"
narration="Here is the trap, and it's about your own file. Same task, same loop, same steps — the only difference is how big the context file is when the session starts. A lean file keeps your task in the strong band from beginning to end. A bloated file eats most of the window before the work even starts, so as the loop piles its own output on top, your task sinks into the middle — buried under everything the agent did after you asked. But buried is not gone. The task is still in the window; the agent just holds it loosely now — it can echo the gist, not the details. And since every step is a guess, the longer the loop runs in that thin band, the further the work drifts from what you actually asked."
caption={
'Same conversation, two file sizes. As turns append after the prompt, the prompt drifts from the recency edge: a small file lets it settle near the primacy edge — still strong attention; a big file lands it in the dead middle, where attention collapses.'
}
>
  <ContextSqueezeDiagram />
</DiagramFrame>

## AGENTS.md Is the Standard

In practice, the context file is `AGENTS.md`. It is the industry standard: plain Markdown, used by over 60,000 open-source projects, and governed by the Linux Foundation's Agentic AI Foundation. Most coding agents read it directly. Claude Code is the exception: it only falls back to `AGENTS.md` when the project has no dedicated Claude context file.

:::tip Bridge Claude Code with one line
Claude Code keeps its own project context file. Add a single `@AGENTS.md` import to that file, and Claude Code reads `AGENTS.md` at startup instead of a stale copy. One standard file, every agent.
:::

That ubiquity is what makes the file so powerful — and so risky. An `AGENTS.md` is not scoped to a session, a task, or a tool. It enters the fixed prefix of **every call**, for **every agent** that touches the repository, on **every task**, for everyone who clones it afterward. Change one line and you change how all of them behave, immediately, with nothing in the test suite to catch it. No source file has that reach.

And because the file sits in that prefix — ahead of every prompt — its size is a shared cost, not a private one. The diagram above shows the drift for a single conversation; a shared AGENTS.md does it to every conversation at once. Every added token pushes every contributor's prompt further from the primacy edge and deeper into the dead center of the window. A bloated file does not slow down one agent; it degrades **all** of them, on **every** task, for as long as the file stays bloated.

That is why AGENTS.md is the most important file in the repo to audit, review, and keep minimal — more than any code file. It is always on, it silently steers every agent, and a single vague or stale line degrades everything downstream. When the file and the code disagree, the agent follows the file — even when the file is wrong.

Treat it as a public interface: version-controlled, human-reviewed, and pruned the moment it goes stale.

## Writing an AGENTS.md

The best way to start is not to write one. Work on the project with your agent first and let the file earn its lines — you cannot know in advance what an agent will get wrong in *your* repository, and a rule written on speculation is a guess that bloats the prefix without changing behavior.

Add a line only when a mistake repeats. One wrong turn is noise; the same wrong turn across tasks is a signal. When it recurs, write the smallest instruction that names the offender and the fix — the exact command, the forbidden path, the convention the code does not express — and nothing more. Rules earned from real failures are the only ones that reliably change behavior.

Then prune. Models improve, and a rule that corrected last year's model may be redundant to this year's — internalized by the model, or guarding code that no longer exists. Re-read the file periodically and delete whatever no longer earns its place. An AGENTS.md that only ever grows is the bloat the diagram above warns about.

**Reach for it last.** AGENTS.md is a last resort, not a first fix. A recurring mistake usually points at the code — an invariant the types do not capture, a function that is hard to find, a name that misleads. Clean, well-documented code is easier for any agent to get right, and [tool-driven retrieval](./retrieval-augmented-generation.md) lets an agent find the answer on demand at codebase scale instead of carrying it in every prompt. Both address the root cause and keep context efficient: the knowledge is paid for only when it is needed, not by every agent on every call. Add a line to AGENTS.md only for what the code and the tools still cannot resolve.

:::warning Rules File Backdoor
Context files are injected directly into the system prompt, which makes them an attack surface. "Rules File Backdoor" attacks hide instructions in Unicode or evasion tricks that a reviewer skims past. Keep these files minimal, version-controlled, and code-reviewed like any other code.

Nor do the tools always gate them: context files can be read before any trust decision, so a freshly cloned repository's `AGENTS.md` may reach the prompt before you approve the project. pi, for example, loads context files regardless of project trust ([pi security docs](https://pi.dev/docs/latest/security)). Treat an unfamiliar `AGENTS.md` as executable content, not documentation.
:::
