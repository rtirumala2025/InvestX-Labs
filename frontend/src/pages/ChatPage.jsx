import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AIChat from '../components/chat/AIChat';
import { useAuth } from '../contexts/AuthContext';
import { FiMessageSquare, FiSend } from 'react-icons/fi';

const ChatPage = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');

  // Check if user is authenticated
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }
  // Floating orbs animation
  const orbs = [
    { 
      id: 1, 
      size: 400, 
      gradient: 'linear-gradient(135deg, #007AFF, #AF52DE)', 
      position: 'top right', 
      animation: 'float 12s ease-in-out infinite',
    },
    { 
      id: 2, 
      size: 300, 
      gradient: 'linear-gradient(135deg, #32D74B, #007AFF)', 
      position: 'bottom left', 
      animation: 'float 18s ease-in-out 6s infinite',
    },
    { 
      id: 3, 
      size: 350, 
      gradient: 'linear-gradient(135deg, #AF52DE, #FF9500)', 
      position: 'middle right', 
      animation: 'float 15s ease-in-out 3s infinite',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {orbs.map((orb) => (
          <div
            key={orb.id}
            className="absolute rounded-full opacity-30"
            style={{
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              background: orb.gradient,
              filter: 'blur(60px)',
              animation: orb.animation,
              ...(orb.position === 'top right' && { top: '-10%', right: '-5%' }),
              ...(orb.position === 'bottom left' && { bottom: '-10%', left: '-5%' }),
              ...(orb.position === 'middle right' && { top: '30%', right: '-5%' }),
            }}
          />
        ))}
      </div>

      {/* Main container */}
      <motion.div
        className="relative max-w-6xl mx-auto bg-black rounded-2xl shadow-2xl overflow-hidden border border-white/10"
        style={{
          background: '#000000',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {/* Gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <div className="p-6 sm:p-8">
          {/* Header section */}
          <motion.header
            className="relative z-10 mb-10 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
              <svg
                className="w-10 h-10 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h1 className="mb-4 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 sm:text-4xl md:text-5xl">
              InvestX AI Assistant
            </h1>
            <p className="max-w-2xl mx-auto text-base leading-relaxed text-gray-300 sm:text-lg">
              Your intelligent investment companion, providing real-time market insights and personalized financial guidance.
            </p>
          </motion.header>

          {/* Tabs navigation */}
          <motion.nav
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2,
              duration: 0.4,
            }}
          >
            <div className="inline-flex p-1.5 border rounded-xl bg-gray-800/50 border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex items-center px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  activeTab === 'chat'
                    ? 'bg-gray-700/80 text-white shadow-lg shadow-blue-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                }`}
              >
                <FiMessageSquare className="mr-2 text-base" />
                Chat Assistant
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('insights')}
                className={`flex items-center px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  activeTab === 'insights'
                    ? 'bg-gray-700/80 text-white shadow-lg shadow-blue-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                }`}
              >
                <FiSend className="mr-2 text-base" />
                Market Insights
              </button>
            </div>
          </motion.nav>

          {/* Main content area */}
          <div className="relative z-10">
            {activeTab === 'chat' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <AIChat />
              </motion.div>
            ) : (
              <motion.div
                className="px-4 py-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-900/20">
                  <svg
                    className="w-10 h-10 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="mb-3 text-2xl font-semibold text-white">
                  Market Insights
                </h3>
                <p className="max-w-md mx-auto text-gray-300">
                  Coming soon! Get ready for real-time market analysis and investment opportunities.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatPage;
