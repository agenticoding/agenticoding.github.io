# Reverse Engineering 180M Lines of Code

> **GeekTime Code 2026 — Closing Keynote**
> **Speaker:** Ofri Wolfus, Senior Architect @ Applied Materials
> **Slot:** 15:30–16:00 (20 min talk + 10 min Q&A)
> **Format:** Hebrew or English (adjust based on event guidance)
> **Framework:** PSI (Problem → Solution → Impact) + Progressive Disclosure

---

## Slide 1 — Title

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│         REVERSE ENGINEERING 180M LINES OF CODE           │
│                                                          │
│              Ofri Wolfus · Applied Materials             │
│                   GeekTime Code 2026                     │
│                                                          │
│                                                          │
│              [ChunkHound logo or abstract visual]        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**🎤 Speaker notes:**

> Good afternoon. I'm Ofri Wolfus. I've been writing code for over 20 years — ex-Googler, built a couple startups, and today I'm a Senior Architect at Applied Materials.
>
> I'm going to tell you the story of the biggest codebase I've ever encountered, why we couldn't understand it, and what happened when we gave AI the job of reverse engineering it.
>
> But first — a show of hands. Who here works on a codebase older than 10 years? *(pause)* Older than 20? *(pause)* Okay, now imagine that codebase is 180 million lines, and if it has a bug, someone could die. That's my day job.

---

## Slide 2 — The Beast

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    THE BEAST                             │
│                                                          │
│   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐  │
│   │              │   │              │   │             │  │
│   │  180M+ LoC   │   │   24 years   │   │  Mission    │  │
│   │  top 0.001%  │   │   of history │   │  Critical   │  │
│   │              │   │              │   │             │  │
│   └──────────────┘   └──────────────┘   └─────────────┘  │
│                                                          │
│   [Photo: cleanroom / semiconductor fab / machine]       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**🎤 Speaker notes:**

> Applied Materials builds the machines that build chips. Our customers? Samsung, TSMC, everyone you've heard of. These are heavy industrial systems — high voltage, electron guns, vacuum chambers, robots moving wafers at nanometer precision. They run 24/7 on factory floors. They inspect features at the level of individual atoms.
>
> The software that runs these machines? 180 million lines of code. That puts us in the top 0.001% of repositories on the planet. It's a monorepo. One single repository. It powers the entire product line.
>
> Here's where it gets interesting. Our codebase is 24 years old. It started as two separate Israeli companies that got acquired and merged. And if you look closely, you can still find code — actual, unmodified code — from those original companies. Not a lot. But it's there. Different naming conventions, different architectural patterns, full code snippets that haven't been touched in two decades, living side by side in the same repo.
>
> It mixes every modern language you can think of with heavily abstracted, deeply configurable Java and C++. We're talking industrial machinery orchestrated by software that has to coordinate mechanics, electronics, physics, and heavy image processing — all in real time, all without failure.

---

## Slide 3 — The Problem

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                  THE PROBLEM                             │
│                                                          │
│     "Nobody knows what this code actually does."         │
│                                                          │
│   ┌─────────────────────────────────────────────────┐    │
│   │  Each developer knows only:                     │    │
│   │  • What was there before their time (vaguely)   │    │
│   │  • What they personally changed                 │    │
│   │  • No full current-state snapshot exists        │    │
│   └─────────────────────────────────────────────────┘    │
│                                                          │
│   Previous refactoring attempts: FAILED                  │
│   (Many talented people tried. The code won.)            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**🎤 Speaker notes:**

> Here's the real problem. Nobody — and I mean nobody — understands the full system. Not me, not the CTO, not the engineer who's been here 20 years.
>
> Why? Because knowledge in a codebase this old and this large doesn't accumulate — it fragments. Every developer only truly understands the delta: what was there before their time, and what they changed. Multiply that by 24 years of churn, and the code becomes the only source of truth. The system itself is the documentation.
>
> Many talented engineers before us tried to refactor this beast. They all failed. Not because they weren't smart enough — they were brilliant. They failed because you can't refactor what you don't understand, and you can't understand 180 million lines by reading it.
>
> And then AI happened.

---

## Slide 4 — The AI Bet

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                   THE AI BET                             │
│                                                          │
│   "Can we use LLMs to understand our own codebase?"      │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │  We tested dozens of tools.                      │   │
│   │  None met our requirements:                      │   │
│   │  • Scale   — 180M+ LoC                           │   │
│   │  • Privacy — on prem / air-gapped                │   │
│   │  • Price   — can't send millions of tokens/query │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   So we built our own.                                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**🎤 Speaker notes:**

> About a year ago, we asked ourselves: can LLMs help us understand our own codebase? Can we use AI to reverse engineer the institutional knowledge that's been lost to time?
>
> We tested every tool we could find. Enterprise code search, cloud RAG platforms, AI coding assistants. None of them worked for us.
>
> Scale was the obvious problem — nobody builds for 180 million lines. But the harder constraints were privacy and cost. Our machines run on factory floors, often air-gapped. We can't ship code to a cloud service. And at our scale, sending millions of tokens per query would bankrupt us.
>
> So we did what engineers do. We built our own solution.
>
> That solution became ChunkHound. Open source. MIT license. And here's the twist that still surprises me — we decided to build it entirely with AI. Not a single line written by hand. Even the name "ChunkHound" was generated by GPT.
>
> *(pause for reaction)*
>
> Now, before you judge — let me show you what we learned along the way.

---

## Slide 5 — v1: The Obvious Approach (and Why It Fails)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│            THE OBVIOUS APPROACH                          │
│                                                          │
│   Code → Chunks → Embeddings → Vector DB → Search        │
│                                                          │
│   ┌─────────────────────────────────────────────────┐    │
│   │  Simple semantic search:                        │    │
│   │  1. Chunk the code                              │    │
│   │  2. Embed each chunk                            │    │
│   │  3. Semantic search → retrieve top-K chunks     │    │
│   │  4. Stuff into LLM context                      │    │
│   └─────────────────────────────────────────────────┘    │
│                                                          │
│                    ❌ DOESN'T WORK                       │
│                    at this scale                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**🎤 Speaker notes:**

> Let me walk you through our first attempt, because I suspect many of you have tried the same thing.
>
> The obvious approach: take your codebase, chunk it into small pieces, run each chunk through an embedding model, store everything in a vector database, and expose a semantic search tool to your AI agent. The agent asks "how does authentication work?", we retrieve the top 50 most relevant chunks, stuff them into context, and the LLM answers.
>
> This is textbook RAG. It works beautifully on medium-sized codebases. It falls apart completely at our scale.
>
> Here's why: a single feature in our system can easily span hundreds of files and thousands of chunks. Authentication isn't one function — it's a cross-cutting concern touching configuration, networking, session management, role models, audit logging. The top 50 chunks from a vector search can't possibly capture that. And even if they could — even if you could somehow fit all thousand relevant chunks into context — the LLM's attention curve would destroy accuracy.
>
> Context stuffing is not search. It's a heuristic that breaks at scale.

---

## Slide 6 — Deep Research for Code

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│            DEEP RESEARCH FOR CODE                        │
│                                                          │
│   ┌─────────────────────────────────────────────────┐    │
│   │  ChunkHound Orchestration Layer                 │    │
│   │                                                 │    │
│   │  🧠 LLM-guided exploration                      │    │
│   │  📝 Constant extraction + facts ledger          │    │
│   │  🔍 Multi-hop semantic search                   │    │
│   │  🗺️  Map-reduce summarization                   │    │
│   │  📏 Adaptive token budgets (30K → 150K)         │    │
│   └─────────────────────────────────────────────────┘    │
│                                                          │
│   [Diagram: iterative research loop]                     │
│   Query → Search → Extract → Next Question → ...         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**🎤 Speaker notes:**

> So we had to get smarter. Instead of a single search-and-stuff, we adapted the same techniques that modern deep research agents use to explore the web — but applied them to code.
>
> Imagine asking: "How does the electron beam calibration work?" ChunkHound doesn't just search once and dump results. It enters a research loop:
>
> First search finds the calibration entry point. The agent reads it, extracts key constants and function calls — these become "leads." It formulates follow-up questions: "Where is `CALIBRATE_BEAM` called from?" "What hardware interface does this talk to?" Each follow-up triggers new searches.
>
> We maintain a facts ledger — a running notebook of discovered architecture, constants, and patterns. The agent uses map-reduce: when a branch of exploration returns too much information, it summarizes before continuing. Token budgets expand and contract adaptively based on what's being explored.
>
> Think of it like a detective working a case. You don't read the entire evidence locker. You follow leads, take notes, form hypotheses, and investigate further. That's what the orchestration layer does.
>
> The result? ChunkHound can answer deep architectural questions about a 180M-line codebase. Questions that nobody in the company — not one person — could answer without weeks of manual investigation.

---

## Slide 7 — How We Actually Use It

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│         HOW WE ACTUALLY USE IT                           │
│                                                          │
│   Claude Code orchestrates tens of ChunkHound            │
│   deep research calls — each at a different zoom level.  │
│                                                          │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │  Algorithm   │  │    Test      │  │ Architecture │   │
│   │  details     │  │   coverage   │  │  big picture │   │
│   │  (zoom in)   │  │  (zoom mid)  │  │  (zoom out)  │   │
│   └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│   [Diagram: Claude Code → ChunkHound MCP tool            │
│    → parallel research calls → codebase]                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**🎤 Speaker notes:**

> Here's the part that's easy to miss. ChunkHound doesn't sit on the side as a standalone tool. Its research agent is exposed as an MCP tool — which means Claude Code can call it. Not once. Tens of times. In parallel.
>
> Think about what that unlocks. Claude Code orchestrates a team of researchers, each one zooming into a different corner of the system at a different zoom level. One call goes deep into an algorithm's implementation details. Another maps out the test coverage for a module. A third zooms way out and asks: "what's the architecture here? what talks to what?"
>
> The hardest module we've ever had to reverse engineer was the power-up system. Think about what happens when you turn on one of these industrial machines. You don't just flip a switch. You're orchestrating a full symphony — high-voltage power supplies ramping up in sequence, vacuum pumps reaching target pressure, electron guns warming, cooling systems stabilizing, safety interlocks checking in. Hundreds of hardware and physical processes, all coordinated by software, all of which must happen in exactly the right order on a factory floor where downtime costs millions.
>
> Nobody understood the full power-up sequence. The code was scattered across dozens of modules written over two decades by engineers who've long since left. ChunkHound reverse-engineered it. It traced the control flow through calibration routines, hardware abstraction layers, safety watchdogs, and configuration-driven state machines. It documented what happens from cold start to full operation — something no single human had ever done.
>
> That's the real pattern. Not one search. Orchestrated research.

---

## Slide 8 — The Local Vector DB Problem

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│              SCALING LOCAL VECTOR SEARCH                  │
│                                                           │
│   ChunkHound is LOCAL FIRST.                              │
│   Your code never leaves your laptop.                     │
│                                                           │
│   ┌───────────────────────────────────────────────────┐   │
│   │  Problem: Nobody builds local vector DBs          │   │
│   │  for millions of vectors.                         │   │
│   │                                                   │   │
│   │  This is usually a cloud problem.                 │   │
│   │  We had to solve it on a dev laptop.              │   │
│   └───────────────────────────────────────────────────┘   │
│                                                           │
│   ┌───────────────────────────────────────────────────┐   │
│   │  Solution:                                        │   │
│   │  • DuckDB as source of truth (metadata, chunks)   │   │
│   │  • Sharded vector index built on USearch          │   │
│   │  • Decoupled — semantic search doesn't touch DB   │   │
│   └───────────────────────────────────────────────────┘   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**🎤 Speaker notes:**

> Let me zoom in on one specific technical challenge that almost killed the project. ChunkHound is local first by design. Your code stays on your machine. No cloud uploads, no API calls with your IP. This is non-negotiable for us.
>
> But here's the thing: local vector databases are not built for millions of vectors. That's usually a cloud problem. When you're Pinecone or ChromaDB running on a Kubernetes cluster, you have resources. When you're on a developer's MacBook, you're competing with their IDE, their Docker containers, their 47 Chrome tabs.
>
> We couldn't find any references of people trying to push local vector search to this scale. We had to figure it out ourselves.
>
> The vector index is sharded — that's how it scales locally — built on top of USearch. DuckDB acts as the source of truth for all the metadata and chunk data, but the actual semantic search never touches it. We decoupled the two so each can be tuned for its own workload.
>
> The result? You can index tens of millions of lines of code locally, on your laptop. In private. Without an internet connection.

---

## Slide 9 — One Year In: Where We Are

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│              ONE YEAR IN                               │
│                                                        │
│   ┌──────────────────┐  ┌──────────────────┐           │
│   │   32+ languages  │  │  20+ contributors│           │
│   │   supported      │  │  from industry   │           │
│   └──────────────────┘  └──────────────────┘           │
│                                                        │
│   ┌───────────────────┐  ┌──────────────────┐          │
│   │  Spec time:       │  │  Local-first,    │          │
│   │  3 months → 3 days│  │  private, MCP    │          │
│   └───────────────────┘  └──────────────────┘          │
│                                                        │
│   Community: Kimara AI · Riot Games                    │
│   US Gov contractors · and growing...                  │
│                                                        │
│   github.com/chunkhound/chunkhound                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**🎤 Speaker notes:**

> A year into this project, here's where we stand. ChunkHound indexes 32 languages and handles projects with tens of millions of lines of code — locally, on your laptop. We have over 20 contributors from companies like Kimara AI, Riot Games, U.S. government contractors, and many individual developers.
>
> But let me give you the metric that matters. We haven't refactored our codebase yet — that's going to take years, and anyone who tells you AI will refactor a 180M-line codebase in a weekend is selling something. What we *have* done: the time to write a specification for an existing module dropped from 3 months to 3 days. Months became days. Not because AI writes specs — because for the first time, an engineer can actually *understand* the module they're documenting without spending weeks manually tracing code.
>
> We didn't build this alone. The open-source community showed up in a way I couldn't have predicted. Every contribution — from someone fixing a parser bug for a language I've never used, to Riot Games stress-testing our indexing pipeline on their monorepo — has shaped ChunkHound into what it is today.
>
> Without the community, this project wouldn't exist. Period.

---

## Slide 10 — The Meta-Lesson

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              THE META-LESSON                             │
│                                                          │
│   Building ChunkHound with AI taught us                  │
│   how to build software with AI.                         │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │  Agents don't replace engineers.                 │   │
│   │  They amplify them.                              │   │
│   │                                                  │   │
│   │  Garbage in → Garbage out.                       │   │
│   │  Your fundamentals now matter MORE.              │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   Our agentic engineering playbook:                      │
│   agenticoding.ai (also open source)                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**🎤 Speaker notes:**

> But here's the meta-lesson — the thing I really want you to take away from this talk. Remember I told you we built ChunkHound entirely with AI? That process taught us more about building production-grade software with agents than any blog post or paper ever could.
>
> We distilled everything we learned into an open-source agentic engineering playbook at agenticoding.ai. 13 lessons covering research, planning, execution, and validation patterns. Prompt structure, grounding, context management, iteration cycles. The real stuff — what actually works when you're shipping, not just prototyping.
>
> The core insight is this: agents don't replace engineers. They amplify them. And "garbage in, garbage out" has never been more true. When you're generating code at 10x speed, your design mistakes also propagate at 10x speed. Your fundamentals — system design, architecture, testing strategy — these now determine whether you get the 10x productivity everyone's talking about, or 10x the mess.
>
> Get the fundamentals right, and agents unlock something incredible. Get them slightly wrong, and agents will amplify your mistakes faster than you can say "git revert."

---

## Slide 11 — The Future Is Private

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              THE FUTURE IS PRIVATE                       │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │  In the agentic era, your ability to harness     │   │
│   │  the knowledge you ALREADY HAVE is what          │   │
│   │  sets you apart from the competition.            │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   ChunkHound is critical infra for this future.          │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │  We're training hundreds of devs internally.     │   │
│   │  Giving management Claude cowork.                │   │
│   │  Transforming our DNA to AI-native.              │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   [QR code: github.com/chunkhound/chunkhound]            │
│   [QR code: agenticoding.ai]                             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**🎤 Speaker notes:**

> Here's what I believe: in this new agentic era, your competitive advantage isn't your model, your API key, or your prompt library. It's your ability to harness the knowledge you already have. Twenty-four years of code, of institutional memory embedded in every function signature and commit message. That's your moat.
>
> ChunkHound is our bet that the future of code intelligence is local, private, and open. We're deploying it across Applied Materials — training hundreds of developers, giving every engineer full access to Claude Code, putting Claude cowork in front of our management team. We're not just adopting AI tools; we're changing our organizational DNA to be AI-native.
>
> This is bigger than one company or one codebase. Every organization with a legacy codebase faces the same problem. And now there's an open-source tool that can help.

---

## Slide 12 — Call to Action

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              JOIN US                                     │
│                                                          │
│   github.com/chunkhound/chunkhound                       │
│   agenticoding.ai                                        │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │  We'd love your involvement.                     │   │
│   │                                                  │   │
│   │  One rule: all code must be AI-generated 😉      │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   Thank you. 🙏                                          │
│                                                          │
│   Questions?                                             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**🎤 Speaker notes:**

> So here's my ask. If you work on a large, old, or complex codebase — or if you're just curious about what happens when you build production software entirely with AI — come contribute. ChunkHound is open source, MIT licensed. Agenticoding.ai is open source. We want your involvement.
>
> One rule, though. Remember: all code must be AI-generated. *(smile)* Yes, even your pull requests. We take this seriously.
>
> Thank you for being here. I'm happy to take your questions.
>
> *(Open Q&A — approximately 8-10 minutes)*
