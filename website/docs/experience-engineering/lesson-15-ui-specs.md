---
sidebar_position: 2
sidebar_label: 'UI Specs'
sidebar_custom_props:
  sectionNumber: 15
title: 'UI Specs — Components, Flows, and State'
---

With design tokens established in [Lesson 14](/experience-engineering/lesson-14-design-tokens), this lesson defines the components, flows, and state transitions that consume them. These three sections are the minimum viable UI spec — enough to generate a first pass. The rest emerges as the code pulls depth from you.

The running example: a **team dashboard for a SaaS billing product** — subscription plans, usage metrics, invoices, team management, and settings. Rich enough to exercise components, flows, state, responsive layouts, and view states.

## User Story & Success Metrics

**Why before what.** Every UI spec starts with the user story and measurable KPIs — the stopping condition for iteration.

| Element | Example |
|---------|---------|
| Problem | "Team admins can't understand billing status at a glance" |
| Success metric | Task completion rate > 90%, time-to-insight < 5s |
| Failure metric | Rage clicks > 2%, abandonment rate > 15% |

KPI categories:

| Category | Examples | Measured By |
|----------|----------|-------------|
| **Efficiency** | Task completion time, clicks-to-goal | Analytics events, session recordings |
| **Effectiveness** | Success rate, error rate | Form submissions, retry counts |
| **Satisfaction** | Rage clicks, abandonment, NPS | Heatmaps, exit rate, surveys |

Accessibility and internationalization KPIs (WCAG compliance, locale coverage, RTL correctness) live in their respective architecture sections in [Lesson 16](/experience-engineering/lesson-16-accessibility-i18n) — they're architectural constraints, not standalone metrics.

Metrics are the completion test. When the agent's implementation meets these thresholds as measured by browser automation, iteration stops.

## Components: Props, Responsibilities, and Rules

Components are units of UI responsibility with explicit APIs. Props define what a component **accepts**. Rendered output defines what it **guarantees**. Accessibility attributes are **non-negotiable** — always present, never conditional.

Throughout the Experience Engineering lessons and the [UI spec template](/prompts/specifications/experience-spec-template), you'll see IDs like `A-001` or `L-003`. These are constraint IDs — labels you put in the spec that the agent carries into code comments during implementation, making rules grep-able and verifiable across the codebase. For the code-level mechanics, see [Lesson 11](/practical-techniques/lesson-11-agent-friendly-code#comments-as-context-engineering-critical-sections-for-agents).

### Component Table

| Component | Responsibility | Boundary | API |
|-----------|---------------|----------|-----|
| `SubscriptionCard` | Display plan name, price, status | Never fetches data directly | Props: `plan: Plan`, emits: `onUpgrade(planId)` |
| `UsageChart` | Render usage over time | No business logic | Props: `data: TimeSeriesPoint[]`, `period: DateRange` |
| `TeamMemberList` | List members with roles | No direct API calls | Props: `members: Member[]`, emits: `onRoleChange`, `onRemove` |
| `InvoiceTable` | Display invoices with sort/filter | No direct API calls | Props: `invoices: Invoice[]`, emits: `onDownload(id)` |
| `SettingsForm` | Edit user/team settings | No direct persistence | Props: `settings: Settings`, emits: `onSave(settings)` |

All text-bearing components accept translation keys, never hardcoded strings (L-001).

### Component Interfaces

| Parent | Child | Interface |
|--------|-------|-----------|
| `DashboardPage` | `SubscriptionCard` | `plan: Plan` — expects: plan object has `name`, `price`, `status` |
| `SubscriptionCard` | `DashboardPage` | `onUpgrade(planId: string)` — fires only when user clicks upgrade CTA |
| Any component | Screen reader | `role`, `aria-label`, `aria-live` — non-negotiable: always present on interactive elements (A-001) |

### Component Responsibilities

- `SubscriptionCard` — NEVER imports from `TeamMemberList` or `UsageChart`
- `SubscriptionCard` — NEVER calls APIs directly — receives data via props
- Shared kernel: `src/components/primitives/` — buttons, inputs, typography (design token consumers)

Responsibility leaks are the first thing to check when an agent's implementation diverges from spec. If the agent wired `SubscriptionCard` directly to an API, the component responsibility split is wrong — fix the spec or make it more explicit.

### Component Libraries as Agent Context

When building on an established component library (shadcn/ui, Radix, Ant Design, Material UI), the library already defines primitive behavior — accessible button, modal, tooltip, form controls. The spec only needs to define **domain-specific** behavior on top.

Example: `SubscriptionCard` uses `<Card>` from shadcn/ui. The agent already knows Card's API from library documentation. Your spec defines the domain props (`plan: Plan`, `onUpgrade`) and responsibility rules, not how a card renders a shadow.

Include component library references in your project's CLAUDE.md / AGENTS.md ([Lesson 6](/practical-techniques/lesson-6-project-onboarding)): import conventions, preferred primitives, and any overrides. This dramatically reduces spec surface and improves agent output because the agent operates within a constrained, well-documented design system.

## Flows: Interaction Traces

Flows trace a user's path through the interface step by step — what happens on success, what happens on failure, and what the user sees at each transition. Each flow step maps to a **component state transition** and an **API call**.

### Flow: Upgrade Subscription

```
1. User clicks "Upgrade" on SubscriptionCard
   → Show plan comparison modal
   → Focus moves to modal heading (A-006)
   → On cancel: close modal, return focus to trigger button (A-007), no state change

2. User selects new plan, clicks "Confirm"
   → Show loading state (skeleton in confirmation area)
   → Call billing API: POST /subscriptions/upgrade
   → On success: show success toast (announced via aria-live="polite", A-008),
     update SubscriptionCard, close modal, return focus to SubscriptionCard
   → On API error (4xx): show inline error in modal, keep modal open
   → On network error: show retry banner, keep modal open

3. Dashboard refreshes subscription data
   → On success: metrics update in real-time
   → On stale data: show "Refreshing..." indicator
```

### Flow: Team Member Management

```
1. Admin clicks "Add Member" in TeamMemberList
   → Show invite form (email, role selector)
   → Focus moves to email input (A-006)
   → On cancel: close form, return focus to "Add Member" button (A-007)

2. Admin enters email, selects role, clicks "Send Invite"
   → Validate email format (client-side)
   → On invalid: show inline validation error, keep form open,
     announce error via aria-live="assertive" (A-009)
   → Call team API: POST /team/invites
   → On success: show success toast, add pending member to list
   → On 409 (already invited): show inline error "Already invited"
   → On 403 (insufficient permissions): show error,
     should not reach here (CTA hidden for non-admins)
```

All user-visible strings in flows use translation keys. Pluralization follows ICU MessageFormat (L-003).

### Behavioral Scenarios

Each flow step above is a behavioral scenario waiting to happen. The [UI spec template](/prompts/specifications/experience-spec-template) includes a Given/When/Then table for converting flow steps into concrete, automatable test cases. At minimum, cover five edge categories: boundary values (min/max inputs), null/empty states (no data loaded), error propagation (API failures), concurrency (rapid clicks, simultaneous updates), and temporal edge cases (slow network, stale data).

Agents handle the happy path correctly and miss the error and edge branches. Annotating each flow step with all three outcomes (success, expected error, unexpected error) prevents the agent from generating optimistic-only implementations.

## The UI Stack: Five View States[^1]

Every data-bound view has exactly five states. Omitting any is a bug:

| State | What User Sees | Screen Reader Announcement | Constraint |
|-------|---------------|---------------------------|------------|
| **Ideal** | Data rendered correctly | Content available via landmarks and labels | Must match design spec |
| **Loading** | Skeleton/spinner | Container has `aria-busy="true"` (A-002) | Must appear within 100ms of trigger; skeleton preferred for layout stability |
| **Error** | Error message + recovery action | Error announced via `aria-live="assertive"` (A-003) | Must have actionable CTA (retry, contact support); never show raw error |
| **Empty** | Helpful empty state | Guidance text perceivable, not just visual (A-004) | Must guide user to action ("No invoices yet. Create your first invoice.") |
| **Partial** | Some data loaded, some failed | Failed section announced, rest navigable (A-005) | Must not block entire view for one failed section |

### UI Stack Constraints

| ID | Rule | Verified By |
|----|------|-------------|
| V-001 | NEVER show a blank screen — always show one of the five states | Browser automation: disconnect network mid-load, verify error state renders |
| V-002 | NEVER show raw error messages to users | Browser automation: trigger 500 from mock, verify user-friendly message |
| V-003 | ALWAYS show loading state within 100ms of async action | Browser automation: throttle network, measure time-to-skeleton |

Agents consistently miss the **Partial** and **Empty** states. If the spec doesn't enumerate all five explicitly with examples, the agent will implement only Ideal and Loading — then the first empty dataset or partial API failure renders a blank screen.

**Choosing a state model.** Pick one model per view entity, not per app. Three options: **Declarative** — you define the desired state, a reconciler (React, for example) figures out how to get there. Best for data display (tables, charts, read-only views). **State machine** — you enumerate every legal state and transition. Best for multi-step flows (forms, wizards, modals with distinct phases). **Event-driven** — you react to incoming events as they arrive. Best for real-time data (WebSocket feeds, collaborative editing, live notifications). For the system-level perspective on these models (event sourcing, CQRS, entity lifecycles), see [Lesson 13: State Models](/practical-techniques/lesson-13-systems-thinking-specs#state-models).

## Layouts and Responsiveness

Layouts define **how components are arranged** — the spatial structure of the page.

### Layout Table

| Layout | Structure | Breakpoints | Components |
|--------|-----------|-------------|------------|
| `DashboardGrid` | 12-col grid, sidebar + main | Desktop: sidebar+main, Tablet: stacked, Mobile: single column | `Sidebar`, `MetricsRow`, `ContentArea` |
| `SettingsLayout` | 2-col: nav + panel | Desktop: side-by-side, Mobile: nav→panel drill-down | `SettingsNav`, `SettingsPanel` |

RTL layouts mirror the entire grid — sidebar switches sides, reading order reverses. Use logical properties (`inline-start`/`block-start`) for all spatial tokens (L-002). See [Lesson 16: Accessibility & Internationalization](/experience-engineering/lesson-16-accessibility-i18n#internationalization-architecture) for the full RTL model.

### Responsiveness as Constraint

| Breakpoint | Viewport | Layout Adaptation | Token Scale |
|------------|----------|-------------------|-------------|
| Mobile | < 768px | Single column, bottom nav | spacing.base = 8px |
| Tablet | 768–1024px | Collapsed sidebar, 2-col content | spacing.base = 8px |
| Desktop | > 1024px | Full sidebar, 3-col dashboard | spacing.base = 8px |
| Large | > 1440px | Max-width container, increased spacing | spacing.base = 10px |

**Accessibility constraints:** Touch targets ≥ 44px on mobile (WCAG 2.5.5, A-012). Tab order must follow visual reading order per breakpoint (A-013). Zoom to 200% must not cause horizontal scroll (A-014). Animation duration scales down on `prefers-reduced-motion` preference.

Agents implement desktop-first by default. If your layout spec requires mobile-first breakpoints, state this explicitly: "implement mobile layout first, then add tablet and desktop as progressive enhancements." Without this constraint, the agent generates desktop CSS and retrofits mobile as an afterthought — producing brittle media queries.

The [UI spec template](/prompts/specifications/experience-spec-template) includes a **Performance Budget** section with Core Web Vitals targets (FCP, LCP, CLS, INP) and bundle size limits. Include these when performance is a constraint — particularly on mobile where bundle size and INP thresholds are tighter.

## Key Takeaways

- **UI specs define component APIs, not screens** — components, flows, and state transitions are the specification units, not mockups or wireframes.

- **Start with three sections** — Components, Flows, and State are the minimum viable spec. Everything else is pulled by the code.

- **Every view has five states** — ideal, loading, error, empty, partial (the UI Stack[^1]). Agents consistently miss empty and partial — enumerate all five explicitly, or the first empty dataset renders a blank screen.

- **Component libraries are agent context** — reference library primitives by name in the spec; define only domain-specific behavior on top. Include library docs and import conventions in CLAUDE.md.

- **Agents build desktop-first, happy-path-only by default** — UI specs exist to constrain these failure modes through explicit breakpoint tables, error state enumeration, and non-negotiable accessibility rules.

---

[^1]: Hurff, Scott (2015) — ["Why Your User Interface Is Awkward: You're Ignoring the UI Stack"](https://www.scotthurff.com/posts/why-your-user-interface-is-awkward-youre-ignoring-the-ui-stack) — Introduced the five UI states (Ideal, Empty, Error, Partial, Loading) as a framework for designing complete interfaces.
