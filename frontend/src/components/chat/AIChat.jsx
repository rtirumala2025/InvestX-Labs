import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, Loader2, Sparkles, TrendingUp, BookOpen, DollarSign, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { chatAPI } from '../../services/chat/api';
import { useChat } from '../../contexts/ChatContext';
import analytics from '../../services/analytics/mockAnalytics';

const AIChat = () => {
  const {
    messages,
    isLoading,
    error,
    isOnline,
    addMessage,
    setError,
    setLoading,
  } = useChat();
  
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const formRef = useRef(null);
  
  // Input validation and sanitization
  const validateAndSanitizeInput = (input) => {
    // Trim whitespace
    let sanitized = input.trim();
    
    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>?/gm, '');
    
    // Limit to 2000 characters
    if (sanitized.length > 2000) {
      throw new Error('Message exceeds maximum length of 2000 characters');
    }
    
    // Check for empty message after sanitization
    if (!sanitized) {
      throw new Error('Message cannot be empty');
    }
    
    return sanitized;
  };

  // Initialize with welcome message if no messages exist
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        id: 'welcome',
        type: 'assistant',
        content: "Hello! I'm InvestX Labs, your AI investment assistant. I can help you understand investing concepts, analyze your portfolio, and answer any financial questions you have. What would you like to learn about today?",
        timestamp: new Date().toISOString()
      });
      
      // Log initial chat start
      analytics.logEvent('chat_session_start', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        online: navigator.onLine,
      });
    }
  }, [messages.length, addMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError(null);
    
    let sanitizedMessage;
    try {
      sanitizedMessage = validateAndSanitizeInput(inputMessage);
    } catch (err) {
      setError(err.message);
      analytics.logError(err, 'input_validation');
      return;
    }
    
    if (isLoading) return;

    setInputMessage('');
    setLoading(true);
    
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const timestamp = new Date().toISOString();

    // Add user message to chat
    addMessage({
      id: messageId,
      type: 'user',
      content: sanitizedMessage,
      timestamp,
      status: 'sending'
    });
    
    // Log message sent
    analytics.logChatMessage(
      messageId,
      'user',
      'user_message',
      null,
      { contentLength: sanitizedMessage.length }
    );
    
    // Auto-scroll to bottom after adding message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const startTime = Date.now();
      
      // Call the backend API with sanitized message
      const response = await chatAPI.sendMessage(sanitizedMessage);
      const responseTime = Date.now() - startTime;
      
      const assistantMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const responseContent = response.response || response.message || "I'm here to help with your investment questions!";
      
      // Add assistant's response to chat
      addMessage({
        id: assistantMessageId,
        type: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      });
      
      // Log successful response
      analytics.logChatMessage(
        assistantMessageId,
        'assistant',
        response.intent || 'general',
        responseTime,
        {
          contentLength: responseContent.length,
          cached: response.cached || false
        }
      );
      
      // Log performance metric
      analytics.logMetric('api_response_time', responseTime, 'ms', {
        intent: response.intent || 'general',
        cached: response.cached || false
      });
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Log the error
      analytics.logError(error, 'send_message', {
        messageId,
        contentLength: sanitizedMessage.length,
        online: isOnline
      });
      
      // Update message status to failed
      const errorMessage = error.response?.data?.message || "I'm having trouble connecting to the server. Please try again later.";
      
      // Add error message to chat
      addMessage({
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true
      });
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      
      // Return focus to input after processing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const quickPrompts = [
    { icon: TrendingUp, text: "Explain stock market basics", color: "from-blue-500 to-cyan-500" },
    { icon: DollarSign, text: "What is compound interest?", color: "from-purple-500 to-pink-500" },
    { icon: BookOpen, text: "How do ETFs work?", color: "from-orange-500 to-red-500" },
    { icon: Sparkles, text: "Build a beginner portfolio", color: "from-green-500 to-emerald-500" }
  ];

  const handleQuickPrompt = (text) => {
    setInputMessage(text);
    inputRef.current?.focus();
    
    // Log quick prompt usage
    analytics.logInteraction('quick_prompt_selected', 'quick_prompt', {
      promptText: text,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                InvestX Labs Assistant
              </h1>
              <p className="text-sm text-gray-400">Your personal AI investment assistant</p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {messages.length === 1 && (
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-4 text-center">Try asking about:</p>
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
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${prompt.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
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
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'backdrop-blur-xl bg-white/10 border border-white/10 text-gray-100 shadow-xl'
                  }`}
                >
                  {message.type === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 rounded-md bg-gradient-to-br from-blue-500 to-purple-600">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-gray-400 font-medium">InvestX Labs</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <span className={`text-xs mt-2 block ${message.type === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Container */}
          <div className="p-6 border-t border-white/10 backdrop-blur-xl bg-white/5">
            {/* Connection status indicator */}
            <div className={`flex items-center gap-2 mb-3 text-sm ${
              isOnline ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Offline - Messages will be sent when back online</span>
                </>
              )}
            </div>
            
            <form ref={formRef} onSubmit={handleSendMessage} className="flex flex-col gap-2">
              {error && (
                <div 
                  className="flex items-center gap-2 p-2 text-sm text-red-400 bg-red-900/20 rounded-lg mb-2"
                  role="alert"
                  aria-live="assertive"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Ask me anything about investing..."
                    disabled={isLoading}
                    aria-label="Type your message"
                    aria-required="true"
                    aria-invalid={!!error}
                    className="w-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all disabled:opacity-50 pr-12"
                    maxLength={2000}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  {inputMessage.length > 0 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                      {2000 - inputMessage.length}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  aria-label="Send message"
                  className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={(e) => {
                    analytics.logInteraction('send_button_click', 'button', {
                      inputLength: inputMessage.length,
                      timestamp: new Date().toISOString()
                    });
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="w-5 h-5" aria-hidden="true" />
                  )}
                  <span className="sr-only">Send message</span>
                </button>
              </div>
            </form>
            <div className="text-center mt-3">
              <p className="text-xs text-gray-500">
                InvestX Labs provides educational information only. Not financial advice.
              </p>
              {!isOnline && (
                <p className="text-xs text-yellow-400 mt-1">
                  You're currently offline. Messages will be sent when you're back online.
                </p>
              )}
            </div>
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