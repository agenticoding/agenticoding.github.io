---
source: practical-techniques/lesson-6-project-onboarding.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-04T07:18:21.608Z
model: claude-haiku-4.5
tokenCount: 2701
---

Alex: Let's talk about something that affects both you and your AI agents equally: that brutal first week on a new project. You know the feeling—unfamiliar architecture, tribal knowledge scattered across Slack, that bash script everyone runs but nobody documented.

Sam: Oh man, I've lived this. You're essentially operating blind. But here's what I'm wondering—why should we care about this from an AI agent's perspective? They're not reading Slack histories anyway.

Alex: Exactly. That's the insight. An AI agent doesn't have the luxury of osmosis that humans do. They don't gradually pick up context through conversations and observation. What they have is a fixed context window—roughly 200,000 tokens—and they need to understand your project within that constraint. No memory of yesterday's conversation, no understanding of how you do things.

Sam: So we're essentially rebuilding the onboarding experience in written form?

Alex: Precisely. And that's the solution we're going to explore: codifying your project context into machine-readable files. Files like CLAUDE.md, .cursorrules, or AGENTS.md. These become your agents' onboarding documentation.

Sam: I've seen these files scattered around projects, but I'll be honest—I've never thought of them as systematic. Is there a real difference between a good context file and just... documentation?

Alex: Huge difference. Documentation is for humans who can read between the lines and ask clarifying questions. A context file is for something that can't. It needs to be explicit, structured, and hierarchical. Consider what a senior engineer actually needs on day one: your system topology, how components communicate, which tech stack decisions matter, the development workflow, and all that tribal knowledge you take for granted.

Sam: Like the fact that you always run migrations before tests, or that the staging database is flaky?

Alex: Yes. An AI agent needs those exact rules encoded. The problem is, different tools use different conventions. Claude Code uses CLAUDE.md files with hierarchy. Cursor uses .cursorrules or .mdc files. There's no universal standard yet, though some argue for a vendor-neutral AGENTS.md.

Sam: So we're fragmenting across tools?

Alex: For now. But the interesting part isn't picking the right tool—it's understanding that all these files serve the same purpose: they're teaching the agent how to operate in your environment. That's actually a profound shift. You're not just generating code. You're training an agent to follow your patterns.

Sam: I like that framing. But I'd push back a bit—how much detail actually needs to go in these files? I could see this ballooning into thousands of lines of documentation.

Alex: That's a common mistake, actually. The philosophy should be minimalist. Put your comprehensive documentation in README and project docs where humans will read it anyway. Keep the AI-specific configs lean. They're for the operational details that don't belong in standard documentation—CI/CD integration, non-interactive execution warnings, tool-specific behavior.

Sam: Why minimalist? Wouldn't more context make the agent more effective?

Alex: Counterintuitively, no. The more comprehensive your AI config, the larger your attack surface. There's a real security concern called "Rules File Backdoor" where malicious instructions get injected into context files. Keep it focused, keep it lean.

Sam: That's... actually a good point I hadn't considered. So what does a real production context file look like?

Alex: Let's build one mentally. Imagine an e-commerce backend—microservices, PostgreSQL, Docker Compose. At the repository root, you'd have a CLAUDE.md that describes the whole system. Then you'd have subdirectory-specific files for the user service, payment service, infrastructure code. Each one builds on the parent context but adds component-specific rules.

Sam: And those rules would be things like?

Alex: For the user service: how authentication patterns work, what the database schema looks like. For the payment service: integration with Stripe, idempotency keys, webhook verification. For infrastructure: CDK patterns, AWS resource naming conventions. The parent document says "we use ES Modules"—the child document in payment-service says "and Stripe requires these specific error handling patterns."

Sam: So it's hierarchical. More specific contexts override or augment general ones?

Alex: Exactly. When Claude Code operates in /work/ecommerce/payment-service, it merges all three contexts: global preferences, the ecommerce CLAUDE.md, and the payment-service CLAUDE.md. Precedence goes from general to specific.

Sam: I'm starting to see the power here. Let me throw out a scenario: What if I'm bootstrapping a new codebase? Do I have to write all this from scratch?

Alex: No. Here's the meta-pattern—you can use an agent to help bootstrap its own configuration. Run an analysis task: have the agent read package.json, README, scan for test commands, identify code conventions, find key files. Summarize what it learned. Then you augment that with tribal knowledge.

Sam: So it's like: machine-readable facts, human-provided context?

Alex: Precisely. The agent is good at objective analysis—"this project uses Vitest for unit tests, Playwright for E2E tests, has a test command that requires Docker." You add the subjective part: "those E2E tests take five minutes, only run them after significant changes."

Sam: Now I'm curious about the tribal knowledge piece. What are we actually capturing there?

Alex: Critical constraints: "Never commit .env files, not even .env.example." Common pitfalls: "Redis sessions expire after 24 hours—refresh on activity." Non-obvious dependencies: "Database seeds expect Docker daemon running." The kind of stuff that leads to production incidents if nobody tells the agent.

Sam: Like the bash script nobody documented?

Alex: That's it. Except you're documenting it. And in a way the agent can understand and follow.

Sam: I have a practical question though. How do I know if my context file is actually good? Is it just a feeling?

Alex: No. You test it. Start a fresh conversation with your agent—they have no memory of your project. Give them a realistic task: "Add input validation to the login endpoint." Watch what happens. Does it use the right error handling patterns? The right module system? Does it run the right tests?

Sam: And if it gets something wrong?

Alex: Update the context file to encode the correction. This becomes iterative. You're essentially training your agent through feedback. After a few iterations, you have something that produces production-ready code on the first attempt.

Sam: That's actually different from just throwing documentation at the problem.

Alex: Right. It's active verification. And there's a bonus benefit—you're probably improving your documentation simultaneously. The constraints you need to explain to an agent are usually the same constraints that should be in your team's handbook.

Sam: So there's a scalability angle here too. If you're bringing on new human engineers, do they benefit from the same context file?

Alex: Absolutely. The things the agent needs to know are the things your new hire needs to know. It's actually a forcing function for documentation quality. If you can't explain it clearly enough for an AI agent to follow, you can't expect humans to either.

Sam: Let me push on one more thing—you mentioned different tools use different formats. What's the migration story if we standardize later?

Alex: That's a real concern. Some advocate for a vendor-neutral AGENTS.md that all tools could theoretically read. But honestly, we're not there yet. For now, if you're using Claude Code, use CLAUDE.md. If you're using Cursor, use .cursorrules. The format doesn't matter as much as having *something*.

Sam: So the practice is more important than the perfect tool?

Alex: Way more important. A mediocre CLAUDE.md that you actually maintain is worth infinitely more than a perfect theoretical standard that doesn't exist. Start with what you have, write down the operational details, test it with your agent, iterate.

Sam: Alright, let me synthesize this. The problem is that AI agents can't learn through osmosis. They need explicit context. The solution is structured context files—CLAUDE.md, .cursorrules, etc. These encode project knowledge hierarchically. You keep them minimal, test them with real tasks, and iterate based on what the agent gets wrong.

Alex: That's the core of it. But there's something deeper: you're no longer just writing documentation or generating code. You're designing how an intelligent system operates in your environment. That's actually a significant shift in how we think about projects.

Sam: And if you get it right, you end up with an agent that's project-aware, follows your conventions, avoids your known pitfalls.

Alex: Not just follows them—the agent becomes an extension of your team's practices. Which is the whole point.

Sam: One last question: how do you prevent these files from becoming a maintenance burden? Don't they need to stay in sync with the codebase?

Alex: Yes, they do. Treat them like code. Version control them, code review them, include them in your PR process. When you introduce a new pattern or constraint, someone updates the context file. When tribal knowledge changes—maybe you migrate from CommonJS to ES Modules—you update the file.

Sam: So it's part of the development workflow, not a separate documentation task?

Alex: It has to be. Otherwise they calcify. And calcified context is worse than no context—it's actively misleading.

Sam: That makes sense. So to wrap up—for someone starting this practice, where do they actually begin?

Alex: Read your project's README. Read package.json. Scan the test setup. Ask yourself: "What would a new hire need to know to be productive in the first hour?" Write that down. Test it with an agent. Watch it fail in useful ways. Iterate.

Sam: And once you have something basic working?

Alex: Add the tribal knowledge. The constraints, the pitfalls, the non-obvious patterns. Keep the structure clean. Make it specific to your project, not a generic template. And then maintain it like you maintain code.

Sam: That's a pretty different mindset from most documentation.

Alex: It is. But it's necessary because you're not just documenting your system—you're training an intelligent agent to operate within it. And that's a problem that requires active engagement, not passive documentation.

Sam: I think that's the real insight here. We're not writing docs. We're designing the interface between human expertise and machine capability.

Alex: Exactly. Get that interface right, and you've multiplied your team's effectiveness.
