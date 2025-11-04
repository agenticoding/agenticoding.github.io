---
source: practical-techniques/lesson-10-debugging.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-04T07:18:33.808Z
model: claude-haiku-4.5
tokenCount: 4197
---

Alex: Let's talk about debugging with AI agents. And I want to start by saying what debugging with AI is *not*. It's not pasting your code and asking "what's wrong with this?" That's how most people start, and it usually doesn't work.

Sam: Right, I've definitely done that. Usually you get back some generic suggestions about null checks or missing error handling, and none of it actually solves your problem.

Alex: Exactly. Because the agent has no context. It's operating in a vacuum. Real debugging—especially in production—requires a completely different approach. It's about systematically placing agents into diagnostic environments where they can actually *observe* what's happening.

Sam: So you're saying the agent needs to be able to look at the actual runtime state? Logs, memory, that kind of thing?

Alex: Precisely. We need to think about this like the scientific method. You observe, you form a hypothesis, you reproduce the problem in isolation, you test your hypothesis, and only then do you apply a fix. And critically, you verify the fix actually works.

Sam: That's five steps before you even touch the code. In my experience, most debugging is people skipping straight to step five.

Alex: And that's why production bugs are so persistent. Developers fix what they think is wrong, deploy it, and the problem resurfaces because they never actually verified the root cause. When you're working with an AI agent, you can't skip those steps—the agent simply won't have the information it needs to help you.

Sam: So let's talk practically. If I have a production issue and I want to bring in an AI agent, where do I start?

Alex: You start with observation. Collect your data. That means structured logs—logs that an agent can actually parse and understand. Not just wall-of-text output, but logs with consistent structure, timestamps, error codes, request IDs that let you trace execution.

Sam: What about static analysis? Do you look at the code first?

Alex: You look at the code path that matters. Here's the key principle: give the agent the full execution path. If you have a bug in a payment calculation, don't just show the calculation function in isolation. Show the agent the entire call chain—where the data comes from, what transformations happen, where it's stored, everything.

Sam: Because the bug might not be in the calculation itself. It might be garbage data coming in, or the data being corrupted somewhere along the pipeline.

Alex: Now you've got it. I worked on a system once where we had a pricing bug. Numbers were coming out wrong for about 2% of transactions. The obvious place to look was the calculation logic, and the code was correct. The bug was actually in how we were reading from the cache. We were cache-hitting on incomplete data because of a race condition in the cache invalidation, not the calculation itself.

Sam: If you'd just shown an agent the calculation function in isolation, it would have been useless.

Alex: Completely useless. Which is why I say: give agents the full execution path. But that's static analysis. For things you can't reproduce locally, you need dynamic inspection.

Sam: What does that look like?

Alex: Create debug scripts that the agent can run against your system. Maybe it's a script that queries your database, or one that pulls recent logs matching certain criteria. The agent runs these scripts, sees the actual output, and can reason about what's really happening in your system.

Sam: So instead of describing your system to an agent, you give it the ability to query it directly.

Alex: Yes. And this is where reproducibility becomes critical. The best-case scenario is you can reproduce the bug locally. You create an isolated environment—often with Docker—that captures production state and lets you trigger the problem repeatedly.

Sam: Isolation is the key there, right? You need to separate the bug from all the other noise in your system.

Alex: Exactly. Docker is perfect for this because you can capture your entire environment. Your API code, the database, the dependencies, the configuration—everything in one reproducible package. And crucially, you can add instrumentation to that environment. Heap dumps on OOM, detailed logging, monitoring hooks—all things you might not want in production but are invaluable for debugging.

Sam: What if you have a bug that's genuinely hard to reproduce? I'm thinking about something like memory leaks that take hours to manifest.

Alex: That's where load testing comes in. You create a Docker environment that mirrors your production setup, you run a load test script that simulates traffic patterns, and you monitor memory usage over time. The bug will eventually surface because you're driving the same code paths your production system drives.

Sam: And while it's running, you can capture heap snapshots, database state, connection counts—everything the agent needs to diagnose what's happening.

Alex: Right. You're building a diagnostic environment. The agent's job is to analyze what's happening in that environment. And here's what I really want to emphasize: the agent should have direct access to that data. Not a verbal description of it. The actual logs. The actual database queries. The actual heap dumps.

Sam: Because an agent analyzing raw data is much more reliable than an agent trying to reason about a secondhand description of data.

Alex: Enormously more reliable. I've seen agents miss obvious patterns in logs when they're given a summary, but spot them immediately when they can see the raw output.

Sam: So we've got observation, we've got reproduction. How do agents help with the hypothesis-testing part?

Alex: This is where it gets interesting. Once you have a reproducible environment and diagnostic data, you can ask the agent to form hypotheses about root cause. But here's the discipline: the hypothesis has to be *testable*. It can't just be "maybe there's a null pointer somewhere." It has to be "the null check is missing at line 47, and here's the code path that would trigger it."

Sam: And then you test it by running the reproduction environment again, watching whether that code path actually executes, and checking whether the issue still occurs when you add the fix.

Alex: Now you're thinking like a debugger. And this is where most developers make their second mistake: they accept the agent's proposed fix without verification. The agent suggests something plausible, they apply it, they redeploy, and if the issue goes away, they assume it's fixed.

Sam: But what if the issue went away for a different reason? What if there was a deployment artifact, or a transient load spike resolved?

Alex: Exactly. You need evidence. Reproducible, verifiable evidence that your fix actually solves the problem. That means running your reproduction environment before and after the fix. Comparing metrics. Running regression tests. Making sure you haven't introduced new problems.

Sam: And you mentioned every fix needs a regression test?

Alex: Non-negotiable. If you fixed a bug, you need a test that would have caught it. That test goes into your CI pipeline. So if anyone breaks that code path again in the future, you catch it immediately.

Sam: That's the discipline part. It's easy to skip when you're under pressure to fix production issues quickly.

Alex: But that's exactly when you need it most. Because if you deploy a fix without verification and it doesn't actually work, you've now made your situation worse. You've changed production code without confirming the fix, and the original problem is still there. You're flying blind.

Sam: Let's walk through a concrete scenario. Say I have a memory leak in production. API is crashing after 6-8 hours of uptime. How would I actually approach this with an agent?

Alex: First, you set up your reproduction environment. Docker Compose with your API, your database, your monitoring stack. Prometheus for metrics, Grafana for visualization. You configure Node to dump heap snapshots on OOM so you capture what was in memory when it crashed.

Sam: Then what?

Alex: You create a load test script that simulates production traffic patterns. Real requests to real endpoints. You run that for 24 hours or until the memory leak manifests. And you're monitoring the whole time—capturing heap snapshots every hour, checking database connections, looking at event listeners.

Sam: So the agent has this raw diagnostic data to work with. Heap snapshots, connection counts over time, event listener growth, all visible.

Alex: And the agent analyzes these snapshots. "I see event listeners growing unbounded on this socket connection handler. Every request adds a listener but they're never being cleaned up." Or "database connections are accumulating because we're not closing them after each request." Concrete observations from concrete data.

Sam: Then you test the hypothesis by looking at the code path that would cause that behavior.

Alex: Right. You review the actual code handling those socket connections or database cleanup. You identify where the leak is. You propose a fix—usually something simple like adding a cleanup handler or ensuring connections are properly closed. Then you modify your reproduction environment, run the test again, and confirm memory stays stable for 24 hours.

Sam: Before you deploy to production.

Alex: Before you even push to main. And you've written a test that would catch this if someone breaks it again. Something that spins up connections and verifies they're being cleaned up properly.

Sam: What about situations where you can't fully reproduce the bug locally? Say it's some weird interaction with a production database state you can't easily recreate?

Alex: That's where you create read-only access for debugging. Safe queries against production that let the agent inspect state without risking anything. Never give the agent write access to production. Never. But read-only queries? Those are invaluable.

Sam: You could have a script that dumps relevant database state at the time of failure?

Alex: Exactly. Your production system logs when this error occurs, and you have a companion script that takes a timestamp and runs diagnostic queries at that same moment. "Show me all orders that were being processed at this time. Show me the state of the payment processor integrations. Show me what was in the cache."

Sam: And the agent analyzes that snapshot of production state?

Alex: Yes. It's like taking an autopsy of your system at the moment of failure. You get the forensic data the agent needs without risking production with exploratory commands.

Sam: I'm struck by how much of this is about creating the right infrastructure for debugging before the bug even happens.

Alex: That's the insight. Good debugging isn't something you figure out when a crisis hits. It's something you design into your system from the beginning. You write logs that tell a story. You design your monitoring to capture what matters. You build your systems to be inspectable.

Sam: So when an issue does occur, you already have the diagnostic tools ready.

Alex: And your team knows how to use them. They know how to trigger the reproduction environment, how to interpret the logs, what metrics to look at. The agent becomes a partner in that investigation, not a substitute for it.

Sam: What if I'm debugging something that's partially understood? Like I know it's slow, but I don't know why?

Alex: Same scientific method. You instrument the code path to understand where time is being spent. Add timing measurements. Capture database query times. Look at API latencies. Build a profile of where the slowness actually is. Then give that profile to the agent.

Sam: And the agent analyzes the profile and suggests where to optimize.

Alex: But again, with verification. The agent might suggest database indices, or caching strategies, or algorithm improvements. You implement one, measure the impact, and confirm it actually improves the metric you care about. Because it's easy to optimize something that doesn't matter.

Sam: I've definitely been guilty of that. Spending hours optimizing a code path that runs once per minute when the real bottleneck is something that runs constantly.

Alex: Profiling tools prevent that. Show the agent actual execution profiles. Where time is being spent. What's being called repeatedly. The agent's analysis becomes much more valuable when it's grounded in data about what actually matters.

Sam: So to summarize: observation first, then hypothesis, then reproduction, then testing, then fix, then verification. Every step has evidence.

Alex: And every step benefits from an agent partner because agents are good at synthesizing complex data. They read logs well. They spot patterns. They reason about state transitions. But they need real data to work with. Raw logs, heap dumps, query results, profiling data. That's their language.

Sam: Not descriptions of data or estimates or "I think this is what's happening."

Alex: Never. Descriptions introduce guesswork, and guesswork is the enemy of debugging. You want evidence every step of the way.

Sam: What happens if the agent's analysis seems plausible but the fix doesn't actually work?

Alex: Then you've learned something. The hypothesis was wrong. You gather more data. Maybe the memory isn't leaking where you thought. Maybe it's a different code path entirely. You form a new hypothesis and test that one.

Alex: The agent helps you iterate through hypotheses faster because it can analyze complex data quickly. But you're still in control. You're still applying rigor. You're not just accepting the first plausible explanation.

Sam: And that's the discipline that prevents deployed fixes that don't actually work.

Alex: Exactly. And it's the discipline that prevents shipping regressions. Because you tested before deploying. You verified the fix actually resolves the original issue without breaking anything else.

Sam: There's a theme here about leverage. The agent makes you better at debugging by being a faster analyzer of complex data, but the human still drives the methodology.

Alex: That's the right mental model. The agent is your systematic investigator. It's patient. It won't get tired or distracted. It will methodically analyze everything you throw at it. But you set the questions it investigates. You decide if its analysis makes sense. You verify its conclusions.

Sam: And you build the diagnostic infrastructure that makes that investigation possible.

Alex: In the real world, I've seen debugging mistakes that cost weeks of production issues because the team skipped reproducibility. They'd patch something, it would seem to help, then the issue would resurface in a slightly different form. They were chasing symptoms instead of root cause.

Sam: Because they never built a reproduction environment where they could reliably trigger the bug.

Alex: Right. Every debugging session started from scratch. They'd gather logs, form a hypothesis, apply a fix, and hope it worked. And when it didn't, they'd start over from the beginning.

Sam: If they'd invested in reproducibility upfront, they could have solved it in a fraction of the time.

Alex: And the agent would have been significantly more useful because it would have had concrete data to work with. That's the real leverage point.

Sam: So the practical advice for anyone debugging a production issue with an agent is: invest in reproducibility first. Docker, load tests, instrumentation. Get the agent access to real data. Then let it help you analyze what's happening.

Alex: And demand verification at every step. If the agent says "this will fix it," don't believe it until you've proven it. Run the reproduction before and after. Compare the metrics. Make sure the fix is real.

Sam: And write the regression test so it can't happen again.

Alex: So it can't happen again. That's the part that saves you from spending weeks on the same bug twice.

Sam: This feels like the opposite of quick-fix culture.

Alex: It is. But quick fixes in production debugging are usually expensive. They're expensive because they don't work, so you have to fix them again. Or they work for a while, then resurface. Or they introduce new problems. The upfront investment in systematic debugging saves you months of maintenance pain.

Sam: Alright, I think the key takeaway is clear: give agents diagnostic environments and raw data, not just code and descriptions.

Alex: And apply the scientific method. Observe, hypothesize, reproduce, test, fix, verify. Every step has evidence. Every fix has a regression test. That's production debugging with AI agents.

Sam: Much better than "what's wrong with this code?"

Alex: Infinitely better.
