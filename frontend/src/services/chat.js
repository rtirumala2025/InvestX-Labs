import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Create axios instance for chat API
const chatAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/chat`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for chat responses
});

// Request interceptor for logging
chatAPI.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
chatAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Chat API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Send a message to the chatbot
 * @param {string} userId - User ID
 * @param {string} message - User message
 * @param {string} sessionId - Optional session ID for conversation continuity
 * @returns {Promise<Object>} Chat response
 */
export const sendChatMessage = async (userId, message, sessionId = null) => {
  try {
    const response = await chatAPI.post('/message', {
      user_id: userId,
      message: message,
      session_id: sessionId,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error sending chat message:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to send message',
    };
  }
};

/**
 * Start a new conversation
 * @param {string} userId - User ID
 * @param {Object} userContext - User context information
 * @returns {Promise<Object>} Conversation start response
 */
export const startConversation = async (userId, userContext = {}) => {
  try {
    const response = await chatAPI.post('/start', {
      user_id: userId,
      user_context: userContext,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error starting conversation:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to start conversation',
    };
  }
};

/**
 * Get chat history for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of conversations to retrieve
 * @returns {Promise<Object>} Chat history
 */
export const getChatHistory = async (userId, limit = 10) => {
  try {
    const response = await chatAPI.get(`/history/${userId}?limit=${limit}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error getting chat history:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to get chat history',
    };
  }
};

/**
 * Get conversation details
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Conversation details
 */
export const getConversation = async (conversationId) => {
  try {
    const response = await chatAPI.get(`/conversation/${conversationId}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error getting conversation:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to get conversation',
    };
  }
};

/**
 * Delete a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Deletion response
 */
export const deleteConversation = async (conversationId) => {
  try {
    const response = await chatAPI.delete(`/conversation/${conversationId}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to delete conversation',
    };
  }
};

export default {
  sendChatMessage,
  startConversation,
  getChatHistory,
  getConversation,
  deleteConversation,
};
