import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Opsbot",
  tagline: "DevOps assistant with safety-first design",
  favicon: "img/favicon.ico",

  url: "https://agenticdevops.github.io",
  baseUrl: "/opsbot/",

  organizationName: "agenticdevops",
  projectName: "opsbot",

  onBrokenLinks: "throw",

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/agenticdevops/opsbot/tree/main/docs/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/opsbot-social-card.png",
    navbar: {
      title: "Opsbot",
      logo: {
        alt: "Opsbot Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://github.com/agenticdevops/opsbot",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Getting Started",
              to: "/docs/getting-started/quickstart",
            },
            {
              label: "API Reference",
              to: "/docs/developers/api",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/agenticdevops/opsbot",
            },
            {
              label: "Issues",
              href: "https://github.com/agenticdevops/opsbot/issues",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Opsbot. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "yaml", "json"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
