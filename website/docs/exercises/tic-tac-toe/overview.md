---
title: 'Tic-Tac-Toe'
sidebar_label: 'Tic-Tac-Toe'
---

import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';
import TicTacToeArchitectureDiagram from '@site/src/components/VisualElements/TicTacToeArchitectureDiagram';
import ToolMark from '@site/src/components/VisualElements/ToolMark';
import { StackList, StackEntry } from '@site/src/components/StackList';

This exercise runs the book's concepts as a workflow on your own code. You take one small system — a realtime, server-authoritative tic-tac-toe — from a rough intent to a merged pull request, driving it end to end the way the book prescribes. What you carry away is the process, not the finished artifact: the ability to move any feature through a spec the agent answers to, bounded runs backed by evidence, a critical review, and an owned change. The path runs on a small toolchain and a reference workflow you can adopt or replace.

## Why this project

The game is chosen to be forgotten: you already know the rules, so no attention goes to the mechanics, and the whole budget goes to the workflow — how intent becomes a spec, how the spec becomes evidence, and how evidence becomes a change you can defend. The design surface stays open on purpose. You are not assumed to be an expert in architecture or visual design, so those decisions are left as questions to research and explore with the agent. That is the exercise's first lesson made live: an open question turned into an approved decision.

Something this simple is still a real system: two clients, one authority, durable state, and failures that actually happen — a reconnect, an eviction, a malformed frame. Validating that robustly is not trivial. But it is finite by construction: a match can never exceed nine moves, every square played, ending in a draw. That hard ceiling keeps the state space small enough that even exhaustive replay validation stays tractable.

Anonymous players remove the other half of the usual cost. With no accounts there is nothing to authenticate: no identity to model, no session to expire, no recovery flow to design. Authentication is where most simple systems hide their complexity, and dropping it is what keeps this real rather than a toy — and small enough to finish in a single workday.

## The game you'll build

Two people open the same link and take turns on a three-by-three grid. Neither player has an account, and nothing in it asks for one. The home page mints a game and sends you to its own URL, `/g/:id`; opening someone else's URL drops you into the first free seat, X then O; a cookie remembers which seat is yours, so a refresh puts you back in it; and a third visitor is turned away.

The board itself lives on the server, not in the browser. A click sends a move; the server rules on whether it is legal, works out the position, then pushes the result over a WebSocket to the whole match. The client never applies a move on its own — it draws what it is told. That one rule turns a grid into a distributed system: two browsers, one authority, and a network in between that can drop.

<DiagramFrame kicker="Exercise" title="One server, two clients, one replayable log" size="wide" narration="One distinction holds this exercise together: a mark you play is a claim, not yet a fact. It shows up as a candidate the instant it is played, provisional until something authoritative confirms it. That is the shape of the whole system — the edges propose, one place confirms, and everything converges on the confirmed result." caption="Two anonymous seats in a game at its own URL, one authority in the middle, and a log that records every turn.">
  <TicTacToeArchitectureDiagram />
</DiagramFrame>

Read the figure as the exercise in miniature. The cast is four tiles: two anonymous seats, Player X and Player O, one game server that alone may rule on a move, and a SQLite store holding the current state beside its append-only log. Two lanes run between them, one per direction — a move lane carries each seat's claim to the server, a state-push lane carries the decided board back to both seats. The write into the store is drawn structurally rather than as a lane: the turn lands in the log before either seat hears back, which is the ordering the whole build has to guarantee.

Each of the four workflow phases maps onto that picture. Grounding settles what the lanes must carry and what the server's two decisions — validate, then apply — are allowed to reject. The bounded runs replay the log the store holds and check the seats converge on the same board. Review interrogates the one asymmetry the figure makes visible: the seat that played draws its mark as a provisional candidate while everyone else waits on the push, so a dropped socket, a bad frame, or a restart mid-match must still land every client on the same position. What you merge at the end is that guarantee, with the evidence to defend it.

Every change is appended to an event log in SQLite with a strictly increasing sequence number, beside the current state. The log is the durable record; the state is what gets sent. A client that loses its socket reconnects with backoff, reports the last number it saw, and receives everything after it in order — so a laptop that sleeps mid-game wakes on exactly the position the others are looking at. Because a match is bounded, the whole log is the replay window: no snapshots, no trimming.

That is a small system, and every failure mode in it is real — a dropped socket, a bad frame, a restart mid-match. The genuinely hard part is not writing the replay but proving it is deterministic, and that is the first question the spec has to settle.

What you end up with is a small, readable workspace in four modules — pure rules, a durable history, a server that owns that history and the live connections, and a client that draws what it is told. Underneath is an ordinary stack: Node.js, React, SQLite. A suite pins the ordering and replay guarantees, and the change lands as a merged pull request. Every claim about the process maps to a file in that build.

## The stack you'll install

The game is what you build. What you build it with is a separate stack: the harness you install before any of the rest can start.

This book's [CLI Coding Agents](../../developer-tools/cli-coding-agents.md) ranks the field and puts <ToolMark src="/img/cli-agent-logos/pi.svg" inline /> [pi](https://pi.dev) first — vendor-independent and extension-first. The exercise commits to that pick and is deliberately not generic: it runs on the stack the book recommends, where <ToolMark src="/img/stack-logos/chunkhound.svg" inline /> [ChunkHound](https://chunkhound.ai) and <ToolMark src="/img/stack-logos/pi-schematic.svg" inline /> [pi-schematic](https://github.com/chunkhound/pi-schematic) are purpose-built to apply the book's techniques rather than illustrate them. Both are by this book's author [disclosure].

pi ships no sub-agents, memory, or research tools; the harness adds each back as an extension.

<StackList narration="Setup is the one step that cannot happen through the audio, because it needs clicks. Sit down at the desktop page and work through each Setup control before you start — the whole stack installed and answering, nothing missing.">
  <StackEntry mark="/img/cli-agent-logos/pi.svg" name="pi" href="https://pi.dev" setupHref="https://pi.dev/docs">most harnesses tax your window before work starts; pi spends ~1k tokens on a system prompt plus four tools, loaded on demand, so nearly all of it stays on the task.</StackEntry>
  <StackEntry mark="/img/stack-logos/mcp.svg" name="pi-mcp-adapter" href="https://github.com/nicobailon/pi-mcp-adapter" setupHref="https://github.com/nicobailon/pi-mcp-adapter">MCP servers charge thousands of tokens for schemas you may never call; this standalone adapter fronts them with one ~200-token proxy tool, discovering tools on demand, starting servers lazily.</StackEntry>
  <StackEntry mark="/img/stack-logos/pi-schematic.svg" name="pi-schematic" href="https://github.com/chunkhound/pi-schematic" setupHref="https://github.com/chunkhound/pi-schematic">hand-rolled context engineering means scratch markdown files and copy-pasted state; this turns it into primitives — [spawn](../../sub-agent-delegation.md), the [notebook](../../agent-context-state.mdx#memory-is-retrieval-not-recall) and [handoff](../../context-compaction.md), model groups — so vendor independence drives a faster multi-model workflow.</StackEntry>
  <StackEntry mark="/img/stack-logos/chunkhound.svg" name="ChunkHound" href="https://chunkhound.ai" setupHref="https://chunkhound.ai/docs/getting-started/">raw search crowds out the orchestrator's own work; a [workflow agent](../../harness-agents.mdx) for grounding, it researches code, web, and git history and returns synthesized findings — enterprise-scale RAG on one laptop.</StackEntry>
  <StackEntry mark="/img/stack-logos/agent-browser.svg" name="agent-browser" href="https://agent-browser.dev" setupHref="https://agent-browser.dev">some things only a rendered page settles; this drives the browser and returns compact snapshots, so the agent confirms what shipped.</StackEntry>
</StackList>

That harness is what sets everything in motion — routing each task to a fitting model, delegating through spawn for isolation, grounding research in ChunkHound, and keeping the context window small with the notebook and handoff. With it installed and answering, the game itself becomes the small part: the four-phase workflow — ground, plan, execute, validate — needs everything working before the spec means anything.

[disclosure]: /about 'Disclosure: the author created ChunkHound and pi-schematic'
