import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Fundamentals',
      collapsed: false,
      items: [
        'fundamentals/lesson-1-how-llms-work',
        'fundamentals/lesson-2-how-agents-work',
      ],
    },
    {
      type: 'category',
      label: 'Methodology',
      collapsed: false,
      items: [
        'methodology/lesson-3-high-level-methodology',
        'methodology/lesson-4-prompting-101',
        'methodology/lesson-5-grounding',
      ],
    },
    {
      type: 'category',
      label: 'Practical Techniques',
      collapsed: false,
      items: [
        'practical-techniques/lesson-6-project-onboarding',
        'practical-techniques/lesson-7-planning-execution',
        'practical-techniques/lesson-8-tests-as-guardrails',
        'practical-techniques/lesson-9-reviewing-code',
        'practical-techniques/lesson-10-debugging',
        'practical-techniques/lesson-11-agent-friendly-code',
        'practical-techniques/lesson-12-spec-driven-development',
      ],
    },
  ],
};

export default sidebars;
