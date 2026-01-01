# Agentic Coding

A comprehensive online course for experienced software engineers to master AI-assisted development.

## Overview

This course teaches systematic approaches to using AI coding assistants effectively in professional software development. Built with [Docusaurus](https://docusaurus.io/), it includes interactive code examples, hands-on exercises, and production-ready patterns.

**Live Course:** [https://agenticoding.ai](https://agenticoding.ai)

## Course Structure

The course is organized into three modules with 10 hands-on lessons:

1. **[Fundamentals](website/docs/fundamentals)** - Mental models and architecture (Lessons 1-2)
2. **[Methodology](website/docs/methodology)** - Prompting, grounding, workflow design (Lessons 3-5)
3. **[Practical Techniques](website/docs/practical-techniques)** - Onboarding, planning, testing, reviewing, debugging (Lessons 6-10)

## Behind the Scenes

**This course practices what it teaches.** The entire curriculum was developed using the AI-assisted workflows and techniques you'll learn in the course itself.

Every module was planned, researched, drafted, and refined through systematic prompting, agentic research, and iterative validation—following the exact methodology outlined in the lessons.

### Multi-Format Content Generation

The course includes three formats for different learning styles, all generated using AI automation:

- **Written Lessons**: Interactive MDX content with live code examples and hands-on exercises
- **Podcast Episodes**: Two-speaker dialogues between Alex (instructor) and Sam (senior engineer), generated using Claude Code CLI (Haiku 4.5) and synthesized with Gemini 2.5 Pro TTS
- **Presentation Slides**: Reveal.js-powered presentations with speaker notes, generated from lesson content for classroom teaching

All AI-generated content includes full transparency—metadata, frontmatter, and generation details are documented.

**Why this matters:** If these techniques can produce production-grade training material on their own application, they're robust enough for your codebase. This isn't marketing—it's validation through real-world application.

## Prerequisites

- Strong programming fundamentals
- Professional development experience
- Understanding of software architecture and design patterns
- Access to AI coding tools (GitHub Copilot, Claude, ChatGPT, or similar)

## Local Development

### Installation

```bash
cd website
npm install
```

### Development Server

```bash
npm start
```

This starts a local development server at `http://localhost:3000/`. Most changes are reflected live without restarting the server.

### Build

```bash
npm run build
```

Generates static content in the `website/build` directory, ready for deployment.

### Test Production Build

```bash
npm run serve
```

Serves the production build locally for testing.

## Features

- **Multi-Format Learning** - Written lessons, podcast episodes, and interactive presentations for different learning styles
- **Interactive Code Examples** - Live code editing with `@docusaurus/theme-live-codeblock`
- **Podcast Episodes** - Two-speaker dialogues (Alex & Sam) optimized for senior engineers, available alongside written content
- **Presentation Mode** - Reveal.js integration with speaker notes; press `P` on any lesson to launch, `S` for speaker notes, `ESC` to exit
- **Full-Text Search** - Local search powered by `@easyops-cn/docusaurus-search-local`
- **Custom Interactive Components** - Visual elements like GroundingComparison for conceptual clarity
- **GitHub Pages Deployment** - Automated deployment via GitHub Actions

## Technology Stack

### Site Infrastructure
- **[Docusaurus 3](https://docusaurus.io/)** - Static site generator
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe configuration
- **[MDX](https://mdxjs.com/)** - Markdown with React components
- **[Prism](https://prismjs.com/)** - Syntax highlighting
- **[Reveal.js](https://revealjs.com/)** - Presentation framework
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD

### Content Generation (AI Pipeline)
- **[Claude Code CLI](https://claude.ai/claude-code)** - Script and presentation generation (Haiku 4.5)
- **[Google Gemini 2.5 Pro](https://ai.google.dev/)** - Text-to-speech synthesis for podcasts
- **Node.js** - Automation scripts for content pipeline

## Content Generation (Advanced)

For contributors interested in generating podcasts or presentations from lesson content:

### Prerequisites
- Node.js 20+
- Claude Code CLI installed and authenticated: `npm install -g @anthropic-ai/claude-code`
- Google Gemini API key for audio synthesis (podcasts only)

### Generating Podcasts

```bash
cd scripts
npm install

# Generate podcast script and audio
npm run generate-podcast

# Or generate scripts only (for manual editing)
npm run generate-podcast-scripts
```

See [scripts/README.md](scripts/README.md) for detailed documentation.

### Generating Presentations

```bash
cd scripts

# Interactive mode - select a lesson
node generate-presentation.js

# Generate for specific file
node generate-presentation.js --file intro.md

# Generate for all lessons
node generate-presentation.js --all
```

See [scripts/PRESENTATION_README.md](scripts/PRESENTATION_README.md) for detailed documentation.

## License

This project is open source and available under the [MIT License](LICENSE).
