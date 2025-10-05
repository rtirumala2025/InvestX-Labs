import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTool, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import FirebaseDebug from './FirebaseDebug';
import DevTools from './DevTools';

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('devtools');

  const tabs = [
    { id: 'devtools', label: 'Dev Tools', component: <DevTools /> },
    { id: 'firebase', label: 'Firebase', component: <FirebaseDebug /> },
  ];

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FiTool className="w-6 h-6" />
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 w-11/12 max-w-4xl h-2/3 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-2xl z-40 overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 50, x: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="bg-gray-900 bg-opacity-80 px-4 py-3 flex justify-between items-center border-b border-gray-700">
              <div className="flex space-x-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {tabs.find((tab) => tab.id === activeTab)?.component}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DebugPanel;
