"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ProfileSummarySkeleton } from "@/components/ui/LoadingSpinner";
import { LoadingFailed } from "@/components/ui/EmptyState";
import { useProfileSummary } from "@/hooks/useApi";
import PreMeetingBriefModal from "./PreMeetingBriefModal";
import CustomerDetailModal from "./CustomerDetailModal";
import {
  FileText,
  Eye,
  Sparkles,
  TriangleAlert,
  TrendingUp,
  MessageSquareCode,
} from "lucide-react";
import type { Customer } from "@/services/apiService";

interface CustomerProfileProps {
  customer: Customer;
  onShowSimilarCustomers: () => void;
}

export default function CustomerProfile({
  customer,
  onShowSimilarCustomers,
}: CustomerProfileProps) {
  const [isPreMeetingModalOpen, setIsPreMeetingModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const {
    data: profileSummary,
    loading,
    error,
    retry,
  } = useProfileSummary(customer.id);

  const getHealthScoreVariant = (
    healthScore: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (healthScore) {
      case "Healthy":
        return "default";
      case "At Risk":
        return "secondary";
      case "Critical":
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

  if (loading) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Loading Profile...</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileSummarySkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <LoadingFailed
        onRetry={retry}
        error={error || "Failed to load profile summary"}
      />
    );
  }

  return (
    <TooltipProvider>
      <Card className="animate-slide-in-right card-responsive">
        <CardHeader className="spacing-responsive-md">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div className="space-y-3 flex-1">
              <CardTitle className="text-responsive-2xl animate-fade-in-up">
                {customer.name}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="hover:scale-105 transition-transform duration-200 text-responsive-sm"
                      >
                        {customer.industry}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Industry: {customer.industry}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant={getHealthScoreVariant(customer.health_score)}
                        className="hover:scale-105 transition-transform duration-200 text-responsive-sm"
                      >
                        {customer.health_score}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Health Score: {customer.health_score}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="hover:scale-105 transition-transform duration-200 text-responsive-sm"
                      >
                        ARR: {formatARR(customer.arr)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Annual Recurring Revenue: {formatARR(customer.arr)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {customer.health_score === "Critical" && (
                  <Badge
                    variant="destructive"
                    className="animate-pulse-subtle text-responsive-sm"
                  >
                    Critical
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <Button
                onClick={() => setIsPreMeetingModalOpen(true)}
                variant="outline"
                className="btn-responsive transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Pre-Meeting Brief</span>
                <span className="sm:hidden">Brief</span>
              </Button>

              <Button
                onClick={() => setIsDetailModalOpen(true)}
                variant="outline"
                className="btn-responsive transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">View Details</span>
                <span className="sm:hidden">Details</span>
              </Button>

              <Button
                onClick={onShowSimilarCustomers}
                className="btn-responsive transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="hidden sm:inline">Find Similar Customers</span>
                <span className="sm:hidden">Similar</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        {profileSummary && (
          <CardContent className="spacing-responsive-md">
            <Separator className="mb-6" />

            {/* AI Summary */}
            <Card
              className="animate-fade-in-up border-l-4 border-l-primary-green bg-gradient-to-r from-light-mint to-off-white card-responsive"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader className="spacing-responsive-sm">
                <CardTitle className="text-responsive-lg flex items-center text-dark-forest">
                  <Sparkles className="w-5 h-5 mr-2 shrink-0 text-primary-green" />
                  AI-Generated Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="spacing-responsive-sm">
                <p className="text-neutral-gray leading-relaxed text-responsive-base">
                  {profileSummary.summary}
                </p>
              </CardContent>
            </Card>

            {/* Risks, Opportunities, Talk Tracks */}
            <div className="grid-responsive-3 mt-6">
              {/* Risks */}
              <Card
                className="border-l-4 border-l-red-500 bg-red-50 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-bounce-in card-responsive"
                style={{ animationDelay: "0.3s" }}
              >
                <CardHeader className="spacing-responsive-sm">
                  <CardTitle className="text-responsive-lg flex items-center text-red-900">
                    <TriangleAlert className="w-5 h-5 mr-2 shrink-0" />
                    Top Risks
                  </CardTitle>
                </CardHeader>
                <CardContent className="spacing-responsive-sm">
                  <ul className="space-y-2">
                    {profileSummary.risks.map((risk, index) => (
                      <div key={index}>
                        <li className="text-responsive-sm text-red-800 hover:text-red-900 transition-colors duration-200 cursor-default">
                          • {risk}
                        </li>
                      </div>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Opportunities */}
              <Card
                className="border-l-4 border-l-primary-green bg-light-mint hover:shadow-lg transition-all duration-300 hover:scale-105 animate-bounce-in card-responsive"
                style={{ animationDelay: "0.4s" }}
              >
                <CardHeader className="spacing-responsive-sm">
                  <CardTitle className="text-responsive-lg flex items-center text-dark-forest">
                    <TrendingUp className="w-5 h-5 mr-2 shrink-0 text-primary-green" />
                    Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="spacing-responsive-sm">
                  <ul className="space-y-2">
                    {profileSummary.opportunities.map((opportunity, index) => (
                      <div key={index}>
                        <li className="text-responsive-sm text-dark-forest hover:text-primary-green transition-colors duration-200 cursor-default">
                          • {opportunity}
                        </li>
                      </div>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Talk Tracks */}
              <Card
                className="border-l-4 border-l-dark-forest bg-gradient-to-r from-light-mint to-off-white hover:shadow-lg transition-all duration-300 hover:scale-105 animate-bounce-in card-responsive"
                style={{ animationDelay: "0.5s" }}
              >
                <CardHeader className="spacing-responsive-sm">
                  <CardTitle className="text-responsive-lg flex items-center text-dark-forest">
                    <MessageSquareCode className="w-5 h-5 mr-2 shrink-0 text-primary-green" />
                    Talk Tracks
                  </CardTitle>
                </CardHeader>
                <CardContent className="spacing-responsive-sm">
                  <ul className="space-y-2">
                    {profileSummary.talk_tracks.map((track, index) => (
                      <div key={index}>
                        <li className="text-responsive-sm text-neutral-gray hover:text-dark-forest transition-colors duration-200 cursor-default">
                          • {track}
                        </li>
                      </div>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        )}

        {/* Modals */}
        <PreMeetingBriefModal
          isOpen={isPreMeetingModalOpen}
          onClose={() => setIsPreMeetingModalOpen(false)}
          customer={customer}
          profileSummary={profileSummary}
          loading={loading}
          error={error}
        />

        <CustomerDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          customer={customer}
        />
      </Card>
    </TooltipProvider>
  );
}
