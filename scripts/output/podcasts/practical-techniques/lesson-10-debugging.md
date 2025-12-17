---
source: practical-techniques/lesson-10-debugging.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-12-16T07:02:49.780Z
model: claude-opus-4.5
tokenCount: 2323
---

Alex: Debugging with AI agents requires a fundamental mindset shift. Most engineers approach it wrong—they describe symptoms and hope the AI guesses the solution. That's backwards. The core principle is simple: never accept a fix without reproducible proof it works.

Sam: So instead of "what do you think is wrong," you're pushing for "prove it."

Alex: Exactly. AI agents are excellent at pattern recognition and systematic investigation when given concrete data. But force them to speculate without evidence? They fail spectacularly. The anti-pattern is describing a bug and asking the agent to fix it blindly. The production pattern is providing reproduction steps, giving the agent access to diagnostic tools, and requiring before-and-after evidence.

Sam: That makes sense, but where do you even start? When I'm staring at a bug, my instinct is to jump into logs or start adding print statements.

Alex: Before any of that, start with root cause analysis—RCA. Have the agent explain the architecture and execution flow first. Use conversational analysis to find mismatches between your mental model and what the system actually does. Ask it to trace request paths, explain data flow, identify potential failure points based on code structure.

Sam: You're not having it read every line though.

Alex: No, use semantic code search and research tools to find relevant components, then focus the conversation on critical paths. And here's the technique that really exposes root causes: the 5 Whys. Don't stop at the first answer. "Trace the authentication flow from API request to database query. Where could a race condition occur?" Then: "Why would that race condition happen?" Then: "Why isn't it handled?" Each "why" peels back another layer.

Sam: The agent's explanation probably reveals edge cases you missed too.

Alex: That's exactly what happens. Now, once you've got that architectural understanding, logs are where AI really shines. This is AI's superpower in debugging.

Sam: I've always found log analysis tedious. Thousands of lines, inconsistent formats across services, multi-line stack traces scattered everywhere.

Alex: That's precisely where AI has the biggest advantage. Processing chaos that humans can't parse manually. What takes senior engineers days of manual correlation happens in minutes with AI. It spots patterns across different log formats—cascading errors in microservices with different logging styles, timing patterns indicating race conditions buried in verbose output, specific user cohorts experiencing failures across fragmented logs.

Sam: So the messier the logs, the more useful AI becomes?

Alex: Counterintuitively, yes. Give agents access however works—paste grep output, pipe script output, upload raw log files, give direct CLI access to log aggregators. AI doesn't need perfectly structured JSON with correlation IDs. It parses whatever you have. Now, structured logs are still good engineering practice—they make both human and AI analysis easier. But don't wait for perfect logging infrastructure before leveraging AI.

Sam: What about adding diagnostic logs during investigation? I've always been hesitant because it's tedious to add them, analyze, then clean them up.

Alex: This insight transforms debugging economics entirely. AI makes it trivial to add diagnostic statements at dozens of strategic points—far more than humans would ever instrument manually—because the agent generates and places them in minutes. The agent guides what to log based on its hypothesis, then analyzes the output immediately. Once the bug is verified fixed, the same agent systematically removes all temporary diagnostic statements, restoring code hygiene.

Sam: So the whole add-logs-analyze-remove cycle that's prohibitively tedious for humans becomes routine.

Alex: Exactly. You shift from minimal instrumentation to evidence-rich exploration. Fifteen minutes writing specific log output beats hours of speculation.

Sam: What about when logs and code inspection aren't enough? When you need to actually reproduce complex state or timing conditions?

Alex: That's where reproduction scripts become invaluable. And this is where AI agents' code generation capabilities really shine. Environments that take humans hours to set up—Kubernetes configs, Docker environments, database snapshots, mock services, state initialization—AI generates in minutes.

Sam: The scaffolding that everyone dreads writing.

Alex: Right. Reproduction scripts eliminate ambiguity and create verifiable test cases. They capture full context: database state, external API responses, configuration, user inputs. Ask the agent to simulate the exact conditions where the bug occurs, and it produces the environment on demand. For complex systems, use Docker to create isolated reproduction. Snapshot production database state, configure services realistically, write a script that triggers the bug reliably. Once you have that, the agent iterates on fixes and verifies each attempt.

Sam: That brings up something important though. How does the agent actually verify its fixes work?

Alex: This is the critical distinction: open-loop versus closed-loop debugging. With good grounding, agents can always explore your codebase and research known issues online. But closing the loop means the agent can test its fixes and verify its reasoning actually works. Without environment access, the agent proposes solutions it can't validate. With closed-loop access, it applies fixes, re-runs reproduction, and proves they work—or iterates on new hypotheses when they don't.

Sam: Can you give me a concrete example of the difference?

Alex: An open-loop agent researches your code and online issues, then reports: "The bug is likely missing RS256 signature verification at jwt.ts line 67—try adding algorithm validation." A closed-loop agent does the same research, then applies that fix, re-runs the failing request, observes it now returns 401 correctly, and reports: "Fixed and verified—RS256 validation added at jwt.ts line 67, reproduction now passes."

Sam: Night and day. One guesses, one proves.

Alex: The closed-loop workflow has five steps. First, BUILD—create a reproducible environment with Docker, scripts, database snapshots that reliably triggers the bug. Second, REPRODUCE—verify the bug manifests consistently with concrete evidence: logs, status codes, error output. Third, PLACE—give the agent tool access within the environment. Not just code access, but runtime execution capabilities.

Sam: This is where CLI agents have an advantage over IDE assistants, right?

Alex: Significant advantage. CLI agents like Claude Code, Codex, or Copilot CLI can run anywhere you have shell access: inside Docker containers, on remote servers, in CI/CD pipelines, on problematic production instances. IDE agents are tied to your local development machine. Fourth step is INVESTIGATE—the agent leverages grounding techniques to form hypotheses by correlating runtime behavior, codebase analysis, and known issues. For codebase exploration, use ChunkHound's code research for comprehensive investigation with architectural context, or agentic search with Grep and Read for smaller codebases.

Sam: And fifth is verify?

Alex: VERIFY—the agent applies the fix, re-runs reproduction, and confirms the bug is resolved. Or if it's not resolved, it forms a new hypothesis and iterates. This transforms debugging from "research and guess" to "research, fix, test, and prove." A closed feedback loop where the environment validates or refutes the agent's reasoning.

Sam: What about situations where you can't reproduce locally or access the failing environment? Customer deployments, edge infrastructure, locked-down production?

Alex: Remote diagnosis. This is where AI's probabilistic reasoning becomes a feature, not a limitation. Combined with code generation capabilities, agents turn remote diagnosis from "send me logs and wait" into an active investigation workflow.

Sam: How does that work in practice?

Alex: Follow the research-first pattern: ground yourself in the codebase—understand the architecture around the failing component using code research—and in known issues by searching for similar problems in the ecosystem. With that context, the agent generates ranked hypotheses based on evidence, not generic patterns. Then it produces targeted diagnostic scripts that collect evidence for each hypothesis: configuration states, version mismatches, timing data, whatever validates or refutes each theory.

Sam: You're trading developer time for compute time.

Alex: Exactly right. Writing a comprehensive diagnostic script takes humans days but takes agents 30 minutes. And agents generate thorough diagnostics trivially—scripts that check dozens of potential issues, cross-reference configuration, output structured data. Send the script to the customer, load the output into the agent's context, and it correlates evidence with hypotheses to identify root cause.

Sam: So the key insight across all of this is that debugging with AI is really about building diagnostic environments where evidence is abundant and verification is systematic.

Alex: That's it. The agent is your tireless investigator—give it the tools and demand proof. Evidence over speculation, always.
