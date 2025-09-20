import React, { useState } from 'react';

const InterestsStep = ({ onNext, onBack, userData, setUserData }) => {
  const [selectedInterests, setSelectedInterests] = useState(userData.interests || []);

  const investmentCategories = [
    { id: 'stocks', name: 'Individual Stocks', description: 'Company shares and equity investments' },
    { id: 'etfs', name: 'ETFs & Index Funds', description: 'Diversified funds tracking market indices' },
    { id: 'bonds', name: 'Bonds & Fixed Income', description: 'Government and corporate debt securities' },
    { id: 'crypto', name: 'Cryptocurrency', description: 'Digital currencies and blockchain assets' },
    { id: 'reits', name: 'Real Estate (REITs)', description: 'Real estate investment trusts' },
    { id: 'commodities', name: 'Commodities', description: 'Gold, oil, and other raw materials' },
    { id: 'international', name: 'International Markets', description: 'Global and emerging market investments' },
    { id: 'dividend', name: 'Dividend Stocks', description: 'Income-generating dividend-paying stocks' },
    { id: 'growth', name: 'Growth Stocks', description: 'High-growth potential companies' },
    { id: 'value', name: 'Value Investing', description: 'Undervalued stocks with strong fundamentals' },
    { id: 'sector', name: 'Sector Investing', description: 'Technology, healthcare, finance sectors' },
    { id: 'esg', name: 'ESG Investing', description: 'Environmental, social, and governance focused' }
  ];

  const toggleInterest = (interestId) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setUserData({ ...userData, interests: selectedInterests });
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Investment Interests</h2>
        <p className="text-gray-600">Select the investment categories you're interested in learning about</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {investmentCategories.map((category) => (
            <div
              key={category.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedInterests.includes(category.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleInterest(category.id)}
            >
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={selectedInterests.includes(category.id)}
                  onChange={() => toggleInterest(category.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedInterests.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Selected Interests:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedInterests.map(interestId => {
                const category = investmentCategories.find(c => c.id === interestId);
                return (
                  <span
                    key={interestId}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {category.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default InterestsStep;
