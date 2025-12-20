import { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Send, Bot, User, Sparkles, TrendingUp, HelpCircle, BookOpen } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  { icon: <TrendingUp className="h-4 w-4" />, text: "What stocks should I consider buying?" },
  { icon: <HelpCircle className="h-4 w-4" />, text: "How do I diversify my portfolio?" },
  { icon: <BookOpen className="h-4 w-4" />, text: "Explain P/E ratio in simple terms" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI investment assistant. I can help you understand market trends, analyze stocks, explain investment concepts, and provide personalized suggestions based on your portfolio. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(messageText),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const getAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes("buy") || lowerQuestion.includes("stock")) {
      return "Based on current market conditions and your portfolio, here are some considerations:\n\n**Technology Sector:** Companies like NVDA and MSFT continue to show strong growth due to AI demand.\n\n**Key Factors to Consider:**\n• Your current portfolio allocation\n• Risk tolerance\n• Investment timeline\n\nWould you like me to analyze specific stocks or sectors in more detail?";
    }
    
    if (lowerQuestion.includes("diversif")) {
      return "Diversification is a key strategy to manage risk. Here's a simple approach:\n\n**Asset Allocation:**\n• Stocks: 60-70%\n• Bonds: 20-30%\n• Cash/alternatives: 10%\n\n**Within Stocks:**\n• Large-cap: 50%\n• Mid-cap: 30%\n• Small-cap: 20%\n\nThe right mix depends on your age, goals, and risk tolerance. Would you like personalized recommendations based on your portfolio?";
    }
    
    if (lowerQuestion.includes("p/e") || lowerQuestion.includes("pe ratio")) {
      return "**P/E Ratio (Price-to-Earnings)** is one of the most important metrics for evaluating stocks.\n\n**Simple Explanation:**\nIf a stock costs $100 and earns $5 per share, the P/E is 20. This means you're paying $20 for every $1 of earnings.\n\n**What it tells you:**\n• Low P/E (< 15): May be undervalued or have issues\n• Average P/E (15-25): Fairly valued\n• High P/E (> 25): Growth expected or overvalued\n\n**Important:** Always compare P/E within the same industry!";
    }
    
    return "That's a great question! Let me help you with that. Based on my analysis, I'd recommend considering multiple factors including market trends, your risk tolerance, and investment timeline.\n\nWould you like me to provide more specific information about any particular aspect of investing?";
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">AI Investment Chat</h1>
          <p className="text-xs text-muted-foreground">Ask anything about investing</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 animate-slide-up",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[70%] rounded-xl px-4 py-3",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border/50"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={cn(
                  "text-[10px] mt-2",
                  message.role === "user"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {message.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 animate-slide-up">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-card border border-border/50 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (show only when few messages) */}
      {messages.length <= 1 && (
        <div className="px-6 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <GlassButton
                key={i}
                variant="outline"
                size="sm"
                onClick={() => handleSend(q.text)}
                className="text-xs"
              >
                {q.icon}
                {q.text}
              </GlassButton>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-md p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-3 max-w-4xl mx-auto"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about stocks, investing, or your portfolio..."
            className="flex-1"
            disabled={isLoading}
          />
          <GlassButton
            type="submit"
            variant="glow"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </GlassButton>
        </form>
      </div>
    </div>
  );
}
