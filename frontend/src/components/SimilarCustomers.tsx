"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { LoadingFailed, NoSimilarCustomers } from "@/components/ui/EmptyState";
import { useSimilarCustomers } from "@/hooks/useApi";
import type { SimilarCustomer } from "@/services/apiService";

interface SimilarCustomersProps {
  customerId: number;
}

export default function SimilarCustomers({
  customerId,
}: SimilarCustomersProps) {
  const { data: similarData, loading, error, retry } = useSimilarCustomers(customerId);

  const getHealthScoreVariant = (
    healthScore: string | undefined
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (!healthScore) return "outline";
    switch (healthScore.toLowerCase()) {
      case "healthy":
        return "default";
      case "at_risk":
      case "at risk":
        return "secondary";
      case "critical":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatARR = (arr: number): string => {
    if (arr >= 1000000) {
      return `$${(arr / 1000000).toFixed(1)}M`;
    } else if (arr >= 1000) {
      return `$${(arr / 1000).toFixed(1)}k`;
    }
    return `$${arr.toFixed(0)}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-primary-green";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-6 h-6 bg-gray-200 rounded mr-2"></div>
            <div className="h-6 bg-gray-200 rounded w-48"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <LoadingFailed
        onRetry={retry}
        error={typeof error === 'string' ? error : 'Unable to load similar customers'}
      />
    );
  }

  if (!similarData || !similarData.similar_customers || similarData.similar_customers.length === 0) {
    return (
      <NoSimilarCustomers
        customerName={similarData?.customer_name || 'this customer'}
        onRefresh={retry}
      />
    );
  }

  return (
    <TooltipProvider>
      <Card className="animate-slide-in-right">
        <CardHeader>
          <CardTitle className="flex items-center animate-fade-in-up text-dark-forest">
            <svg
              className="w-6 h-6 text-primary-green mr-2 animate-pulse-subtle"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Similar Customers to {similarData.customer_name}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Base Customer Card */}
          <Card
            className="border-l-4 border-l-primary-green bg-gradient-to-r from-light-mint to-off-white animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <CardContent className="p-4">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-primary-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="font-medium text-dark-forest mr-2">
                  Base Customer:
                </span>
                <span className="font-semibold text-primary-green">
                  {similarData.customer_name}
                </span>
                <span className="text-xs text-neutral-gray ml-2">
                  ({similarData.total_found} similar found)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Similar Customers List */}
          <div className="space-y-3">
            {similarData.similar_customers.map((customer: SimilarCustomer, index: number) => (
              <Card
                key={customer.customer_id}
                className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-bounce-in border-l-4 border-l-gray-300 hover:border-l-primary-green"
                style={{ animationDelay: `${(index + 2) * 0.1}s` }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-dark-forest hover:text-primary-green transition-colors duration-200">
                        {customer.name}
                      </h4>
                      <p className="text-xs text-neutral-gray mt-1">
                        {customer.industry} • {formatARR(customer.arr)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={`font-bold text-responsive-lg transition-all duration-200 hover:scale-110 ${getScoreColor(
                                customer.similarity_score
                              )}`}
                            >
                              {(customer.similarity_score * 100).toFixed(1)}%
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Similarity Score:{" "}
                              {(customer.similarity_score * 100).toFixed(1)}%
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {customer.health_score && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant={getHealthScoreVariant(customer.health_score)}
                              className="hover:scale-105 transition-transform duration-200"
                            >
                              {customer.health_score}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Health Score: {customer.health_score}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <Badge variant="outline" className="text-responsive-xs">
                      Rank #{index + 1}
                    </Badge>
                  </div>

                  {/* Shared Traits Section */}
                  {customer.shared_traits && customer.shared_traits.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-neutral-gray mb-2">Shared Traits:</p>
                      <div className="flex flex-wrap gap-1">
                        {customer.shared_traits.map((trait, traitIndex) => (
                          <Badge
                            key={traitIndex}
                            variant="secondary"
                            className="text-xs bg-light-mint text-dark-forest"
                          >
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-responsive-sm text-neutral-gray font-medium">
                      Similarity Progress
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={customer.similarity_score * 100}
                        className="w-24 h-2"
                      />
                      <span className="text-responsive-xs text-neutral-gray min-w-fit">
                        {(customer.similarity_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Explanation Footer */}
          <Card
            className="border-l-4 border-l-dark-forest bg-gradient-to-r from-light-mint to-off-white animate-fade-in-up"
            style={{ animationDelay: "0.8s" }}
          >
            <CardContent className="p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-primary-green mr-2 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-responsive-sm text-neutral-gray">
                  <span className="font-semibold text-dark-forest">
                    AI-Powered Similarity:
                  </span>{" "}
                  These customers are ranked by AI embeddings that analyze
                  company profiles, CSM interactions, support tickets, and
                  business patterns to find the most relevant matches for
                  strategic insights and best practices sharing.
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
