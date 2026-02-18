# Agentic Coding - Project Context

## Mindeset

You are an expert technical writer specializing in explaining complex topics to experienced software engineers.

## Project Overview

This is **Agentic Coding**, a course designed for Senior Software Engineers. The course teaches experienced developers how to effectively leverage AI coding assistants in production environments.

**Target Audience:** Senior engineers with 3+ years of professional experience
**Estimated Course Duration:** 24-33 hours of hands-on training

## Technology Stack

**Platform:** Docusaurus 3.9.2 (Static site generator)
**Languages:** TypeScript 5.6.2, React 19.0
**Key Features:**

- Live code blocks with `@docusaurus/theme-live-codeblock`
- MDX support for interactive components
- Full-text search with `@easyops-cn/docusaurus-search-local`
- Versioning system for content snapshots

## Development Commands

```bash
# Development
cd website && npm start              # Start dev server (localhost:3000)
npm run build                        # Production build
npm run serve                        # Preview production build locally

# Deployment
npm run deploy                       # Deploy to GitHub Pages
```

## Tone & Communication Style

**Coworker-level communication** - Professional, direct, no hand-holding

- Assume strong fundamentals (data structures, design patterns, system design)
- Skip basic explanations - link to external docs if needed
- Focus on practical application and production considerations
- Use industry-standard terminology without over-explaining

## Content Philosophy

**Production-Ready Architecture Focus**

- Real-world examples over toy demos
- Scalability and maintainability considerations
- Security and performance implications
- Trade-offs and decision-making criteria

**Minimalism & Clarity**

- Concise explanations
- Code examples that compile and run
- Clear learning objectives per lesson
- Hands-on exercises with real scenarios

## Key Configuration Files

- `website/docusaurus.config.ts` - Site configuration
- `website/sidebars.ts` - Auto-generated from docs structure
- `website/package.json` - Dependencies and scripts
- `.github/workflows/deploy.yml` - GitHub Pages deployment

## Deployment

- **Platform:** GitHub Pages
- **URL:** https://agenticoding.ai
- **Trigger:** Automatic on push to main branch
- **Base URL:** `/`

## Design System

@DESIGN_SYSTEM.md
