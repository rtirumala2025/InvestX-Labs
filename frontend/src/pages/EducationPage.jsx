import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';

const EducationPage = () => {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  // Comprehensive learning modules
  const learningModules = [
    {
      id: 1,
      title: 'Investment Fundamentals',
      description: 'Master the basics of investing, from stocks to bonds and everything in between',
      progress: 85,
      level: 'beginner',
      category: 'basics',
      duration: '2-3 hours',
      lessons: 12,
      icon: '📚',
      difficulty: 'Easy',
      rating: 4.9,
      students: 15420,
      topics: ['Stocks', 'Bonds', 'ETFs', 'Risk vs Return'],
      nextLesson: 'Understanding Market Orders',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      title: 'Portfolio Diversification',
      description: 'Learn how to build a well-balanced portfolio that minimizes risk while maximizing returns',
      progress: 60,
      level: 'intermediate',
      category: 'strategy',
      duration: '3-4 hours',
      lessons: 15,
      icon: '📊',
      difficulty: 'Medium',
      rating: 4.8,
      students: 12350,
      topics: ['Asset Allocation', 'Correlation', 'Rebalancing', 'Geographic Diversification'],
      nextLesson: 'Asset Allocation Strategies',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 3,
      title: 'Risk Management',
      description: 'Advanced techniques for managing and mitigating investment risks in volatile markets',
      progress: 40,
      level: 'intermediate',
      category: 'risk',
      duration: '4-5 hours',
      lessons: 18,
      icon: '🛡️',
      difficulty: 'Medium',
      rating: 4.7,
      students: 9870,
      topics: ['Stop Losses', 'Position Sizing', 'Hedging', 'Risk Assessment'],
      nextLesson: 'Setting Stop Loss Orders',
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 4,
      title: 'Technical Analysis',
      description: 'Master chart patterns, indicators, and technical analysis tools for better timing',
      progress: 15,
      level: 'advanced',
      category: 'analysis',
      duration: '6-8 hours',
      lessons: 24,
      icon: '📈',
      difficulty: 'Hard',
      rating: 4.6,
      students: 7650,
      topics: ['Chart Patterns', 'Moving Averages', 'RSI', 'Support & Resistance'],
      nextLesson: 'Introduction to Candlestick Patterns',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 5,
      title: 'Options Trading',
      description: 'Advanced options strategies for income generation and portfolio protection',
      progress: 0,
      level: 'advanced',
      category: 'advanced',
      duration: '8-10 hours',
      lessons: 30,
      icon: '⚡',
      difficulty: 'Expert',
      rating: 4.5,
      students: 5420,
      topics: ['Calls & Puts', 'Spreads', 'Greeks', 'Income Strategies'],
      nextLesson: 'Options Basics',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      id: 6,
      title: 'Cryptocurrency Investing',
      description: 'Navigate the world of digital assets and blockchain technology investments',
      progress: 25,
      level: 'intermediate',
      category: 'crypto',
      duration: '5-6 hours',
      lessons: 20,
      icon: '₿',
      difficulty: 'Medium',
      rating: 4.4,
      students: 11200,
      topics: ['Bitcoin', 'Ethereum', 'DeFi', 'Wallet Security'],
      nextLesson: 'Understanding Blockchain',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  const levels = [
    { id: 'all', name: 'All Levels', icon: '🎯' },
    { id: 'beginner', name: 'Beginner', icon: '🌱' },
    { id: 'intermediate', name: 'Intermediate', icon: '📈' },
    { id: 'advanced', name: 'Advanced', icon: '🚀' }
  ];

  const categories = [
    { id: 'all', name: 'All Topics', icon: '📚' },
    { id: 'basics', name: 'Basics', icon: '🔤' },
    { id: 'strategy', name: 'Strategy', icon: '🎯' },
    { id: 'risk', name: 'Risk Management', icon: '🛡️' },
    { id: 'analysis', name: 'Analysis', icon: '📊' },
    { id: 'advanced', name: 'Advanced', icon: '⚡' },
    { id: 'crypto', name: 'Crypto', icon: '₿' }
  ];

  const achievements = [
    { title: 'First Steps', description: 'Completed your first lesson', icon: '🏆', earned: true },
    { title: 'Knowledge Seeker', description: 'Completed 5 modules', icon: '📖', earned: true },
    { title: 'Portfolio Builder', description: 'Mastered diversification', icon: '📊', earned: true },
    { title: 'Risk Master', description: 'Completed risk management', icon: '🛡️', earned: false },
    { title: 'Technical Analyst', description: 'Mastered technical analysis', icon: '📈', earned: false },
    { title: 'Options Expert', description: 'Completed options trading', icon: '⚡', earned: false }
  ];

  const filteredModules = learningModules.filter(module => {
    const levelMatch = selectedLevel === 'all' || module.level === selectedLevel;
    const categoryMatch = selectedCategory === 'all' || module.category === selectedCategory;
    return levelMatch && categoryMatch;
  });

  const overallProgress = Math.round(learningModules.reduce((acc, module) => acc + module.progress, 0) / learningModules.length);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Enhanced Background Orbs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-r from-blue-500/30 to-purple-500/20 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-32 w-[28rem] h-[28rem] bg-gradient-to-r from-green-400/25 to-emerald-400/15 rounded-full blur-3xl"
        animate={{ y: [0, -25, 0], x: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-orange-400/20 to-pink-400/15 rounded-full blur-3xl"
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
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-green-300 to-orange-300 mb-2">
                Investment Academy 📚
              </h1>
              <p className="text-gray-300 text-lg">Master investing with personalized learning paths and expert guidance</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <GlassButton variant="glass" size="default">
                📊 My Progress
              </GlassButton>
              <GlassButton variant="primary" size="default">
                🎯 Set Learning Goals
              </GlassButton>
            </div>
          </div>
        </motion.div>

        {/* Learning Progress Overview */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-8">
          <GlassCard variant="accent" padding="large" glow={true}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{overallProgress}%</div>
                <div className="text-sm text-white/80">Overall Progress</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">{learningModules.filter(m => m.progress > 0).length}</div>
                <div className="text-sm text-white/80">Modules Started</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">{learningModules.filter(m => m.progress === 100).length}</div>
                <div className="text-sm text-white/80">Modules Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">{achievements.filter(a => a.earned).length}</div>
                <div className="text-sm text-white/80">Achievements Earned</div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-sm text-white/80 mb-2">
                <span>Learning Journey Progress</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-400 via-green-400 to-orange-400 h-3 rounded-full transition-all duration-1000" style={{ width: `${overallProgress}%` }}></div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Filters */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="default" padding="large">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Filter by Level</h3>
                    <div className="flex flex-wrap gap-3">
                      {levels.map((level) => (
                        <button
                          key={level.id}
                          onClick={() => setSelectedLevel(level.id)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            selectedLevel === level.id
                              ? 'bg-blue-500/30 text-white border border-blue-400/30'
                              : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                          }`}
                        >
                          <span>{level.icon}</span>
                          <span className="text-sm font-medium">{level.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Filter by Category</h3>
                    <div className="flex flex-wrap gap-3">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            selectedCategory === category.id
                              ? 'bg-green-500/30 text-white border border-green-400/30'
                              : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                          }`}
                        >
                          <span>{category.icon}</span>
                          <span className="text-sm font-medium">{category.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Learning Modules */}
            <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredModules.map((module, index) => (
                <motion.div key={module.id} variants={fadeIn}>
                  <GlassCard variant="hero" padding="large" shadow="xl" interactive={true} className="h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${module.color}/20 rounded-xl flex items-center justify-center text-3xl border border-white/10`}>
                          {module.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-1">{module.title}</h3>
                          <div className="flex items-center space-x-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              module.level === 'beginner' ? 'bg-green-500/20 text-green-300' :
                              module.level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {module.difficulty}
                            </span>
                            <span className="text-white/70">⭐ {module.rating}</span>
                            <span className="text-white/70">👥 {module.students.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-white/90 mb-4">{module.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-sm text-white/70 mb-1">Duration</div>
                        <div className="text-white font-medium">{module.duration}</div>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-sm text-white/70 mb-1">Lessons</div>
                        <div className="text-white font-medium">{module.lessons}</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-white/80 mb-2">
                        <span>Progress</span>
                        <span>{module.progress}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div className={`bg-gradient-to-r ${module.color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${module.progress}%` }}></div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-white font-medium mb-2">📋 Topics Covered</h4>
                      <div className="flex flex-wrap gap-2">
                        {module.topics.map((topic, i) => (
                          <span key={i} className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {module.progress > 0 && (
                      <div className="mb-4 p-3 bg-blue-500/10 rounded-lg">
                        <div className="text-blue-300 text-sm font-medium mb-1">📍 Next Lesson</div>
                        <div className="text-blue-200 text-sm">{module.nextLesson}</div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <GlassButton variant="primary" size="default" className="flex-1">
                        {module.progress === 0 ? '🚀 Start Learning' : '📖 Continue'}
                      </GlassButton>
                      <GlassButton variant="glass" size="default">
                        📋 Syllabus
                      </GlassButton>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Achievements */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="floating" padding="large" interactive={true}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Achievements</h3>
                  <span className="px-2 py-1 bg-purple-500/30 text-purple-300 text-xs rounded-full">
                    {achievements.filter(a => a.earned).length}/{achievements.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      achievement.earned 
                        ? 'bg-green-500/10 border-green-400/20' 
                        : 'bg-white/5 border-white/10'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div>
                          <h4 className={`text-sm font-medium ${achievement.earned ? 'text-green-300' : 'text-white/70'}`}>
                            {achievement.title}
                          </h4>
                          <p className={`text-xs ${achievement.earned ? 'text-green-400' : 'text-white/50'}`}>
                            {achievement.description}
                          </p>
                        </div>
                        {achievement.earned && <span className="text-green-400">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Learning Streak */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="accent" padding="large" glow={true}>
                <h3 className="text-xl font-semibold text-white mb-4">Learning Streak 🔥</h3>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-orange-400 mb-1">7</div>
                  <div className="text-sm text-white/80">Days in a row</div>
                </div>
                <div className="flex justify-center space-x-2 mb-4">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="w-8 h-8 bg-orange-500/30 rounded-full flex items-center justify-center">
                      <span className="text-orange-300 text-xs">🔥</span>
                    </div>
                  ))}
                </div>
                <div className="text-center text-white/70 text-sm">
                  Keep it up! You're on fire! 🚀
                </div>
              </GlassCard>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="default" padding="large">
                <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
                <div className="space-y-3">
                  <GlassButton variant="glass" className="w-full justify-start">
                    <span className="mr-3">📝</span>
                    Take Quiz
                  </GlassButton>
                  <GlassButton variant="glass" className="w-full justify-start">
                    <span className="mr-3">📊</span>
                    Track Progress
                  </GlassButton>
                  <GlassButton variant="glass" className="w-full justify-start">
                    <span className="mr-3">🎯</span>
                    Set Study Goals
                  </GlassButton>
                  <GlassButton as={Link} to="/chat" variant="glass" className="w-full justify-start">
                    <span className="mr-3">💬</span>
                    Ask AI Tutor
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EducationPage;
