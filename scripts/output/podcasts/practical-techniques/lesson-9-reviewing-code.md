---
source: practical-techniques/lesson-9-reviewing-code.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-04T07:19:44.171Z
model: claude-haiku-4.5
tokenCount: 5710
---

Alex: Let's talk about code review. Most engineers treat it as a formality - you push code, someone glances at it, they approve. But code review is actually one of the highest-leverage activities you can do. When it works well, it catches bugs, maintains architecture, spreads knowledge. When it's broken, it's pure busywork on trivial things while real problems slip through.

Sam: I've definitely experienced both. I've spent hours in reviews discussing brace placement while missing a complete misunderstanding of the business logic. But here's what I'm curious about - how does AI actually fit into this? Isn't code review fundamentally about understanding intent?

Alex: That's the right instinct, but there's a critical distinction. Code review has two very different jobs happening simultaneously, and we conflate them. One job is mechanical - does this code have SQL injection vulnerabilities? Is there an N+1 query? Are there unchecked errors? The other job is contextual - does this actually solve the problem? Does it fit our architecture?

Sam: Ah, so you're saying AI should handle the first one so humans can focus on the second?

Alex: Exactly. And this changes the entire workflow. Most teams do code review wrong because they start with the assumption that the code is ready for review. They submit to CI, run tests, then a human reads it. By then, you've already wasted time on problems that should have been caught earlier.

Sam: Earlier like when? During development?

Alex: Before you even commit. This is the self-review phase, and it's where AI has the biggest impact. You've finished writing code, you've tested it locally - now before you commit, you run it past an AI agent for a critical review.

Sam: How thorough can it actually be? I mean, we're talking about spotting security issues, not just formatting.

Alex: Pretty thorough, actually. An AI agent can identify SQL injection risks, XSS vulnerabilities, auth bypasses, sensitive data exposure. It spots performance patterns like N+1 queries or inefficient loops. It catches missing try-catch blocks, unchecked return values, silent failures. It flags code smells - duplicated logic, god objects, tight coupling. All in seconds.

Sam: But that still feels surface-level compared to a human reading the code carefully.

Alex: The key word is "surface." An AI reads the code carefully in the mechanical sense. It compares against known patterns. What it can't do is understand business context. Like, is this actually implementing the requirement? Does it belong in this module? Will it confuse users? Does it behave correctly during deployments? Those are judgment calls that require human experience.

Sam: So the workflow is basically: write code, self-review with AI, fix the issues it finds, then submit to a human reviewer?

Alex: Yes, but with a specific structure. You generate what we call "atomic commits" - the smallest complete unit of change. One logical change per commit. Tests pass. Can be reverted cleanly. This is important because your commit message becomes part of your codebase's documentation.

Sam: Documentation through git history? I've worked with teams that just have one giant commit message per PR.

Alex: Which is throwing away an incredibly useful tool. Good commits tell the story of why changes happened. Bad commits are noise. Think about six months from now when you're using git bisect to track down when a bug appeared. Wouldn't you want each commit to explain clearly what changed and why?

Sam: Absolutely. So how do you keep commits atomic without ending up with a hundred commits per PR?

Alex: You need a clear structure. The industry standard is Conventional Commits - simple format that semantically versioning integrates with. Each commit type maps to a version bump. feat is a minor version, fix is a patch version, refactor doesn't bump anything because behavior doesn't change.

Sam: And the AI helps you generate these commit messages?

Alex: It should, but most AI default outputs are useless without guidance. A typical bad commit message is "update code" or "fixes issues." Completely unhelpful. A good one says something like "fix: prevent password reset from invalidating existing sessions - adds session invalidation before token generation, closes security-1543."

Sam: That's worlds different. You know exactly what the problem was and what it fixed.

Alex: Right. And you can trace it to the ticket. More importantly, when someone's debugging in three years and they git log through this area, they understand the intent. The AI can generate this, but you need to prompt it correctly. You have to give it context - what ticket is this addressing? What's the security or performance implication? Without that, it just makes up generic messages.

Sam: Let me ask about PRs though. That's where I spend most of my review time. Someone submits a PR with four or five commits. How do you review that efficiently with AI?

Alex: Same principle - separate the mechanical checks from the judgment calls. You ask the AI to analyze the PR for security issues, performance patterns, error handling, test coverage, style consistency. That's step one and it takes seconds. The AI outputs a checklist of findings.

Sam: And step two is the human review?

Alex: Step two is you focusing on what actually matters. Did this solve the problem? Does the architecture make sense? Are there UX edge cases we're missing? Could this cause issues in production? What's the operational impact? Those questions require context that code itself doesn't tell you.

Sam: That feels cleanly separated. But I'm wondering about the false positive rate. How often does AI flag something as a security issue when it's actually fine?

Alex: Depends on how you prompt it. If you say "check for security issues," you'll get a lot of noise - every use of a string flagged as potential injection. If you give it context - "this is a TypeScript GraphQL resolver using an ORM" - it's much smarter. Context matters enormously.

Sam: So it's almost like you need to train it on your specific tech stack and patterns?

Alex: Not train in the machine learning sense, but yes - you're narrowing the scope and giving it constraints. "Check this Python Flask endpoint for SQL injection, remember we use SQLAlchemy" is way better than just "check for security issues." The AI is smarter when it's not trying to be universal.

Sam: Let's go back to something you mentioned earlier - the pre-commit workflow. Walk me through that practically. I've written some code, it's tested locally. What's the AI interaction look like?

Alex: You prompt it to perform a critical review. You give it the changed code and context about what it does. The AI reads it like a security auditor would - what could go wrong here? What patterns might cause problems? Then it outputs findings. You read those findings, and most of them should be trivial to fix or dismiss based on context.

Sam: And you're doing this before you even stage the commit?

Alex: Before you even think about pushing. This is your quality gate. You catch issues that would otherwise go to CI, waste reviewer time, or worse - ship to production. It's much cheaper to fix them here.

Sam: That makes sense from an efficiency standpoint. But I'm curious about the judgment calls again. When you're reading the AI's findings, how do you know if it's actually right? Like, it flags something as a security issue - how do you validate that?

Alex: Good question, and honestly, this is where your experience matters. You have to think critically about what the AI suggests. It might flag a regex as vulnerable to ReDoS - is that actually a problem given your input constraints? It might suggest an N+1 query - but maybe that query runs once per request and isn't the bottleneck. The AI gives you information, but you have to interpret it.

Sam: So it's not blindly accepting what the AI says?

Alex: Never. The AI is like a thorough but sometimes paranoid reviewer who doesn't know your codebase. It catches things you'd miss, but it also might raise concerns that aren't real problems. You're the filter. You apply judgment.

Sam: What about the iterative part? You get feedback from the AI, you fix things, do you ask it to re-review?

Alex: Depends on the changes. If you made targeted fixes to the issues it flagged, probably not necessary - you can reason through it yourself. If you made significant changes to the code structure, it's worth asking the AI to review again. The cost is minimal and the value might be high.

Sam: Let me shift to reviewing other people's code. I suspect this is where a lot of teams might get value because reviews are so expensive - everyone waiting on someone to carefully read code.

Alex: Yeah, this is huge. Most code reviews are bottlenecks because the reviewer is doing too much mechanical work. They're checking whether variables are named consistently, whether error handling is complete, whether there are obvious security flaws. That work could be automated.

Sam: But you still have to have a human review because of architectural concerns, right?

Alex: Absolutely. But imagine this workflow: a teammate submits a PR. Before you even look at it, the AI does a pass. It flags any security issues, performance patterns, test coverage gaps, style inconsistencies. It generates a checklist. Now when you review, you already have that information. You can skip the mechanical checks and focus on whether this actually makes sense architecturally.

Sam: That would save so much time. But there's a trust question - if the AI flags something as secure, can you trust it?

Alex: No. You still need human judgment. AI is good at identifying common vulnerability patterns - SQL injection, hardcoded secrets, missing validation. It's bad at context-dependent security like authentication flow or authorization logic. You should still carefully review the actual security-critical paths.

Sam: So it's like... the AI is a really good junior developer doing the first pass of code review, and you're the experienced reviewer doing the critical thinking?

Alex: That's a good mental model. The junior developer catches the obvious stuff. You catch the subtle mistakes and the architectural problems that require understanding what the system is supposed to do.

Sam: Let me ask about a concrete scenario. Someone submits a PR adding a password reset feature. There's probably a lot of security-sensitive stuff in there. How would you use AI in reviewing that?

Alex: Perfect example because it's loaded with both mechanical issues and judgment calls. You'd ask the AI to perform a security audit specifically on authentication and password handling. That's a narrow scope so it's focused. The AI would probably find several critical issues - maybe no password hashing, maybe the reset token doesn't expire, maybe no rate limiting on the endpoint.

Sam: That's the mechanical layer.

Alex: Right. Then you, as the human reviewer, ask different questions. Is the product spec actually being met? What happens if the email address doesn't exist - does the endpoint leak information that users exist? Are we sending a notification to the old email address so users know their password changed? Is there session invalidation or do existing sessions stay active? Those are product and operational questions.

Sam: Those are great questions that I wouldn't necessarily think to ask if I was just reviewing code mechanically.

Alex: Exactly. Because you spent your attention on security mechanics, you didn't have bandwidth for those. The AI doing the first pass actually frees you to think about the system holistically. You become a better reviewer.

Sam: What about the case where the AI actually gets something wrong? Like, flags something as insecure that isn't? Does that create bad habits in teams?

Alex: It can. Which is why you have to be critical. The AI might flag every database query as potential SQL injection if it doesn't understand your ORM. Teams that blindly trust that will start making bad decisions - avoiding ORMs, adding unnecessary escaping, making code harder to read. That's when AI makes you worse.

Sam: So it really comes down to how you use it.

Alex: How you use it and how well you prompt it. Give the AI good context, narrow the scope to what matters, review its output critically. Then it's genuinely useful. Generic "check this for security" prompts on unfamiliar code - that's where AI reviews cause problems.

Sam: Let's talk about something else - commit atomicity. You mentioned that commits should be atomic, but in practice, how do you know where to split? Like, if you're implementing a feature that needs database changes, API endpoints, and frontend updates, is that one commit or three?

Alex: It's three, ideally. Database schema migration, API implementation, frontend integration. Each one can be reviewed independently. Each one should have tests that pass. Each one should be revertible.

Sam: But doesn't that make git history more complex?

Alex: It makes it more detailed, but not more complex. The trade-off is that someone looking at your changes three months later can understand the progression. They can see "database was changed to support this," then "API endpoint was added," then "UI was updated to call it." If it was one commit, you just see all three things at once with no story.

Sam: And if you need to revert one part?

Alex: You can cherry-pick or revert individual commits. If your frontend integration introduced a bug, you can revert just that commit while keeping the database and API changes. With one monolithic commit, you have to revert everything or manually fix things.

Sam: That's a compelling argument. But doesn't that require more care when you're writing code? You can't just build everything and then decide how to split it up.

Alex: It requires different discipline, yeah. But here's where AI helps - it helps you stage commits intelligently. After you've written code, you ask the AI to help you identify which changes logically belong together. You might have touched ten files, but those ten files actually represent four distinct logical changes. The AI can help you see that structure.

Sam: And then you're manually splitting them out in git?

Alex: Or using interactive staging, or git reset and re-staging. It's a bit more work upfront, but the payoff is a much cleaner history. And the work is only slightly more complex than committing everything at once.

Sam: I'm thinking about teams I've worked with where people just use squash merges and commit everything to main as one commit. They completely lose all that detail.

Alex: Yeah, that's throwing away your documentation. The only reason to squash is if you have a ton of fixup commits - like, you typo something, fix the typo, commit again. That's noise. Squash those fixups into their parent commit. But actual logical changes should be preserved. You're sacrificing future debugging ability for convenience now.

Sam: What if your team is already doing squash merges? Is it worth trying to change that pattern?

Alex: Depends on your team's values. If you're optimizing for short-term velocity and don't care about understanding history, squash merges are fine. If you value being able to debug issues, understand decisions, and do careful reviews, atomic commits are worth the investment. It's a team choice, but I lean toward valuing history.

Sam: Let me ask about something practical - how do you actually review whether someone's commits are atomic and well-written? Like, that's not something you can easily automate.

Alex: You can automate the format - linters can check that commit messages follow Conventional Commits. You can write hooks that ensure commits have the right structure. But the atomicity part, whether it actually makes logical sense - that's human judgment. You read the commit message and the diff and ask: does this make sense as a standalone change? Could I understand this months from now?

Sam: And if it doesn't meet that bar?

Alex: You ask the developer to re-organize their commits before merging. It's a learning moment. Once people understand why atomic commits matter, they usually embrace it. It feels good to have a clean history.

Sam: Let's circle back to the overall workflow because I want to make sure I have the full picture. You pre-commit with AI, you create atomic commits with meaningful messages, then someone reviews your PR. What does that PR review look like with AI assistance?

Alex: The reviewer receives a PR with multiple atomic commits and good messages. They ask the AI to do an initial analysis. AI outputs findings on security, performance, tests, style. Then the reviewer reads through the code focusing on architecture and business logic. They might ask the AI to explain specific decisions or draft review comments. Then they either approve or leave feedback.

Sam: And if there's feedback, does the original author use AI again?

Alex: Usually. You get feedback like "this password hashing doesn't match our standards," you ask the AI to fix it, then you review the change and commit it with an appropriate message. Maybe "fix: use bcrypt for password hashing instead of PBKDF2" if there's a technical reason. The AI helps you implement the feedback, but you're still deciding what to commit.

Sam: This feels like it actually increases the number of interactions around code, but in a more structured way?

Alex: Yes, but the interactions are cheaper. Instead of back-and-forth conversations about issues, you have explicit findings and fixes. The AI is a tool in those conversations but not the decision maker. You and the reviewer are still making the calls.

Sam: What about when AI gets things wrong in a PR review? Like, it flags something that's fine?

Alex: The reviewer ignores it. They're reading the AI output and applying judgment. Most good AI findings will jump out. If it's questionable, you either ask the AI to explain its reasoning, or you just dismiss it as a false positive and move on. It's advisory.

Sam: That makes sense. One thing I'm curious about though - do different teams need different review criteria? Like, a financial services company might care more about security than a startup?

Alex: Absolutely. The AI-mechanical part is mostly universal - the code should have error handling, tests should exist, obvious security patterns should be followed. But what you focus on as the human reviewer varies wildly. A financial company is much more concerned with correctness and security. A startup might prioritize shipping fast. Those priorities should shape your review process.

Sam: So you customize the AI review prompts to your context?

Alex: Exactly. "Review this for correctness and test coverage" is different from "review this for performance and scalability concerns." The AI is more useful when you narrow its focus to what actually matters for your team.

Sam: This is making me think about team dynamics too. If you have a senior engineer reviewing junior engineer code, vs. peers reviewing each other, do you use AI differently?

Alex: That's an interesting question. With junior developers, you might use AI to catch basic patterns, then focus your human review on teaching and mentoring. With peers, you're looking for subtle architectural decisions and trade-offs. The AI serves a similar role - mechanical checking - but your human focus is different.

Sam: It almost sounds like AI makes reviews more efficient but doesn't really change what you're looking for, just reorganizes who looks for what?

Alex: That's exactly right. The human values in code review remain unchanged. You still care about correctness, maintainability, security, performance. AI just handles the checklist-oriented parts so humans can focus on judgment.

Sam: Last thing I want to understand - when would you not use AI in code review?

Alex: When the issues are fundamentally non-mechanical. If you're discussing architecture - should this be microservices or monolith - that's a human conversation. If it's about product - is this the right user flow - that's a product decision. If it's team dynamics - is this person overloaded with work - that's human awareness. AI brings no value there.

Sam: So it's not a silver bullet, it's a tool for a specific job?

Alex: Exactly. The job is mechanical code quality. AI is excellent there. Outside that scope, it might even slow you down by generating plausible-sounding but unhelpful analysis. Know what you're using it for.

Sam: I think that's a really important distinction. All right, so let me summarize how I'm thinking about this: before committing, run your code through AI for a self-review. Create atomic commits with clear messages. When submitting a PR, those commits have already been vetted. Then a human reviewer gets AI-generated findings on mechanical issues and focuses their energy on architecture and business logic. And throughout, you're being critical of what AI says, not blindly trusting it.

Alex: That's exactly it. And the key insight is that this makes everyone faster and code better. The person who wrote the code catches issues before they go to review. The reviewer isn't bogged down in style discussions. Issues get found earlier, context is clearer, reviews are faster. But you've only achieved that by being intentional about separating mechanical work from judgment work.

Sam: One thing though - doesn't this require more discipline than just "I'll commit whenever"?

Alex: Absolutely. You have to invest in the workflow upfront. But the payoff compounds. After a few weeks, your git history is clean, reviews are fast, fewer bugs slip through. That's worth the initial investment.

Sam: I think this would be transformative for a lot of teams. The review process feels like such a bottleneck in practice.

Alex: It is, but most teams don't realize how much of the bottleneck is mechanical busywork. Once you automate that, you unblock everything else. Your code is better, people learn faster from reviews, and it's actually more enjoyable because you're talking about the interesting parts, not arguing about commas.

Sam: I appreciate that perspective. So the practical takeaway is: get disciplined about pre-commit reviews, atomic commits, and using AI strategically in PR reviews - and suddenly code review becomes a high-leverage activity instead of a bottleneck?

Alex: That's the idea. Code review is already high-leverage if you do it well. AI just makes it possible to actually do it well consistently instead of getting buried in mechanical issues.

Sam: Makes sense. Thanks for walking through that.

Alex: Thanks for the questions. They forced me to be specific about when and how AI actually helps, which is the hard part.
