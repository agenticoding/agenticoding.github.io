---
title: 'Spec Drafting and Approval'
---

Agent assistance is useful when it lowers the cost of discovering and expressing intent. It becomes risky when a polished draft makes the agent's additions look like settled human decisions.

## Drafting and Approval

### Set the boundary before the draft

Start with a proportional, human-authored starting intent. For a small change, it may be a sentence and a few bullets. For consequential work, state the intended outcome, essential behavior, significant boundaries and non-goals, and the decisions the agent must surface rather than make. The starting intent need not predict every derived requirement; it must make later scope additions visible.

A practical loop is:

```text
Human starting intent → Research → Draft: derived requirements + separate scope proposals → Adversarial review: challenge, trace, remove → Fix without silent expansion → Human accepts/rejects/defers/clarifies → Approve
```

### Research

Research means the agent reads the real evidence: current code, tests, git history, API contracts, past decisions, and known failure modes. Web search covers what the codebase cannot: industry conventions, community post-mortems, and established benchmarks. Ask the agent to cite what it read — file paths, test names, commit messages, source links — and to keep facts separate from assumptions.

An agent researching a checkout change might report: "the payment service retries failed charges, so duplicate orders need idempotency" — a fact that shapes a requirement. If it also notices "the invoice endpoint is broken," that is an opportunity, not a requirement — and the agent must label which is which.

Discovery is evidence, not authorization. A fact can justify a requirement; an opportunity only becomes a proposal the human decides on. In a benchmark of coding-agent execution, removing explicit consent raised the share of Claude Code's actions the user had not asked for from 0% to 17.1%.[^1] The study tests execution rather than spec drafting, so the numbers do not transfer directly — but they show why an agent must not treat a plausible opportunity as permission.

### Draft

Choose a structure that exposes the important uncertainty. Keep requirements and consequential design constraints in the spec; leave file-by-file edits and command sequences for execution plans. Separate requirements traceable to the human starting intent from agent-proposed expansions. A useful proposal may be well supported and still remain opt-in.

### Adversarial review

Grilling is the slang for this: having one or more LLM passes attack the draft before human attention is spent on it. The pass tries to break the draft, not approve it — it challenges claims, assumptions, and boundaries, and checks them against the code and the web instead of taking the draft's word. A pass that finds nothing suspicious is a red flag: an LLM that praises the draft without probing it has not done its job. The grill can justify surfacing an expansion, but it cannot authorize one. Its output is a list of challenged decisions.

### Fix

Fix applies the corrections the grill's findings justify, records the unresolved questions, and rejects the unfounded critique — without silently expanding scope. A finding the grill calls important is still a proposal, not a decision: keep it separate until the human decides. Repeat the review-and-fix pass when the risk justifies it.

Grilling and fixing tighten the draft before the human reads it. They do not establish ownership: LLM review is still probabilistic, and only the human can decide whether the resulting intent is right.

### Read and decide

Only then does the human read what changed since the starting intent. For every significant proposal, they accept, reject, defer, or clarify it — and they challenge hidden assumptions, weak evidence, and implementation detail disguised as a requirement. Approval is the conclusion of that work, not a substitute for it.

That ordering matters. People who commit to their own judgment before seeing AI advice accept that advice blindly far less often — at the cost of effort and usability.[^2] Confidence cuts the other way: the more people trust their AI assistant, the less critically they think about its output.[^3] Both point the same way: the human decides before agent output becomes the decision.

An agent-generated draft that receives only a skim has not transferred intent to the human. The checkpoint exists only when the person who owns the spec can explain and defend the approved direction.

Drafting cycles depend on the case. A familiar, reversible change may need one pass. Novel, costly, or dangerous work may need domain reviewers, alternatives, prototypes, or several revisions before approval.

## Key Takeaways

- **Set the boundary before the draft.** Start with a human-authored intent that makes later scope additions visible. A polished draft that bypasses this starting point risks turning agent proposals into settled decisions.
- **Research is evidence, not authorization.** An agent can surface facts that shape requirements, but opportunities remain proposals until the human approves. Label which is which.
- **Adversarial review finds weaknesses.** Grilling challenges the draft against code and external evidence rather than approving it. A pass that finds nothing suspicious has not done its job.
- **The human decides before agent output becomes the decision.** Approval is the conclusion of human judgment, not a skim of AI-generated prose. People who judge first accept AI advice more critically.

[^1]: Qu et al. — benchmark of coding-agent execution. [arXiv:2605.18583](https://arxiv.org/abs/2605.18583)
[^2]: Buçinca, Malaya, and Gajos — 199-participant experiment. [doi:10.1145/3449287](https://doi.org/10.1145/3449287)
[^3]: Lee et al. — 319 knowledge workers, 936 examples. [doi:10.1145/3706598.3713778](https://doi.org/10.1145/3706598.3713778)

---

**Next:** [Spec Execution](./spec-execution.md)
