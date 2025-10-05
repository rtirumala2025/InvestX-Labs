import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AIChat from '../components/chat/AIChat';
import { useAuth } from '../contexts/AuthContext';
import { FiMessageSquare } from 'react-icons/fi';

const ChatPage = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');

  // Check if user is authenticated
  useEffect(() => {
    if (currentUser) {
      setIsLoading(false);
    } else {
      // Redirect to login if not authenticated
      // You can add a login redirect here if needed
      console.log('User not authenticated');
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.header 
          className="mb-6 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              InvestX AI Assistant
            </span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
            Your intelligent investment companion, providing real-time market insights and personalized financial guidance.
          </p>
        </motion.header>

        {/* Tabs */}
        <div className="border-b border-gray-700/50 mb-6">
          <div className="flex">
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'insights'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('insights')}
            >
              Market Insights
            </button>
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden"
        >
          {activeTab === 'chat' ? (
            <AIChat />
          ) : (
            <div className="h-96 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
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
              <h3 className="text-xl font-semibold text-white mb-2">Market Insights</h3>
              <p className="text-gray-400 max-w-md">
                Coming soon! Get ready for real-time market analysis and investment opportunities.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ChatPage;
