---
source: practical-techniques/lesson-10-debugging.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-05T06:44:18.243Z
model: claude-haiku-4.5
tokenCount: 2227
---

Alex: So let's talk about debugging with AI agents. And I want to start by pushing back on something we see a lot. Most engineers treat this like consulting - they paste code and ask "what's wrong with this?" That's backwards. Real debugging with AI is about building a diagnostic environment where agents can actually observe what's happening, reproduce the issue themselves, and verify fixes with evidence.

Sam: That sounds like the scientific method we learned in school but actually forgot to apply in production. Observe, hypothesize, reproduce, test. Why does that feel so different from how we typically debug?

Alex: Because in production, we're usually flying blind. We get a bug report - "the API is slow" or "users are seeing errors" - and we don't have access to the full context. So we guess. The agent guesses. You end up in this cycle of "try this, let me know if it works." With AI, we can actually be systematic. We can give agents access to logs, database state, runtime metrics - the full diagnostic picture.

Sam: So the difference is whether the agent is debugging from a description versus debugging from actual evidence. If I just paste a stacktrace and ask "what's wrong?", I'm making the agent work with incomplete information.

Alex: Exactly. And here's where it gets interesting - agents are surprisingly good at reading runtime state if you give them structured access. The first step is static analysis. Give the agent the full execution path - not just the failing function, but the whole chain of how data flows through your system. Let them understand the architecture before you ask them to find the bug.

Sam: How much context is actually useful there? I can imagine dumping your entire codebase becomes noise.

Alex: That's the key insight. You're not dumping everything. You're giving them the path that matters. If a database query is timing out, show them the query, the schema, the indexes, the actual execution time - not your entire Rails app. Focus is everything. Same reason a cardiologist doesn't ask for your medical history dating back to childhood. They ask for the relevant tests.

Sam: So for a production issue that can't easily be reproduced locally - a memory leak that only happens under load, or a race condition that happens once a week - how do you actually set that up for an agent?

Alex: Docker is your best friend here. You create an isolated environment that captures the conditions that trigger the bug. For your memory leak example, you'd set up a container with your Node.js process, add load testing, capture heap snapshots over time. The agent can then see the memory growth, analyze the heap dumps, and form a hypothesis. But the critical part is reproducibility. If you can't consistently reproduce it, you can't verify the fix.

Sam: I'm thinking about this practically - setting that up for a complex distributed system sounds heavyweight. Is it always necessary?

Alex: Fair question. For some bugs, no. A simple null pointer exception where you have a clear stack trace? The agent can usually spot that. But for anything production-related, anything that's intermittent or state-dependent - yeah, reproducibility is non-negotiable. Because you can't accept "this should fix it." You need evidence.

Sam: That's probably where a lot of debugging goes wrong. We accept a plausible explanation because it sounds right, deploy it, and hope. How do you actually set up this evidence requirement?

Alex: Create a verification protocol. Before you accept a fix, the agent needs to show three things. First, a before-and-after comparison - heap profiles, query timings, error logs. Second, the fix actually passes the regression test that would have caught the original bug. Third, general tests still pass and there's no performance regression. You make this part of the workflow, not an afterthought.

Sam: So the agent proposes a fix, you don't just review the code - you review the evidence that the fix actually works?

Alex: Right. And this is where it gets really valuable. An agent can write a verification script that proves the fix works. Not just "I ran the tests" - but "I ran 8-hour load tests before and after, here's the memory profile comparison, here's the performance impact analysis." That's evidence. That's when you can actually be confident.

Sam: Let me push on this a bit. What's the risk of being too strict with the evidence requirement? Don't you slow down the debugging process?

Alex: Short term, maybe. But you're not slowing down debugging - you're accelerating it. If you deploy a bad fix, you're back to debugging square one. Every day in production with an unresolved issue is a day you could be deploying a verified fix. And here's the thing - once you have the verification infrastructure in place, it becomes automatic. The agent runs the tests, compares the metrics, generates the report. It's not manual.

Sam: What about those issues that are really hard to isolate? Like a subtle race condition in a distributed system, or intermittent bugs that might be environmental?

Alex: That's where you build inspection tools specifically for those scenarios. If you have a connection pool leak, create a script that agents can run to query the current state of connections, trace where they're being opened and closed, look for patterns. If you have a caching issue, build tooling to inspect cache state in real-time. These aren't one-off debugging scripts - they're permanent infrastructure.

Sam: So you're essentially building debugging as a first-class system, not as something you do when things break.

Alex: Exactly. And this is where remote debugging with production systems comes in. You can't always fully reproduce production state locally. So you create safe, read-only access to production data. Structured queries that agents can run, log streaming that agents can analyze. You maintain safety - agents never write, never modify state - but they get the evidence they need.

Sam: That makes sense for critical systems. But there's a skill gap here, right? Not every team knows how to build that infrastructure.

Alex: True. But it's learnable. Start simple. For your next production bug, build one inspection script. Something that captures the data you need. Let an agent analyze it. See what it finds. Then iterate. You'll quickly figure out what access patterns your agents need, what logs matter, what database queries are actually useful for debugging. It becomes a practice.

Sam: So the lesson isn't "do all of this perfectly from day one." It's "start thinking about debugging as something you build tools for."

Alex: Exactly. And every bug is an opportunity to improve your debugging infrastructure. That memory leak you had to debug manually? Build a memory profiling system so the next one is faster. That race condition that took three days to track down? Add instrumentation around synchronization points. You're building toward a system where the agent has everything it needs to investigate independently.

Sam: That also means every fix needs a regression test.

Alex: Non-negotiable. The regression test is how you prevent the same bug from coming back. It's also how you verify that future changes don't reintroduce the issue. An agent can write this - actually, agents are often better at it than humans because they think about edge cases more systematically. The protocol is simple: if the agent proposes a fix, it proposes a regression test that would have caught the original bug.

Sam: And if the test doesn't actually catch the bug?

Alex: Then the test is wrong, or the fix is wrong, or both. That's the power of this approach. You're not guessing. You write a test that fails with the bug, apply the fix, verify the test passes. Everything is concrete.

Alex: Let me tie this together. The debugging mindset with AI is fundamentally different from traditional debugging. It's not "paste code, ask for help." It's "build a diagnostic environment, give the agent access to evidence, require proof before accepting solutions." The agent becomes your systematic investigator, but only if you give it the right tools and demand rigor.

Sam: So if someone's struggling with using AI for debugging - they're getting vague answers or fixes that don't work - the issue is probably that they're treating it as a consulting conversation instead of a system.

Alex: Hundred percent. Build the system. Collect the data. Give the agent access. Require evidence. Do that, and you'll be amazed at how effective agents are at debugging.

Sam: And practically speaking - where should someone start?

Alex: Pick your next production bug. Instead of trying to solve it immediately, spend time building one good inspection tool. A script that captures the state you need. Let an agent analyze it. See what happens. You'll learn more from that than from a hundred generic debugging tips.
