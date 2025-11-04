---
source: understanding-the-tools/lesson-2-understanding-agents.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-04T07:20:21.866Z
model: claude-haiku-4.5
tokenCount: 2724
---

Alex: Welcome back. In our first lesson, we established that LLMs are brains—they're token prediction engines—and agent frameworks are bodies, the execution layers. Today we're drilling into how these actually work together to create autonomous systems that can complete real work.

Sam: Right, so we're moving from theory to mechanics. What makes an agent different from just talking to ChatGPT?

Alex: That's the central distinction. When you use a chat interface, you're having a conversation. You ask a question, the model responds, then *you* manually execute whatever it suggested. You run the tests, edit the files, come back with errors. It's synchronous hand-offs.

An agent is fundamentally different. It's a **feedback loop**—perceive, reason, act, verify, iterate. The agent closes that loop automatically.

Sam: So the agent is doing the manual work we'd normally do between prompts?

Alex: Exactly. Let me give you a concrete contrast. With a chat interface, you ask "How should I add authentication to this API?" The model gives you code. You manually edit the files. Something breaks. You come back and ask for a fix. The model suggests another change. You edit again. It's a dance where you're the one moving between turns.

An agent runs the full sequence without waiting for you. You say "Add authentication to this API," and it reads the relevant files, plans the implementation, edits the code, runs the tests, sees failures, analyzes the errors, fixes the code, runs tests again, and stops when they pass. All in one go.

Sam: That's a significant difference in friction. But I'm curious—what's actually happening under the hood? Is the agent doing something cognitively different, or is it just chaining together multiple LLM calls?

Alex: This is where most people get confused, and understanding it transforms how you work with agents. Here's the truth: everything is just text flowing through a context window. No magic. No hidden reasoning engine. No separate state.

When you interact with an agent, you're watching a conversation unfold in a single text buffer. The system instructions, your task, tool calls, the results of those tools, the model's reasoning, everything—it's all just text.

Sam: So the agent isn't "thinking" separately from what we see?

Alex: Correct. When you see the agent write something like "I should check the validation logic first," that's not internal thought hidden from the context. That's generated text, part of the conversation, visible to both you and the model itself.

There's a nuance here though. Some providers now offer "extended thinking" modes where the model generates hidden reasoning tokens before producing visible output. In those cases, what you see in the context is a summary of internal reasoning, not the full chain-of-thought. You're billed for the complete hidden tokens, but you only see the abbreviated version. The actual reasoning is opaque—you can't inspect it or debug it directly.

Sam: That's interesting from a transparency standpoint. If I'm trying to understand why an agent made a decision, extended thinking potentially hides that from me.

Alex: Precisely. It's a trade-off. You might get better results in some cases, but you lose observability into the decision-making process. For critical production work, that's worth considering.

But regardless of extended thinking, the core principle holds: the entire conversation—system instructions, your task, tool calls, results, responses—exists as one continuous text stream in the context window. That's the agent's complete world.

Sam: And that means the agent has a finite window of memory. If the conversation gets long enough, earlier parts scroll out of context?

Alex: Yes, and this is crucial for understanding agent limitations. The context window is finite. Complex tasks that generate a lot of output can push earlier context out of view. The agent only knows what's currently in the window. If something important scrolled out, the agent genuinely doesn't know about it.

But here's where it gets interesting—this isn't just a limitation. It's actually a massive advantage.

Sam: How so?

Alex: The LLM is completely stateless. It has no hidden memory, no persistent internal state. Its only world is the current context window. And that's what makes agents so powerful.

Think about it: the agent doesn't "remember" previous conversations. It doesn't carry baggage from earlier decisions. Each conversation is a clean slate. When you want to explore alternative approaches, the agent isn't defending its earlier choices or locked into a previous decision path. You get complete control over what the agent knows by controlling what's in the context.

Sam: So you could intentionally exclude information to explore a different direction?

Alex: Exactly. Or more practically, you can ask the agent to review its own code without telling it who wrote it. The agent will review it objectively because, from its perspective, it's just code in the context. No ego, no defensive justification of past work.

This enables workflows that would be impossible with human reviewers. You can do generate, review, iterate cycles where the same agent generates code, then critically reviews it with fresh eyes. Or you can ask for a security review in one conversation, then a performance review in a completely different conversation, exploring different perspectives without cross-contamination.

Sam: That's a genuinely useful design pattern. So the practical implication is that we should be intentional about what context we engineer into a conversation.

Alex: Absolutely. If you want unbiased code review, you don't tell the agent who wrote the code. If you want it to follow existing patterns, you include examples in the context. If you want it to focus on performance, you highlight performance concerns upfront. The agent's entire knowledge comes from the text you engineer into the conversation.

Sam: This connects to something I've been thinking about. In my team, we're using agents for refactoring legacy code. We've noticed that when we give the agent the full codebase context, it sometimes makes decisions that are locally correct but miss larger architectural patterns that aren't explicitly in the prompt. How do you handle that?

Alex: That's a real problem and it points to the limits of stateless systems. The agent can't infer architectural knowledge that isn't explicitly in the context. So you have to engineer it in. Document the architectural constraints. Include examples of the patterns you want followed. Make the rules explicit.

The advantage is that once it's explicit in the context, the agent consistently follows it. There's no ambiguity, no human judgment gaps.

Sam: Got it. So context engineering is really system design applied to text.

Alex: Exactly. You're designing interfaces and contracts—you already do this with code. Here, you're doing it with the context window. Vague context produces wandering behavior. Precise, scoped context steers the agent exactly where you need it.

Now let's talk about tools, because that's where agents actually interact with the world.

Sam: Right. The agent's reasoning is just text, but it needs to actually *do* things.

Alex: Tools are functions the agent can call to interact with the environment. CLI coding agents ship with built-in tools optimized for the workflow: Read, Edit, Bash, Grep, Write, Glob. These aren't just wrappers around shell commands. They're engineered with edge case handling, LLM-friendly output formats, safety guardrails, and token efficiency.

But for connecting to external systems, agents use the MCP protocol—Model Context Protocol. It's a standardized plugin system. You configure an MCP server—maybe it's a Postgres client, or a GitHub API integration, or a Stripe connection—and the agent discovers those tools at runtime and can call them.

Sam: So the agent's capabilities are entirely defined by the tools available in its context?

Alex: Yes. No tools, no actions. Just reasoning in a text buffer. The tools give the agent a "body" to execute the "brain's" decisions.

Sam: Let's pivot slightly. You mentioned that there are different types of agents—CLI agents, IDE agents, chat interfaces. Why would someone choose a CLI agent over something like GitHub Copilot in an IDE?

Alex: This gets to a core insight about how agents scale in practice. Chat interfaces and IDE agents are excellent for single-window, single-project workflows. But CLI agents unlock parallelism.

Think about it: if you have three coding tasks running simultaneously—refactoring in one project, debugging in another, implementing a feature in a third—you can run agents concurrently in three terminal tabs. Each agent keeps working independently. Context-switch freely. All three make progress while you're context-switching.

With IDE agents, you're locked to a single window and project. You can't parallel work without managing multiple IDE instances or losing context.

Chat interfaces reset context with every conversation. You're manually copying code back and forth.

Sam: That's a significant operational advantage. So for teams doing complex work, CLI agents become the infrastructure choice.

Alex: Right. They're force multipliers. Multiple projects, multiple agents, no bottleneck.

Sam: I want to bring this back to the core mechanism. We've talked about the loop, the textual nature, the stateless property. All of this seems to suggest that the real skill is in steering the agent through context design. Is that the pattern we should be building around?

Alex: Absolutely. And this is where the course goes next. Effective AI-assisted coding is fundamentally about engineering context to steer behavior. The agent's entire world is the text flowing through the context window. You control that text. You control the system prompts, the scope of your instructions, which tool results get fed back, how you frame problems.

The stateless nature means you can even steer the agent to review its own work in a fresh conversation—no memory of the original implementation, just objective analysis of the code.

Sam: So we're not trying to build smarter agents or prompt-engineer magical incantations. We're designing the information architecture around the agent.

Alex: Exactly. You're already good at information architecture and interface design in code. This course teaches how to apply those skills to the context window. Architect the right context, and the agent does the right work. That's the pattern.

Sam: This is a solid foundation. I assume the next lesson gets into methodology—how to actually structure work at scale?

Alex: Exactly. Lesson 3 covers high-level methodology: how to break down complex tasks, how to scope agent work, how to sequence operations. That's where theory meets practice.

Sam: Looking forward to it.
