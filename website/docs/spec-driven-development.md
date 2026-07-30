---
title: 'Spec-Driven Development'
---

import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';
import SpecExecutionRunsDiagram from '@site/src/components/VisualElements/SpecExecutionRunsDiagram';

A feature spec is a **reviewable expression of intent**. It becomes human-owned only where the responsible human makes the decisions.

An agent can research the problem, draft the artifact, challenge assumptions, revise the language, and originate scope. Approval does not retroactively turn hidden agent-originated scope into human intent. It establishes ownership only when material additions are visible and the human chooses to accept, reject, defer, or clarify them.

That decision-making makes the spec a human-in-the-loop checkpoint. Without it, the agent turns ambiguity into code: scope, trade-offs, integration choices, and edge-case behavior get decided inside the diff. A spec moves those decisions to a cheaper point, where the human can still reject the direction without unwinding an implementation.

The artifact has two jobs:

- Give humans a compact surface for judging intent, boundaries, risk, and evidence.
- Give agents a stable target across multiple plans and execution runs.

A spec nobody reads carefully is not a checkpoint. It is a ritual.

## Spec vs. Plan

[Chapter 4: Four-Phase Workflow](./high-level-methodology.md) uses a plan as the reviewed contract for one execution run. A feature spec operates one level above it.

| Artifact           | Scope                | Primary question                          | Typical content                                         |
| ------------------ | -------------------- | ----------------------------------------- | ------------------------------------------------------- |
| **Feature spec**   | The whole change     | What must be true when this work is done? | Intent, boundaries, constraints, trade-offs, evidence   |
| **Execution plan** | The next bounded run | What should the agent do next?            | Steps, files, commands, and validation for current code |

One spec may feed several plans:

<DiagramFrame kicker="Execution boundaries" title="One stable spec, several bounded runs" size="wide" caption="The approved feature spec remains the human-owned contract. Every run re-grounds against the code state left by the preceding run before making its next plan.">
  <SpecExecutionRunsDiagram />
</DiagramFrame>

The spec stays above mechanics that can be decided from current code. Each plan grounds again because the codebase changes after every run.

## Make Intent Reviewable

A useful spec contains enough information for a reviewer to decide whether the proposed change is right, not merely whether the prose looks complete. Depending on the uncertainty, that might include:

- the problem and intended outcome
- scope boundaries and non-goals
- system or product constraints
- consequential trade-offs and rejected alternatives
- observable acceptance signals
- unresolved questions that must not become agent guesses

Acceptance signals set the floor: what must be true. Boundaries and non-goals set the ceiling: what the work must not absorb. Meeting the floor by shipping unapproved extras still violates the intent.

Make provenance reviewable as well. Keep the human intent anchor, requirements derived from evidence, and agent-proposed scope distinguishable. A sentence can say what evidence makes a requirement necessary or why an addition is only a proposal; the distinction can also live in annotations or the review delta. It does not require a universal schema.

These are concerns, not mandatory headings. A narrow correction may need a paragraph and a checklist. A cross-system migration may need scenarios, diagrams, risk analysis, rollout conditions, and decision records. Repeating an empty section because a template contains it adds review cost without adding control.

The right shape is the smallest artifact that preserves the intent and the risky boundaries. Format, length, and drafting process should follow the case rather than a canonical template.

## Shape Follows Review Cost

The examples below demonstrate how length changes the cost of serious review. They are not token budgets, quality tiers, or reusable templates. Counts are approximate, and all three examples use neutral lorem ipsum so only the structure and reading burden remain visible.

Each example deliberately uses a different shape. Real specs should do the same when their uncertainty differs.

### Approximately 500 tokens: a compact boundary

A short artifact can still expose intent, limits, evidence, and one unresolved decision.

```markdown
# Compact Spec

## Intent

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
vulputate pulvinar nunc, sed fringilla sem posuere vel. Nunc metus eros,
finibus nec rhoncus vitae, volutpat at turpis.

## Claims & Constraints

- Nunc auctor ultricies nunc et fermentum. Vivamus sit amet enim a est
  molestie posuere at non diam. Mauris pharetra ultricies tempor. Nullam
  laoreet risus tincidunt, semper nibh in, hendrerit metus.
- Vivamus interdum tortor at leo consequat maximus. In hac habitasse
  platea dictumst. Donec vitae maximus turpis, vel pulvinar nunc. Nullam
  nec viverra quam. Duis eget molestie velit.
- Integer ultricies felis elit, in ullamcorper risus rutrum posuere.
  Integer tortor nunc, molestie semper pretium id, mattis ac lorem.
- Pellentesque erat leo, posuere in tortor at, lobortis luctus dui.
  Quisque hendrerit ex at nulla lobortis, vel condimentum eros
  vestibulum.

## Evidence

- [ ] Etiam nec consequat dolor, nec ultrices mauris. Curabitur nec vestibulum
      tellus. Nulla facilisi. Nunc ut consequat nisl. Vivamus id
      volutpat ante, in consequat lectus.
- [ ] Etiam mollis tempor purus eget consequat. Integer nec purus quis tellus
      ultricies tristique vel et dui. Nam elit elit, venenatis sed felis
      ut.
- [ ] Sed luctus sapien id ante interdum, vel lacinia augue dignissim. Integer
      eget enim eu libero convallis imperdiet. Mauris suscipit vel ante
      id lobortis.

## Unresolved

Mauris luctus aliquam lorem, nec mattis ex commodo sed. In laoreet
tristique elit, nec congue tortor cursus nec. Donec molestie fermentum
egestas. Fusce non porttitor ligula.
```

### Approximately 1K tokens: a broader review surface

At this size, scenarios and trade-offs can coexist, but the reviewer must hold more relationships in mind.

```markdown
# Review Brief

> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
> vulputate pulvinar nunc, sed fringilla sem posuere vel. Nunc metus eros,
> finibus nec rhoncus vitae, volutpat at turpis.

## Context

Duis lacinia tortor ut nibh fermentum, aliquet pellentesque erat
pharetra. Vestibulum aliquet ipsum vel interdum pellentesque. Duis
tincidunt sit amet augue ac ullamcorper. Phasellus nec consequat lorem.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vel
facilisis lacus. In in enim dictum, porta mauris id, fringilla nibh.

## Decision Notes

1. Nunc auctor ultricies nunc et fermentum. Vivamus sit amet enim a est
   molestie posuere at non diam. Mauris pharetra ultricies tempor.
   Nullam laoreet risus tincidunt, semper nibh in, hendrerit metus.
2. Vivamus interdum tortor at leo consequat maximus. In hac habitasse
   platea dictumst. Donec vitae maximus turpis, vel pulvinar nunc.
   Nullam nec viverra quam. Duis eget molestie velit.
3. Integer ultricies felis elit, in ullamcorper risus rutrum posuere.
   Integer tortor nunc, molestie semper pretium id, mattis ac lorem. Sed
   pulvinar accumsan leo, sed blandit leo iaculis vel.

## Scenarios

### Alpha

Proin ut odio tortor. Nulla aliquet cursus leo, sit amet bibendum nisi
sollicitudin at. Maecenas laoreet aliquet felis, ut volutpat odio cursus
tincidunt. Nullam ac leo sit amet nulla convallis mattis.

### Beta

Etiam nec consequat dolor, nec ultrices mauris. Curabitur nec vestibulum
tellus. Nulla facilisi. Nunc ut consequat nisl. Vivamus id volutpat
ante, in consequat lectus. Suspendisse quis est vel nulla suscipit
condimentum et ac orci. Aliquam accumsan diam enim, non varius massa
sollicitudin vel.

### Gamma

Etiam mollis tempor purus eget consequat. Integer nec purus quis tellus
ultricies tristique vel et dui. Nam elit elit, venenatis sed felis ut,
sodales euismod purus. Ut ac ipsum ut sem euismod sagittis non non dui.
Quisque eget dictum tellus. Duis egestas elit odio. Vestibulum mattis id
felis ac euismod.

## Constraints

- Duis vulputate nibh metus, quis facilisis diam feugiat nec. In facilisis
  metus in ante congue, eget imperdiet magna auctor.
- Aliquam erat volutpat. Suspendisse sit amet nibh non lectus dictum
  pretium quis commodo lorem. Nam semper diam et laoreet gravida.
- Nulla facilisi. Aliquam semper eros risus, et viverra ex ornare a. Proin
  a tortor mauris. Maecenas euismod magna velit.
- Mauris luctus aliquam lorem, nec mattis ex commodo sed. In laoreet
  tristique elit, nec congue tortor cursus nec.

## Review Signals

- [ ] Fusce vestibulum nunc et enim pharetra sagittis. Fusce tortor quam,
      hendrerit at ultrices vel, aliquam ornare leo.
- [ ] Donec sed volutpat arcu. Sed efficitur dolor id faucibus lobortis.
      Pellentesque habitant morbi tristique senectus et netus et
      malesuada fames ac turpis egestas.
- [ ] Aliquam eu interdum lectus. Nulla cursus ornare sodales. Fusce feugiat
      dui vestibulum efficitur consectetur. Maecenas et congue mi.

## Questions

- Nunc auctor ultricies nunc et fermentum. Vivamus sit amet enim a est
  molestie posuere at non diam. Mauris pharetra ultricies tempor.
- Integer ultricies felis elit, in ullamcorper risus rutrum posuere.
  Integer tortor nunc, molestie semper pretium id, mattis ac lorem.
```

### Approximately 2K tokens: an expensive checkpoint

A longer artifact can coordinate more uncertainty. It also makes omissions, contradictions, and casual skimming harder to detect. The added structure must earn that cost.

```markdown
# Extended Proposal

## Premise

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
vulputate pulvinar nunc, sed fringilla sem posuere vel. Nunc metus eros,
finibus nec rhoncus vitae, volutpat at turpis. Phasellus placerat
vulputate turpis vel egestas. Curabitur lorem tortor, ultricies ut
molestie at, pellentesque id ante. Nam non ullamcorper nibh. Sed
feugiat, sem a feugiat eleifend, turpis mauris convallis nisi, congue
pretium sem turpis id sem.

## Operating Narrative

### Condition Alpha

Duis lacinia tortor ut nibh fermentum, aliquet pellentesque erat
pharetra. Vestibulum aliquet ipsum vel interdum pellentesque. Duis
tincidunt sit amet augue ac ullamcorper. Phasellus nec consequat lorem.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vel
facilisis lacus. In in enim dictum, porta mauris id, fringilla nibh.

### Condition Beta

Nunc auctor ultricies nunc et fermentum. Vivamus sit amet enim a est
molestie posuere at non diam. Mauris pharetra ultricies tempor. Nullam
laoreet risus tincidunt, semper nibh in, hendrerit metus.

### Condition Gamma

Vivamus interdum tortor at leo consequat maximus. In hac habitasse
platea dictumst. Donec vitae maximus turpis, vel pulvinar nunc. Nullam
nec viverra quam. Duis eget molestie velit.

## Boundaries

### Included

- Nunc auctor ultricies nunc et fermentum. Vivamus sit amet enim a est
  molestie posuere at non diam. Mauris pharetra ultricies tempor. Nullam
  laoreet risus tincidunt, semper nibh in, hendrerit metus. Mauris
  sollicitudin tincidunt augue vel volutpat. Aenean elementum efficitur
  sapien sed laoreet.
- Integer ultricies felis elit, in ullamcorper risus rutrum posuere.
  Integer tortor nunc, molestie semper pretium id, mattis ac lorem. Sed
  pulvinar accumsan leo, sed blandit leo iaculis vel.

### Excluded

- Duis vulputate nibh metus, quis facilisis diam feugiat nec. In facilisis
  metus in ante congue, eget imperdiet magna auctor.
- Aliquam erat volutpat. Suspendisse sit amet nibh non lectus dictum
  pretium quis commodo lorem. Nam semper diam et laoreet gravida.
- Nulla facilisi. Aliquam semper eros risus, et viverra ex ornare a. Proin
  a tortor mauris. Maecenas euismod magna velit.

## Risk Register

### Concern 1

**Condition:** Fusce vestibulum nunc et enim pharetra sagittis. Fusce tortor quam,
hendrerit at ultrices vel, aliquam ornare leo. Maecenas ultrices neque
in mi condimentum vehicula.

**Response:** Donec sed volutpat arcu. Sed efficitur dolor id faucibus lobortis.
Pellentesque habitant morbi tristique senectus et netus et malesuada
fames ac turpis egestas. Curabitur at luctus arcu.

### Concern 2

**Condition:** Aliquam eu interdum lectus. Nulla cursus ornare sodales. Fusce feugiat
dui vestibulum efficitur consectetur. Maecenas et congue mi. Nam
venenatis justo enim.

**Response:** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
vulputate pulvinar nunc, sed fringilla sem posuere vel. Nunc metus eros,
finibus nec rhoncus vitae, volutpat at turpis.

### Concern 3

**Condition:** Pellentesque erat leo, posuere in tortor at, lobortis luctus dui.
Quisque hendrerit ex at nulla lobortis, vel condimentum eros vestibulum.
In luctus tellus metus, sit amet elementum diam imperdiet ac.

**Response:** Proin ut odio tortor. Nulla aliquet cursus leo, sit amet bibendum nisi
sollicitudin at. Maecenas laoreet aliquet felis, ut volutpat odio cursus
tincidunt. Nullam ac leo sit amet nulla convallis mattis.

## Evidence Plan

### Review

- [ ] Etiam nec consequat dolor, nec ultrices mauris. Curabitur nec vestibulum
      tellus. Nulla facilisi. Nunc ut consequat nisl.
- [ ] Etiam mollis tempor purus eget consequat. Integer nec purus quis tellus
      ultricies tristique vel et dui. Nam elit elit, venenatis sed felis
      ut.
- [ ] Sed luctus sapien id ante interdum, vel lacinia augue dignissim. Integer
      eget enim eu libero convallis imperdiet. Mauris suscipit vel ante
      id lobortis.

### Verification

- [ ] Mauris luctus aliquam lorem, nec mattis ex commodo sed. In laoreet
      tristique elit, nec congue tortor cursus nec.
- [ ] Nam euismod neque nec risus interdum convallis. Donec sed massa at risus
      consectetur imperdiet. Nam non tristique augue.
- [ ] Mauris vel dolor bibendum augue interdum posuere non ac leo. Praesent at
      semper elit. Nulla hendrerit nibh id tortor efficitur suscipit.

## Sequence

1. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
   vulputate pulvinar nunc, sed fringilla sem posuere vel. Nunc metus
   eros, finibus nec rhoncus vitae, volutpat at turpis. Phasellus
   placerat vulputate turpis vel egestas. Curabitur lorem tortor,
   ultricies ut molestie at.
2. Duis lacinia tortor ut nibh fermentum, aliquet pellentesque erat
   pharetra. Vestibulum aliquet ipsum vel interdum pellentesque. Duis
   tincidunt sit amet augue ac ullamcorper. Phasellus nec consequat
   lorem. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
3. Nunc auctor ultricies nunc et fermentum. Vivamus sit amet enim a est
   molestie posuere at non diam. Mauris pharetra ultricies tempor.
   Nullam laoreet risus tincidunt, semper nibh in, hendrerit metus.
4. Vivamus interdum tortor at leo consequat maximus. In hac habitasse
   platea dictumst. Donec vitae maximus turpis, vel pulvinar nunc.
   Nullam nec viverra quam. Duis eget molestie velit.
5. Integer ultricies felis elit, in ullamcorper risus rutrum posuere.
   Integer tortor nunc, molestie semper pretium id, mattis ac lorem.
6. Pellentesque erat leo, posuere in tortor at, lobortis luctus dui.
   Quisque hendrerit ex at nulla lobortis, vel condimentum eros
   vestibulum.

## Decision Record

> Proin ut odio tortor. Nulla aliquet cursus leo, sit amet bibendum nisi
> sollicitudin at. Maecenas laoreet aliquet felis, ut volutpat odio cursus
> tincidunt. Nullam ac leo sit amet nulla convallis mattis.

## Unresolved

- Etiam nec consequat dolor, nec ultrices mauris. Curabitur nec vestibulum
  tellus. Nulla facilisi. Nunc ut consequat nisl. Vivamus id volutpat
  ante, in consequat lectus. Suspendisse quis est vel nulla suscipit
  condimentum et ac orci. Aliquam accumsan diam enim, non varius massa
  sollicitudin vel.
- Etiam mollis tempor purus eget consequat. Integer nec purus quis tellus
  ultricies tristique vel et dui. Nam elit elit, venenatis sed felis ut,
  sodales euismod purus. Ut ac ipsum ut sem euismod sagittis non non
  dui. Quisque eget dictum tellus. Duis egestas elit odio. Vestibulum
  mattis id felis ac euismod.
```

The useful question is not "How long should a spec be?" It is "Can the responsible reviewers still understand and challenge this intent?" Split the change, add structure, or shorten the artifact when the answer is no.

## Drafting and Approval

Agent assistance is useful when it lowers the cost of discovering and expressing intent. It becomes risky when a polished draft makes the agent's additions look like settled human decisions.

### Set the boundary before the draft

Start with a proportional, human-authored intent anchor. For a small change, it may be a sentence and a few bullets. For consequential work, state the intended outcome, essential behavior, material boundaries and non-goals, and the decisions the agent must surface rather than make. The anchor need not predict every derived requirement; it must make later scope additions visible.

A practical loop is:

```text
Human intent anchor → Research → Draft: derived requirements + separate scope proposals → LLM grill: challenge/trace/remove → Fix without silent expansion → Human accepts/rejects/defers/clarifies → Approve
```

### Research

Ground claims in available evidence: current code, product behavior, constraints, tests, external systems, prior decisions, and known risks. Ask the agent to cite concrete evidence and separate facts from assumptions. Research may reveal requirements necessary to satisfy the anchor and opportunities that would expand it. Discovery is evidence, not authorization; label which is which.

Adjacent evidence supports an explicit authorization boundary. In a benchmark of coding-agent execution, [Qu et al. found](https://arxiv.org/abs/2605.18583) that removing explicit consent raised Claude Code's paired overeager-action rate from 0% to 17.1%. The study tests execution rather than spec drafting, so it does not establish the same rate here. It does show why an agent should not infer permission from a plausible opportunity.

### Draft

Choose a structure that exposes the important uncertainty. Keep requirements and consequential design constraints in the spec; leave file-by-file edits and command sequences for execution plans. Separate requirements traceable to the human anchor and evidence from agent-proposed expansions. A useful proposal may be well supported and still remain opt-in.

### LLM grill

Before spending human attention, have one or more LLM passes attack the draft. For each material item, ask which approved intent requires it, what evidence supports it, whether it fills an unstated boundary or proposes a new feature, and whether removing it would violate the anchor. Require findings to cite the draft or grounding evidence. The grill can justify surfacing an expansion, but it cannot authorize one. Its job is to expose contradictions and unnecessary content, not reward the draft for accumulating scope.

### Fix

Apply corrections and requirements derived from the anchor, record unresolved questions, and reject unfounded critique. Never auto-promote an expansion because the grill calls it important or substantiated. Keep it separate until a human decides. Repeat the grill-and-fix pass when the risk justifies it.

This stage reduces the expensive human review surface; it does not establish ownership. LLM review is still probabilistic, and only the human can decide whether the resulting intent is right.

### Read and decide

Only then does the human inspect the delta from the intent anchor. For every material proposal, they accept, reject, defer, or clarify it; they also challenge hidden assumptions, weak evidence, and implementation detail disguised as a requirement. Approval follows those boundary decisions rather than replacing them.

This ordering adds productive friction. In a 199-participant experiment, [Buçinca, Malaya, and Gajos](https://doi.org/10.1145/3449287) found that cognitive forcing—especially making an independent judgment before seeing AI advice—reduced overreliance, with effort and usability costs. In a separate study of 319 knowledge workers and 936 examples, [Lee et al.](https://doi.org/10.1145/3706598.3713778) found that higher task-specific confidence in GenAI was associated with less self-reported critical-thinking engagement. That result is correlational, and neither study tests spec approval end to end; both support preserving a real human decision point before agent output becomes the default.

An agent-generated draft that receives only a skim has not transferred intent to the human. The checkpoint exists only when the accountable person can explain and defend the approved direction.

The number of drafting cycles is case-dependent. A familiar, reversible change may need one pass. Novel, costly, or dangerous work may need domain reviewers, alternatives, prototypes, or several revisions before approval.

## Execute and Analyze Gaps

After approval, use the spec to coordinate bounded plans rather than turning it into one large prompt.

For each run:

```text
Ground in approved intent + current code
  ↓
Plan the next bounded change
  ↓
Execute and validate
  ↓
Compare the result with the spec
```

Gap analysis asks:

1. What intent and boundaries did the spec establish?
2. What does the current code actually do?
3. What is missing, conflicting, or extra?
4. Which approved decision authorizes each extra behavior?
5. Did implementation drift, or did new evidence make the spec wrong?

A missing requirement produces another implementation plan. Unauthorized extra code is removed or deferred. If discovery justifies changing the target, treat that discovery as evidence rather than authorization: turn it into a proposed spec revision and obtain approval before implementation continues. A decision that the remaining gap is acceptable may acknowledge an explicit shortfall or trade-off; it must not silently bless extras that nobody authorized. This keeps the spec authoritative without pretending it is infallible.

Depth should match risk. A reversible change may need one comparison and its normal tests. Higher-risk work may justify independent reviewers, stronger acceptance evidence, or manual inspection of dangerous paths. [Chapter 7: Reliability Levers](./reliability-levers.md) covers how to select that control.

A spec that no longer reflects approved intent is harmful. Update it when decisions change, or stop using it as the contract. Do not ask future runs to reconcile a knowingly stale artifact with current code.

Once the remaining gap is acceptable, the team's normal review process takes over. Carry the approved intent alongside the code changes: provide the full spec, distill its critical intent and boundaries, or link or attach it to the pull request. Review the complete diff locally before committing, then put it through the usual pull-request review, CI, and approval gates. At every review, compare the resulting implementation with the supplied intent rather than judging code quality in isolation.

Spec-driven development strengthens the team's review process rather than replacing it. This handoff also makes placement and lifecycle operational concerns: reviewers need a reliable way to find the intent during delivery, and future maintainers need to know whether it remains authoritative afterward.

## Choose Location and Lifecycle Deliberately

A spec should live where the people and agents doing the work can review, retrieve, and update it. Several locations can be valid:

| Location                                | Useful when                                                    | Main trade-off                                         |
| --------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Issue or project tracker**            | Discussion, assignment, and approval happen with delivery work | May be separated from code history and offline tooling |
| **In-repo RFC or design document**      | Versioning beside code and repository-native review matter     | Can look authoritative after behavior has moved on     |
| **Shared document or knowledge system** | Cross-functional review and rich collaboration matter          | Access, versioning, and agent retrieval may be weaker  |

Choose based on review workflow, access controls, versioning, traceability, agent access, and expected lifetime—not on a universal default.

Lifecycle is equally case-dependent. A delivery spec may be closed after implementation. An RFC may remain as a historical decision record. A protocol or policy spec may continue to define behavior and require updates alongside code. Whatever the model, name the active authority and the update rule so agents do not have to guess between conflicting descriptions.

When implementation becomes the operational authority, perform an explicit handoff:

- Put enforceable behavior in code, types, validation, configuration, and tests.
- Keep non-obvious local rationale near the code when future changes depend on it.
- Retain broader decisions or rejected alternatives in an appropriate durable record when they still matter.
- Archive, close, update, or remove the delivery artifact according to its intended lifecycle.

This resolves deliberate duplication without imposing one destination for every kind of knowledge. [Chapter 10: Writing Agent-Friendly Code](./agent-friendly-code.md) covers how to make operational constraints recoverable during code research.

## Key Takeaways

- **Human ownership attaches to decisions, not documents.** Approval establishes ownership only when responsible humans see and choose material boundaries and additions.
- **A draft can anchor scope before the human decides.** Keep evidence-derived requirements and agent-proposed expansions distinguishable so polished prose does not make additions opt-out.
- **Discovery is not authorization.** New opportunities found during research, critique, or execution remain proposals until the human approves a revised scope.
- **A spec is a checkpoint, not a template.** Its shape and length follow uncertainty, risk, and review cost.
- **Specs and plans control different scopes.** The spec coordinates the whole change; each plan controls one grounded execution run.
- **Execution stays accountable to approved intent.** Compare code with the spec, remove unauthorized extras, and re-approve the spec when new evidence changes the target.
- **Location and lifecycle are design choices.** Make authority, update rules, and the eventual handoff explicit.

---

**Next:** [Chapter 9: Validation](./validation.md)
