---
title: 'Spec Execution'
---

After approval, use the spec to coordinate bounded plans rather than turning it into one large prompt.

## Execute and Analyze Gaps

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

Depth should match risk. A reversible change may need one comparison and its normal tests. Line-by-line diff review sits at the expensive end: it is the most expansive form of human review, one only qualified engineers can perform, so reserve it for changes where the consequences justify that cost. For most work, checking the result against the spec's criteria and boundaries and letting CI run is the right depth. Higher-risk work may justify independent reviewers, stronger acceptance evidence, or manual inspection of dangerous paths. [Reliability Levers](./reliability-levers.md) covers how to select that control.

A spec that no longer reflects approved intent is harmful. Update it when decisions change, or stop using it as the contract. Do not ask future runs to reconcile a knowingly stale artifact with current code.

Once the remaining gap is acceptable, the team's normal review process takes over. Carry the approved intent alongside the code changes: provide the full spec, distill its critical intent and boundaries, or link or attach it to the pull request. Review at the depth the risk warrants before committing, then put the change through the team's usual pull-request, CI, and approval gates. At every review, compare the resulting implementation with the supplied intent rather than judging code quality in isolation.

Spec-driven development strengthens the team's review process rather than replacing it. This handoff also makes placement and lifecycle operational concerns: reviewers need a reliable way to find the intent during delivery, and future maintainers need to know whether it remains authoritative afterward.

## Key Takeaways

- **Execution stays accountable to approved intent.** Check the result against the spec's criteria and boundaries; remove unauthorized extras.
- **Gap analysis is disciplined comparison.** Ask what the spec established, what the code does, what is missing or extra, and what authorized each deviation.
- **Depth should match risk.** A reversible change may need one comparison and CI. Reserve line-by-line diff review for changes where consequences justify the cost.
- **Stale specs are harmful.** Update the spec when decisions change; do not force future runs to reconcile a knowingly outdated artifact.

---

**Next:** [Spec Lifecycle](./spec-lifecycle.md)
