---
title: 'Planning'
---

import PlanningContractCheckpointDiagram from '@site/src/components/VisualElements/PlanningContractCheckpointDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Phase 2: Plan / Orchestrate {#phase-2-plan-orchestrate}

Grounding gives the agent facts. It does not decide the shape of the change. After grounding, the agent may know the middleware pattern, the product constraint, and the existing tests. It still does not know which trade-off you want, which cleanup is out of scope, or which boundary must not move. Start execution there, and those choices get made inside the diff.

Planning is the pause between knowing and doing. A plan does two jobs, and they are not the same job.

**It decomposes the work.** The plan cuts the task into units, and each unit carries its input, its output, and the signal that proves it done. This job needs no judge. It pays off by holding the agent inside a bounded unit and by exposing units that can run at once.

**It gates the run.** The plan is accepted before any code exists, so the wrong shape is rejected while changing it is still cheap. This job is worth exactly what its reviewer is worth: reviewers agree only moderately on what is risky, and upfront plan approval in one study constrained unplanned actions but left unlisted safeguards unaddressed and inhibited scrutiny later in the run.[^planning-human-gate] A plan nobody judges is not a weak gate — it is not a gate at all.

<DiagramFrame kicker="Methodology" title="A plan gate is an approved execution contract" size="wide" caption="The operator reviews scope, unit, and verification before the agent turns intent into code." narration="Grounding gives the agent facts. It still doesn't know which trade-off you want, what's out of scope, or which boundary must not move. If execution starts there, those decisions get made inside the diff, which is the most expensive place to discover them. A plan is the pause in between: a small execution contract that states the scope, the next bounded unit, and how it will be verified, plus the checkpoints where the risky calls are reviewed. The human approves, rejects, or revises it before any code exists, and only an approved plan unlocks execution. A plan is a checkpoint, not a formality, because it makes intent inspectable before the agent turns ambiguity into code.">

  <PlanningContractCheckpointDiagram />

</DiagramFrame>

Take a small, everyday change: add a promo-code field to checkout. The scope is the part only you can settle — where the field goes, whether codes stack with other offers, and what an invalid code does, with the existing pricing rules as a boundary that must not move. The unit is the part reality can check — one field on one page, proven by a test that a valid code applies and a bad one is rejected. Predicting the later steps spends plan length on work the agent should do in the code.

## The price of planning {#the-price-of-planning}

A plan is also text that enters the window before any execution step. It cuts both ways.

**It holds the goal present.** A stated objective keeps generation pointed at the same target, so the run drifts less as it grows long.

**It displaces what comes after it.** Grounding and reasoning already filled part of the window; the plan lands on top and stays, so the work still to come sits behind it. Let the plan grow, and execution moves into the middle of a long context, where recall is weakest ([long-context recall falls as input grows](./effective-context.mdx#long-context-benchmarks-show-the-tradeoff)). Both effects scale with size, so keep the restatement short and faithful, expand only the next unit, and retrieve the rest when the work needs it.

## When a plan earns its keep {#when-a-plan-earns-its-keep}

Planning costs tokens, latency, and a commitment to a shape you have not validated. Three conditions pay that back.

**The task is long enough that an early mistake compounds.** On a two-line change, planning is overhead. On a chain where each step depends on the one before it, a wrong first move does not stay local — everything built on it inherits the error. Lookahead is the payoff: the agent sees the shape before it commits.

**The work splits into units you can check or run independently.** A unit with its own verification signal contains a failure instead of letting it spread through the run, and independent units can run at once.[^planning-decompose]

**A judge can read the plan, and its answer has to be right.** Two things must hold.

_The plan must reach the judge in a form it can read._ Compile the claim into the shape of a check: a test runs code, a type checker reads a signature, a constraint predicate reads what the plan asserts. None of them read a sentence. "One field on checkout, with a test for a valid and an expired code" gives a check something to run; "pricing rules must not move" gives it nothing until you bind that line to a predicate (no change under `pricing/`) or a question (does this change pricing rules? yes or no). That binding is your work, and it comes first — prose-to-formal translation is the weak link, with reported semantic correctness between 24% and 35%.[^planning-binding]

When the check is a judgment and not a fact — is this scope creep, is this step reversible — declare questions over the plan state and let a typed decision model answer them with probabilities: a question a person can read, an answer the code can branch on, a confidence you can threshold. Scorers are easy to fool by deletion, and a typed-state gate refused release for all 26 omission-optimized routes — refusal, not a better score, is the behaviour you want from a gate.[^planning-typed-gate]

_The answer must predict whether the work succeeds._ A judge that passes almost anything is worse than no judge: generate ten plans and it picks the one that reads best, not the one that works, so the extra attempts buy confidence instead of correctness.[^planning-verifier-ceiling] Switch verification off, and a planning agent's success rate falls 12.9 points.[^planning-verify] The gain lives in the check, not in the plan: **a plan is only as good as its checker**. [LLM Judges](./llm-judges.md#a-judge-is-one-instrument-among-several) works through the choice.

## When to skip planning {#when-to-skip-planning}

Invert those conditions, and the same tests say when to skip.

**No judge, no gate.** Letting the planner judge its own plan is the common autonomous-loop mistake. Self-critique without an external signal does not fix a bad plan — it collapses performance, because the model cannot separate its errors from its preferences.[^planning-self-critique] The wider evidence is one-sided: models struggle to self-correct without external feedback, and sometimes degrade after trying.[^planning-no-judge] A plan that neither decomposes the work nor reaches a credible judge spends context and buys nothing, so one-shot the task instead and keep the whole of it in front of the model.

**A plan held past its usefulness.** A plan is a bet on how the task will unfold. Hold it after the environment contradicts it, and the bet becomes sunk cost: the agent defends the plan instead of revising it, and an early, hard-to-reverse choice is amplified for the rest of the run.[^planning-commitment] Past a point that moves with task difficulty, more planning also stops helping and starts hurting — the curve bends down the same way it does for [reasoning length](./how-llms-work.mdx#what-reasoning-actually-is).[^planning-overthink] Keep the plan provisional, and re-plan on what the run learns.

**A judge nobody audited.** A gate is an instrument, and instruments drift. Verdicts shift with the model version behind them and grow more permissive as agents grow more capable, and a panel that shares evidence shares its blind spots.[^planning-judge-version] Verifier errors leave no trace inside the loop, so sample the gate's decisions against what actually shipped ([LLM Judges](./llm-judges.md#version-and-monitor-your-instrument)).[^planning-verifier-blindspot]

**One plan split across agents that cannot see each other.** Handing pieces of a plan to parallel sub-agents looks like scale. It usually fragments the implicit decisions — style, boundaries, naming — into work no one downstream can reconcile.[^planning-delegation] Delegation is for [independent threads](./sub-agent-delegation.md), not for a plan you have not made consistent.

On small, obvious work, planning is pure overhead.[^planning-overhead]

## Planning is complete when… {#planning-is-complete-when}

Two questions decide it.

**Can a judge read the plan, and is that judge credible?** If a test, a predicate, or a declared question can reject the plan, the gate buys early rejection of bad directions. If nothing outside the planner can judge it, there is no gate to buy — keep the plan as decomposition, or skip it.

**Is the plan cheap to revise?** If adapting costs a step, the plan is a scaffold. If adapting means starting over, the plan is a trap.

When both hold, gate early and re-plan on every verdict. When neither holds, skip planning and one-shot the task. Measured directly, always planning degrades long-horizon performance and never planning limits it, so the optimum sits in the middle, chosen per task.[^planning-frequency]

Placement matters as much as frequency. Models tend to pour their thinking into the first turn and then assemble the plan with none left; moving the reasoning to the decision points — after a tool returns, before the plan is fixed — is where the payoff is.[^planning-verify]

Planning is complete when execution can begin from a stated contract — judged where a judge exists — instead of an unresolved conversation. Task sizing and phase-boundary review belong to [Shaping the Work](./reliability-orchestration.md) and [Human Checkpoints](./reliability-hitl-checkpoints.md#stop-bad-state-from-propagating).

[^planning-human-gate]: Chen et al. (2026), [_Comparing Human Oversight Strategies for Computer-Use Agents_](https://arxiv.org/abs/2604.04918) — plans "constrained unplanned actions but left unlisted safeguards unaddressed, while upfront approval inhibited runtime scrutiny."

[^planning-decompose]: Prasad et al. (2024), [_ADaPT: As-Needed Decomposition and Planning with Language Models_](https://arxiv.org/abs/2311.05772) — decomposing into bounded subtasks when execution fails beats monolithic one-shot execution by 28.3% on ALFWorld, 27% on WebShop, and 33% on TextCraft.

[^planning-binding]: Dantas et al. (2026), [_Toward Safe LLM Agents: A Survey of Specification, Verification, and Enforcement_](https://arxiv.org/abs/2608.14590) — natural-language-to-formal translation reaches only 24% to 35% semantic correctness, and blocking 94% of unsafe actions can still leave safe completion below 5%.

[^planning-typed-gate]: Manchuliantsau (2026), [_Win by Silence: Deletion Non-Monotonicity, Autonomous Exploitation, and Typed-State Gating in LLM Plan Evaluation_](https://arxiv.org/abs/2607.12986) — plans score better when requirements are deleted; the typed-state gate "refused score release for 26/26 silenced routes" with no false suspensions on honest plans.

[^planning-verifier-ceiling]: Zhang et al. (2025), [_ROC-n-reroll: How verifier imperfection affects test-time scaling_](https://arxiv.org/abs/2507.12399) — "the instance-level accuracy of these methods is precisely characterized by the geometry of the verifier's ROC curve," and high-compute performance cannot be predicted from low-compute runs.

[^planning-verify]: Zhang et al. (2026), [_PIVOT: Bridging Planning and Execution in LLM Agents via Trajectory Refinement_](https://arxiv.org/abs/2605.11225) — the benefit comes from the verify stage: disabling it drops Opus 4.6 by 12.9 points, and the autonomous variant keeps its gains only while that external check remains; the same study also finds that 100% of thinking blocks fire on the first assistant turn while 99.2% of plan-generation steps produce none, so raising the thinking budget does not help and the reasoning has to be placed at the decision points.

[^planning-self-critique]: Stechly, Valmeekam & Kambhampati (2024), [_On the Self-Verification Limitations of Large Language Models on Reasoning and Planning Tasks_](https://arxiv.org/abs/2402.08115) — "significant performance collapse with self-critique and significant performance gains with sound external verification."

[^planning-no-judge]: Huang et al. (2023), [_Large Language Models Cannot Self-Correct Reasoning Yet_](https://arxiv.org/abs/2310.01798) — "LLMs struggle to self-correct their responses without external feedback, and at times, their performance even degrades after self-correction"; Kamoi et al. (2024), [_When Can LLMs Actually Correct Their Own Mistakes?_](https://arxiv.org/abs/2406.01297) — no prior work demonstrates successful self-correction from prompted-LLM feedback except in tasks that exceptionally suit it; correction works with reliable external feedback.

[^planning-commitment]: Wang et al. (2026), [_Why Reasoning Fails to Plan: A Planning-Centric Analysis of Long-Horizon Decision Making in LLM Agents_](https://arxiv.org/abs/2601.22311) — step-wise local scoring induces a greedy policy that commits irreversibly early and amplifies the mistake over a long horizon; Shojaee et al. (2025), [_The Illusion of Thinking_](https://arxiv.org/abs/2506.06941) — reasoning effort falls as complexity rises, despite budget remaining.

[^planning-overthink]: Zhou et al. (2026), [_When More Thinking Hurts: Overthinking in LLM Test-Time Compute Scaling_](https://arxiv.org/abs/2604.10739) — marginal utility turns negative past roughly 12K reasoning tokens, and correct→incorrect flips outnumber incorrect→correct past roughly 7K; Chen et al. (2024), [_Do NOT Think That Much for 2+3=?_](https://arxiv.org/abs/2412.21187).

[^planning-judge-version]: Li et al. (2026), [_Frozen Judges, Moving Agents: Version-Dependent LLM-Judge Error and the Limits of Judge-Assisted Agent Evaluation_](https://arxiv.org/abs/2609.34198) — judge-only intervals declare upgrades that execution-based intervals cannot establish, and false acceptance of failed coding patches rises with agent capability. Judge validity and panel evidence are covered in [LLM Judges](./llm-judges.md#a-judge-is-one-instrument-among-several).

[^planning-verifier-blindspot]: Moya et al. (2026), [_Verifier Errors in RLVR: Reward Hacking, Limits of Feedback, and Selective Control_](https://arxiv.org/abs/2609.35677) — verifier errors cannot be identified from the training signal alone, so selective control depends on external audits.

[^planning-delegation]: Cognition (2025), [_Don't Build Multi-Agents_](https://cognition.ai/blog/dont-build-multi-agents) — actions carry implicit decisions, so sub-agents that cannot see each other's work produce conflicting, unreconcilable output.

[^planning-overhead]: Huang et al. (2024), [_Understanding the Planning of LLM Agents: A Survey_](https://arxiv.org/abs/2402.02716) — planning overhead can hurt simple tasks that do not benefit enough to cover its cost; Anthropic (2024), [_Building Effective Agents_](https://www.anthropic.com/engineering/building-effective-agents) — success "isn't about building the most sophisticated system. It's about building the _right_ system for your needs."

[^planning-frequency]: Paglieri et al. (2025), [_Learning When to Plan: Efficiently Allocating Test-Time Compute for LLM Agents_](https://arxiv.org/abs/2509.03581) — "always planning is computationally expensive and degrades performance on long-horizon tasks, while never planning further limits performance"; an intermediate, learned planning frequency wins.
