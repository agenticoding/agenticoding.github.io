---
title: About
sidebar_label: About
description: 'Ofri Wolfus — Senior Software Architect, ex-Google engineer, and creator of ChunkHound, ArguSeek, and GoatDB. Author of Agentic Coding, a technical reference for senior engineers on AI-assisted development.'
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

<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
  <AuthorWaveNode />
</div>

I'm **Ofri Wolfus**, Senior Software Architect at Applied Materials and an ex-Google engineer (Google APIs for Mac, WebKit renderer contributions, Chrome BiDi/RTL). I created [ChunkHound](https://chunkhound.github.io) and [ArguSeek](https://github.com/ArguSeek/arguseek) — the open-source tools used as reference implementations throughout this course.

Prior to my current role, I was Co-Founder & CTO of Ovvio.io (real-time collaborative work management) and first employee at Photomyne, where I scaled cloud infrastructure to 100M photos and 10M installs and wrote on-device neural network inference pre-TensorFlow. I co-founded EasyFit Orthopedics, where I designed, built, and patented a smart prosthetic leg interface (WO2015103506A1) — hardware, electronics, and embedded software. I was also an early contributor to Growl and Adium, two foundational Mac open-source projects.

BS Computer Science, Bar-Ilan University. 2 patents. [LinkedIn](https://www.linkedin.com/in/ofriwolfus/) · [GitHub](https://github.com/ofriw)

## Open Source

**[ChunkHound](https://chunkhound.github.io)** — Like having a core dev who's been on the project since day one, ready to answer any question — except it works across millions of lines and 30+ languages. Point your AI assistant at a codebase and ChunkHound gives it the kind of deep, structural understanding that normally takes months to build: where things live, why they're built that way, and what depends on what. Runs entirely on your machine. The code grounding tool used throughout this course. **1.1k GitHub stars.** ([GitHub](https://github.com/chunkhound/chunkhound))

**[ArguSeek](https://github.com/ArguSeek/arguseek)** — The colleague who always knows what's happening outside the building. When your AI assistant needs current information — is this library still maintained? what changed in the latest API version? any known CVEs? — ArguSeek runs parallel web searches, synthesizes 12+ sources in about 40 seconds, and flags promotional content automatically. Fast breadth over slow depth, for the hundreds of micro-decisions that make up a real coding day. The domain grounding tool used throughout this course. ([GitHub](https://github.com/ArguSeek/arguseek))

**[GoatDB](https://goatdb.dev)** — Embedded distributed document DB built on version-control principles rather than traditional database techniques. Cryptographically signed commits, three-way merges, and automatic conflict resolution for live data. TypeScript-first with React hooks. Works offline, syncs on reconnect, self-heals from the commit graph. **500+ GitHub stars**. ([GitHub](https://github.com/goatplatform/goatdb))

## Why This Reference

I built this course on 20+ years of production experience across compiled languages, embedded systems, cloud infrastructure, and LLM/RAG applications — not in theory. ChunkHound and ArguSeek were built specifically to solve the grounding problems this course teaches: code context collapse, knowledge cutoff hallucination, and context window management at scale. See [Lesson 5](./methodology/lesson-5-grounding) for architecture deep-dives on both tools.

I taught iOS, Android, and web development courses at John Bryce (2013–2016), including corporate training programs for client companies.

## Built With

This site is built with [Docusaurus](https://docusaurus.io) — an open-source static site generator maintained by Meta.

## Copyright

© {new Date().getFullYear()} Ofri Wolfus
