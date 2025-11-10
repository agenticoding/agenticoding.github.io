---
source: practical-techniques/lesson-9-reviewing-code.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-10T08:50:52.363Z
model: claude-haiku-4.5
tokenCount: 3594
---

Alex: Welcome back. We've talked about planning, execution, and tests. You've shipped features. Tests pass. Everything looks good. But there's a question you have to answer before you commit that code: is it actually correct?

Sam: That's the validation phase from the four-phase workflow we covered in Lesson 3, right? The quality gate before shipping.

Alex: Exactly. And here's the thing—code review catches something your tests won't. Tests verify that code does what you asked it to do. Code review catches what you *should* have asked but didn't. Subtle logic bugs. Architectural mismatches. Edge cases handled incorrectly. Patterns that don't quite fit your codebase.

Sam: But agents wrote the code. They can usually explain what they did and why.

Alex: That's the trap. An agent reviewing its own work in the same conversation will defend its decisions. It has context, momentum, attachment to what it built. What you need is fresh context. A completely separate agent analyzing the code without knowing the conversation where it was written.

Sam: So you're using the stateless nature of agents—which we learned about in Lessons 1 and 2—as a feature for review?

Alex: Precisely. The same statelessness that makes agents unpredictable when you need continuity becomes an advantage here. A fresh agent looks at the code cold, analyzes it objectively, without prior commitment to explain why choices were made.

Sam: That's a useful inversion. What does the actual review process look like?

Alex: There's a template. It integrates everything we covered in Lesson 4 on prompting. You start by establishing a persona for the reviewer—this is important because it shapes how carefully they analyze.

Sam: What kind of persona?

Alex: Something like "You are a senior architect doing code review before this code ships to production." That sets the bar. Then you give explicit constraints: be specific, cite line numbers, focus on substance not style.

Sam: So you're not just saying "review this," you're structuring the request with the same techniques from Lesson 4.

Alex: Right. You provide the code, you specify what you're reviewing for—correctness, architecture fit, edge cases—and you ask for structured output. No free-form rambling. Something like: Summary, Strengths, Issues by severity, and a Decision.

Sam: Issues by severity. Does the agent actually differentiate between major problems and nitpicking?

Alex: When you tell it explicitly to categorize by Critical, Major, and Minor, and you provide file:line references for each—yes. The specificity forces grounding. The agent can't say "this feels wrong." It has to point to actual code.

Sam: Okay, so you get your review. What happens next?

Alex: This is where operator judgment matters. You look at three things. First: tests passing plus review green. That's ship. Second: tests passing but review is nitpicking—trivial style preferences. That's also ship. Third: tests passing but the review suggests a "fix" and you try it, and suddenly tests fail. That's a hallucination. Reject it.

Sam: So you're using tests as an objective arbiter.

Alex: Tests are the contract. If a review suggestion breaks tests, the review was wrong. You stop iterating there.

Sam: How many times do you typically iterate?

Alex: Until you reach a green light or diminishing returns. Green light is no substantive issues, tests pass, ship. Diminishing returns manifest as nitpicking, hallucinations, or review-induced test failures. After that, further AI review costs more than it provides. You've done the work. Ship the code.

Sam: What's diminishing returns in practice? Like, how many iterations?

Alex: If you're still finding substantive issues in iteration 3 or 4, maybe you iterate. If you're in iteration 4 and the agent is inventing non-existent issues or suggesting renames, stop. You've hit diminishing returns.

Sam: You mentioned there's a distinction between agent-only and mixed codebases.

Alex: Critical distinction, actually. Same engineering standards apply everywhere—DRY, YAGNI, architecture, maintainability. What differs is coding style optimization and the review process.

Sam: What's the difference?

Alex: Agent-only codebases are maintained exclusively by AI with minimal human intervention at the code level. You optimize coding style slightly toward AI clarity: more explicit type annotations, more verbose documentation, detailed architectural context files. Your review question becomes "Will an agent understand this in six months?"

Sam: And mixed codebases?

Alex: Most production codebases are mixed—humans and AI collaborating, both touching code directly. You optimize for human brevity while maintaining AI navigability. But here's what's critical: you add a manual review step. You fully read and audit AI-generated code before committing.

Sam: Why is that non-negotiable?

Alex: Without explicit project rules guiding style, agents generate code following patterns from their training data that may not match your team's readability standards. You can tune your project rules—Lesson 6 covers this—to guide agents toward the writing style humans expect. But you have to verify the output actually meets those expectations. That's the manual step.

Sam: So project rules are the guard rails, but humans are still the final arbiter for style in mixed codebases.

Alex: Exactly. Rules guide the agent toward your expected style. Human review verifies it worked.

Sam: You mentioned pull requests serve two audiences—humans and AI reviewers. They process information differently.

Alex: Fundamentally differently. Humans scan quickly, infer meaning from context, value concise summaries. One to three paragraphs max. They want the "why" and business value at a glance.

Sam: AI review assistants are different.

Alex: Completely. They parse chunk by chunk, struggle with vague pronouns and semantic drift. They need explicit structure. They need detailed technical context: specific file changes, architectural patterns, breaking changes enumerated clearly.

Sam: So a traditional PR description optimizes for one audience or the other.

Alex: Right. Too verbose for humans, too vague for AI agents. The solution is dual-optimized descriptions generated in a coordinated workflow using sub-agents.

Sam: How does that work?

Alex: You have a sub-agent that explores git history, finds changed files, learns the architecture, synthesizes findings. It returns only what matters: commit messages, file paths, patterns. That sub-agent prevents your main context from filling with 40K tokens of commit diffs.

Sam: So the sub-agent isolates the information gathering.

Alex: And that isolation is crucial. If you try to explore 20, 30 changed files in the main conversation, you push critical constraints into the U-shaped attention curve's ignored middle. You lose precision. With sub-agents, the orchestrator stays focused on synthesis.

Sam: Is that unique to Claude Code?

Alex: Largely, yes. Other tools require splitting this into sequential prompts: explore first, then draft. Claude Code CLI lets you spawn sub-agents that work in parallel, synthesize findings, and return only what the main agent needs.

Sam: What goes in the AI-optimized description?

Alex: Comprehensive technical context. Explicit terminology, file paths, architectural patterns. Everything the AI needs to analyze accurately without hallucinating. Include breaking changes enumerated clearly. Specific patterns that changed. References to relevant previous code.

Sam: And the human description.

Alex: Concise. One sentence verdict, maybe one paragraph of business context. Key files affected so a human can scan and decide if they need to dive deeper. Breaking changes called out explicitly.

Sam: You mentioned Chain of Draft as an alternative to Chain of Thought.

Alex: CoD is an optimization that maintains reasoning benefits without the token cost. Instead of generating verbose step-by-step explanations, you instruct the LLM to think through each step but keep the draft minimal—five words maximum per step. Then return the final assessment after a separator.

Sam: Five words is extremely compressed.

Alex: Exactly. But it provides the same reasoning benefits as CoT. Breaking down complex analysis into logical steps. The difference is reduced token consumption and faster response.

Sam: When would you use CoD instead of CoT?

Alex: For reviews specifically. CoD forces concise intermediate reasoning without losing the analytical structure. You get the benefits of step-by-step thinking without verbose output that wastes tokens and slows response time.

Sam: So when you're reviewing code, you might ask the agent to think through each file, keep its draft to five words, then deliver the full assessment.

Alex: Exactly. The agent thinks through the logic—structure, naming, correctness, fit—keeps notes compressed, then synthesizes a structured review output.

Sam: What does "iterate until green light or diminishing returns" actually mean operationally?

Alex: You fix issues the review finds. Then re-review in a fresh context. Not the same conversation where the agent will defend its prior decisions. Fresh agent, cold eyes. Continue that cycle: review in fresh context, fix issues, validate with tests, repeat.

Sam: Until what?

Alex: Until either you have no substantive issues and tests pass—that's ship. Or you reach a point where further iteration provides diminishing returns. That's when the agent is nitpicking style, inventing non-existent issues, or suggesting "fixes" that break tests.

Sam: How many fresh contexts would you typically go through?

Alex: Depends on the code complexity. One simple feature? Maybe one or two rounds. Complex architectural change? Three rounds of fresh context review is reasonable. Four rounds, you're probably in diminishing returns territory.

Sam: You keep emphasizing evidence requirements. Why does that matter for review?

Alex: Because evidence requirements force grounding. If you ask for "issues with file paths and line numbers," the agent can't make vague claims. It has to point to specific code. It can't say "this approach feels fragile." It has to cite actual patterns and explain why they're fragile with reference to your specific code.

Sam: That's the same principle as in Lesson 7 with planning and execution.

Alex: Same principle everywhere. Evidence-based reasoning. Concrete references. No hallucinations, or at least much fewer.

Sam: What happens when you're on the receiving end of a PR with dual descriptions?

Alex: You read the human summary first. That's your initial mental model of what changed and why. Then you feed the AI-optimized description to your review assistant—whether that's GitHub Copilot, Claude, whatever you use.

Sam: Why feed the AI description separately?

Alex: Because it contains context the AI needs for accurate analysis. Explicit terminology, file paths, architectural patterns the human description compressed for brevity. The AI uses that grounding to avoid hallucinating problems that don't exist.

Sam: And then you review the review.

Alex: Right. You get a structured output: Summary, Strengths, Issues by severity, Decision. You read it with the same critical eye you'd give the code itself. Is the reviewer finding actual problems or inventing issues? Are there false negatives—obvious problems it missed?

Sam: How do you catch false negatives from an AI reviewer?

Alex: Domain knowledge. You know your architecture. You know what patterns matter. If the reviewer misses something important, you'll know because you understand the context. That's why having humans in the loop remains critical.

Sam: So humans and AI review are complementary.

Alex: Completely. AI catches things humans miss because humans tire and miss subtle patterns. Humans catch things AI invents because humans understand intent and context. Together they're stronger than either alone.

Sam: What about the case where code compiles, tests pass, but you have an intuition something isn't right?

Alex: That's domain expertise. Trust that intuition. Request a deeper review focused on that specific area. The review template is flexible—you can ask for security-focused review, performance-focused review, architectural alignment review. Reuse the pattern for different concerns.

Sam: So the four-phase workflow applies to review too. Research intent, plan the review, execute analysis, validate the decision to ship.

Alex: Exactly. That's the methodology. It applies to development, testing, and review. It scales from implementing a function to validating a massive architectural change.

Sam: One last thing—when you reach diminishing returns and you decide to ship despite some outstanding concerns, how do you document that?

Alex: Good practice: document the decision. A note in your commit message or PR notes. "Review flagged potential edge case X. Added issue #123 for future investigation. Test coverage is sufficient for current use cases." That's transparent. It's not pretending the code is perfect. It's acknowledging you made a judgment call based on test coverage, iteration cost, and risk tolerance.

Sam: That transparency matters.

Alex: It does. Future maintainers understand the code wasn't perfect when it shipped. They know what to watch. They know why iteration stopped. That's better than silent technical debt.

Alex: So to summarize: review in fresh context to prevent confirmation bias. Use structured prompts with the same techniques from Lesson 4. Iterate until you reach a green light or diminishing returns. Generate dual-optimized PR descriptions for human and AI reviewers. Let tests be your objective arbiter of correctness.

Sam: And understand the difference between agent-only and mixed codebases so you know whether AI-optimized style is appropriate or if human readability needs to be the priority.

Alex: Right. Most codebases are mixed. Most teams have humans writing code. Make sure your review process accounts for that.

Sam: Next we're looking at debugging.

Alex: Debugging with AI. Where code compiles and tests pass, but the behavior is wrong. How you work with an agent to find and fix the root cause.

Sam: That should be practical.

Alex: It will be. Debugging requires a different methodology than development. You'll see why in Lesson 10.
