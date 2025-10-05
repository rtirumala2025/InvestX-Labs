import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiRefreshCw, FiAlertCircle, FiMessageSquare } from 'react-icons/fi';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useLlamaAI } from '../../hooks/useLlamaAI';
import styles from './AIChat.module.css';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const { portfolio } = usePortfolio();
  const { sendMessage } = useLlamaAI();

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      type: 'assistant',
      content: 'Hello! I\'m your AI investment assistant. I can help you analyze your portfolio, suggest investments, and explain financial concepts. What would you like to know?',
      timestamp: new Date().toISOString()
    }]);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Suggested questions
  const suggestedQuestions = [
    'Analyze my current portfolio',
    'What should I invest $1000 in?',
    'Explain diversification',
    'What are some good stocks for beginners?'
  ];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Get AI response
      const response = await sendMessage(
        inputMessage,
        {
          totalValue: portfolio?.totalValue || 0,
          holdings: portfolio?.holdings || [],
          riskProfile: portfolio?.riskProfile || 'moderate'
        },
        messages.slice(-5) // Send last 5 messages for context
      );

      if (response.success) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString()
        }]);
      } else {
        throw new Error(response.error || 'Failed to get response from AI');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    // Auto-submit after a short delay for better UX
    setTimeout(() => {
      handleSendMessage({ preventDefault: () => {} });
    }, 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.chatLogo}>
          <FiMessageSquare size={18} />
        </div>
        <h2 className={styles.chatTitle}>AI Investment Assistant</h2>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`${styles.message} ${message.type === 'user' ? styles.userMessage : styles.assistantMessage}`}
          >
            <div className={styles.messageContent}>
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.message} ${styles.assistantMessage}`}>
            <div className={styles.loadingDots}>
              <div className={styles.loadingDot}></div>
              <div className={styles.loadingDot}></div>
              <div className={styles.loadingDot}></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.inputField}
            placeholder="Ask me anything about investing..."
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className={styles.sendButton}
            disabled={!inputMessage.trim() || isLoading}
          >
            <FiSend size={20} />
          </button>
        </form>

        {error && (
          <div className={styles.errorMessage}>
            <FiAlertCircle /> {error}
          </div>
        )}

        {messages.length <= 1 && (
          <div className={styles.suggestions}>
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(question)}
                className={styles.suggestionChip}
                type="button"
              >
                {question}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChat;
