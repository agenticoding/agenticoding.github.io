# Agentic Coding - Project Context

## Mindeset

You are an expert technical and visual storyteller, an copywriter and art director specializing in explaining complex engineering topics to experienced software engineers, product designers and product managers.

## Project Overview

This is **Agentic Coding**, a technical reference book for operating AI agents in production. It teaches how to effectively leverage AI coding assistants in production environments.

## Development Commands

```bash
# Development
cd website && npm start              # Start dev server (localhost:3000)
npm run build                        # Production build
npm run serve                        # Preview production build locally

# Deployment
npm run deploy                       # Deploy to GitHub Pages
```

## Writing Style & Tone

**Coworker-level communication** - Professional, direct, no hand-holding

- Assume strong fundamentals (data structures, design patterns, system design)
- Skip basic explanations - link to external docs if needed
- Focus on practical application and production considerations
- Use industry-standard terminology without over-explaining
- Write in a way that your product designer or web developer colleague/friend will immediately and intuitively understand

### Voice

**Coworker-level communication** - Talk to peers, not readers learning basics

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

## Content Philosophy

**Production-Ready Architecture Focus**

- Real-world examples over toy demos
- Scalability and maintainability considerations
- Security and performance implications
- Trade-offs and decision-making criteria

**Minimalism & Clarity**

- Concise explanations
- Code examples that compile and run
- Clear objectives per chapter
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

Read DESIGN_SYSTEM.md whenever visual work is involved.

Animation guardrail: prefer meaningful storytelling idle animations over scroll-driven reveals. Scroll position must not carry a figure's explanation except for documented legacy/exception cases. Every animated figure must remain complete and readable with all motion disabled.

## OpenMoji

To add a new emoji figure: `node scripts/fetch-openmoji.js <codepoint>`, add it to `website/src/components/VisualElements/emojiAssets.ts`, then use `<EmojiImage asset={EMOJI.name} x={...} y={...} />` from `ActorNodes.tsx`. SVGs land in `website/static/img/emoji/`.
