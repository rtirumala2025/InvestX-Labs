import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Tooltip from '../ui/Tooltip';

const DemoPortfolioStep = ({ onNext, onBack, userData, setUserData }) => {
  const [selectedDemo, setSelectedDemo] = useState(userData.demoPortfolio || null);

  const demoPortfolios = [
    {
      id: 'tech-focused',
      name: 'Tech Enthusiast',
      description: 'Perfect for those interested in technology and innovation',
      holdings: [
        { symbol: 'AAPL', name: 'Apple Inc.', allocation: 30 },
        { symbol: 'MSFT', name: 'Microsoft', allocation: 25 },
        { symbol: 'GOOGL', name: 'Alphabet', allocation: 20 },
        { symbol: 'TSLA', name: 'Tesla', allocation: 15 },
        { symbol: 'NVDA', name: 'NVIDIA', allocation: 10 }
      ],
      icon: '💻',
      color: 'blue'
    },
    {
      id: 'balanced',
      name: 'Balanced Growth',
      description: 'A well-diversified portfolio for steady growth',
      holdings: [
        { symbol: 'SPY', name: 'S&P 500 ETF', allocation: 40 },
        { symbol: 'VTI', name: 'Total Stock Market', allocation: 30 },
        { symbol: 'BND', name: 'Bond ETF', allocation: 20 },
        { symbol: 'GLD', name: 'Gold ETF', allocation: 10 }
      ],
      icon: '⚖️',
      color: 'green'
    },
    {
      id: 'dividend',
      name: 'Dividend Income',
      description: 'Focus on steady income from dividend-paying stocks',
      holdings: [
        { symbol: 'JNJ', name: 'Johnson & Johnson', allocation: 25 },
        { symbol: 'PG', name: 'Procter & Gamble', allocation: 20 },
        { symbol: 'KO', name: 'Coca-Cola', allocation: 20 },
        { symbol: 'VZ', name: 'Verizon', allocation: 15 },
        { symbol: 'T', name: 'AT&T', allocation: 10 },
        { symbol: 'PEP', name: 'PepsiCo', allocation: 10 }
      ],
      icon: '💰',
      color: 'purple'
    },
    {
      id: 'growth',
      name: 'Aggressive Growth',
      description: 'High-risk, high-reward portfolio for long-term growth',
      holdings: [
        { symbol: 'AMZN', name: 'Amazon', allocation: 25 },
        { symbol: 'META', name: 'Meta Platforms', allocation: 20 },
        { symbol: 'NFLX', name: 'Netflix', allocation: 15 },
        { symbol: 'AMD', name: 'AMD', allocation: 15 },
        { symbol: 'SQ', name: 'Square', allocation: 10 },
        { symbol: 'ROKU', name: 'Roku', allocation: 10 },
        { symbol: 'SHOP', name: 'Shopify', allocation: 5 }
      ],
      icon: '🚀',
      color: 'orange'
    }
  ];

  const handleSelect = (portfolioId) => {
    setSelectedDemo(portfolioId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDemo) {
      const portfolio = demoPortfolios.find(p => p.id === selectedDemo);
      setUserData({ 
        ...userData, 
        demoPortfolio: selectedDemo,
        demoPortfolioData: portfolio
      });
      onNext();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Demo Portfolio</h2>
        <p className="text-gray-600 mb-4">
          Let's set up a sample portfolio so you can see how InvestX works! 
          <Tooltip content="A demo portfolio lets you practice investing with virtual money. You can track performance, learn about different investments, and experiment risk-free!">
            <span className="text-blue-600 cursor-help underline ml-1">What's this?</span>
          </Tooltip>
        </p>
        <p className="text-sm text-gray-500">
          Don't worry, you can always change this later or create your own from scratch.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {demoPortfolios.map((portfolio) => {
            const isSelected = selectedDemo === portfolio.id;
            const colorClasses = {
              blue: 'border-blue-500 bg-blue-50',
              green: 'border-green-500 bg-green-50',
              purple: 'border-purple-500 bg-purple-50',
              orange: 'border-orange-500 bg-orange-50'
            };

            return (
              <motion.div
                key={portfolio.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? `${colorClasses[portfolio.color]} shadow-lg`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => handleSelect(portfolio.id)}
              >
                <div className="flex items-start mb-4">
                  <div className="text-4xl mr-4">{portfolio.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {portfolio.name}
                    </h3>
                    <p className="text-sm text-gray-600">{portfolio.description}</p>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-gray-700 mb-2">Sample Holdings:</p>
                  {portfolio.holdings.slice(0, 3).map((holding, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-gray-600">{holding.symbol}</span>
                      <span className="text-gray-500">{holding.allocation}%</span>
                    </div>
                  ))}
                  {portfolio.holdings.length > 3 && (
                    <p className="text-xs text-gray-500">+{portfolio.holdings.length - 3} more</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {selectedDemo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 p-4 rounded-lg mb-6"
          >
            <p className="text-sm text-blue-900">
              <strong>Great choice!</strong> This demo portfolio will help you learn the basics. 
              You'll be able to track its performance and see how different investments work together.
            </p>
          </motion.div>
        )}

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!selectedDemo}
            className={`px-6 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              selectedDemo
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default DemoPortfolioStep;

