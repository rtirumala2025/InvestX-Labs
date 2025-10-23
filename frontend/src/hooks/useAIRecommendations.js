import { useState, useEffect, useCallback } from 'react';
import { getAIRecommendations, getRecommendationExplanation, getMarketInsights } from '../services/api/aiService';
import { useErrorHandler } from 'react-error-boundary';

/**
 * Custom hook for managing AI investment recommendations
 * @param {Object} userProfile - User's investment profile
 * @param {boolean} [autoFetch=true] - Whether to fetch recommendations on mount
 * @returns {Object} AI recommendation state and methods
 */
export const useAIRecommendations = (userProfile = null, autoFetch = true) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [marketInsights, setMarketInsights] = useState(null);
  const [explanations, setExplanations] = useState({});
  const handleError = useErrorHandler();

  // Fetch AI recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!userProfile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getAIRecommendations(userProfile);
      setRecommendations(data.recommendations || []);
      return data.recommendations || [];
    } catch (err) {
      console.error('Failed to fetch AI recommendations:', err);
      setError('Failed to load recommendations. Please try again later.');
      handleError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userProfile, handleError]);

  // Fetch explanation for a specific recommendation
  const fetchExplanation = useCallback(async (recommendationId) => {
    if (!recommendationId || explanations[recommendationId]) return;
    
    try {
      const explanation = await getRecommendationExplanation(recommendationId);
      setExplanations(prev => ({
        ...prev,
        [recommendationId]: explanation
      }));
      return explanation;
    } catch (err) {
      console.error(`Failed to fetch explanation for recommendation ${recommendationId}:`, err);
      return null;
    }
  }, [explanations]);

  // Fetch market insights
  const fetchMarketInsights = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const insights = await getMarketInsights(filters);
      setMarketInsights(insights);
      return insights;
    } catch (err) {
      console.error('Failed to fetch market insights:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch recommendations when userProfile changes and autoFetch is true
  useEffect(() => {
    if (autoFetch && userProfile) {
      fetchRecommendations();
    }
  }, [userProfile, autoFetch, fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    marketInsights,
    explanations,
    fetchRecommendations,
    fetchExplanation,
    fetchMarketInsights,
    refresh: fetchRecommendations
  };
};

export default useAIRecommendations;
