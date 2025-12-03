// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer').themes.github;
const darkCodeTheme = require('prism-react-renderer').themes.vsDark;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Irtebat's Second Brain",
  tagline: 'A digital garden of mental models, playbooks, and deep dives',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://irtebat.github.io', 
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'irtebat', 
  projectName: 'Irtebat.github.io',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        language: ["en"],
        indexBlog: false,
        indexPages: false,
        docsRouteBasePath: '/',
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "",
        hideOnScroll: false,
        items: [
          {
            to: '/',
            position: 'left',
            label: 'Home',
          },
          {
            type: 'docSidebar',
            sidebarId: 'concepts',
            position: 'left',
            label: 'Concepts',
          },
          {
            type: 'docSidebar',
            sidebarId: 'playbooks',
            position: 'left',
            label: 'Playbooks',
          },
          {
            type: 'docSidebar',
            sidebarId: 'systemDesign',
            position: 'left',
            label: 'System Design',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} Irtebat's Brain Comics • Printed in the Cloud.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['bash', 'yaml', 'json', 'python', 'java', 'javascript', 'typescript'],
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
    }),
};

module.exports = config;
