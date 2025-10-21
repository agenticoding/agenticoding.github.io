# AI Coding Course

A comprehensive online course for experienced software engineers to master AI-assisted development.

## Overview

This course teaches systematic approaches to using AI coding assistants effectively in professional software development. Built with [Docusaurus](https://docusaurus.io/), it includes interactive code examples, hands-on exercises, and production-ready patterns.

**Live Course:** [https://ofriw.github.io/AI-Coding-Course/](https://ofriw.github.io/AI-Coding-Course/)

## Course Structure

The course is organized into five modules:

1. **[Fundamentals](website/docs/fundamentals)** - Understanding AI coding assistants, capabilities, and limitations
2. **[Prompting Techniques](website/docs/prompting-techniques)** - Mastering effective communication with AI
3. **[Tools & Workflows](website/docs/tools-and-workflows)** - Integrating AI into development workflows
4. **[Architecture & Design](website/docs/architecture-design)** - AI-assisted system design
5. **[Advanced Topics](website/docs/advanced-topics)** - Security, performance, and specialized use cases

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

- **Interactive Code Examples** - Live code editing with `@docusaurus/theme-live-codeblock`
- **Full-Text Search** - Local search powered by `@easyops-cn/docusaurus-search-local`
- **Versioning** - Course content is versioned for historical reference
- **Blog** - Case studies, industry trends, and best practices
- **GitHub Pages Deployment** - Automated deployment via GitHub Actions

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-lesson`
3. Make your changes in the `website/docs` directory
4. Test locally: `cd website && npm start`
5. Submit a pull request

## Content Structure

```
website/
├── docs/                    # Course modules and lessons
│   ├── intro.md            # Course introduction
│   ├── fundamentals/       # Module 1
│   ├── prompting-techniques/
│   ├── tools-and-workflows/
│   ├── architecture-design/
│   └── advanced-topics/
├── blog/                    # Blog posts
├── src/                     # Custom React components
└── static/                  # Static assets
```

## Technology Stack

- **[Docusaurus 3](https://docusaurus.io/)** - Static site generator
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe configuration
- **[MDX](https://mdxjs.com/)** - Markdown with React components
- **[Prism](https://prismjs.com/)** - Syntax highlighting
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

**Manual Deployment:**
```bash
cd website
GIT_USER=ofriw npm run deploy
```

## Versioning

Course content is versioned to maintain historical reference while adding new material:

```bash
cd website
npm run docusaurus docs:version X.Y
```

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

- **Issues:** [GitHub Issues](https://github.com/ofriw/AI-Coding-Course/issues)
- **Discussions:** [GitHub Discussions](https://github.com/ofriw/AI-Coding-Course/discussions)

## Roadmap

- [ ] Complete all 5 core modules
- [ ] Add video content integration
- [ ] Create interactive coding challenges
- [ ] Multi-language support
- [ ] Community-contributed case studies

---

Built with by the AI Coding Course team.
