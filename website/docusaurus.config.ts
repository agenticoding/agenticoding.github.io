import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Agentic Coding',
  tagline: 'A structured methodology for agentic development',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://agenticoding.ai',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // Analytics
  scripts: [
    {
      src: 'https://cloud.umami.is/script.js',
      defer: true,
      'data-website-id': 'a4797962-f344-4828-8278-8bf6dff239bb',
    },
  ],

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'agenticoding', // Usually your GitHub org/user name.
  projectName: 'agenticoding.github.io', // Usually your repo name.
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Favicon + theme-color meta tags
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        href: '/img/icon.svg',
        type: 'image/svg+xml',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        href: '/img/apple-touch-icon.png',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'theme-color',
        content: '#ffffff',
        media: '(prefers-color-scheme: light)',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'theme-color',
        content: '#0d1117',
        media: '(prefers-color-scheme: dark)',
      },
    },
  ],

  markdown: {
    mermaid: true,
    preprocessor: ({ fileContent }) => {
      // Strip presentation-only blocks entirely (for presentations, not docs)
      let result = fileContent.replace(
        /<!--\s*presentation-only-start\s*-->[\s\S]*?<!--\s*presentation-only-end\s*-->/g,
        ''
      );
      // Strip doc-only markers (keep content)
      result = result.replace(/<!--\s*doc-only-(start|end)\s*-->\n?/g, '');
      return result;
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          exclude: [
            '**/_*.{js,jsx,ts,tsx,md,mdx}',
            '**/_*/**',
            '**/*.test.{js,jsx,ts,tsx}',
            '**/__tests__/**',
            '**/CLAUDE.md', // Exclude AI agent instructions from build
          ],
          editUrl:
            'https://github.com/agenticoding/agenticoding.github.io/tree/main/website/',
          showLastUpdateTime: false,
          showLastUpdateAuthor: false,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ['@docusaurus/theme-live-codeblock', '@docusaurus/theme-mermaid'],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'prompts',
        path: 'prompts',
        routeBasePath: 'prompts',
        sidebarPath: './sidebarsPrompts.ts',
        editUrl:
          'https://github.com/agenticoding/agenticoding.github.io/tree/main/website/',
        showLastUpdateTime: false,
        showLastUpdateAuthor: false,
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'developer-tools',
        path: 'developer-tools',
        routeBasePath: 'developer-tools',
        sidebarPath: './sidebarsDeveloperTools.ts',
        editUrl:
          'https://github.com/agenticoding/agenticoding.github.io/tree/main/website/',
        showLastUpdateTime: false,
        showLastUpdateAuthor: false,
      },
    ],
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        indexBlog: false,
        indexDocs: true,
        docsRouteBasePath: '/docs',
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        createRedirects(existingPath) {
          // For all paths, create redirect from old /AI-Coding-Course/ prefixed version
          // Example: /docs/intro gets redirect from /AI-Coding-Course/docs/intro
          // For root: / gets redirect from /AI-Coding-Course/
          return `/AI-Coding-Course${existingPath}`;
        },
      },
    ],
  ],

  themeConfig: {
    // Social media preview card (Open Graph, Twitter Card)
    image: 'img/social-card.png',
    // announcementBar: {
    //   id: 'under_construction',
    //   content: '🚧 Course Under Development - Content is still changing',
    //   backgroundColor: 'var(--announcement-bg)',
    //   textColor: 'var(--announcement-text)',
    //   isCloseable: false,
    // },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Agentic Coding',
      logo: {
        alt: 'Agentic Coding Logo',
        src: 'img/logo.svg',
      },
      items: [], // All navigation moved to sidebar
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Reference',
          items: [
            {
              label: 'FAQ',
              to: '/docs/faq',
            },
            {
              label: 'Getting Started',
              to: '/docs',
            },
            {
              label: 'All Chapters',
              to: '/docs/fundamentals/lesson-1-how-llms-work',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Discussions',
              href: 'https://github.com/agenticoding/agenticoding.github.io/discussions',
            },
            {
              label: 'Report Issues',
              href: 'https://github.com/agenticoding/agenticoding.github.io/issues',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/agenticoding/agenticoding.github.io',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Agentic Coding. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: [
        'bash',
        'python',
        'yaml',
        'json',
        'markdown',
        'mermaid',
      ],
    },
    mermaid: {
      theme: { light: 'base', dark: 'dark' },
      options: {
        maxTextSize: 50000,
        fontFamily: "'Monaspace Neon', monospace",
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
