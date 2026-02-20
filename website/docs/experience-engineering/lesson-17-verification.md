---
sidebar_position: 4
sidebar_label: 'Verification & the Build Loop'
sidebar_custom_props:
  sectionNumber: 17
title: 'Verification & the Build Loop'
---

This lesson closes the loop: spec ([Lessons 14–16](/experience-engineering/lesson-14-design-tokens)) → build → check → repeat → delete. The preceding lessons defined what to build — design tokens, component APIs, accessibility constraints. This lesson covers how to verify the agent built it correctly, how to iterate when it didn't, and when to stop.

## Skip the Mockup: Build the Real Thing

CLI agents have collapsed the cost gap between "mock it" and "build it." When an agent can build real UI components in your actual codebase — consuming your design system, respecting your component responsibilities, wired to behavior mocks — in the same time it takes to describe what you want in a sandboxed tool, the economic rationale for a separate prototyping step disappears. Build the real thing with mock data. Validate the actual experience.

| Dimension | Sandboxed generators (v0, Lovable) | CLI agents (Claude Code, Cursor) |
|-----------|-------------------------------------|----------------------------------|
| Codebase awareness | None — generates isolated components | Full — reads your architecture, patterns, design system |
| Integration cost | Manual migration into real project | Zero — builds in your actual codebase |
| Accessibility | Visual approximation | Real accessibility tree via `snapshot -ic` |
| Responsiveness | Preview panel | Real CSS, real breakpoints, real browser |
| State coverage | Happy path only | All five UI Stack states with behavior mocks |
| What you validate | A picture of the experience | The actual experience |

**Behavior mocks close the gap.** The [Behavior Mocks](#detailed-behavior-template-driven-sections) section below covers this in detail: MSW handlers define the backend contract — request shapes, response shapes, status codes, error scenarios. The agent builds real components consuming those contracts. You validate real accessibility (landmarks, focus management, keyboard model), real responsiveness (actual breakpoints, not a preview panel), and all five UI Stack states — not approximations. When the backend is ready, swap mock handlers for real API calls. Delete the mocks when verified. This is the strangler fig pattern applied to frontend-backend integration.

The workflow: spec component APIs → agent builds real UI with behavior mocks → verify with browser automation (`snapshot -ic`) → iterate on gaps → swap mocks for real APIs → delete mocks. No separate prototyping tool. No migration step. What you verify is what ships.

Sandboxed generators exist, and they produce pretty output. But they have zero codebase awareness — every generated component is an integration task waiting to happen. For the workflow this section teaches (spec → generate → verify via accessibility tree → converge), they *add* a step (generate elsewhere, then migrate) where CLI agents *remove* it (generate in place, verify immediately).

## Browser Automation: Closing the Loop

Browser automation verifies that implementation matches spec — the verification step that closes the spec → build → check cycle.

### Verification Loop

```
UI Spec (what you intend)
    ↓
Agent generates UI code
    ↓
Browser automation verifies
    → snapshot -ic: capture component tree via accessibility refs
    → Verify: correct components rendered, correct states, correct content
    → Interact: click @ref, fill @ref "text", press Enter
    → Verify: state transitions match flow spec
    ↓
Gaps found? → Is the component architecture sound?
    → Yes: fix code (agent made a mechanical error)
    → No: fix spec, regenerate (component hierarchy / flow / state model is wrong)
    ↓
Done → Delete spec, mocks become contracts, code is truth
```

### What Browser Automation Verifies

| Spec Section | Verification Method |
|-------------|-------------------|
| Components | `snapshot -ic` → verify component tree matches hierarchy |
| UI Stack (5 states) | Throttle network → verify loading/error states render |
| Flows | Execute step-by-step: `click @ref` → `snapshot -ic` → verify next state |
| Permissions | Switch auth context → verify elements hidden/disabled per role |
| Responsiveness | Set viewport size → `snapshot -ic` → verify layout adaptation |
| Animations | `is visible @ref` after transition → verify element state changed |
| Accessibility (keyboard) | Tab through all interactive elements → verify focus order matches spec |
| Accessibility (screen reader) | `snapshot -ic` → verify landmarks, labels, live regions, `aria-busy`/`aria-live` attributes |
| Internationalization | Switch locale → `snapshot -ic` → verify translated strings, RTL layout, formatted dates/numbers |

`snapshot -ic` returns the **accessibility tree**, not pixels. This means:
- Verification is deterministic (not pixel-dependent)
- It simultaneously validates accessibility (correct roles, labels)
- It's what screen readers see — if the agent can operate the UI via accessibility refs, so can assistive technology

This is a direct consequence of the [perceptual limitation](/experience-engineering/lesson-14-design-tokens#why-agents-need-you-for-ui): vision can tell you the page looks broadly correct, but cannot tell you the button has exactly 8px padding or that the border is `gray-300` instead of `gray-200`. Use both — vision for general guidance during development, the accessibility tree for exact verification.

| Concern | Vision (screenshots) | Accessibility tree (`snapshot -ic`) |
|---------|---------------------|--------------------------------------|
| Missing section or component | Detects reliably | Detects reliably |
| Wrong layout direction (LTR vs RTL) | Detects reliably | Detects via logical structure |
| Component hierarchy | Detects broad issues | **Authoritative** — exact tree structure |
| Focus order and keyboard model | Cannot verify | **Authoritative** — tab sequence, focus target |
| Landmark structure | Cannot verify | **Authoritative** — roles, labels, live regions |
| Spacing, padding, border precision | Below resolution floor | Not in scope — use computed styles or visual regression |
| Color accuracy at fine granularity | Below resolution floor | Not in scope — use visual regression |
| Layout shifts and overlapping elements | Detects major issues | Not in scope — use visual regression |

Three verification layers: vision for broad structural guidance, accessibility tree for deterministic structural verification, visual regression (Chromatic, Percy, Playwright's `toHaveScreenshot()`) for pixel-level fidelity.

For projects using browser automation as the verification layer, add `snapshot -ic` conventions and accessibility verification commands to your CLAUDE.md / AGENTS.md ([Lesson 6](/practical-techniques/lesson-6-project-onboarding)). The agent should verify its own output against the spec's accessibility constraints as a post-implementation step — same principle as running tests after generating code.

## Detailed Behavior: Template-Driven Sections

The [UI spec template](/prompts/specifications/experience-spec-template) provides the full structure for writing UI specs. Start with Components + Flows + State (Tier 1), then add sections as the code pulls depth (Tier 2–4):

| Tier | Sections | When to Add |
|------|----------|-------------|
| 1 — Core | Components, Flows, State | Always — minimum viable spec |
| 2 — Structural Drivers | Design Tokens, Layouts, Accessibility, Internationalization | When the code reveals gaps in constraints |
| 3 — Detailed Behavior | Animations, Entry Points, Permissions, Settings | When behavior needs tightening |
| 4 — Integration | Behavior Mocks, Browser Automation, Performance Budget | When connecting to backend specs or verifying |

Tier 3 and 4 sections each constrain specific agent behaviors. The template has the complete structure; here's what each section does and why it matters for agent implementation:

| Section | Key Insight | Agent Constraint |
|---------|------------|-----------------|
| **Animations & Transitions** | State transitions made visible. Always respect `prefers-reduced-motion` (A-017). | Prevents agents from adding gratuitous animation without reduced-motion fallbacks. |
| **Entry Points & Routing** | Every URL is a valid entry point. Focus moves to main heading on direct navigation (A-015). | Prevents agents from building SPA-only navigation that breaks on bookmark/refresh. |
| **Permissions** | UX concern, not just security. `aria-disabled="true"` with explanation, not `disabled` attribute (A-018). | Prevents agents from hiding admin-only controls entirely — "disabled with explanation" is different from "hidden." |
| **Settings** | User-controlled design tokens that override the semantic layer. Density, theme, language, timezone. | Gives agents explicit scope for what users can customize vs. what's fixed by the design system. |
| **Behavior Mocks** | Frontend-backend contract via MSW. Mock handlers define request/response shapes, status codes, error scenarios. Deleted when real API is verified. | Gives agents a working API contract without requiring backend availability. Strangler fig integration pattern. |

## Iterate, Then Delete

The spec is a hypothesis. The agent's code is an experiment. Browser automation is the observation. Start with Components + Flows + State. The agent builds a first pass. Then ask: **is the component architecture sound?**

- **Yes** → fix code (agent made a mechanical error)
- **No** → fix spec, regenerate (component hierarchy / flow / state model is wrong)

Each loop reveals what the spec missed — a view state you didn't anticipate, a focus management gap, a responsive breakpoint the agent skipped. Iteration stops when:
- Browser automation passes all behavioral scenarios
- The UI spec accounts for all states the code revealed
- Last pass surfaces no new gaps
- Delete the spec — code + mock contracts + accessibility tree are the source of truth

UI iteration is fast because browser automation provides immediate structural and visual feedback — you see whether the agent's output is right within seconds, not minutes. The engineer who runs ten spec → build → check loops per day outperforms the one who writes a more thorough spec upfront. For the same pattern applied to system architecture, see [Lesson 13: Converge, Don't Count Passes](/practical-techniques/lesson-13-systems-thinking-specs#converge-dont-count-passes).

## Key Takeaways

- **Vision guides, the accessibility tree verifies** — multimodal models process screenshots as 16×16 pixel patches, making them excellent for broad structural guidance but unable to verify pixel-level details. Use vision during development to spot major issues; rely on `snapshot -ic` for exact verification; add visual regression testing for pixel-level fidelity.

- **Skip the mockup — CLI agents build real UI in your actual codebase** — sandboxed generators produce isolated components that require migration. CLI agents build in place, consuming your design system, and verify immediately via the accessibility tree.

- **Behavior mocks are contracts, not shortcuts** — MSW handlers define the interface between frontend and backend, and are deleted when the real API is verified. Strangler fig pattern applied to frontend-backend integration.

- **Spec → build → check → repeat** — the agent builds, browser automation checks, you fix either spec or code. Iterate until no gaps remain. Same pattern as system specs ([Lesson 13](/practical-techniques/lesson-13-systems-thinking-specs)), different verification tool.

- **Delete the spec when done** — code + mock contracts + accessibility tree are the source of truth.
