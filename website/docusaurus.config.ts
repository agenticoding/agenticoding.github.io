import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { lightTheme, darkTheme } from './src/prism-theme';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const isTauri = process.env.TAURI_BUILD === '1';
const editUrl = isTauri ? undefined :
  'https://github.com/agenticoding/agenticoding.github.io/tree/main/website/';

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

  // Analytics (stripped in Tauri builds — no network assumption)
  scripts: isTauri ? [] : [
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

  onBrokenLinks: 'throw',

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
          routeBasePath: '/',
          exclude: [
            '**/_*.{js,jsx,ts,tsx,md,mdx}',
            '**/_*/**',
            '**/*.test.{js,jsx,ts,tsx}',
            '**/__tests__/**',
            '**/CLAUDE.md', // Exclude AI agent instructions from build
          ],
          editUrl,
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
        id: 'developer-tools',
        path: 'developer-tools',
        routeBasePath: 'developer-tools',
        sidebarPath: './sidebarsDeveloperTools.ts',
        editUrl,
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
        docsRouteBasePath: '/',
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        createRedirects(existingPath) {
          const redirects = [`/AI-Coding-Course${existingPath}`];
          // Redirect old /docs/* URLs to new /* URLs after routeBasePath change
          if (!existingPath.startsWith('/docs')) {
            redirects.push(`/docs${existingPath}`);
          }
          return redirects;
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
      items: [], // All navigation moved to sidebar
    },
    prism: {
      theme: lightTheme,
      darkTheme: darkTheme,
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
