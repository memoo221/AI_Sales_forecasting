"use client";

import { useState, useRef, useEffect } from "react";
import { assistantApi, ChatMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Which product has the highest forecasted revenue?",
  "Are there any products with declining trends?",
  "What is the total revenue forecast for the next 30 days?",
  "Which products should I focus on this month?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: content.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const data = await assistantApi.chat(updatedMessages);
      setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">AI Sales Assistant</h1>
          <Badge variant="secondary" className="text-xs">Powered by Llama 3</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Ask questions about your sales data, forecasts, and product performance.
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <Bot className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium">Ask me about your sales data</p>
              <p className="text-sm text-muted-foreground mt-1">
                I have access to your products, revenue history, and ML forecasts.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1.5 px-3 text-left"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 max-w-3xl mx-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <Card
                className={`px-4 py-3 text-sm max-w-[80%] whitespace-pre-wrap leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground border-0"
                    : "bg-card"
                }`}
              >
                {msg.content}
              </Card>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <Card className="px-4 py-3 text-sm bg-card">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </div>
              </Card>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-6 py-4 border-t bg-card shrink-0">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your sales data... (Enter to send, Shift+Enter for new line)"
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            size="icon"
            className="shrink-0 h-11 w-11"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
