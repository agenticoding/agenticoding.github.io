---
source: intro.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-04T07:17:19.414Z
model: claude-haiku-4.5
tokenCount: 1799
---

Alex: Welcome to the AI Coding Course. I'm Alex, and I'll be walking you through how to actually operate AI agents in production. This isn't theory—it's practical training for engineers who've already tried these tools and hit the inevitable frustration wall.

Sam: I'm Sam. I've been building systems for about eight years now, and I'll be asking the questions I assume you're thinking. So let's start with the obvious one: why do we need a course for this? The tools work. I've used them. But something always feels... off.

Alex: Exactly. And here's the thing that makes this worth acknowledging up front—this course was built using the exact techniques we're about to teach you. The content structure, the lessons, even this podcast script... all created with AI tools working alongside the process. Which is both ironic and validating.

Sam: So we're teaching you how to operate AI by showing you AI in operation. I appreciate the transparency, but it also feels like we need to acknowledge the weird loop here before we move on.

Alex: Agreed. The recursive nature is real—using AI to teach about AI is either terrifying or obvious, depending on how you look at it. But what matters is this: if these techniques can produce production-grade training material on their own application, they're robust enough for your codebase. That's the validation.

Sam: Fair point. So beyond the meta-commentary, what's actually broken about how most engineers use these tools right now?

Alex: The operating model is fundamentally wrong. Most people treat AI agents like junior developers. They send a task, wait for understanding, review the output line-by-line, fight context limits, get frustrated. That's not how this works.

Think of it differently: AI agents aren't teammates. They're CNC machines for code. You don't expect a CNC machine to understand your intent or learn from experience. You give it precise specifications, run the operation, validate the output. That's it.

Sam: That's a useful reframing. But there's a skill gap there, right? Most engineers have been trained to collaborate with humans. You're saying we need to completely flip our mental model.

Alex: Completely. And that's what this course is really about. We're teaching you how to operate, not how to collaborate. There's a systematic approach—three phases that work consistently in production: Plan, Execute, Validate.

Sam: Break that down for me. What does planning actually look like when your "teammate" is a machine?

Alex: Planning is about decomposition and grounding. You break work into agent-appropriate tasks, research the architecture of what you're working with, understand the constraints and context. You're not asking the agent to figure this out. You're doing it.

Then in execution, you craft precise prompts based on that groundwork. You delegate to specialized sub-agents. You run operations in parallel where possible. You're orchestrating, not waiting.

Finally, validation is where most teams stumble. Tests become guardrails. You review generated code critically—not assuming it's correct, but looking for evidence. That's the discipline that separates effective operators from frustrated ones.

Sam: Okay, so this is fundamentally about work discipline. The tools are capable, but you have to approach them systematically.

Alex: Exactly. And here's what that discipline enables: engineers who've learned this approach consistently report 5-10x improvements in specific areas. Onboarding to unfamiliar codebases, refactoring complex features, debugging production issues, reviewing code systematically, planning and executing features in parallel. These aren't theoretical improvements.

But there's a gate: you need to know when to use agents and when to write code yourself. That judgment is what separates people who benefit from this versus people who get frustrated.

Sam: I'm curious about the audience you're targeting. This isn't for everyone, is it?

Alex: No. We're assuming 3+ years of professional engineering experience. You know architecture, design patterns, system design fundamentals. You've tried AI tools and hit walls. You want to move faster without sacrificing code quality. You care about production-readiness.

If you're new to engineering, this course assumes you already know how to engineer software. We're teaching orchestration, not fundamentals.

Sam: And the practical element—I'm assuming we're not just lecturing at you?

Alex: Hands-on exercises are mandatory. Reading alone doesn't build operating skills. You need to work through problems on real codebases, not examples. That's where the judgment develops.

Sam: So what will someone actually be able to do after finishing this?

Alex: Concrete outcomes. Onboarding to unfamiliar codebases 5-10x faster using systematic agentic research. Refactoring complex features reliably with test-driven validation. Debugging production issues by delegating analysis to agents while maintaining critical judgment. Reviewing code systematically with AI assistance. Planning and executing features with parallel sub-agent delegation.

The meta-outcome is knowing your boundaries. You'll know when to use agents, when to code yourself, and how to validate that you're making the right choice.

Sam: I think what you're describing is operating discipline combined with tool mastery. Most courses focus on the tool mastery part.

Alex: Exactly. And that's why most people plateau. You can learn prompting templates. But principles teach you to operate in novel contexts. That's the difference between training and education.

Sam: So what's the actual structure here?

Alex: Three modules, building sequentially. First, we cover the mental models and architecture—understanding the tools well enough to operate them effectively. Not deep theory, just what matters.

Second, we dive into methodology: how to plan work, how to ground agents in context, how to execute systematically, how to validate output.

Third, practical techniques. We work through real scenarios: onboarding to codebases, planning features, using tests as guardrails, reviewing code, debugging issues.

Sam: No theory for theory's sake, then.

Alex: None. And we're explicitly not covering AI theory, prompt template libraries, or beginner fundamentals. If you need those, we point you elsewhere. This is focused on one thing: making you a more effective operator.

Sam: One more practical question. What do you need to get started?

Alex: Three things, really. You need access to a CLI coding agent—Claude Code, Copilot, whatever you have available. You need 3+ years of production experience. And you need to unlearn the "AI as teammate" mental model and adopt "AI as tool" instead.

That third one is the hardest. Most of the frustration isn't technical. It's conceptual. Once you shift that frame, everything else becomes operational.

Sam: Alright. I think that gives people a clear sense of what they're walking into. Where do we actually start?

Alex: Next module: Understanding the Tools. We'll build the mental models that make everything else click. No hand-holding, but fundamentally clear. That's where the framework starts.

Sam: Let's go.
