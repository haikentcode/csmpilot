"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  CalendarCheck,
  Users,
  TrendingUp,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Heart,
  ThumbsDown,
  DollarSign,
  Clock,
  Package,
  CheckCircle2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useCustomerDetail, useGongMeetings } from "@/hooks/useApi";
import { CustomerDetail, GongMeeting } from "@/services/apiService";
import MeetingDetailModal from "@/components/MeetingDetailModal";

import { useCustomerDetail, useGongMeetings } from "@/hooks/useApi";
import { CustomerDetail, GongMeeting } from "@/services/apiService";
import MeetingDetailModal from "@/components/MeetingDetailModal";

export default function AccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params?.id ? Number(params.id) : null;
  const [showAIStory, setShowAIStory] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);
  const [aiStory, setAiStory] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<GongMeeting | null>(null);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  // Fetch account details from API
  const { data: account, loading, error } = useCustomerDetail(accountId);
  const { data: gongMeetings, loading: meetingsLoading } = useGongMeetings(accountId);

  const formatArr = (arr: number): string => {
    return `$${arr.toLocaleString()} / yr`;
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryConfig = (category: string) => {
    const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
      FEATURE_REQUEST: { label: "Feature Request", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200", icon: <TrendingUp className="w-3 h-3" /> },
      CRITICAL_REVIEW: { label: "Critical Review", color: "text-red-700", bgColor: "bg-red-50 border-red-200", icon: <AlertCircle className="w-3 h-3" /> },
      COMPLIMENTS: { label: "Compliments", color: "text-green-700", bgColor: "bg-green-50 border-green-200", icon: <Heart className="w-3 h-3" /> },
      DISSATISFACTION: { label: "Dissatisfaction", color: "text-orange-700", bgColor: "bg-orange-50 border-orange-200", icon: <ThumbsDown className="w-3 h-3" /> },
      COMPETITOR_MENTION: { label: "Competitor", color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200", icon: <AlertCircle className="w-3 h-3" /> },
      PRICING_DISCUSSION: { label: "Pricing", color: "text-yellow-700", bgColor: "bg-yellow-50 border-yellow-200", icon: <DollarSign className="w-3 h-3" /> },
      RENEWAL_SIGNAL: { label: "Renewal", color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200", icon: <FileText className="w-3 h-3" /> },
      ESCALATION_NEEDED: { label: "Escalation", color: "text-pink-700", bgColor: "bg-pink-50 border-pink-200", icon: <AlertCircle className="w-3 h-3" /> },
      INTEGRATION_REQUEST: { label: "Integration", color: "text-indigo-700", bgColor: "bg-indigo-50 border-indigo-200", icon: <TrendingUp className="w-3 h-3" /> },
      SUPPORT_NEEDED: { label: "Support", color: "text-cyan-700", bgColor: "bg-cyan-50 border-cyan-200", icon: <MessageSquare className="w-3 h-3" /> },
    };
    return CATEGORY_CONFIG[category] || { label: category, color: "text-gray-700", bgColor: "bg-gray-50 border-gray-200", icon: <FileText className="w-3 h-3" /> };
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive": return "text-green-700 bg-green-50 border-green-200";
      case "negative": return "text-red-700 bg-red-50 border-red-200";
      case "mixed": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const getHealthStyles = (
    health: string
  ): { bg: string; text: string; border: string } => {
    switch (health) {
      case "Healthy":
        return {
          bg: "bg-light-mint",
          text: "text-dark-forest",
          border: "border-primary-green",
        };
      case "At Risk":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-700",
          border: "border-yellow-300",
        };
      case "Critical":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-300",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-300",
        };
    }
  };

  const handleGenerateStory = () => {
    if (!account) return;

    setGeneratingStory(true);
    // Simulate AI generation with delay
    setTimeout(() => {
      const activeUsers = account.metrics?.active_users || 0;
      const nps = account.metrics?.nps || 0;
      const mockStory = `${
        account.name
      } has shown strong engagement with the platform. The account demonstrates ${account.health_score.toLowerCase()} health status with ${activeUsers} active users and an NPS score of ${nps}. Recent meetings indicate ${
        account.sentiment === "up" ? "positive" : "negative"
      } sentiment and alignment on strategic goals.`;
      setAiStory(mockStory);
      setGeneratingStory(false);
      setShowAIStory(true);
    }, 800);
  };

  const handleFindSimilar = () => {
    router.push(`/account/${accountId}/similar`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-green"></div>
            <p className="mt-4 text-neutral-gray">Loading account details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="mb-6 border-primary-green text-primary-green hover:bg-light-mint"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold text-dark-forest mb-4">
                Error Loading Account
              </h2>
              <p className="text-red-600 mb-2">{error}</p>
              <p className="text-neutral-gray">
                Please check that the backend server is running on
                http://localhost:8000
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!account) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="mb-6 border-primary-green text-primary-green hover:bg-light-mint"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold text-dark-forest mb-4">
                Account Not Found
              </h2>
              <p className="text-neutral-gray">
                The account you&apos;re looking for doesn&apos;t exist.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const healthStyles = getHealthStyles(account.health_score);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => router.push("/dashboard")}
          variant="outline"
          className="mb-6 border-primary-green text-primary-green hover:bg-light-mint cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header Card */}
        <Card className="bg-white shadow-sm rounded-2xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-dark-forest mb-2">
                {account.name}
              </h2>
              <p className="text-sm text-neutral-gray mb-4">
                {account.industry}
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <span className="text-xs text-neutral-gray block">ARR</span>
                  <span className="text-lg font-semibold text-dark-forest">
                    {formatArr(account.arr)}
                  </span>
                </div>
                <Badge
                  className={`${healthStyles.bg} ${healthStyles.text} border-2 ${healthStyles.border} font-medium px-3 py-1`}
                >
                  {account.health_score}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-neutral-gray">Last Updated</span>
              <p className="text-sm font-medium text-dark-forest">
                {formatDate(account.last_updated)}
              </p>
            </div>
          </div>
        </Card>

        {/* AI Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button
            onClick={handleGenerateStory}
            disabled={generatingStory}
            className="bg-[#25834b] hover:bg-[#004F38] text-white rounded-lg px-6 py-3 flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-5 h-5" />
            {generatingStory ? "Generating..." : "Generate Customer Story"}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#25834b] hover:bg-[#004F38] text-white rounded-lg px-6 py-3 flex items-center gap-2 cursor-pointer">
                <CalendarCheck className="w-5 h-5" />
                Prepare for Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-dark-forest">
                  Meeting Preparation - {account.name}
                </DialogTitle>
                <DialogDescription className="text-neutral-gray">
                  AI-powered meeting brief and talking points
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-semibold text-dark-forest mb-2">
                    Key Topics to Discuss:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-neutral-gray">
                    <li>Review renewal timeline and next steps</li>
                    <li>Address open feature requests</li>
                    <li>Discuss usage trends and adoption metrics</li>
                    <li>Explore expansion opportunities</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-dark-forest mb-2">
                    Recent Activity:
                  </h4>
                  {account.meetings && account.meetings.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-neutral-gray">
                      {account.meetings.slice(0, 2).map((meeting) => (
                        <li key={meeting.id}>
                          {formatDate(meeting.date)}: {meeting.summary}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-neutral-gray">No recent meetings</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-dark-forest mb-2">
                    Health Indicators:
                  </h4>
                  <p className="text-neutral-gray">
                    {account.metrics ? (
                      <>
                        NPS: {account.metrics.nps} | Active Users:{" "}
                        {account.metrics.active_users} | Renewal Rate:{" "}
                        {account.metrics.renewal_rate}%
                      </>
                    ) : (
                      "Metrics not available"
                    )}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleFindSimilar}
            className="bg-[#25834b] hover:bg-[#004F38] text-white rounded-lg px-6 py-3 flex items-center gap-2 cursor-pointer"
          >
            <Users className="w-5 h-5" />
            Find Similar Customers
          </Button>
        </div>

        {/* AI Story Output */}
        <AnimatePresence>
          {showAIStory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white shadow-sm rounded-2xl mb-6">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-forest flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-green" />
                    AI-Generated Customer Story
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-gray leading-relaxed">{aiStory}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Section */}
        {account.products && account.products.length > 0 && (
          <Card className="bg-white shadow-sm rounded-2xl mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-forest flex items-center gap-2">
                <Package className="w-6 h-6 text-primary-green" />
                SurveyMonkey Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {account.products.map((product, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border-2 border-primary-green/20 rounded-lg p-4 bg-gradient-to-br from-light-mint/30 to-off-white hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="p-2 rounded-full bg-primary-green/10 shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-primary-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-dark-forest text-sm mb-1">
                          {product.product_name}
                        </h4>
                        <Badge className="bg-primary-green/10 text-primary-green border-primary-green/20 text-xs mb-2">
                          {product.category}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-gray mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-dark-forest mb-1">Primary Use:</p>
                      <p className="text-xs text-neutral-gray line-clamp-2">
                        {product.primary_use}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Metrics */}
          <Card className="bg-white shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-forest">
                Account Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-gray mb-1">
                    Annual Recurring Revenue
                  </p>
                  <p className="text-2xl font-bold text-dark-forest">
                    {formatArr(account.arr)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-gray mb-1">Renewal Date</p>
                  <p className="text-2xl font-bold text-dark-forest">
                    {formatDate(account.renewal_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-gray mb-1">NPS Score</p>
                  <p className="text-2xl font-bold text-dark-forest">
                    {account.metrics?.nps ?? "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-gray mb-1">Usage Trend</p>
                  <div className="flex items-center gap-2">
                    {account.metrics?.usage_trend === "up" ? (
                      <>
                        <ArrowUpRight className="w-6 h-6 text-primary-green" />
                        <span className="text-2xl font-bold text-primary-green">
                          Up
                        </span>
                      </>
                    ) : account.metrics?.usage_trend === "down" ? (
                      <>
                        <ArrowDownRight className="w-6 h-6 text-red-500" />
                        <span className="text-2xl font-bold text-red-500">
                          Down
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-neutral-gray">
                        {account.metrics?.usage_trend ?? "N/A"}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-gray mb-1">Active Users</p>
                  <p className="text-2xl font-bold text-dark-forest">
                    {account.metrics?.active_users ?? "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-gray mb-1">Renewal Rate</p>
                  <p className="text-2xl font-bold text-dark-forest">
                    {account.metrics
                      ? `${account.metrics.renewal_rate}%`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card className="bg-white shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-forest">
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-4">
                {meetingsLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-green"></div>
                    <p className="text-neutral-gray mt-2">Loading meetings...</p>
                  </div>
                ) : !gongMeetings ? (
                  <p className="text-neutral-gray text-center py-4">No meetings data available</p>
                ) : gongMeetings.length === 0 ? (
                  <p className="text-neutral-gray text-center py-4">No meetings recorded</p>
                ) : (
                  gongMeetings.map((meeting) => {
                    // Get categories from insights_categories field (from backend) or extract from ai_insights
                    const insightsCategories = (meeting as any).insights_categories || [];
                    const insights = meeting.ai_insights?.insights || [];
                    const categoriesFromInsights = new Set(insights.map((i: any) => i.category));
                    // Combine both sources
                    const allCategories = new Set([...insightsCategories, ...Array.from(categoriesFromInsights)]);
                    const hasCategories = allCategories.size > 0;

                    return (
                      <motion.div
                        key={meeting.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-l-4 border-primary-green pl-4 pb-4 cursor-pointer hover:bg-light-mint/30 rounded-r-lg transition-all duration-200 p-3 -ml-1"
                        onClick={() => {
                          setSelectedMeeting(meeting);
                          setIsMeetingModalOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {/* Date prominently displayed */}
                            <p className="text-xs font-semibold text-primary-green mb-1">
                              {formatDate(meeting.meeting_date)}
                            </p>
                            <p className="text-sm font-semibold text-dark-forest mb-1">
                              {meeting.meeting_title}
                            </p>
                            <p className="text-xs text-neutral-gray mb-2">
                              {meeting.duration_minutes} min • {meeting.participant_count} participant{meeting.participant_count !== 1 ? 's' : ''} • {meeting.direction}
                            </p>
                            {/* Quick Summary */}
                            {meeting.meeting_summary && (
                              <p className="text-sm text-neutral-gray line-clamp-2 mb-2">
                                {meeting.meeting_summary}
                              </p>
                            )}
                            {/* Categorization Tags */}
                            {hasCategories && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {Array.from(allCategories).slice(0, 5).map((category: string) => {
                                  const config = getCategoryConfig(category);
                                  return (
                                    <Badge
                                      key={category}
                                      className={`${config.bgColor} ${config.color} border text-xs px-2 py-0.5 font-medium flex items-center gap-1`}
                                    >
                                      {config.icon}
                                      {config.label}
                                    </Badge>
                                  );
                                })}
                                {allCategories.size > 5 && (
                                  <Badge className="bg-gray-100 text-gray-600 border text-xs px-2 py-0.5">
                                    +{allCategories.size - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge
                              className={`${getSentimentColor(meeting.overall_sentiment)} text-xs capitalize border`}
                            >
                              {meeting.overall_sentiment}
                            </Badge>
                            {insights.length > 0 && (
                              <Badge className="bg-primary-green text-white text-xs border-2 border-dark-forest">
                                {insights.length} insight{insights.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback & Requests Table */}
        <Card className="bg-white shadow-sm rounded-2xl mt-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-forest">
              Feedback & Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-dark-forest font-semibold">
                    Title
                  </TableHead>
                  <TableHead className="text-dark-forest font-semibold">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {account.feedback && account.feedback.length > 0 ? (
                  account.feedback.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-neutral-gray">
                        {item.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.status === "Open"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-300"
                              : item.status === "In Progress"
                              ? "bg-blue-50 text-blue-700 border border-blue-300"
                              : "bg-light-mint text-dark-forest border border-primary-green"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-neutral-gray"
                    >
                      No feedback recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Meeting Detail Modal */}
        <MeetingDetailModal
          isOpen={isMeetingModalOpen}
          onClose={() => {
            setIsMeetingModalOpen(false);
            setSelectedMeeting(null);
          }}
          meeting={selectedMeeting}
        />
      </div>
    </DashboardLayout>
  );
}
