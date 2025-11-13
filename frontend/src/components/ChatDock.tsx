"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  X,
  Loader2,
  Sparkles,
  Activity,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ragService } from "@/services/ragService";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const RAG_SYSTEM_PROMPT = `You are Piper, an AI-powered Customer Success Assistant with access to real customer data.

Your capabilities:
- Answer questions about specific customers using the provided context
- Analyze customer health, meetings, and engagement
- Suggest upsell opportunities based on actual data
- Compare customers and identify similar accounts
- Provide meeting summaries and insights
- Recommend actions based on customer patterns

Guidelines:
- ALWAYS use the provided customer context data to answer questions
- If data is not in the context, say "I don't have that information in the current context"
- Be specific and cite actual data points (health scores, ARR, meeting dates, sentiment)
- Keep responses concise (under 200 words)
- Format numbers and dates clearly
- Suggest follow-up actions when relevant
- If asked about topics unrelated to the provided customer data, politely redirect

Context Format:
You will receive customer data in structured format including:
- Customer details (name, industry, ARR, health score, active users, NPS)
- Recent meetings with AI insights and sentiment
- Upsell opportunities with reasons
- Similar customers with similarity scores
- Use cases for products

Use this data to provide accurate, data-driven responses.`;

export default function ChatDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    OpenAIMessage[]
  >([]);
  const [contextCustomerId, setContextCustomerId] = useState<number | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-detect customer context from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const match = path.match(/\/account\/(\d+)/);
      if (match) {
        setContextCustomerId(parseInt(match[1]));
      }
    }
  }, []);

  // Listen for custom event to open ChatDock with pre-filled message
  useEffect(() => {
    const handleOpenChatDock = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string }>;
      const { message } = customEvent.detail;
      if (message) {
        setIsOpen(true);
        setInputValue(message);
        // Auto-focus on input after a short delay
        setTimeout(() => {
          const inputElement =
            document.querySelector<HTMLInputElement>("#chat-input");
          if (inputElement) {
            inputElement.focus();
          }
        }, 100);
      }
    };

    window.addEventListener("openChatDock", handleOpenChatDock);
    return () => {
      window.removeEventListener("openChatDock", handleOpenChatDock);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageText = inputValue;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Check if API key exists
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error(
          "OpenAI API key is not configured. Please add NEXT_PUBLIC_OPENAI_API_KEY to your .env.local file."
        );
      }

      // Step 1: Fetch RAG context from backend
      const ragResponse = await ragService.getChatContext({
        query: messageText,
        customer_id: contextCustomerId,
        conversation_history: conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      // Step 2: Build context prompt
      const contextPrompt = ragService.buildContextPrompt(
        ragResponse.context,
        messageText
      );

      // Step 3: Build messages array for OpenAI with RAG context
      const messages: OpenAIMessage[] = [
        { role: "system", content: RAG_SYSTEM_PROMPT },
        ...conversationHistory,
        { role: "user", content: contextPrompt },
      ];

      // Step 4: Call OpenAI API with enriched context
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Invalid OpenAI API key. Please check your NEXT_PUBLIC_OPENAI_API_KEY."
          );
        } else if (response.status === 429) {
          throw new Error(
            "Rate limit reached. Please wait a moment and try again."
          );
        } else {
          throw new Error(
            `OpenAI API error: ${response.status} ${response.statusText}`
          );
        }
      }

      const data = await response.json();
      const aiResponse =
        data.choices[0]?.message?.content ||
        "I couldn't generate a response. Please try again.";

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Update conversation history (store original user query, not the context-enriched version)
      setConversationHistory([
        ...conversationHistory,
        { role: "user", content: messageText },
        { role: "assistant", content: aiResponse },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:
          error instanceof Error
            ? error.message
            : "I'm having trouble connecting right now. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (query: string) => {
    setInputValue(query);
    // Auto-send after a brief delay
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed right-4 bottom-4 z-50 h-[600px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary-green p-4 rounded-t-xl flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-lg">Piper AI</h3>
                <p className="text-white text-xs opacity-90">
                  {contextCustomerId
                    ? "Customer Context Active"
                    : "Your CSM Assistant"}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Indicator */}
            {contextCustomerId && (
              <div className="bg-light-mint border-b border-primary-green/20 px-4 py-2">
                <p className="text-xs text-dark-forest flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>
                    Viewing customer #{contextCustomerId} - Ask me anything
                    about this account
                  </span>
                </p>
              </div>
            )}

            {/* Chat Messages Area */}
            <div className="flex-1 p-4 bg-off-white overflow-y-auto">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-neutral-gray text-sm py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="mb-4">
                      {contextCustomerId
                        ? "Ask me about this customer"
                        : "Ask me anything about Customer Success"}
                    </p>

                    {/* Quick Action Buttons */}
                    {contextCustomerId && (
                      <div className="flex flex-col gap-2 mt-4">
                        <button
                          onClick={() =>
                            handleQuickAction(
                              "What is this customer's health score?"
                            )
                          }
                          className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-light-mint border border-gray-200 rounded-lg text-xs text-dark-forest transition-colors"
                        >
                          <Activity className="w-4 h-4 text-primary-green" />
                          <span>Check health score</span>
                        </button>
                        <button
                          onClick={() =>
                            handleQuickAction(
                              "Show me recent meetings and key insights"
                            )
                          }
                          className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-light-mint border border-gray-200 rounded-lg text-xs text-dark-forest transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-primary-green" />
                          <span>Recent meetings</span>
                        </button>
                        <button
                          onClick={() =>
                            handleQuickAction(
                              "What upsell opportunities exist?"
                            )
                          }
                          className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-light-mint border border-gray-200 rounded-lg text-xs text-dark-forest transition-colors"
                        >
                          <TrendingUp className="w-4 h-4 text-primary-green" />
                          <span>Upsell opportunities</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === "user"
                          ? "bg-white border-2 border-primary-green text-dark-forest"
                          : "bg-light-mint text-dark-forest"
                      }`}
                    >
                      <div className="text-sm space-y-2">
                        {message.sender === "ai" ? (
                          // Format AI messages with markdown-like styling
                          message.text.split('\n').map((line, idx) => {
                            // Handle bullet points
                            if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                              return (
                                <div key={idx} className="flex gap-2 ml-2">
                                  <span className="text-primary-green font-bold">•</span>
                                  <span className="flex-1">{line.replace(/^[-•]\s*/, '')}</span>
                                </div>
                              );
                            }
                            // Handle numbered lists
                            const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
                            if (numberedMatch) {
                              return (
                                <div key={idx} className="flex gap-2 ml-2">
                                  <span className="text-primary-green font-bold">{numberedMatch[1]}.</span>
                                  <span className="flex-1">{numberedMatch[2]}</span>
                                </div>
                              );
                            }
                            // Handle bold text with **text**
                            const boldFormatted = line.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={i} className="font-semibold text-dark-forest">{part.slice(2, -2)}</strong>;
                              }
                              return part;
                            });
                            // Regular line
                            if (line.trim()) {
                              return <p key={idx} className="leading-relaxed">{boldFormatted}</p>;
                            }
                            // Empty line for spacing
                            return <div key={idx} className="h-1" />;
                          })
                        ) : (
                          // User messages - simple display
                          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                        )}
                      </div>
                      <span className="text-xs opacity-60 mt-2 block">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-light-mint text-dark-forest rounded-lg p-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Section */}
            <div className="p-3 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  id="chat-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about customer success..."
                  className="flex-1 focus:ring-2 focus:ring-primary-green"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-primary-green hover:bg-dark-forest text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-4 z-50 bg-primary-green hover:bg-dark-forest text-white rounded-full shadow-2xl flex items-center gap-3 px-5 py-3 transition-colors"
        >
          <Sparkles className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm whitespace-nowrap">
            Ask Piper AI
          </span>
        </motion.button>
      )}
    </>
  );
}
