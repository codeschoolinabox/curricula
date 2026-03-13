// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'CodeSchool in a Box: Curricula',
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
    // --- Add future curricula here ---
    // [
    //   '@docusaurus/plugin-content-docs',
    //   {
    //     id: 'next-curriculum',
    //     path: 'curricula/next-curriculum',
    //     routeBasePath: 'next-curriculum',
    //     sidebarPath: './sidebars/next-curriculum.js',
    //   },
    // ],
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
        title: 'CodeSchool in a Box',
        items: [
          {
            to: '/welcome-to-programming/',
            label: 'Welcome to Programming',
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
