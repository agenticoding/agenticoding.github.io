---
source: methodology/lesson-3-high-level-methodology.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-05T12:47:08.195Z
model: claude-haiku-4.5
tokenCount: 2184
---

Alex: So we need to talk about the psychological shift that actually matters when working with AI agents. And it's honestly harder than learning the tools.

Sam: Harder than learning the tools? What do you mean?

Alex: Your entire career, you've built your identity as an engineer around craftsmanship. You write clean code, you spot subtle bugs, you own every line you ship. That's what good engineering looks like. And then AI agents force you to operate completely differently—you're generating thousands of lines you'll never personally read. That's a fundamental role shift, and it's legitimately disorienting.

Sam: Right, so you're saying I can't validate everything the way I used to?

Alex: Not even close. If you try to read and mentally own every line an agent produces, you'll burn out or become the bottleneck that completely negates the productivity gain. The shift is from craftsman to operator. You're moving from writing code to directing systems, from implementation details to architectural decisions.

Sam: That sounds like you're saying I should just... not care about quality?

Alex: Opposite. You still ensure quality—you just validate it differently. Instead of reading every line, you think systemically. Does this fit our architecture? Does it follow our patterns? Does it handle the risks I identified? Does the behavior match my mental model? You're spot-checking where your mental model says "this is risky" or "this is too complex," not reviewing everything. And here's something counterintuitive: properly prompted AI-generated code is often easier to read than hand-written code. LLMs follow patterns with mechanical precision across thousands of lines. When you provide quality patterns and clear constraints, they replicate them perfectly.

Sam: So the output quality is actually consistent?

Alex: Structurally, yes. The agent doesn't get tired or sloppy. It follows the patterns you teach it flawlessly. Your job shifts from ensuring every implementation detail is correct to ensuring the patterns themselves are correct. Two things become critical: the context you provide—the patterns, constraints, examples that guide the agent—and the prompts you craft. Get those right, and you can confidently ship thousands of lines of generated code.

Sam: That's a meaningful distinction. So what's the actual workflow for this?

Alex: Research, Plan, Execute, Validate. Every significant agent interaction should follow that pattern. You skip any phase and your failure rate climbs dramatically.

Sam: Let's walk through them.

Alex: Phase one is Research. You wouldn't start coding in a new codebase without learning the architecture and conventions first. Your agent needs the same grounding. Without it, agents hallucinate patterns, invent inconsistent APIs, miss your existing implementations. For code context, you use semantic search—tools like ChunkHound that answer architectural questions like "How is authentication handled?" instead of just keyword matching. For domain knowledge, you use tools like ArguSeek to pull information from Google, API docs, research papers, GitHub issues. You're building context before you make decisions.

Sam: So it's like researching before you code, but systematized?

Alex: Exactly. Phase two is Planning. And planning depends on what you know. If the solution is unclear, you do exploration planning—you frame the problem, have the agent research your patterns and domain knowledge, and discover the approach together through reasoning cycles. Higher cost upfront, but you catch architectural issues early. If you already know the solution, you do exact planning—be directive, define the task precisely, specify integration points and patterns, list edge cases, define acceptance criteria. The agent executes along a predetermined path. Faster and cheaper, but requires your architectural thinking is already solid.

Sam: What happens if you get the architecture wrong in exact planning?

Alex: You spend time fixing fundamentally broken code. That's why the rule is: when you're planning, you're also refining your mental model of the system. You're not memorizing code—you're understanding relationships. How does authentication flow? Where does data validation happen? How do errors propagate to the client? What are the security boundaries? That mental model is what lets you validate generated code quickly. When the agent finishes, you don't read every line. You check: does this fit my mental model? If yes, probably correct. If no, either your model is wrong or the code is wrong.

Sam: Okay. Phase three?

Alex: Execution. This is where most engineers get it wrong. There are two modes: supervised and autonomous. Most start with supervised—you actively watch the agent work, review outputs, steer it when it drifts. Maximum control. Terrible throughput. You're blocked the entire time. You can't context-switch, you can't step away. You're burning your most valuable resource—attention—on implementation details. Use this when learning how agents behave, or working on security-sensitive code, or tackling problems where you need to build your mental model as you explore. It's your training ground.

Sam: And autonomous?

Alex: You give the agent a well-defined task, let it run, check results when it's done. You're not watching. You're working on a different project, attending a meeting, cooking dinner, running errands. And here's where people get the idea wrong: the productivity gain isn't that the agent finishes individual tasks faster. The real win is working on three projects simultaneously while living your life. You can have multiple agents running in parallel. You can maintain eight-hour stretches of productive output while only spending two hours at your keyboard. Even if an agent takes thirty minutes on something you could hand-code in twenty, you win if it means you're not blocked for those thirty minutes.

Sam: That's completely different from how I think about productivity.

Alex: Right? Most engineers think "this tool makes my tasks faster." That's thinking in the wrong frame. The frame is throughput—parallel output, continuous code generation, you staying unblocked. That's where you actually become more productive than hand-coding.

Sam: But that requires really solid grounding and planning?

Alex: Completely. If you skip those phases, the agent drifts, hallucinate, produces garbage. If you do them well, you can trust it to execute correctly. Your goal is maximizing time in autonomous mode.

Sam: What about phase four?

Alex: Validation. Here's the reality: LLMs almost never produce 100% perfect output on first pass. That's not failure—that's expected. Your job isn't perfection verification, it's identifying what's wrong, then deciding: iterate with fixes or regenerate from scratch?

Sam: How do you make that decision?

Alex: General rule: iterate when the output is aligned with expectations but has gaps—missing edge cases, some tech debt, incomplete error handling. The foundation is right; it needs refinement. Regenerate when something fundamental is wrong—the architecture doesn't match your mental model, the agent misunderstood requirements, the approach itself is flawed. Don't patch fundamentally broken code. Fix the context and regenerate. Code generation is cheap. Don't get attached to the output.

Sam: What does validation actually look like?

Alex: Run your code. Be the user. Test the happy path, try to break it, check edge cases. Does it handle errors? Is performance acceptable? Five minutes of manual testing reveals more than an hour of code review. Also—have the agent review its own work. It's better at finding issues in code than generating perfect code on first try. And obviously run your build, tests, linters. If these pass and your manual testing matches your plan, ship it.

Sam: So it's not "the agent generated it, so I need to verify everything"?

Alex: You're validating against your mental model. Does the architecture match your plan? Do patterns align with your grounding? Does behavior satisfy your requirements? You're not reading every line. You're checking the system-level decisions. This workflow is iterative, too. Validation often reveals gaps in research or flaws in your plan. That's expected. The value isn't executing each phase perfectly the first time. It's having a systematic framework that catches issues before they compound.

Sam: And all of this depends on how you communicate with the agent?

Alex: Everything. The workflow tells you what to do. Communication tells you how to do it effectively. That's why the next lesson focuses entirely on prompting—the specific techniques for getting reliable results through the phases we just outlined.
