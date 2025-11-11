---
sidebar_position: 1
sidebar_label: 'Lesson 6: Project Onboarding'
title: 'Lesson 6: Project Onboarding'
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

When you join a new project, the first week is brutal. You're swimming in unfamiliar architecture, tech stack decisions, tribal knowledge buried in Slack threads, and that one critical bash script everyone runs but nobody documented.

AI agents face the same problem—except they can't grab coffee with a senior engineer to fill in the gaps. They see exactly what's in their context window (~200K tokens) and nothing more. No memory of yesterday's conversation. No understanding of "how we do things around here."

**The solution: Codify your project context in hierarchical, machine-readable files.**

This lesson covers context files and how to structure them across user, project, and module levels to transform your AI agent from a generic code generator into a project-aware operator.

## The Context File Ecosystem

<!-- presentation-only-start -->

**AGENTS.md vs CLAUDE.md comparison - both approaches are valid depending on team tooling and project complexity. Use neutral styling.**

<!-- presentation-only-end -->

Context files are markdown documents that inject project-specific knowledge between the system prompt and your input, giving AI agents "project memory" without requiring repeated explanations of your tech stack, conventions, and architecture. The industry has converged on two approaches: `AGENTS.md` (vendor-neutral standard working across most major AI tools like Cursor, Windsurf, and GitHub Copilot) and tool-specific extensions like `CLAUDE.md` (for advanced features like hierarchical context in Claude Code).

<Tabs groupId="ai-tool">
<TabItem value="agents" label="AGENTS.md (Standard)" default>

`AGENTS.md` is the vendor-neutral standard adopted by 20,000+ open-source projects, working across GitHub Copilot, Cursor, Windsurf, and most other AI coding tools (note: Claude Code does not support AGENTS.md—use CLAUDE.md instead). Keep it minimal—your README should contain 90% of what AI needs; AGENTS.md adds only AI-specific operational context like MCP server configurations, environment variables, modified test commands for non-interactive execution, and warnings about non-obvious dependencies. Place it in your repository root for maximum compatibility.

</TabItem>
<TabItem value="claude" label="Claude Code (CLAUDE.md)">

Claude Code's `CLAUDE.md` uses hierarchical context where multiple files from different directories (global `~/.claude/CLAUDE.md`, project root, subdirectories) are automatically loaded and merged based on your working directory, with more specific instructions overriding general ones while non-conflicting rules from all levels remain active. This layered system lets you define universal preferences globally, project standards at the root, and module-specific overrides in subdirectories—without duplicating rules.

</TabItem>
</Tabs>

**Quick Comparison:**

| Feature               | AGENTS.md                                                | CLAUDE.md                     |
| --------------------- | -------------------------------------------------------- | ----------------------------- |
| **File location**     | Single file at repository root                           | Multiple files at any level   |
| **Context loading**   | One file only                                            | All applicable files merged   |
| **Hierarchy**         | No                                                       | Yes (global → root → subdirs) |
| **Override behavior** | N/A (single file)                                        | Specific overrides general    |
| **Merge behavior**    | N/A (single file)                                        | All files injected together   |
| **Tool support**      | GitHub Copilot, Cursor, Windsurf, etc. (not Claude Code) | Claude Code only              |

**Key takeaway:** AGENTS.md is one universal file. CLAUDE.md is a hierarchical system where multiple files are loaded and merged based on your working directory.

:::tip Mixed Ecosystem: Using Claude Code with AGENTS.md
Claude Code is the only major AI coding assistant that doesn't support AGENTS.md natively. If you're working in a mixed-tool environment (e.g., team members use Codex/Copilot while you use Claude Code), avoid duplicating content by using **@linking** in your `CLAUDE.md` to reference the shared `AGENTS.md`:

```markdown
# CLAUDE.md - Claude-specific configurations

@/AGENTS.md

# Additional Claude Code-specific context below
```

This imports the entire AGENTS.md content into Claude's context, maintaining a single source of truth while supporting both file formats.
:::

:::warning Security Consideration
Context files are injected directly into system prompts. Security researchers have identified "Rules File Backdoor" attacks where malicious instructions are injected using Unicode characters or evasion techniques. Keep context files minimal, version-controlled, and code-reviewed like any other code.
:::

## Hierarchical Context: User, Project, and Module Levels

Context files operate at different levels of specificity. **Global context** contains personal preferences that apply across all your projects—coding style, mindset, operational rules. **Project-level context** captures tech stack, architecture, and conventions specific to one codebase. Both can be implemented using `AGENTS.md` (vendor-neutral standard) or `CLAUDE.md` (Claude Code's hierarchical system that merges multiple files).

### Global-Level Example

Global context lives in your home directory and applies universally. Here's the course author's actual `~/.claude/CLAUDE.md`—a production example you can adapt for your own use:

```markdown
# Mindset

You are a senior architect with 20 years of experience across all software domains.

- Gather thorough information with tools before solving
- Work in explicit steps - ask clarifying questions when uncertain
- BE CRITICAL - validate assumptions, don't trust code blindly
- MINIMALISM ABOVE ALL - less code is better code

# Search Protocol

- Use ChunkHound's Code Research tool to learn the surrounding code style, architecture and module responsibilities
- PREFER THE CODE RESEARCH TOOL OVER ALL SUB AGENTS
- Use ArguSeek to read documentation and research relevant background for the task
- Search for best practices, prior art, and technical context with research_iteratively
- Use `search_semantic` and `search_regex` with small, focused queries
- Multiple targeted searches > one broad search

# Architecture First

LEARN THE SURROUNDING ARCHITECTURE BEFORE CODING.

- Understand the big picture and how components fit
- Find and reuse existing code - never duplicate
- When finding duplicate responsibilities, refactor to shared core
- Match surrounding patterns and style

# Coding Standards

KISS - Keep It Simple:

- Write minimal code that compiles and lints cleanly
- Fix bugs by deleting code when possible
- Optimize for readability and maintenance
- No over-engineering, no temporary compatibility layers
- No silent errors - failures must be explicit and visible
- Run tests after major changes
- Document inline when necessary

# Operational Rules

- Time-box operations that could hang
- Use `uuidgen` for unique strings
- Use `date +"%Y-%m-%dT%H:%M:%S%z" | sed -E 's/([+-][0-9]{2})([0-9]{2})$/\1:\2/'` for ISO-8601
- Use flat directories with grep-friendly naming
- Point out unproductive paths directly

# Critical Constraints

- NEVER Commit without explicit request
- NEVER Leave temporary/backup files (we have version control)
- NEVER Hardcode keys or credentials
- NEVER Assume your code works - always verify
- ALWAYS Clean up after completing tasks
- ALWAYS Produce clean code first time - no temporary backwards compatibility
- ALWAYS Use sleep for waiting, not polling
```

### Project-Level Example

Project-level context captures what a new team member needs to be productive in the first hour: tech stack specifics, common commands, tribal knowledge, and coding conventions. Here's the actual `CLAUDE.md` from this AI Coding Course repository:

````markdown
# AI Coding Course - Project Context

## Mindeset

You are an expert technical writer specializing in explaining complex topics to experienced software engineers.

## Project Overview

This is an **AI Coding Course designed for Senior Software Engineers**. The course teaches experienced developers how to effectively leverage AI coding assistants in production environments.

**Target Audience:** Senior engineers with 3+ years of professional experience
**Estimated Course Duration:** 24-33 hours of hands-on training

## Technology Stack

**Platform:** Docusaurus 3.9.2 (Static site generator)
**Languages:** TypeScript 5.6.2, React 19.0
**Key Features:**

- Live code blocks with `@docusaurus/theme-live-codeblock`
- MDX support for interactive components
- Full-text search with `@easyops-cn/docusaurus-search-local`
- Versioning system for content snapshots

## Development Commands

```bash
# Development
cd website && npm start              # Start dev server (localhost:3000)
npm run build                        # Production build
npm run serve                        # Preview production build locally

# Deployment
npm run deploy                       # Deploy to GitHub Pages
```

## Tone & Communication Style

**Coworker-level communication** - Professional, direct, no hand-holding

- Assume strong fundamentals (data structures, design patterns, system design)
- Skip basic explanations - link to external docs if needed
- Focus on practical application and production considerations
- Use industry-standard terminology without over-explaining

## Content Philosophy

**Production-Ready Architecture Focus**

- Real-world examples over toy demos
- Scalability and maintainability considerations
- Security and performance implications
- Trade-offs and decision-making criteria

**Minimalism & Clarity**

- Concise explanations
- Code examples that compile and run
- Clear learning objectives per lesson
- Hands-on exercises with real scenarios

## Key Configuration Files

- `website/docusaurus.config.ts` - Site configuration
- `website/sidebars.ts` - Auto-generated from docs structure
- `website/package.json` - Dependencies and scripts
- `.github/workflows/deploy.yml` - GitHub Pages deployment

## Deployment

- **Platform:** GitHub Pages
- **URL:** https://ofriw.github.io/AI-Coding-Course/
- **Trigger:** Automatic on push to main branch
- **Base URL:** `/AI-Coding-Course/`
````

## Automated Generation: Bootstrap with AI

**The meta-move: Apply lessons 3-5 to generate context files automatically.** Instead of manually drafting `AGENTS.md` or `CLAUDE.md`, use the four-phase workflow ([Lesson 3](/docs/methodology/lesson-3-high-level-methodology)) to let agents bootstrap their own context. **Research phase:** Use ChunkHound's `code_research()` tool to understand your project's architecture, patterns, and conventions—query for architecture, coding styles, module responsibilities, and testing conventions, etc to build a comprehensive architectural understanding. Use ArguSeek's `research_iteratively()` and `fetch_url()` to retrieve framework documentation, best practices, and security guidelines relevant to your tech stack. **Plan phase:** The agent synthesizes codebase insights (from ChunkHound) and domain knowledge (from ArguSeek) into a structured context file plan. **Execute phase:** Generate the context file using prompt optimization techniques specific to your model. **Validate phase:** Test the generated context with a typical task, iterate based on gaps.

**Concrete example prompt:**

```
Generate AGENTS.md for this project.
Use the code research tool to to learn the project architecture, tech stack,
how auth works, testing conventions, coding style, and deployment process.
Use ArguSeek to fetch current best practices for the tech stack used and the
latest security guidelines.

Create a concise file (≤500 lines) with sections:
- Tech Stack
- Development Commands (modified for non-interactive execution)
- Architecture (high-level structure)
- Coding Conventions and Style
- Critical Constraints
- Common Pitfalls (if found).

Do NOT duplicate information already in README or code comments—instead, focus
exclusively on AI-specific operations: environment variables, non-obvious
dependencies, and commands requiring modification for agents.
```

This prompt demonstrates grounding ([Lesson 5](/docs/methodology/lesson-5-grounding)): ChunkHound provides codebase-specific context, ArguSeek provides current ecosystem knowledge, and structured Chain-of-Thought ensures the agent follows a methodical path. The result: production-ready context files generated in one iteration, not manually curated over weeks. Add tribal knowledge manually afterward—production incidents, team conventions, non-obvious gotchas that only humans know.

---

**Next:** [Lesson 7: Planning & Execution](./lesson-7-planning-execution.md)
