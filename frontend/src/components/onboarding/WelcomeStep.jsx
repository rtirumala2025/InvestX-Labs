import React from 'react';
import { motion } from 'framer-motion';
import Tooltip from '../ui/Tooltip';

const WelcomeStep = ({ onNext }) => {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <span className="text-4xl">🚀</span>
        </motion.div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to InvestX Labs!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your personal investment education and portfolio tracking platform
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Let's get you set up in just a few quick steps. This will only take 2-3 minutes!
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📚</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Learn & Educate</h3>
          <p className="text-gray-600 text-sm">
            Access comprehensive investment education modules and interactive learning content.
            <Tooltip content="Our learning modules cover everything from basics to advanced strategies, with quizzes and real-world examples.">
              <span className="text-blue-600 cursor-help ml-1">ℹ️</span>
            </Tooltip>
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📈</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Portfolio</h3>
          <p className="text-gray-600 text-sm">
            Monitor your investments with real-time data and performance analytics.
            <Tooltip content="Track your portfolio's performance, see gains and losses, and get insights into your investment strategy.">
              <span className="text-blue-600 cursor-help ml-1">ℹ️</span>
            </Tooltip>
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Insights</h3>
          <p className="text-gray-600 text-sm">
            Get personalized investment suggestions powered by advanced AI technology.
            <Tooltip content="Our AI analyzes your portfolio and provides personalized recommendations based on your goals and risk tolerance.">
              <span className="text-blue-600 cursor-help ml-1">ℹ️</span>
            </Tooltip>
          </p>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-8 border border-blue-200/50"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to get started?</h3>
        <p className="text-gray-700">
          Let's set up your profile and investment preferences to personalize your experience.
          We'll create a demo portfolio so you can see how everything works!
        </p>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
      >
        Let's Get Started →
      </motion.button>
    </div>
  );
};

export default WelcomeStep;
