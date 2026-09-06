---
sidebar_label: 'Agent-Friendly Code'
title: 'Writing Agent-Friendly Code'
---

import CompoundQualityVisualization from '@site/src/components/VisualElements/CompoundQualityVisualization';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

Agents amplify patterns—good or bad. Clean code generates more clean code. Scattered logic generates more scattered logic. Research confirms this: AI-generated code contains **8x more duplicated blocks** than human-written code[^1]. Agents don't create duplication—they amplify existing patterns they observe during code research.

**Critical caveat:** Even with perfect patterns, agents are stochastic systems—LLM token generation is probabilistic, not deterministic. Confabulations, hallucinations, and subtle errors occur randomly, regardless of pattern quality. High entropy states (complex refactors, cross-cutting changes) increase error probability. Your job isn't to prevent all errors—that's impossible with probabilistic systems—it's to **actively reject errors during review** to prevent them from entering the compounding cycle.

Every piece of code you accept today becomes pattern context for tomorrow's agents. This creates exponential quality curves—upward or downward. You control the direction.

## The Compounding Mechanism

During code research, agents grep for patterns, read implementations, and load examples into context. The code they find becomes the pattern context for generation.

<DiagramFrame kicker="Agent-friendly code" title="Quality compounds through the codebase" size="wide">

  <CompoundQualityVisualization />

</DiagramFrame>

### Two Sources of Quality Drift

Your code quality degrades in two fundamentally different ways when working with AI:

**1. The Copy Machine Effect (Predictable Amplification)**

Agents find existing code and use it as examples. If your codebase has duplication, the agent learns "this is how we do things here" and creates more duplication. If tests are missing in similar files, the agent generates code without tests. If error handling is inconsistent, the agent produces inconsistent error handling.

This is predictable: show the agent messy patterns, get messy code back. The agent isn't being creative—it's pattern-matching what already exists.

**2. The Dice Roll (Random AI Errors)**

LLMs are probabilistic systems—they generate code through weighted randomness, not logical reasoning. Even when your codebase is pristine, the AI randomly produces errors:

- **Making things up:** References a `getUserProfile()` function that doesn't exist, imports from files that aren't there
- **Complexity breaks down:** Simple tasks work fine, but multi-file refactors or complex state management increase the chance of mistakes
- **Model quirks:** Different model versions, context limits, and attention patterns create unpredictable variance

You can't eliminate these random errors with better prompts or cleaner patterns—they're inherent to how LLMs work.

**Why This Matters:**

Both problems feed the same exponential curve. When you accept a random AI error during code review, it becomes a pattern that gets copied. One hallucinated API call in iteration 1 becomes the template for 5 similar hallucinations by iteration 3.

**Your Critical Role:** Code review is where you break the cycle. Reject bad patterns before they multiply. Reject random errors before they become patterns. Every acceptance decision affects every future generation.

## Key Takeaways

- **Agents amplify patterns AND produce stochastic errors** — Good patterns compound into better code. Bad patterns compound into technical debt. Even with perfect patterns, LLMs produce probabilistic errors that compound if accepted. Every accepted PR becomes pattern context for future agents.
- **You are the quality circuit breaker** — Code review prevents negative compounding. Accepting bad patterns lets them enter pattern context for future agents. Rejecting them breaks the negative feedback loop.

[^1]: GitClear (2025) - Analysis of 211 million lines of code (2020-2024) showing 8-fold increase in duplicated code blocks in AI-generated code. Source: [LeadDev: How AI-generated code accelerates technical debt](https://leaddev.com/technical-direction/how-ai-generated-code-accelerates-technical-debt)

---

**Next:** [Agent Code Constraints](./agent-code-constraints.md)
