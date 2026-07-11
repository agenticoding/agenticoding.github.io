---
title: About
description: 'Ofri Wolfus — Senior Software Architect, ex-Google engineer, and creator of ChunkHound and GoatDB. Author of Agentic Coding, a technical reference for engineers on AI-assisted development.'
keywords: [Ofri Wolfus, agentic coding, ChunkHound, GoatDB, AI-assisted development, software architect, open source, distributed systems, MCP]
---

import SchemaMarkup from '@site/src/components/SchemaMarkup';

export const personData = {
  name: 'Ofri Wolfus',
  jobTitle: 'Senior Software Architect',
  worksFor: 'Applied Materials',
  url: 'https://agenticoding.ai/about',
  sameAs: [
    'https://www.linkedin.com/in/ofriwolfus/',
    'https://github.com/ofriw',
    'https://goatdb.dev',
    'https://github.com/goatplatform/goatdb',
    'https://github.com/chunkhound/chunkhound',
  ],
  knowsAbout: [
    'agentic coding',
    'codebase intelligence',
    'distributed databases',
    'compilers',
    'LLM applications',
    'retrieval-augmented generation',
    'software architecture',
    'embedded systems',
  ],
  alumniOf: ['Google', 'Bar-Ilan University'],
};

<SchemaMarkup type="person" data={personData} />

## Author

I'm **Ofri Wolfus**, Senior Software Architect at Applied Materials and an ex-Google engineer (Google APIs for Mac, WebKit renderer contributions, Chrome BiDi/RTL).

I built [ChunkHound](https://chunkhound.github.io) because I needed a RAG solution that could handle a 100M+ LoC monorepo on my laptop — no servers, no ops, no GPUs. The one hard rule from the start: not a single line of code written by hand. Every feature, fix, and refactor was produced by an AI agent. That experiment became this book's foundation, then grew through real users, maintainer review, and production workflows.

Prior to my current role, I was Co-Founder & CTO of Ovvio.io (real-time collaborative work management) and first employee at Photomyne, where I scaled cloud infrastructure to 100M photos and 10M installs and wrote on-device neural network inference pre-TensorFlow. I co-founded EasyFit Orthopedics, where I designed, built, and patented a smart prosthetic leg interface (WO2015103506A1) — hardware, electronics, and embedded software. I was also an early contributor to Growl and Adium, two foundational Mac open-source projects.

BS Computer Science, Bar-Ilan University. 2 patents. 20+ years across compiled languages, embedded systems, cloud infrastructure, and LLM/RAG applications. I taught iOS, Android, and web development courses at John Bryce (2013–2016), including corporate training programs. [LinkedIn](https://www.linkedin.com/in/ofriwolfus/) · [GitHub](https://github.com/ofriw)

## Open Source

**[ChunkHound](https://chunkhound.github.io)** — Local-first codebase intelligence. Indexes code via AST-aware parsing, extracts architecture and patterns, and returns research-grade answers through MCP. Also handles web research — documentation, CVEs, changelogs, current information beyond training data. Runs entirely on your machine, scales to 100M+ LoC. Used as the reference implementation throughout this book. **1.4k GitHub stars.** ([GitHub](https://github.com/chunkhound/chunkhound))

**[GoatDB](https://goatdb.dev)** — I built GoatDB because agent-generated apps need a backend as simple as the agent's mental model. One TypeScript import — database, server, sync, offline — with a Git-style commit graph for conflict resolution. Ship a single Deno binary on a $5 VM. **570 GitHub stars.** ([GitHub](https://github.com/goatplatform/goatdb))

## Why I Built This

This book and its tools are open-source community projects. There's no company, no commercial interest, and nothing for sale.

ChunkHound started as a personal experiment: build a production-grade RAG system for a massive monorepo without writing a single line of code by hand. That constraint forced me to learn how to operate AI agents well — how to ground them, plan with them, verify their work, and manage context at scale.

This book distills patterns from multiple production systems built that way, plus what I've learned from hundreds of different engineers using modern AI tools — their workflows, their failures, their breakthroughs. The grounding patterns in Chapter 4 are ChunkHound's research pipeline. The context engineering principles in Chapter 5 are what I learned scaling across codebases of hundreds of millions of lines. These aren't theoretical — they're MIT-licensed, and you can read the code. See [MCP Servers](/developer-tools/mcp-servers) for architecture deep-dives on ChunkHound.

## Built With

**Platform:** [Docusaurus](https://docusaurus.io) — open-source static site generator by Meta.

**Typography:** Body text set in [Inter](https://rsms.me/inter/) by Rasmus Andersson. Headings in [Space Grotesk](https://floriankarsten.github.io/space-grotesk/) by Florian Karsten. Code rendered in [Monaspace](https://monaspace.githubnext.com/) by GitHub Next — a superfamily of five metrics-compatible monospace typefaces (Neon, Argon, Xenon, Radon, Krypton) used as a semantic voice system throughout the course. All fonts self-hosted under SIL OFL 1.1.

**Illustrations:** Diagrams use [OpenMoji](https://openmoji.org/) color SVG assets. OpenMoji is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

## Copyright

© {new Date().getFullYear()} Ofri Wolfus
