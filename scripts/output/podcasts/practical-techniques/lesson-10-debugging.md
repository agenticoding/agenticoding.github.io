---
source: practical-techniques/lesson-10-debugging.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-09T18:04:31.218Z
model: claude-haiku-4.5
tokenCount: 2391
---

Alex: Let's talk about debugging with AI agents. And I want to start with a fundamental shift in how you think about the process. Most engineers, when they hit a bug, they describe the symptom to whatever tool they're using—could be a person, could be an agent—and hope for a solution. With AI agents, we need a completely different approach.

Sam: Different how? What changes?

Alex: The core principle is moving from "what do you think is wrong?" to "prove the bug exists, then prove your fix works." AI agents are incredibly good at pattern recognition and systematic investigation when you give them concrete data. But they fail catastrophically when forced to speculate.

Sam: So you're saying blind diagnosis doesn't work.

Alex: Right. The anti-pattern is describing a bug and asking the agent to fix it. No context, no reproduction steps, no evidence. The production pattern is: provide reproduction steps, give the agent access to diagnostic tools, and require before-and-after proof. Evidence at every step.

Sam: That makes sense, but where do you actually start? Code inspection? Logs? Both?

Alex: Start with code inspection—but strategically. Before you dive into logs or start running reproduction steps, have the agent explain the architecture and execution flow. Ask it to trace request paths, explain data flow, identify potential failure points based on the code structure.

Sam: Isn't that inefficient if the bug is buried in a specific edge case?

Alex: Not if you're smart about it. You're not asking the agent to read every line of code. Use semantic code search and research tools to find relevant components, then focus the conversation on critical paths. Something like: "Trace the authentication flow from API request to database query. Where could a race condition occur?" That focused investigation often reveals edge cases you never thought about.

Sam: Okay, so code inspection is about building a mental model. What's next?

Alex: Log analysis. And this is where AI has its biggest advantage over manual debugging. Think about what you struggle with in logs: multi-line stack traces scattered across thousands of entries. Inconsistent formats from different services. Raw debug output without structured fields.

Sam: The noise is real. I've spent days correlating things manually.

Alex: Exactly. What takes senior engineers days happens in minutes with an agent. AI spots patterns across log formats—cascading errors in microservices with different logging styles, timing patterns indicating race conditions buried in verbose output, specific user cohorts experiencing failures across fragmented logs. The messier the logs, the more AI's pattern recognition outpaces human capability.

Sam: How do you feed logs to an agent? Paste them? Upload files?

Alex: Whatever works. Paste grep output, pipe script output, upload raw log files, give direct CLI access to log aggregators. AI doesn't need perfectly structured logs to be effective. It'll parse whatever you have. That said, structured logs—consistent timestamps, request IDs, JSON formatting—are good engineering practice. They make both human and AI analysis easier. But don't wait for perfect logging infrastructure. Use what you have.

Sam: What if you're investigating and the logs aren't giving you enough signal?

Alex: Then you write targeted diagnostic statements preemptively. Fifteen minutes writing specific log output beats hours of speculation. The agent can guide what to log based on its hypothesis, then analyze the new output immediately. You're essentially collaborating with the agent to refine your instrumentation.

Sam: Okay, so code inspection, logs, targeted diagnostics. What if that still isn't enough?

Alex: That's when reproduction scripts become invaluable. And this is where AI agents' massive code generation capabilities really shine. Think about how long it takes to set up a complex environment—Kubernetes, Docker configs, database snapshots, mock services, state initialization. Hours of work for a human.

Sam: An agent can generate all that?

Alex: Trivially. Minutes instead of hours. You ask the agent to simulate the exact conditions where the bug occurs, and it produces the scaffolding on demand. The reproduction script captures full context: database state, external API responses, configuration, user inputs. Everything needed to prove the bug exists.

Sam: Is that practical? I mean, generating a whole reproduction environment?

Alex: It is. Especially for complex systems where you use Docker to create isolated environments. Snapshot production database state, configure services with production-like settings, write a script that triggers the bug reliably. Once you have that, the agent can iterate on fixes and verify each one. Code is cheap when an agent's writing it.

Sam: Alright, so you've got code inspection, logs, reproduction. Now what—the agent proposes fixes?

Alex: Not quite. This is the critical part: closing the loop. Without environment access, the agent researches your code, researches known issues, and proposes solutions it can't validate. With closed-loop access, it applies fixes, re-runs reproduction, and proves they work.

Sam: What's the difference in practice?

Alex: Open-loop: the agent says, "The bug is likely missing RS256 signature verification at jwt.ts:67. Try adding algorithm validation." You go apply it manually, test it, come back with results. Closed-loop: the agent researches, applies the fix, re-runs the reproduction script automatically, observes it now returns 401 correctly, and reports: "Fixed and verified. RS256 validation added at jwt.ts:67, reproduction passes."

Sam: That's fundamentally different. You get the evidence immediately.

Alex: Exactly. That feedback loop is everything. The workflow is: BUILD a reproducible environment that triggers the bug. REPRODUCE it reliably with concrete evidence. PLACE the agent inside that environment with tool access—not just code, but runtime execution. INVESTIGATE using code research, diagnostics, and runtime analysis. VERIFY by applying fixes and re-running reproduction.

Sam: When you say "place the agent inside the environment," what does that look like?

Alex: CLI agents can run anywhere you have shell access. Docker containers, remote servers, CI/CD pipelines, even production instances if you've got that access. That's a key advantage over IDE assistants, which are tied to your local development machine. A CLI agent like Claude Code can execute diagnostic commands directly, inspect responses, analyze logs—all in the actual environment where the bug occurs.

Sam: So the agent becomes an investigator inside the system.

Alex: Right. And during investigation, the agent uses code research strategically. For smaller codebases under about 10,000 lines, agentic search with Grep and Read works fine. Between 10,000 and 100,000 lines, switch to semantic search—tools like ChunkHound or Claude Context via MCP servers give you better architectural understanding with multi-hop traversal across modules. Above 100,000 lines, you really need ChunkHound's structured approach because autonomous agents start missing connections with simpler search strategies.

Sam: What about remote diagnosis? Not all bugs can be reproduced locally.

Alex: That's a different scenario. Customer deployments, edge infrastructure, locked-down production—you don't have iteration capability. Limited information, no access. This is where AI agents' probabilistic reasoning becomes a feature. Combined with code generation, agents turn remote diagnosis from "send logs and wait" into an active investigation.

Sam: Walk me through that.

Alex: You ground yourself first using code research—understand the architecture around the failing component, research similar issues in the ecosystem. Then the agent generates ranked hypotheses based on evidence, not generic patterns. From there, it produces targeted diagnostic scripts that collect evidence for each hypothesis: configuration states, version mismatches, timing data, whatever's needed to validate or refute each theory.

Sam: So the script is like a custom diagnostic tool.

Alex: Exactly. Writing a comprehensive diagnostic script takes humans days. An agent writes it in 30 minutes. More importantly, it writes thorough diagnostics trivially—scripts that check dozens of potential issues, cross-reference configuration, output structured data. You send the script to the customer, they run it, you load the output into the agent's context, and it correlates evidence with hypotheses. What would be tedious manual work becomes a simple prompt.

Sam: That's trading developer time for compute time.

Alex: Perfectly stated. The agent does the tedious work—writing scripts, correlating data, checking edge cases. You stay high-level, making decisions based on evidence the agent surfaces.

Sam: So the whole approach is different from traditional debugging?

Alex: Fundamentally. Traditional debugging is "hypothesize and pray." Debugging with agents is "build diagnostic evidence, require proof, iterate in feedback loops." The agent is your tireless investigator. You give it tools, ground it in your codebase, demand evidence at every step. Code inspection builds understanding. Logs and diagnostics provide evidence. Reproduction scripts eliminate ambiguity. Closed-loop access creates feedback. All of it requires that you never accept a fix without reproducible proof it works.

Sam: Never accept a fix without proof.

Alex: That's the core principle. Evidence. Always.
