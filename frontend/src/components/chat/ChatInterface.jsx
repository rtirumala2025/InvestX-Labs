import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import './ChatInterface.css';

const ChatInterface = () => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  // Initialize chat with user context
  const userContext = {
    age: user?.age || 16,
    budget: user?.budget || 100,
    risk_tolerance: user?.risk_tolerance || 'moderate',
    investment_goals: user?.investment_goals || [],
    experience_level: user?.experience_level || 'beginner',
  };

  const {
    messages,
    loading,
    error,
    sendMessage,
    clearConversation,
    startNewConversation,
    retryLastMessage,
  } = useChat(user?.uid, userContext);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    if (!isMinimized) {
      inputRef.current?.focus();
    }
  }, [isMinimized]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const message = inputMessage.trim();
    setInputMessage('');

    try {
      await sendMessage(message);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    if (suggestion.action === 'calculate_compound_interest') {
      const message = `Can you calculate compound interest for $${suggestion.parameters?.amount || 100} per month for ${suggestion.parameters?.years || 10} years?`;
      await sendMessage(message);
    } else if (suggestion.title) {
      await sendMessage(suggestion.title);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    const isError = message.isError;

    return (
      <div key={message.id} className={`message ${message.type} ${isError ? 'error' : ''}`}>
        <div className="message-content">
          {!isUser && (
            <div className="assistant-avatar">
              {isError ? '⚠️' : '🤖'}
            </div>
          )}
          
          <div className="message-bubble">
            <div className="message-text">
              {message.content.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="suggestions">
                {message.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="suggestion-button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={loading}
                  >
                    {suggestion.title || suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="message-timestamp">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    );
  };

  const renderWelcomeMessage = () => (
    <div className="welcome-message">
      <div className="welcome-header">
        <h3>👋 Hey there!</h3>
        <p>I'm Finley, your AI investment education assistant!</p>
      </div>
      
      <div className="conversation-starters">
        <h4>Try asking me:</h4>
        <div className="starter-buttons">
          {[
            "What's the difference between stocks and bonds?",
            "How does compound interest work?",
            "What are index funds?",
            "How much should I invest each month?"
          ].map((starter, index) => (
            <button
              key={index}
              className="starter-button"
              onClick={() => sendMessage(starter)}
              disabled={loading}
            >
              {starter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="chat-interface">
        <div className="chat-error">
          <h3>🔒 Please log in to chat</h3>
          <p>You need to be logged in to use the chat feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-interface ${isMinimized ? 'minimized' : ''}`}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="header-content">
          <div className="header-info">
            <h2>💬 Chat with Finley</h2>
            <p>Your AI investment education assistant</p>
          </div>
          
          <div className="header-actions">
            <GlassButton
              variant="ghost"
              size="small"
              onClick={() => setIsMinimized(!isMinimized)}
              aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
            >
              {isMinimized ? '📈' : '📉'}
            </GlassButton>
            
            <GlassButton
              variant="ghost"
              size="small"
              onClick={startNewConversation}
              disabled={loading}
              aria-label="Start new conversation"
            >
              🆕
            </GlassButton>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.length === 0 && renderWelcomeMessage()}
            
            {messages.map(renderMessage)}
            
            {loading && (
              <div className="message assistant">
                <div className="message-content">
                  <div className="assistant-avatar">🤖</div>
                  <div className="message-bubble">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="chat-error-banner">
              <span>⚠️ {error}</span>
              <button onClick={retryLastMessage} className="retry-button">
                Retry
              </button>
            </div>
          )}

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="chat-input">
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Finley anything about investing..."
                disabled={loading}
                maxLength={1000}
              />
              
              <GlassButton
                type="submit"
                variant="primary"
                size="small"
                disabled={loading || !inputMessage.trim()}
                loading={loading}
                aria-label="Send message"
              >
                {loading ? '⏳' : '📤'}
              </GlassButton>
            </div>
            
            <div className="input-footer">
              <span className="char-count">
                {inputMessage.length}/1000
              </span>
              <span className="input-hint">
                Press Enter to send, Shift+Enter for new line
              </span>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatInterface;
