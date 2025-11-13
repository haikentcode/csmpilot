"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  TrendingUp,
  FileText,
  AlertCircle,
  DollarSign,
  ThumbsDown,
  MessageSquare,
  Heart,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Mail,
  Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GongMeeting } from "@/services/apiService";

interface GongMeetingModalProps {
  meeting: GongMeeting | null;
  isOpen: boolean;
  onClose: () => void;
}

// Category configuration with styling
const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
  }
> = {
  FEATURE_REQUEST: {
    label: "Feature Request",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  RENEWAL_SIGNAL: {
    label: "Renewal Signal",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    icon: <FileText className="w-4 h-4" />,
  },
  COMPETITOR_MENTION: {
    label: "Competitor Mention",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  PRICING_DISCUSSION: {
    label: "Pricing Discussion",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: <DollarSign className="w-4 h-4" />,
  },
  DISSATISFACTION: {
    label: "Dissatisfaction",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: <ThumbsDown className="w-4 h-4" />,
  },
  SUPPORT_NEEDED: {
    label: "Support Needed",
    color: "text-cyan-700",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    icon: <MessageSquare className="w-4 h-4" />,
  },
  CRITICAL_REVIEW: {
    label: "Critical Review",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  COMPLIMENTS: {
    label: "Compliments",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: <Heart className="w-4 h-4" />,
  },
  ESCALATION_NEEDED: {
    label: "Escalation Needed",
    color: "text-pink-700",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  INTEGRATION_REQUEST: {
    label: "Integration Request",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    icon: <TrendingUp className="w-4 h-4" />,
  },
};

export default function GongMeetingModal({
  meeting,
  isOpen,
  onClose,
}: GongMeetingModalProps) {
  const [activeTab, setActiveTab] = useState<
    "summary" | "insights" | "transcript"
  >("summary");
  const [expandedInsights, setExpandedInsights] = useState<Set<number>>(
    new Set()
  );

  if (!meeting) return null;

  // Helper functions
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatConfidence = (score: number): number => {
    return Math.round(score * 100);
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryConfig = (category: string) => {
    return (
      CATEGORY_CONFIG[category] || {
        label: category,
        color: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        icon: <FileText className="w-4 h-4" />,
      }
    );
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-50 text-green-700 border-green-200";
      case "negative":
        return "bg-red-50 text-red-700 border-red-200";
      case "neutral":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const toggleInsightExpansion = (index: number) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedInsights(newExpanded);
  };

  const formatTranscript = (transcript: string) => {
    const lines = transcript.split("\n");
    return lines.map((line, index) => {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        return (
          <div key={index} className="mb-3">
            <span className="font-semibold text-primary-green">
              {match[1]}:
            </span>
            <span className="text-gray-700 ml-2">{match[2]}</span>
          </div>
        );
      }
      return (
        <div key={index} className="text-gray-700 mb-2">
          {line}
        </div>
      );
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-full overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-primary-green text-white p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">
                      {meeting.meeting_title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(meeting.meeting_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(meeting.duration_seconds)}</span>
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30">
                        {meeting.direction}
                      </Badge>
                      <Badge
                        className={`border ${getSentimentBadge(
                          meeting.overall_sentiment
                        )}`}
                      >
                        {meeting.overall_sentiment}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="text-white hover:bg-white/20 rounded-full p-2"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs opacity-90">Participants</span>
                    </div>
                    <p className="text-xl font-bold">
                      {meeting.participant_count}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs opacity-90">Insights</span>
                    </div>
                    <p className="text-xl font-bold">
                      {meeting.insights_count || 0}
                    </p>
                  </div>
                  {meeting.deal_value && (
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs opacity-90">Deal Value</span>
                      </div>
                      <p className="text-xl font-bold">
                        ${parseFloat(meeting.deal_value).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {meeting.deal_stage && (
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4" />
                        <span className="text-xs opacity-90">Stage</span>
                      </div>
                      <p className="text-sm font-semibold">
                        {meeting.deal_stage}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 px-6">
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveTab("summary")}
                    className={`py-3 px-1 font-semibold transition-colors relative ${
                      activeTab === "summary"
                        ? "text-primary-green"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Summary
                    {activeTab === "summary" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-green"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("insights")}
                    className={`py-3 px-1 font-semibold transition-colors relative ${
                      activeTab === "insights"
                        ? "text-primary-green"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    AI Insights ({meeting.insights_count || 0})
                    {activeTab === "insights" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-green"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("transcript")}
                    className={`py-3 px-1 font-semibold transition-colors relative ${
                      activeTab === "transcript"
                        ? "text-primary-green"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Transcript
                    {activeTab === "transcript" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-green"></div>
                    )}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {activeTab === "summary" && (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Participants */}
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-dark-forest mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary-green" />
                          Participants
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {meeting.participants.map((participant, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-2 ${
                                participant.role === "Customer"
                                  ? "bg-blue-50 border-blue-200"
                                  : "bg-green-50 border-green-200"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-dark-forest">
                                    {participant.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {participant.title}
                                  </p>
                                  {participant.email && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                      <Mail className="w-3 h-3" />
                                      <span>{participant.email}</span>
                                    </div>
                                  )}
                                </div>
                                <Badge
                                  className={
                                    participant.role === "Customer"
                                      ? "bg-blue-100 text-blue-700 border-blue-300"
                                      : "bg-green-100 text-green-700 border-green-300"
                                  }
                                >
                                  {participant.role}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Meeting Summary */}
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-dark-forest mb-3 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary-green" />
                          Meeting Summary
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-gray-700 leading-relaxed">
                            {meeting.meeting_summary}
                          </p>
                        </div>
                      </div>

                      {/* Key Topics */}
                      {meeting.key_topics && meeting.key_topics.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-dark-forest mb-3">
                            Key Topics
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {meeting.key_topics.map((topic, index) => (
                              <Badge
                                key={index}
                                className="bg-primary-green/10 text-primary-green border-primary-green/30 px-3 py-1"
                              >
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "insights" && (
                    <motion.div
                      key="insights"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {meeting.ai_insights?.insights &&
                      meeting.ai_insights.insights.length > 0 ? (
                        <div className="space-y-4">
                          {meeting.ai_insights.insights.map(
                            (insight, index) => {
                              const config = getCategoryConfig(
                                insight.category
                              );
                              const isExpanded = expandedInsights.has(index);

                              return (
                                <div
                                  key={index}
                                  className={`border-2 rounded-lg p-4 ${config.borderColor} ${config.bgColor}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`${config.color} mt-1`}>
                                      {config.icon}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge
                                          className={`${config.bgColor} ${config.color} ${config.borderColor} border`}
                                        >
                                          {config.label}
                                        </Badge>
                                        {insight.timestamp && (
                                          <span className="text-xs text-gray-500">
                                            {insight.timestamp}
                                          </span>
                                        )}
                                      </div>
                                      <p
                                        className={`font-medium ${config.color} mb-2`}
                                      >
                                        {insight.sentence}
                                      </p>

                                      {/* Confidence Bar */}
                                      <div className="mb-2">
                                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                          <span>Confidence</span>
                                          <span className="font-semibold">
                                            {formatConfidence(
                                              insight.confidence
                                            )}
                                            %
                                          </span>
                                        </div>
                                        <div className="h-2 bg-white rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-gradient-to-r from-yellow-400 to-green-500 transition-all duration-300"
                                            style={{
                                              width: `${formatConfidence(
                                                insight.confidence
                                              )}%`,
                                            }}
                                          ></div>
                                        </div>
                                      </div>

                                      {/* Context (Expandable) */}
                                      {insight.context && (
                                        <div>
                                          <button
                                            onClick={() =>
                                              toggleInsightExpansion(index)
                                            }
                                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                          >
                                            {isExpanded ? (
                                              <>
                                                <ChevronUp className="w-4 h-4" />
                                                Hide context
                                              </>
                                            ) : (
                                              <>
                                                <ChevronDown className="w-4 h-4" />
                                                Show context
                                              </>
                                            )}
                                          </button>
                                          {isExpanded && (
                                            <motion.div
                                              initial={{
                                                opacity: 0,
                                                height: 0,
                                              }}
                                              animate={{
                                                opacity: 1,
                                                height: "auto",
                                              }}
                                              exit={{ opacity: 0, height: 0 }}
                                              className="mt-2 p-3 bg-white rounded-lg text-sm text-gray-600"
                                            >
                                              {insight.context}
                                            </motion.div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No AI insights available for this meeting</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "transcript" && (
                    <motion.div
                      key="transcript"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {meeting.meeting_transcript ? (
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <div className="prose max-w-none">
                            {formatTranscript(meeting.meeting_transcript)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No transcript available for this meeting</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
