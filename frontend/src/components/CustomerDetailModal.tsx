"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Building,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Target,
  MessageSquare,
  ExternalLink,
  Users,
  DollarSign,
  Activity,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import AnimatedModal from "./AnimatedModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProfileSummary } from "@/hooks/useApi";
import type { Customer, ProfileSummary } from "@/services/apiService";

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  trigger?: React.ReactNode;
  profileSummary?: ProfileSummary | null;
  loading?: boolean;
  error?: string | null;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  trigger,
  profileSummary: externalProfileSummary,
  loading: externalLoading,
  error: externalError,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "profile" | "insights" | "activity"
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

  const tabVariants = {
    inactive: {
      backgroundColor: "transparent",
      color: "#6C757D",
      scale: 1,
    },
    active: {
      backgroundColor: "#00B365",
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
          <h3 className="text-responsive-3xl font-bold text-gray-900 mb-3 wrap-wrap-break-words">
            {customer.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
            <Badge variant="outline" className="text-xs sm:text-sm">
              {customer.industry}
            </Badge>
            <Badge 
              variant={customer.health_score === "Healthy" ? "default" : customer.health_score === "At Risk" ? "secondary" : "destructive"} 
              className="text-xs sm:text-sm"
            >
              {customer.health_score}
            </Badge>
          </div>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <div className="text-responsive-3xl font-bold text-green-600 wrap-break-words">
            ${(customer.arr / 1000).toFixed(0)}k
          </div>
          <div className="text-responsive-sm text-gray-500">
            Annual Recurring Revenue
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="card-responsive border-l-4 border-l-blue-500">
          <CardContent className="spacing-responsive-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-responsive-sm font-medium text-gray-600">
                  Health Score
                </p>
                <p className="text-responsive-2xl font-bold text-gray-500">
                  N/A
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-50 text-blue-600 shrink-0">
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
                  Churn Risk
                </p>
                <p className="text-responsive-2xl font-bold text-gray-500">
                  N/A
                </p>
              </div>
              <div className="p-2 rounded-full bg-orange-50 text-orange-600 shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-responsive border-l-4 border-l-green-500">
          <CardContent className="spacing-responsive-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-responsive-sm font-medium text-gray-600">
                  Last Updated
                </p>
                <p className="text-responsive-sm font-semibold text-gray-900 wrap-break-words">
                  {formatDate(customer.last_updated)}
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-50 text-green-600 shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-responsive border-l-4 border-l-purple-500">
          <CardContent className="spacing-responsive-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-responsive-sm font-medium text-gray-600">
                  Status
                </p>
                <p className="text-responsive-sm font-semibold text-gray-900">
                  Active
                </p>
              </div>
              <div className="p-2 rounded-full bg-purple-50 text-purple-600 shrink-0">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="card-responsive">
        <CardHeader className="spacing-responsive-sm">
          <CardTitle className="text-responsive-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="spacing-responsive-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <Button variant="outline" className="btn-responsive justify-start">
              <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
              <span className="truncate">Send Email</span>
            </Button>
            <Button variant="outline" className="btn-responsive justify-start">
              <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
              <span className="truncate">Schedule Call</span>
            </Button>
            <Button variant="outline" className="btn-responsive justify-start sm:col-span-2 lg:col-span-1">
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
              <span className="truncate">View in CRM</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderProfileTab = () => (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Company Information */}
        <Card className="card-responsive">
          <CardHeader className="spacing-responsive-sm">
            <CardTitle className="text-responsive-lg flex items-center gap-2">
              <Building className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="spacing-responsive-sm space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <p className="text-responsive-sm font-medium text-gray-600">
                Company Name
              </p>
              <p className="text-responsive-base text-gray-900 wrap-break-words">
                {customer.name}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-responsive-sm font-medium text-gray-600">
                Industry
              </p>
              <p className="text-responsive-base text-gray-900">
                Technology
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-responsive-sm font-medium text-gray-600">
                Company Size
              </p>
              <p className="text-responsive-base text-gray-900">
                500-1000 employees
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-responsive-sm font-medium text-gray-600">
                Website
              </p>
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                <p className="text-responsive-base text-blue-600 hover:underline cursor-pointer break-all">
                  www.example.com
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="card-responsive">
          <CardHeader className="spacing-responsive-sm">
            <CardTitle className="text-responsive-lg flex items-center gap-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="spacing-responsive-sm space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <p className="text-responsive-sm font-medium text-gray-600">
                Annual Recurring Revenue
              </p>
              <p className="text-responsive-base font-semibold text-green-600 wrap-break-words">
                ${customer.arr.toLocaleString()} / yr
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-responsive-sm font-medium text-gray-600">
                Industry
              </p>
              <Badge variant="outline" className="text-xs sm:text-sm">
                {customer.industry}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-responsive-sm font-medium text-gray-600">
                Health Score
              </p>
              <Badge 
                variant={customer.health_score === "Healthy" ? "default" : customer.health_score === "At Risk" ? "secondary" : "destructive"} 
                className="text-xs sm:text-sm"
              >
                {customer.health_score}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-responsive-sm font-medium text-gray-600">
                Renewal Date
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                <p className="text-responsive-base text-gray-900 wrap-break-words">
                  {formatDate(customer.renewal_date)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card className="card-responsive">
        <CardHeader className="spacing-responsive-sm">
          <CardTitle className="text-responsive-lg flex items-center gap-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="spacing-responsive-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2">
              <p className="text-responsive-sm font-medium text-gray-600">
                Primary Contact
              </p>
              <p className="text-responsive-base text-gray-900">
                John Smith
              </p>
              <p className="text-responsive-sm text-gray-500">
                CEO
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-responsive-sm font-medium text-gray-600">
                Email
              </p>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                <p className="text-responsive-base text-blue-600 hover:underline cursor-pointer break-all">
                  john@example.com
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-responsive-sm font-medium text-gray-600">
                Phone
              </p>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                <p className="text-responsive-base text-gray-900">
                  +1 (555) 123-4567
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderInsightsTab = () => (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-6"
    >
      {/* Risks Section */}
      <Card className="card-responsive">
        <CardHeader className="spacing-responsive-sm">
          <CardTitle className="text-responsive-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 shrink-0" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="spacing-responsive-sm">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <p className="text-red-600 text-responsive-sm wrap-break-words">{error}</p>
          ) : profileSummary?.risks?.length ? (
            <div className="space-y-3">
              {profileSummary.risks.map((risk: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <div className="p-1 rounded-full bg-red-100 text-red-600 shrink-0">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <p className="text-responsive-base text-gray-900 wrap-break-words flex-1">{risk}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-responsive-base text-gray-600">
              No risks identified at this time.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Opportunities Section */}
      <Card className="card-responsive">
        <CardHeader className="spacing-responsive-sm">
          <CardTitle className="text-responsive-lg flex items-center gap-2">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
            Growth Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent className="spacing-responsive-sm">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <p className="text-red-600 text-responsive-sm wrap-break-words">{error}</p>
          ) : profileSummary?.opportunities?.length ? (
            <div className="space-y-3">
              {profileSummary.opportunities.map((opportunity: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="p-1 rounded-full bg-green-100 text-green-600 shrink-0">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <p className="text-responsive-base text-gray-900 wrap-break-words flex-1">
                    {opportunity}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-responsive-base text-gray-600">
              No opportunities identified at this time.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Talking Points Section */}
      <Card className="card-responsive">
        <CardHeader className="spacing-responsive-sm">
          <CardTitle className="text-responsive-lg flex items-center gap-2">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
            Talking Points
          </CardTitle>
        </CardHeader>
        <CardContent className="spacing-responsive-sm">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <p className="text-red-600 text-responsive-sm wrap-break-words">{error}</p>
          ) : profileSummary?.talk_tracks?.length ? (
            <div className="space-y-3">
              {profileSummary.talk_tracks.map((talkTrack: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="p-1 rounded-full bg-blue-100 text-blue-600 shrink-0">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <p className="text-responsive-base text-gray-900 wrap-break-words flex-1">
                    {talkTrack}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-responsive-base text-gray-600">
              No talking points available at this time.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderActivityTab = () => (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-6"
    >
      <Card className="card-responsive">
        <CardHeader className="spacing-responsive-sm">
          <CardTitle className="text-responsive-lg flex items-center gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="spacing-responsive-sm">
          <div className="space-y-4">
            {/* Activity Timeline */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600 shrink-0">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-responsive-base font-medium text-gray-900">
                    Email sent to primary contact
                  </p>
                  <p className="text-responsive-sm text-gray-500">
                    2 hours ago
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-green-100 text-green-600 shrink-0">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-responsive-base font-medium text-gray-900">
                    Scheduled follow-up call
                  </p>
                  <p className="text-responsive-sm text-gray-500">
                    1 day ago
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-purple-100 text-purple-600 shrink-0">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-responsive-base font-medium text-gray-900">
                    Quarterly business review completed
                  </p>
                  <p className="text-responsive-sm text-gray-500">
                    1 week ago
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Details"
      description={`Comprehensive information for ${customer.name}`}
      size="xl"
      trigger={trigger}
      className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:w-[85vw] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Tab Navigation */}
        <div className="w-full overflow-x-auto">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg min-w-max sm:min-w-0">
            {[
              { id: "overview", label: "Overview", icon: Building },
              { id: "profile", label: "Profile", icon: Users },
              { id: "insights", label: "Insights", icon: TrendingUp },
              { id: "activity", label: "Activity", icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as "overview" | "profile" | "insights" | "activity"
                    )
                  }
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap min-w-0 flex-1 sm:flex-initial cursor-pointer"
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
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px] sm:min-h-[400px]">
          {activeTab === "overview" && renderOverviewTab()}
          {activeTab === "profile" && renderProfileTab()}
          {activeTab === "insights" && renderInsightsTab()}
          {activeTab === "activity" && renderActivityTab()}
        </div>
      </div>
    </AnimatedModal>
  );
};

export default CustomerDetailModal;