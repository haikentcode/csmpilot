// Backend types
export interface BackendCustomer {
  id: number;
  name: string;
  industry: string;
  arr: string;
  health_score: "healthy" | "at_risk" | "critical";
  renewal_date: string;
  last_updated: string;
  created_at?: string;
}

export interface BackendFeedback {
  id: number;
  title: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  description: string;
  created_at: string;
  updated_at: string;
}

export interface BackendMeeting {
  id: number;
  date: string;
  summary: string;
  participants: string;
  sentiment: string;
  created_at: string;
}

export interface BackendCustomerMetrics {
  nps: number;
  usage_trend: "up" | "down" | "stable";
  active_users: number;
  renewal_rate: string;
  seat_utilization: string;
  response_limit: number;
  response_used: number;
  response_usage_percentage: number;
  updated_at: string;
}

export interface BackendCustomerDetail extends BackendCustomer {
  feedback: BackendFeedback[];
  meetings: BackendMeeting[];
  metrics: BackendCustomerMetrics | null;
}

// Frontend types
export interface CustomerDetail extends Customer {
  feedback: Array<{
    id: number;
    title: string;
    status: string;
    description?: string;
    created_at?: string;
  }>;
  meetings: Array<{
    id: number;
    date: string;
    summary: string;
    participants?: string;
    sentiment?: string;
  }>;
  metrics: {
    nps: number;
    usage_trend: "up" | "down" | "stable";
    active_users: number;
    renewal_rate: number;
    seat_utilization?: number;
    response_limit?: number;
    response_used?: number;
  } | null;
}

export interface SimilarCustomer {
  customer_id: number;
  name: string;
  industry: string;
  arr: number;
  health_score?: string;
  similarity_score: number;
  shared_traits?: string[];
  metadata?: {
    nps?: number;
    usage_trend?: string;
    renewal_rate?: number;
    arr?: number;
    customer_id?: number;
    health_score?: string;
    industry?: string;
    name?: string;
    text?: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  customer_id?: number;
  conversation_history?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  timestamp: string;
  model?: string;
  tokens_used?: number;
  error?: string;
}

export interface ProfileSummary {
  customer: string;
  summary: string;
  risks: string[];
  opportunities: string[];
  talk_tracks: string[];
}

export interface GongMeeting {
  id: number;
  company: number;
  company_name?: string;
  company_id?: number;
  gong_meeting_id: string;
  gong_call_id?: string;
  meeting_title: string;
  meeting_date: string;
  duration_seconds: number;
  duration_minutes: number;
  direction: 'inbound' | 'outbound' | 'internal' | 'other';
  participants: Array<{
    name?: string;
    email?: string;
    role?: string;
    title?: string;
  }>;
  participant_count: number;
  meeting_summary?: string;
  meeting_transcript?: string;
  deal_name?: string;
  deal_value?: string;
  deal_stage?: string;
  ai_processed: boolean;
  ai_processed_at?: string;
  overall_sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' | 'n/a';
  key_topics: string[];
  ai_insights: {
    insights?: Array<{
      category: string;
      sentences: string[];
      confidence: number;
    }>;
    overall_sentiment?: string;
    key_topics?: string[];
  };
  raw_meeting_data?: Record<string, unknown>;
  insights_categories?: string[];
  has_insights?: boolean;
  insights_count?: number;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Fallback data
const FALLBACK_DATA = {
  similarCustomers: [
    {
      customer_id: 3,
      name: "HealthPlus Medical",
      industry: "healthcare",
      arr: 180000.0,
      health_score: "healthy",
      similarity_score: 0.407979846,
      metadata: {
        arr: 180000.0,
        customer_id: 3.0,
        health_score: "healthy",
        industry: "healthcare",
        name: "HealthPlus Medical",
        text: "Company: HealthPlus Medical, Industry: healthcare, ARR: 180000.00, Health: healthy",
      },
    },
    {
      customer_id: 2,
      name: "TechCorp Solutions",
      industry: "technology",
      arr: 250000.0,
      health_score: "at_risk",
      similarity_score: 0.137716159,
      metadata: {
        arr: 250000.0,
        customer_id: 2.0,
        health_score: "at_risk",
        industry: "technology",
        name: "TechCorp Solutions",
        text: "Company: TechCorp Solutions, Industry: technology, ARR: 250000.00, Health: at_risk",
      },
    },
    {
      customer_id: 4,
      name: "RetailMax Inc",
      industry: "retail",
      arr: 120000.0,
      health_score: "critical",
      similarity_score: 0.471204489,
      metadata: {
        arr: 120000.0,
        customer_id: 4.0,
        health_score: "critical",
        industry: "retail",
        name: "RetailMax Inc",
        text: "Company: RetailMax Inc, Industry: retail, ARR: 120000.00, Health: critical",
      },
    },
  ] as SimilarCustomer[],
};

// Transform functions
function transformCustomer(backend: BackendCustomer): Customer {
  const arr = parseFloat(backend.arr);
  
  return {
    id: backend.id,
    name: backend.name,
    industry: backend.industry,
    arr: arr,
    health_score: backend.health_score,
    renewal_date: backend.renewal_date,
    last_updated: backend.last_updated,
    created_at: backend.created_at,
    // Derived properties
    sentiment: backend.health_score === "healthy" ? "up" : backend.health_score === "at_risk" ? "neutral" : "down",
    segment: backend.industry,
    tier: arr >= 200000 ? "Enterprise" : arr >= 100000 ? "Mid-Market" : "SMB",
    churned: false,
    arr_band: arr >= 200000 ? "$200K+" : arr >= 100000 ? "$100K-$200K" : "< $100K",
    signup_date: backend.created_at || backend.last_updated,
  };
}

function transformCustomerDetail(backend: BackendCustomerDetail): CustomerDetail {
  return {
    ...transformCustomer(backend),
    feedback: backend.feedback.map((f) => ({
      id: f.id,
      title: f.title,
      status: f.status,
      description: f.description,
      created_at: f.created_at,
    })),
    meetings: backend.meetings.map((m) => ({
      id: m.id,
      date: m.date,
      summary: m.summary,
      participants: m.participants,
      sentiment: m.sentiment,
    })),
    metrics: backend.metrics
      ? {
          nps: backend.metrics.nps,
          usage_trend: backend.metrics.usage_trend,
          active_users: backend.metrics.active_users,
          renewal_rate: parseFloat(backend.metrics.renewal_rate),
          seat_utilization: parseFloat(backend.metrics.seat_utilization),
          response_limit: backend.metrics.response_limit,
          response_used: backend.metrics.response_used,
        }
      : null,
  };
}

// Simple API Service
class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getCustomers(page = 1): Promise<PaginatedResponse<Customer>> {
    const data = await this.request<PaginatedResponse<BackendCustomer>>(
      `/api/customers/?page=${page}`
    );
    
    return {
      ...data,
      results: data.results.map(transformCustomer),
    };
  }

  async getCustomerDetail(customerId: number): Promise<CustomerDetail> {
    const data = await this.request<BackendCustomerDetail>(
      `/api/customers/${customerId}/`
    );
    return transformCustomerDetail(data);
  }

  async getSimilarCustomers(customerId: number): Promise<{
    customer_id: number;
    customer_name: string;
    similar_customers: SimilarCustomer[];
    total_found: number;
  }> {
    try {
      const result = await this.request<{
        customer_id: number;
        customer_name: string;
        similar_customers: SimilarCustomer[];
        total_found: number;
      }>(`/api/customers/${customerId}/similar/`);

      // If API returns empty results, use fallback data
      if (!result.similar_customers || result.similar_customers.length === 0) {
        return {
          customer_id: customerId,
          customer_name: result.customer_name || "Emeritus Institute of Management",
          similar_customers: FALLBACK_DATA.similarCustomers,
          total_found: FALLBACK_DATA.similarCustomers.length,
        };
      }

      return result;
    } catch (error) {
      console.warn(`Failed to fetch similar customers:`, error);
      return {
        customer_id: customerId,
        customer_name: "Emeritus Institute of Management",
        similar_customers: FALLBACK_DATA.similarCustomers,
        total_found: FALLBACK_DATA.similarCustomers.length,
      };
    }
  }

  async getProfileSummary(customerId: number): Promise<ProfileSummary> {
    return this.request<ProfileSummary>(`/api/customers/${customerId}/summary/`);
  }

  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      return await this.request<ChatResponse>("/api/customers/chat/", {
        method: "POST",
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error("Failed to send chat message:", error);
      return {
        response: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getGongMeetings(customerId: number): Promise<GongMeeting[]> {
    try {
      const result = await this.request<{
        count: number;
        next: string | null;
        previous: string | null;
        results: GongMeeting[];
      }>(`/api/gong/meetings/?customer=${customerId}`);
      
      // Handle paginated response (DRF format)
      if (result && typeof result === 'object' && 'results' in result) {
        return result.results;
      }
      // Fallback: if it's already an array, return it
      if (Array.isArray(result)) {
        return result;
      }
      return [];
    } catch (error) {
      console.warn(`Failed to fetch Gong meetings for customer ${customerId}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Error handling utilities
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("503") ||
      message.includes("502")
    );
  }
  return false;
}
