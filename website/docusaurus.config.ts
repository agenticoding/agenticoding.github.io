import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'AI Coding Course',
  tagline: 'Master AI-assisted software engineering for experienced developers',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://ofriw.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/AI-Coding-Course/',

  // Modern favicon setup (SVG + Apple touch icon)
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        href: '/AI-Coding-Course/img/icon.svg',
        type: 'image/svg+xml',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        href: '/AI-Coding-Course/img/apple-touch-icon.png',
      },
    },
  ],

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'ofriw', // Usually your GitHub org/user name.
  projectName: 'AI-Coding-Course', // Usually your repo name.
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

  markdown: {
    mermaid: true,
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
            'https://github.com/ofriw/AI-Coding-Course/tree/main/website/',
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
  ],

  themeConfig: {
    // Social media preview card (Open Graph, Twitter Card)
    image: 'img/social-card.png',
    announcementBar: {
      id: 'under_construction',
      content: '🚧 Course Under Development - Content is still changing',
      backgroundColor: 'var(--announcement-bg)',
      textColor: 'var(--announcement-text)',
      isCloseable: false,
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'AI Coding Course',
      logo: {
        alt: 'AI Coding Course Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Course',
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
        },
        {
          href: 'https://github.com/ofriw/AI-Coding-Course',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Course',
          items: [
            {
              label: 'Getting Started',
              to: '/docs',
            },
            {
              label: 'Course Modules',
              to: '/docs/understanding-the-tools/lesson-1-intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Discussions',
              href: 'https://github.com/ofriw/AI-Coding-Course/discussions',
            },
            {
              label: 'Report Issues',
              href: 'https://github.com/ofriw/AI-Coding-Course/issues',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/ofriw/AI-Coding-Course',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} AI Coding Course. Built with Docusaurus.`,
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
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
