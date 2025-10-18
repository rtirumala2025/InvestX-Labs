// useInvestIQChat.js
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useInvestIQChat = () => {
  const { currentUser } = useAuth();
  
  const CHAT_URL = useMemo(() => {
    const base = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
    return `${base}/api/chat`;
  }, []);

  const sendMessage = async (message, userProfile, { signal } = {}) => {
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }

    try {
      // Get ID token for authentication
      const idToken = currentUser ? await currentUser.getIdToken() : null;
      
      const headers = {
        'Content-Type': 'application/json',
        ...(idToken && { 'Authorization': `Bearer ${idToken}` })
      };

      const payload = {
        message,
        userProfile: {
          // Basic user info
          userId: currentUser?.uid,
          email: currentUser?.email,
          displayName: currentUser?.displayName,
          
          // Investment profile
          age: userProfile?.age ?? 25,
          experience_level: userProfile?.investmentExperience || 'beginner',
          risk_tolerance: userProfile?.riskTolerance || 'moderate',
          time_horizon: userProfile?.timeHorizon || 'long_term',
          investment_goals: Array.isArray(userProfile?.investmentGoals) 
            ? userProfile.investmentGoals 
            : ['growth'],
            
          // Portfolio info
          portfolio_value: Number(userProfile?.portfolio_value || 0),
          
          // Additional context
          interests: Array.isArray(userProfile?.interests) 
            ? userProfile.interests 
            : [],
          
          // Timestamp for context
          timestamp: new Date().toISOString()
        }
      };

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal,
        credentials: 'include'
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const text = await response.text();
          throw new Error(text || `Request failed with status ${response.status}`);
        }
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      return {
        reply: data?.reply || 'I apologize, but I encountered an issue processing your request.',
        structuredData: data?.structuredData || null,
        metadata: data?.metadata || {}
      };
    } catch (error) {
      console.error('Chat API Error:', error);
      throw new Error(
        error.message || 'Failed to get response from the AI service. Please try again.'
      );
    }
  };

  return { sendMessage };
};

export default useInvestIQChat;