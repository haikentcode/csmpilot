export interface FeatureCard {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  tagline?: string;
  icon: string; // Icon name from lucide-react
}

export const HOME_CONSTANTS = {
  hero: {
    title: "Your Customer Intelligence",
    titleHighlight: "Copilot.",
    subheading:
      "DataPiper connects feedback, CRM, and usage data to help teams understand every customer.",
  },
  navigation: {
    brandName: "DataPiper",
    loginText: "Login",
    getStartedText: "Get Started",
  },
  features: [
    {
      id: "customer-stories",
      title: "Customer Stories, Reimagined",
      subtitle:
        "Turn scattered feedback and notes into clear, meaningful narratives.",
      body: "DataPiper reads survey responses, support tickets, and CSM notes to create a concise story for each account, capturing tone, themes, and engagement trends in one view.",
      tagline: "From scattered data to clear understanding.",
      icon: "FileText",
    },
    {
      id: "context-connections",
      title: "Context That Makes Sense",
      subtitle: "See how sentiment connects to real business outcomes.",
      body: "Bring together feedback, usage metrics, and revenue data to understand why customers behave the way they do, not just what they say. Identify patterns before they become problems.",
      tagline: "Every customer signal, in context.",
      icon: "TrendingUp",
    },
    {
      id: "next-best-actions",
      title: "Know What to Do Next",
      subtitle: "Your intelligent co-pilot for every customer interaction.",
      body: "Before every call or renewal, DataPiper highlights what matters most by comparing similar accounts and surfacing key insights, so your team can act with confidence and stay proactive.",
      tagline: "Don’t just respond — stay one step ahead.",
      icon: "Zap",
    },
  ] as FeatureCard[],
};
