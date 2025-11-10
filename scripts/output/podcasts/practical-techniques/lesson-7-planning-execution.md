---
source: practical-techniques/lesson-7-planning-execution.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-10T08:26:48.551Z
model: claude-haiku-4.5
tokenCount: 4821
---

Alex: We've spent the last lesson on grounding through RAG and semantic search—loading context into the agent's window so it can work with your actual codebase. Today we're shifting from gathering context to using context. This is where things get tactical. You're reviewing plans, managing execution, maybe running multiple agents in parallel. This is about turning agents from one-shot code generators into reliable, production-grade machines.

Sam: That's a meaningful shift. When we covered grounding earlier, it was mostly about what the agent retrieves upfront. But I'm guessing this is more about continuous grounding throughout the development process?

Alex: Exactly right. Grounding isn't a one-time thing at the beginning. You load context, review the plan, let it execute, then validate. When something doesn't match your mental model, you stop and clarify. When you spot duplication, you enforce DRY. It's a cycle, not a linear process. The core insight is that grounding happens during active work, not just in setup.

Sam: Okay, so let's start with active grounding. You mentioned showing the agent actual patterns from the codebase rather than abstract documentation?

Alex: Yes, that's the first principle. Abstract descriptions lead to generic solutions that don't fit your codebase. Concrete beats abstract every time. Here's a concrete example: You need to add rate limiting to your API. An ineffective prompt would be "Add rate limiting middleware." That's vague. It forces the agent to guess about your architecture, error handling conventions, how you use Redis, all of it.

The effective version is: "Search for existing middleware patterns, especially authentication. Check our Redis configuration. Then propose rate limiting that follows the same error handling, export structure, and Redis client usage you found." Now the agent greps for middleware files, reads your Redis config, analyzes your patterns, and proposes an implementation that actually fits your codebase. It's not inventing something plausible from training data—it's discovering what you actually have.

Sam: That makes sense. The agent still has autonomy to implement, but it's constrained by what it discovers in your actual code.

Alex: Right. And there's a clever mechanic here with questions. When you ask "How does X work?", you're not testing the agent's knowledge. You're triggering a sequence that loads context into the window for subsequent steps.

Sam: So the questions are a tool to shape the context window itself?

Alex: Precisely. Let's say you ask "Explain how our authentication middleware works." The agent searches for auth files, reads middleware implementations, analyzes patterns and structure, then synthesizes findings. That synthesis now lives in the context window. When you follow up with "Add rate limiting following the same pattern," the agent already has middleware structure, error handling conventions, export patterns, dependency usage—all loaded in context. It doesn't need to search again.

Sam: So it's more efficient than packing everything into one massive prompt, and more reliable than hoping the agent searches for the right things autonomously?

Alex: Yes. Questions are a context engineering tool. You're deliberately priming the agent's working memory before asking for implementation. And here's the key insight—questions are safe to execute autonomously. They're read-only operations with minimal risk. If the agent's explanation is wrong or incomplete, you just ignore it, refine your prompt, and try again. A well-crafted sequence of exploratory questions makes subsequent autonomous coding tasks much more reliable because the context window is already loaded with grounded information.

Sam: I'm getting the value of that. But what if the agent confidently explains something that's totally wrong? How do you catch that?

Alex: That's where the next principle comes in: require evidence. Explicitly requiring evidence forces agents to read your actual code instead of generating plausible-sounding guesses based on training patterns. When you say "Provide evidence with file paths, line numbers, actual values," the agent cannot provide that without retrieving it. This converts what might be a hallucinated response into a grounded one anchored in your codebase.

Without evidence requirement, the agent might respond with something like "Probably a database timeout or null pointer exception in the authentication logic." That's pattern completion from training data, not analysis of your actual code. Pure speculation.

With evidence requirement, the agent has to read the endpoint implementation, trace execution, cite specifics. It might say: "The error occurs in src/api/auth.ts line 67 where user.profile.email is accessed. The profile object is null for OAuth users. See src/services/oauth.ts line 134—profile creation is skipped for federated auth. Stack trace shows: TypeError: Cannot read property 'email' of null." Now you have grounded analysis.

Sam: So what counts as good evidence?

Alex: File paths with line numbers, not "the auth file." Actual values from configs or logs, not "a port number." Specific identifiers like validateJWT() function, not "the validation function." Full stack traces or log entries, not "an error occurred." The pattern is: if you could verify it by opening your codebase, it's good evidence.

Sam: And you can combine this with Chain-of-Thought?

Alex: Yes. Evidence requirements work independently or combined with step-by-step instructions. For complex debugging, use both. Chain-of-Thought controls the execution path while evidence requirements ensure each step is grounded. You get execution control and grounding at every stage.

Sam: Got it. So far this is all about getting the agent to examine your actual code, not hallucinate. But you also mentioned asking clarifying questions to challenge logic?

Alex: This is critical. LLMs are bad at logic. They complete patterns based on statistical likelihood, not sound reasoning. Your engineering skills are still required to catch inconsistencies. When something doesn't fit your mental model, point it out. Say the agent claims "The config uses port 3000," but your logs show connections on 8080. Challenge it: "You said port 3000, but logs show 8080. Explain this discrepancy with evidence from the config files and environment setup."

This forces the agent to re-examine its assumptions, search more carefully, ground its response in actual data rather than pattern completion. Your mental model is the validation layer. When logic doesn't hold, make the agent justify with evidence.

Sam: This is interesting because it's not about the agent being smarter—it's about you staying sharp and catching when it's just confabulating.

Alex: Exactly. The agent handles syntax and boilerplate. You handle reasoning and correctness. Now, once you've grounded the agent thoroughly, you need to review its plan before letting it execute autonomously. This is where you catch architectural mismatches, missing considerations, logic errors—before they become code.

Sam: What does plan review actually look like?

Alex: You're checking the "why" behind the plan, not just the "what." Key questions: How did the agent derive this plan? Was grounding thorough—did it read relevant files, check documentation, understand constraints? Did it miss important considerations like security, performance, backwards compatibility, edge cases?

Here's a concrete example: Agent proposes caching user sessions in Redis with a 24-hour TTL. Good plan on the surface. But did it check your existing session implementation? Did it consider GDPR compliance for session data? Did it account for cache invalidation when users change passwords? If grounding was shallow, you stop and add context before execution.

Sam: So plan review is really about validating that the agent understands your architecture?

Alex: Yes. You're checking architectural fit, not doing line-by-line code review. You want to ensure the agent is grounded in your actual architecture. Look for: Does this fit our established patterns? Are changes in the right modules? Is the agent trying to refactor half the codebase when you asked for a targeted fix?

Here's a grounding failure I see a lot: Agent plans to add email validation by creating a new validation library in src/lib/validators/. But you already have Zod schemas in src/validation/. The agent generated a plausible solution from training patterns instead of discovering your existing validation approach. Catching that at the planning stage is way faster than rewriting generated code.

Sam: So if the plan reveals shallow grounding, you add constraints and force deeper research before execution?

Alex: Right. And there's a related pattern to watch for during plan review: agents inventing instead of reusing. When agents plan implementations, they default to generating plausible code from training patterns rather than discovering what already exists in your codebase. This is pattern completion, not codebase discovery.

Research confirms this bias. AI-generated code contains eight times more duplicated blocks than human-written code. Eight times. Agents reinvent the wheel because invention is statistically easier than discovery—they're pattern-completing from millions of training examples rather than searching for your existing utilities.

Sam: That's a significant gap. How do you spot when this is happening during plan review?

Alex: Watch for these red flag phrases: "Create a new utility function for..." or "Implement a helper to handle..." or "Build error handling logic..." or "Add validation for..." These signal the agent is inventing rather than discovering. You immediately ask: Did it search for existing utilities? Does this helper already exist? What about existing error patterns? Check for existing validation schemas first. Intervention means forcing discovery before allowing implementation.

Sam: So you're basically quality-controlling the agent's architectural decisions?

Alex: Exactly. And now we get to safety nets: checkpointing. Agents make mistakes frequently, especially while you're learning effective grounding and prompting. The good news is, as your skills improve, the need for rollbacks decreases dramatically. You'll naturally write better prompts, catch issues during plan review, guide agents more effectively. But checkpointing remains valuable as a safety net.

The difference between a frustrating session and a productive one comes down to how quickly you can roll back when things diverge. Agentic coding is probabilistic. You need the ability to revert both conversation context and code changes when execution doesn't match your intent.

Sam: What does checkpointing look like in practice?

Alex: You create a restore point before risky operations, let the agent execute, validate results, then keep or revert. Modern AI coding tools like Claude Code, Cursor, VS Code Copilot include built-in checkpointing. Claude Code is particularly elegant—press ESC twice to create a checkpoint that saves both conversation context and code state. This lets you experiment aggressively without gambling on irreversible changes.

If your tool lacks checkpointing, commit far more frequently than traditional development. After each successful increment, before risky operations, when changing direction, after manual corrections. Each commit represents a known-good state you can return to instantly. Validation—which we cover in Lesson 9—determines whether you keep or discard changes. Checkpointing makes that decision reversible.

Sam: Okay, so far we're talking about single-agent workflows. But you mentioned parallel execution?

Alex: Yes. For complex features, running multiple agent instances on different tasks simultaneously dramatically accelerates development. The key infrastructure piece is Git worktrees. They allow multiple working directories from a single repository, each with a different branch checked out. This enables running multiple agents without conflicts.

The mechanics are simple: git worktree add ../my-feature feature-branch creates a new directory with feature-branch checked out. git worktree list shows all active worktrees. You can have your main agent working on authentication in one directory, a second agent building the cache layer in another, a third handling API endpoints. Zero interference, fully isolated contexts.

Sam: That's a significant operational advantage. Multiple agents, fully parallel, same repo?

Alex: Exactly. This is where terminal environment becomes critical infrastructure. You're managing multiple concurrent sessions, context-switching between agent instances, monitoring long-running processes. Your terminal goes from command prompt to mission-critical infrastructure.

Invest in customizing your terminal just like you would with your IDE. Modern terminals offer IDE-level features: GPU acceleration, programmable layouts, rich scripting, notification systems, extensive customization. Options worth exploring are Ghostty—fast, GPU-accelerated, native—Kitty with GPU-based support, WezTerm with Lua configuration, or Alacritty with minimalist OpenGL acceleration. Each offers different customization approaches. Compare based on your workflow needs.

Sam: That's more involved than I'd have expected. Is it worth the investment?

Alex: Absolutely, if you're doing serious parallel workflows. You're running multiple agent instances concurrently. Taking time to configure your terminal—session management, keybindings for rapid context switching, notification configuration, visual indicators for different agent contexts—pays dividends across every development session.

Use ArguSeek to research best practices for your chosen terminal. Look up session management, keybindings for rapid context switching, notification configuration. Something like "Configure Ghostty for parallel AI agent workflows with visual indicators for different contexts" would get you focused research on exactly what you need.

Sam: Once you've set up the infrastructure, are there CLI tools that help with the workflow?

Alex: Yes. Complement agent workflows with modern CLI tools that improve navigation, editing, and git operations. Micro is a terminal text editor with intuitive keybindings—Ctrl+S to save, Ctrl+Q to quit. Ideal for quick edits without switching to your IDE. Eza is a modern ls replacement with better formatting, file type colors, and git integration. Easier to scan directories across multiple worktrees.

Fzf is a fuzzy finder for files, command history, and git branches. Quickly locate files in large codebases or recall commands from previous sessions. Lazygit is a terminal UI for git with visual branch management, interactive staging, and commit navigation. Especially useful when managing multiple worktrees. These reduce friction when working across multiple worktrees and agent sessions. Install them once, benefit throughout your workflow.

Sam: Can the agent help you set up these workflows?

Alex: Absolutely. Agents can assist with CLI operations, especially when you're unfamiliar with a tool. Ground with ArguSeek first for external tools, then ask the agent to generate commands or explain usage. You might say something like: "Research Git worktree best practices, recommend a clean directory layout for parallel agent sessions, then generate the exact git worktree add commands I'd run to set up features/auth, features/cache, and features/api in parallel. Include exact paths and branch names."

The agent will research worktrees, propose a clean layout, generate the exact commands. That's faster than reading documentation manually and ensures commands match your specific context.

Sam: So you're still controlling the direction, but the agent handles the research and command generation?

Alex: Right. And here's an important point: don't be dogmatic about terminal-only or GUI-only workflows. IDEs remain the best tools for code navigation, symbol search, and viewing large files. CLI excels at quick edits, git operations, and managing parallel sessions. Use the best tool for each task.

Code navigation and exploration? IDE—superior symbol search, go-to-definition, call hierarchies. Quick edits in agent context? CLI—faster than switching to IDE for one-line changes. Git operations across worktrees? CLI—better visibility into multiple branches. Reading large files or complex logic? IDE—better syntax highlighting, folding, navigation. Pragmatism beats purism. These are all tools. Choose based on efficiency, not ideology.

Sam: I appreciate that perspective. So zooming back out, we've covered active grounding, plan review, checkpointing, parallel workflows. What are the key patterns to take away from this?

Alex: Several interconnected principles. First: questions load context, they don't verify knowledge. When you ask "How does X work?", you're triggering search and read sequences that populate the context window with relevant information for subsequent execution steps. Questions are a context engineering tool.

Second: require evidence to force grounding. Explicitly requiring evidence with file paths, line numbers, actual values forces agents to retrieve information rather than guess. The agent cannot provide evidence without reading your actual code, converting hallucinated responses into grounded ones. Works independently or combined with Chain-of-Thought.

Third: LLMs complete patterns, not logic. Your engineering judgment validates architectural fit and catches logic errors. Agents handle syntax and boilerplate; you handle reasoning and correctness.

Sam: Those are foundational. Anything else?

Alex: Review the plan's strategy and reasoning, not just the output. Before autonomous execution, check: How was this plan derived? Was grounding thorough? Did it miss security, performance, or architectural considerations? Watch for invention over reuse during plan review. Agents default to generating plausible code from training patterns instead of discovering existing code. Red flags: "create new utility," "implement helper." Force discovery first with evidence requirements.

Checkpoint before execution, commit after validation. Use built-in checkpointing when available. Without it, commit far more frequently than traditional development. Agents make frequent mistakes; checkpointing makes iteration fast and reversible. Git worktrees enable true parallel agent workflows—multiple working directories, separate branches, isolated contexts. Run multiple agents on different features simultaneously with zero interference.

And finally: mix CLI and UI tools pragmatically. IDEs for navigation and viewing, CLI for quick edits and parallel session management. Use the best tool for each task, not ideology. All of this comes together to turn agents from code generators into reliable code-producing machines.

Sam: That's a solid framework. Next lesson is Tests as Guardrails?

Alex: Yes. We're covering how to use tests as a safety mechanism during agent-assisted development. Tests become your validation layer—they tell you when the agent's output is correct, and they catch regressions before they reach production.

Sam: Looking forward to it.
