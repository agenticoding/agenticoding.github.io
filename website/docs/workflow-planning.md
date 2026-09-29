---
title: 'Planning'
---

import PlanningContractCheckpointDiagram from '@site/src/components/VisualElements/PlanningContractCheckpointDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Phase 2: Plan / Orchestrate {#phase-2-plan-orchestrate}

Grounding gives the agent facts. It does not decide the shape of the change.

After grounding, the agent may know the middleware pattern, the product constraint, and the existing tests. It still does not know which trade-off you want, which cleanup is out of scope, or which boundary must not move. If execution starts there, those choices get made inside the diff.

Planning is the pause between knowing and doing. A plan is a checkpoint: a small execution contract written before any code exists, so the wrong shape is caught while it is still cheap to change. It catches two kinds of error. The first is intent — building the wrong thing the right way: the scope, the trade-off, the boundary that must not move. Only you hold that, so only you can catch it. The second is feasibility — building the right thing the wrong way: an infeasible step, a violated constraint. Reality catches that one as soon as the plan meets it, through a failing test, a compiler error, or a rejected tool call. Both share one thing: the value comes from the check, not from the plan. A model cannot reliably catch its own errors, so a plan is worth what the checker behind it is worth. In an autonomous loop you are gone; the plan is only as good as whatever test, compiler, or environment replaces you. Whether planning helps or hurts turns on whether a real checker exists — the rest of this chapter is about that boundary.

<DiagramFrame kicker="Methodology" title="A plan is an approved execution contract" size="wide" caption="The operator reviews scope, unit, and verification before the agent turns intent into code." narration="Grounding gives the agent facts. It still doesn't know which trade-off you want, what's out of scope, or which boundary must not move. If execution starts there, those decisions get made inside the diff, which is the most expensive place to discover them. A plan is the pause in between: a small execution contract that states the scope, the next bounded unit, and how it will be verified, plus the checkpoints where the risky calls are reviewed. The human approves, rejects, or revises it before any code exists, and only an approved plan unlocks execution. A plan is a checkpoint, not a formality, because it makes intent inspectable before the agent turns ambiguity into code.">

  <PlanningContractCheckpointDiagram />

</DiagramFrame>

The useful planning question is not "what is every step?" It is "what decision would be expensive to discover only after code exists?" Answer that before execution.

A good plan makes two things visible:

- **Scope:** what to add, remove, change, and protect.
- **Unit:** the next bounded piece of work, with its input, output, dependency, and verification signal.

Take a small, everyday change: add a promo-code field to checkout. The scope is the part only you can settle — where the field goes, whether codes stack with other offers, and what an invalid code does, with the existing pricing rules as a boundary that must not move. The unit is the part reality can check — one field on one page, proven by a test that a valid code applies and a bad one is rejected. A fuller implementation plan would spend effort predicting steps the agent should work out in the code.

Older prompt advice treated plans as todo lists so the model would remember what to do. That still helps, but it is not the main value. A plan works because it makes intent inspectable before the agent turns ambiguity into code.

## What a plan does to the window {#what-a-plan-does-to-the-window}

A plan is not only a document you approve. It is also text that enters the window before any execution step, and it cuts both ways.

**It restates the goal.** This is the part that helps. A stated objective keeps generation pointed at the same target, which is why explicit restatement reduces drift as a run grows long: models drift by pattern-matching to whatever is most present, so the goal holds better when it is stated plainly and stays recent.

**It adds specifics the prompt never had.** A decomposition resolves questions the prompt left open — which unit, which order, which boundary. That is the point of planning, but each answer commits the run to a direction. Get one wrong, and the restatement entrenches it: the run now spends its length reinforcing the wrong target.

**It displaces everything after it.** By the time a plan is written, grounding, tool calls, and reasoning have already filled part of the window; the plan lands on top and stays, so the work still to come sits behind it. Displacement costs recall even when the content does not change ([same task, more tokens](./effective-context.mdx)).

Both costs scale with size: the more the plan adds, the more it displaces and the longer a wrong commitment survives. So the lever is to keep planning — and the context around it — small. Keep the restatement short, faithful, and imperative; keep the expansion to what the next unit needs; and defer the rest to retrieval instead of carrying it in the window.

## When planning earns its keep {#when-planning-earns-its-keep}

Planning costs tokens, latency, and a commitment to a shape you have not validated. It earns that back under three conditions.

**The task is long enough that an early mistake compounds.** On a two-line change, planning is overhead. On a chain where each step depends on the one before it, a wrong first move does not stay local — everything built on it inherits the error. Lookahead is the payoff: the agent sees the shape before it commits. And the work agents are handed keeps getting longer, which is exactly where planning starts to matter.[^planning-horizon]

**The work splits into units that can be checked or run independently.** Decomposition turns one unbounded task into a sequence of bounded ones, each with its own verification signal, so a failure stays contained to a unit instead of poisoning the run.[^planning-decompose] When the units are independent, the plan also lets them run at once instead of one at a time.[^planning-parallel]

**Something outside the model can tell good from bad.** This is the condition people miss. A plan is worth making when a cheap, external signal — a test, a compiler, a failed tool call, a constraint check — can reject it. The gain tracks the *checker*, not the plan. Remove the checker and the gain goes with it.[^planning-verify]

## When planning backfires {#when-planning-backfires}

The same conditions run in reverse. When they fail, planning does not merely waste tokens; it lowers the result.

**Planning harder past the point of usefulness.** Thinking helps only until it doesn't. Past a point that moves with task difficulty, more planning stops improving the answer and starts degrading it: the model second-guesses a correct route and talks itself into a wrong one. The curve bends down, the same way it does for [reasoning length](./how-llms-work.mdx#what-reasoning-actually-is).[^planning-overthink]

**Freezing a plan the world invalidates.** A plan is a bet on how the task will unfold. When the environment surprises it, a frozen plan turns that bet into sunk cost: the agent defends the plan instead of revising it, and an early, hard-to-reverse choice gets amplified for the rest of the run.[^planning-commitment]

**Grading your own plan with the same model.** The most common autonomous-loop mistake is letting the planner also be the judge. Self-critique without an external signal does not fix a bad plan — it collapses performance, because the model cannot reliably separate its errors from its preferences. Gains come from sound *external* verification, not from the model reviewing itself.[^planning-self-critique]

**Splitting one plan across agents that cannot see each other.** Handing pieces of a plan to parallel sub-agents looks like scale. It usually fragments the implicit decisions — the style, the boundaries, the naming — into contradictory work no one downstream can reconcile.[^planning-delegation] Delegation is for [independent threads](./sub-agent-delegation.md), not for a plan you have not made consistent.

On small, obvious work all of this is pure overhead. Planning is a tool for ambiguity, not a ritual.[^planning-overhead]

## The one rule behind both {#the-one-rule-behind-both}

Everything above reduces to two questions:

**Is the plan cheap to check?** If something other than the planner can say yes or no, a plan buys early rejection of bad directions. If only the planner can judge it, the plan buys nothing you can trust.

**Is the plan cheap to revise?** If adapting costs a step, the plan is a scaffold. If adapting means starting over, the plan is a trap.

When both are true, plan early and replan on every signal. When neither is true, skip the plan and move in smaller steps. Do not collapse this into "always plan" or "never plan": measured directly, always planning degrades long-horizon performance and never planning limits it, so the optimum sits in the middle, chosen per task.[^planning-frequency]

One more rule about placement. Spending all the reasoning up front is not the same as planning well. Models tend to pour their thinking into the first turn and then assemble the actual plan with none left; moving reasoning to the decision points — after a tool returns, before the plan is fixed — is where the payoff actually is.[^planning-placement]

Planning is complete when execution can begin from a reviewed contract instead of an unresolved conversation. The reliability mechanics behind task sizing and why phase-boundary review works belong in [Shaping the Work](./reliability-orchestration.md) and [Human Checkpoints](./reliability-hitl-checkpoints.md#stop-bad-state-from-propagating).

[^planning-horizon]: Kwa et al. (2025), [_Measuring AI Ability to Complete Long Software Tasks_](https://arxiv.org/abs/2503.14499) — the human-equivalent task length an agent can complete at 50% reliability has roughly doubled every seven months since 2019, so agent work is trending toward exactly the long, compounding chains where lookahead pays.

[^planning-decompose]: Prasad et al. (2024), [_ADaPT: As-Needed Decomposition and Planning with Language Models_](https://arxiv.org/abs/2311.05772) — decomposing into bounded subtasks when execution fails beats monolithic one-shot execution by 28.3% on ALFWorld, 27% on WebShop, and 33% on TextCraft.

[^planning-parallel]: Kim et al. (2024), [_An LLM Compiler for Parallel Function Calling_](https://arxiv.org/abs/2312.04511) — a plan exposes independent steps that a scheduler executes concurrently, for up to 3.7× lower latency and 6.7× lower cost than sequential ReAct; LangChain (2024), [_Plan-and-Execute Agents_](https://www.langchain.com/blog/planning-agents).

[^planning-verify]: Zhang et al. (2026), [_PIVOT: Bridging Planning and Execution in LLM Agents via Trajectory Refinement_](https://arxiv.org/abs/2605.11225) — the benefit comes from the verify stage: disabling it drops Opus 4.6 by 12.9 points, and the autonomous variant keeps its gains only while that external check remains.

[^planning-overthink]: Zhou et al. (2026), [_When More Thinking Hurts: Overthinking in LLM Test-Time Compute Scaling_](https://arxiv.org/abs/2604.10739) — marginal utility turns negative past roughly 12K reasoning tokens, and correct→incorrect flips outnumber incorrect→correct past roughly 7K; Chen et al. (2024), [_Do NOT Think That Much for 2+3=?_](https://arxiv.org/abs/2412.21187).

[^planning-commitment]: Wang et al. (2026), [_Why Reasoning Fails to Plan: A Planning-Centric Analysis of Long-Horizon Decision Making in LLM Agents_](https://arxiv.org/abs/2601.22311) — step-wise local scoring induces a greedy policy that commits irreversibly early and amplifies the mistake over a long horizon; Shojaee et al. (2025), [_The Illusion of Thinking_](https://arxiv.org/abs/2506.06941) — reasoning effort falls as complexity rises, despite budget remaining.

[^planning-self-critique]: Stechly, Valmeekam & Kambhampati (2024), [_On the Self-Verification Limitations of Large Language Models on Reasoning and Planning Tasks_](https://arxiv.org/abs/2402.08115) — "significant performance collapse with self-critique and significant performance gains with sound external verification."

[^planning-delegation]: Cognition (2025), [_Don't Build Multi-Agents_](https://cognition.ai/blog/dont-build-multi-agents) — actions carry implicit decisions, so sub-agents that cannot see each other's work produce conflicting, unreconcilable output.

[^planning-frequency]: Paglieri et al. (2025), [_Learning When to Plan: Efficiently Allocating Test-Time Compute for LLM Agents_](https://arxiv.org/abs/2509.03581) — "always planning is computationally expensive and degrades performance on long-horizon tasks, while never planning further limits performance"; an intermediate, learned planning frequency wins.

[^planning-placement]: Zhang et al. (2026), [_PIVOT_](https://arxiv.org/abs/2605.11225) — 100% of thinking blocks fire on the first assistant turn while 99.2% of plan-generation steps produce none, so raising the thinking budget does not help; the reasoning has to be placed at the decision points.

[^planning-overhead]: Huang et al. (2024), [_Understanding the Planning of LLM Agents: A Survey_](https://arxiv.org/abs/2402.02716) — planning overhead can hurt simple tasks that do not benefit enough to cover its cost; Anthropic (2024), [_Building Effective Agents_](https://www.anthropic.com/engineering/building-effective-agents) — success "isn't about building the most sophisticated system. It's about building the *right* system for your needs."
