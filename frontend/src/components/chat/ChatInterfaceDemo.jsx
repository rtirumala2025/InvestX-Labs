import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { usePortfolio } from "../../hooks/usePortfolio";
import { useLlamaAI } from "../../hooks/useLlamaAI";
import {
  FiSend,
  FiMessageSquare,
  FiChevronDown,
  FiX,
  FiArrowRight,
  FiRefreshCw,
  FiCopy,
  FiUser,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingUp,
  FiPieChart,
  FiDollarSign,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

// Message types for better type safety
const MESSAGE_TYPES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
};

const ChatInterfaceDemo = () => {
  const { user } = useAuth();
  const { portfolio, holdings } = usePortfolio();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(uuidv4());
  const [isMinimized, setIsMinimized] = useState(false);

  // Prepare portfolio data for AI
  const portfolioData = React.useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return { holdings: [], totalValue: 0, diversificationScore: 0 };
    }

    const totalValue = holdings.reduce((sum, holding) => {
      const currentPrice = holding.currentPrice || holding.purchasePrice || 0;
      return sum + holding.shares * currentPrice;
    }, 0);

    return {
      holdings,
      totalValue,
      diversificationScore: portfolio?.diversificationScore || 0,
    };
  }, [holdings, portfolio]);

  // Initialize LLaMA AI hook with portfolio context
  const {
    loading: aiLoading,
    error: aiError,
    sendMessage: sendAIMessage,
    analyzePortfolio,
    getSuggestions,
    getInsights,
    isConfigured: aiConfigured,
  } = useLlamaAI(portfolioData);

  console.log("💬 [ChatInterfaceDemo] Component initialized");
  console.log("💬 [ChatInterfaceDemo] AI configured:", aiConfigured);
  console.log("💬 [ChatInterfaceDemo] Portfolio data:", {
    holdingsCount: portfolioData.holdings.length,
    totalValue: portfolioData.totalValue,
  });

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const hasPortfolio = portfolioData.holdings.length > 0;

      const welcomeContent = hasPortfolio
        ? `Hello! I'm Finley, your AI investment advisor. I can see you have ${portfolioData.holdings.length} holdings worth $${portfolioData.totalValue.toLocaleString()}. I can help analyze your portfolio, suggest improvements, or answer any investment questions. What would you like to explore?`
        : `Hello! I'm Finley, your AI investment education assistant. I can help you understand investing concepts, analyze markets, and make informed financial decisions. What would you like to learn about today?`;

      const suggestions = hasPortfolio
        ? [
            "Analyze my current portfolio",
            "What should I invest $1000 in next?",
            "How can I improve my diversification?",
            "What are the latest market trends?",
          ]
        : [
            "What are the basics of stock market investing?",
            "How do I start investing with $1000?",
            "What is the difference between stocks and ETFs?",
            "How do I build a diversified portfolio?",
          ];

      const welcomeMessage = {
        id: uuidv4(),
        type: MESSAGE_TYPES.ASSISTANT,
        content: welcomeContent,
        timestamp: new Date().toISOString(),
        suggestions,
      };

      console.log("💬 [ChatInterfaceDemo] Setting welcome message:", {
        hasPortfolio,
        holdingsCount: portfolioData.holdings.length,
        totalValue: portfolioData.totalValue,
      });

      setMessages([welcomeMessage]);
    }
  }, [portfolioData.holdings.length, portfolioData.totalValue]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle AI message sending
  const handleAIMessage = useCallback(
    async (userMessage) => {
      console.log("💬 [ChatInterfaceDemo] Sending message to AI:", userMessage);

      if (!aiConfigured) {
        console.warn(
          "💬 [ChatInterfaceDemo] ⚠️ AI not configured, using fallback response",
        );
        return {
          content: `I'd love to help you with that! However, the AI service isn't currently configured. Please check that your LLaMA API key is set up correctly.\n\nIn the meantime, here are some general investment principles:\n\n• **Start Early**: Time in the market beats timing the market\n• **Diversify**: Don't put all eggs in one basket\n• **Stay Consistent**: Regular investing builds wealth over time\n• **Keep Learning**: Education is your best investment\n\nWould you like to explore any of these topics further?`,
          suggestions: [
            "Tell me about diversification",
            "How do I start investing?",
            "What are index funds?",
          ],
        };
      }

      try {
        const aiResponse = await sendAIMessage(userMessage);

        if (!aiResponse) {
          throw new Error("No response from AI service");
        }

        console.log("💬 [ChatInterfaceDemo] ✅ AI response received");

        // Generate contextual suggestions based on portfolio
        const suggestions =
          portfolioData.holdings.length > 0
            ? [
                "Analyze my portfolio performance",
                "What should I buy next?",
                "How can I reduce risk?",
              ]
            : [
                "How do I start investing?",
                "What is a good first investment?",
                "Explain index funds",
              ];

        return {
          content: aiResponse,
          suggestions,
        };
      } catch (error) {
        console.error("💬 [ChatInterfaceDemo] ❌ AI error:", error);

        return {
          content: `I apologize, but I'm having trouble connecting to the AI service right now. ${error.message}\n\nHere are some general investment tips while we resolve this:\n\n• **Emergency Fund First**: Save 3-6 months of expenses\n• **Start Simple**: Consider broad market index funds\n• **Automate**: Set up regular contributions\n• **Stay Patient**: Investing is a long-term game\n\nPlease try again in a moment, or feel free to ask about basic investment concepts!`,
          suggestions: [
            "What is an emergency fund?",
            "Explain index funds",
            "How much should I invest?",
          ],
        };
      }
    },
    [aiConfigured, sendAIMessage, portfolioData.holdings.length],
  );

  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    console.log("💬 [ChatInterfaceDemo] User sending message:", inputMessage);

    const userMessage = {
      id: uuidv4(),
      type: MESSAGE_TYPES.USER,
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    try {
      const aiResponse = await handleAIMessage(userMessage.content);

      const assistantMessage = {
        id: uuidv4(),
        type: MESSAGE_TYPES.ASSISTANT,
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        suggestions: aiResponse.suggestions || [],
      };

      console.log(
        "💬 [ChatInterfaceDemo] Adding assistant message to conversation",
      );
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(
        "💬 [ChatInterfaceDemo] ❌ Error in message handling:",
        error,
      );

      const errorMessage = {
        id: uuidv4(),
        type: MESSAGE_TYPES.ASSISTANT,
        content:
          "I apologize, but I am having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  }, [inputMessage, handleAIMessage]);

  // Render message content with proper formatting
  const renderMessageContent = (content) => {
    return content.split("\n").map((paragraph, i) => (
      <p key={i} className="mb-2 last:mb-0">
        {paragraph}
      </p>
    ));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  // Copy text to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Reset conversation
  const handleResetConversation = () => {
    setMessages([]);
    setConversationId(uuidv4());
    // Re-initialize with welcome message
    const welcomeMessage = {
      id: uuidv4(),
      type: MESSAGE_TYPES.ASSISTANT,
      content:
        "Hello! I'm Finley, your AI investment education assistant. I can help you understand investing concepts, analyze markets, and make informed financial decisions. What would you like to learn about today?",
      timestamp: new Date().toISOString(),
      suggestions: [
        "What are the basics of stock market investing?",
        "How do I build a diversified portfolio?",
        "What are the latest market trends?",
      ],
    };
    setMessages([welcomeMessage]);
  };

  const renderMessage = (message) => {
    const isUser = message.type === MESSAGE_TYPES.USER;
    const isSystem = message.type === MESSAGE_TYPES.SYSTEM;

    return (
      <div
        key={message.id}
        className={`message ${message.type} ${isUser ? "user-message" : "assistant-message"} ${isSystem ? "system-message" : ""} ${message.isError ? "error-message" : ""}`}
      >
        <div className="message-content">
          {!isUser && !isSystem && (
            <div className="assistant-avatar">
              <div className="avatar-gradient">
                <span>🤖</span>
              </div>
            </div>
          )}

          <div className="message-bubble">
            {isSystem && <div className="system-label">System</div>}

            <div className="message-text">
              {message.content.split("\n").map((line, index) => (
                <p key={index}>{line}</p>
              ))}

              {message.sources && message.sources.length > 0 && (
                <div className="sources">
                  <div className="sources-label">Sources:</div>
                  <div className="sources-list">
                    {message.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-link"
                      >
                        {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {message.suggestions &&
              message.suggestions.length > 0 &&
              !isSystem && (
                <div className="suggestions">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-chip"
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={aiLoading}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

            <div className="message-footer">
              <span className="message-timestamp">
                {formatTimestamp(message.timestamp)}
              </span>
              {!isUser && !isSystem && (
                <button
                  className="copy-button"
                  onClick={() => copyToClipboard(message.content)}
                  aria-label="Copy to clipboard"
                  type="button"
                >
                  <FiCopy size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWelcomeMessage = () => (
    <div className="welcome-message">
      <div className="welcome-header">
        <div className="welcome-avatar">
          <div className="avatar-gradient welcome-avatar-gradient">
            <span>💡</span>
          </div>
        </div>
        <h3>Welcome to InvestX AI Assistant</h3>
        <p>
          I'm Finley, your AI-powered investment education assistant. I can help
          you understand complex financial concepts, analyze market trends, and
          make informed investment decisions.
        </p>
      </div>

      <div className="conversation-starters">
        <h4>Quick Start</h4>
        <p className="starter-subtitle">Try asking me about:</p>
        <div className="starter-buttons">
          {[
            {
              text: "Explain the difference between stocks and bonds",
              icon: "📊",
            },
            {
              text: "How should I allocate my investment portfolio?",
              icon: "📈",
            },
            {
              text: "What are the best long-term investment strategies?",
              icon: "🌱",
            },
            {
              text: "How do I start investing with $1,000?",
              icon: "💰",
            },
          ].map((starter, index) => (
            <motion.button
              key={index}
              className="starter-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setInputMessage(starter.text);
                inputRef.current.focus();
              }}
              type="button"
              disabled={aiLoading}
            >
              <span className="starter-icon">{starter.icon}</span>
              <span className="starter-text">{starter.text}</span>
              <FiArrowRight className="starter-arrow" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="chat-interface-container">
        {/* Chat Header */}
        <div className={`chat-header ${isMinimized ? "minimized" : ""}`}>
          <div className="header-content">
            <div className="header-info">
              <div className="header-title">
                <span className="header-icon">💬</span>
                <h2>InvestX AI Assistant</h2>
                <span className="status-badge">Beta</span>
              </div>
              <p>
                {isMinimized
                  ? "Click to chat"
                  : "Your personal investment guide"}
              </p>
            </div>

            <div className="header-actions">
              <button
                className="icon-button"
                onClick={handleResetConversation}
                aria-label="Start new conversation"
                title="New chat"
              >
                <FiRefreshCw size={18} />
              </button>
              <button
                className="icon-button minimize-button"
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
              >
                {isMinimized ? (
                  <FiMessageSquare size={18} />
                ) : (
                  <FiChevronDown size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface-container">
      <div
        className={`chat-header ${isMinimized ? "minimized" : ""}`}
        onClick={() => isMinimized && setIsMinimized(false)}
      >
        <div className="header-content">
          <div className="header-info">
            <h3>💬 Finley AI Assistant</h3>
            <p>
              {isMinimized ? "Click to chat" : "Your personal investment guide"}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="minimize-button"
            aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
          >
            {isMinimized ? <FiMessageSquare /> : <FiChevronDown />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            className="chat-interface"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="chat-messages" ref={chatContainerRef}>
              {messages.length === 0 ? (
                <motion.div
                  className="welcome-message"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {renderWelcomeMessage()}
                </motion.div>
              ) : (
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {renderMessage(message)}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {aiLoading && (
                <motion.div
                  className="typing-indicator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span>Finley is thinking...</span>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-container">
              <div className="chat-input-wrapper">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about investing..."
                  className="chat-input"
                  disabled={aiLoading}
                  rows={1}
                />
                <button
                  type="submit"
                  className="send-button"
                  disabled={!inputMessage.trim() || aiLoading}
                  aria-label="Send message"
                >
                  <FiSend className="send-icon" />
                </button>
              </div>
              {messages.length === 0 && (
                <div className="suggestions">
                  <p className="suggestion-title">Try asking:</p>
                  <div className="suggestion-chips">
                    {[
                      "How do I start investing?",
                      "What are index funds?",
                      "How does compound interest work?",
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        className="suggestion-chip"
                        onClick={() => {
                          setInputMessage(suggestion);
                          inputRef.current.focus();
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInterfaceDemo;
