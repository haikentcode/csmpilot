export interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string; // Path to logo image
  category: string;
  status: "connected" | "available" | "coming_soon";
  badge?: string;
}

export interface IntegrationCategory {
  id: string;
  name: string;
  integrations: Integration[];
}

export const INTEGRATIONS: Integration[] = [
  // CRM & Sales
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Sync customer data and insights with Salesforce CRM.",
    logo: "/integration-logos/salesforce.svg",
    category: "CRM & Sales",
    status: "connected",
  },
  {
    id: "gainsight",
    name: "Gainsight",
    description: "Connect customer success data with Gainsight for better insights.",
    logo: "/integration-logos/gainsight.svg",
    category: "Customer Success",
    status: "connected",
  },

  // Communication
  {
    id: "slack",
    name: "Slack",
    description: "Get real-time customer alerts and insights directly in your Slack channels.",
    logo: "/integration-logos/slack.svg",
    category: "Communication",
    status: "connected",
  },

  // Conversation Intelligence
  {
    id: "gong",
    name: "Gong",
    description: "Analyze customer conversations and sync insights with DataPiper.",
    logo: "/integration-logos/gong.svg",
    category: "Conversation Intelligence",
    status: "connected",
  },
];

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  {
    id: "crm-sales",
    name: "CRM & Sales",
    integrations: INTEGRATIONS.filter((i) => i.category === "CRM & Sales"),
  },
  {
    id: "customer-success",
    name: "Customer Success",
    integrations: INTEGRATIONS.filter((i) => i.category === "Customer Success"),
  },
  {
    id: "communication",
    name: "Communication",
    integrations: INTEGRATIONS.filter((i) => i.category === "Communication"),
  },
  {
    id: "conversation-intelligence",
    name: "Conversation Intelligence",
    integrations: INTEGRATIONS.filter((i) => i.category === "Conversation Intelligence"),
  },
];

