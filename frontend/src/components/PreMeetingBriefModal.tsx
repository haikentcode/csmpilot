"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  AlertTriangle,
  Target,
  MessageSquare,
  Building,
} from "lucide-react";
import AnimatedModal from "./AnimatedModal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useProfileSummary } from "@/hooks/useApi";
import type { Customer, ProfileSummary } from "@/services/apiService";

interface PreMeetingBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  trigger?: React.ReactNode;
  profileSummary?: ProfileSummary | null;
  loading?: boolean;
  error?: string | null;
}

const PreMeetingBriefModal: React.FC<PreMeetingBriefModalProps> = ({
  isOpen,
  onClose,
  customer,
  trigger,
  profileSummary: externalProfileSummary,
  loading: externalLoading,
  error: externalError,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "risks" | "opportunities" | "talking-points"
  >("overview");

  // Use the API hook if no external data is provided
  const { data: hookData, loading: hookLoading, error: hookError } = useProfileSummary(
    customer?.id || null
  );

  // Use external data if provided, otherwise use hook data
  const profileSummary = externalProfileSummary || hookData;
  const loading =
    externalLoading !== undefined ? externalLoading : hookLoading;
  const error = externalError !== undefined ? externalError : hookError;

  if (!customer) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getHealthScoreVariant = (healthScore: string) => {
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

  const tabVariants = {
    inactive: {
      backgroundColor: "transparent",
      color: "#6C757D",
      scale: 1,
    },
    active: {
      backgroundColor: "#25834b",
      color: "#FFFFFF",
      scale: 1.02,
    },
  } as const;

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
  } as const;

  const renderOverviewTab = () => (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-6"
    >
      {/* Customer Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex-1 min-w-0">
          <h3 className="text-responsive-2xl font-bold text-gray-900 mb-2 wrap-break-words">
            {customer.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
            <Badge variant="outline" className="text-xs sm:text-sm">
              {customer.industry}
            </Badge>
            <Badge variant={getHealthScoreVariant(customer.health_score)} className="text-xs sm:text-sm">
              {customer.health_score}
            </Badge>
          </div>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <div className="text-responsive-2xl font-bold text-green-600 wrap-break-words">
            {formatARR(customer.arr)}
          </div>
          <div className="text-responsive-sm text-gray-500">
            Annual Recurring Revenue
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="card-responsive border-l-4 border-l-blue-500">
          <CardContent className="spacing-responsive-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-responsive-sm font-medium text-gray-600">
                  Health Score
                </p>
                <p className="text-responsive-2xl font-bold text-gray-500">
                  {customer.health_score}
                </p>
              </div>
              <div className={`p-2 rounded-full shrink-0 ${
                customer.health_score === "Critical" 
                  ? "bg-red-50 text-red-600"
                  : customer.health_score === "At Risk"
                  ? "bg-yellow-50 text-yellow-600"
                  : "bg-green-50 text-green-600"
              }`}>
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-responsive border-l-4 border-l-orange-500">
          <CardContent className="spacing-responsive-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-responsive-sm font-medium text-gray-600">
                  Sentiment
                </p>
                <p className="text-responsive-2xl font-bold text-gray-500">
                  {customer.sentiment === "up" ? "↑ Positive" : "↓ Negative"}
                </p>
              </div>
              <div className="p-2 rounded-full bg-gray-50 text-gray-500 shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-responsive border-l-4 border-l-green-500 sm:col-span-2 lg:col-span-1">
          <CardContent className="spacing-responsive-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-responsive-sm font-medium text-gray-600">
                  Renewal Date
                </p>
                <p className="text-responsive-sm font-semibold text-gray-900 wrap-break-words">
                  {formatDate(customer.renewal_date)}
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-50 text-green-600 shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  const renderRisksTab = () => (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 shrink-0" />
        <h3 className="text-responsive-lg font-semibold text-gray-900">
          Risk Assessment
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <Card className="card-responsive">
          <CardContent className="spacing-responsive-sm">
            <p className="text-red-600 text-responsive-sm wrap-break-words">{error}</p>
          </CardContent>
        </Card>
      ) : profileSummary?.risks?.length ? (
        <div className="space-y-3">
          {profileSummary.risks.map((risk: string, index: number) => (
            <Card key={index} className="card-responsive">
              <CardContent className="spacing-responsive-sm">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full mt-1 bg-red-100 text-red-600 shrink-0">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <p className="text-responsive-base text-gray-900 wrap-break-words flex-1">{risk}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="card-responsive">
          <CardContent className="spacing-responsive-sm">
            <p className="text-responsive-base text-gray-600">
              No risks identified at this time.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );

  const renderOpportunitiesTab = () => (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
        <h3 className="text-responsive-lg font-semibold text-gray-900">
          Growth Opportunities
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <Card className="card-responsive">
          <CardContent className="spacing-responsive-sm">
            <p className="text-red-600 text-responsive-sm wrap-break-words">{error}</p>
          </CardContent>
        </Card>
      ) : profileSummary?.opportunities?.length ? (
        <div className="space-y-3">
          {profileSummary.opportunities.map((opportunity: string, index: number) => (
            <Card key={index} className="card-responsive">
              <CardContent className="spacing-responsive-sm">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full mt-1 bg-green-100 text-green-600 shrink-0">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <p className="text-responsive-base text-gray-900 wrap-break-words flex-1">  
                    {opportunity}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="card-responsive">
          <CardContent className="spacing-responsive-sm">
            <p className="text-responsive-base text-gray-600">
              No opportunities identified at this time.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );

  const renderTalkingPointsTab = () => (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
        <h3 className="text-responsive-lg font-semibold text-gray-900">
          Talking Points
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <Card className="card-responsive">
          <CardContent className="spacing-responsive-sm">
            <p className="text-red-600 text-responsive-sm wrap-break-words">{error}</p>
          </CardContent>
        </Card>
      ) : profileSummary?.talk_tracks?.length ? (
        <div className="space-y-3">
          {profileSummary.talk_tracks.map((talkTrack: string, index: number) => (
            <Card key={index} className="card-responsive">
              <CardContent className="spacing-responsive-sm">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full mt-1 bg-blue-100 text-blue-600 shrink-0">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <p className="text-responsive-base text-gray-900 wrap-break-words flex-1">
                    {talkTrack}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="card-responsive">
          <CardContent className="spacing-responsive-sm">
            <p className="text-responsive-base text-gray-600">
              No talking points available at this time.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Pre-Meeting Brief"
      description={`Comprehensive overview for ${customer.name}`}
      size="xl"
      trigger={trigger}
      className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:w-[85vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Tab Navigation */}
        <div className="w-full overflow-x-auto">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg min-w-max sm:min-w-0">
            {[
              { id: "overview", label: "Overview", icon: Building },
              { id: "risks", label: "Risks", icon: AlertTriangle },
              { id: "opportunities", label: "Opportunities", icon: Target },
              {
                id: "talking-points",
                label: "Talking Points",
                icon: MessageSquare,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as
                        | "overview"
                        | "risks"
                        | "opportunities"
                        | "talking-points"
                    )
                  }
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap min-w-0 flex-1 sm:flex-initial"
                  variants={tabVariants}
                  animate={activeTab === tab.id ? "active" : "inactive"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden xs:inline sm:inline truncate">
                    {tab.label}
                  </span>
                  <span className="xs:hidden sm:hidden truncate">
                    {tab.label.split(" ")[0]}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px] sm:min-h-[400px]">
          {activeTab === "overview" && renderOverviewTab()}
          {activeTab === "risks" && renderRisksTab()}
          {activeTab === "opportunities" && renderOpportunitiesTab()}
          {activeTab === "talking-points" && renderTalkingPointsTab()}
        </div>
      </div>
    </AnimatedModal>
  );
};

export default PreMeetingBriefModal;
