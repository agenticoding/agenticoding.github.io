---
title: 'Spec-Driven Development'
---

[Chapter 4: Four-Phase Workflow](./high-level-methodology.md) introduced the operator loop:

```text
Grounding → Plan → Execute → Validate
```

The **Plan** phase already creates a small spec: a reviewed execution contract for the next run. It says what the agent should do now, what it must not touch, and how the result will be checked.

Spec-driven development applies the same checkpoint at a larger scope.

A **feature spec** describes the whole change before the operator decomposes it into multiple agent runs. The spec is not the plan for one execution. It is the higher-level contract that many plans are derived from.

```text
Feature spec
  ├─ Run 1: Ground → Plan → Execute → Validate
  ├─ Run 2: Ground → Plan → Execute → Validate
  └─ Run 3: Ground → Plan → Execute → Validate
```

That distinction matters. A plan is local. A spec is strategic.

The plan controls the next execution run. The spec controls the feature.

## Specs Are HITL Checkpoints

A spec is a human-in-the-loop checkpoint before implementation momentum takes over.

Without a spec, the agent turns ambiguity into code. It chooses scope, trade-offs, naming, integration strategy, and edge-case behavior inside the diff. By the time a human reviews the result, the wrong assumptions may already be spread across files, tests, and abstractions.

A spec moves that review earlier. The human can inspect the intended change while it is still cheap to correct.

A useful spec lets the reviewer answer:

- Is this the right problem?
- Is the feature boundary correct?
- What are we adding, removing, changing, and protecting?
- Which trade-offs are intentional?
- Which constraints must survive every implementation plan?
- What evidence will prove the feature is done?

This is why readability is not polish. It is the mechanism. A spec nobody reads is not a checkpoint; it is a ritual.

## Spec vs Plan

A spec and a plan are both control artifacts, but they operate at different levels.

| Artifact | Scope | Primary question | Output |
|---|---|---|---|
| **Feature spec** | Full feature or change set | What must be true when this feature is done? | Scope, intent, constraints, acceptance criteria |
| **Execution plan** | One agent run | What should the agent do next? | Sequenced steps, files, commands, validation for this run |

The feature spec should stay above implementation mechanics. It should not usually decide exact helper names, line-by-line edits, or task ordering. Those belong in plans.

The execution plan should be narrower. It takes the approved spec, grounds in the current codebase, and defines the next bounded unit of work.

For example, a rate-limiting feature spec might define:

- anonymous users get one limit
- authenticated users get another
- admins are exempt
- login stays exempt
- Redis outage fails open
- existing auth behavior must not change

From that spec, the operator may create separate execution plans for:

1. discovering the middleware and cache patterns
2. adding the limiter
3. adding tests
4. running gap analysis and cleanup

Each plan is a small local spec for one run. The feature spec remains the larger contract.

## Where Specs Sit in the Agentic SDLC

Specs sit earlier than implementation. They turn rough intent into a reviewed feature boundary before the operator starts decomposing work.

```text
Request
  ↓
Research the product, codebase, constraints, and risks
  ↓
Write the feature spec
  ↓
Human reads, edits, approves, or rejects
  ↓
Decompose into execution loops
  ↓
Ground → Plan → Execute → Validate
  ↓
Gap-analyze code against the feature spec
  ↓
Repeat until the remaining gap is acceptable
```

The spec does not eliminate the four-phase workflow. It feeds it.

Every execution loop still needs grounding. The agent must read the approved spec and the current code. Specs do not replace code research; they tell the agent what the code research is trying to satisfy.

## A Good Spec Serves Two Readers

A spec has two audiences.

The **human** needs a compact checkpoint. They need to see the scope, risk, and trade-offs quickly enough to make a real judgment.

The **agent** needs a guardrail. It needs concrete boundaries that survive decomposition into multiple plans and implementation runs.

Good specs are therefore:

- **Short enough to read seriously** — if the human skims, the checkpoint failed.
- **Structured enough to execute from** — if the agent cannot map the spec to tasks and checks, the guardrail failed.
- **Higher-level than plans** — if the spec is full of file-by-file steps, it is doing the plan's job.
- **Concrete about scope** — vague intent creates implementation drift.
- **Explicit about non-goals** — agents need to know what not to improve.

The goal is not maximum detail. The goal is the smallest artifact that preserves the feature boundary.

## What Different Spec Lengths Feel Like

Token counts are approximate. The point is not exact measurement; the point is review ergonomics.

A 500-token spec can be read carefully. A 1K-token spec is still manageable for most feature work. A 2K-token spec is already a serious checkpoint; if it feels dense, split the feature.

:::note
The examples below use lorem ipsum so the shape is visible without adding another real feature example. In practice, every line should carry scope, constraints, rationale, or acceptance signal.
:::

<details>
<summary>~500 tokens: small enough for a quick but real review</summary>

```markdown
# Feature Spec: Lorem Checkout Receipts

## Why
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Customers need a
clear post-checkout receipt so support, finance, and account owners can verify
what happened without opening three different screens.

## Add
- Receipt summary on the checkout confirmation page
- Downloadable receipt link for completed purchases
- Email receipt copy sent to the billing contact
- Receipt ID visible in the admin order timeline

## Remove
- Nothing

## Change
- Confirmation page now shows billing metadata after payment succeeds
- Support order search can match on receipt ID

## Keep / Protect
- Existing payment authorization flow
- Existing invoice generation job
- Current refund behavior
- Existing tax calculation source of truth

## Guardrails
- Do not create a second receipt model
- Do not change payment capture timing
- Do not expose internal processor IDs to customers
- If receipt generation fails, show checkout success and log the receipt error

## Acceptance
- Completed checkout shows receipt ID, amount, tax, and billing contact
- Receipt download is unavailable until payment succeeds
- Billing contact receives one receipt email per completed order
- Support can search by receipt ID
- Existing refund and invoice tests still pass

## Open Questions
- Should receipts include purchase-order metadata in the first release?
```

</details>

<details>
<summary>~1K tokens: typical feature-scope checkpoint</summary>

```markdown
# Feature Spec: Lorem Team Seat Management

## Why
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Workspace admins need
to manage seats without contacting support for routine changes. The business
needs this because support volume grows with every enterprise rollout, and the
current manual flow creates delayed onboarding.

## Add
- Admin screen for viewing assigned and available seats
- Invite flow that consumes one available seat when accepted
- Remove-seat action for inactive members
- Audit events for seat assignment, removal, and failed assignment
- Billing preview that shows the next invoice impact before confirmation

## Remove
- Manual support-only seat adjustment path for normal admin changes
- Legacy copy that tells admins to email support for seat updates

## Change
- Invite acceptance checks seat availability before activating the member
- Workspace settings navigation includes a Seats entry for admins
- Billing preview is shown before destructive or cost-changing actions

## Keep / Protect
- Owner permissions remain stronger than admin permissions
- Existing member deactivation behavior stays unchanged
- Existing billing provider remains the source of truth for paid quantity
- Existing audit log format and retention rules remain unchanged

## Non-Goals
- No self-serve plan upgrades
- No annual contract renegotiation workflow
- No bulk CSV import
- No changes to SSO provisioning in this release

## Guardrails
- Do not create a parallel billing quantity field
- Do not bypass the existing permission middleware
- Do not silently drop audit events; fail visibly if audit logging is unavailable
- Do not let admins remove the last workspace owner

## Acceptance
- Admin can see total, assigned, and available seats
- Admin can invite a user when a seat is available
- Invite acceptance fails with clear copy when no seat remains
- Admin can remove an inactive member and free the seat
- Last owner cannot be removed
- Billing preview appears before any action that changes paid quantity
- Audit log records who changed seats, when, and which member was affected

## Validation
- Permission tests cover owner, admin, member, and external user
- Billing preview test covers monthly and annual workspaces
- Audit tests assert the existing event envelope
- Manual QA covers invite acceptance from a fresh email link

## Open Questions
- Should pending invites reserve seats immediately or only on acceptance?
- Should removed members keep access to historical invoices?
```

</details>

<details>
<summary>~2K tokens: upper bound before splitting becomes attractive</summary>

```markdown
# Feature Spec: Lorem Usage-Based Alerts

## Why
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Customers with usage
based billing need earlier warning before they cross budget thresholds. Today
they discover overages after invoice generation, which creates support tickets,
refund requests, and account escalations. The feature should make spend risk
visible without changing metering or billing authority.

## Add
- Workspace-level usage alert configuration
- Thresholds at 50%, 80%, 100%, and custom percentage values
- Email notifications to owners and selected billing contacts
- In-app alert banner when the current workspace crosses an active threshold
- Audit events when alert rules are created, changed, disabled, or triggered
- Admin activity entry linking triggered alerts to the usage period
- Backfill-safe job that evaluates thresholds for the current billing period

## Remove
- Static help text that says customers should contact support for usage alerts
- Internal-only feature flag copy from the billing settings screen

## Change
- Billing settings includes a Usage Alerts section for owners
- Usage dashboard shows alert status next to current period usage
- Notification preferences include usage-alert email controls
- Existing usage aggregation job publishes threshold evaluation input

## Keep / Protect
- Billing provider remains the source of truth for invoices and charge amounts
- Existing metering ingestion, deduplication, and correction behavior remain unchanged
- Existing invoice generation and payment collection timing remain unchanged
- Workspace owner permission model remains unchanged
- Existing notification unsubscribe rules remain enforceable
- Usage dashboard performance budget remains within current page-load limits

## Non-Goals
- No hard spending caps in this release
- No automatic plan downgrade or suspension
- No invoice recalculation
- No per-user budget controls
- No Slack, Teams, or webhook delivery
- No alert templates editable by customers

## User Stories
- As a workspace owner, lorem ipsum dolor sit amet so I can know when usage is approaching budget.
- As a billing contact, consectetur adipiscing elit so I can warn finance before invoice close.
- As support, sed do eiusmod tempor incididunt so I can see which alerts fired before a ticket arrived.

## Guardrails
- Do not introduce a second usage counter
- Do not send notifications from request/response paths
- Do not expose internal meter event IDs in customer-facing UI
- Do not send duplicate threshold emails for the same workspace, period, and threshold
- Do not mark an alert as delivered until the notification provider accepts it
- If threshold evaluation fails, surface operational telemetry and retry; do not block usage ingestion

## Data and State
- Alert rule belongs to one workspace
- Alert rule stores threshold, enabled state, recipients, creator, and update timestamp
- Trigger state is keyed by workspace, billing period, threshold, and rule ID
- Trigger state prevents duplicate sends while allowing replay after failed delivery
- Audit events reference rule ID and trigger state ID, not raw meter events

## Execution Slices
1. Ground existing usage aggregation, notification, permission, and audit patterns
2. Add alert rule persistence and owner-only management UI
3. Add threshold evaluation job and duplicate-send protection
4. Add email and in-app notification surfaces
5. Add audit visibility and support-facing traceability
6. Run gap analysis against this spec and remove accidental scope

## Acceptance
- Owner can create, edit, disable, and delete alert rules
- Non-owner cannot manage alert rules
- 50%, 80%, 100%, and custom thresholds can be configured
- Alert fires once per workspace, billing period, rule, and threshold
- Failed notification delivery retries without duplicating accepted sends
- Usage ingestion continues when alert evaluation fails
- In-app banner appears after threshold crossing and disappears when dismissed
- Audit log records create, update, disable, delete, and trigger events
- Existing invoice, metering, and payment tests still pass

## Validation
- Unit tests cover threshold crossing, duplicate suppression, disabled rules, and retry behavior
- Permission tests cover owner, admin, member, and external user access
- Integration test covers aggregation output flowing into threshold evaluation
- Notification test verifies unsubscribe rules are respected
- Manual QA covers owner configuration, banner dismissal, and email receipt
- Gap analysis compares final code against Add, Change, Keep / Protect, Guardrails, and Acceptance sections

## Rollout
- Ship behind workspace-level feature flag
- Enable for internal workspaces first
- Monitor notification volume, job latency, duplicate suppression, and support tickets
- Remove flag only after one billing period without duplicate-send incidents

## Open Questions
- Should custom thresholds allow values over 100%?
- Should billing contacts receive alerts by default or require opt-in?
- Should dismissed banners reappear when a higher threshold fires?
- Which support view should show alert trigger history first?
```

</details>

If the 2K-token version already feels heavy with realistic structure and placeholder content, imagine reviewing it with real constraints, exceptions, and product nuance. That is the point. Long specs must earn their length.

## What a Useful Feature Spec Contains

Use this as a starting shape, not a mandatory template.

```markdown
# Feature Spec: API Rate Limiting

## Why
Protect API routes from abuse without changing existing authentication behavior.

## Add
- Rate limiting for `/api/*` routes
- Separate limits for anonymous and authenticated users
- `429` responses with `Retry-After`

## Remove
- Nothing

## Change
- API request handling now checks rate limits before route handlers run

## Keep / Protect
- Existing auth behavior
- Existing error response format
- Existing Redis/cache abstraction
- `/api/auth/login` remains exempt

## Guardrails
- Do not introduce a new cache client
- Do not refactor auth middleware
- If Redis is unavailable, fail open and log a warning

## Acceptance
- Anonymous users are limited to 100 requests/hour
- Authenticated users are limited to 1000 requests/hour
- Admins are unlimited
- Exempt routes are not limited
- Limit failures return `429` and `Retry-After`
- Redis outage does not block traffic

## Open Questions
- Should limits be configurable per environment?
```

The section names are doing work:

- **Why** gives the human the product and system rationale.
- **Add / Remove / Change / Keep** makes scope review explicit.
- **Guardrails** tell agents where not to improvise.
- **Acceptance** gives validation and gap analysis a target.
- **Open Questions** prevents guesses from hiding inside confident prose.

The spec is not trying to be complete implementation knowledge. It is trying to be a readable feature contract.

## Writing the Spec Is Its Own Agent Loop

Do not ask an agent to write a spec from a vague request and then treat the first draft as truth.

Writing the spec is itself an agentic workflow:

```text
Research → Draft → Read → Revise
```

For production work, run that loop multiple times.

### Research

Ground the spec in the actual world:

- current code patterns
- product requirements
- user workflows
- security and privacy constraints
- existing tests
- external API behavior
- prior decisions and rejected approaches

Ask the agent for evidence. File paths, existing interfaces, route names, product constraints, and unknowns matter. A spec without evidence is often just plausible prose.

### Draft

Have the agent produce the spec in the feature-level structure. Keep it above implementation mechanics. If it starts listing exact edits and command sequences, ask it to move those into a future plan.

### Read

Validation at this stage means reading. The human is not checking whether code works yet. They are checking whether the feature contract is right.

Read for:

- missing scope
- accidental scope creep
- unclear acceptance criteria
- hidden assumptions
- implementation details pretending to be requirements
- constraints that should be explicit guardrails

### Revise

Correct the spec before code exists. This is the cheap point. Once execution begins, mistakes become files, tests, abstractions, and follow-on reasoning.

## Building from the Spec

After approval, the operator decomposes the spec into execution loops.

For each loop:

```text
Ground in the spec + current code
  ↓
Plan the next bounded execution run
  ↓
Execute
  ↓
Validate the result
```

The feature spec stays stable enough to coordinate the work. The plans stay small enough to execute reliably.

A rate-limiting feature might become:

| Loop | Local plan |
|---|---|
| 1 | Identify middleware, auth, cache, and error-response patterns |
| 2 | Add the limiter using existing integration points |
| 3 | Add tests for user classes, exceeded limits, and Redis failure |
| 4 | Review implementation against the spec and fix gaps |

Each loop has its own plan because each loop needs current grounding. The codebase changes after every execution. The next plan should be based on the approved feature spec and the code that exists now, not the code that existed when the feature spec was written.

## Gap Analysis: Compare Code Back to the Spec

Implementation does not end when the agent says it is done. Compare the resulting code against the feature spec.

Ask:

1. **What did the spec require?**
2. **What did the code implement?**
3. **What is missing, conflicting, or extra?**
4. **Is the spec wrong, or is the code wrong?**

For the rate-limiting example, gap analysis might find:

- middleware exists
- anonymous and authenticated limits work
- `429` response exists
- login exemption was missed
- Redis failure fails closed instead of open
- implementation introduced a new cache wrapper despite the guardrail

That output becomes the next plan.

```text
Gap analysis → Plan fixes → Execute → Validate → Repeat
```

The number of cycles depends on risk. [Chapter 7: Reliability Levers](./reliability-levers.md) gives the broader model: use the control that matches the failure mode.

- Low-risk work can use one cheap gap-analysis pass.
- Medium-risk work may need fresh-context review plus tests.
- High-risk work may need independent reviewers, stricter acceptance checks, and manual inspection of dangerous paths.

There is no universal amount of process. The spec gives you a target; reliability levers decide how hard you push toward it.

## Single Source of Truth: Specs Are Temporary

A spec is useful because it creates a second source of truth before implementation. That is also why it must not live forever as a duplicate description of the system.

During the work, the spec is the feature contract. After the work, the code should become the source of truth.

The cleanup step is:

1. Move operational knowledge into code.
2. Move durable verification into tests.
3. Archive only residual rationale that cannot live in code.
4. Delete or close the spec.

### Move Knowledge into Code

If future agents need a constraint to work safely, put it where they will find it during code research.

Use:

- clear names
- local types and constants
- nearby validation logic
- tests around user-facing contracts
- short inline comments for non-obvious WHAT/WHY/HOW

This connects directly to [Chapter 12: Writing Agent-Friendly Code](./agent-friendly-code.md). Agents discover code through search and file reads. If a rule matters locally, make it locally recoverable.

For example:

```ts
// Rate limiting fails open because blocking all API traffic during Redis
// outages is worse than temporary abuse risk. Keep auth enforcement separate.
if (!redisAvailable) {
  logger.warn('Rate limiter unavailable; allowing request')
  return next()
}
```

That comment preserves the decision where future agents need it. The spec can go away because the important operational knowledge migrated into the system.

### Archive Only Residual WHY

Some knowledge does not belong in code:

- marketing rationale
- business constraints
- compliance context
- rejected solutions
- stakeholder decisions
- historical trade-offs

Keep that as a short decision record if it will matter later. Do not keep a stale feature spec just because it contains one paragraph of useful rationale.

The rule is simple:

```text
Operational truth → code and tests
Residual rationale → decision record
Everything else → delete or close
```

Long-lived specs that duplicate code create cache invalidation problems. Future agents may read stale docs and current code, then have to guess which one is true. Avoid that. Let code research recover HOW from the code. Preserve only the WHY that code cannot express.

## Key Takeaways

- **A plan is a small spec for one execution run.** An SDD feature spec is broader: it covers the full feature scope and feeds many plans.
- **Specs are HITL checkpoints.** They let humans approve scope, intent, constraints, and acceptance before implementation choices spread through the codebase.
- **Readable specs are more reliable specs.** If nobody reads the artifact carefully, the checkpoint failed.
- **Good specs define add/remove/change/keep.** Scope needs positive and negative boundaries.
- **Specs drive multiple agent loops.** Each loop still grounds, plans, executes, and validates against the current codebase.
- **Gap analysis compares code back to the feature spec.** Iterate until the remaining gap matches the risk tolerance.
- **Specs are temporary scaffolding.** Move operational knowledge into code and tests, archive residual WHY, then delete or close the spec.

---

**Next:** [Chapter 9: Tests as Guardrails](./tests-as-guardrails.md)
