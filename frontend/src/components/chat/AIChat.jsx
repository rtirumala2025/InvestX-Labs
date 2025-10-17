import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  FiSend, 
  FiRefreshCw, 
  FiAlertCircle, 
  FiMessageSquare, 
  FiArrowRight,
  FiChevronRight,
  FiLoader
} from 'react-icons/fi';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useAuth } from '../../contexts/AuthContext';
import { useInvestIQChat } from '../../hooks/useInvestIQChat';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import styles from './AIChat.module.css';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { portfolio } = usePortfolio();
  const { currentUser } = useAuth();
  const { sendMessage: sendInvestMessage } = useInvestIQChat();
  
  // Build user profile payload for backend
  const userProfile = useMemo(() => {
    const profile = currentUser?.profile || {};
    return {
      age: profile.age ?? 16,
      riskTolerance: profile.riskTolerance ?? 'moderate',
      investmentGoals: profile.investmentGoals ?? ['growth', 'education'],
      investmentExperience: profile.investmentExperience ?? 'beginner',
      timeHorizon: profile.timeHorizon ?? 'long_term',
    };
  }, [currentUser]);
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      type: 'assistant',
      content: 'Hello! I\'m your AI investment assistant. I can help you analyze your portfolio, suggest investments, and explain financial concepts. What would you like to know?',
      timestamp: new Date().toISOString(),
      suggestions: [
        'Analyze my portfolio',
        'Suggest investments for $1000',
        'Explain diversification',
        'Market trends this week'
      ]
    }]);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle suggested question click with auto-submit
  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    // Auto-focus and submit after a short delay for better UX
    setTimeout(() => {
      inputRef.current?.focus();
      handleSendMessage({ preventDefault: () => {} });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    // Add user message to chat with animation
    const userMsg = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, { ...userMsg }]);

    try {
      // Show typing indicator
      const typingId = `typing-${Date.now()}`;
      setMessages(prev => [...prev, { 
        id: typingId,
        type: 'assistant',
        content: '',
        isTyping: true,
        timestamp: new Date().toISOString()
      }]);

      // Call backend via InvestIQ hook with userProfile
      const { reply, structuredData } = await sendInvestMessage(userMessage, userProfile);
      
      // Remove typing indicator and add AI response
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== typingId && !msg.isTyping),
        {
          id: `ai-${Date.now()}`,
          type: 'assistant',
          content: reply || 'Sorry, I could not process your request.',
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Update with error message and remove typing indicator
      setMessages(prev => [
        ...prev.filter(msg => !msg.isTyping),
        {
          id: `error-${Date.now()}`,
          type: 'assistant',
          content: 'AI service unavailable. Please try again shortly.',
          timestamp: new Date().toISOString(),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
  };

  // Animation variants for messages
  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: 'easeOut'
      }
    })
  };

  return (
    <div className={styles.chatContainer}>
      <AnimatePresence initial={false}>
        <div className={styles.messagesContainer}>
          <Reorder.Group 
            as="div" 
            axis="y" 
            values={messages}
            onReorder={setMessages}
            className={styles.messagesList}
          >
            {messages.map((message, index) => (
              <Reorder.Item 
                key={message.id} 
                value={message}
                className={`${styles.message} ${styles[message.type]}`}
                style={{ '--index': index }}
                initial="hidden"
                animate="visible"
                custom={index}
                variants={messageVariants}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                {message.isTyping ? (
                  <div className={styles.loadingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  <div className={styles.messageContent}>
                    {message.content.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph || <br />}</p>
                    ))}
                  </div>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>
          <div ref={messagesEndRef} />
        </div>
      </AnimatePresence>

      <div style={{
        position: 'relative',
        padding: '1.25rem 1.5rem',
        marginTop: 'auto',
        backgroundColor: '#000000',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {error && (
          <motion.div 
            className={`${styles.errorMessage} ${styles.errorContainer}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiAlertCircle className={styles.errorIcon} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className={styles.retryButton}>
              <FiRefreshCw size={16} />
            </button>
          </motion.div>
        )}

        <form onSubmit={handleSendMessage} className={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about investing..."
            className={styles.messageInput}
            style={{
              backgroundColor: '#000000',
              color: 'white',
              border: 'none',
              outline: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              boxShadow: 'none'
            }}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className={styles.sendButton}
            disabled={isLoading || !inputMessage.trim()}
            aria-label="Send message"
          >
            <FiSend size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
