import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: "category",
      label: "Getting Started",
      items: [
        "getting-started/5-minute-telegram-setup",
        "getting-started/quickstart",
        "getting-started/installation",
        "getting-started/configuration",
      ],
    },
    {
      type: "category",
      label: "User Guide",
      items: [
        "users/commands",
        "users/safety-modes",
        "users/approval-workflow",
        "users/telegram-bot",
      ],
    },
    {
      type: "category",
      label: "Deployment",
      items: [
        "deployment/docker",
        "deployment/kubernetes",
        "deployment/environment-variables",
      ],
    },
    {
      type: "category",
      label: "Developers",
      items: [
        "developers/architecture",
        "developers/api",
        "developers/skills",
        "developers/contributing",
      ],
    },
  ],
};

export default sidebars;
