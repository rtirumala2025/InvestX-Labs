import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiX, FiRefreshCw, FiCopy, FiChevronDown, FiMessageSquare } from 'react-icons/fi';
import ChatInterfaceDemo from '../components/chat/ChatInterfaceDemo';

const ChatPage = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.header 
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              InvestX AI Assistant
            </span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
            Your intelligent investment companion, providing real-time market insights and personalized financial guidance.
          </p>
        </motion.header>

        <div className="relative">
          {/* Main Chat Container */}
          <motion.div 
            className={`bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden transition-all duration-300 ${
              isExpanded ? 'h-[75vh]' : 'h-16'
            }`}
            initial={false}
            animate={{
              height: isExpanded ? '75vh' : '64px',
              boxShadow: isExpanded 
                ? '0 20px 50px -12px rgba(0, 0, 0, 0.25)' 
                : '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Header Bar */}
            <div 
              className="bg-gray-800/80 border-b border-gray-700/50 p-4 flex items-center justify-between cursor-pointer"
              onClick={toggleExpand}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                  <FiMessageSquare className="w-4 h-4" />
                </div>
                <h2 className="text-white font-medium">Finley AI Assistant</h2>
                <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full">
                  Beta
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  className="p-1.5 rounded-full hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add refresh logic here
                  }}
                >
                  <FiRefreshCw className="w-4 h-4" />
                </button>
                <button 
                  className="p-1 rounded-full hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand();
                  }}
                >
                  <FiChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="h-[calc(100%-56px)] flex flex-col"
                >
                  {/* Tabs */}
                  <div className="border-b border-gray-700/50">
                    <div className="flex px-4">
                      <button
                        className={`px-4 py-3 text-sm font-medium transition-colors ${
                          activeTab === 'chat'
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        onClick={() => setActiveTab('chat')}
                      >
                        Chat
                      </button>
                      <button
                        className={`px-4 py-3 text-sm font-medium transition-colors ${
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

                  {/* Chat Interface */}
                  <div className="flex-1 overflow-hidden">
                    {activeTab === 'chat' ? (
                      <ChatInterfaceDemo />
                    ) : (
                      <div className="h-full flex items-center justify-center p-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                              className="w-8 h-8 text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-white mb-1">Market Insights</h3>
                          <p className="text-gray-400 text-sm max-w-md">
                            Coming soon! Get ready for real-time market analysis and investment opportunities.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
