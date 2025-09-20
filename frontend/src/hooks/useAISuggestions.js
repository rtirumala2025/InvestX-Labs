import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useFirestore } from './useFirestore';
import { generateSuggestions, filterSuggestions, rankSuggestions } from '../services/ai/suggestionEngine';
import { getPortfolioMarketData } from '../services/market/marketData';

/**
 * Custom hook for AI suggestions
 * @returns {Object} AI suggestions data and operations
 */
export const useAISuggestions = () => {
  const { user } = useAuth();
  const { documents: userData } = useFirestore('users', user?.uid);
  const { documents: portfolioData } = useFirestore('portfolios', user?.uid);
  const { documents: suggestions, addDocument, updateDocument } = useFirestore('suggestions');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate new suggestions when user data or portfolio changes
  useEffect(() => {
    if (user && userData && userData.length > 0 && portfolioData && portfolioData.length > 0) {
      generateNewSuggestions();
    }
  }, [user, userData, portfolioData]);

  const generateNewSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const userProfile = userData[0];
      const portfolio = portfolioData[0];
      
      // Get market data for portfolio symbols
      const symbols = portfolio.holdings?.map(holding => holding.symbol) || [];
      const marketData = await getPortfolioMarketData(symbols);
      
      // Generate AI suggestions
      const newSuggestions = await generateSuggestions(userProfile, portfolio, marketData);
      
      // Filter and rank suggestions
      const filteredSuggestions = filterSuggestions(newSuggestions, userProfile);
      const rankedSuggestions = rankSuggestions(filteredSuggestions, userProfile);
      
      // Save suggestions to Firestore
      for (const suggestion of rankedSuggestions) {
        await addDocument({
          ...suggestion,
          userId: user.uid,
          status: 'active'
        });
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error generating suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const dismissSuggestion = async (suggestionId) => {
    try {
      setLoading(true);
      setError(null);
      
      await updateDocument(suggestionId, {
        status: 'dismissed',
        dismissedAt: new Date().toISOString()
      });
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markSuggestionAsViewed = async (suggestionId) => {
    try {
      await updateDocument(suggestionId, {
        viewedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error marking suggestion as viewed:', err);
    }
  };

  const getSuggestionById = (suggestionId) => {
    return suggestions?.find(suggestion => suggestion.id === suggestionId);
  };

  const getActiveSuggestions = () => {
    return suggestions?.filter(suggestion => suggestion.status === 'active') || [];
  };

  const getDismissedSuggestions = () => {
    return suggestions?.filter(suggestion => suggestion.status === 'dismissed') || [];
  };

  const getSuggestionsByType = (type) => {
    return suggestions?.filter(suggestion => suggestion.type === type) || [];
  };

  const getSuggestionsByConfidence = (minConfidence) => {
    return suggestions?.filter(suggestion => suggestion.confidence >= minConfidence) || [];
  };

  return {
    suggestions: getActiveSuggestions(),
    allSuggestions: suggestions || [],
    loading,
    error,
    generateNewSuggestions,
    dismissSuggestion,
    markSuggestionAsViewed,
    getSuggestionById,
    getActiveSuggestions,
    getDismissedSuggestions,
    getSuggestionsByType,
    getSuggestionsByConfidence
  };
};
