# Course Content - Writing Standards

## Target Audience

**Senior Software Engineers** with significant professional experience:

- 3+ years in production environments
- Solid understanding of data structures, algorithms, design patterns
- Experience with system design and architectural decisions
- Familiar with CI/CD, testing, deployment workflows

**NOT beginners** - Avoid basic programming tutorials and introductory concepts.

## Writing Style & Tone

### Voice

**Coworker-level communication** - Talk to peers, not students

- Direct and concise
- Professional but conversational
- Assume competence and intelligence
- Skip obvious explanations

### Avoid

- Marketing language and hype ("revolutionary", "game-changing")
- Excessive hand-holding or patronizing tone
- Basic programming tutorials (unless specifically comparing AI-assisted vs traditional)
- Filler content or unnecessary preambles
- Over-explaining fundamental concepts

### Embrace

- Production-focused examples
- Real-world scenarios and trade-offs
- Architectural considerations
- Security, performance, and scalability implications
- Practical, actionable insights

## Content Structure

### Module Organization

Each module follows this pattern:

```
module-name/
├── index.md                 # Module overview and objectives
└── lesson-X-topic.md        # Individual lessons
```

### Lesson Format (MDX)

Every lesson must include:

```mdx
---
title: 'Lesson Title'
sidebar_position: X
---

## Content

[Main lesson content with examples]

## Key Takeaways

- Summary point 1
- Summary point 2
- Summary point 3
```

## Code Examples

### Use Live Code Blocks

Leverage `@docusaurus/theme-live-codeblock` for interactive examples:

```jsx live
function Example() {
  return <div>Interactive component</div>;
}
```

### Code Quality Standards

- **All code must compile/run** - Test before including
- Use **TypeScript** where applicable for type safety
- Include **realistic examples** - No foo/bar unless demonstrating concepts
- Show **production patterns** - Error handling, validation, edge cases
- **Comment judiciously** - Only when intent isn't obvious

### Example Characteristics

- **Relevant** - Directly supports the learning objective
- **Minimal** - Just enough code to demonstrate the point
- **Practical** - Based on real-world scenarios
- **Complete** - Include necessary imports and context

## MDX & Markdown Guidelines

### Frontmatter (Required)

```yaml
---
title: 'Clear, Descriptive Title'
sidebar_position: N
---
```

### Headings Hierarchy

- `#` - Page title (auto-generated from frontmatter)
- `##` - Major sections
- `###` - Subsections
- `####` - Avoid deeper nesting

### Admonitions for Important Points

```markdown
:::tip Production Tip
Use this pattern for better performance in production
:::

:::warning Security Consideration
Never expose API keys in client-side code
:::

:::info Context
This approach is preferred in TypeScript projects
:::
```

## Content Dependencies

### Prerequisites

Each lesson should reference prerequisites when needed:

```markdown
**Prerequisites:**

- Completed [Fundamentals](../fundamentals/lesson-1-how-llms-work.md) (all lessons)
- Understanding of REST API design
```

### Progressive Disclosure

- Build on previous concepts
- Reference earlier examples when relevant
- Link to related lessons: `[See Lesson 2: Agents Demystified](../fundamentals/lesson-2-how-agents-work.md)`
