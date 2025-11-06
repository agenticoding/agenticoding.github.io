---
source: understanding-the-tools/lesson-2-understanding-agents.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-05T12:37:44.311Z
model: claude-haiku-4.5
tokenCount: 2401
---

Alex: So we've established that LLMs are brains—token prediction engines—and agent frameworks are bodies that let them take action. Now the interesting question becomes: how do they actually work together? What separates an agent from just calling an API multiple times?

Sam: Right, because at face value it seems like you could just loop through API calls yourself. Prompt the model, take its output, feed it back in manually. What's the actual difference?

Alex: That's exactly the right question. The core difference is the feedback loop. When you're using a chat interface, you're manually breaking the loop. You get a response from the model, you manually execute whatever it suggests, you hit an error, you paste that error back in, and the model suggests a fix. It's iterative, but it requires you to be the orchestrator at each step.

Sam: So the agent just automates that orchestration?

Alex: Precisely. An agent autonomously closes the loop: perceive the current state, reason about what to do, act by executing something, observe the results, and if needed, reason about what went wrong and try again. All without you stopping it.

Sam: Can you paint a concrete picture of what that looks like in practice?

Alex: Sure. Let's say you ask an agent to add authentication to an API. With a chat interface, you'd get back some code suggestions. You'd manually apply them, run tests, get failures, come back to the chat with error messages, get more suggestions, manually apply those. Back and forth.

An agent does this: reads the API files, understands the structure, plans the implementation, writes the code, runs the tests, sees they fail, analyzes the error, fixes the code, runs tests again, confirms they pass, and tells you it's done. You triggered it with one instruction and walked away.

Sam: That's a significant difference in developer experience. But I'm curious about what's actually happening under the hood. Is there something special about how agents process information?

Alex: This is where it gets important to demystify what's actually happening. And the answer is surprisingly simple: everything is just text.

Sam: Just text? No special reasoning engine?

Alex: No special reasoning engine. No hidden state. When you interact with an agent, what you're watching is a conversation unfolding in a context window. The agent sees system instructions, your task, tool calls it made, the results of those calls, and its own previous responses—all as text in one continuous stream.

Sam: So when the agent appears to be "thinking"—like when you see it say "I should check the validation logic"—that's not internal cognition. It's literally generating text that becomes part of the context.

Alex: Exactly. Though there's a complication now with extended thinking modes. Some providers offer models that generate hidden reasoning tokens before producing visible output. What you see is a summary, not the full chain of thought. You're billed for the complete hidden reasoning, but it's opaque to you.

Sam: So you lose visibility into how the model actually arrived at its conclusion?

Alex: Right. It's a trade-off. You potentially get better reasoning, but you also get less ability to inspect and understand the actual path it took. For now, let's focus on the standard case where it's all visible text.

Sam: That actually changes how I think about debugging agent behavior.

Alex: Exactly where you should go with this. If the agent forgets something, it's not a memory failure—it's that information scrolled out of the context window. If the agent seems confused, it's probably because the context isn't clear or structured properly. This isn't magic; it's a conversation.

Sam: So everything we know about writing clear prompts applies here, just at scale?

Alex: Yes, but with a crucial insight: the LLM is completely stateless. It has no internal memory, no hidden state. Its only world is what's in the current context. When your conversation continues, the model sees its own previous responses as text, not as memories it's recalling. And this actually becomes a massive advantage.

Sam: How is statelessness an advantage? That sounds like a limitation.

Alex: Because you have total control over what the agent knows. You control the context. Want the agent to forget earlier decisions and explore a different approach? Just start a new conversation with different instructions. The agent won't defend its old approach because it doesn't "remember" making it.

Sam: That's clever. So you could ask an agent to generate code, then in a separate context, ask it to critically review that same code without it knowing it generated it?

Alex: Exactly. And it will review it as objectively as if someone else wrote it. No ego, no defensive justification of past choices. This unlocks powerful workflows: generate code, then have an unbiased review pass, iterate based on feedback. Or explore entirely different implementations in parallel without any crosstalk.

Sam: That seems like a production consideration worth thinking about. You could theoretically A/B test approaches without bias.

Alex: Right. And the key takeaway for production is: design your prompts to control what context the agent sees. The agent's entire "knowledge" comes from what you engineer into the conversation. This is system design thinking applied to text.

Sam: So we've covered the reasoning loop and the textual nature. What about actually executing things? How does an agent change the world beyond just generating text?

Alex: Through tools. An agent on its own is just an LLM—a text generator. Tools are how it actually does things: read files, edit code, run commands, search the codebase. Every agent framework ships with a set of purpose-built tools.

Sam: Are these just shell command wrappers?

Alex: They look simple, but they're carefully engineered. Tools like Read, Edit, Bash, Grep, Write—they handle edge cases, they format output in ways that are token-efficient for the LLM, they include safety guardrails. They're optimized specifically for how an LLM uses them.

Sam: And you can extend beyond the built-in set?

Alex: Yes, through the MCP protocol—Model Context Protocol. It's a standardized system for plugins. You can connect agents to databases, APIs, cloud platforms, whatever custom systems you have. Configure them once, and the agent discovers their tools at runtime.

Sam: So the agent's capabilities are truly modular and extensible.

Alex: Completely. The agent only knows about the tools available in its context. Want it to have database access? Add a Postgres MCP server. Want it to interact with GitHub? Add the GitHub integration. It's composition.

Sam: This is a good moment to talk about the practical advantages of CLI agents specifically. I know there are chat interfaces too.

Alex: Right, and they have different strengths. Chat interfaces like ChatGPT are excellent for answering questions and exploring ideas interactively. But for actual implementation work, CLI agents have a decisive advantage: parallelism.

Sam: How so?

Alex: Open three terminal tabs, run different agents on different projects simultaneously. While one's refactoring project-a, another's debugging project-b, a third is implementing in project-c. Each agent runs independently, you context-switch freely between them. Meanwhile, IDE-integrated agents like Cursor are locked to a single window and project. You're stuck waiting for the agent to finish or you cancel and lose the context.

Sam: And chat interfaces reset context with each new conversation?

Alex: Exactly. You have to manually copy-paste code between conversations, manually execute changes. CLI agents work across projects in parallel without that friction. That's a genuine productivity multiplier.

Sam: That actually maps back to what we discussed in lesson one about working on multiple things at once.

Alex: It does, but now you're seeing the mechanism: the tool that enables it is the CLI execution model itself. Parallel agents, parallel work.

Sam: So we've covered the execution loop, the textual nature, statefulness, tools. What ties all this together?

Alex: This is the conceptual foundation for the rest of the course: effective AI-assisted coding is fundamentally about engineering context to steer behavior. The context window is the agent's entire world. You control that world—system prompts, instructions, tool results, conversation history. Vague context produces wandering behavior. Precise, scoped context steers the agent exactly where you need it.

Sam: And given what you said about statefulness, you can even steer it dynamically mid-conversation?

Alex: Yes. If the agent drifts, you adjust the context. Give it clearer constraints, show it examples, narrow the scope. Or if you need a fresh perspective, start a new conversation with different instructions. You're applying system design thinking to text, architecting the conversation itself.

Sam: That's a useful frame. In normal system design we think about interfaces and contracts. This is the same discipline applied to prompts.

Alex: Precisely. And once you internalize that, the rest becomes tactical—learning specific patterns and techniques for different scenarios. But the foundation is understanding what you're actually controlling: the text flowing through the context window.

Sam: So lesson three is where we start building those patterns?

Alex: Right. We'll start with high-level methodology—how to structure thinking about problems that agents solve. Then progressively build toward production scenarios.
