export interface FeatureCard {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  icon: string; // Icon name from lucide-react
}

export interface SimpleFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const HOME_CONSTANTS = {
  hero: {
    tag: "AI-Powered Customer Intelligence",
    title: "Your Customer Intelligence",
    titleHighlight: "Copilot.",
    subheading: "Turn every customer interaction into actionable insights. Prepare for meetings in seconds, not hours.",
    ctaPrimary: "Get Started",
    ctaSecondary: "Get Demo",
  },
  navigation: {
    brandName: "DataPiper",
    loginText: "Log In",
  },
  simpleFeatures: [
    {
      id: "save-hours",
      title: "Save Hours Weekly",
      description: "Automate context gathering and prep work",
      icon: "Zap",
    },
    {
      id: "better-outcomes",
      title: "Better Outcomes",
      description: "Data-driven insights for every interaction",
      icon: "Target",
    },
    {
      id: "ai-powered",
      title: "AI-Powered",
      description: "Advanced intelligence at your fingertips",
      icon: "Sparkles",
    },
  ] as SimpleFeature[],
  midSection: {
    headline: "Everything you need to excel as a CSM",
    subheadline: "Powerful AI features that transform how you manage customer relationships",
  },
  features: [
    {
      id: "customer-stories",
      title: "AI-Generated Customer Stories",
      subtitle: "Automatically generate comprehensive customer narratives from interaction history, surveys, and support tickets. Get the full picture instantly.",
      body: "Automatically generate comprehensive customer narratives from interaction history, surveys, and support tickets. Get the full picture instantly.",
      icon: "FileText",
    },
    {
      id: "meeting-prep",
      title: "Smart Meeting Preparation",
      subtitle: "Walk into every customer meeting prepared with AI-powered briefs, talk tracks, and personalized recommendations tailored to each account.",
      body: "Walk into every customer meeting prepared with AI-powered briefs, talk tracks, and personalized recommendations tailored to each account.",
      icon: "Calendar",
    },
    {
      id: "similar-customers",
      title: "Similar Customer Insights",
      subtitle: "Discover patterns across your customer base. Learn from successful accounts and apply proven strategies to similar customers.",
      body: "Discover patterns across your customer base. Learn from successful accounts and apply proven strategies to similar customers.",
      icon: "Users",
    },
  ] as FeatureCard[],
  bottomCta: {
    headline: "Ready to transform your CS workflow?",
    subheadline: "Join hundreds of CSMs who save hours every week with AI-powered insights",
    buttonText: "Get Started For Free",
  },
  footer: {
    copyright: "© 2025 DataPiper. Built for Customer Success teams.",
  },
};
