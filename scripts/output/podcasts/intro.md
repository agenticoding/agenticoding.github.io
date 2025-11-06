---
source: intro.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-05T11:46:27.245Z
model: claude-haiku-4.5
tokenCount: 1192
---

Alex: Welcome to the AI Coding Course. I'm Alex, and this is Sam. We're going to spend the next few modules walking through how to actually operate AI coding agents in production. Not theory—practice.

Sam: So this is operator training, not AI 101?

Alex: Exactly. By 2025, AI coding assistants are already standard practice in most shops. Companies ship features faster, engineers are 10x their output. The technology works. But the frustration wall comes fast—usually within weeks.

Sam: Where does that frustration come from, if the tools are working?

Alex: The operating model. Most developers treat these agents like junior developers. You wait for them to understand, you fix their code line-by-line, you fight context limits. That's the wrong mental model entirely. Think of AI agents as CNC machines for code, not teammates. You don't manage a CNC machine—you learn to operate it with precision.

Sam: So we're not trying to make the agent "smarter" or more collaborative. We're learning how to task it effectively.

Alex: Precisely. And that changes everything about how you work. Instead of back-and-forth refinement, you plan deliberately, break work into agent-appropriate units, ground your context, execute with precision, then validate rigorously. It's a systematic approach—plan, execute, validate.

Sam: That sounds like it requires a different mindset than treating it like a colleague.

Alex: Completely different. And that's actually why this course exists. We assume you've already tried AI coding assistants. You've hit the frustration wall. You want to move faster without sacrificing code quality. That's the audience.

Sam: What's not in scope here?

Alex: We're not covering AI theory. We'll explain enough internals to operate effectively, but we're not going deep on transformers or token optimization. We're also not selling you prompt templates—copying templates doesn't generalize. We're teaching principles that adapt to your codebase, your architecture, your constraints.

Sam: And it's not a replacement for knowing your craft.

Alex: Right. You need to understand architecture, design patterns, system design. If you don't have production experience, that's the prerequisite. This course assumes you can engineer software. We're teaching you how to orchestrate agents that execute it autonomously.

Sam: So who's actually sitting through this?

Alex: Anyone with 3+ years professional experience who wants to actually get the value out of these tools. If you've already tried agents and hit the ceiling, this is for you. If you need to onboard unfamiliar codebases faster, debug production issues, refactor complex features reliably—this changes how you operate.

Sam: And the practical outcome? What can someone actually do after this?

Alex: You'll onboard to unfamiliar codebases 5-10x faster using agentic research. You'll refactor complex features reliably with test-driven validation. Debug production issues by delegating log and database analysis to agents. Review code with AI assistance while maintaining critical judgment. Plan and execute features with parallel sub-agent delegation.

Sam: That's significant. But I imagine the real skill is knowing when to use agents and when to just write code yourself.

Alex: That's exactly it. That's what separates effective operators from frustrated ones. The judgment of when to delegate and when to stay hands-on.

Sam: So how's this structured?

Alex: Three modules. Module One: Understanding the Tools—mental models and architecture. Module Two: Methodology—prompting, grounding, workflow design. Module Three: Practical Techniques—how to actually onboard, plan, test, review, debug with agents. Each builds on the previous.

Sam: And exercises are mandatory, I assume.

Alex: Non-negotiable. Reading alone won't build operating skills. You need to work through the exercises on real codebases, not the examples we provide. That's where the pattern recognition actually develops.

Sam: Before we get started—I noticed something meta about this course. It was developed using AI.

Alex: Yes. The entire curriculum—structure, progression, code examples, documentation—was built using the same techniques you're about to learn. Every module was planned, researched, drafted, and refined through systematic prompting and agentic research. The podcast versions were generated using Claude Code and Gemini, including the voices you're hearing.

Sam: That's actually the perfect validation for what you're teaching.

Alex: It is. If these techniques can produce production-grade training material about their own application, they're robust enough for your codebase. This isn't marketing—it's evidence.

Sam: Ready to start?

Alex: Ready. Let's begin with Understanding the Tools.
