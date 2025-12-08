import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import Modal from '../components/ui/Modal';
import SuggestionsList from '../components/ai-suggestions/SuggestionsList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { SkeletonSuggestion, SkeletonGrid } from '../components/common/SkeletonLoader';
import { useAISuggestions } from '../hooks/useAISuggestions';
import { getMarketInsights, fetchSuggestionLogs } from '../services/api/aiService';
import { useAuth } from '../hooks/useAuth';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerChildren = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const SuggestionsPage = () => {
  const {
    suggestions,
    loading,
    error,
    refresh,
    dismissSuggestion,
    viewSuggestion,
    getExplanation,
    recordFeedback,
    updateConfidence,
    recordInteraction,
  } = useAISuggestions();
  const { currentUser } = useAuth();

  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);

  const [marketInsights, setMarketInsights] = useState([]);
  const [marketInsightsLoading, setMarketInsightsLoading] = useState(false);
  const [marketInsightsError, setMarketInsightsError] = useState(null);

  // Task 14: History tab and comparison view
  const [activeTab, setActiveTab] = useState('current');
  const [suggestionHistory, setSuggestionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const averageConfidence = useMemo(() => {
    if (!suggestions.length) return null;
    const total = suggestions.reduce(
      (sum, suggestion) => sum + (Number(suggestion.confidence) || 0),
      0
    );
    return Math.round(total / suggestions.length);
  }, [suggestions]);

  const confidenceLabel = useMemo(() => {
    if (averageConfidence === null) return 'Waiting for data';
    if (averageConfidence >= 80) return 'High Confidence';
    if (averageConfidence >= 60) return 'Moderate Confidence';
    return 'Developing Confidence';
  }, [averageConfidence]);

  const confidenceWidth = averageConfidence !== null
    ? `${Math.min(Math.max(averageConfidence, 0), 100)}%`
    : '0%';

  const selectedMarketStats = useMemo(() => {
    if (!selectedSuggestion?.marketContext) return null;
    const { currentPrice, changePercent, previousClose, marketSignal } = selectedSuggestion.marketContext;
    const formatValue = (value, digits = 2) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric.toFixed(digits) : '—';
    };

    return {
      currentPrice: formatValue(currentPrice),
      changePercent: formatValue(changePercent),
      previousClose: formatValue(previousClose),
      marketSignal: Number.isFinite(Number(marketSignal)) ? Math.round(Number(marketSignal)) : null,
      changeIsPositive: Number(changePercent) >= 0
    };
  }, [selectedSuggestion?.marketContext]);

  // Task 14: Load suggestion history
  useEffect(() => {
    if (activeTab === 'history' && currentUser?.id) {
      const loadHistory = async () => {
        setHistoryLoading(true);
        try {
          const logs = await fetchSuggestionLogs({ userId: currentUser.id, limit: 50 });
          setSuggestionHistory(logs || []);
        } catch (err) {
          console.error('Error loading suggestion history:', err);
        } finally {
          setHistoryLoading(false);
        }
      };
      loadHistory();
    }
  }, [activeTab, currentUser?.id]);

  useEffect(() => {
    let isMounted = true;
    const loadInsights = async () => {
      setMarketInsightsLoading(true);
      setMarketInsightsError(null);
      try {
        const data = await getMarketInsights({}, { useCache: true });
        if (!isMounted) return;

        const normalize = (payload) => {
          if (!payload) return [];
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload?.insights)) return payload.insights;
          return Object.entries(payload).map(([key, value]) => ({
            title: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            description:
              typeof value === 'string'
                ? value
                : JSON.stringify(value, null, 2),
            impact: 'Medium',
            icon: '📈',
          }));
        };

        const normalized = normalize(data)
          .map((insight) => ({
            title: insight.title || 'AI Insight',
            description:
              insight.description ||
              insight.summary ||
              'Additional context unavailable.',
            impact:
              insight.impact ||
              (insight.score
                ? insight.score > 0.6
                  ? 'High'
                  : insight.score > 0.3
                  ? 'Medium'
                  : 'Low'
                : 'Medium'),
            icon: insight.icon || '🤖',
          }))
          .slice(0, 6);

        setMarketInsights(normalized);
      } catch (err) {
        if (!isMounted) return;
        setMarketInsightsError(err.message || 'Unable to load AI market insights.');
      } finally {
        if (isMounted) {
          setMarketInsightsLoading(false);
        }
      }
    };

    loadInsights();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenSuggestion = async (suggestionId) => {
    const suggestion = suggestions.find((item) => item.id === suggestionId);
    if (!suggestion) return;

    setSelectedSuggestion(suggestion);
    setExplanation(null);
    setIsExplanationLoading(true);

    try {
      await viewSuggestion(suggestionId);
      await recordInteraction(suggestionId, 'open_details');
      const result = await getExplanation(suggestionId);
      setExplanation(result || 'AI explanation not available yet.');
    } catch (err) {
      setExplanation(err.message || 'Unable to load AI explanation.');
    } finally {
      setIsExplanationLoading(false);
    }
  };

  const handleDismiss = async (suggestionId) => {
    await dismissSuggestion(suggestionId);
    if (selectedSuggestion?.id === suggestionId) {
      setSelectedSuggestion(null);
      setExplanation(null);
    }
  };

  const handleCloseModal = () => {
    setSelectedSuggestion(null);
    setExplanation(null);
  };

  const handleFeedback = async (rating) => {
    if (!selectedSuggestion) return;
    await recordFeedback(selectedSuggestion.id, rating);
  };

  const handleConfidenceChange = async (suggestionId, nextConfidence, interactionType) => {
    if (!suggestionId || nextConfidence === undefined) return;
    const result = await updateConfidence(suggestionId, nextConfidence);
    if (result?.success && interactionType) {
      await recordInteraction(suggestionId, interactionType, { nextConfidence });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ 
      background: 'var(--bg-base, #0a0f1a)',
      backgroundImage: 'var(--bg-gradient-primary), var(--bg-pattern-grid), var(--bg-pattern-noise)',
      backgroundSize: '100% 100%, 60px 60px, 400px 400px',
      backgroundAttachment: 'fixed'
    }}>
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-r from-accent-500/30 to-accent-600/20 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-32 w-[28rem] h-[28rem] bg-gradient-to-r from-accent-500/25 to-accent-600/15 rounded-full blur-3xl"
        animate={{ y: [0, -25, 0], x: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-r from-primary-400/20 to-primary-500/15 rounded-full blur-3xl"
        animate={{ y: [0, 15, 0], x: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut', delay: 5 }}
      />

      <main className="relative z-10 w-full max-w-[1920px] mx-auto px-3 lg:px-4 xl:px-6 py-4 lg:py-6">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mb-4 lg:mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-normal tracking-tight text-gradient-hero mb-2">
                AI Investment Advisor 🤖
              </h1>
              <p className="text-neutral-300 text-base lg:text-lg font-sans">
                Personalized recommendations powered by your Supabase portfolio data
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <GlassButton variant="glass" size="default" as={Link} to="/portfolio">
                💼 Review Portfolio
              </GlassButton>
              <GlassButton variant="primary" size="default" onClick={refresh} disabled={loading}>
                {loading ? 'Refreshing…' : '🔄 Refresh Analysis'}
              </GlassButton>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-4 lg:mb-6">
          <GlassCard variant="accent" padding="large" glow>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">AI Confidence Score</h3>
                <p className="text-white/80">
                  Confidence calculated from live portfolio metrics and recent market trends.
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-400 mb-1">
                  {averageConfidence !== null ? `${averageConfidence}%` : '—'}
                </div>
                <div className="text-sm text-green-300">{confidenceLabel}</div>
              </div>
            </div>
            <div className="mt-4 w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-700"
                style={{ width: confidenceWidth }}
              />
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            {/* Task 14: Tab Navigation */}
            <GlassCard variant="default" padding="medium">
              <div className="flex space-x-2 border-b border-white/10 pb-2">
                <button
                  onClick={() => setActiveTab('current')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'current'
                      ? 'bg-blue-500/30 text-white border border-blue-400/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Current Suggestions
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'history'
                      ? 'bg-blue-500/30 text-white border border-blue-400/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  History
                </button>
                {selectedForComparison.length > 0 && (
                  <button
                    onClick={() => setShowComparisonModal(true)}
                    className="ml-auto px-4 py-2 text-sm font-medium rounded-lg bg-purple-500/30 text-white border border-purple-400/30 hover:bg-purple-500/40"
                  >
                    Compare ({selectedForComparison.length})
                  </button>
                )}
              </div>
            </GlassCard>

            {activeTab === 'current' ? (
              <>
                {loading && suggestions.length === 0 ? (
                  <SkeletonGrid count={3} Component={SkeletonSuggestion} />
                ) : (
                  <SuggestionsList
                    suggestions={suggestions}
                    loading={loading}
                    error={error}
                    onDismiss={handleDismiss}
                    onRefresh={refresh}
                    onViewDetails={handleOpenSuggestion}
                    onAdjustConfidence={handleConfidenceChange}
                    onRecordInteraction={recordInteraction}
                    selectedForComparison={selectedForComparison}
                    onToggleComparison={(suggestionId) => {
                      setSelectedForComparison(prev => {
                        if (prev.includes(suggestionId)) {
                          return prev.filter(id => id !== suggestionId);
                        } else {
                          return [...prev, suggestionId].slice(0, 3); // Max 3 for comparison
                        }
                      });
                    }}
                  />
                )}
              </>
            ) : (
              <GlassCard variant="default" padding="large">
                <h3 className="text-xl font-semibold text-white mb-4">Suggestion History</h3>
                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="medium" />
                  </div>
                ) : suggestionHistory.length === 0 ? (
                  <p className="text-white/60 text-center py-8">No suggestion history available yet.</p>
                ) : (
                  <div className="space-y-4">
                    {suggestionHistory.map((log, index) => (
                      <div key={log.id || index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-white/60">
                              {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                            </p>
                            <p className="text-white mt-1">{log.request_type || 'AI Suggestion'}</p>
                            {log.response_data && (
                              <p className="text-sm text-white/70 mt-2">
                                {typeof log.response_data === 'string' 
                                  ? log.response_data.substring(0, 100) + '...'
                                  : JSON.stringify(log.response_data).substring(0, 100) + '...'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}
          </div>

          <div className="space-y-8">
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="floating" padding="large" interactive>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">AI Market Insights</h3>
                  <span className="px-2 py-1 bg-green-500/30 text-green-300 text-xs rounded-full">
                    {marketInsightsLoading ? 'Loading' : 'Live'}
                  </span>
                </div>
                {marketInsightsLoading && (
                  <div className="flex justify-center py-6">
                    <LoadingSpinner size="small" />
                  </div>
                )}
                {!marketInsightsLoading && marketInsightsError && (
                  <div className="text-sm text-red-300">
                    {marketInsightsError}
                  </div>
                )}
                {!marketInsightsLoading && !marketInsightsError && (
                  <div className="space-y-3">
                    {marketInsights.map((insight, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg">{insight.icon}</span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              insight.impact === 'High'
                                ? 'bg-red-500/20 text-red-300'
                                : insight.impact === 'Low'
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}
                          >
                            {insight.impact}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-white mb-1">{insight.title}</h4>
                        <p className="text-xs text-white/70 whitespace-pre-line">
                          {insight.description}
                        </p>
                      </div>
                    ))}
                    {!marketInsights.length && (
                      <p className="text-sm text-white/70">
                        Insights will appear once the AI completes an initial portfolio scan.
                      </p>
                    )}
                  </div>
                )}
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="accent" padding="large" glow>
                <h3 className="text-xl font-semibold text-white mb-4">Grow With AI</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/90">Portfolio Coverage</span>
                      <span className="text-white">
                        {suggestions.length ? `${Math.min(100, suggestions.length * 20)}%` : '—'}
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-400 to-accent-500 h-2 rounded-full"
                        style={{ width: suggestions.length ? `${Math.min(100, suggestions.length * 20)}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
                <GlassButton as={Link} to="/education" variant="glass" className="w-full mt-4">
                  📚 Explore Learning Paths
                </GlassButton>
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="default" padding="large">
                <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
                <div className="space-y-3">
                  <GlassButton variant="glass" className="w-full justify-start" as={Link} to="/diagnostic">
                    <span className="mr-3">🧠</span>
                    Refresh Diagnostic Profile
                  </GlassButton>
                  <GlassButton variant="glass" className="w-full justify-start" as={Link} to="/simulation">
                    <span className="mr-3">🎮</span>
                    Practice In Simulation
                  </GlassButton>
                  <GlassButton variant="glass" className="w-full justify-start" as={Link} to="/portfolio">
                    <span className="mr-3">💼</span>
                    Adjust Portfolio
                  </GlassButton>
                  <GlassButton variant="glass" className="w-full justify-start" as={Link} to="/chat">
                    <span className="mr-3">💬</span>
                    Ask InvestX Assistant
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Task 14: Comparison Modal */}
      <Modal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        size="large"
        title="Compare Suggestions"
      >
        <div className="space-y-4">
          {selectedForComparison.map(suggestionId => {
            const suggestion = suggestions.find(s => s.id === suggestionId);
            if (!suggestion) return null;
            return (
              <GlassCard key={suggestionId} variant="default" padding="large">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{suggestion.symbol || suggestion.title}</h4>
                    <p className="text-sm text-white/70 mt-1">{suggestion.type}</p>
                    <p className="text-sm text-white/60 mt-2">Confidence: {suggestion.confidence}%</p>
                    {suggestion.reason && (
                      <p className="text-sm text-white/70 mt-2">{suggestion.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedForComparison(prev => prev.filter(id => id !== suggestionId))}
                    className="text-white/60 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </GlassCard>
            );
          })}
          {selectedForComparison.length === 0 && (
            <p className="text-white/60 text-center py-8">Select suggestions to compare them side by side.</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(selectedSuggestion)}
        onClose={handleCloseModal}
        size="large"
        title={selectedSuggestion ? `${selectedSuggestion.symbol || selectedSuggestion.title} • AI Insight` : ''}
      >
        {selectedSuggestion && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-white/60 uppercase tracking-wide">Recommendation Type</p>
                <p className="text-lg font-semibold capitalize">{selectedSuggestion.type}</p>
              </div>
              <div>
                <p className="text-sm text-white/60 uppercase tracking-wide">Confidence</p>
                <p className="text-lg font-semibold text-green-300">
                  {Number(selectedSuggestion.confidence) || 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60 uppercase tracking-wide">Timeframe</p>
                <p className="text-lg font-semibold">
                  {selectedSuggestion.timeframe || selectedSuggestion.horizon || 'Medium Term'}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white/80 mb-2">AI Explanation</h4>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-h-[120px]">
                {isExplanationLoading ? (
                  <div className="flex justify-center py-6">
                    <LoadingSpinner size="small" />
                  </div>
                ) : (
                  <>
                    {explanation && typeof explanation === 'object' ? (
                      <div className="space-y-3 text-sm text-white/80">
                        {explanation.headline && (
                          <p className="text-base font-semibold text-white">
                            {explanation.headline}
                          </p>
                        )}
                        {explanation.profileAlignment && (
                          <p>
                            <span className="font-medium text-white/90">Profile match:</span>{' '}
                            {explanation.profileAlignment}
                          </p>
                        )}
                        {explanation.knowledgeBaseSummary && (
                          <p>
                            <span className="font-medium text-white/90">Strategy insight:</span>{' '}
                            {explanation.knowledgeBaseSummary}
                          </p>
                        )}
                        {explanation.learningOpportunity && (
                          <p>
                            <span className="font-medium text-white/90">Learning focus:</span>{' '}
                            {explanation.learningOpportunity}
                          </p>
                        )}
                        {explanation.marketContext && (
                          <p>
                            <span className="font-medium text-white/90">Market context:</span>{' '}
                            {explanation.marketContext}
                          </p>
                        )}
                        {explanation.newsInsight && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm">
                            <p className="font-medium text-white">
                              Latest news • {explanation.newsSentimentLabel || 'neutral'}
                            </p>
                            <p className="text-white/70 mt-1">
                              {explanation.newsInsight}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-line text-white/80">
                        {explanation || 'AI explanation not available yet.'}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {selectedMarketStats && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-white/80 mb-2">Live Market Context</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-white/80">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/50">Current Price</p>
                    <p className="text-base font-semibold text-white">${selectedMarketStats.currentPrice}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/50">Change</p>
                    <p className={`text-base font-semibold ${selectedMarketStats.changeIsPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {selectedMarketStats.changeIsPositive ? '+' : ''}
                      {selectedMarketStats.changePercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/50">Previous Close</p>
                    <p className="text-base font-semibold text-white">${selectedMarketStats.previousClose}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/50">Signal Score</p>
                    <p className="text-base font-semibold text-white">
                      {selectedMarketStats.marketSignal ?? '—'} / 100
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-white/80 mb-2">AI Suggested Actions</h4>
              <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                {(selectedSuggestion.pros || []).map((pro, index) => (
                  <li key={`pro-${index}`}>✅ {pro}</li>
                ))}
                {(selectedSuggestion.cons || []).map((con, index) => (
                  <li key={`con-${index}`}>⚠️ {con}</li>
                ))}
                {!selectedSuggestion.pros?.length && !selectedSuggestion.cons?.length && (
                  <li>AI is still compiling trade-offs for this recommendation.</li>
                )}
              </ul>
            </div>

            {Array.isArray(selectedSuggestion.news?.items) && selectedSuggestion.news.items.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white/80 mb-2">Recent Headlines</h4>
                <div className="space-y-3">
                  {selectedSuggestion.news.items.slice(0, 3).map((item, idx) => (
                    <a
                      key={`${item.url}-${idx}`}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-white/5 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors"
                    >
                      <p className="text-sm font-semibold text-white mb-1">{item.headline}</p>
                      <p className="text-xs text-white/60">
                        {item.source || 'News'} • {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'recent'}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-between gap-3">
              <div className="flex gap-2">
                <GlassButton
                  variant="ghost"
                  onClick={() => handleFeedback('helpful')}
                >
                  👍 Helpful
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  onClick={() => handleFeedback('not_helpful')}
                >
                  👎 Not Helpful
                </GlassButton>
              </div>
              <div className="flex gap-2">
                <GlassButton variant="glass" onClick={() => handleDismiss(selectedSuggestion.id)}>
                  ❌ Dismiss
                </GlassButton>
                <GlassButton variant="primary" onClick={handleCloseModal}>
                  Done
                </GlassButton>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuggestionsPage;
