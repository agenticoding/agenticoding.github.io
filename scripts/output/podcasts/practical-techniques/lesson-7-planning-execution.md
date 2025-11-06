---
source: practical-techniques/lesson-7-planning-execution.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-04T07:19:22.618Z
model: claude-haiku-4.5
tokenCount: 3597
---

Alex: Welcome back. In this lesson, we're shifting from understanding how agents work to actually orchestrating them on real feature development. And the key insight here is that your role fundamentally changes. You're no longer writing code line by line - you're planning and orchestrating tasks.

Sam: That's a significant shift. I think a lot of engineers struggle with that transition because we're trained to just dive in and start coding. What does this planning phase actually look like in practice?

Alex: Good question. Let me start with the core principle: you spend time grounding the agent before it executes anything. Think of it like this - junior developers jump straight into implementation. Senior engineers spend the first hours understanding the problem space, the constraints, the existing patterns. AI agents amplify this pattern dramatically.

Sam: So grounding is about context loading, essentially?

Alex: Exactly. Grounding means giving the agent everything it needs to make good decisions without guessing. That's codebase patterns - existing validation approaches, middleware patterns, error handling conventions. Technical context - library docs, API references, how your framework is actually configured. And business context - requirements, constraints, edge cases that matter.

Sam: Why does this matter so much? Can't the agent just figure it out as it goes?

Alex: Let me show you the difference. Without grounding, your agent operates on probabilistic guesses from its training data. It might suggest a validation library you don't have. It might propose middleware that doesn't match your project's style. It might miss security requirements because they weren't obvious in the prompt.

Sam: But with grounding?

Alex: With grounding, the agent sees actual code. "I see you use Zod for validation in src/validation/. Here's how you follow that pattern." It reads your Redis configuration, checks your existing middleware implementations, understands your error handling conventions. The output is radically different - and actually usable.

Sam: How much time are we talking about for grounding? Is this a 30-minute research phase?

Alex: More like 10 to 15 minutes for most features. The idea is that this investment prevents hours of rework later. Let me walk through a practical workflow. Say you're adding rate limiting to an API. You'd have the agent grep for where middleware files live in your project. Read your Redis configuration - because rate limiting needs to store state somewhere. Fetch the documentation for the specific library you're using. Check your existing error handling patterns so the rate limit response matches your style.

Sam: That's specific enough that the agent can actually operate with real constraints rather than inventing them.

Alex: Right. Without that context, the agent generates generic middleware that doesn't match your project's conventions at all. It assumes a Redis config that might not exist. It misses security requirements. It ignores how you handle errors everywhere else in the codebase.

Sam: I can see how that compounds - you get output, you try to integrate it, realize it doesn't fit your patterns, and now you're fixing things instead of building.

Alex: Exactly. And remember - the agent has zero memory of your last conversation. Every task starts from a blank context window. Grounding isn't optional, it's fundamental.

Sam: So we've grounded the agent. Now what? I imagine there's still ambiguity in requirements, right?

Alex: There is, and this is where the art comes in - knowing when to ask clarifying questions versus making informed assumptions based on evidence. Not all ambiguity is equal.

Sam: Walk me through when you'd ask versus when you'd just decide.

Alex: Ask clarifying questions when the answer significantly changes the implementation and you can't infer it from context. Business logic ambiguity - like, should expired premium users retain read access? That changes your whole auth strategy. Security and compliance implications - can you log personally identifiable information for debugging? That's not a small detail, that's a policy decision. Multiple valid approaches with different trade-offs - optimize for write throughput or read latency? Those are architectural choices. Breaking changes to public APIs - if your change breaks existing clients, that's intentional or not?

Sam: And don't ask when?

Alex: Don't ask when technical patterns are already established in your codebase. Follow existing conventions. When standard engineering practices apply - proper error handling, logging, validation. That's not a question. If documentation exists - your README or CLAUDE.md - check there first. And if you can verify something cheaply - run tests, check logs, experiment locally - do that before asking.

Sam: So it's really about gathering evidence before asking the question. Instead of "how should I do X," you ask "I found pattern Y in the codebase, but this scenario seems different because Z - which approach do you prefer?"

Alex: You've got it exactly. Make informed recommendations backed by evidence, not open-ended questions. Here's the principle senior engineers operate on - make reasonable assumptions based on existing patterns. If your auth middleware uses JWTs, a new protected route should too. If your API returns 400 for validation errors and 500 for server errors, follow that. And common sense applies - don't store passwords in plaintext even if requirements don't explicitly forbid it.

Sam: Your agent should operate that same way once it's grounded.

Alex: Correct. Once you've loaded the context with codebase patterns, it will make reasonable inferences that align with your architecture.

Sam: Okay, so we've grounded the agent and we've decided what questions need asking and which don't. Now the feature itself might be too big to implement in one go, right?

Alex: Right. This is where decomposition comes in - breaking complex features into independent, parallelizable units of work. And there's a systematic method for this called SPIDR.

Sam: I like that it has a catchy acronym. What do the letters stand for?

Alex: S for Spike, P for Path, I for Interfaces, D for Data, R for Rules. Let me give you concrete examples of each.

Spike is research separated from implementation. Say you need to pick a payment processor - Stripe versus Braintree. That's one task. Then implementing the chosen processor is a separate task, later. You don't code both in parallel hoping you pick the right one.

Path is different user workflows. Login with email and password - that's one story. Login with OAuth - that's separate. Magic links - another story. Same feature, different workflows, parallelizable.

Interfaces is platform variations. Support Chrome and Firefox first. Safari support is a follow-up. A basic share button that copies URLs. A rich share modal with social previews - that's an enhancement. Different interfaces, different timelines.

Sam: So you're not trying to solve everything at once.

Alex: Exactly. Data means starting with simple data types, adding complexity. Upload MP4 videos initially. Support for WebM and AVI formats later. Employees with one manager first. Matrix reporting with multiple managers as an enhancement.

Rules is business logic layering. Handle the happy path first. Add validation rules incrementally. Enforce copyright detection, block offensive content - those are follow-ups that don't block core functionality.

Sam: This is elegant because you're identifying what has to happen in sequence versus what can truly happen in parallel.

Alex: Right. Let me make this concrete. Imagine you're adding multi-factor authentication to your system. Without decomposition, you've got a huge, vague task that the agent will struggle with. With SPIDR, you might break it into - spike research on 2FA approaches, design the database schema, implement the TOTP generation and verification, create the enrollment UI, add recovery codes, handle edge cases like lost authenticators. Each of those is independently implementable, most can happen in parallel once the schema is done.

Sam: How do you identify which tasks actually have dependencies and which ones you think do but don't?

Alex: Great question because that's where a lot of parallelization opportunities get missed. The checklist is straightforward. Does task B read data written by task A? Does it call functions task A defined? Does it import modules task A created? Does task B's tests depend on task A passing first?

Sam: So you're looking at actual data flow and control flow dependencies.

Alex: Yes. If the answer to all those is no, the tasks are parallelizable. If task A is writing database schema and task B is writing business logic that uses that schema, there's a dependency. But if task A is writing the validation logic and task B is writing the API routes, those can happen in parallel - they both use the same schema, but they're not calling each other's code.

Sam: Okay so you've decomposed the work. Now you're executing it. Do you always parallelize, or are there times you want sequential execution?

Alex: Depends on the situation. Sequential is best when tasks have tight dependencies, you're learning a new codebase and want to observe patterns before parallelizing, or it's a single-agent workflow. You give the agent a priority-ordered task list and it works through them.

Parallel is best when tasks are clearly independent, you have time pressure, or you deeply understand the architecture. You launch multiple agent instances - one per workstream - and they work concurrently.

Sam: What's the downside of paralleling?

Alex: There's an integration tax. When you parallelize across multiple branches, you get merge conflicts. Multiple agents might build slightly different interfaces when they should be the same. Unit tests pass independently but integration tests fail. Timing dependencies in async code cause issues.

Sam: So you can't just spin up three agents and hope they merge cleanly.

Alex: Not at all. You need clear interface contracts upfront. Agent A is building the authentication service - here's what its API looks like. Agent B is building the admin dashboard - it will call these methods with these parameters. You define that before parallel work starts.

Sam: How explicit does this need to be?

Alex: Quite explicit. TypeScript interfaces or OpenAPI specs. Don't leave it to interpretation. Here's the interface, here's what each method returns, here's what exceptions it can throw. Agent B is building the database schema. Here's the table structure, here's the indexes, here's what the migrations look like. Clear enough that agent C can write business logic against it without surprises.

Sam: And then you actually have an integration step after everything completes?

Alex: Yes, that's critical. Don't assume parallel work will merge cleanly. Budget 20 to 30 percent of parallel execution time for merging, conflict resolution, integration testing. Have explicit tasks for that. Merge in dependency order - database schema first, then business logic that depends on it, then API layer, then UI. Identify potential conflict points beforehand.

Sam: This is really about treating integration as a first-class engineering concern, not an afterthought.

Alex: Exactly. And artifacts make this verifiable. A task list, ADRs, interface contracts - these turn invisible planning into tangible deliverables. They let you track progress, communicate with stakeholders, and recover context if you get interrupted.

Sam: So if I'm starting a feature, the workflow is - ground the agent, use SPIDR to decompose, clarify ambiguities with evidence, define interface contracts, and then decide sequential or parallel execution based on dependencies and complexity.

Alex: That's the complete loop, yes. And most of that planning happens before the agent writes a single line of code. You invest 30 to 45 minutes upfront to prevent days of rework.

Sam: Does the planing change if it's one agent versus multiple?

Alex: Somewhat. With one agent, you still decompose but more to manage scope and maintain context between tasks. Sequential execution is easier - the agent sees what it built in earlier tasks. With multiple agents, decomposition is critical because they can't see each other's work unless it's committed. You need clear boundaries, interface contracts, and explicit integration tasks.

Sam: One more question - you mentioned dependencies are tricky. How do you actually determine dependency order in a complex feature?

Alex: Start with what has to exist before anything else. Database schemas usually come first - other tasks depend on reading the schema. Then the core business logic layer - the validation, the state machines, whatever drives the feature. Then the API or service layer that exposes that logic. Then UI if applicable. Then integrations - Slack notifications, webhooks, audit logs, whatever else touches this feature.

Sam: And anything at the same level can theoretically happen in parallel?

Alex: In theory, yes. In practice, some pairs have false dependencies that you need to untangle. But the principle is sound. Map out what absolutely must happen first, then identify what can happen concurrently, then have a clear integration phase at the end.

Alex: The deeper point here is that with AI agents, planning becomes your leverage point. You don't save time by skipping planning to jump straight to code - you lose days. You save time by planning well enough that the agent executes cleanly the first time.

Sam: That's a fundamentally different way of thinking about time investment.

Alex: It is. You're optimizing for total throughput - agent execution time plus integration time plus rework. And every minute spent on clear grounding, good decomposition, explicit contracts, upfront saves multiples of that in execution.

Sam: Makes sense. So the next time I'm handing off work to an agent, I need to think about whether I've actually grounded it well enough, whether the task is decomposed properly, and whether I've been specific enough about interfaces and dependencies.

Alex: Exactly. Those are the levers. Master those, and agent execution becomes predictable and fast. Skip them, and you're spending days debugging misaligned implementations.
