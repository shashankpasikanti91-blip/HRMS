"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Sparkles, Lightbulb } from "lucide-react";
import api from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your SRP AI Assistant. I can help you with HR policies, leave balances, payroll queries, performance insights, and more. How can I help you today?",
      suggestions: [
        "What's my leave balance?",
        "Show employee statistics",
        "Help me draft a job description",
        "Analyze department performance",
      ],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ai_session_id");
    }
    return null;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg, timestamp: new Date() }]);
    setLoading(true);

    try {
      const { data } = await api.post("/ai/chat/message", {
        tenant_id: "default",
        user_id: "current",
        session_id: sessionId,
        message: msg,
      });

      const result = data.data || data;
      if (result.session_id) {
        setSessionId(result.session_id);
        localStorage.setItem("ai_session_id", result.session_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.message || "I'm sorry, I couldn't process that request.",
          suggestions: result.suggestions || [],
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("AI chat error:", err);
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage
            ? `Error: ${errorMessage}. Please try again.`
            : "The AI assistant is temporarily unavailable. Please try again later or contact support.",
          suggestions: ["Try another question", "View HR policies", "Check attendance"],
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">Powered by SRP AI Labs — your intelligent HR companion</p>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[70%] space-y-2 ${msg.role === "user" ? "text-right" : ""}`}>
                <div
                  className={`inline-block rounded-lg px-4 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        <Lightbulb className="h-3 w-3" />{s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs"><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs"><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about HR..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Powered by SRP AI Engine with GPT-4o and RAG
          </p>
        </div>
      </Card>
    </div>
  );
}
