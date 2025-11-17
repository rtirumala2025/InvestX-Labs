/**
 * Custom hook for LLaMA 4 Scout AI integration
 * Manages AI interactions and portfolio-based suggestions
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  getLlamaResponse, 
  getPortfolioAnalysis, 
  getInvestmentSuggestions, 
  getMarketInsights 
} from '../services/ai/llamaService';

export const useLlamaAI = (portfolioData = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);

  console.log('🤖 [useLlamaAI] Hook initialized with portfolio data:', {
    holdingsCount: portfolioData.holdings?.length || 0,
    totalValue: portfolioData.totalValue || 0
  });

  // Clear error when portfolio data changes
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [portfolioData, error]);

  /**
   * Send a message to LLaMA AI
   * @param {string} message - User message
   * @returns {Promise<string>} AI response
   */
  const sendMessage = useCallback(async (message) => {
    console.log('🤖 [useLlamaAI] sendMessage called:', message);
    
    if (!message?.trim()) {
      console.warn('🤖 [useLlamaAI] ⚠️ Empty message provided');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getLlamaResponse(message, portfolioData);
      
      console.log('🤖 [useLlamaAI] ✅ AI response received');
      
      // Update conversation history
      const newConversation = [
        ...conversationHistory,
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: response, timestamp: new Date().toISOString() }
      ];
      
      setConversationHistory(newConversation);
      setLastResponse(response);
      
      return response;
    } catch (err) {
      console.error('🤖 [useLlamaAI] ❌ Error sending message:', err);
      setError(err.message || 'Failed to get AI response');
      return null;
    } finally {
      setLoading(false);
    }
  }, [portfolioData, conversationHistory]);

  /**
   * Get portfolio analysis
   * @returns {Promise<string>} Portfolio analysis
   */
  const analyzePortfolio = useCallback(async () => {
    console.log('🤖 [useLlamaAI] analyzePortfolio called');
    
    setLoading(true);
    setError(null);

    try {
      const analysis = await getPortfolioAnalysis(portfolioData);
      
      console.log('🤖 [useLlamaAI] ✅ Portfolio analysis received');
      
      // Add to conversation history
      const newConversation = [
        ...conversationHistory,
        { 
          role: 'system', 
          content: 'Portfolio Analysis Request', 
          timestamp: new Date().toISOString() 
        },
        { 
          role: 'assistant', 
          content: analysis, 
          timestamp: new Date().toISOString(),
          type: 'portfolio_analysis'
        }
      ];
      
      setConversationHistory(newConversation);
      setLastResponse(analysis);
      
      return analysis;
    } catch (err) {
      console.error('🤖 [useLlamaAI] ❌ Error analyzing portfolio:', err);
      setError(err.message || 'Failed to analyze portfolio');
      return null;
    } finally {
      setLoading(false);
    }
  }, [portfolioData, conversationHistory]);

  /**
   * Get investment suggestions
   * @param {number} amount - Investment amount
   * @returns {Promise<string>} Investment suggestions
   */
  const getSuggestions = useCallback(async (amount) => {
    console.log('🤖 [useLlamaAI] getSuggestions called for amount:', amount);
    
    setLoading(true);
    setError(null);

    try {
      const suggestions = await getInvestmentSuggestions(amount, portfolioData);
      
      console.log('🤖 [useLlamaAI] ✅ Investment suggestions received');
      
      // Add to conversation history
      const newConversation = [
        ...conversationHistory,
        { 
          role: 'system', 
          content: `Investment Suggestions for $${amount}`, 
          timestamp: new Date().toISOString() 
        },
        { 
          role: 'assistant', 
          content: suggestions, 
          timestamp: new Date().toISOString(),
          type: 'investment_suggestions'
        }
      ];
      
      setConversationHistory(newConversation);
      setLastResponse(suggestions);
      
      return suggestions;
    } catch (err) {
      console.error('🤖 [useLlamaAI] ❌ Error getting suggestions:', err);
      setError(err.message || 'Failed to get investment suggestions');
      return null;
    } finally {
      setLoading(false);
    }
  }, [portfolioData, conversationHistory]);

  /**
   * Get market insights
   * @returns {Promise<string>} Market insights
   */
  const getInsights = useCallback(async () => {
    console.log('🤖 [useLlamaAI] getInsights called');
    
    setLoading(true);
    setError(null);

    try {
      const insights = await getMarketInsights(portfolioData);
      
      console.log('🤖 [useLlamaAI] ✅ Market insights received');
      
      // Add to conversation history
      const newConversation = [
        ...conversationHistory,
        { 
          role: 'system', 
          content: 'Market Insights Request', 
          timestamp: new Date().toISOString() 
        },
        { 
          role: 'assistant', 
          content: insights, 
          timestamp: new Date().toISOString(),
          type: 'market_insights'
        }
      ];
      
      setConversationHistory(newConversation);
      setLastResponse(insights);
      
      return insights;
    } catch (err) {
      console.error('🤖 [useLlamaAI] ❌ Error getting insights:', err);
      setError(err.message || 'Failed to get market insights');
      return null;
    } finally {
      setLoading(false);
    }
  }, [portfolioData, conversationHistory]);

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(() => {
    console.log('🤖 [useLlamaAI] Clearing conversation history');
    setConversationHistory([]);
    setLastResponse(null);
    setError(null);
  }, []);

  /**
   * Retry last failed request
   */
  const retry = useCallback(() => {
    console.log('🤖 [useLlamaAI] Retrying last request');
    setError(null);
    // The specific retry logic would depend on what the last action was
    // For now, we just clear the error to allow new requests
  }, []);

  return {
    // State
    loading,
    error,
    lastResponse,
    conversationHistory,
    
    // Actions
    sendMessage,
    analyzePortfolio,
    getSuggestions,
    getInsights,
    clearHistory,
    retry,
    
    // Computed properties
    hasHistory: conversationHistory.length > 0,
    isConfigured: !!process.env.REACT_APP_LLAMA_API_KEY
  };
};
