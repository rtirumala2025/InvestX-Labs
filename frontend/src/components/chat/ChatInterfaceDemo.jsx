import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import GlassButton from '../ui/GlassButton';
import './ChatInterface.css';

const ChatInterfaceDemo = () => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Demo messages for testing
  const demoMessages = [
    {
      id: 'demo_1',
      type: 'assistant',
      content: 'Hi! I\'m Finley, your AI investment education assistant! I\'m here to help you learn about investing in a fun and easy way. What would you like to know?',
      timestamp: new Date().toISOString(),
      suggestions: [
        { title: 'What are stocks?', action: 'explain_stocks' },
        { title: 'How does compound interest work?', action: 'explain_compound_interest' }
      ]
    }
  ];

  // Initialize with demo message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages(demoMessages);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const botMessage = {
        id: `bot_${Date.now()}`,
        type: 'assistant',
        content: `Thanks for your question: "${userMessage.content}". This is a demo response from Finley! In a real implementation, I would connect to the AI backend to provide personalized investment education based on your profile.`,
        timestamp: new Date().toISOString(),
        suggestions: [
          { title: 'Tell me more about this topic', action: 'more_info' },
          { title: 'What should I do next?', action: 'next_steps' }
        ]
      };
      
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
    }, 1500);
  };

  const handleSuggestionClick = async (suggestion) => {
    await handleSendMessage({ preventDefault: () => {} });
    setInputMessage(suggestion.title);
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

    return (
      <div key={message.id} className={`message ${message.type}`}>
        <div className="message-content">
          {!isUser && (
            <div className="assistant-avatar">
              🤖
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
              onClick={() => {
                setInputMessage(starter);
                handleSendMessage({ preventDefault: () => {} });
              }}
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
    <div className="chat-interface">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="header-content">
          <div className="header-info">
            <h2>💬 Chat with Finley (Demo)</h2>
            <p>Your AI investment education assistant - Demo Mode</p>
          </div>
          
          <div className="header-actions">
            <GlassButton
              variant="ghost"
              size="small"
              onClick={() => setMessages(demoMessages)}
              aria-label="Reset conversation"
            >
              🔄
            </GlassButton>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default ChatInterfaceDemo;
