"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const CSM_SYSTEM_PROMPT = `You are Piper AI, an intelligent assistant specifically designed for Customer Success Managers (CSMs).

Your expertise includes:
- Customer health scoring and monitoring
- Account management strategies
- Renewal and expansion planning
- Churn prevention techniques
- Customer engagement best practices
- NPS and satisfaction metrics
- Upsell and cross-sell opportunities
- Onboarding and adoption strategies
- Customer success metrics and KPIs
- Meeting preparation and talk tracks
- Relationship building with customers

Guidelines:
- Only answer questions related to customer success management, customer relationships, account management, and CSM best practices
- Provide concise, actionable insights (keep responses under 200 words)
- If asked about topics unrelated to customer success, politely decline and redirect to CSM-related topics
- Be professional, helpful, and focused on practical advice
- Use examples when helpful

If a question is not related to customer success management, respond with: "I'm specifically designed to help with Customer Success Management topics. Could you ask me something about customer health, account management, renewals, or other CSM-related topics?"`;

export default function ChatDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    OpenAIMessage[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

      // Build messages array for OpenAI
      const messages: OpenAIMessage[] = [
        { role: "system", content: CSM_SYSTEM_PROMPT },
        ...conversationHistory,
        { role: "user", content: messageText },
      ];

      // Call OpenAI API directly
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
            max_tokens: 300,
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

      // Update conversation history
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
                  Your CSM Assistant
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 p-4 bg-off-white overflow-y-auto">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-neutral-gray text-sm py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Ask me anything about Customer Success Management</p>
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
                      <p className="text-sm whitespace-pre-wrap">
                        {message.text}
                      </p>
                      <span className="text-xs opacity-60 mt-1 block">
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
          <MessageCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm whitespace-nowrap">
            Chat with Piper AI
          </span>
        </motion.button>
      )}
    </>
  );
}
