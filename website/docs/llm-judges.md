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
- **Noise is inherent; bias is addressable.** Design atomic, evidence-backed rubrics; calibrate against human labels; randomize positional bias. Treat repeated measurement as how you estimate noise, not as a flaw.
- **Sample for accuracy.** When the consequence of a false accept is high, run multiple independent judges across model families and aggregate by majority vote.
- **Version the instrument.** Pin the judge model, rubric, and prompt; recalibrate on change; allow `needs_review` rather than forcing a verdict.

---

**Next:** [Human Acceptance and Discovery](./human-acceptance-discovery.md)
