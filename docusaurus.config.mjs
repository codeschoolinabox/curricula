// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Spir@learn',
  tagline: 'What if best practice was common practice?',
  favicon: 'img/favicon.ico',

  url: 'https://codeschoolinabox.github.io',
  baseUrl: '/curricula/',

  organizationName: 'codeschoolinabox',
  projectName: 'curricula',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  onBrokenAnchors: 'warn',

  markdown: {
    format: 'detect', // .md → standard markdown, .mdx → MDX
    hooks: {
      onBrokenMarkdownImages: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    // --- Welcome to Programming curriculum ---
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'welcome-to-programming',
        path: 'curricula/welcome-to-programming',
        routeBasePath: 'welcome-to-programming',
        sidebarPath: './sidebars/welcome-to-programming.mjs',
        exclude: ['**/to-use/**'],
      },
    ],
    // --- Welcome to Algorithms curriculum ---
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'welcome-to-algorithms',
        path: 'curricula/welcome-to-algorithms',
        routeBasePath: 'welcome-to-algorithms',
        sidebarPath: './sidebars/welcome-to-algorithms.mjs',
        exclude: ['**/to-use/**'],
      },
    ],
    // --- Add future curricula here ---
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: false, // disable default docs instance — we use multi-instance plugins
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Spir@learn',
        items: [
          {
            to: '/welcome-to-programming/',
            label: 'Welcome to Programming',
            position: 'left',
          },
          {
            to: '/welcome-to-algorithms/',
            label: 'Welcome to Algorithms',
            position: 'left',
          },
          {
            href: 'https://github.com/codeschoolinabox/curricula',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Curricula',
            items: [
              {
                label: 'Welcome to Programming',
                to: '/welcome-to-programming/',
              },
              {
                label: 'Welcome to Algorithms',
                to: '/welcome-to-algorithms/',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/codeschoolinabox',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} codeschoolinabox. Built with Docusaurus.`,
      },
    }),
};

export default config;
