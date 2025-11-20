import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * Sidebar configuration for the Prompts Library
 *
 * This sidebar organizes reusable prompt templates by SDLC category.
 * Prompts are stored in website/shared-prompts/ as MDX partials (prefixed with _)
 * and imported by both lesson files and individual prompt collection pages.
 */
const sidebars: SidebarsConfig = {
  promptsSidebar: [
    {
      type: 'doc',
      id: 'index',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'Testing',
      items: ['testing/test-failure-diagnosis', 'testing/edge-case-discovery'],
    },
    {
      type: 'category',
      label: 'Code Review',
      items: ['code-review/comprehensive-review'],
    },
    {
      type: 'category',
      label: 'Pull Requests',
      items: [
        'pull-requests/dual-optimized-pr',
        'pull-requests/ai-assisted-review',
      ],
    },
    {
      type: 'category',
      label: 'Debugging',
      items: ['debugging/evidence-based-debug'],
    },
    {
      type: 'category',
      label: 'Onboarding',
      items: ['onboarding/generate-agents-md'],
    },
  ],
};

export default sidebars;
