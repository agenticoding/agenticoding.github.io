---
source: practical-techniques/lesson-8-tests-as-guardrails.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-04T07:19:33.004Z
model: claude-haiku-4.5
tokenCount: 4767
---

Alex: So we've been talking about delegating work to AI agents, and at some point you have to ask - how do you actually trust what they produce? You can't manually review every line of code they generate. That defeats the whole purpose of using an agent in the first place.

Sam: Right, that's the elephant in the room. I think a lot of engineers are nervous about exactly that. If I'm not reviewing the code, how do I know it's actually correct?

Alex: Exactly. And there are three options people usually consider. The first is what I call the manual verification trap - the agent generates code, you review every line like you would in a normal code review, then you ship it. But that just moves your bottleneck from writing code to reading code. You haven't really gained anything.

Sam: So you're back to being the blocker on every task the agent does.

Alex: Precisely. Option two is the opposite extreme - you trust the agent completely and ship whatever it produces. Zero verification. And I'll be blunt, that's professionally irresponsible. You *will* get production incidents.

Sam: That's a non-starter. So option three must be the answer here.

Alex: It is. Automated tests. The agent generates code, your test suite runs automatically, and the code ships only if everything passes. That's the only approach that actually scales.

Sam: But isn't that just pushing the problem somewhere else? Now you have to write really good tests first.

Alex: Yes, and that's actually the key insight. You're absolutely right that tests have to be comprehensive. But think about it differently. Tests aren't just verification anymore - they become your specification language. They define the operational boundaries within which an agent can safely work.

Sam: Like guardrails on a mountain road.

Alex: Exactly that. A CNC machine doesn't get manual oversight for every cut it makes. It has constraints - the tool can only move within these bounds, only apply these forces, only cut these materials. Within those constraints, it runs autonomously. Tests work the same way for agents.

Sam: So the tests have to be thorough enough to catch regressions, specification violations, performance problems...

Alex: Right, all of that. And security requirements too. If you've got a test that verifies authentication is enforced, the agent can't ship code that violates that without the test failing. The test is the hard constraint.

Sam: Which means once you have those guardrails in place, the agent can iterate independently. It doesn't need you in the loop for happy path execution.

Alex: Now you're getting it. Your workflow becomes: specify the feature with tests, the agent implements and runs tests, and if green, it moves forward. You're only involved if tests fail in ways the agent can't resolve, or for architectural decisions.

Sam: That's a pretty significant shift in how you'd work with these systems. Most of what I've seen is much more interactive.

Alex: It is, and I think that's because people haven't fully trusted the test automation yet. But here's where TDD becomes really powerful - Test-Driven Development naturally constrains agent behavior to safe operations.

Sam: Walk me through that cycle.

Alex: So first, you write a failing test. This is the human's job. You're encoding the business requirement or the security constraint into an executable test. The agent doesn't write this test because agents can hallucinate - they can write a test that passes for completely wrong reasons, or they can write a test that's too weak to actually verify correctness.

Sam: So you're the specification writer.

Alex: Exactly. You say "here's what correct behavior looks like." Then the agent's job is to write minimal code to make that test pass. It runs the tests, sees them fail, iterates on the implementation.

Sam: And once the test passes?

Alex: Once the test passes, the agent can refactor. And because the tests are passing, the agent knows it hasn't broken anything. It can confidently improve the design, simplify the code, make it more maintainable, all while tests stay green.

Sam: That's the safety net. The tests don't change, so if behavior breaks, you know immediately.

Alex: Right. And here's the thing - this doesn't actually require constant human interaction. An agent can handle the red-green-refactor cycle almost entirely on its own. Write test, fail, implement, pass, refactor, still pass. It goes through that cycle repeatedly without ever asking you a question.

Sam: But what happens when a test does fail and the agent can't figure out why?

Alex: That's where the debug workflow comes in. And I think this is important - agents are actually pretty good at debugging test failures. They can read the error output, hypothesize about what went wrong, try a fix, run tests again.

Sam: So they iterate on their own fix.

Alex: Yeah. They might look at a test failure and think "oh, I'm not handling the null case" or "I'm missing a database migration" or something. They generate a hypothesis, try it, see if tests pass. Most failures resolve autonomously this way.

Sam: And when it doesn't?

Alex: When the agent genuinely gets stuck - maybe the test failure is ambiguous, or it needs architectural context it doesn't have - that's when it escalates to you. You provide that context, and the agent continues. But the key is agents only escalate when they really need to.

Sam: That's a meaningful difference from "ask the human every time something goes wrong."

Alex: Huge difference. The agent is trying to solve problems, not asking permission. It's more autonomous.

Sam: So all of this relies on the test suite being good enough. How do you make sure your tests are actually catching the bugs you care about?

Alex: That's a really good question. One approach is mutation testing. You intentionally introduce bugs into the code - change an equals to a less-than, flip a boolean, that kind of thing - and see if tests catch them.

Sam: So you're validating that your tests are strong enough.

Alex: Yeah. If you introduce a bug and tests don't catch it, you've got a gap. An agent will happily commit code that passes weak tests, and that code will fail in production.

Sam: Right. The tests don't fix themselves just because you're using an agent.

Alex: Correct. Though I will say, agents can help improve test coverage. You can prompt an agent to look at code and add test cases for scenarios that aren't covered. It becomes a collaborative process.

Sam: Let's talk about CI integration. Because all of this feels more powerful if it's enforced automatically rather than relying on the agent to run tests manually.

Alex: Yes. A pre-commit hook can run your test suite before the agent even tries to commit. If tests fail, the commit is rejected, the agent gets feedback, iterates.

Sam: And pull request checks do the same thing at the repository level.

Alex: Right. PR checks run the full test suite on every PR. The agent creates a PR, tests run automatically, and if anything fails, the PR is blocked. The agent sees that it's blocked, investigates why, fixes it, pushes again.

Sam: That seems pretty reliable for preventing broken code from reaching main.

Alex: It is. And you can also enforce coverage thresholds. Say your project requires 85% code coverage. An agent's implementation drops below that? Tests fail. The agent knows it has to add more test cases. It's a hard constraint.

Sam: So the test suite is both verification and enforcement.

Alex: Exactly. Tests tell the agent what to do and verify when it's done it correctly.

Sam: I think most engineers are building test suites for humans, not for agents. The structure might be different.

Alex: That's a smart observation. Think about the test pyramid - unit tests at the bottom, integration tests in the middle, end-to-end tests at the top. For agent work, you want to maximize fast feedback loops at the bottom. Unit tests are quick, agents iterate quickly, they see failures immediately.

Sam: Why does that matter for agents specifically?

Alex: Because agents are working at machine speed. If you have unit tests that take 30 seconds to run, the agent's waiting 30 seconds between iterations. If integration tests take five minutes, that's a big delay in the feedback loop. But unit tests that run in milliseconds? The agent can iterate rapidly, try different approaches, converge on a solution.

Sam: So you'd tune the test pyramid differently for agent work than for human code review.

Alex: You'd weight it more heavily toward fast unit tests, yeah. And you'd make sure integration tests are actually testing meaningful integration points, not just slow versions of unit tests.

Sam: Let's go back to something earlier - you mentioned agents can't be trusted to write tests. Why is that exactly?

Alex: Because an agent can generate a test that passes for the wrong reasons. I've seen agents write tests like "assert result is not null" when what you actually need is "assert result equals this specific value." The first test passes even if the code is broken.

Sam: So the test looks like it's working but it's not actually verifying anything.

Alex: Right. It's a false sense of security. The test passes, the agent thinks it's done, ships the code, and it fails in production because the test never actually validated correctness.

Sam: That's why you have to write tests.

Alex: Exactly. Tests encode your understanding of what correct looks like. You know the business requirements, the security constraints, the performance expectations. You translate that into tests. Then the agent's job is to write code that satisfies your specification.

Sam: So the division of labor is really clear - humans specify, agents implement.

Alex: That's the model, yeah. And I think it's a good one because it plays to the strengths of each. Humans are good at understanding intent and writing specifications. Agents are good at converting specifications into code.

Sam: What about the refactoring piece? Can agents actually do that safely?

Alex: They can, as long as tests are passing. The agent's instructions are simple: improve the design, make it more readable, whatever - but keep tests passing. If the agent changes something that breaks a test, it learns immediately and fixes it.

Sam: And the human doesn't have to review the refactoring.

Alex: Right, because the tests are your proxy for correctness. The code can change completely, but as long as tests pass, behavior hasn't changed.

Sam: That seems like it would free up a lot of time for architects to focus on actual architectural decisions rather than reviewing implementation details.

Alex: That's the idea. You're reviewing for "is this the right approach?" not "is this line of code formatted correctly?" Those are very different conversations.

Sam: I'm trying to think about what could go wrong with this model. What if the test suite is incomplete?

Alex: Then you have gaps. And you might ship code that passes tests but fails in production. That's why mutation testing and coverage requirements matter. You have to build confidence that your tests actually catch the things you care about.

Sam: So this isn't a "set it and forget it" thing. You have to continuously maintain and improve the test suite.

Alex: Yes. Though I'd say it's still less work than continuously reviewing code. A test is written once. A piece of code might be reviewed dozens of times over its lifetime. Tests scale better.

Sam: What about performance constraints? How do you test those with agents?

Alex: You write a performance test. "This operation must complete in under 100 milliseconds." The agent implements the feature, runs the test, and either it passes or it doesn't. If it doesn't, the agent has to optimize.

Sam: And the agent can see the failure and understand what needs to happen.

Alex: Right. It's concrete feedback. Not "make this faster" but "this test requires you to be under 100ms."

Sam: Let's talk about the scenario where an agent is actually debugging a test failure. What does that look like in practice?

Alex: So imagine an integration test fails. The test is trying to verify that when you update a feature flag, cached values invalidate. The test fails because the cache isn't actually being cleared.

Sam: And the agent sees the test output saying the cache still has the old value.

Alex: Exactly. The agent reads that output and thinks "okay, when we update the flag, something should trigger a cache invalidation. Let me look at the code." It might hypothesize that there's a missing event listener or a missing function call. It generates a fix, runs tests again.

Sam: And either tests pass and it's done, or tests fail again and it tries something else.

Alex: Right. And it can do this loop very quickly. Fail, hypothesize, fix, retry, repeat.

Sam: How many iterations before you'd consider an agent actually stuck?

Alex: That depends on the problem complexity. For straightforward bugs - off by one errors, missing function calls - agents usually fix it in a few iterations. For something that requires deeper architectural understanding, maybe it gets stuck after five or ten attempts.

Sam: And then you step in.

Alex: Then you step in. You might say "the issue is that you're not considering the case where the flag value is a function instead of a boolean" or "you need to hook into this existing event system we have." You provide context, the agent continues.

Sam: Which is more valuable use of your time than reviewing every line of code they wrote.

Alex: Significantly more valuable. You're mentoring the agent through a specific, concrete problem rather than reviewing implementation details.

Sam: I'm wondering about test maintenance. If the codebase is changing, don't tests need to be updated?

Alex: Yes, they do. And that's a human responsibility too. You own the test suite. When requirements change, you update tests. When you discover a bug, you write a test for it, then fix the code. TDD discipline applies.

Sam: So agents don't write tests, they don't maintain tests, they just make tests pass.

Alex: That's the model. Humans guide, agents execute within those guardrails.

Sam: One thing I'm curious about - you mentioned mutation testing. Is that something you'd expect an agent to run, or is it more of a periodic human activity?

Alex: I think it's something you'd run periodically as a check on test quality. Mutation testing is computationally expensive - it runs thousands of variations of your code. Not practical for agents to do that every iteration.

Sam: But it's a good quarterly or annual practice to make sure your guardrails are actually working.

Alex: Exactly. You'd run it, find gaps in test coverage, maybe prompt an agent to help fill those gaps. It becomes part of your test maintenance routine.

Sam: Let me ask about the practical setup. If I'm going to delegate code work to agents with tests as guardrails, what's the minimum I need in place?

Alex: At minimum? A test suite that covers the core behavior you care about. Not necessarily 95% coverage, but the critical paths. Then a simple CI setup - GitHub Actions running tests on every commit and PR.

Sam: And an agent that knows to run tests locally before committing.

Alex: Right. Or you could make it completely automatic with a pre-commit hook. The agent tries to commit, hook runs tests, if they fail, commit is rejected. Agent doesn't even get the chance to break main.

Sam: That sounds pretty safe.

Alex: It is. You're preventing accidents rather than catching them after the fact.

Sam: So the really hardcore version of this would be - agent creates PR, tests run in CI, if all green, automatically merge?

Alex: You *could* do that. I'd be cautious without strong coverage and comprehensive test suite, but yes, that's the logical endpoint.

Sam: That's pretty autonomous.

Alex: It is. And I think it's achievable with discipline around test quality. The tests have to be good enough to be your specification. If you have high confidence in tests, you can have high confidence in automation.

Sam: What about tests that are flaky? That seems like it would break this whole model.

Alex: It would. A flaky test that fails intermittently means you can't trust it as a guardrail. The agent might think code is broken when it's actually fine, or code might be broken and tests pass sometimes.

Sam: So you'd need to fix flaky tests before this workflow is reliable.

Alex: Absolutely. Flaky tests are technical debt that becomes critical when you're using tests as your verification mechanism.

Sam: That's a good point for teams to consider. You can't just inherit a legacy test suite and expect this to work.

Alex: No. You need to understand your test suite, build confidence in it, maybe modernize it. It's an investment. But it's an investment that pays off.

Sam: I think the mindset shift is the hardest part. Most engineers think of tests as verification, something you do to catch bugs. But here you're talking about tests as specification.

Alex: Exactly. Tests define what the agent is supposed to build. Here's the behavior we need, prove it with tests, then make tests pass. It's a different way of thinking about code.

Sam: And it changes how you communicate with agents. Instead of describing a feature in prose, you're describing it in code.

Alex: Right. "Build a feature flag system" is vague. But a comprehensive test suite that shows exactly how flags should behave in different scenarios? That's precise. Unambiguous.

Sam: That actually seems like it would lead to better implementations, even if a human was writing the code.

Alex: I think it would. Specification-by-test is a good discipline. It forces you to think concretely about edge cases.

Sam: Alright, last thing - how do you communicate this to agents? Like, what does a prompt look like that sets this up correctly?

Alex: You'd typically give the agent the test suite first. "Here are the tests that define correct behavior. Make all tests pass. You can refactor once tests are green. If you get stuck, explain what you're stuck on."

Sam: So the tests come before the prompt for implementation.

Alex: Yeah. The tests are the ground truth. The prompt is secondary.

Sam: That's different from most agent workflows I've seen where you just describe what you want.

Alex: It is, and I think that's the evolution. Early agent workflows were more conversational. But as you scale agent work, tests become essential.

Sam: Makes sense. Once you're delegating serious code work, you need objective criteria for success.

Alex: Right. A test passing is objective. A code review comment is subjective. If you're trying to scale autonomous execution, you need objective.

Sam: I think that's the core insight here. Tests aren't just about catching bugs - they're about defining a contract that an agent can work within.

Alex: That's it exactly. They're the operational boundary. And within those boundaries, the agent is free to work autonomously.
