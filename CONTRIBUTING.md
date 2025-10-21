# Contributing to AI Coding Course

Thank you for your interest in contributing! This document provides guidelines for contributing to the AI Coding Course.

## Code of Conduct

Be respectful, inclusive, and professional. We're building a learning resource for the community.

## How to Contribute

### Content Contributions

The most valuable contributions are:

1. **New Lessons** - Add lessons to existing modules
2. **Case Studies** - Real-world examples and blog posts
3. **Code Examples** - Interactive examples and exercises
4. **Improvements** - Fix errors, improve clarity, update outdated content

### Types of Contributions

#### 1. Bug Fixes

Found a typo, broken link, or error?

1. Open an issue describing the problem
2. Submit a PR with the fix
3. Reference the issue in your PR

#### 2. New Lessons

Adding a new lesson:

1. Choose the appropriate module (or propose a new one)
2. Follow the lesson template (see below)
3. Include code examples and exercises
4. Submit a PR with a clear description

#### 3. Blog Posts

Share case studies or insights:

1. Create a new file in `website/blog/`
2. Follow the blog post format (see examples)
3. Include practical examples and takeaways
4. Submit a PR

#### 4. Code Examples

Improve interactive examples:

1. Use the live code block feature when appropriate
2. Include comments explaining key concepts
3. Ensure code is production-quality
4. Test thoroughly before submitting

## Content Guidelines

### Writing Style

- **Audience:** Experienced developers (not beginners)
- **Tone:** Professional but approachable
- **Format:** Clear, concise, actionable
- **Examples:** Real-world, production-ready code

### Lesson Template

```markdown
---
sidebar_position: X
sidebar_label: 'Lesson Title'
---

# Lesson Title

Brief introduction (1-2 paragraphs)

## What You'll Learn

- Bullet point 1
- Bullet point 2
- Bullet point 3

## Section 1: Main Content

Content with examples...

\`\`\`javascript
// Code example
\`\`\`

## Section 2: Practical Application

Hands-on example or exercise...

## Exercise

Practice exercise with clear instructions...

## Summary

Key takeaways (3-5 bullet points)

---

**Next:** [Link to next lesson](#)
```

### Code Standards

- **Quality:** Production-ready, not tutorial-quality
- **Comments:** Explain why, not what
- **Style:** Follow common conventions for the language
- **Safety:** No security vulnerabilities or bad practices
- **Testing:** Include tests where appropriate

### Interactive Examples

Use live code blocks for JavaScript/React examples:

````markdown
```javascript live
function example() {
  return "This code runs in the browser!";
}
```
````

## Submission Process

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/AI-Coding-Course.git
cd AI-Coding-Course
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:
- `feature/add-testing-lesson`
- `fix/broken-link-fundamentals`
- `docs/improve-prompting-guide`

### 3. Make Changes

```bash
cd website
npm install
npm start
```

Edit files in `website/docs/` or `website/blog/`

### 4. Test Locally

```bash
npm run build
npm run serve
```

Verify:
- Content renders correctly
- Links work
- Code examples run
- Search indexes properly

### 5. Commit

```bash
git add .
git commit -m "feat: add lesson on test generation with AI"
```

Use conventional commit messages:
- `feat:` new features or lessons
- `fix:` bug fixes
- `docs:` documentation improvements
- `style:` formatting changes
- `refactor:` code restructuring

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a pull request on GitHub with:
- Clear title
- Description of changes
- Screenshots (if applicable)
- Testing done

## PR Review Process

1. Automated checks must pass
2. Content review by maintainers
3. Feedback and iteration
4. Approval and merge

## Project Structure

```
AI-Coding-Course/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment
├── website/
│   ├── docs/                   # Course content
│   │   ├── intro.md
│   │   ├── fundamentals/
│   │   ├── prompting-techniques/
│   │   ├── tools-and-workflows/
│   │   ├── architecture-design/
│   │   └── advanced-topics/
│   ├── blog/                   # Blog posts
│   ├── src/
│   │   ├── components/         # Custom React components
│   │   ├── css/               # Custom styles
│   │   └── pages/             # Custom pages
│   ├── static/                # Static assets
│   ├── docusaurus.config.ts   # Main configuration
│   ├── sidebars.ts            # Sidebar structure
│   └── package.json
├── README.md
└── CONTRIBUTING.md
```

## Development Tips

### Adding a New Module

1. Create directory in `website/docs/`
2. Add `index.md` with module overview
3. Create lesson files
4. Sidebar updates automatically

### Creating Interactive Examples

Use the live code block feature:

````markdown
```jsx live
function Button() {
  const [count, setCount] = React.useState(0);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```
````

### Versioning Content

When making breaking changes:

```bash
cd website
npm run docusaurus docs:version 2.0
```

### Local Search

Search indexes rebuild automatically during development. Test search thoroughly before submitting.

## Getting Help

- **Questions:** Open a [GitHub Discussion](https://github.com/ofriw/AI-Coding-Course/discussions)
- **Bugs:** Open a [GitHub Issue](https://github.com/ofriw/AI-Coding-Course/issues)
- **Ideas:** Start a discussion or open an issue

## Recognition

Contributors are recognized in:
- Git commit history
- Blog post author attribution (for blog contributions)
- Community acknowledgments

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for helping make AI coding education better for everyone!
