import type {
  GongMeeting,
  UpsellOpportunity,
  UseCase,
  SimilarCustomer,
} from "./apiService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatContext {
  customers?: Array<Customer>;
  meetings?: Array<{
    id: number;
    meeting_title: string;
    meeting_date: string;
    overall_sentiment: string;
    key_topics: string[];
    insights_count: number;
    meeting_summary?: string;
  }>;
  opportunities?: UpsellOpportunity[];
  use_cases?: UseCase[];
  similar_customers?: SimilarCustomer[];
}

export interface RAGRequest {
  query: string;
  customer_id?: number | null;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface RAGResponse {
  context: ChatContext;
  relevant_customer_ids: number[];
  query_intent: string;
}

class RAGService {
  /**
   * Fetch relevant customer context from backend RAG API
   */
  async getChatContext(request: RAGRequest): Promise<RAGResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/chat-context/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: request.query,
          customer_id: request.customer_id,
          conversation_history: request.conversation_history || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG API error: ${response.status}`);
      }

      const data: RAGResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching RAG context:", error);
      // Return empty context on error
      return {
        context: {
          customers: [],
          meetings: [],
          opportunities: [],
          use_cases: [],
          similar_customers: [],
        },
        relevant_customer_ids: [],
        query_intent: "general",
      };
    }
  }

  /**
   * Build a structured prompt from the retrieved context
   */
  buildContextPrompt(context: ChatContext, query: string): string {
    let prompt = "=== CUSTOMER CONTEXT ===\n\n";

    // Add customer data
    if (context.customers && context.customers.length > 0) {
      prompt += "CUSTOMERS:\n";
      context.customers.forEach((c) => {
        prompt += `- ${c.name} (ID: ${c.id})\n`;
        prompt += `  Industry: ${c.industry}\n`;
        prompt += `  ARR: $${c.arr.toLocaleString()}\n`;
        prompt += `  Health Score: ${c.health_score}\n`;
        prompt += `  Renewal Date: ${c.renewal_date}\n`;
        if (c.active_users) {
          prompt += `  Active Users: ${c.active_users}\n`;
        }
        if (c.nps) {
          prompt += `  NPS: ${c.nps}\n`;
        }
        prompt += `\n`;
      });
    }

    // Add meeting data
    if (context.meetings && context.meetings.length > 0) {
      prompt += "RECENT MEETINGS:\n";
      context.meetings.slice(0, 3).forEach((m) => {
        prompt += `- ${m.meeting_title} (${new Date(m.meeting_date).toLocaleDateString()})\n`;
        prompt += `  Sentiment: ${m.overall_sentiment}\n`;
        if (m.key_topics && m.key_topics.length > 0) {
          prompt += `  Key Topics: ${m.key_topics.join(", ")}\n`;
        }
        if (m.insights_count > 0) {
          prompt += `  AI Insights: ${m.insights_count} items\n`;
        }
        if (m.meeting_summary) {
          // Truncate long summaries
          const summary =
            m.meeting_summary.length > 150
              ? m.meeting_summary.substring(0, 150) + "..."
              : m.meeting_summary;
          prompt += `  Summary: ${summary}\n`;
        }
        prompt += `\n`;
      });
    }

    // Add upsell opportunities
    if (context.opportunities && context.opportunities.length > 0) {
      prompt += "UPSELL OPPORTUNITIES:\n";
      context.opportunities.slice(0, 3).forEach((o) => {
        prompt += `- ${o.product_name}\n`;
        prompt += `  Category: ${o.category}\n`;
        prompt += `  Reason: ${o.reason}\n\n`;
      });
    }

    // Add use cases
    if (context.use_cases && context.use_cases.length > 0) {
      prompt += "USE CASES:\n";
      context.use_cases.slice(0, 3).forEach((u) => {
        prompt += `- ${u.product_name}\n`;
        prompt += `  Category: ${u.product_category}\n`;
        // Truncate long use case descriptions
        const useCase =
          u.use_case.length > 100
            ? u.use_case.substring(0, 100) + "..."
            : u.use_case;
        prompt += `  Use Case: ${useCase}\n\n`;
      });
    }

    // Add similar customers
    if (context.similar_customers && context.similar_customers.length > 0) {
      prompt += "SIMILAR CUSTOMERS:\n";
      context.similar_customers.slice(0, 3).forEach((s) => {
        prompt += `- ${s.name} (${s.industry})\n`;
        prompt += `  Similarity: ${(s.similarity_score * 100).toFixed(1)}%\n`;
        prompt += `  Health: ${s.health_score}\n`;
        prompt += `  ARR: $${s.arr.toLocaleString()}\n\n`;
      });
    }

    prompt += "=== END CONTEXT ===\n\n";
    prompt += `User Query: ${query}\n`;

    return prompt;
  }

  /**
   * Extract customer names mentioned in the query (client-side)
   */
  extractCustomerMentions(query: string): string[] {
    const mentions: string[] = [];
    
    // Simple regex to find capitalized words that might be company names
    // This is a basic implementation - the backend does more sophisticated matching
    const words = query.split(/\s+/);
    const capitalizedWords = words.filter(
      (word) => word.length > 2 && word[0] === word[0].toUpperCase()
    );
    
    mentions.push(...capitalizedWords);
    
    return mentions;
  }

  /**
   * Calculate approximate token count for context
   */
  estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate context if it exceeds token limit
   */
  truncateContext(context: ChatContext, maxTokens: number = 2000): ChatContext {
    const truncated: ChatContext = { ...context };
    
    // Prioritize: customers > meetings > opportunities > use_cases > similar_customers
    
    // Keep all customers (usually small)
    // Limit meetings to 3
    if (truncated.meetings && truncated.meetings.length > 3) {
      truncated.meetings = truncated.meetings.slice(0, 3);
    }
    
    // Limit opportunities to 3
    if (truncated.opportunities && truncated.opportunities.length > 3) {
      truncated.opportunities = truncated.opportunities.slice(0, 3);
    }
    
    // Limit use cases to 2
    if (truncated.use_cases && truncated.use_cases.length > 2) {
      truncated.use_cases = truncated.use_cases.slice(0, 2);
    }
    
    // Limit similar customers to 3
    if (truncated.similar_customers && truncated.similar_customers.length > 3) {
      truncated.similar_customers = truncated.similar_customers.slice(0, 3);
    }
    
    return truncated;
  }
}

export const ragService = new RAGService();

