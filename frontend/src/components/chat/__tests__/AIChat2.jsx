import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  TrendingUp,
  BookOpen,
  DollarSign,
} from "lucide-react";

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        type: "assistant",
        content:
          "Hello! I'm InvestIQ, your AI investment assistant. I can help you understand investing concepts, analyze your portfolio, and answer any financial questions you have. What would you like to learn about today?",
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const message = inputMessage.trim();
    if (!message || isLoading) return;

    setInputMessage("");
    setIsLoading(true);

    const userMsg = {
      id: `user-${Date.now()}`,
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That's a great question! Let me explain...",
        "I can help you with that. Here's what you need to know...",
        "Interesting topic! From an investment perspective...",
        "Let me break that down for you in simple terms...",
      ];

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content:
          responses[Math.floor(Math.random() * responses.length)] +
          " " +
          message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 1500);
  };

  const quickPrompts = [
    {
      icon: TrendingUp,
      text: "Explain stock market basics",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: DollarSign,
      text: "What is compound interest?",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: BookOpen,
      text: "How do ETFs work?",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Sparkles,
      text: "Build a beginner portfolio",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const handleQuickPrompt = (text) => {
    setInputMessage(text);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 h-screen flex flex-col">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                InvestIQ Assistant
              </h1>
              <p className="text-sm text-gray-400">
                Your personal AI investing guide
              </p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 1 && (
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-4 text-center">
                  Try asking about:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickPrompts.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleQuickPrompt(prompt.text)}
                        className="group backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg bg-gradient-to-br ${prompt.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                            {prompt.text}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.type === "user"
                      ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg"
                      : "backdrop-blur-xl bg-white/10 border border-white/10 text-gray-100 shadow-xl"
                  }`}
                >
                  {message.type === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 rounded-md bg-gradient-to-br from-blue-500 to-purple-600">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        InvestIQ
                      </span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <span
                    className={`text-xs mt-2 block ${message.type === "user" ? "text-blue-200" : "text-gray-500"}`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                      <span
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <span
                        className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Container */}
          <div className="p-6 border-t border-white/10 backdrop-blur-xl bg-white/5">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about investing..."
                disabled={isLoading}
                className="flex-1 bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-3 text-center">
              InvestIQ provides educational information only. Not financial
              advice.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AIChat;
