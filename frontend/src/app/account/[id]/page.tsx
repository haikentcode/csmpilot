"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Users,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ArrowRight,
  Target,
} from "lucide-react";
import {
  useCustomerDetail,
  useGongMeetings,
  useSimilarCustomers,
  useUseCases,
  useUpsellOpportunities,
} from "@/hooks/useApi";
import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import GongMeetingModal from "@/components/GongMeetingModal";
import type { GongMeeting } from "@/services/apiService";
import { capitalizeFirstLetter } from "@/app/dashboard/page";

export default function AccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params?.id ? Number(params.id) : null;

  // State management
  const [activeTab, setActiveTab] = useState<
    "activity" | "tickets" | "analytics" | "similar"
  >("activity");
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [aiStory, setAiStory] = useState("");
  const [generatingStory, setGeneratingStory] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<GongMeeting | null>(
    null
  );
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  // Fetch data from APIs
  const { data: account, loading, error } = useCustomerDetail(accountId);
  const { data: gongMeetingsData, loading: meetingsLoading } =
    useGongMeetings(accountId);
  const { data: similarData, loading: similarLoading } =
    useSimilarCustomers(accountId);
  const { data: useCasesData, loading: useCasesLoading } =
    useUseCases(accountId);
  const { data: upsellData, loading: upsellLoading } = useUpsellOpportunities(
    accountId,
    5
  );

  // Mocked recommended actions
  const recommendedActions = [
    {
      id: 1,
      action:
        "Schedule immediate deep-dive with their engineering team to address API integration issues",
      priority: "high" as const,
    },
    {
      id: 2,
      action:
        "Offer dedicated solution architect for 30-day intensive support period",
      priority: "high" as const,
    },
    {
      id: 3,
      action:
        "Create custom onboarding plan for new features that match their use case",
      priority: "medium" as const,
    },
    {
      id: 4,
      action:
        "Reconnect with champion (Sarah Johnson) with executive-level outreach",
      priority: "medium" as const,
    },
    {
      id: 5,
      action:
        "Present case studies from similar customers who successfully resolved similar challenges",
      priority: "medium" as const,
    },
  ];

  // Format functions
  const formatArr = (arr: number): string => {
    const thousands = Math.round(arr / 1000);
    return `$${thousands}k / yr`;
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getHealthStyles = (
    health: string
  ): { bg: string; text: string; border: string } => {
    switch (health) {
      case "healthy":
        return {
          bg: "bg-light-mint",
          text: "text-dark-forest",
          border: "border-primary-green",
        };
      case "at_risk":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-700",
          border: "border-yellow-300",
        };
      case "critical":
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

  const getHealthText = (health: string): string => {
    switch (health) {
      case "healthy":
        return "Healthy";
      case "at_risk":
        return "At Risk";
      case "critical":
        return "Critical";
      default:
        return "Unknown";
    }
  };

  // Generate AI Customer Story using OpenAI
  const generateCustomerStory = async () => {
    if (!account || generatingStory) return;

    setGeneratingStory(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

      if (!apiKey) {
        console.error("OpenAI API key not found");
        setAiStory("Unable to generate story: API key not configured.");
        setGeneratingStory(false);
        return;
      }

      // Prepare context for OpenAI
      const meetingSummaries =
        gongMeetingsData
          ?.slice(0, 3)
          .map(
            (m) => `${m.meeting_title} (${m.overall_sentiment || "neutral"})`
          )
          .join(", ") || "No recent meetings";

      const context = `
Customer: ${account.name}
Industry: ${capitalizeFirstLetter(account.industry)}
ARR: $${account.arr}
Health Score: ${account.health_score}
NPS: ${account.metrics?.nps || "N/A"}
Active Users: ${account.metrics?.active_users || "N/A"}
Usage Trend: ${account.metrics?.usage_trend || "N/A"}
Renewal Date: ${formatDate(account.renewal_date)}
Recent Meetings: ${meetingSummaries}
`;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a Customer Success Manager assistant. Generate a concise, professional customer story (2-3 paragraphs) that summarizes the customer's journey, current status, engagement trends, and any risk factors or opportunities. Focus on actionable insights.",
              },
              {
                role: "user",
                content: `Generate a customer story based on this data:\n${context}`,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const story =
        data.choices[0]?.message?.content || "Unable to generate story.";
      setAiStory(story);
    } catch (error) {
      console.error("Error generating story:", error);
      setAiStory(
        "Unable to generate customer story at this time. Please try again later."
      );
    } finally {
      setGeneratingStory(false);
    }
  };

  // Auto-generate story on load
  useEffect(() => {
    if (account && !aiStory && !generatingStory) {
      generateCustomerStory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  // Open ChatDock with pre-filled message
  const handleAskPiper = (similarCustomerName: string) => {
    const message = `Tell me more about ${similarCustomerName} and how their success story applies to ${account?.name}`;
    // Trigger ChatDock to open with this message
    window.dispatchEvent(
      new CustomEvent("openChatDock", { detail: { message } })
    );
  };

  // Loading state
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

  // Error state
  if (error || !account) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
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
                {error ? "Error Loading Account" : "Account Not Found"}
              </h2>
              <p className="text-neutral-gray">
                {error || "The account you're looking for doesn't exist."}
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Button
          onClick={() => router.push("/dashboard")}
          variant="ghost"
          className="mb-6 text-gray-600 hover:text-dark-forest"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header Section */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-dark-forest">
                {account.name}
              </h1>
              <Badge
                className={`${healthStyles.bg} ${healthStyles.text} border-2 ${healthStyles.border} font-semibold px-3 py-1 text-sm`}
              >
                {getHealthText(account.health_score)}
              </Badge>
            </div>
            <p className="text-lg text-gray-600">{capitalizeFirstLetter(account.industry)}</p>
          </div>
          <Button className="bg-primary-green hover:bg-[#004F38] text-white px-6 py-3 rounded-lg font-semibold">
            <Sparkles className="w-5 h-5 mr-2" />
            Prepare for Meeting
          </Button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <MetricCard
            icon={DollarSign}
            label="ARR"
            value={formatArr(account.arr)}
            iconColor="text-green-600"
            iconBgColor="bg-green-50"
          />
          <MetricCard
            icon={TrendingUp}
            label="Health Score"
            value={account.metrics?.nps || account.id}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
          />
          <MetricCard
            icon={MessageSquare}
            label="NPS Score"
            value={account.metrics?.nps || account.id}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-50"
          />
          <MetricCard
            icon={Users}
            label="Active Users"
            value={account.metrics?.active_users || 20}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-50"
          />
          <MetricCard
            icon={Calendar}
            label="Renewal"
            value={formatDate(account.renewal_date)}
            iconColor="text-red-600"
            iconBgColor="bg-red-50"
          />
        </div>

        {/* AI-Generated Customer Story */}
        <Card className="bg-[#e8f7f1] border-none shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-primary-green/10 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary-green flex-shrink-0" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-dark-forest mb-1">
                  AI-Generated Customer Story
                </h3>
                <p className="text-sm text-gray-700">
                  Automatically compiled from interaction history, feedback, and
                  support data
                </p>
              </div>
            </div>

            {generatingStory ? (
              <div className="flex items-center gap-3 py-6 justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-green/30 border-t-primary-green"></div>
                <p className="text-gray-700 font-medium">
                  Generating customer story...
                </p>
              </div>
            ) : (
              <>
                <div
                  className={`text-gray-800 leading-relaxed text-[15px] ${
                    !storyExpanded ? "line-clamp-3" : ""
                  }`}
                  style={{
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {aiStory
                    .split("\n\n")
                    .filter((p) => p.trim())
                    .map((paragraph, idx) => {
                      // Remove markdown bold syntax (** or __)
                      const cleanParagraph = paragraph
                        .replace(/\*\*(.*?)\*\*/g, "$1")
                        .replace(/__(.*?)__/g, "$1")
                        .trim();

                      return (
                        <p key={idx} className="mb-4 last:mb-0 text-justify">
                          {cleanParagraph}
                        </p>
                      );
                    })}
                </div>
                <button
                  onClick={() => setStoryExpanded(!storyExpanded)}
                  className="mt-4 text-primary-green font-semibold flex items-center gap-1 hover:underline transition-all"
                >
                  {storyExpanded ? (
                    <>
                      View Less <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      View More <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tabbed Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("activity")}
                className={`pb-3 px-1 font-semibold transition-colors relative ${
                  activeTab === "activity"
                    ? "text-primary-green"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Recent Activity
                {activeTab === "activity" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-green"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`pb-3 px-1 font-semibold transition-colors relative ${
                  activeTab === "tickets"
                    ? "text-primary-green"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Support Tickets
                {activeTab === "tickets" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-green"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`pb-3 px-1 font-semibold transition-colors relative ${
                  activeTab === "analytics"
                    ? "text-primary-green"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Usage Analytics
                {activeTab === "analytics" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-green"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("similar")}
                className={`pb-3 px-1 font-semibold transition-colors relative ${
                  activeTab === "similar"
                    ? "text-primary-green"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Similar Customers
                {activeTab === "similar" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-green"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-dark-forest mb-4">
                    Recent Meetings
                  </h3>
                  <div className="space-y-4">
                    {meetingsLoading ? (
                      <p className="text-gray-500">Loading meetings...</p>
                    ) : gongMeetingsData && gongMeetingsData.length > 0 ? (
                      gongMeetingsData.slice(0, 5).map((meeting) => (
                        <div
                          key={meeting.id}
                          onClick={() => {
                            setSelectedMeeting(meeting);
                            setShowMeetingModal(true);
                          }}
                          className="border-l-4 border-primary-green pl-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors rounded-r-lg"
                        >
                          <p className="font-semibold text-dark-forest">
                            {meeting.meeting_title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(meeting.meeting_date)}
                          </p>
                          {meeting.ai_processed && (
                            <div className="flex items-center gap-2 mt-2">
                              {meeting.overall_sentiment && (
                                <Badge
                                  className={`text-xs ${
                                    meeting.overall_sentiment === "positive"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : meeting.overall_sentiment === "negative"
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-gray-50 text-gray-700 border-gray-200"
                                  }`}
                                >
                                  {meeting.overall_sentiment}
                                </Badge>
                              )}
                              {meeting.has_insights && (
                                <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {meeting.insights_count || 0} insights
                                </Badge>
                              )}
                            </div>
                          )}
                          {meeting.key_topics &&
                            meeting.key_topics.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {meeting.key_topics
                                  .slice(0, 3)
                                  .map((topic, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-light-mint text-dark-forest px-2 py-0.5 rounded"
                                    >
                                      {topic}
                                    </span>
                                  ))}
                              </div>
                            )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No meetings recorded</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "tickets" && (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-white shadow-sm">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500 text-lg">Coming Soon</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Support ticket integration will be available soon
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-white shadow-sm">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500 text-lg">Coming Soon</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Usage analytics dashboard will be available soon
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "similar" && (
            <motion.div
              key="similar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-dark-forest">
                    Similar Customers with Successful Outcomes
                  </h3>
                  <Button
                    onClick={() => handleAskPiper("similar customers")}
                    className="bg-primary-green hover:bg-[#004F38] text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Ask Piper
                  </Button>
                </div>
                <p className="text-gray-600 mb-6">
                  Learn from accounts with similar profiles that improved their
                  health scores
                </p>

                {similarLoading ? (
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-12 text-center">
                      <p className="text-gray-500">
                        Loading similar customers...
                      </p>
                    </CardContent>
                  </Card>
                ) : similarData &&
                  similarData.similar_customers &&
                  similarData.similar_customers.length > 0 ? (
                  <div className="space-y-4">
                    {similarData.similar_customers
                      .slice(0, 3)
                      .map((customer) => (
                        <Card
                          key={customer.customer_id}
                          className="bg-white shadow-sm"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-dark-forest">
                                  {customer.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {customer.industry}
                                </p>
                              </div>
                              <Badge className="bg-green-50 text-green-700 border-green-200 font-semibold">
                                {Math.round(
                                  (customer.similarity_score || 0) * 100
                                )}
                                % match
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                  Action Taken:
                                </p>
                                <p className="text-sm text-gray-600">
                                  Scheduled dedicated onboarding for API
                                  integration
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                  Result:
                                </p>
                                <p className="text-sm text-primary-green font-medium">
                                  Health score improved from 48 to 82 in 60 days
                                </p>
                              </div>
                            </div>

                            <Button
                              onClick={() => handleAskPiper(customer.name)}
                              variant="outline"
                              className="mt-4 w-full border-primary-green text-primary-green hover:bg-light-mint"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Ask Piper about {customer.name}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-12 text-center">
                      <p className="text-gray-500">
                        No similar customers found
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Relevant Use Cases Section */}
        <div className="mt-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Lightbulb className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-dark-forest">
                      Relevant Use Cases
                    </h3>
                    <p className="text-sm text-gray-600">
                      Based on Real Industry analysis from SurveyMonkey product
                      suite
                    </p>
                  </div>
                </div>
                {useCasesData && (
                  <Badge className="bg-[#e8f7f1] text-primary-green border-primary-green/30">
                    {useCasesData.total_use_cases} Apps
                  </Badge>
                )}
              </div>

              {useCasesLoading ? (
                <p className="text-gray-500">Loading use cases...</p>
              ) : useCasesData && useCasesData.use_cases.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {useCasesData.use_cases.map((useCase, index) => (
                    <div
                      key={index}
                      className="bg-[#e8f7f1] border border-primary-green/20 rounded-lg p-5"
                    >
                      <h4 className="font-bold text-dark-forest mb-2">
                        {useCase.product_name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {useCase.product_category}
                      </p>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {useCase.use_case}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-white text-dark-forest border border-gray-300">
                          {useCase.product_name}
                        </Badge>
                        <button className="text-primary-green font-semibold text-sm hover:underline flex items-center gap-1">
                          Learn More <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No use cases available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Product Upsell Opportunities Section */}
        <div className="mt-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-primary-green" />
                  </div>
                  <h3 className="text-xl font-bold text-dark-forest">
                    Product Upsell Opportunities
                  </h3>
                </div>
                <Button className="bg-primary-green text-white hover:bg-dark-forest">
                  Export Product Roadmap
                </Button>
              </div>

              {upsellLoading ? (
                <p className="text-gray-500">Loading opportunities...</p>
              ) : upsellData && upsellData.opportunities.length > 0 ? (
                <>
                  {/* Main Opportunities */}
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    {upsellData.opportunities.map((opp, index) => (
                      <div
                        key={index}
                        className="bg-[#e8f7f1] border-1 border-primary-green rounded-lg p-5"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-dark-forest mb-1">
                              {opp.product_name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {opp.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary-green text-white">
                              $
                              {Math.round(
                                (parseFloat(upsellData.arr) * 0.01) / 1000
                              )}
                              k/year
                            </Badge>
                            <Badge className="bg-red-500 text-white">New</Badge>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4">{opp.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-white text-dark-forest border border-gray-300">
                            {opp.category}
                          </Badge>
                          <button className="text-primary-green font-semibold text-sm hover:underline flex items-center gap-1">
                            Learn More <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">
                  No upsell opportunities available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommended Next Actions Section */}
        <div className="mt-8 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-dark-forest">
                    Recommended Next Actions
                  </h3>
                  <p className="text-sm text-gray-600">
                    AI-suggested steps based on similar successful customer
                    journeys
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {recommendedActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {action.id}
                    </div>
                    <p className="text-gray-700 leading-relaxed flex-1">
                      {action.action}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gong Meeting Detail Modal */}
      <GongMeetingModal
        meeting={selectedMeeting}
        isOpen={showMeetingModal}
        onClose={() => {
          setShowMeetingModal(false);
          setSelectedMeeting(null);
        }}
      />
    </DashboardLayout>
  );
}
