---
source: methodology/lesson-3-high-level-methodology.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-12-09T08:56:15.282Z
model: claude-opus-4.5
tokenCount: 2521
---

Alex: Today we're tackling what I think is the most psychologically difficult part of working with AI agents. It's not the tools. It's not the prompts. It's letting go.

Sam: Letting go of what exactly?

Alex: Your identity as a craftsman. Think about it—your entire career, your value has been in the details. Writing clean code, spotting subtle bugs, understanding every line you ship. You've built your reputation on that deep ownership.

Sam: And AI agents produce code at a scale where that's impossible. You can't mentally own 2,000 lines of generated implementation the way you owned 200 lines you wrote yourself.

Alex: Exactly. And if you try, you either burn out or become the bottleneck that negates every productivity gain the agent provides. The shift required is psychological as much as methodological. You're moving from craftsman to operator, from implementer to orchestrator.

Sam: So where does your value go?

Alex: Up the stack. From syntax to structure. From loops to logic. From implementation details to architectural decisions. You stop validating correctness by reading every line and start validating by thinking systematically. Does this fit the architecture? Does it follow our patterns? Does the behavior match my mental model?

Sam: That's a significant reframe. Instead of "is this code correct" it's "does this system work correctly."

Alex: Right. And your focus shifts to two higher-level concerns: the context you provide—patterns, constraints, examples that guide the agent—and the prompts you craft—architectural requirements and integration points. Get these right, and you can confidently ship thousands of lines. Get them wrong, and you waste time fixing and second-guessing.

Sam: So what's the actual workflow that makes this practical?

Alex: Four phases: Research, Plan, Execute, Validate. Every significant agent interaction should follow this pattern. Skipping any phase dramatically increases your failure rate.

Sam: Let's walk through them. Research first?

Alex: Research is grounding. You wouldn't start coding in a new codebase without learning the architecture and conventions. Your agent needs the same context. Without it, agents hallucinate patterns, invent inconsistent APIs, miss your existing implementations.

Sam: What does grounding look like practically?

Alex: Two dimensions. For code context, you need semantic code search. Tools like ChunkHound perform what I call code deep research—answering architectural questions like "How is authentication handled?" or "What's the error handling pattern?" Not just keyword matching, but retrieving relevant patterns and implementations.

Sam: And for domain knowledge?

Alex: ArguSeek or similar tools that pull information from the web directly into your context. Latest API docs, framework best practices, algorithm papers, GitHub issues. No manual tab-switching or copy-pasting. Ground your agent in both your codebase and domain knowledge before planning changes.

Sam: Makes sense. What about the planning phase?

Alex: Planning isn't one approach—it's a strategic choice. There are two modes: exploration planning and exact planning.

Sam: When do you use which?

Alex: Exploration planning when the solution space is unclear. You frame the problem space and steer the agent to research alternatives, iterate through reasoning-action cycles. You're discovering the approach together. Higher cost, more time, but you discover better solutions and catch architectural issues early.

Sam: And exact planning?

Alex: When you know the solution and can articulate it precisely. Be directive. Define the task with specificity, specify integration points, provide explicit constraints, list edge cases, define acceptance criteria. The agent executes along a predetermined path. Faster and cheaper, but requires upfront clarity—if your plan is wrong, the generated code will be wrong.

Sam: How do you build the mental model you keep mentioning?

Alex: As you plan, you're understanding relationships, not memorizing code. How authentication flows through middleware. Where data validation happens versus business logic. How errors propagate. Where performance bottlenecks might appear. What security boundaries exist.

Sam: And that mental model is what lets you validate quickly later.

Alex: Exactly. When the agent completes, you don't read every line. You check: does this fit my mental model of how this system works? If yes, probably correct. If no, either your model needs updating or the code needs regenerating.

Sam: What about execution? You mentioned two modes there too.

Alex: Supervised and autonomous. Supervised mode—you actively monitor, watch each action, steer when it drifts, intervene on mistakes. Maximum control, but your throughput tanks because you're blocked while the agent works.

Sam: When is supervised mode appropriate?

Alex: When you're learning how agents behave, working on security-sensitive code, or tackling complex problems where you need to build your mental model as the agent explores. It's your training ground for developing trust.

Sam: And autonomous mode?

Alex: You give the agent a well-defined task from your plan, let it run, check results when done. You're not watching. You're doing other things—different project, meeting, cooking dinner. This is where the real productivity transformation happens.

Sam: Walk me through why.

Alex: It's not that the agent finishes faster than you would manually. Sometimes it doesn't. The point is parallel work and continuous output. You can have three agents running simultaneously on different projects. Maintain 8-hour stretches of productive output while spending 2 hours at your keyboard.

Sam: So even if hand-coding takes 20 minutes and the agent takes 30...

Alex: Autonomous mode wins if you're cooking dinner instead of being blocked. You're genuinely multitasking in software development for the first time in history. But—and this is critical—autonomous mode depends entirely on excellent grounding and planning. Skip those phases, the agent drifts and produces garbage. Do them well, you can trust execution without supervision.

Sam: That reframes productivity entirely. It's not speed per task, it's parallel throughput.

Alex: A senior engineer running three autonomous agents in parallel while attending meetings ships more code than the same engineer babysitting one agent through a single task. That's the actual game changer.

Sam: What about validation? The agent completed—now what?

Alex: Here's the reality: LLMs are probabilistic machines that almost never produce 100% perfect output on first pass. This isn't failure—it's expected behavior.

Sam: So validation isn't about verifying perfection.

Alex: It's about accurately identifying what's wrong or missing, then making a critical decision: iterate with fixes or regenerate from scratch?

Sam: How do you decide?

Alex: Iterate when the output is aligned but has gaps—missing edge cases, some tech debt, incomplete error handling. The foundation is right, it needs refinement. Regenerate when something fundamental is wrong—architecture doesn't match your mental model, agent misunderstood requirements, approach itself is flawed.

Sam: Don't patch fundamentally broken code.

Alex: Fix the context and regenerate. Code generation is cheap. Don't get attached to output. The key principle: it's usually easier to fix your input—the prompt, examples, constraints—than to fix the generated code. Debug your input, not the output.

Sam: What validation techniques actually work?

Alex: Nothing beats running your implementation. Be the user. Test the happy path, try to break it, check edge cases. Five minutes of manual testing reveals more than an hour of code review.

Sam: And the agent itself?

Alex: Use it to review its own work. Agents are better at finding issues than generating perfect code first try. Have it create tests as guardrails. Run your build, linters, existing tests. If automated checks fail, clear signal for iteration. If they pass, manually verify behavior matches your plan and mental model.

Sam: This feels like it closes a loop back to the mental model.

Alex: The workflow is iterative, not linear. Validation often reveals gaps in research or flaws in planning. The value isn't executing each phase perfectly first time—it's having a systematic framework that catches issues before they compound.

Sam: And you're validating against your mental model, not by reading every line.

Alex: Does the architecture match your plan? Do patterns align with your grounding? Does behavior satisfy requirements? If yes, ship it. If no, identify whether the problem is context—regenerate—or refinement—iterate.

Sam: One thing you mentioned at the start that I want to come back to: you said this doesn't mean you stop caring about quality.

Alex: It means you ensure quality differently. And here's something counterintuitive: properly prompted AI-generated code is often easier to read than hand-written code. LLMs follow patterns with mechanical precision across thousands of lines. Provide quality patterns and clear constraints, they replicate them perfectly.

Sam: So you're not sacrificing quality by delegating.

Alex: You're achieving structural consistency at a scale individual craftsmanship can't match. Your job shifts from ensuring every implementation detail is correct to ensuring the patterns themselves are correct.

Sam: But ultimately, you still own the results.

Alex: Always. Machines can't be held accountable—they execute instructions. Every line of agent-generated code ships under your name. That responsibility doesn't change regardless of which tool writes the implementation.

Sam: The workflow gives you a framework. But execution happens through communication—how you actually talk to the agent.

Alex: Exactly. Every phase—research queries, planning prompts, execution instructions, validation reviews—depends on how precisely you communicate. The workflow tells you what to do. Prompting tells you how to do it effectively. That's where we're going next.
