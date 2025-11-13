"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useCustomerDetail, useGongMeetings } from "@/hooks/useApi";
import DashboardLayout from "@/components/DashboardLayout";
import MeetingDetailModal from "@/components/MeetingDetailModal";
import type { GongMeeting } from "@/services/apiService";

export default function AccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params?.id ? Number(params.id) : null;
  const [showAIStory, setShowAIStory] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);
  const [aiStory, setAiStory] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<GongMeeting | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  // Fetch account details from API
  const { data: account, loading, error } = useCustomerDetail(accountId);
  
  // Fetch Gong meetings for this customer
  const { data: gongMeetingsData, loading: meetingsLoading } = useGongMeetings(accountId);

  const formatArr = (arr: number): string => {
    return `$${arr.toLocaleString()} / yr`;
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

          {/* Activity Timeline - Gong Meetings */}
          <Card className="bg-white shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-forest">
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {meetingsLoading ? (
                  <p className="text-neutral-gray">Loading meetings...</p>
                ) : gongMeetingsData && gongMeetingsData.length > 0 ? (
                  gongMeetingsData.map((meeting) => (
                    <div
                      key={meeting.id}
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setShowMeetingModal(true);
                      }}
                      className="border-l-4 border-primary-green pl-4 pb-3 cursor-pointer hover:bg-light-mint/30 rounded-r-lg transition-colors p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-dark-forest">
                            {meeting.meeting_title}
                          </p>
                          <p className="text-xs text-neutral-gray mt-1">
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
                          {meeting.key_topics && meeting.key_topics.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {meeting.key_topics.slice(0, 3).map((topic, idx) => (
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
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-gray">No meetings recorded</p>
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
      </div>

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          isOpen={showMeetingModal}
          onClose={() => {
            setShowMeetingModal(false);
            setSelectedMeeting(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
