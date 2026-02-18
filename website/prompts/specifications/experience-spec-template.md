---
title: Experience Specification Template
sidebar_position: 3
---

import ExperienceSpecTemplate from '@site/shared-prompts/_experience-spec-template.mdx';

## Experience Specification Template

A structured template for writing experience (frontend/UI) specifications. Use this when
designing user-facing features, planning component architecture, or documenting interaction
flows for AI agent implementation.

For **system/backend** specs, use the
[System Spec Template](/prompts/specifications/spec-template) instead.

### The Template

<ExperienceSpecTemplate />

### How to Use

1. Start with **Tier 1** (Components + Flows + State) — the minimum viable spec. Add sections from
   Tier 2–4 as the code pulls depth from you
   (see [Iterate, Then Delete](/docs/experience-engineering/lesson-17-verification#iterate-then-delete))
2. Fill in with your domain specifics — skip sections that don't apply
3. Use browser automation to verify implementation matches spec
4. Delete after implementation — code + mock contracts + accessibility tree are the source of truth
   ([Lesson 12](/docs/practical-techniques/lesson-12-spec-driven-development))

### Related

- [Experience Engineering](/docs/experience-engineering/lesson-14-design-tokens) — teaches the thinking behind UI spec-driven development with AI agents (Lessons 14–17)
- [Lesson 13: Thinking in Systems](/docs/practical-techniques/lesson-13-systems-thinking-specs) — the system spec counterpart
- [System Spec Template](/prompts/specifications/spec-template) — for backend/system specifications
