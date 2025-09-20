import { useState, useCallback, useEffect } from 'react';
import { sendChatMessage, startConversation, getChatHistory } from '../services/chat';

/**
 * Custom hook for managing chat functionality
 * @param {string} userId - User ID
 * @param {Object} userContext - User context information
 * @returns {Object} Chat state and functions
 */
export const useChat = (userId, userContext = {}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);

  // Initialize conversation on mount
  useEffect(() => {
    if (userId) {
      initializeConversation();
    }
  }, [userId]);

  /**
   * Initialize a new conversation
   */
  const initializeConversation = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Try to get existing chat history first
      const historyResult = await getChatHistory(userId, 1);
      
      if (historyResult.success && historyResult.data.conversations?.length > 0) {
        // Load the most recent conversation
        const latestConversation = historyResult.data.conversations[0];
        setConversationId(latestConversation.conversation_id);
        setSessionId(latestConversation.session_id);
        setMessages(latestConversation.messages || []);
      } else {
        // Start a new conversation
        const startResult = await startConversation(userId, userContext);
        
        if (startResult.success) {
          setConversationId(startResult.data.conversation_id);
          setSessionId(startResult.data.session_id);
          setMessages([]);
        } else {
          setError(startResult.error);
        }
      }
    } catch (err) {
      console.error('Error initializing conversation:', err);
      setError('Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  }, [userId, userContext]);

  /**
   * Send a message to the chatbot
   * @param {string} message - Message to send
   * @returns {Promise<boolean>} Success status
   */
  const sendMessage = useCallback(async (message) => {
    if (!message?.trim() || !userId) return false;

    const userMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const result = await sendChatMessage(userId, message, sessionId);

      if (result.success) {
        const botMessage = {
          id: result.data.message_id || `bot_${Date.now()}`,
          type: 'assistant',
          content: result.data.response,
          timestamp: new Date().toISOString(),
          suggestions: result.data.recommendations || [],
          metadata: result.data.metadata || {},
        };

        setMessages(prev => [...prev, botMessage]);
        
        // Update conversation ID if provided
        if (result.data.conversation_id) {
          setConversationId(result.data.conversation_id);
        }
        if (result.data.session_id) {
          setSessionId(result.data.session_id);
        }

        return true;
      } else {
        setError(result.error);
        
        // Add error message
        const errorMessage = {
          id: `error_${Date.now()}`,
          type: 'assistant',
          content: `Sorry, I encountered an error: ${result.error}`,
          timestamp: new Date().toISOString(),
          isError: true,
        };
        
        setMessages(prev => [...prev, errorMessage]);
        return false;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      
      // Add error message
      const errorMessage = {
        id: `error_${Date.now()}`,
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, sessionId]);

  /**
   * Clear the current conversation
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setSessionId(null);
    setError(null);
  }, []);

  /**
   * Start a new conversation
   */
  const startNewConversation = useCallback(async () => {
    clearConversation();
    await initializeConversation();
  }, [clearConversation, initializeConversation]);

  /**
   * Retry the last message
   */
  const retryLastMessage = useCallback(async () => {
    if (messages.length === 0) return;

    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user');
    if (!lastUserMessage) return;

    // Remove the last assistant message (which might be an error)
    setMessages(prev => {
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      if (lastIndex >= 0 && newMessages[lastIndex].type === 'assistant') {
        newMessages.pop();
      }
      return newMessages;
    });

    // Retry sending the message
    await sendMessage(lastUserMessage.content);
  }, [messages, sendMessage]);

  return {
    // State
    messages,
    loading,
    conversationId,
    sessionId,
    error,
    
    // Actions
    sendMessage,
    clearConversation,
    startNewConversation,
    retryLastMessage,
    initializeConversation,
  };
};

export default useChat;
