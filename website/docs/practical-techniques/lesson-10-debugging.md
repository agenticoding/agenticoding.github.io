---
sidebar_position: 5
sidebar_label: 'Lesson 10: Debugging'
title: 'Lesson 10: Debugging with AI Agents'
---

import EvidenceBasedDebug from '@site/shared-prompts/\_evidence-based-debug.mdx';

Debugging with AI agents isn't about describing symptoms and hoping for solutions. It's about requiring evidence at every step. The core principle: **never accept a fix without reproducible proof it works**.

## Always Require Evidence

The fundamental shift in debugging with AI is moving from "what do you think is wrong?" to "prove the bug exists, then prove your fix works." AI agents excel at pattern recognition and systematic investigation when given concrete data, but fail spectacularly when forced to speculate.

**Anti-pattern:** Describing a bug and asking the agent to fix it blindly.

**Production pattern:** Provide reproduction steps, give the agent access to diagnostic tools, and require before/after evidence.

<EvidenceBasedDebug />

## Root Cause Analysis: Understanding Before Fixing

Before diving into logs or reproduction, start with **root cause analysis (RCA)**—the systematic process of identifying fundamental causes rather than treating symptoms. Have the agent explain the architecture and execution flow. Use conversational analysis to identify mismatches between your mental model and actual system behavior. Ask the agent to trace request paths, explain data flow, and identify potential failure points based on code structure.

This isn't about having the agent read every line of code. Use semantic code search and research tools to find relevant components, then focus the conversation on critical paths. Apply the **[5 Whys technique](https://en.wikipedia.org/wiki/Five_whys)**: don't stop at the first answer. For example: "Trace the authentication flow from API request to database query. Where could a race condition occur? _Why_ would that race condition happen? _Why_ isn't it handled?" The agent's explanation often reveals edge cases or assumptions you missed—and repeated "why" questions expose the root cause rather than surface symptoms.

## Log Analysis: AI's Superpower

AI agents excel with the messy logs humans struggle with. Multi-line stack traces scattered across thousands of entries? Inconsistent formats from different services? Raw debug output without structured fields? That's where AI has the biggest advantage—processing chaos humans can't parse manually.

What takes senior engineers days of manual correlation happens in minutes. AI spots patterns across log formats: cascading errors in microservices with different logging styles, timing patterns indicating race conditions buried in verbose output, specific user cohorts experiencing failures across fragmented logs. The messier the logs, the more AI's pattern recognition outpaces human capability.

Give agents access however works: paste grep output, pipe script output, upload raw log files, direct CLI access to log aggregators. AI doesn't need JSON with correlation IDs to be effective—it parses whatever you have. That said, structured logs (consistent timestamps, request IDs, JSON formatting) are good engineering practice and make **both** human and AI analysis easier. But don't wait for perfect logging infrastructure before leveraging AI—its strength is working with what you already have.

When you do control logging, add targeted diagnostic statements preemptively when investigating bugs. Fifteen minutes writing specific log output beats hours of speculation. The agent can guide what to log based on its hypothesis—then analyze the new output immediately.

This insight transforms the debugging economics: AI makes it trivial to add diagnostic logs at dozens of strategic points—far more volume than humans would ever instrument manually—because the agent can generate and place them in minutes. Once the bug is verified fixed, the same agent systematically removes all temporary diagnostic statements, restoring code hygiene and baseline logging practices. What would be prohibitively tedious instrumentation for humans (add logs, analyze, remove logs) becomes a routine part of AI-assisted investigation, shifting debugging from "minimal instrumentation" to "evidence-rich exploration."

## Reproduction Scripts: Code is Cheap

When code inspection and log analysis aren't sufficient—when you need bulletproof evidence or must reproduce complex state/timing conditions—reproduction scripts become invaluable. This is where AI agents' massive code generation capabilities shine: environments that take humans hours to set up (K8s, Docker configs, database snapshots, mock services, state initialization) take AI minutes to generate.

Reproduction scripts eliminate ambiguity and create verifiable test cases. They capture full context: database state, external API responses, configuration, and user inputs. The agent generates comprehensive reproduction environments trivially, turning what would be tedious manual work into a simple prompt. Ask the agent to simulate the exact conditions where the bug occurs, and it will produce the scaffolding on demand.

For complex systems, use Docker to create isolated reproduction environments. Snapshot production database state, configure services with production-like settings, and write a script that triggers the bug reliably. Once you have reliable reproduction, the agent can iterate on fixes and verify each attempt.

## Closing the Loop: Place Agents Inside Failing Environments

With good grounding, agents can always explore your codebase and research online issues—that's what [Lesson 5](/docs/methodology/lesson-5-grounding) teaches. **But closing the loop means the agent can test its fixes and verify its reasoning actually works.** Without environment access, the agent proposes solutions it can't validate. With closed-loop access, it applies fixes, re-runs reproduction, and proves they work—or iterates on new hypotheses when they don't.

The difference: An open-loop agent researches your code and online issues, then reports: "The bug is likely missing RS256 signature verification at jwt.ts:67—try adding algorithm validation." A closed-loop agent does the same research, then **applies that fix, re-runs the failing request, observes it now returns 401 correctly, and reports: "Fixed and verified—RS256 validation added at jwt.ts:67, reproduction now passes."**

### The Closed-Loop Debugging Workflow

**1. BUILD** - Create a reproducible environment (Docker, scripts, database snapshots) that reliably triggers the bug

**2. REPRODUCE** - Verify the bug manifests consistently with concrete evidence (logs, status codes, error output)

**3. PLACE** - Give the agent tool access WITHIN the environment—not just code, but runtime execution capabilities

:::tip CLI Agents for Closed-Loop Debugging
This is where CLI agents (Claude Code, Codex, Copilot CLI) shine over IDE assistants. CLI agents can run **anywhere you have shell access**: inside Docker containers, on remote servers, in CI/CD pipelines, on problematic production instances. IDE agents are tied to your local development machine.
:::

**4. INVESTIGATE** - Agent leverages grounding techniques to form hypotheses by correlating:

- **Runtime behavior**: Execute diagnostic commands, inspect responses, analyze logs
- **Codebase**: Use ChunkHound's code research for comprehensive investigation with architectural context and cross-module relationships. For smaller codebases, [agentic search](/docs/methodology/lesson-5-grounding#the-discovery-problem-agentic-search) (Grep, Read) works well. See [Lesson 5](/docs/methodology/lesson-5-grounding#code-grounding-choosing-tools-by-scale) for scale guidance.
- **Known issues**: Research error patterns, CVEs, and similar bugs using tools like ArguSeek

**5. VERIFY** - Agent applies the fix, re-runs reproduction, and confirms the bug is resolved—or forms a new hypothesis and iterates

This workflow transforms debugging from "research and guess" to "research, fix, test, and prove"—a closed feedback loop where the environment validates or refutes the agent's reasoning.

## Remote Diagnosis: Scripts Over Access

When you can't reproduce bugs locally or access the failing environment—customer deployments, edge infrastructure, locked-down production—you face limited information and no iteration cycle. This is where AI agents' **probabilistic reasoning** becomes a feature, not a limitation. Combined with their code generation capabilities, agents turn remote diagnosis from "send me logs and wait" into an active investigation workflow.

The workflow follows the research-first pattern from [Lesson 5](/docs/methodology/lesson-5-grounding): ground yourself in the codebase (understand the architecture around the failing component using code research) and in known issues (search for similar problems in the ecosystem). With this context, the agent generates ranked hypotheses based on evidence—not generic patterns. Then it produces targeted diagnostic scripts that collect evidence for each hypothesis: configuration states, version mismatches, timing data, whatever's needed to validate or refute each theory.

The key is trading developer time for compute time. Writing a comprehensive diagnostic script takes humans days but takes agents 30 minutes. More importantly, agents generate thorough diagnostics trivially—scripts that check dozens of potential issues, cross-reference configuration, and output structured data. Send the script to the customer, load the output into the agent's context, and it correlates evidence with hypotheses to identify the root cause. What would be tedious manual work becomes a simple prompt.

## Key Takeaways

- **Evidence over speculation** - Never accept fixes without reproducible proof they work
- **Code inspection first** - Understand architecture and execution flow before diving into fixes
- **Log analysis is AI's superpower** - Process thousands of log lines to spot patterns, correlations, and timing issues humans miss
- **Code is cheap, write it liberally** - Reproduction scripts, diagnostic tools, and verification workflows are trivial for AI to generate
- **Closed-loop debugging** - Place agents inside failing environments with the BUILD → REPRODUCE → PLACE → INVESTIGATE → VERIFY workflow
- **CLI agents access any environment** - Unlike IDE assistants, CLI agents work in Docker, remote servers, CI/CD, and production instances
- **Remote diagnosis requires scripts** - Generate comprehensive diagnostic scripts when direct access isn't possible

Debugging with AI agents is about **building diagnostic environments** where evidence is abundant and verification is systematic. The agent is your tireless investigator—give it the tools and demand proof.
