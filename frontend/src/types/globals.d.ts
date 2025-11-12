// Global type declarations for CSS imports
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.sass' {
  const content: { [className: string]: string };
  export default content;
}

// Customer interface matching backend API with derived properties
interface Customer {
  id: number;
  name: string;
  industry: string;
  arr: number;
  health_score: string;
  renewal_date: string;
  last_updated: string;
  created_at?: string;
  sentiment: 'up' | 'down' | 'neutral';
  
  // Derived properties computed by frontend
  segment: string;
  tier: string;
  churned: boolean;
  arr_band: string;
  signup_date: string;
}

// Feedback interface
interface Feedback {
  id: number;
  customer: number;
  title: string;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Meeting interface  
interface Meeting {
  id: number;
  customer: number;
  title: string;
  meeting_type: string;
  date: string;
  notes: string;
  created_at: string;
}