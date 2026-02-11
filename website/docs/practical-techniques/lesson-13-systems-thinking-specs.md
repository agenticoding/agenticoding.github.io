---
sidebar_position: 8
sidebar_label: 'Lesson 13: Thinking in Systems'
title: 'Lesson 13: Thinking in Systems'
---

import SystemFlowDiagram from '@site/src/components/VisualElements/SystemFlowDiagram';
import SystemBoundaryDiagram from '@site/src/components/VisualElements/SystemBoundaryDiagram';

[Lesson 12](/docs/practical-techniques/lesson-12-spec-driven-development) established that specs are scaffolding—temporary thinking tools deleted after implementation. But what makes a spec *good enough* to produce quality code?

This lesson covers the spec format section by section, explaining the reasoning behind each. Think of it not as a form to fill out, but as a thinking framework—each section asks a question you might otherwise skip.

## The Manufacturing Paradigm

AI agents execute specs mechanically. Give an agent a well-structured spec, and it produces code that matches. This changes your role: instead of *writing code*, you *articulate intent precisely*—defining what the system must do, what it must prevent, and how you'll know it's working.

Why does precision matter? Because vague specs produce vague code:

| Vague | Precise |
|-------|---------|
| "Handle webhook authentication" | `C-001: NEVER process unsigned webhook — Signature validation on line 1 of handler` |
| "Store payment data" | `I-001: SUM(transactions) = account.balance — Verified by: generate 1K transactions, check sum after each batch` |

The vague version leaves the agent guessing. The precise version narrows the solution space—each constraint becomes a barrier the agent won't cross.

The bottleneck has shifted. When code was expensive to produce, writing it was the hard problem. Now that agents generate code cheaply, *specifying exactly what you want* becomes the hard problem. Researchers call this the shift from "production" to "orchestration + verification"[^1]—you orchestrate what gets built and verify it matches intent.

This has a practical consequence for debugging. When implementation diverges from intent, ask: **is the architecture sound?** If yes, fix the code—the agent made a mechanical error. If the model or boundaries are wrong, fix the spec and regenerate. Code generation is cheap; don't patch around a flawed blueprint.

## Architecture: Modules, Boundaries, Contracts

Every system has internal structure. The architecture section forces you to make that structure explicit.

### Modules

A module is a unit with a single responsibility. Not "handles payments"—that's a category. "Processes Stripe webhook events and updates payment state"—that's a responsibility.

| Module | Responsibility | Boundary |
|--------|---------------|----------|
| webhook-handler | Process Stripe webhooks, update payment state | `src/payment/webhooks/` |
| notification | Send emails on payment events | `src/notification/` |

When you can't articulate what a module does in one sentence, it's doing too much.

### Boundaries

Boundaries define what a module *cannot* import—the coupling constraint.

- **webhook-handler** — NEVER imports from notification or order
- **webhook-handler** — Publishes events to queue, consumers decide action

Boundaries prevent changes in one module from rippling through the system.

### Contracts

Contracts define how modules communicate—what the caller provides (preconditions) and what the callee guarantees (postconditions).

| Provider | Consumer | Contract |
|----------|----------|----------|
| webhook-handler | payment | `processEvent(stripeEventId): PaymentIntent` — precondition: event not yet processed |
| payment | notification | `PaymentEvent { type, paymentId, amount, timestamp }` — postcondition: immutable once published |
| payment | checkout | `createIntent(orderId, amount): PaymentIntent` — precondition: order exists and is unpaid |

### Integration Points

Integration points are the doors in the boundary wall—where traffic crosses from external to internal or vice versa.

| Point | Type | Direction | Owner |
|-------|------|-----------|-------|
| `/webhooks/stripe` | HTTP endpoint | inbound | webhook-handler |
| `/api/v1/payments` | REST API | inbound | payment |
| `payment-events` | Message queue | internal pub/sub | payment |

Direction matters: inbound points need validation and rate limiting; internal pub/sub needs delivery guarantees.

### Extension Points

Not every integration point exists yet. When a specific variation is *committed*—funded, scheduled, required by a known deadline—declare the stable interface now so the current implementation doesn't cement itself.

| Variation | Stable Interface | Current | Planned By |
|-----------|-----------------|---------|------------|
| PayPal checkout | `PaymentGateway` interface | Stripe-only implementation | Q3 — committed |
| Multi-currency | `Amount { value, currency }` | USD-hardcoded | Not committed — omit |

The principle is Protected Variation[^3] (Cockburn/Larman): identify points of predicted variation and create a stable interface around them. The second row stays out—YAGNI gates which variations make it into the spec. Only committed business needs earn an abstraction.

Without this, agents build the simplest correct implementation—a hardcoded Stripe client. When PayPal arrives in Q3, that's a rewrite, not an extension. Declaring the interface now costs one abstraction; omitting it costs a migration.

## State: What Persists, What Changes, What Recovers

State is where bugs hide. The state section forces you to account for what the system remembers.

### Entities

What persists beyond a single request? Where does it live? Who owns it?

| Entity | Persistence | Storage | Owner |
|--------|-------------|---------|-------|
| PaymentIntent | persistent | payments table | payment service |
| WebhookEvent | persistent | webhooks table | payment service |
| ProcessingLock | ephemeral | Redis | payment service |

The distinction matters for crash recovery. If the process dies mid-operation, ephemeral state disappears. Your system must handle that.

### State Models

How you model state determines how you think about transitions.

| Model | Use When | Tradeoff | Key Question |
|-------|----------|----------|-------------|
| Declarative | UI rendering, infrastructure, schema convergence | Simple to reason about; need a reconciler to diff and converge | "What should the end state be?" |
| Event-Driven | Webhooks, messaging, event sourcing, CQRS | Full audit trail and replay; eventual consistency, ordering complexity | "What happened, and in what order?" |
| State Machine | Payment lifecycles, order flows, approval chains | Illegal transitions are impossible; every edge must be enumerated upfront | "What transitions are legal from this state?" |

Declarative is increasingly the default across domains — React reconciles UI, Terraform reconciles infrastructure, SQL declares query results, GitOps reconciles deployments. The core pattern is always the same: `desired_state + reconciliation_loop`. You declare what, something else figures out how. When no reconciler exists for your domain, you're building one — that's the cost.

Choose one model per entity. Payment lifecycle = state machine (pending → processing → succeeded/failed). Webhook ingestion = event-driven (append-only log, at-least-once delivery). Account balance = declarative (`SUM(transactions)` must converge to `account.balance`). The model shapes the code agents generate: state machines produce `switch/case` with explicit transitions, event-driven produces handlers and projections, declarative produces diff-and-patch reconcilers.

### Error States

Errors aren't exceptions to your data model—they're part of it.

| Code | Meaning | Recovery |
|------|---------|----------|
| PAYMENT_PENDING | Awaiting Stripe confirmation | Retry webhook check |
| PAYMENT_FAILED | Stripe declined | Notify user, allow retry |
| WEBHOOK_DUPLICATE | Already processed | Return 200, skip processing |

When you model error states explicitly, recovery paths become obvious.

### Initialization and Crash Recovery

Systems don't start in steady state. Startup ordering and crash recovery determine whether a restart corrupts data or resumes cleanly.

| Order | Component | Depends On | Ready When | On Fail |
|-------|-----------|------------|------------|---------|
| 1 | Database | — | Accepts connections | abort |
| 2 | Cache | Database | Ping succeeds | degrade |
| 3 | HTTP server | DB, Cache | Healthcheck 200 | retry 3×, abort |

If any startup step is not idempotent, a crash-and-restart can corrupt state. Specify what "ready" means for each component, and what happens when readiness fails.

---

Architecture defines the internal skeleton—modules, boundaries, contracts. The next section flips the perspective: what does the system look like from the *outside*?

<SystemBoundaryDiagram />

The dashed line is the key. Everything inside it is architecture: modules connected by contracts. Everything crossing it is an interface: data entering (inputs) or leaving (outputs) the system. Integration points are the doors in the wall.

## Interfaces: Inputs and Outputs

Every system has a surface area—where data enters and exits. While architecture describes internal structure, interfaces describe the system's external surface: what crosses the boundary, in what format, and under what constraints.

### Inputs

| Name | Source | Format | Validation | Rate Limit |
|------|--------|--------|------------|------------|
| Stripe webhook | Stripe (HTTPS POST) | `StripeEvent` JSON | HMAC-SHA256 signature, timestamp < 5min | 10K/min |
| Payment request | Client app (REST API) | `{ orderId: UUID, amount: number }` | JWT auth, orderId exists, amount > 0 | 100/min per client |

Every input crosses the boundary from an external source. The Format column is what you parse; the Validation column is what you reject; the Rate Limit column is what you throttle. Inputs without all three are bugs waiting to happen.

### Outputs

| Name | Destination | Format | SLA |
|------|-------------|--------|-----|
| Webhook ack | Stripe (HTTP response) | `200` empty / `400` error code | < 100ms p95 |
| Payment notification | RabbitMQ (AMQP) | `{ event_type, payment_id, amount, timestamp }` | at-least-once, < 500ms |
| Payment response | Client app (HTTP response) | `{ paymentId, status, created_at }` | < 200ms p95 |

Every output row is a promise to an external consumer. The Format column is the contract they depend on. The SLA column is the promise they'll hold you to.

## Constraints and Invariants: Defining Correctness

Constraints limit *actions* (NEVER do X). Invariants describe *state* (X is always true). Together they define what "correct" means for your system.

### Constraints

| ID | Rule | Verified By | Data | Stress |
|----|------|-------------|------|--------|
| C-001 | NEVER process duplicate webhook | Unique constraint on stripe_event_id | 10K synthetic events, 5% duplicates | 100 concurrent deliveries |
| C-002 | NEVER trust unsigned webhook | Signature validation before processing | Valid + tampered payloads | — |
| C-003 | NEVER log card numbers | PCI compliance scanner in CI | Payloads containing PAN data | — |

The **Data** and **Stress** columns transform a constraint from a wish into a testable requirement. "NEVER process duplicates" is a policy. "NEVER process duplicates, verified with 10K events at 100 concurrent deliveries" is an engineering requirement with a verification plan.

### Invariants

| ID | Condition | Scope | Manifested By |
|----|-----------|-------|---------------|
| I-001 | `payment.status IN (pending, processing, succeeded, failed)` | PaymentIntent | Insert invalid status, assert rejection |
| I-002 | `webhook.processed_at IS NULL OR webhook.event_id IS UNIQUE` | WebhookEvent | Process same event twice, verify single record |
| I-003 | `SUM(transactions) = account.balance` | Account ledger | Generate 1K transactions, verify sum after each batch |

**Manifested By** answers how a test exercises the invariant. Without it, invariants are assertions nobody checks. An invariant violation means your data model is corrupted—make sure you can detect it.

## Verify Behavior: Concrete Scenarios at Boundaries

Constraints say NEVER. Invariants say ALWAYS. Neither answers: what *should* happen when `amount=0`?

Behavioral scenarios fill this gap—concrete Given-When-Then examples at system boundaries, specific enough to become tests without dictating test framework, mocks, or assertion syntax.

| ID | Given | When | Then | Edge Category |
|----|-------|------|------|---------------|
| B-001 | PaymentIntent in `pending` state | Webhook delivers `succeeded` with amount=0 | Transition to `succeeded`, balance unchanged | boundary value |
| B-002 | No matching PaymentIntent | Webhook delivers valid event for unknown intent | Return 200, log warning, no state change | null / missing |
| B-003 | Stripe API returns 503 | Client submits payment request | Return 502, queue for retry, no charge created | error propagation |
| B-004 | Two identical webhooks within 10ms | Both pass signature validation | First processes, second returns 200, no state change | concurrency |

Each scenario traces back to a constraint or invariant—B-001 exercises I-003 (balance integrity), B-004 exercises C-001 (no duplicate processing). The **edge category** column is a systematic checklist: boundary values, null/empty, error propagation, concurrency, temporal. Walk each category per interface; errors cluster at boundaries[^2] because agents don't reliably infer them.

The spec captures *what should happen*, not *how to test it*. Framework choices, mock configurations, and assertion syntax belong in implementation—they change with the codebase. Behavioral examples survive refactoring.

## Quality Attributes: How Good Is Good Enough?

Quality attributes define measurable thresholds across three tiers: target (normal operations), degraded (alerting), and failure (paging).

| Attribute | Target | Degraded | Failure | Measurement |
|-----------|--------|----------|---------|-------------|
| Latency p95 | 100ms | 200ms | 1s | APM traces |
| Availability | 99.9% | 99.5% | 99% | uptime/month |
| Recovery | 15min | 30min | 1h | incident drill |

Target = SLO. Degraded = alerts fire. Failure = on-call gets paged. Three tiers give you an error budget before the first outage and make "good enough" concrete rather than aspirational.

## Performance Budget: Decomposing SLOs

Quality Attributes says "Latency p95: 100ms." But the webhook flow has five steps. Which step gets how many milliseconds?

| Flow Step | Budget | Hot/Cold |
|-----------|--------|----------|
| Signature validation | 2ms | hot |
| Idempotency check (Redis) | 5ms | hot |
| Parse + validate payload | 3ms | hot |
| Update payment state (DB) | 15ms | hot |
| Publish event (queue) | 5ms | cold |
| **Total** | **30ms** | |
| **Headroom** | **70ms** | |

The budget forces two decisions agents can't make alone. First, *hot vs. cold path*: signature validation is synchronous and blocking—it gets a tight budget. Event publishing is async—it tolerates more. Second, *headroom*: the total is 30ms against a 100ms SLO, leaving 70ms for future operations on this path. Without decomposition, an agent might spend the entire budget on a single unoptimized query.

Per-operation budgets also surface algorithmic constraints. If "idempotency check" must complete in 5ms, that rules out a full-table scan—the agent knows to use an indexed lookup or bloom filter without being told.

## Flows: Tracing Execution

Flows trace execution from trigger to completion, revealing integration points and error handling gaps.

<SystemFlowDiagram />

Each step has three parts: what happens, what happens on success, what happens on failure. Flows force you to think through the actual execution path, not an idealized happy-path abstraction.

## Security and Observability: System Properties

These aren't features you bolt on—they're system properties that emerge from correct boundaries and instrumentation.

### Security

Where does trust end? What can an attacker control?

| Threat | Mitigation |
|--------|------------|
| Forged webhook | Signature verification with STRIPE_WEBHOOK_SECRET |
| Replay attack | Idempotency check on event_id |
| Secret exposure | Secrets from env vars, never logged |

:::tip Deep Security Checklist
For systems with significant attack surface, also specify: **Authentication** (how are identities verified?), **Authorization** (who can do what? default deny), **Data Protection** (what's PII? encrypted at rest? retention policy?). See the [full template](/prompts/specifications/spec-template) for the complete format.
:::

### Observability

How do you know it's working?

| Metric | Type | Alert Threshold |
|--------|------|-----------------|
| webhook_processing_duration | histogram | p99 > 5s |
| payment_success_rate | gauge | < 95% over 5min |
| duplicate_webhook_rate | counter | > 10/min |

:::tip Deep Observability Checklist
For production-critical systems, also specify: **Logging** (structured format, correlation IDs, PII redaction), **SLOs** (availability/latency targets, burn-rate alerts), **Tracing** (propagation standard, sampling strategy, key spans). See the [full template](/prompts/specifications/spec-template) for the complete format.
:::

## Deployment and Integration: The Operational Boundary

How a system gets to production and how it behaves when dependencies fail are as much a part of the spec as business logic.

### Deployment Strategy

Specify the deployment method (blue-green, canary, rolling), rollback triggers (what metrics cause auto-rollback?), and migration approach (backward-compatible schema changes for how long?). These decisions affect code structure—canary deployments require feature flags; rolling updates require backward-compatible APIs.

### Integration Dependencies

| Service | Contract | On Failure | Timeout |
|---------|----------|------------|---------|
| Stripe API | REST, idempotency key | Queue for retry, degrade to manual | 5s, circuit breaker at 50% failure |

Circuit breakers, timeouts, and fallback modes define how your system degrades. Without them, one slow dependency cascades into a full outage.

## Matching Depth to Complexity

You don't fill every section. The template prompts systematic *consideration*—each section is a question you might otherwise skip.

| Complexity | Sections | Time |
|------------|----------|------|
| Simple (isolated, familiar) | Architecture + Interfaces + State | Hours |
| Medium (cross-module) | + Constraints + Invariants + Verify Behavior + Flows | Days |
| Complex (architectural) | + Quality Attributes + Performance Budget + Security + Observability + Extension Points | Weeks |
| System-level (new service) | + Deployment + Integration + Initialization | [Full template](/prompts/specifications/spec-template) |

This time is spent *thinking*, not writing. The bottleneck is understanding—researching existing codebase patterns via [exploration planning](/docs/methodology/lesson-3-high-level-methodology#phase-2-plan-strategic-decision) (Lesson 3), investigating best practices and domain knowledge via [ArguSeek](/docs/methodology/lesson-5-grounding#arguseek-isolated-context--state) (Lesson 5), and making architectural decisions. The spec itself is just the artifact of that thinking. Even a simple isolated feature requires hours because you need to trace boundaries, verify assumptions against the existing codebase, and research edge cases before committing to a design.

Once the spec is written, validate it through the [SDD workflow](/docs/practical-techniques/lesson-12-spec-driven-development)—gap-analyze against the codebase, implement, then delete the spec. The code is the source of truth.

:::info Template Sections Not Covered
The [full spec template](/prompts/specifications/spec-template) includes sections not taught in this lesson: **Background** (problem statement + baseline metrics), **Caching** (strategy/TTL/invalidation), **Endpoints** (REST contract details), **Cleanup Flows** (teardown/rollback sequences), **Code Traceability** (file:line evidence columns). Use these when your system's complexity demands them.
:::

## Key Takeaways

- **Precision narrows the solution space** — Vague specs produce vague code. Each constraint becomes a barrier the agent won't cross.

- **Architecture makes structure explicit** — Modules have single responsibilities, boundaries prevent coupling, contracts define communication.

- **State modeling determines transition thinking** — Choose declarative, event-driven, or state machine per entity. The model shapes how agents generate transition code.

- **Constraints and invariants define correctness — with test data and stress** — Data and Stress columns transform constraints from wishes into testable requirements. Manifested By makes invariants verifiable.

- **Quality attributes define "good enough" with three thresholds** — Target = SLO. Degraded = alerts. Failure = pages on-call. Three tiers give you an error budget before the first outage.

- **Security and observability are system properties** — They emerge from correct boundaries and instrumentation, not features bolted on after the fact.

- **Match depth to complexity** — Simple features need three sections. System-level changes use the full template. The template prompts thinking, not bureaucracy.

- **Spec time is thinking time** — Hours to weeks, mostly spent in exploration and research, not writing.

- **Fix specs for architecture, fix code for bugs** — If the architecture is sound, patch the implementation. If the model or boundaries are wrong, fix the spec and regenerate.

- **Performance budgets decompose SLOs into implementation decisions** — A system-level "100ms p95" becomes per-operation allocations that constrain algorithmic choices. Hot/cold path distinction tells agents where latency matters.

- **Behavioral examples at boundaries prevent the gaps agents miss** — Constraints say NEVER, invariants say ALWAYS, but neither specifies what happens at `amount=0`. Concrete Given-When-Then scenarios—not test code—fill the gap where errors cluster.

- **Extension points require committed business needs, not speculation** — Protected Variation: identify predicted change, create a stable interface. YAGNI gates entry—only funded, scheduled variations earn an abstraction.

---

[^1]: Xu et al. (2025) - "When Code Becomes Abundant: Implications for Software Engineering in a Post-Scarcity AI Era" - Argues software engineering shifts from production to orchestration + verification as AI makes code generation cheap. Source: [arXiv:2602.04830](https://arxiv.org/html/2602.04830v1)
[^2]: Boundary Value Analysis research consistently shows errors cluster at input extremes (min, max, off-by-one). See Ranorex, "Boundary Value Analysis" and NVIDIA HEPH framework for AI-driven positive/negative test specification.
[^3]: Cockburn, Alistair / Larman, Craig — "Protected Variation: The Importance of Being Closed" (IEEE Software). Reformulates the Open-Closed Principle as: "Identify points of predicted variation and create a stable interface around them." See also Fowler, Martin — [YAGNI](https://martinfowler.com/bliki/Yagni.html) for the distinction between presumptive and known features.
