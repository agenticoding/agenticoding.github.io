---
sidebar_position: 3
sidebar_label: 'Spec-Driven Development'
sidebar_custom_props:
  sectionNumber: 8
title: 'Spec-Driven Development'
---

[Chapter 7: Reliability Levers](./chapter-7-reliability-levers.md) established the broader model: reliable agent work depends on orchestration, sampling, HITL checkpoints, and context quality. This chapter zooms into one concrete pattern that combines two of those levers: **Spec-Driven Development (SDD)**.

The core move is simple: before the agent writes code, compress intent into a short artifact a human can read and approve. That artifact is the spec.

Now imagine the task:

> Add rate limiting to our API.

That sounds simple. But the real task is not one step. The agent has to discover your middleware pattern, find your Redis client, preserve your auth behavior, decide what counts as an anonymous user, match your error format, and avoid inventing helpers you already have. A spec gives the agent a validated target before execution starts.

## Specs as a HITL Tool

A spec instantiates two levers simultaneously:

1. **HITL checkpoint:** The human reads and approves the spec before code changes begin.
2. **Context quality:** The spec raises signal-to-noise ratio in the agent's context.

Instead of "add rate limiting," the agent has a structured artifact with scope, rules, constraints, and acceptance criteria.

## What a Readable Spec Looks Like

A spec only works if you actually read it. If it is too long, vague, or fragmented, you skim it, miss the risk, and the checkpoint fails. Readability is not a nicety — it is a reliability requirement.

### Token Ranges

Research on spec length converges on clear boundaries[^1][^2]:

| Length | Words | Lines | Best For | Readability |
|--------|-------|-------|----------|-------------|
| ~500 tokens | ~375 words | 10–15 lines | Simple changes, bug fixes | Read in 30s |
| ~1K tokens | ~750 words | 15–30 lines | Most feature work | Read in 1–2 min |
| ~2K tokens | ~1,500 words | 30–50 lines | Complex features, cross-module | Read in 3–4 min |
| ~3K–4K tokens | ~2,250–3,000 words | 50–80+ lines | Multi-session work | Warning: split into sub-specs |

The **50-line ceiling** is a useful heuristic: once a spec exceeds 50 lines, it is usually trying to describe too much at once[^2]. Split into sub-specs or question whether the task is well-defined.

A 2–3 minute spec review by a human can save 2–3 hours of debugging a drifted implementation[^3]. That ratio makes the checkpoint extremely high-leverage — as long as the spec stays readable.

### The Spec Is the Checkpoint

A spec is not a giant requirements document. It is a **readable artifact** that captures what the agent is about to build, how it should fit the system, and what must not drift.

The workflow looks like this:

```text
Grounding → Plan → Spec → Human read/approve → Execute → Gap analysis
                                                                ↑
                                              (iterate with fresh context +
                                               swap model until converged)
                                                                ↓
                                                              Test
```

The key move is the one in the middle: a human gate between planning and execution that resets the chain before code begins.

After grounding and planning — using the exploration workflow from [Chapter 4](./chapter-4-high-level-methodology.md) — you stop and write down the intended change in a form a human can evaluate quickly.

### Require Evidence to Force Grounding {#require-evidence-to-force-grounding}

A spec is only as good as the research feeding it. If the agent cannot cite the modules, routes, tables, contracts, or tests that shaped the spec, you are probably reading a plausible summary rather than a grounded one.

Before approving a spec, ask for concrete evidence from the codebase:

- which files and interfaces the change touches
- which existing patterns it is reusing
- which constraints came from code, tests, or external docs
- which assumptions are still guesses

This forces retrieval before synthesis. The spec becomes a compression of discovered reality, not a freeform design essay.

## Running Example

Suppose the task is to add rate limiting to `/api/*`.

A useful spec might look like this:

```markdown
# API Rate Limiting

## Goal
Protect `/api/*` from abuse without changing existing auth behavior.

## Scope
- Add rate limiting middleware to the API pipeline
- Keep `/api/auth/login` exempt
- Use existing Redis infrastructure

## Rules
- Anonymous users: 100 requests/hour
- Authenticated users: 1000 requests/hour
- Admins: unlimited
- If Redis is unavailable, fail open and log a warning
- Return `429` with `Retry-After` header

## Integration Constraints
- Follow middleware structure used by `src/middleware/auth.ts`
- Reuse existing error response format
- Do not introduce a new cache client or validation library

## Acceptance Checks
- Existing auth middleware behavior unchanged
- Limits differ by user type
- Login route remains exempt
- Redis outage does not block traffic
```

That is short enough to read in one sitting (~500 tokens). It names the behavior, the boundaries, the constraints, and the success criteria. It is not a design novel. It is a checkpoint.

## SSOT Tension: Specs Are Temporary

Every spec creates a second source of truth alongside the codebase. That tension is structural — code and spec describing the same system will eventually drift[^4].

The standard fix: **specs are temporary scaffolding**.

Once implementation is correct and verified, the spec is deleted. The code becomes the sole source of truth. Constraints that are too important to lose are migrated into code as typed comments or domain annotations — the technique covered in [Chapter 12: Agent-Friendly Code](./chapter-12-agent-friendly-code.md).

Not everything disappears when the file goes away:
- **Constraints migrate into code** — critical rules become machine-readable comments or type annotations near the relevant code
- **The WHY residual survives** — decisions that cannot be expressed cleanly in code (rejected alternatives, compliance rationale) live in a small decision record

Everything else — structure, interfaces, behavior — should be recoverable from the codebase through grounding and code research.

## Execution from a Validated Spec

Once the spec is approved, execution becomes an orchestration problem rather than a discovery problem. The agent shifts from inference about your intent to recall against an approved artifact.

### The Plan Becomes a Risk Map

A plan derived from a spec is not just a to-do list. It shows where drift is likely and where review matters most.

For the rate-limiting example:

- Wiring middleware into existing routes is probably low risk
- Reusing the correct Redis client is medium risk
- Preserving auth edge cases and admin exemptions is high risk
- Matching the existing error envelope is worth spot-checking

That lets you place attention deliberately instead of hovering over every line equally.

### Review the Dangerous Steps, Not Every Step

A validated spec lets you say:

- "Let the agent implement the middleware and tests autonomously"
- "Stop before changing auth-adjacent code"
- "Show me the final diff for error handling and exemptions"

This is the difference between babysitting and orchestration.

### Execution Is Still Probabilistic

A validated spec does not make the agent deterministic. It makes the agent's *target* deterministic. The implementation step is still a chain of stochastic operations: file reads, reasoning about structure, choosing identifiers, ordering statements, handling edge cases.

That means you should expect the first execution attempt to be mostly right and partially wrong. The spec gives you a precise reference to measure that wrongness against. Without the spec, you would not know whether a deviation was a bug or a design decision the agent made on its own.

### Watch for Invention Over Reuse

Even with a good spec, agents still drift toward invention because generating plausible code is easier than discovering existing code.

If the execution plan says things like:

- "create a helper"
- "add a new utility"
- "introduce a cache wrapper"

...pause and ask whether that thing already exists. The spec should constrain not just behavior, but also the reuse expectations of the codebase.

### What Makes a Spec Readable (Revisited)

Since the checkpoint only works if humans read it, readability criteria bear repeating:

**Short.** A spec should distill the change to its essential structure. If it exceeds 2K tokens (~50 lines), the task is probably too broad or the boundaries are unclear. Split into sub-specs.

**Coherent.** A spec should tell one story. The reader should answer:
- What are we changing?
- Why are we changing it?
- What must remain true when we are done?

**Concrete.** Name real things: modules, routes, tables, contracts, constraints, failure behavior. "Improve performance" does not constrain implementation. "Return `429` with `Retry-After` header" does.

Later, in [Chapter 13: Thinking in Systems](./chapter-13-systems-thinking-specs.md), you will make this much more precise with modules, interfaces, state, constraints, and invariants. For now, the important idea is simpler: **if a human cannot read the spec and form a judgment quickly, it is not ready to drive implementation.**

## Gap Analysis: The Convergence Loop

After implementation, compare the spec to the code that was actually produced.

That comparison is **gap analysis**.

Ask three questions:

1. **What exists?** What did the agent actually build?
2. **What is missing?** What did the spec require that never made it into code?
3. **What conflicts?** Where does the implementation diverge from the spec?

For the rate-limiting example, a useful gap analysis might find:

- the middleware exists
- anonymous and authenticated limits are correct
- `429` responses are correct
- but the login route exemption was missed
- and Redis failure currently fails closed instead of open

That is a good checkpoint because it turns a vague feeling—"looks mostly right"—into specific drift.

### One Pass Is Not Enough

Gap analysis is an LLM-mediated step. The agent comparing spec and code can miss a real discrepancy or invent one that is not there. Because the operation is probabilistic, **a single pass is insufficient for any task where the cost of an undetected gap is high.**

The fix is iteration: run gap analysis, feed the findings back into execution, and repeat until the gap is below a threshold you can accept. Production agent orchestration frameworks formalize exactly this. Qualixar OS, for example, routes rejected outputs through an iterative redesign loop with up to five retry iterations before human escalation[^5]. The Kitchen Loop operates in "coverage-exhaustion mode," systematically exercising the specification surface until coverage gaps approach zero[^6].

### Fresh Context and Model Swapping

To make each iteration useful, change the conditions:

- **Use a fresh context.** Do not run gap analysis in the same conversation where the code was written. The execution context carries assumptions, ignored details, and confirmation bias. A fresh context reads the spec and the code as an outsider would.
- **Swap the model or provider.** Different models have different blind spots because they are trained on different data distributions and tuned with different reward functions. A gap that Claude misses, GPT-4o might catch, and vice versa. Qualixar OS implements consensus-based judging across multiple providers precisely for this reason: cross-model entropy is harder to game than a single-model evaluation[^5].

You do not need a dozen models. Two or three, rotated on each iteration, are enough to escape correlated failure modes.

### Convergence Criteria

Stop iterating when:

- The gap analysis reports no issues **and** you spot-check the most dangerous parts manually
- The gaps are cosmetic and do not affect behavior
- You have reached a fixed point — two consecutive iterations with identical findings

If you are still finding new gaps after three or four iterations, the spec itself is probably the problem. Fix the spec and regenerate rather than patching a broken approach.

### Small Gaps vs Large Gaps

**Small gaps** mean the implementation is broadly correct but incomplete. Fix the code.

**Large gaps** mean the spec was ambiguous, wrong, or insufficiently constraining. Fix the spec and regenerate rather than patching a broken approach.

That distinction matters. Patching a fundamentally wrong implementation usually compounds the mess.

### Gap Analysis Is Not the Final Arbiter

Even iterative gap analysis is probabilistic. The final arbiter arrives in the next chapter: **tests**.

## Specs Are Temporary Scaffolding

Once implementation is correct and verified, **the code is the source of truth**.

That means the normal lifecycle is:

1. Extract or write the spec
2. Implement from it
3. Gap-analyze
4. Test
5. Delete the spec

This is where many "living spec" approaches go wrong. If both the spec and the code describe the same operational reality, one of them will eventually drift.

### When to Persist a Spec

Keep a spec around longer when:

- work spans multiple sessions or multiple days
- several people or agents need a shared artifact
- the scope is too large to hold comfortably in one context window
- the architecture is still being negotiated

For a single-session task, the spec can be ephemeral. It may live only in the conversation context and disappear once the work is complete.

:::caution The handoff to Chapter 9 matters

Up to this point, every step is still probabilistic: research, planning, spec writing, execution, gap analysis, and even human review. Useful, but probabilistic.

[Chapter 9: Tests as Guardrails](./chapter-9-tests-as-guardrails.md) is where determinism enters the loop. Tests either pass or they don't.
:::

## Key Takeaways

- **SDD combines two reliability levers:** HITL checkpoints and context quality.
- **A spec is the readable checkpoint between planning and execution** — it turns vague intent into an artifact a human can inspect before code is written.
- **Gap analysis is part of SDD, not an optional extra** — compare implementation to spec, iterate in fresh context, and converge before trusting the result.
- **Good specs stay under ~2K tokens / ~50 lines** — if a spec is too long to read in one sitting, split into sub-specs.
- **Specs are scaffolding, not permanent truth** — after tests pass, delete the spec and migrate critical constraints into code.

[^1]: Token-to-word ratio: 1 token ≈ 0.75 words for English text. [llmcalcs.com](https://llmcalcs.com), [benchlm.ai](https://benchlm.ai).

[^2]: Production heuristic: "Over 50 lines over-specifying" — specs exceeding 50 lines tend to describe too much at once. Ideal range is 10–30 lines for most feature work. [amux.io](https://amux.io).

[^3]: Human spec review: 2–3 minutes reviewing a well-written spec saves approximately 2–3 hours of debugging drifted implementations. [getarchie.dev](https://getarchie.dev).

[^4]: SSOT governance: type-based precedence ensures code wins over spec when they diverge. [Spesans](https://spesans.com).

[^5]: *Qualixar OS: A Universal Operating System for AI Agent Orchestration.* [arXiv:2604.06392v1](https://arxiv.org/abs/2604.06392), 2026.

[^6]: *The Kitchen Loop: User-Spec-Driven Development for a Self-Evolving Codebase.* [arXiv:2603.25697v1](https://arxiv.org/abs/2603.25697), 2026.

---

**Next:** [Chapter 9: Tests as Guardrails](./chapter-9-tests-as-guardrails.md)
