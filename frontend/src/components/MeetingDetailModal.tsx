"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Heart,
  ThumbsDown,
  DollarSign,
  FileText,
  Sparkles,
  X,
} from "lucide-react";
import { GongMeeting } from "@/services/apiService";

interface MeetingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: GongMeeting | null;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  FEATURE_REQUEST: {
    label: "Feature Request",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  CRITICAL_REVIEW: {
    label: "Critical Review",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  COMPLIMENTS: {
    label: "Compliments",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
    icon: <Heart className="w-4 h-4" />,
  },
  DISSATISFACTION: {
    label: "Dissatisfaction",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
    icon: <ThumbsDown className="w-4 h-4" />,
  },
  COMPETITOR_MENTION: {
    label: "Competitor Mention",
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  PRICING_DISCUSSION: {
    label: "Pricing Discussion",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50 border-yellow-200",
    icon: <DollarSign className="w-4 h-4" />,
  },
  RENEWAL_SIGNAL: {
    label: "Renewal Signal",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    icon: <FileText className="w-4 h-4" />,
  },
  ESCALATION_NEEDED: {
    label: "Escalation Needed",
    color: "text-pink-700",
    bgColor: "bg-pink-50 border-pink-200",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  INTEGRATION_REQUEST: {
    label: "Integration Request",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50 border-indigo-200",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  SUPPORT_NEEDED: {
    label: "Support Needed",
    color: "text-cyan-700",
    bgColor: "bg-cyan-50 border-cyan-200",
    icon: <MessageSquare className="w-4 h-4" />,
  },
};

const getCategoryConfig = (category: string) => {
  return (
    CATEGORY_CONFIG[category] || {
      label: category,
      color: "text-gray-700",
      bgColor: "bg-gray-50 border-gray-200",
      icon: <FileText className="w-4 h-4" />,
    }
  );
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment.toLowerCase()) {
    case "positive":
      return "text-green-700 bg-green-50 border-green-200";
    case "negative":
      return "text-red-700 bg-red-50 border-red-200";
    case "mixed":
      return "text-yellow-700 bg-yellow-50 border-yellow-200";
    default:
      return "text-gray-700 bg-gray-50 border-gray-200";
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

export default function MeetingDetailModal({
  isOpen,
  onClose,
  meeting,
}: MeetingDetailModalProps) {
  if (!meeting) return null;

  const insights = meeting.ai_insights?.insights || [];
  const insightsCategories = meeting.insights_categories || [];
  const categoriesFromInsights = new Set(insights.map((i) => i.category));
  // Combine categories from both sources
  const allCategories = new Set([
    ...insightsCategories,
    ...Array.from(categoriesFromInsights),
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-dark-forest flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary-green" />
            {meeting.meeting_title}
          </DialogTitle>
          <DialogDescription className="text-neutral-gray">
            Meeting details and AI-generated insights
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Meeting Metadata */}
          <Card className="bg-gradient-to-r from-light-mint to-off-white">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-green" />
                  <div>
                    <p className="text-xs text-neutral-gray">Date</p>
                    <p className="text-sm font-semibold text-dark-forest">
                      {formatDate(meeting.meeting_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-green" />
                  <div>
                    <p className="text-xs text-neutral-gray">Duration</p>
                    <p className="text-sm font-semibold text-dark-forest">
                      {formatDuration(meeting.duration_minutes)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-green" />
                  <div>
                    <p className="text-xs text-neutral-gray">Participants</p>
                    <p className="text-sm font-semibold text-dark-forest">
                      {meeting.participant_count}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-green" />
                  <div>
                    <p className="text-xs text-neutral-gray">Direction</p>
                    <Badge
                      variant="outline"
                      className="text-xs capitalize border-primary-green text-primary-green"
                    >
                      {meeting.direction}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sentiment & AI Status & Categories */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 items-center">
              <Badge
                className={`${getSentimentColor(
                  meeting.overall_sentiment
                )} border-2 px-3 py-1 font-semibold capitalize`}
              >
                {meeting.overall_sentiment} Sentiment
              </Badge>
              {meeting.ai_processed && (
                <Badge className="bg-primary-green text-white border-2 border-dark-forest px-3 py-1 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Processed
                </Badge>
              )}
              {meeting.deal_name && (
                <Badge className="bg-blue-50 text-blue-700 border-2 border-blue-200 px-3 py-1 font-semibold">
                  Deal: {meeting.deal_name}
                </Badge>
              )}
            </div>
            {/* Categorization Tags */}
            {allCategories.size > 0 && (
              <div>
                <p className="text-sm font-semibold text-dark-forest mb-2">
                  Categories:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(allCategories).map((category) => {
                    const config = getCategoryConfig(category);
                    return (
                      <Badge
                        key={category}
                        className={`${config.bgColor} ${config.color} border-2 px-3 py-1 font-medium flex items-center gap-1.5`}
                      >
                        {config.icon}
                        {config.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI Insights Categories */}
          {insights.length > 0 && (
            <Card className="border-l-4 border-l-primary-green">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-dark-forest flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-green" />
                  AI Insights ({insights.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(categoriesFromInsights).map((category) => {
                    const config = getCategoryConfig(category);
                    const categoryInsights = insights.filter(
                      (i) => i.category === category
                    );
                    return (
                      <div
                        key={category}
                        className={`${config.bgColor} border-2 rounded-lg p-4`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={config.color}>{config.icon}</span>
                          <h4 className={`font-semibold ${config.color}`}>
                            {config.label}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`${config.color} border-current ml-auto`}
                          >
                            {categoryInsights.length} insight
                            {categoryInsights.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <ul className="space-y-2 ml-6">
                          {categoryInsights.map((insight, idx) => {
                            const sentences = insight.sentences || [];
                            const insightText =
                              sentences.length > 0
                                ? sentences.join(" ")
                                : JSON.stringify(insight);

                            return (
                              <li
                                key={idx}
                                className="text-sm text-gray-700 list-disc"
                              >
                                {insightText}
                                {insight.confidence && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({Math.round(insight.confidence * 100)}%
                                    confidence)
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Topics */}
          {meeting.key_topics && meeting.key_topics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-dark-forest">
                  Key Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {meeting.key_topics.map((topic, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="border-primary-green text-primary-green"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Participants */}
          {meeting.participants && meeting.participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-dark-forest flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-green" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {meeting.participants.map((participant, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-dark-forest">
                          {participant.name || "Unknown"}
                        </p>
                        {participant.title && (
                          <p className="text-sm text-neutral-gray">
                            {participant.title}
                            {participant.role && ` • ${participant.role}`}
                          </p>
                        )}
                        {participant.email && (
                          <p className="text-xs text-neutral-gray">
                            {participant.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meeting Summary */}
          {meeting.meeting_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-dark-forest">
                  Meeting Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-gray leading-relaxed">
                  {meeting.meeting_summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Meeting Transcript */}
          {meeting.meeting_transcript && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-dark-forest">
                  Full Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-gray whitespace-pre-wrap">
                    {meeting.meeting_transcript}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw Meeting Data */}
          {meeting.raw_meeting_data ? (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-dark-forest flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Raw Meeting Data (from Gong API)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <pre className="text-xs text-neutral-gray whitespace-pre-wrap font-mono">
                    {typeof meeting.raw_meeting_data === "object"
                      ? JSON.stringify(meeting.raw_meeting_data, null, 2)
                      : String(meeting.raw_meeting_data)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-l-4 border-l-gray-300 bg-gray-50">
              <CardContent className="p-4">
                <p className="text-sm text-neutral-gray italic">
                  Raw meeting data not available. This may require fetching the
                  full meeting detail.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
