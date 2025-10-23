import { useState, useEffect, useCallback } from 'react';
import { getMCPContext, updateMCPContext as updateMCPContextApi, getMCPRecommendations, submitMCPFeedback as submitMCPFeedbackApi } from '../services/api/mcpService';
import { useErrorHandler } from 'react-error-boundary';

/**
 * Custom hook for managing MCP (Model-Controller-Presenter) context and recommendations
 * @param {boolean} [autoFetch=true] - Whether to fetch MCP context on mount
 * @returns {Object} MCP context state and methods
 */
export const useMCPContext = (autoFetch = true) => {
  const [context, setContext] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState({});
  const handleError = useErrorHandler();

  // Fetch MCP context
  const fetchMCPContext = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getMCPContext();
      setContext(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch MCP context:', err);
      setError('Failed to load MCP context. Please try again later.');
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Update MCP context
  const updateMCPContext = useCallback(async (updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedContext = await updateMCPContextApi(updates);
      setContext(prev => ({
        ...prev,
        ...updatedContext
      }));
      return updatedContext;
    } catch (err) {
      console.error('Failed to update MCP context:', err);
      setError('Failed to update MCP context. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch MCP recommendations
  const fetchMCPRecommendations = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getMCPRecommendations(options);
      setRecommendations(data.recommendations || []);
      return data.recommendations || [];
    } catch (err) {
      console.error('Failed to fetch MCP recommendations:', err);
      setError('Failed to load recommendations. Please try again later.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit feedback on MCP recommendations
  const submitFeedback = useCallback(async (recommendationId, feedback) => {
    setFeedbackStatus(prev => ({
      ...prev,
      [recommendationId]: 'submitting'
    }));
    
    try {
      const result = await submitMCPFeedbackApi(recommendationId, feedback);
      
      setFeedbackStatus(prev => ({
        ...prev,
        [recommendationId]: 'success'
      }));
      
      return result;
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      
      setFeedbackStatus(prev => ({
        ...prev,
        [recommendationId]: 'error'
      }));
      
      throw err;
    }
  }, []);

  // Auto-fetch MCP context on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch) {
      fetchMCPContext();
    }
  }, [autoFetch, fetchMCPContext]);

  return {
    // State
    context,
    recommendations,
    loading,
    error,
    feedbackStatus,
    
    // Methods
    fetchMCPContext,
    updateMCPContext,
    fetchMCPRecommendations,
    submitFeedback,
    
    // Aliases for convenience
    refresh: fetchMCPContext
  };
};

export default useMCPContext;
