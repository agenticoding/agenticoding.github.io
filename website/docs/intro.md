---
sidebar_position: 1
slug: /
title: 'Introduction'
---

## The Reality

AI coding assistants are production-standard in 2025—[over 77,000 organizations](https://github.com/newsroom/press-releases/github-universe-2024) have adopted GitHub Copilot, and [51% of developers](https://survey.stackoverflow.co/2025/) use AI tools daily. Companies ship features faster. Peer-reviewed research shows [over 55% efficiency gains](https://arxiv.org/abs/2302.06590) as a baseline—practitioners with proper methodology report 10x, including the author of this course. The technology works—but [66% of developers](https://survey.stackoverflow.co/2025/ai/) say AI solutions are "almost right, but not quite," and [only 3%](https://survey.stackoverflow.co/2025/ai/) highly trust the output.

**The problem isn't the tools. It's the operating model.**

You're treating AI agents like junior developers: waiting for them to "understand," fixing their code line-by-line, fighting context limits. That's the wrong mental model. AI agents aren't teammates—they're **power tools**. You need to learn to operate them.

Research confirms it: developers without proper methodology are [actually 19% slower](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) with AI tools—while practitioners using systematic approaches report up to 10x efficiency gains. The difference is operator skill.

## What This Course Is

This is **operator training** for AI coding agents. You'll learn the systematic approach used in production environments:

- **Research** - Ground agents in codebase patterns and domain knowledge before acting
- **Plan** - Design changes strategically—explore when uncertain, be directive when clear
- **Execute** - Run agents supervised or autonomous based on trust and task criticality
- **Validate** - Verify against your mental model, then iterate or regenerate

No hand-holding. No toy examples. This course assumes you know how to engineer software—we're teaching you how to **orchestrate agents that execute it autonomously**.

## What This Course Isn't

- **Not AI theory** - We cover enough internals to operate effectively, nothing more
- **Not prompt templates** - Copying prompts doesn't work; understanding principles does
- **Not a replacement for fundamentals** - You still need to know architecture, design patterns, and system design
- **Not for beginners** - If you don't have production experience, start there first

## Who Should Take This

You're the target audience if you:

- Have 3+ years professional engineering experience
- Already tried AI coding assistants and hit frustration points
- Want to move faster without sacrificing code quality
- Need to understand codebases, debug issues, or plan features more efficiently
- Care about production-readiness, not demos

## How to Use This Course

This is a **reference manual**, not a traditional course with exercises.

**Recommended approach:** Read sequentially first, then return to specific lessons as needed:

1. Module 1: Fundamentals - Mental models and architecture
2. Module 2: Methodology - Prompting, grounding, workflow design
3. Module 3: Practical Techniques - Onboarding, planning, testing, reviewing, debugging

Apply the concepts on real projects as you encounter relevant situations. The value comes from having the right mental models when you need them.

## What You'll Gain

After completing this course, you'll be able to:

- **Onboard to unfamiliar codebases** 5-10x faster using agentic research
- **Refactor complex features** reliably with test-driven validation
- **Debug production issues** by delegating log/database analysis to agents
- **Review code systematically** with AI assistance while maintaining critical judgment
- **Plan and execute features** with parallel sub-agent delegation

## Prerequisites

- **Experience:** 3+ years professional software engineering
- **Tools:** Access to a CLI coding agent (Claude Code, OpenAI Codex, Copilot CLI, etc). If you haven't picked one yet, Claude Code is recommended at time of writing (plan mode, sub-agents, slash commands, hierarchical CLAUDE.md, status bar support).
- **Mindset:** Willingness to unlearn "AI as teammate" and adopt "AI as tool"

## About This Course's Development

**This course practices what it teaches.** The entire curriculum—content structure, lesson progression, code examples, and documentation—was developed using the same AI-assisted techniques and workflows you'll learn here.

Every module was planned, researched, drafted, and refined through systematic prompting, agentic research, and iterative validation. The process followed the exact methodology outlined in the course: breaking work into agent-appropriate tasks, grounding in architectural context, and validating output critically.

**The podcast version of each lesson** was generated using Claude Code and Google's Gemini API—converting technical content into conversational dialogue, then synthesizing multi-speaker audio. The voices you hear (Alex and Sam) are AI-generated, as is their script. Even this acknowledgment exists because we applied the principle of transparency in AI-assisted work.

This isn't marketing. It's validation. If these techniques can produce production-grade training material on their own application, they're robust enough for your codebase.

## The Deeper Truth

This course isn't about AI. It's about rigorous engineering with tools that happen to be stochastic systems.

AI agents are **amplifiers**—of your architectural clarity, your testing discipline, your code patterns. Good or bad, they compound what exists. [Research shows](https://leaddev.com/technical-direction/how-ai-generated-code-accelerates-technical-debt) AI code has 8x more duplication—not because agents create it, but because they amplify existing patterns.

**You are the circuit breaker.** Every accepted line becomes pattern context for future agents. Your engineering judgment—in review, in architecture, in pattern design—determines which direction the exponential curve bends. The tools changed. The fundamentals didn't.

---

**Ready to start?** Begin with [Lesson 1: LLMs Demystified](/docs/fundamentals/lesson-1-how-llms-work).
