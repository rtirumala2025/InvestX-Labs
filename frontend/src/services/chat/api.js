import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const chatAPI = {
  sendMessage: async (message, userId = 'anonymous', sessionId = 'default-session') => {
    try {
      const response = await axios.post(
        `${API_URL}/chat`,
        {
          message,
          user_id: userId,
          session_id: sessionId
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
};
