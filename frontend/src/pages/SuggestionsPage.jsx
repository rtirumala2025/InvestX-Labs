import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import SuggestionsList from '../components/ai-suggestions/SuggestionsList';

export default function SuggestionsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [aiInsightExpanded, setAiInsightExpanded] = useState(false);

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  const staggerChildren = {
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Mock AI suggestions data
  const aiSuggestions = [
    {
      id: 1,
      type: 'buy',
      symbol: 'VTI',
      company: 'Vanguard Total Stock Market ETF',
      confidence: 92,
      reason: 'Diversification Opportunity',
      description: 'Your portfolio is heavily weighted in individual tech stocks. Adding VTI would provide broad market exposure and reduce concentration risk.',
      expectedReturn: '+12-15%',
      riskLevel: 'Low',
      timeframe: '1-3 years',
      allocation: '15-20%',
      category: 'diversification',
      aiReasoning: 'Based on your current 65% tech allocation, diversifying with broad market exposure could reduce volatility by 23% while maintaining growth potential.',
      pros: ['Instant diversification', 'Low expense ratio (0.03%)', 'Dividend income'],
      cons: ['Lower growth than individual stocks', 'Market correlation'],
      logo: '📊'
    },
    {
      id: 2,
      type: 'rebalance',
      symbol: 'GOOGL',
      company: 'Alphabet Inc.',
      confidence: 87,
      reason: 'Rebalancing Alert',
      description: 'GOOGL is currently underperforming. Consider reducing position size and reallocating to stronger performers.',
      expectedReturn: 'Risk Reduction',
      riskLevel: 'Medium',
      timeframe: 'Immediate',
      allocation: 'Reduce by 5%',
      category: 'rebalancing',
      aiReasoning: 'GOOGL has underperformed the market by 8% this quarter. Technical indicators suggest continued weakness in the near term.',
      pros: ['Lock in gains from other positions', 'Reduce concentration risk', 'Free up capital'],
      cons: ['Potential tax implications', 'May miss recovery'],
      logo: '🔍'
    },
    {
      id: 3,
      type: 'buy',
      symbol: 'SCHD',
      company: 'Schwab US Dividend Equity ETF',
      confidence: 89,
      reason: 'Income Generation',
      description: 'Add dividend-focused ETF to generate passive income and reduce portfolio volatility.',
      expectedReturn: '+8-10% + 3.5% yield',
      riskLevel: 'Low',
      timeframe: '2-5 years',
      allocation: '10-15%',
      category: 'income',
      aiReasoning: 'Your portfolio lacks income-generating assets. SCHD provides quality dividend stocks with 10-year average yield of 3.2%.',
      pros: ['Steady dividend income', 'Quality companies', 'Lower volatility'],
      cons: ['Lower growth potential', 'Interest rate sensitivity'],
      logo: '💰'
    },
    {
      id: 4,
      type: 'buy',
      symbol: 'QQQ',
      company: 'Invesco QQQ Trust',
      confidence: 85,
      reason: 'Growth Opportunity',
      description: 'Capitalize on AI and technology trends with exposure to NASDAQ-100 companies.',
      expectedReturn: '+15-20%',
      riskLevel: 'Medium-High',
      timeframe: '1-2 years',
      allocation: '8-12%',
      category: 'growth',
      aiReasoning: 'AI revolution is accelerating. QQQ provides exposure to major AI beneficiaries like NVDA, MSFT, and GOOGL with less concentration risk.',
      pros: ['AI/Tech exposure', 'Liquid and tradeable', 'Strong historical performance'],
      cons: ['High volatility', 'Tech concentration', 'Higher expense ratio'],
      logo: '🚀'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Suggestions', count: aiSuggestions.length, icon: '🎯' },
    { id: 'diversification', name: 'Diversification', count: 1, icon: '📊' },
    { id: 'rebalancing', name: 'Rebalancing', count: 1, icon: '⚖️' },
    { id: 'income', name: 'Income', count: 1, icon: '💰' },
    { id: 'growth', name: 'Growth', count: 1, icon: '🚀' }
  ];

  const filteredSuggestions = selectedCategory === 'all' 
    ? aiSuggestions 
    : aiSuggestions.filter(s => s.category === selectedCategory);

  const marketInsights = [
    { title: 'Fed Rate Decision Impact', description: 'Interest rate changes may affect growth stocks', impact: 'Medium', icon: '🏛️' },
    { title: 'AI Sector Momentum', description: 'Artificial intelligence stocks showing strong momentum', impact: 'High', icon: '🤖' },
    { title: 'Dividend Season', description: 'Q4 dividend announcements approaching', impact: 'Low', icon: '💸' },
    { title: 'Earnings Season', description: 'Tech earnings could drive market volatility', impact: 'High', icon: '📈' }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Enhanced Background Orbs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-r from-purple-500/30 to-blue-500/20 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-32 w-[28rem] h-[28rem] bg-gradient-to-r from-orange-400/25 to-pink-400/15 rounded-full blur-3xl"
        animate={{ y: [0, -25, 0], x: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-r from-green-400/20 to-emerald-400/15 rounded-full blur-3xl"
        animate={{ y: [0, 15, 0], x: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut', delay: 5 }}
      />

      <main className="relative z-10 max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          variants={fadeIn} 
          initial="hidden" 
          animate="visible" 
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-blue-300 to-orange-300 mb-2">
                AI Investment Advisor 🤖
              </h1>
              <p className="text-gray-300 text-lg">Personalized recommendations powered by advanced market analysis</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <GlassButton variant="glass" size="default">
                📊 Generate Report
              </GlassButton>
              <GlassButton variant="primary" size="default">
                🔄 Refresh Analysis
              </GlassButton>
            </div>
          </div>
        </motion.div>

        {/* AI Confidence Score */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-8">
          <GlassCard variant="accent" padding="large" glow={true}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">AI Confidence Score</h3>
                <p className="text-white/80">Based on your portfolio analysis and market conditions</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-400 mb-1">89%</div>
                <div className="text-sm text-green-300">High Confidence</div>
              </div>
            </div>
            <div className="mt-4 w-full bg-white/20 rounded-full h-3">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-1000" style={{ width: '89%' }}></div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Category Filter */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="default" padding="large">
                <h3 className="text-xl font-semibold text-white mb-4">Suggestion Categories</h3>
                <div className="flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                        selectedCategory === category.id
                          ? 'bg-blue-500/30 text-white border border-blue-400/30'
                          : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span className="text-sm font-medium">{category.name}</span>
                      <span className="px-2 py-1 bg-white/20 text-xs rounded-full">{category.count}</span>
                    </button>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* AI Suggestions */}
            <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="space-y-6">
              {filteredSuggestions.map((suggestion, index) => (
                <motion.div key={suggestion.id} variants={fadeIn}>
                  <GlassCard variant="hero" padding="large" shadow="xl" interactive={true}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-3xl border border-white/10">
                          {suggestion.logo}
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-white">{suggestion.symbol}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              suggestion.type === 'buy' ? 'bg-green-500/20 text-green-300' :
                              suggestion.type === 'sell' ? 'bg-red-500/20 text-red-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {suggestion.type.toUpperCase()}
                            </span>
                            <div className="flex items-center space-x-1">
                              <span className="text-sm text-white/70">Confidence:</span>
                              <span className="text-sm font-medium text-green-400">{suggestion.confidence}%</span>
                            </div>
                          </div>
                          <p className="text-white/80 text-sm">{suggestion.company}</p>
                          <p className="text-purple-300 text-sm font-medium">{suggestion.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400 mb-1">{suggestion.expectedReturn}</div>
                        <div className="text-sm text-white/70">{suggestion.timeframe}</div>
                      </div>
                    </div>

                    <p className="text-white/90 mb-4">{suggestion.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-sm text-white/70 mb-1">Risk Level</div>
                        <div className="text-white font-medium">{suggestion.riskLevel}</div>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-sm text-white/70 mb-1">Allocation</div>
                        <div className="text-white font-medium">{suggestion.allocation}</div>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-sm text-white/70 mb-1">Timeframe</div>
                        <div className="text-white font-medium">{suggestion.timeframe}</div>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-sm text-white/70 mb-1">Confidence</div>
                        <div className="text-green-400 font-medium">{suggestion.confidence}%</div>
                      </div>
                    </div>

                    <div className="bg-blue-500/10 rounded-lg p-4 mb-4">
                      <h4 className="text-white font-medium mb-2">🤖 AI Analysis</h4>
                      <p className="text-blue-200 text-sm">{suggestion.aiReasoning}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h5 className="text-green-400 font-medium mb-2">✅ Pros</h5>
                        <ul className="space-y-1">
                          {suggestion.pros.map((pro, i) => (
                            <li key={i} className="text-sm text-white/80">• {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-red-400 font-medium mb-2">⚠️ Considerations</h5>
                        <ul className="space-y-1">
                          {suggestion.cons.map((con, i) => (
                            <li key={i} className="text-sm text-white/80">• {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <GlassButton variant="primary" size="default" className="flex-1">
                        {suggestion.type === 'buy' ? '🛒 Add to Watchlist' : '⚖️ Rebalance Now'}
                      </GlassButton>
                      <GlassButton variant="glass" size="default">
                        📊 View Details
                      </GlassButton>
                      <GlassButton variant="ghost" size="default">
                        ❌ Dismiss
                      </GlassButton>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Market Insights */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="floating" padding="large" interactive={true}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Market Insights</h3>
                  <span className="px-2 py-1 bg-green-500/30 text-green-300 text-xs rounded-full">Live</span>
                </div>
                <div className="space-y-3">
                  {marketInsights.map((insight, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg">{insight.icon}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          insight.impact === 'High' ? 'bg-red-500/20 text-red-300' :
                          insight.impact === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {insight.impact}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-white mb-1">{insight.title}</h4>
                      <p className="text-xs text-white/70">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* AI Learning */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="accent" padding="large" glow={true}>
                <h3 className="text-xl font-semibold text-white mb-4">AI Learning Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/90">Portfolio Analysis</span>
                      <span className="text-white">95%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-400 to-blue-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/90">Market Sentiment</span>
                      <span className="text-white">87%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/90">Risk Assessment</span>
                      <span className="text-white">92%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </div>
                <GlassButton as={Link} to="/education" variant="glass" className="w-full mt-4">
                  📚 Learn More About AI
                </GlassButton>
              </GlassCard>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="default" padding="large">
                <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
                <div className="space-y-3">
                  <GlassButton variant="glass" className="w-full justify-start">
                    <span className="mr-3">🎯</span>
                    Set Investment Goals
                  </GlassButton>
                  <GlassButton variant="glass" className="w-full justify-start">
                    <span className="mr-3">📊</span>
                    Risk Assessment
                  </GlassButton>
                  <GlassButton variant="glass" className="w-full justify-start">
                    <span className="mr-3">🔔</span>
                    Set AI Alerts
                  </GlassButton>
                  <GlassButton as={Link} to="/portfolio" variant="glass" className="w-full justify-start">
                    <span className="mr-3">💼</span>
                    View Portfolio
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}