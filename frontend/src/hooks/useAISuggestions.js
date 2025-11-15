import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../contexts/AppContext';
import {
  getAIRecommendations,
  logSuggestionInteraction,
  submitFeedback,
  trackRecommendationInteraction,
  updateSuggestionConfidenceScore
} from '../services/api/aiService';

const mapSuggestion = (suggestion, index = 0) => {
  if (!suggestion) return null;

  return {
    id: suggestion.id || suggestion.recommendation_id || `suggestion-${index}`,
    logId: suggestion.logId || suggestion.log_id || suggestion.metadata?.logId || null,
    type: suggestion.type || suggestion.action || suggestion.category || 'insight',
    symbol: suggestion.symbol || suggestion.ticker || suggestion.asset_symbol,
    company: suggestion.company || suggestion.asset_name || suggestion.title || 'Suggested Asset',
    companyName: suggestion.company || suggestion.asset_name || suggestion.title || 'Suggested Asset',
    confidence: Number(suggestion.confidence || suggestion.confidence_score || 0),
    confidenceBreakdown: suggestion.confidenceBreakdown || suggestion.metadata?.confidenceBreakdown || null,
    profileMatch: suggestion.profileMatch ?? suggestion.profile_match ?? null,
    reason: suggestion.reason || suggestion.summary || 'AI generated insight',
    reasoning: suggestion.reason || suggestion.summary || suggestion.explanation?.profileAlignment || '',
    description: suggestion.description || suggestion.details || suggestion.analysis || '',
    expectedReturn: suggestion.expected_return || suggestion.projected_return || '—',
    riskLevel: suggestion.risk_level || suggestion.riskLevel || 'Moderate',
    timeframe: suggestion.timeframe || suggestion.horizon || 'Medium term',
    allocation: suggestion.allocation || suggestion.recommended_allocation || '—',
    category: suggestion.category || suggestion.segment || 'general',
    aiReasoning: suggestion.ai_reasoning || suggestion.explanation || suggestion.analysis || '',
    pros: suggestion.pros || suggestion.advantages || [],
    cons: suggestion.cons || suggestion.risks || [],
    createdAt: suggestion.created_at || suggestion.createdAt || new Date().toISOString(),
    marketContext: suggestion.marketContext || suggestion.market_context || null,
    currentPrice: suggestion.currentPrice ?? suggestion.marketContext?.currentPrice ?? null,
    priceChange: suggestion.priceChange ?? suggestion.marketContext?.changePercent ?? null,
    news: suggestion.news || {},
    explanation: suggestion.explanation || suggestion.aiReasoning || suggestion.ai_reasoning || null,
    metadata: suggestion.metadata || {},
  };
};

const normalizeSuggestions = (payload) => {
  if (!payload) return [];

  let rawItems = [];

  if (Array.isArray(payload)) {
    rawItems = payload;
  } else if (Array.isArray(payload?.suggestions)) {
    rawItems = payload.suggestions;
  } else if (Array.isArray(payload?.recommendations)) {
    rawItems = payload.recommendations;
  } else if (Array.isArray(payload?.stocks)) {
    rawItems = payload.stocks;
  }

  return rawItems
    .map(mapSuggestion)
    .filter(Boolean);
};

export const useAISuggestions = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const userProfile = useMemo(() => currentUser?.profile || {}, [currentUser]);
  const { queueToast } = useApp();

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [explanations, setExplanations] = useState({});

  const buildProfilePayload = useCallback(() => {
    if (!userId) return null;

    return {
      userId,
      email: currentUser?.email,
      full_name: userProfile?.full_name || currentUser?.user_metadata?.full_name,
      riskTolerance: userProfile?.risk_tolerance || userProfile?.riskTolerance,
      investmentGoals: userProfile?.investment_goals || userProfile?.investmentGoals || [],
      investmentExperience: userProfile?.investment_experience || userProfile?.investmentExperience,
      interests: userProfile?.interests || [],
      virtual_portfolio_value: userProfile?.virtual_portfolio_value || 0,
      metadata: userProfile?.metadata || {}
    };
  }, [currentUser, userId, userProfile]);

  const loadSuggestions = useCallback(async () => {
    if (!userId) {
      setSuggestions([]);
      return;
    }

    const profilePayload = buildProfilePayload();
    if (!profilePayload) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getAIRecommendations(profilePayload, { useCache: true });
      const normalized = normalizeSuggestions(data);
      setSuggestions(normalized);
      if (normalized.length) {
        const explanationMap = normalized.reduce((acc, item) => {
          if (item.explanation) {
            acc[item.id] = item.explanation;
          }
          return acc;
        }, {});
        if (Object.keys(explanationMap).length) {
          setExplanations((prev) => ({ ...prev, ...explanationMap }));
        }
      }
      if (!normalized.length) {
        queueToast('🤖 No AI suggestions available yet. Add portfolio data to receive insights.', 'info');
      }
    } catch (err) {
      console.error('Error loading AI suggestions:', err);
      setError(err.message || 'Unable to load AI suggestions.');
      queueToast(err.message || 'Failed to load AI suggestions.', 'error');
    } finally {
      setLoading(false);
    }
  }, [buildProfilePayload, queueToast, userId]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const refresh = useCallback(() => {
    return loadSuggestions();
  }, [loadSuggestions]);

  const dismissSuggestion = useCallback(
    async (suggestionId) => {
      if (!suggestionId) return;

      const target = suggestions.find((item) => item.id === suggestionId);
      setSuggestions((prev) => prev.filter((item) => item.id !== suggestionId));

      try {
        if (target?.logId) {
          await logSuggestionInteraction({
            logId: target.logId,
            interactionType: 'dismiss',
            userId,
            payload: { suggestionId }
          });
        } else {
          await trackRecommendationInteraction(suggestionId, 'dismiss');
        }
      } catch (err) {
        console.debug?.('useAISuggestions dismiss fallback', err);
      }

      queueToast('🗑️ Suggestion dismissed.', 'info');
    },
    [queueToast, suggestions, userId]
  );

  const viewSuggestion = useCallback(
    async (suggestionId) => {
      if (!suggestionId) return;
      const target = suggestions.find((item) => item.id === suggestionId);
      try {
        if (target?.logId) {
          await logSuggestionInteraction({
            logId: target.logId,
            interactionType: 'view',
            userId,
            payload: { suggestionId }
          });
        } else {
          await trackRecommendationInteraction(suggestionId, 'view');
        }
      } catch (err) {
        console.debug?.('useAISuggestions view fallback', err);
      }
    },
    [suggestions, userId]
  );

  const recordInteraction = useCallback(
    async (suggestionId, interactionType, payload = {}) => {
      if (!suggestionId || !interactionType) return;
      const target = suggestions.find((item) => item.id === suggestionId);
      if (!target?.logId) return;
      try {
        await logSuggestionInteraction({
          logId: target.logId,
          interactionType,
          userId,
          payload: {
            suggestionId,
            ...payload
          }
        });
      } catch (error) {
        console.debug?.('useAISuggestions interaction fallback', error);
      }
    },
    [suggestions, userId]
  );

  const updateConfidence = useCallback(
    async (suggestionId, confidence) => {
      if (!suggestionId || confidence === undefined) return { success: false };
      const target = suggestions.find((item) => item.id === suggestionId);
      if (!target?.logId) {
        queueToast('Unable to update confidence right now. Please try again later.', 'warning');
        return { success: false };
      }

      const safeConfidence = Math.max(0, Math.min(100, Number(confidence)));

      try {
        await updateSuggestionConfidenceScore({
          logId: target.logId,
          confidence: safeConfidence,
          userId
        });

        setSuggestions((prev) =>
          prev.map((item) =>
            item.id === suggestionId ? { ...item, confidence: safeConfidence } : item
          )
        );
        queueToast('Confidence updated for this suggestion.', 'success');
        return { success: true };
      } catch (error) {
        queueToast(error.message || 'Unable to update confidence.', 'error');
        return { success: false, error };
      }
    },
    [queueToast, suggestions, userId]
  );

  const recordFeedback = useCallback(
    async (suggestionId, rating, comment) => {
      if (!suggestionId || !rating) return;
      try {
        await submitFeedback(suggestionId, { rating, comment, userId });
        queueToast('Thanks for your feedback!', 'success');
        await recordInteraction(suggestionId, 'feedback', { rating, comment });
      } catch (err) {
        console.error('Error submitting feedback:', err);
        queueToast(err.message || 'Unable to submit feedback.', 'error');
      }
    },
    [queueToast, recordInteraction, userId]
  );

  const getExplanation = useCallback(
    async (suggestionId) => {
      if (explanations[suggestionId]) {
        return explanations[suggestionId];
      }
      const suggestion = suggestions.find((item) => item.id === suggestionId);
      if (!suggestion) {
        throw new Error('Suggestion not found.');
      }
      const explanation = suggestion.explanation || suggestion.reason || 'AI explanation unavailable.';
      setExplanations((prev) => ({ ...prev, [suggestionId]: explanation }));
      return explanation;
    },
    [explanations, suggestions]
  );

  return {
    suggestions,
    loading,
    error,
    refresh,
    dismissSuggestion,
    viewSuggestion,
    updateConfidence,
    getExplanation,
    recordFeedback,
    recordInteraction,
  };
};
