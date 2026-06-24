---
title: About
sidebar_label: About
description: 'Ofri Wolfus — Senior Software Architect, ex-Google engineer, and creator of ChunkHound, ArguSeek, and GoatDB. Author of Agentic Coding, a technical reference for engineers on AI-assisted development.'
keywords: [Ofri Wolfus, agentic coding, ChunkHound, ArguSeek, GoatDB, AI-assisted development, software architect, open source, distributed systems, MCP]
---

import SchemaMarkup from '@site/src/components/SchemaMarkup';
import { AuthorWaveNode } from '@site/src/components/VisualElements/ActorNodes';

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
    'https://github.com/ArguSeek/arguseek',
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

I'm **Ofri Wolfus**, Senior Software Architect at Applied Materials and an ex-Google engineer (Google APIs for Mac, WebKit renderer contributions, Chrome BiDi/RTL). I created [ChunkHound](https://chunkhound.github.io) and [ArguSeek](https://github.com/ArguSeek/arguseek) — the open-source tools used as reference implementations throughout this course.

<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
  <AuthorWaveNode />
</div>

Prior to my current role, I was Co-Founder & CTO of Ovvio.io (real-time collaborative work management) and first employee at Photomyne, where I scaled cloud infrastructure to 100M photos and 10M installs and wrote on-device neural network inference pre-TensorFlow. I co-founded EasyFit Orthopedics, where I designed, built, and patented a smart prosthetic leg interface (WO2015103506A1) — hardware, electronics, and embedded software. I was also an early contributor to Growl and Adium, two foundational Mac open-source projects.

BS Computer Science, Bar-Ilan University. 2 patents. [LinkedIn](https://www.linkedin.com/in/ofriwolfus/) · [GitHub](https://github.com/ofriw)

## Open Source

**[ChunkHound](https://chunkhound.github.io)** — Like having a core dev who's been on the project since day one, ready to answer any question — except it works across millions of lines and 30+ languages. Point your AI assistant at a codebase and ChunkHound gives it the kind of deep, structural understanding that normally takes months to build: where things live, why they're built that way, and what depends on what. Runs entirely on your machine. The code grounding tool used throughout this course. **1.1k GitHub stars.** ([GitHub](https://github.com/chunkhound/chunkhound))

**[ArguSeek](https://github.com/ArguSeek/arguseek)** — The colleague who always knows what's happening outside the building. When your AI assistant needs current information — is this library still maintained? what changed in the latest API version? any known CVEs? — ArguSeek runs parallel web searches, synthesizes 12+ sources in about 40 seconds, and flags promotional content automatically. Fast breadth over slow depth, for the hundreds of micro-decisions that make up a real coding day. The domain grounding tool used throughout this course. ([GitHub](https://github.com/ArguSeek/arguseek))

**[GoatDB](https://goatdb.dev)** — The entire backend in a single import. GoatDB collapses database, server, and sync layer into one TypeScript module — no SQL, no REST endpoints, no separate infrastructure to provision. Define a schema, call `useQuery`, and your UI stays in sync across devices, offline included. Under the hood: a Git-style commit graph with three-way merges gives every document a full version history and automatic conflict resolution, while cryptographic signatures let clients restore crashed servers from their own replicas. Ship a single Deno binary on a $5 VM and you have a production-grade, self-healing backend. Ideal for the kind of fast-iteration, single-tenant apps that agentic workflows produce — because the less operational surface area an AI has to manage, the more reliably it ships. **500+ GitHub stars.** ([GitHub](https://github.com/goatplatform/goatdb))

## Why This Reference

I built this course on 20+ years of production experience across compiled languages, embedded systems, cloud infrastructure, and LLM/RAG applications — not in theory. ChunkHound and ArguSeek were built specifically to solve the grounding problems this course teaches: code context collapse, knowledge cutoff hallucination, and context window management at scale. See [Lesson 5](./methodology/lesson-5-grounding) for architecture deep-dives on both tools.

I taught iOS, Android, and web development courses at John Bryce (2013–2016), including corporate training programs for client companies.

## Built With

**Platform:** [Docusaurus](https://docusaurus.io) — open-source static site generator by Meta. Presentations powered by [Reveal.js](https://revealjs.com) by Hakim El Hattab.

**Typography:** Body text set in [Inter](https://rsms.me/inter/) by Rasmus Andersson. Headings in [Space Grotesk](https://floriankarsten.github.io/space-grotesk/) by Florian Karsten. Code rendered in [Monaspace](https://monaspace.githubnext.com/) by GitHub Next — a superfamily of five metrics-compatible monospace typefaces (Neon, Argon, Xenon, Radon, Krypton) used as a semantic voice system throughout the course. All fonts self-hosted under SIL OFL 1.1.

**Illustrations:** Diagrams use [OpenMoji](https://openmoji.org/) color SVG assets. OpenMoji is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

## Copyright

© {new Date().getFullYear()} Ofri Wolfus
