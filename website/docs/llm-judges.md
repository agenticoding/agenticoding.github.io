---
title: 'LLM Judges'
---

## LLM Judges as Measurement Equipment

An LLM judge asks a model to assess an artifact against a supplied rubric. It is useful when a deterministic assertion is too narrow but reviewing every artifact manually is too expensive — which is most real-world validation scenarios.

Examples include:

- scoring summarization outputs for faithfulness and coherence against a reference
- verifying that a generated answer is grounded in retrieved context with no unsupported claims
- pairwise comparison of candidate responses to select the higher-quality output
- classifying model outputs as safe/unsafe or pass/fail against explicit criteria
- running rubric-based regression on golden datasets in CI/CD pipelines
- evaluating workflow step correctness (did each extraction or tool call follow the specified contract?)

LLMs are better at discriminating between explicit options or criteria than at open-ended evaluation. Prefer classification, pairwise comparison, or a score against named criteria over "is this good?" See OpenAI's [evaluation guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices).

### A Judge Is One Instrument Among Several

A generative judge is rarely the most credible instrument available. A deterministic check, a purpose-trained critic, or a _typed decision model_ — a classifier you give a state and declared questions, which returns calibrated probabilities instead of text — usually carries more weight for the same judgment. Jev (TypeSafe System One) defined that interface; Cloudflare's Clef and the open Kev family serve the same API and can run self-hosted. [Planning](./workflow-planning.md#when-a-plan-earns-its-keep) works through how to choose.

The difference is not cosmetic. A generative judge emits a verdict that must be parsed, and its confidence is not comparable across runs. A typed decision model answers only the questions you declare, with a probability you can threshold, and it is built to be calibrated. The trade is scope for reliability: it cannot reason about a criterion you never asked about, and its failure modes become yours — literal reading, no arithmetic, sensitivity to option order.

Most credible checks are the rarest, and credibility falls as availability rises.[^judge-no-free-checker] A purpose-trained critic and a typed decision model both sit above a generative judge wherever they apply. The critic reads the same prose but scores against learned preferences: fine-tuned 4B and 8B planning critics lifted the resolved rate of six larger coding agents by 16.0% and 14.4% on SWE-Bench Verified, and cut GPT-OSS-20B's per-example cost from $0.07 to $0.03.[^judge-critic] A typed decision model answers declared questions with a calibrated probability instead of text.[^judge-decision-models] [Validation](./validation.md) sorts every technique into four classes.

Two validity facts limit any judge. Exact-match agreement overstates a generative judge's ability: on MT-Bench, Cohen's kappa runs 33 to 41 points lower, and judge rankings move by up to 14 positions across benchmarks.[^judge-validity] Panels that share evidence share blind spots: a cross-model vote over shared evidence approved 62.9% of unsafe proposals, against 22.9% once an independent source was added.[^judge-ensemble]

Reach for the generative judge when the criterion is novel, open-ended, or needs reasoning to evaluate. Reach for the ladder above when it does not. [Planning](./workflow-planning.md#when-a-plan-earns-its-keep) applies that choice to plan approval.

### Noise Is Inherent — Design Around It

A judge is another probabilistic model. The same input with the same rubric can yield different verdicts on separate calls. This is not a bug; it is a consequence of probability.

**Noise** (random variation across calls) is different from **bias** (consistent skew toward long answers, familiar formats, or self-preference). Rubric calibration reduces bias; it does not eliminate noise. The variance between calls is the measurement error of this instrument.

Design the rubric to minimize bias, then treat noise via repeated measurement:

- **Atomic criteria.** Separate factual grounding, contract fulfillment, completeness, concision, and safety into distinct axes. A single holistic quality score is impossible to audit or improve.
- **Require evidence.** Return criterion-level results with references to the relevant requirement, source, diff, or trace. A bare score is noise masquerading as signal.
- **Calibrate against people.** Compare verdicts against a representative set of human-labeled examples. Disagreement may reveal an ambiguous rubric, a weak judge, or a domain where automation is inappropriate.
- **Control positional bias.** In pairwise evaluation, randomize candidate order and evaluate both orderings. Use a different model family from the generator to reduce self-preference. Instruct the rubric to ignore length and format unless they are criteria.
- **Sample multiple independent judges for high-accuracy claims.** A single LLM call on one model can flip its verdict on a second run. When accuracy matters, run N independent calls (different model families, temperatures, or repeated calls with the same configuration) and aggregate via majority vote — the same pattern as "generate independent candidates and judge them with independent evidence" from [Reliability Levers](./reliability-levers.md). Track agreement rates across calls: frequent disagreement suggests an ambiguous rubric.

The choice of how many judges to sample is a direct expression of your tolerance. Near the throughput end of the spectrum, a single judge is pragmatic. Near the accuracy end, you need a panel — because the consequence of a false accept is radically higher than the cost of the extra calls.

### Version and Monitor Your Instrument

Pin the judge model, rubric, and prompt as versioned measurement equipment. Recalibrate when any component changes, and periodically sample verdicts for human review. Allow `needs_review` as an output rather than forcing a verdict — route low-confidence, high-impact, or conflicting evidence to a person.

Do not use an LLM judge as the only gate when a deterministic check can express the same property, when the model lacks the necessary domain expertise, or when the consequence of error requires human acceptance. It can rank, triage, and extend review capacity; it cannot transfer acceptance ownership.

## Key Takeaways

- **LLM judges are measurement equipment, not arbiters.** They fill the gap between deterministic checks and manual review — useful when every artifact cannot be reviewed by a human.
- **They are one instrument among several.** A deterministic check, a trained critic, or a typed decision model is more credible wherever it can express the same judgment. Choose the least elaborate instrument whose credibility the claim can defend.
- **Noise is inherent; bias is addressable.** Design atomic, evidence-backed rubrics; calibrate against human labels; randomize positional bias. Treat repeated measurement as how you estimate noise, not as a flaw.
- **Sample for accuracy.** When the consequence of a false accept is high, run multiple independent judges across model families and aggregate by majority vote.
- **Version the instrument.** Pin the judge model, rubric, and prompt; recalibrate on change; allow `needs_review` rather than forcing a verdict.

[^judge-critic]: Gandhi et al. (2026), [_Steer, Don't Solve: Training Small Critic Models for Large Code Agents_](https://arxiv.org/abs/2606.21811) — fine-tuned 4B and 8B planning critics improve the resolved rate of six larger coding agents by 16.0% and 14.4% on SWE-Bench Verified, and cut GPT-OSS-20B's per-example inference cost from $0.07 to $0.03.

[^judge-decision-models]: TypeSafe AI (2026), [_System One_](https://docs.typesafe.ai/concepts/system-one) — a state plus typed questions returns calibrated probabilities through `choice`, `score`, and `noul`, with no generated text; Cloudflare (2026), [_Clef_](https://developers.cloudflare.com/workers-ai/models/clef/) — the same interface hosted on Workers AI (`@cf/cloudflare/clef`, $0.24 per M input tokens); Kev (2026), [_kev_](https://github.com/jaredpalmer/kev) — an Apache-2.0 family from 0.8B to 27B that serves the same API and matches Jev within a point of accuracy on held-out sources.

[^judge-validity]: Norman et al. (2026), [_Reliability without Validity: A Systematic, Large-Scale Evaluation of LLM-as-a-Judge Models Across Agreement, Consistency, and Bias_](https://arxiv.org/abs/2606.19544) — "kappa deflation between exact match and Cohen's kappa is universal (33–41 pp on MT-Bench)," and judge rankings shift by up to 14 positions across benchmarks.

[^judge-ensemble]: Zheng et al. (2026), [_Engineering Reliable Commit Gates for Agentic AI: Cost-Aware Verification Portfolios under Common-Mode Data Failures_](https://arxiv.org/abs/2609.10969) — "a cross-model vote over shared evidence approves 62.9% of unsafe proposals, versus 22.9% with an independent source."

[^judge-no-free-checker]: Wan et al. (2026), [_No Free Checker: A Survey of Verifiers for Robot Policies_](https://arxiv.org/abs/2609.09250) — across roughly 150 verifiers in four families (human, rule and formal, learned, model-intrinsic), "credibility falls as availability rises." The survey covers robot policies; the ordering is a principle, not a measurement for coding agents.
