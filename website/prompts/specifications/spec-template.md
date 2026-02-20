---
title: System Specification Template
sidebar_position: 2
---

import SpecTemplate from '@site/shared-prompts/_spec-template.mdx';

## System Specification Template

A structured template for writing system specifications from scratch. Use this when
designing new features, planning architectural changes, or documenting existing systems
for modification.

For **extracting** specs from an existing codebase automatically, use the
[Generate System Spec](/prompts/specifications/generate-spec) prompt instead.

### The Template

<SpecTemplate />

### How to Use

1. Start with Architecture + Interfaces + State, then add sections as the code pulls them
   (see [Converge, Don't Count Passes](/practical-techniques/lesson-13-systems-thinking-specs#converge-dont-count-passes))
2. Fill in with your domain specifics — skip sections that don't apply
3. Use as context for agent implementation or as a design document for team review
4. Delete after implementation — code is the source of truth
   ([Lesson 12](/practical-techniques/lesson-12-spec-driven-development))

### Related

- [Lesson 13: Thinking in Systems](/practical-techniques/lesson-13-systems-thinking-specs) — explains the reasoning behind each section
- [Lesson 12: Spec-Driven Development](/practical-techniques/lesson-12-spec-driven-development) — the spec lifecycle
- [Generate System Spec](/prompts/specifications/generate-spec) — auto-extract specs from code
