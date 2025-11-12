/**
 * Enhanced API Service with Performance Optimization and Error Handling
 * Features: Caching, Retry Logic, Fallback Content, Rate Limiting, Error Recovery
 */

// Types matching backend structure
export interface BackendCustomer {
  id: number;
  name: string;
  industry: string;
  arr: string; // DecimalField returns as string
  health_score: 'healthy' | 'at_risk' | 'critical';
  renewal_date: string;
  last_updated: string;
  created_at?: string;
}

export interface BackendFeedback {
  id: number;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
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
  usage_trend: 'up' | 'down' | 'stable';
  active_users: number;
  renewal_rate: string; // DecimalField returns as string
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

// Frontend types (transformed) - using global Customer interface
// Customer interface is now defined in globals.d.ts

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
  id: number;
  name: string;
  score: number;
  segment: string;
  tier: string;
}

export interface ProfileSummary {
  customer: string;
  summary: string;
  risks: string[];
  opportunities: string[];
  talk_tracks: string[];
}

export interface PaginatedResponse<T> {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
  // Legacy format support
  customers?: T[];
  total?: number;
  page?: number;
  per_page?: number;
  total_pages?: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  retryable: boolean;
}

// Configuration
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  timeout: 30000, // 30 seconds
  retryAttempts: 5,
  retryDelay: 5000, // 5 seconds
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  rateLimitDelay: 2000, // 2 seconds between requests when rate limited
};

// Data transformation utilities
function transformHealthScore(healthScore: string): "Healthy" | "At Risk" | "Critical" {
  const mapping: Record<string, "Healthy" | "At Risk" | "Critical"> = {
    'healthy': 'Healthy',
    'at_risk': 'At Risk',
    'critical': 'Critical',
  };
  return mapping[healthScore.toLowerCase()] || 'Healthy';
}

function transformIndustry(industry: string): string {
  // Capitalize first letter of each word
  return industry
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function calculateSentiment(customer: BackendCustomerDetail): "up" | "down" {
  // Determine sentiment from metrics or recent meetings
  if (customer.metrics) {
    if (customer.metrics.usage_trend === 'up') return 'up';
    if (customer.metrics.usage_trend === 'down') return 'down';
  }
  
  // Check recent meetings sentiment
  if (customer.meetings && customer.meetings.length > 0) {
    const recentMeeting = customer.meetings[0];
    if (recentMeeting.sentiment) {
      const sentiment = recentMeeting.sentiment.toLowerCase();
      if (sentiment.includes('positive') || sentiment === 'up') return 'up';
      if (sentiment.includes('negative') || sentiment === 'down') return 'down';
    }
  }
  
  // Default based on health score
  return customer.health_score === 'healthy' ? 'up' : 'down';
}

function transformCustomer(backendCustomer: BackendCustomerDetail): Customer {
  // Use the same logic as addDerivedProperties but for detailed customer
  const arr = parseFloat(backendCustomer.arr);
  
  // Calculate ARR band
  let arr_band = '$0-50K';
  if (arr >= 500000) arr_band = '$500K+';
  else if (arr >= 250000) arr_band = '$250K-500K';
  else if (arr >= 100000) arr_band = '$100K-250K';
  else if (arr >= 50000) arr_band = '$50K-100K';
  
  // Calculate segment based on ARR
  let segment = 'Small Business';
  if (arr >= 500000) segment = 'Enterprise';
  else if (arr >= 250000) segment = 'Mid-Market';
  else if (arr >= 100000) segment = 'Growth';
  
  // Calculate tier based on industry and ARR
  let tier = 'Standard';
  if (arr >= 250000 && (backendCustomer.industry === 'technology' || backendCustomer.industry === 'finance')) {
    tier = 'Premium';
  } else if (arr >= 500000) {
    tier = 'Enterprise';
  }

  return {
    id: backendCustomer.id,
    name: backendCustomer.name,
    industry: transformIndustry(backendCustomer.industry),
    arr: arr,
    health_score: transformHealthScore(backendCustomer.health_score),
    renewal_date: backendCustomer.renewal_date,
    last_updated: backendCustomer.last_updated,
    sentiment: calculateSentiment(backendCustomer),
    segment,
    tier,
    arr_band,
    churned: backendCustomer.health_score === 'critical' && new Date(backendCustomer.renewal_date) < new Date(),
    signup_date: backendCustomer.created_at || backendCustomer.last_updated,
    created_at: backendCustomer.created_at
  };
}

// Add derived properties that the frontend expects
function addDerivedProperties(customer: BackendCustomer): Customer {
  const arr = typeof customer.arr === 'string' ? parseFloat(customer.arr) : customer.arr;
  
  // Calculate ARR band
  let arr_band = '$0-50K';
  if (arr >= 500000) arr_band = '$500K+';
  else if (arr >= 250000) arr_band = '$250K-500K';
  else if (arr >= 100000) arr_band = '$100K-250K';
  else if (arr >= 50000) arr_band = '$50K-100K';
  
  // Calculate segment based on ARR
  let segment = 'Small Business';
  if (arr >= 500000) segment = 'Enterprise';
  else if (arr >= 250000) segment = 'Mid-Market';
  else if (arr >= 100000) segment = 'Growth';
  
  // Calculate tier based on industry and ARR
  let tier = 'Standard';
  if (arr >= 250000 && (customer.industry === 'technology' || customer.industry === 'finance')) {
    tier = 'Premium';
  } else if (arr >= 500000) {
    tier = 'Enterprise';
  }
  
  return {
    ...customer,
    arr: arr,
    health_score: transformHealthScore(customer.health_score),
    industry: transformIndustry(customer.industry),
    segment,
    tier,
    arr_band,
    churned: customer.health_score === 'critical' && new Date(customer.renewal_date) < new Date(),
    signup_date: customer.created_at || customer.last_updated || new Date().toISOString(),
    sentiment: customer.health_score === 'healthy' ? 'up' : 'down'
  } as Customer;
}

function transformCustomerDetail(backendCustomer: BackendCustomerDetail): CustomerDetail {
  const base = transformCustomer(backendCustomer);
  
  return {
    ...base,
    feedback: backendCustomer.feedback.map(fb => ({
      id: fb.id,
      title: fb.title,
      status: fb.status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      description: fb.description,
      created_at: fb.created_at,
    })),
    meetings: backendCustomer.meetings.map(m => ({
      id: m.id,
      date: m.date,
      summary: m.summary,
      participants: m.participants,
      sentiment: m.sentiment,
    })),
    metrics: backendCustomer.metrics ? {
      nps: backendCustomer.metrics.nps,
      usage_trend: backendCustomer.metrics.usage_trend,
      active_users: backendCustomer.metrics.active_users,
      renewal_rate: parseFloat(backendCustomer.metrics.renewal_rate),
      seat_utilization: parseFloat(backendCustomer.metrics.seat_utilization),
      response_limit: backendCustomer.metrics.response_limit,
      response_used: backendCustomer.metrics.response_used,
    } : null,
  };
}

// Cache implementation
class ApiCache {
  private cache = new Map<
    string,
    { data: string; timestamp: number; ttl: number }
  >();

  set(key: string, data: unknown, ttl: number = API_CONFIG.cacheTimeout): void {
    this.cache.set(key, {
      data: JSON.stringify(data),
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    try {
      return JSON.parse(item.data) as T;
    } catch {
      this.cache.delete(key);
      return null;
    }
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// Request queue for rate limiting
class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private lastRequestTime = 0;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < API_CONFIG.rateLimitDelay) {
        await this.delay(API_CONFIG.rateLimitDelay - timeSinceLastRequest);
      }

      const request = this.queue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Fallback data for when services are unavailable
const FALLBACK_DATA = {
  customers: [
    {
      id: 1,
      name: "TechCorp Solutions",
      industry: "Technology",
      arr: 500000,
      health_score: "Healthy" as const,
      renewal_date: "2025-12-15",
      last_updated: "2024-01-15T00:00:00Z",
      sentiment: "up" as const,
    },
  ] as Customer[],
  profileSummary: {
    customer: "Sample Customer",
    summary:
      "This customer profile is currently unavailable. Please try again later or contact support if the issue persists.",
    risks: ["Service temporarily unavailable"],
    opportunities: ["Retry when service is restored"],
    talk_tracks: [
      "Acknowledge service interruption",
      "Provide alternative support channels",
    ],
  },
  similarCustomers: [],
};

// Main API Service Class
class ApiService {
  private cache = new ApiCache();
  private requestQueue = new RequestQueue();
  private abortControllers = new Map<string, AbortController>();
  private pendingRequests = new Map<string, Promise<unknown>>();

  // Utility methods
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private createAbortController(key: string): AbortController {
    // Cancel any existing request with the same key
    const existing = this.abortControllers.get(key);
    if (existing) {
      existing.abort();
    }

    const controller = new AbortController();
    this.abortControllers.set(key, controller);
    return controller;
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    useCache: boolean = true,
    cacheKey?: string
  ): Promise<T> {
    const key = cacheKey || url;

    // Check cache first
    if (useCache) {
      const cached = this.cache.get<T>(key);
      if (cached) {
        return cached;
      }
    }

    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create abort controller for this request
    const controller = this.createAbortController(key);

    const requestOptions: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    let lastError: Error | ApiError | null = null;

    // Create the request promise and store it
    const requestPromise = (async (): Promise<T> => {
      try {
        // Retry logic
        for (let attempt = 1; attempt <= API_CONFIG.retryAttempts; attempt++) {
          try {
            const response = await Promise.race([
              fetch(`${API_CONFIG.baseUrl}${url}`, requestOptions),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () => reject(new Error("Request timeout")),
                  API_CONFIG.timeout
                )
              ),
            ]);

            if (!response.ok) {
              let errorData: Record<string, unknown> = {};
              try {
                errorData = await response.json();
              } catch {
                // Ignore JSON parsing errors
              }

              const error: ApiError = {
                message:
                  (errorData.detail as string) ||
                  `HTTP ${response.status}: ${response.statusText}`,
                status: response.status,
                code: errorData.code as string,
                retryable: response.status >= 500 || response.status === 429,
              };

              // Handle rate limiting
              if (response.status === 429) {
                const retryAfter = response.headers.get("Retry-After");
                const delay = retryAfter
                  ? parseInt(retryAfter) * 1000
                  : API_CONFIG.rateLimitDelay;
                await this.delay(delay);
                continue;
              }

              throw error;
            }

            const data = await response.json();

            // Cache successful responses
            if (useCache) {
              this.cache.set(key, data);
            }

            return data;
          } catch (error) {
            lastError = error as Error | ApiError;

            // Don't retry if request was aborted
            if (error instanceof Error && error.name === "AbortError") {
              throw error;
            }

            // Don't retry non-retryable errors
            if (this.isApiError(error) && error.retryable === false) {
              throw error;
            }

            // Wait before retry (exponential backoff)
            if (attempt < API_CONFIG.retryAttempts) {
              await this.delay(
                API_CONFIG.retryDelay * Math.pow(2, attempt - 1)
              );
            }
          }
        }

        // All retries failed, throw the last error
        throw lastError;
      } finally {
        // Clean up
        this.abortControllers.delete(key);
        this.pendingRequests.delete(key);
      }
    })();

    // Store the pending request
    this.pendingRequests.set(key, requestPromise);

    return requestPromise;
  }

  private isApiError(error: unknown): error is ApiError {
    return typeof error === "object" && error !== null && "retryable" in error;
  }

  // Public API methods
  async getHealth(): Promise<{
    status: string;
    message: string;
    version: string;
  }> {
    try {
      const response = await this.makeRequest<{
        message: string;
        version: string;
      }>("/api/", {}, false);
      return {
        status: "available",
        message: response.message || "Service is available",
        version: response.version || "1.0.0",
      };
    } catch (error) {
      console.error("Health check failed:", error);
      return {
        status: "unavailable",
        message: "Service temporarily unavailable",
        version: "1.0.0",
      };
    }
  }

  async getCustomers(
    page: number = 1,
    perPage: number = 20
  ): Promise<PaginatedResponse<Customer>> {
    try {
      const cacheKey = `customers_${page}_${perPage}`;
      // Backend uses Django REST Framework pagination
      // List endpoint returns CustomerListSerializer (simplified)
      const response = await this.requestQueue.add(() =>
        this.makeRequest<{
          count: number;
          next: string | null;
          previous: string | null;
          results: BackendCustomer[];
        }>(
          `/api/customers/?page=${page}&page_size=${perPage}`,
          {},
          true,
          cacheKey
        )
      );
      
      // Transform backend data to frontend format
      // For list view, we use simplified sentiment calculation based on health_score
      const transformedCustomers: Customer[] = response.results.map(customer => {
        // Apply derived properties transformation
        return addDerivedProperties(customer);
      });
      
      // Calculate total pages
      const totalPages = Math.ceil(response.count / perPage);
      
      return {
        customers: transformedCustomers,
        results: transformedCustomers,
        total: response.count,
        count: response.count,
        page,
        per_page: perPage,
        total_pages: totalPages,
        next: response.next,
        previous: response.previous,
      };
    } catch (error) {
      console.warn("Failed to fetch customers, using fallback data:", error);
      return {
        customers: FALLBACK_DATA.customers,
        results: FALLBACK_DATA.customers,
        total: 1,
        count: 1,
        page,
        per_page: perPage,
        total_pages: 1,
      };
    }
  }

  async getCustomerDetail(customerId: number): Promise<CustomerDetail> {
    try {
      const cacheKey = `customer_detail_${customerId}`;
      const backendCustomer = await this.requestQueue.add(() =>
        this.makeRequest<BackendCustomerDetail>(
          `/api/customers/${customerId}/`,
          {},
          true,
          cacheKey
        )
      );
      
      return transformCustomerDetail(backendCustomer);
    } catch (error) {
      console.warn(`Failed to fetch customer ${customerId} details:`, error);
      throw new Error(
        `Unable to load customer details. Please try again later.`
      );
    }
  }

  async getSimilarCustomers(
    customerId: number
  ): Promise<{ base_customer: string; similar_customers: SimilarCustomer[] }> {
    try {
      const cacheKey = `similar_customers_${customerId}`;
      return await this.requestQueue.add(() =>
        this.makeRequest<{
          base_customer: string;
          similar_customers: SimilarCustomer[];
        }>(`/similar_customers/${customerId}`, {}, true, cacheKey)
      );
    } catch (error) {
      console.warn(
        `Failed to fetch similar customers for ${customerId}:`,
        error
      );
      return {
        base_customer: "Unknown Customer",
        similar_customers: FALLBACK_DATA.similarCustomers,
      };
    }
  }

  async getProfileSummary(customerId: number): Promise<ProfileSummary> {
    try {
      const cacheKey = `profile_summary_${customerId}`;
      const result = await this.requestQueue.add(() =>
        this.makeRequest<ProfileSummary>(
          `/profile_summary/${customerId}`,
          {},
          true,
          cacheKey
        )
      );

      // Validate AI-generated content
      if (!this.validateProfileSummary(result)) {
        throw new Error("Invalid AI response format");
      }

      return result;
    } catch (error) {
      console.warn(`Failed to fetch profile summary for ${customerId}:`, error);
      return {
        ...FALLBACK_DATA.profileSummary,
        customer: `Customer ${customerId}`,
      };
    }
  }

  // Data validation for AI responses
  private validateProfileSummary(data: ProfileSummary): boolean {
    return (
      data &&
      typeof data.customer === "string" &&
      typeof data.summary === "string" &&
      Array.isArray(data.risks) &&
      Array.isArray(data.opportunities) &&
      Array.isArray(data.talk_tracks) &&
      data.summary.length > 10 // Ensure meaningful content
    );
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Simple pattern matching for cache invalidation
    const keys = this.cache.getKeys();
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  // Cancel ongoing requests
  cancelRequest(key: string): void {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }

  cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export error handling utilities
export const handleApiError = (error: unknown): string => {
  if (error && typeof error === "object" && "message" in error) {
    return (error as { message: string }).message;
  }

  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    switch (status) {
      case 404:
        return "The requested resource was not found.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "Server error. Please try again later.";
      case 503:
        return "Service temporarily unavailable. Please try again later.";
      default:
        return `An error occurred (${status}). Please try again.`;
    }
  }

  return "An unexpected error occurred. Please try again.";
};

export const isRetryableError = (error: unknown): boolean => {
  if (error && typeof error === "object" && "retryable" in error) {
    return (error as { retryable: boolean }).retryable;
  }
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    return status >= 500 || status === 429;
  }
  return false;
};
