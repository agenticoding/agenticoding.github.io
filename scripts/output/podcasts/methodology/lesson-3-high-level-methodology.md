---
source: methodology/lesson-3-high-level-methodology.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-04T07:17:42.544Z
model: claude-haiku-4.5
tokenCount: 2760
---

Alex: We're going to talk about the hardest part of working with AI agents. And it's not learning new tools or writing better prompts. It's letting go.

Sam: Letting go of what?

Alex: Control. For your entire career, your value has been in the details. You've built your reputation on clean code, spotting subtle bugs, understanding every line you ship. You've internalized that good engineers own their implementations completely. You take pride in craftsmanship.

Sam: And that doesn't work with agents?

Alex: It can't work. You can't read, verify, and mentally own 2,000 lines of generated code the way you owned 200 lines you wrote. If you try, you burn out or become the bottleneck that negates every productivity gain the agent provides.

Sam: So what changes?

Alex: The shift is psychological and methodological. You're moving from craftsman to operator. From implementer to orchestrator. Your value moves up the stack. You stop validating correctness by reading every line and start validating by thinking systematically. Does this fit the architecture? Does it follow our patterns? Does it handle the risks I identified? Does the behavior match my mental model?

Sam: I'm checking the architecture, not the implementation?

Alex: Exactly. And here's what's counterintuitive: properly prompted AI-generated code is often easier to read than hand-written code. LLMs follow patterns with mechanical precision across thousands of lines. When you provide quality patterns and clear constraints, they replicate them perfectly. You achieve structural consistency at a scale individual craftsmanship can't match.

Sam: But you're still responsible for every line that ships?

Alex: Completely. You own the results. Machines can't be held accountable - they execute instructions. Every line of agent-generated code ships under your name. That responsibility doesn't change. What changes is how you ensure correctness.

Sam: You mentioned two concerns that matter. Context and prompts?

Alex: Exactly. Your focus shifts to context - the patterns, constraints, and examples that guide the agent - and prompts - the architectural requirements and integration points you specify. Get these right, and you ship thousands of lines of generated code confidently. Get them wrong, you waste time fixing and second-guessing.

Sam: And there's a workflow that ties this together?

Alex: There is. Research, Plan, Execute, Validate. Every significant agent interaction follows this pattern. Each phase has a distinct purpose. Skipping any one dramatically increases failure rate.

Sam: Let's walk through it.

Alex: Phase One is Research, which we also call grounding. You wouldn't start coding in a new codebase without learning the architecture and patterns. The agent needs the same. You need semantic code search - understanding "How is authentication handled?" not just keyword matching. That gets you your existing patterns.

Sam: And for domain knowledge?

Alex: You need external research. APIs, frameworks, best practices, algorithms buried in research papers. You pull that in before planning. Two tools. ChunkHound for semantic code research. ArguSeek for domain knowledge. We'll cover both in detail later, but the principle is simple: ground the agent in both your codebase and domain knowledge before you plan.

Sam: So research is about feeding the agent context?

Alex: Context plus mental model building. You're understanding relationships. How authentication flows through middleware. Where data validation happens. How errors propagate. Where performance bottlenecks might appear. What security boundaries exist. This mental model is what lets you validate generated code quickly later.

Sam: Because you're comparing the output against your mental model, not reading every line?

Alex: Exactly. Once you have that model, validation becomes fast. Does this fit my mental model of how this system works? If yes, it's probably correct. If no, either your model is wrong or the code is.

Sam: Phase Two is Plan?

Alex: Planning is a strategic choice. Two modes, depending on whether you know the solution or need to discover it. Exploration Planning when the solution space is unclear. You frame the problem, research alternatives, iterate with the agent through reasoning cycles. You discover the approach together. Higher cost and time, but better solutions and deeper understanding.

Sam: And the other mode?

Alex: Exact Planning. You know the solution and can articulate it precisely. Be directive. Define the task with specificity, specify integration points and patterns, provide explicit constraints, list edge cases, define acceptance criteria. The agent executes along a predetermined path. Faster and more cost-effective, but requires upfront clarity. If your plan is wrong, the code will be wrong.

Sam: So there's a skill to knowing which mode to use?

Alex: Absolutely. Most teams start with Exploration Planning because they're uncertain. As you get better at architecture and planning, you spend more time in Exact Planning because you've already done the thinking. The productivity difference is significant.

Sam: Phase Three is Execute?

Alex: This is where most people misunderstand productivity. There are two modes: supervised and autonomous. Supervised, you watch the agent work in real time. You catch issues immediately. It gives you maximum control and precision. The cost is massive - your throughput tanks because you're blocked while the agent works.

Sam: You can't context-switch?

Alex: You can't do anything. You're babysitting. It's where you start, especially working on critical or complex code. You build trust and intuition. But it's not where the real productivity lives.

Sam: Autonomous mode?

Alex: You give the agent a well-defined task, let it run, and check results when done. You're not watching. You're working on a different project, in a meeting, cooking dinner. You might check occasionally if it's blocked, but mostly you're away.

Sam: That sounds risky without supervision.

Alex: It depends on grounding and planning. If you skip those phases, the agent drifts and produces garbage. If you do them well, you trust the output without supervision. And here's the thing most people miss: the real 10x productivity gain isn't per-task speed. It's working on multiple tasks simultaneously.

Sam: Parallel agents?

Alex: You have three agents running on different projects. You maintain 8-hour stretches of productive output while only spending 2 hours at the keyboard. You're living your life while code generates. Even if the agent takes longer than you could code it manually, you're not blocked. That's where you become genuinely more productive.

Sam: That requires a lot of trust in your system though.

Alex: Which is why grounding and planning aren't optional. You can't skip those phases and expect autonomous mode to work. But when you do them well, you can trust the agent to execute without supervision.

Sam: What about Phase Four?

Alex: Validation. The agent completed. Here's the reality: LLMs almost never produce 100% perfect output on first pass. That's not failure - it's expected behavior. Your job is identifying what's wrong and deciding: iterate with fixes or regenerate from scratch?

Sam: How do you make that decision?

Alex: It's part art, part science. Remember: code generation is cheap. Don't get attached to the output. General rule - iterate when the output is aligned with your expectations but has gaps. Missing edge cases, some tech debt, incomplete error handling. The foundation is right; it needs refinement.

Sam: And regenerate when?

Alex: Something fundamental is wrong. The architecture doesn't match your mental model. The agent misunderstood requirements. The approach itself is flawed. Don't patch fundamentally broken code. Fix your context and regenerate.

Sam: The context - the prompt, examples, constraints?

Alex: Exactly. It's usually easier to fix your context than to fix the generated code. Think of yourself as debugging your input, not the output. Run your code. Actually test it. Be the user. Test happy paths, try to break it, check edge cases. Does it handle errors? Is performance acceptable? Five minutes of manual testing reveals more than an hour of code review.

Sam: And use the agent for review?

Alex: The agent is better at finding issues in code than generating perfect code first pass. Have it review its own work. Create tests as guardrails. Run your build, tests, linters. If these pass, manually verify behavior matches your plan and mental model.

Sam: This workflow isn't linear though?

Alex: It's iterative. Validation reveals gaps in research or flaws in planning. That's expected. The value isn't executing each phase perfectly first time. It's having a systematic framework that catches issues before they compound.

Sam: And if validation fails?

Alex: You circle back. Maybe your mental model was incomplete. Research more. Maybe your plan had gaps. Refine it. Maybe your context was unclear. Regenerate with better grounding. It's a loop, not a line.

Alex: This workflow is strategic. But strategy means nothing without execution, and execution happens through communication. How you ground the agent, how you plan, how you execute - it all depends on precise communication. The workflow tells you what to do. Prompting tells you how to do it effectively.

Sam: So the operator mindset is accepting that you're not writing code?

Alex: You're orchestrating code generation. You're directing systems, not implementing features. Your focus is context, prompts, validation, and architectural decisions. And that's actually higher leverage. You ship more, understand the system better, and maintain architectural control at a scale that individual implementation never could.

Sam: And the psychological shift - letting go?

Alex: It's real. Your instinct is to read every line, verify every detail, own every implementation. Resist that instinct. Trust your grounding. Trust your planning. Trust your validation framework. Your mental model, not your eyes, is the verification system.

Sam: That's going to feel uncomfortable at first.

Alex: It will. But once you experience autonomous mode - checking in on an agent that's built out a complex feature while you were in meetings - it becomes obvious why you let go. The productivity isn't from the tool being smart. It's from you being in leverage.

Alex: Next lesson we get into the specifics of grounding - the tools and techniques for research, the exact patterns for gathering context, how to structure information so the agent can use it effectively.

Sam: And we'll understand why research is load-bearing for everything that comes after.

Alex: Exactly. Get research wrong and the best planning and execution can't save you. Get research right and everything downstream becomes straightforward.

Sam: I'm ready for the specifics.

Alex: Good. Because at scale, research becomes your most valuable activity. Not coding. Not debugging. Research.
